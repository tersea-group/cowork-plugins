---
description: Generer une grille d'objectifs annuels (Tersea Perf)
allowed-tools: Read, Write, Bash(python*), AskUserQuestion, TodoWrite
argument-hint: [nom-du-collaborateur]
---

Generate an annual objectives grid for the collaborator specified in `$ARGUMENTS`.

First, read the skill instructions:
```
Read ${CLAUDE_PLUGIN_ROOT}/skills/hr-objectifs-annuels/SKILL.md
```

Then read the sample config reference:
```
Read ${CLAUDE_PLUGIN_ROOT}/skills/hr-objectifs-annuels/references/sample_config.json
```

If `$ARGUMENTS` contains a collaborator name, use it as the starting point and ask for the remaining required information (poste, entité, année, manager, axes stratégiques, pondérations).

If `$ARGUMENTS` is empty, start by asking for the collaborator name, then proceed with the full questionnaire as described in the skill.

Follow the complete workflow from the skill to collect information, propose axes, draft objectives, and generate the Excel file.
