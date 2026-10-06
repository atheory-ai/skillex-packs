# Application design — draft

`atheory-ai.polyglot.pattern.application-design` is an unpublished, framework-independent pack for application UI/UX and contract-oriented development. It covers task models, work surfaces, visual hierarchy, controls and language, app shells, forms, interaction state, and platform-specific decisions. It is not a UI component library or an application template.

The pack's architectural preference is explicit capability contracts, command results, events for committed facts, and framework adapters around owned state. These are revisable design opinions. Platform references and accessibility guidance are linked in the relevant skills; this draft has not yet been evaluated against generated applications or usability-tested.

## Small retrieval units

Each skill covers a coherent decision or set of decisions that need to be understood together, with a rule, conditions and tradeoffs, a concrete example, and a verification check. A matching `.test.md` contains a review scenario and expected answer criteria. Those files verify skill structure and guide evaluation; they are not evidence that an application is usable. Targeted discovery and read tests exercise the real released CLI.

Split a skill when its decisions can be retrieved and applied independently. Keep a rule's conditions, example, and verification together so a focused read still supports a sound decision. There is no uniform word limit or requirement to make one file per rule.

For example, selecting an editing surface needs the alternatives—inline editing, inspector, dialog, and destination—in one read. Its save transaction is independently useful knowledge and belongs in `draft-saving.md`. Choosing work surfaces, assigning their shell responsibilities, and adapting their arrangement answer different questions, so they remain distinct skills. A canvas's coordinate and cancellation rules stay with its gesture model because separating them would leave manipulation behavior incomplete.

Descriptions state when the knowledge is useful. Topics identify the question; tags connect related concerns across boundaries. `ui-design` retrieves the eight interface-design skills, while `layout` also connects them to adaptive layout. These groupings support discovery without requiring a combined file or mandatory reading of every related skill.

| Skill | Topic | Discovery tag |
|---|---|---|
| [Model the user task](skills/task-model.md) | `task-model` | `planning` |
| [Choose work surfaces from task relationships](skills/work-surfaces.md) | `work-surfaces` | `ui-design`, `layout` |
| [Make task priority visible](skills/visual-hierarchy.md) | `visual-hierarchy` | `ui-design`, `layout` |
| [Choose density for the work being done](skills/information-density.md) | `information-density` | `ui-design`, `layout` |
| [Make available interactions discoverable](skills/control-affordances.md) | `control-affordances` | `ui-design`, `interaction` |
| [Name subjects and outcomes consistently](skills/labels-vocabulary.md) | `labels-vocabulary` | `ui-design`, `content` |
| [Choose an editing surface by context and interruption](skills/editing-surfaces.md) | `editing-surfaces` | `ui-design`, `layout`, `forms` |
| [Explain why a work surface has no content](skills/empty-states.md) | `empty-states` | `ui-design`, `content`, `feedback` |
| [Reveal secondary detail without hiding task essentials](skills/progressive-disclosure.md) | `progressive-disclosure` | `ui-design`, `content` |
| [Assign stable roles to shell regions](skills/shell-regions.md) | `app-shell` | `shell` |
| [Keep location distinct from selection](skills/navigation-location.md) | `navigation` | `shell` |
| [Make the action target explicit](skills/action-scope.md) | `action-scope` | `shell` |
| [Express needs through application capabilities](skills/capability-contracts.md) | `capabilities` | `contracts` |
| [Distinguish commands from events](skills/commands-events.md) | `commands-events` | `contracts` |
| [Keep hooks at the framework boundary](skills/framework-adapters.md) | `framework-adapters` | `contracts` |
| [Give each state value one owner](skills/state-ownership.md) | `state-ownership` | `state` |
| [Keep inspectors bound to explicit selection](skills/selection-inspectors.md) | `selection` | `interaction` |
| [Choose feedback from intent and context](skills/notification-policy.md) | `notifications` | `feedback` |
| [Validate at useful moments](skills/form-validation.md) | `forms` | `forms` |
| [Define the editing transaction](skills/draft-saving.md) | `drafts` | `forms` |
| [Make operation state explicit](skills/async-operations.md) | `async-operations` | `state` |
| [Design recovery before confirmation](skills/undo-recovery.md) | `recovery` | `interaction` |
| [Make focus transitions deliberate](skills/keyboard-focus.md) | `accessibility` | `interaction` |
| [Adapt task surfaces to available space](skills/adaptive-layout.md) | `adaptive-layout` | `shell` |
| [Define canvas interaction modes](skills/canvas-interaction.md) | `canvas` | `interaction` |
| [Evaluate complete task paths](skills/experience-review.md) | `experience-review` | `evaluation` |
| [Preserve web location and native semantics](skills/web-location.md) | `web-platform` | `platform-web` |
| [Scope desktop work to windows and documents](skills/desktop-windows.md) | `desktop-platform` | `platform-desktop` |
| [Preserve context through mobile transitions](skills/mobile-transitions.md) | `mobile-platform` | `platform-mobile` |

## Deliberate activation

The installed pack activates at repository scope when the consumer creates `application-design.yaml` at its project root. This marker opts the project into design guidance before a framework or implementation exists. Its contents are a human design record; the engine checks the filename, not the fields. Empty configuration does not select a platform or framework.

Start the record with the product's own requirements, for example:

```yaml
platforms: [web]
primary-task: Configure and run a workflow
objects: [workflow, node, run]
assumptions:
  - A failed run retains configuration and supports inspection
```

All skills become discoverable. Platform notes use explicit tags rather than inferring web/desktop/mobile from a programming language. Query `platform-web`, `platform-desktop`, or `platform-mobile` for the relevant notes. Framework implementation adapters can be separate language-specific packs later.

For an installed pack in an opted-in consumer:

```sh
skillex refresh
skillex query --topic notifications --json
skillex query --topic commands-events --json
skillex query --topic editing-surfaces --json
skillex query --tags ui-design --json
skillex query --tags platform-mobile --json
skillex read --ref <ref-from-query> --json
```

`--topic application-design` is intentionally broad and produces bounded discovery. Narrow using the specific topic, tag, search terms, or returned facets before reading. The manifest establishes activation; descriptions and taxonomy establish retrieval. No file instructs an agent to load the entire pack.

## Applying the guidance

Begin with the task model, choose work surfaces from its relationships, and establish shell responsibilities. Use realistic content to decide hierarchy, density, and discoverable controls. Prototype navigation, selection, and one real action before expanding the feature set. As the task encounters editing, empty states, asynchronous operations, or platform transitions, retrieve those decisions specifically. Review a complete success and recovery path, then add a second feature to check that the shell patterns hold.

The eight interface-design skills add the reasoning between task requirements and surface choices. Detailed typography systems, onboarding flows, and deeper platform conventions remain areas for later skills informed by the consumer experiment.

## Development and evaluation

This source pack is developed in `skillex-packs`; its consumer experiment belongs in a separate app repository. Local integration tests materialize the pack into disposable projects without publishing it or bypassing verified-install checks. Run:

```sh
npm run lint:packs
npm test
npm run validate
npm run build:pack -- atheory-ai.polyglot.pattern.application-design --json
```

Build output is local and unsigned. Do not edit the committed signed registry manifest to advertise this draft. Publication requires the normal reviewed source, protected release tag, and signed-manifest workflow.

Use [the evaluation brief](EVALUATION.md) for a controlled with/without-pack experiment. The first milestone is a coherent shell plus one complete workflow and a later feature addition, not a broad catalogue of templates.
