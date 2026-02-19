# HR Objectifs Annuels — Plugin Cowork

Génère automatiquement des grilles d'objectifs annuels complètes pour tout collaborateur Tersea/Deskea, avec fichier Excel auto-calculant et pages Notion structurées.

## Composants

| Type | Nom | Description |
|------|-----|-------------|
| Skill | hr-objectifs-annuels | Workflow complet de génération d'objectifs annuels pondérés |

## Fonctionnalités

- Collecte guidée des informations collaborateur (poste, axes, pondérations)
- Proposition d'axes stratégiques adaptés au profil (Tech, BPO, Commercial, Support)
- Rédaction de 7 à 12 objectifs SMART avec KPI, cibles et plans d'action
- Génération Excel professionnelle : tableau des objectifs + zone d'évaluation avec formules auto (note pondérée → % prime)
- Création optionnelle de pages Notion structurées
- Calibrage automatique depuis l'évaluation N-1

## Déclencheurs

- "Créer les objectifs annuels de [nom]"
- "Fixer les objectifs [année] pour [nom/poste]"
- "Grille d'évaluation pour [nom]"
- "Prime variable de [nom]"
- "Entretien annuel [nom]"

## Prérequis

- Python 3 avec `openpyxl` installé (pour la génération Excel via script)

## Structure du plugin

```
hr-objectifs-annuels/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── hr-objectifs-annuels/
│       ├── SKILL.md
│       ├── references/
│       │   └── sample_config.json
│       └── scripts/
│           └── generate_excel.py
└── README.md
```
