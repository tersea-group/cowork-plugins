# Deskea BDC Generator

Plugin Cowork pour generer des Bons de Commande (BDC) Deskea personnalises a partir des informations client et de la grille tarifaire du deck v5.

## Composants

| Type | Nom | Description |
|------|-----|-------------|
| Commande | `/bdc` | Lance la generation d'un BDC. Usage: `/bdc NomDuClient` |
| Skill | bdc-generator | Se declenche automatiquement quand on parle de BDC, bon de commande, ou devis Deskea |

## Utilisation

### Via la commande /bdc

```
/bdc MutuaSante
```

Claude pose les questions necessaires (adresse, RCS, solutions, volumes) puis genere le .docx.

### Via le langage naturel

Ecrivez simplement :
- "Genere un BDC pour la societe X avec Engage et Evaluate Audio"
- "Prepare le bon de commande Deskea pour 50 utilisateurs Assist expert"
- "Fais-moi un devis Deskea pour Y"

Le skill se declenche automatiquement et guide la collecte d'informations.

## Solutions disponibles

| Solution | Modele tarifaire |
|----------|-----------------|
| Engage | EUR/min (paliers: 10k, 50k, 100k, 200k appels) |
| Qualify | Sur devis |
| Assist Basic | EUR/user/mois (paliers: 10+, 100+, 200+ users) |
| Assist Expert (+ Base de Co) | EUR/user/mois (paliers: 10+, 100+, 200+ users) |
| Evaluate Audio | EUR/min (paliers: 20k, 50k, 100k, 200k min) |
| Evaluate Messages | EUR/msg (paliers: 20k, 50k, 100k, 200k msg) |

## Prerequis

- Node.js (disponible dans l'environnement Cowork)
- Le package npm `docx` doit etre installe (`npm install docx`)

## Document genere

Le BDC genere contient :
- Page principale avec parties, conditions, solutions cochees, synthese financiere et signatures
- Annexe 1 : Grille tarifaire detaillee
- Annexe 2 : Cahier de deploiement
- Annexe 3 : SLA (disponibilite 99,8%, GTR P1/P2/P3)
- Annexe 4 : Fiche de traitement RGPD

Le BDC doit etre envoye accompagne des CGV Deskea v1.1.
