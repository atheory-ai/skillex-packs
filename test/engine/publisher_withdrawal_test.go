// Run through the Go test overlay in published-withdrawal.test.mjs.
package verify_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/atheory-ai/skillex/internal/packregistry"
	"github.com/atheory-ai/skillex/internal/verify"
	"github.com/atheory-ai/skillex/test/helpers"
)

// Catalog URLs and archive pins are exactly those emitted by the publisher.
// Route the two known fixture release assets to disk during installation.
type publishedAssets map[string]string

func (assets publishedAssets) RoundTrip(req *http.Request) (*http.Response, error) {
	path, ok := assets[req.URL.String()]
	if !ok {
		return nil, fmt.Errorf("unexpected fixture request %s", req.URL)
	}
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	return &http.Response{StatusCode: http.StatusOK, Header: make(http.Header), Body: f}, nil
}

func TestPublisherWithdrawal(t *testing.T) {
	dir := os.Getenv("SKILLEX_PUBLISHER_FIXTURE")
	read := func(path string) []byte {
		t.Helper()
		data, err := os.ReadFile(filepath.Join(dir, path))
		if err != nil {
			t.Fatal(err)
		}
		return data
	}
	write := func(path string, data []byte) {
		t.Helper()
		if err := os.WriteFile(path, data, 0600); err != nil {
			t.Fatal(err)
		}
	}
	project := t.TempDir()
	// The engine's fixture CLI reads the catalog and bundle from this directory.
	serve := func(stage string) {
		write(filepath.Join(dir, "manifest.json"), read(stage+".json"))
		write(filepath.Join(dir, "manifest.json.bundle"), read(stage+".bundle"))
	}
	var trust map[string]json.RawMessage
	for _, stage := range []string{"before", "after"} {
		root, bundle := verify.SignFixture(t, read(stage+".json"))
		write(filepath.Join(dir, stage+".bundle"), bundle)
		var next map[string]json.RawMessage
		if err := json.Unmarshal(root, &next); err != nil {
			t.Fatal(err)
		}
		if trust == nil {
			trust = next
			continue
		}
		for _, key := range []string{"certificateAuthorities", "ctlogs", "tlogs"} {
			var prior, more []json.RawMessage
			if err := json.Unmarshal(trust[key], &prior); err != nil {
				t.Fatal(err)
			}
			if err := json.Unmarshal(next[key], &more); err != nil {
				t.Fatal(err)
			}
			data, err := json.Marshal(append(prior, more...))
			if err != nil {
				t.Fatal(err)
			}
			trust[key] = data
		}
	}
	data, err := json.Marshal(trust)
	if err != nil {
		t.Fatal(err)
	}
	write(filepath.Join(dir, "roots.json"), data)
	verify.UseFixtureRoot(t, data)
	const url = "https://fixture.invalid/manifest.json"
	write(filepath.Join(project, "skillex.json"), []byte(`{"Version":4,"Rules":[],"registries":[{"name":"fixture","url":"https://fixture.invalid/manifest.json","trustedRoot":"bundled"}]}`))
	write(filepath.Join(project, "package.json"), []byte("{}"))
	serve("before")
	assets := publishedAssets{url: filepath.Join(dir, "manifest.json"), url + ".bundle": filepath.Join(dir, "manifest.json.bundle")}
	var catalog packregistry.Manifest
	if err := json.Unmarshal(read("before.json"), &catalog); err != nil {
		t.Fatal(err)
	}
	previous := http.DefaultTransport
	http.DefaultTransport = assets
	t.Cleanup(func() { http.DefaultTransport = previous })
	for _, entry := range catalog.Packs {
		assets[entry.Tarball.URL] = filepath.Join(dir, "registry", "build", "pack", entry.Name, "v"+entry.Version, filepath.Base(entry.Tarball.URL))
		p, err := packregistry.PrepareForEngine(t.Context(), url, entry.Name, "1.0.0")
		if err != nil {
			t.Fatal(err)
		}
		if err := p.Install(project); err != nil {
			t.Fatal(err)
		}
	}
	binary, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	command := func(args ...string) *exec.Cmd {
		cmd := exec.CommandContext(t.Context(), binary, append([]string{"-test.run=^TestUpdateFixtureCLI$", "--"}, args...)...)
		cmd.Dir = project
		cmd.Env = append(os.Environ(), "SKILLEX_TEST_UPDATE_FIXTURE="+dir, "SKILLEX_NO_UPDATE_CHECK=1")
		return cmd
	}
	run := func(args ...string) []byte {
		t.Helper()
		out, err := command(args...).CombinedOutput()
		if err != nil {
			t.Fatalf("%v: %s (%v)", args, out, err)
		}
		return out
	}
	run("refresh", "--quiet")
	client := helpers.StartMCPCommand(t, command("mcp"))
	query := func() map[string]string {
		t.Helper()
		text, err := client.CallToolText("skillex_query", map[string]any{"topic": "publisher"})
		if err != nil {
			t.Fatal(err)
		}
		var response helpers.QueryResponse
		if err := json.Unmarshal([]byte(text), &response); err != nil {
			t.Fatal(err)
		}
		refs := map[string]string{}
		for _, skill := range response.Results {
			refs[skill.Name] = skill.Ref
		}
		return refs
	}
	before := query()
	if len(before) != 2 || before["keep"] == "" || before["withdraw"] == "" {
		t.Fatal(before)
	}
	serve("after")
	var statuses []packregistry.PackStatus
	if err := json.Unmarshal(run("pack", "check", "--json"), &statuses); err != nil {
		t.Fatal(err)
	}
	if len(statuses) != 2 || statuses[0].Name != "fixture.javascript.tool.keep" || statuses[0].Status != "not_revoked" ||
		statuses[1].Name != "fixture.javascript.tool.withdraw" || statuses[1].Status != "revoked" || statuses[1].Reason != "Fixture withdrawal" {
		t.Fatal(statuses)
	}
	after := query()
	if len(after) != 1 || after["keep"] != before["keep"] {
		t.Fatal(after)
	}
	if _, err := client.CallToolText("skillex_read", map[string]any{"ref": before["withdraw"]}); err == nil {
		t.Fatal("served withdrawn ref")
	}
	if content, err := client.CallToolText("skillex_read", map[string]any{"ref": before["keep"]}); err != nil || !strings.Contains(content, "Guidance for keep.") {
		t.Fatalf("unaffected read: %s (%v)", content, err)
	}
}

func TestPublisherCompatibility(t *testing.T) {
	dir := os.Getenv("SKILLEX_PUBLISHER_FIXTURE")
	path := filepath.Join(dir, "versions.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	root, bundle := verify.SignFixture(t, raw)
	verify.UseFixtureRoot(t, root)
	if err := os.WriteFile(path+".bundle", bundle, 0600); err != nil {
		t.Fatal(err)
	}
	const url = "https://fixture.invalid/versions.json"
	const name = "fixture.javascript.tool.keep"
	assets := publishedAssets{url: path, url + ".bundle": path + ".bundle"}
	var catalog packregistry.Manifest
	if err := json.Unmarshal(raw, &catalog); err != nil {
		t.Fatal(err)
	}
	for _, entry := range catalog.Packs {
		assets[entry.Tarball.URL] = filepath.Join(dir, "registry/build/pack", entry.Name, "v"+entry.Version, filepath.Base(entry.Tarball.URL))
	}
	previous := http.DefaultTransport
	http.DefaultTransport = assets
	t.Cleanup(func() { http.DefaultTransport = previous })
	for _, tc := range []struct{ engine, version, guidance string }{
		{"1.5.0", "1.0.0", "Guidance for keep."},
		{"2.5.0", "2.0.0", "Guidance for keep v2."},
	} {
		t.Run(tc.engine, func(t *testing.T) {
			project := t.TempDir()
			p, err := packregistry.PrepareForEngine(t.Context(), url, name, tc.engine)
			if err != nil {
				t.Fatal(err)
			}
			if err := p.Install(project); err != nil {
				t.Fatal(err)
			}
			locks, err := packregistry.List(project)
			if err != nil || len(locks) != 1 {
				t.Fatalf("installed locks: %v (%v)", locks, err)
			}
			if locks[0].Entry.Version != tc.version || !strings.Contains(string(locks[0].VerifiedFiles["usage.md"]), tc.guidance) {
				t.Fatalf("expected %s and its verified guidance, got %s: %s", tc.version, locks[0].Entry.Version, locks[0].VerifiedFiles["usage.md"])
			}
		})
	}
	// Only the signed manifest and its bundle may be fetched when no range matches.
	http.DefaultTransport = publishedAssets{url: path, url + ".bundle": path + ".bundle"}
	p, err := packregistry.PrepareForEngine(t.Context(), url, name, "3.0.0")
	if p != nil || err == nil || !strings.Contains(err.Error(), "no compatible stable version") {
		t.Fatalf("expected rejection before installation: %v", err)
	}
	project := t.TempDir()
	if err := os.WriteFile(filepath.Join(project, "skillex.json"), []byte(`{"Version":4,"Rules":[],"registries":[{"name":"fixture","url":"https://fixture.invalid/versions.json","trustedRoot":"bundled"}]}`), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "roots.json"), root, 0600); err != nil {
		t.Fatal(err)
	}
	binary, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	cmd := exec.CommandContext(t.Context(), binary, "-test.run=^TestUpdateFixtureCLI$", "--", "pack", "get", name, "--yes")
	cmd.Dir = project
	cmd.Env = append(os.Environ(), "SKILLEX_TEST_UPDATE_FIXTURE="+dir, "SKILLEX_NO_UPDATE_CHECK=1")
	if out, err := cmd.CombinedOutput(); err == nil || !strings.Contains(string(out), "no compatible stable version") {
		t.Fatalf("expected CLI compatibility rejection: %s (%v)", out, err)
	}
	if _, err := os.Stat(filepath.Join(project, ".skillex")); !os.IsNotExist(err) {
		t.Fatalf("unexpected project installation state: %v", err)
	}
}
