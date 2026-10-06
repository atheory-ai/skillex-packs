# Tests: progressive-disclosure.md

## Validation: Reveal secondary detail without hiding task essentials

Prompt: To simplify a run form, all but its title are placed in Advanced, including a required destination and an invalid retry interval. How should disclosure work?
Success criteria:
  - Keeps task essentials visible or directly discoverable and organizes optional detail into meaningful groups.
  - Communicates active hidden settings and blocking errors, with a reachable correction target.
  - Preserves values on collapse and judges disclosure by task completion rather than appearance alone.
