---
name: bdc-generator
description: >
  This skill generates Deskea order forms (Bons de Commande) with pre-filled client information
  and default pricing from the Deskea pitch deck v5. Use this skill whenever the user mentions
  "BDC", "bon de commande", "devis Deskea", "commande Deskea", or asks to prepare a commercial
  proposal for any Deskea solution (Engage, Qualify, Assist, Evaluate). Also triggers on phrases
  like "prepare un BDC pour", "genere le bon de commande", "fais-moi un BDC", "redige le bon
  de commande pour Deskea", or any mention of creating an order for a Deskea service.
version: 1.0.0
---

# Deskea BDC Generator

Generate a completed Bon de Commande (BDC) for Deskea solutions, ready for client signature.

## Workflow

### Step 1: Collect client information

Use the AskUserQuestion tool to gather the required information. Ask in batches to avoid overwhelming the user. Start with:

**Batch 1 — Client identity:**
- Raison sociale du client
- Adresse complete
- Numero RCS
- Representant (nom + fonction)

**Batch 2 — Contact & contrat:**
- Contact principal : nom, email, telephone
- Date d'effet souhaitee (default: date du jour)
- Duree d'engagement (default: 12 mois)

**Batch 3 — Solutions:**
Ask which solutions le client souhaite activer. Present them clearly:

| Solution | Description courte |
|----------|-------------------|
| **Engage** | Voicebot/SMSbot - automatisation 24/7 |
| **Qualify** | Routage IA des emails entrants |
| **Assist** (basic) | Assistant redaction IA pour conseillers |
| **Assist + Base de Co** | Assist + chatbot metier sur donnees internes |
| **Evaluate Audio** | Analyse conversationnelle audio (transcription, QM, voix du client) |
| **Evaluate Messages** | Analyse conversationnelle ecrite (email, chat, reseaux sociaux) |

**Batch 4 — Volumes et prix:**
For each selected solution, ask the estimated monthly volume. Then propose the corresponding price tier from the default pricing grid below. The user can adjust if needed.

### Step 2: Apply default pricing

Read the detailed pricing reference:
```
Read ${CLAUDE_PLUGIN_ROOT}/skills/bdc-generator/references/pricing.md
```

Use these volume-based tiers to calculate unit prices and totals. Always show the calculation to the user for validation before generating.

### Step 3: Generate the BDC

Build a JSON config object following the schema documented in:
```
Read ${CLAUDE_PLUGIN_ROOT}/skills/bdc-generator/references/config-schema.md
```

Then run the generation script:
```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/bdc-generator/scripts/generate_bdc_specific.js '<JSON_CONFIG>'
```

The script accepts either inline JSON or a path to a .json file.

### Step 4: Deliver

Share the generated .docx file with the user. Remind them that the BDC must be envoye accompagne des CGV Deskea v1.1.

## Quick generation

If the user provides all information upfront (e.g. "BDC pour Societe X, 50 users Assist expert, 20k min Evaluate Audio"), skip the interactive questions and go straight to config building + generation. Fill in defaults for any missing fields.

## Important rules

- All prices are HT (hors taxes)
- The BDC reference follows format BDC-DESK-YYYY-NNN
- The generated BDC references CGV Deskea v1.1
- Non-selected solutions appear greyed out in the document
- Setup fees are one-time only (year 1)
- From year 2, only the recurring subscription applies
