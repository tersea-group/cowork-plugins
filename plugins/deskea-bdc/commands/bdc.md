---
description: Generer un Bon de Commande Deskea
allowed-tools: Read, Write, Bash(node:*), AskUserQuestion, TodoWrite
argument-hint: [nom-du-client]
---

Generate a Deskea Bon de Commande (BDC) for the client specified in `$ARGUMENTS`.

First, read the skill instructions:
```
Read ${CLAUDE_PLUGIN_ROOT}/skills/bdc-generator/SKILL.md
```

Then read the pricing reference:
```
Read ${CLAUDE_PLUGIN_ROOT}/skills/bdc-generator/references/pricing.md
```

And the config schema:
```
Read ${CLAUDE_PLUGIN_ROOT}/skills/bdc-generator/references/config-schema.md
```

If `$ARGUMENTS` contains a client name, use it as the starting point and ask for the remaining required information (adresse, RCS, representant, contact, solutions, volumes).

If `$ARGUMENTS` is empty, start by asking for the client name, then proceed with the full questionnaire as described in the skill.

Follow the complete workflow from the skill to collect information, calculate pricing, and generate the .docx file.
