---
name: hr-objectifs-annuels
description: >
  Génère des grilles d'objectifs annuels pondérés pour tout collaborateur Tersea/Deskea,
  avec feuille Excel auto-calculante (note globale → prime) et pages Notion structurées.
  Utilisable pour tout poste : CPO, dev, ops, commerce, RH, etc.
  Cette skill doit être utilisée quand l'utilisateur demande de créer des "objectifs annuels",
  une "grille d'évaluation", "objectifs [nom]", "fixer les objectifs", "prime variable",
  ou préparer un "entretien annuel".
version: 0.1.0
---

# Générateur d'Objectifs Annuels & Grille d'Évaluation

## Objectif

Produire pour **tout collaborateur** une grille complète d'objectifs annuels :
1. **Feuille Excel** professionnelle avec calcul automatique de la note pondérée → % d'atteinte pour prime variable
2. **Pages Notion** structurées prêtes à intégrer dans une base de données RH existante

**Contexte** : Tersea (BPO, 1500 collaborateurs) et Deskea (startup IA, 30 personnes). S'adapte à tout poste et tout niveau hiérarchique.

---

## Informations à Collecter

Avant de générer, COLLECTER ces informations (poser les questions via AskUserQuestion si manquantes) :

### Obligatoires
| Information | Exemple |
|---|---|
| **Nom complet** | Nicolas Roux |
| **Poste / Titre** | CPO |
| **Entité** | Deskea / Tersea / Autre |
| **Année d'évaluation** | 2026 |
| **Manager évaluateur** | Sébastien (DG) |
| **Taille équipe managée** | 1 UX designer |
| **Axes stratégiques** (3-5 axes avec pondération = 100%) | Stratégie 20%, Management 10%, Opérationnel 35%, Transversal 35% |

### Optionnels (améliorent la qualité)
| Information | Usage |
|---|---|
| **Évaluation N-1** (note, points forts, axes d'amélioration) | Calibrer les objectifs sur les lacunes |
| **Roadmap / projets clés** de l'année | Objectifs jalons concrets |
| **Base Notion cible** (URL ou ID) | Création directe des pages |
| **Barème de prime** personnalisé | Intégré dans l'Excel |

---

## Structure d'un Objectif

Chaque objectif DOIT contenir TOUS ces champs :

- Numéro (#)
- Intitulé (verbe d'action + résultat attendu)
- Axe stratégique (parmi les axes définis)
- Catégorie métier : Innovation & R&D | Excellence Opérationnelle | Croissance Commerciale | Développement RH & Talent | Satisfaction Client
- Type : Quantitatif | Qualitatif
- Poids (%) — somme des poids de tous les objectifs = 100%
- KPI mesurables + flag si l'indicateur n'existe pas encore (avec deadline de mise en place)
- Cible quantitative (chiffre si applicable)
- Cible qualitative (description détaillée du niveau attendu)
- Seuil minimum (en dessous = objectif non atteint)
- Mode de calcul : Cumul | Pourcentage | Moyenne | Autre
- Période d'évaluation : Mensuel | Trimestriel | Semestriel | Annuel
- Échéance
- Individuel / Collectif
- Plan d'action détaillé (étapes numérotées)

---

## Règles de Construction

### Pondération
- **3 à 5 axes stratégiques**, chacun avec un poids en %
- Somme des poids des axes = 100%
- Chaque axe contient 1 à 4 objectifs
- Somme des poids de TOUS les objectifs = 100%
- Calibrer les poids selon les priorités : un axe à améliorer → poids plus élevé

### Qualité des objectifs
- **SMART** : Spécifique, Mesurable, Atteignable, Réaliste, Temporel
- **Verbe d'action** en début d'intitulé (Réduire, Structurer, Livrer, Piloter, Coordonner…)
- **Posture attendue explicite** si axe d'amélioration (ex : "force de proposition", "piloter et s'imposer")
- **Pas de KPI sans moyen de mesure** : si l'indicateur n'existe pas → flag avec date de mise en place
- **Ratio objectifs individuels/collectifs** adapté au poste (manager = plus de collectifs)

### Calibrage depuis l'évaluation N-1
Si une évaluation précédente est fournie :
- Axes avec note < 3/5 → pondération renforcée
- Chaque axe d'amélioration → au moins 1 objectif ciblé
- Points forts → maintenir avec objectifs d'excellence (poids plus léger)

### Nombre d'objectifs
- **Cible : 7 à 12 objectifs** (ni trop peu = pas assez granulaire, ni trop = dilution)
- Minimum 2 objectifs par axe majeur (> 20%)
- 1 objectif suffit pour un axe mineur (≤ 10%)

---

## Génération Excel

### Option 1 : Script Python (recommandé)

Utiliser le script `${CLAUDE_PLUGIN_ROOT}/skills/hr-objectifs-annuels/scripts/generate_excel.py` :

1. Construire le JSON de configuration conforme au format `references/sample_config.json`
2. Sauvegarder le JSON en fichier temporaire
3. Exécuter : `python ${CLAUDE_PLUGIN_ROOT}/skills/hr-objectifs-annuels/scripts/generate_excel.py --config config.json --output Objectifs_ANNEE_NOM.xlsx`

### Option 2 : Génération directe openpyxl

Si le script n'est pas utilisable, générer manuellement avec openpyxl en respectant la spec suivante :

**Zone 1 — Tableau des objectifs (colonnes A à N)**

| Col | Contenu | Largeur |
|---|---|---|
| A | # | 4 |
| B | Objectif | 42 |
| C | Axe stratégique | 17 |
| D | Type (Quanti/Quali) | 11 |
| E | Poids (%) | 7 |
| F | KPI + flags | 36 |
| G | Cible quanti. | 9 |
| H | Cible qualitative | 45 |
| I | Seuil minimum | 9 |
| J | Mode calcul | 11 |
| K | Période éval. | 11 |
| L | Échéance | 11 |
| M | Ind./Coll. | 10 |
| N | Plan d'action | 42 |

**Zone 2 — Évaluation (colonnes P à T, séparées par colonne O vide)**

| Col | Contenu | Type | Style |
|---|---|---|---|
| P | Résultat atteint (saisie libre) | INPUT | Fond jaune #FFF9C4, texte bleu bold |
| Q | Commentaire évaluation | INPUT | Fond jaune, texte bleu bold |
| R | Note /5 (0 à 5, validée) | INPUT | Fond jaune, validation décimale 0-5 |
| S | Note pondérée = R × E | FORMULE | Fond vert #E8F5E9, format 0.00 |
| T | % Atteinte = R / 5 | FORMULE | Fond vert, format 0% |

**Zone 3 — Synthèse** : Note globale (SUM pondérée), % Prime (note/5), barème indicatif.

**Styles** : En-têtes #2D3436 blanc, lignes d'axe colorées, Arial 9/10, freeze panes A2, hauteur lignes objectifs ~85px, data validation colonne R (0-5).

### Barème de prime par défaut
| % Atteinte | Niveau | Prime |
|---|---|---|
| < 40% | Insatisfaisant | 0% prime |
| 40-59% | Partiellement satisfaisant | 50% prime |
| 60-79% | Satisfaisant | 100% prime |
| 80-89% | Très satisfaisant | 120% prime |
| ≥ 90% | Exceptionnel | 150% prime |

Nommer le fichier : `Objectifs_[ANNEE]_[NOM]_[PRENOM].xlsx`

---

## Format Notion (si demandé)

Si une base Notion est fournie, créer les objectifs comme pages avec les propriétés : Nom (title), Axe stratégique (Select), Catégorie (Select), Type d'objectif (Select), Pondération (Number %), Période d'évaluation (Select), Échéance (Date), Individuel/Collectif (Select).

Contenu de chaque page : KPI & Mesure, Cibles (quanti + quali + seuil + mode), Plan d'action numéroté. Lier à la page collaborateur si fournie.

---

## Workflow

1. COLLECTER les informations (AskUserQuestion pour les manquantes)
2. Si évaluation N-1 fournie → ANALYSER et calibrer les pondérations
3. PROPOSER les axes + pondérations → validation utilisateur
4. RÉDIGER les objectifs (7-12) avec tous les champs
5. VALIDER avec l'utilisateur (ajustements possibles)
6. GÉNÉRER le fichier Excel via le script Python
7. Si Notion demandé → CRÉER les pages
8. LIVRER : Excel + confirmation Notion + récap (nb objectifs, pondération, KPI à créer)

### Raccourci
Si l'utilisateur fournit toutes les infos d'un coup → passer directement aux étapes 6-7-8.

---

## Profils Types

Pour proposer des axes pertinents selon le poste :

**Tech / Produit** : Stratégie produit, Management, Ops (time-to-market), Coordination transversale
**Opérations BPO** : Performance opérationnelle (SLA/QS), Management équipe, Satisfaction client, Amélioration continue
**Commercial** : Acquisition, Développement portefeuille, Satisfaction client, Pipe & forecast
**Support (RH, Finance)** : Cœur de métier, Pilotage & Reporting, Projets & Amélioration, Communication transversale

---

## Pièges à Éviter

1. **Pas de KPI fantôme** : si l'indicateur n'existe pas → flag + deadline création
2. **Pas d'objectif sans plan d'action** : chaque objectif = étapes concrètes
3. **Pas de pondération uniforme** : 10% partout = pas de priorisation
4. **Pas de cible vague** : "améliorer la qualité" → "taux de conformité PRD > 95%"
5. **Pas de seuil = cible** : le seuil est toujours inférieur à la cible
6. **Vérifier somme poids = 100%** avant génération
7. **Adapter au contexte** : startup ≠ grand groupe, junior ≠ senior, manager ≠ IC

## Ressources additionnelles

- **`references/sample_config.json`** — Exemple complet de configuration JSON pour le script
- **`scripts/generate_excel.py`** — Script Python autonome de génération Excel
