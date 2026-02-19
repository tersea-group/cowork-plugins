# Config Schema for BDC Generation

The JSON config passed to `generate_bdc_specific.js` must follow this structure:

```json
{
  "bdcRef": "BDC-DESK-2026-001",
  "client": {
    "raisonSociale": "Nom de la societe",
    "adresse": "Adresse complete",
    "rcs": "RCS Paris 123 456 789",
    "representant": "Jean Dupont, Directeur General"
  },
  "deskea": {
    "raisonSociale": "Groupe Tersea SAS",
    "adresse": "1 Chemin de la Loge - 31100 Toulouse",
    "rcs": "RCS Toulouse 443 061 841",
    "representant": "Sebastien Monnier, President"
  },
  "contact": {
    "nom": "Jean Dupont",
    "email": "jean.dupont@client.com",
    "tel": "+33 6 12 34 56 78"
  },
  "contrat": {
    "dateEffet": "01/03/2026",
    "duree": "12 mois",
    "hebergement": "Cloud securise en Europe (OVHcloud), conforme RGPD"
  },
  "solutions": {
    "engage": {
      "active": true,
      "volume": "15 000 appels/mois",
      "prixUnitaire": "0.22 EUR/min",
      "totalMensuel": "3 300 EUR",
      "setup": 3000
    },
    "qualify": {
      "active": false
    },
    "assist": {
      "active": true,
      "type": "expert",
      "volume": "50 utilisateurs",
      "prixUnitaire": "25 EUR/utilisateur/mois",
      "totalMensuel": "1 250 EUR",
      "setup": 1000
    },
    "evaluateAudio": {
      "active": true,
      "volume": "30 000 min/mois",
      "prixUnitaire": "0.07 EUR/min",
      "totalMensuel": "2 100 EUR",
      "setup": 3000
    },
    "evaluateMessages": {
      "active": false
    }
  },
  "financier": {
    "abonnementAnnuelHT": "79 800 EUR",
    "deploiementHT": "7 000 EUR",
    "totalAn1HT": "86 800 EUR",
    "recurrentAn2HT": "79 800 EUR",
    "facturation": "mensuelle a terme a echoir",
    "paiement": "30 jours date de facture, virement ou prelevement SEPA"
  },
  "outputPath": "/path/to/output/BDC-DESK-2026-001.docx"
}
```

## Field descriptions

### client
All client identification fields. `representant` should include name and title.

### deskea
Pre-filled with Groupe Tersea defaults. Can be overridden if needed.

### solutions
Each solution has:
- `active`: boolean - whether the solution is selected
- `volume`: string - estimated monthly volume
- `prixUnitaire`: string - unit price with unit
- `totalMensuel`: string - monthly total
- `setup`: number - one-time setup fee in EUR (0 if none)

For `assist`, add `type`: "basic" or "expert" (expert includes Base de Connaissances).

### financier
Summary calculations. The script computes these from the solutions if not provided.
