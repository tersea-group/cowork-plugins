# GROUPE TERSEA

## Marketplace Interne de Plugins Cowork

*Guide de mise en place pas à pas*

Février 2026 — Version 1.0

---

## Partie 1 — Mise en place par l'administrateur

Cette partie est à réaliser une seule fois par l'administrateur (DSI). Durée estimée : 15 minutes.

### Étape 1 — Créer le repo sur GitHub

Se connecter à github.com avec le compte owner de l'organisation tersea-group.

- Aller sur https://github.com/organizations/tersea-group/repositories/new
- Repository name : `cowork-plugins`
- Description : Marketplace interne de plugins Claude Cowork pour le Groupe Tersea
- Visibility : Public (recommandé) ou Private
- Cocher « Add a README file »
- Cliquer « Create repository »

> *Si le repo est public, aucun compte GitHub ne sera nécessaire pour les utilisateurs. Si privé, chaque utilisateur Cowork devra être membre de l'organisation tersea-group.*

### Étape 2 — Cloner le repo en local

```bash
git clone https://github.com/tersea-group/cowork-plugins.git
cd cowork-plugins
```

### Étape 3 — Copier les fichiers du marketplace

Copier l'intégralité du dossier cowork-plugins que Claude a généré dans le repo cloné. La structure doit être :

```
cowork-plugins/
├── .claude-plugin/
│   └── marketplace.json
├── README.md
└── plugins/
    └── deskea-bdc/
        ├── .claude-plugin/
        │   └── plugin.json
        ├── commands/
        │   └── bdc.md
        ├── skills/
        │   └── bdc-generator/
        │       ├── SKILL.md
        │       ├── scripts/
        │       └── references/
        └── README.md
```

### Étape 4 — Pusher sur GitHub

```bash
git add .
git commit -m "Init marketplace Tersea avec plugin deskea-bdc v1.0"
git push origin main
```

### Étape 5 — Vérifier

Aller sur https://github.com/tersea-group/cowork-plugins et vérifier que les fichiers sont bien présents, notamment le fichier `.claude-plugin/marketplace.json` à la racine.

---

## Partie 2 — Installation par les utilisateurs

Cette partie est à communiquer à tous les collaborateurs utilisant Claude Cowork. Chaque utilisateur réalise ces étapes une seule fois.

### Étape 1 — Ajouter le marketplace Tersea

Dans Cowork, taper la commande suivante :

```
/plugin marketplace add tersea-group/cowork-plugins
```

Cowork télécharge le catalogue de plugins. C'est fait une seule fois.

Pour vérifier que le marketplace a bien été ajouté :

```
/plugin marketplace list
```

### Étape 2 — Installer le plugin BDC

```
/plugin install deskea-bdc@tersea-plugins
```

Le plugin est installé. La commande `/bdc` est désormais disponible et le skill se déclenche automatiquement quand on parle de BDC ou de bon de commande Deskea.

### Étape 3 — Utiliser

Deux façons d'utiliser le plugin :

**Option A — Commande directe**

```
/bdc NomDuClient
```

Claude pose les questions nécessaires et génère le BDC.

**Option B — Langage naturel**

Simplement écrire dans le chat :

- « Génère un BDC pour la société X avec Engage et Evaluate Audio »
- « Prépare le bon de commande Deskea pour 50 utilisateurs Assist expert »
- « Fais-moi un devis Deskea pour Y »

Le skill se déclenche automatiquement.

---

## Partie 3 — Mises à jour et ajout de plugins

### Mettre à jour un plugin existant

L'admin modifie les fichiers dans le repo GitHub et incrémente la version dans `plugin.json`, puis push. Les utilisateurs reçoivent la mise à jour automatiquement au prochain démarrage de Cowork.

Pour forcer une mise à jour immédiate :

```
/plugin marketplace update tersea-plugins
```

### Ajouter un nouveau plugin

Pour ajouter un plugin au marketplace :

1. Créer le dossier du plugin dans `plugins/` (même structure que deskea-bdc)
2. Ajouter l'entrée dans `.claude-plugin/marketplace.json`
3. Pusher sur GitHub

Les utilisateurs peuvent ensuite l'installer :

```
/plugin install nouveau-plugin@tersea-plugins
```

---

## Partie 4 — Déploiement automatique (optionnel)

Pour éviter que chaque utilisateur doive taper les commandes d'installation, l'admin peut pré-configurer le marketplace dans les paramètres de l'organisation Claude (managed settings).

Ajouter dans la configuration de l'organisation :

```json
{
  "extraKnownMarketplaces": {
    "tersea-plugins": {
      "source": {
        "source": "github",
        "repo": "tersea-group/cowork-plugins"
      }
    }
  },
  "enabledPlugins": {
    "deskea-bdc@tersea-plugins": true
  }
}
```

Avec cette configuration, tous les nouveaux utilisateurs Cowork de l'organisation auront automatiquement accès au marketplace et aux plugins activés.

---

## Rappel — Déploiement Claude Chat (en parallèle)

Le marketplace Cowork ne couvre que les utilisateurs de Cowork. Pour que tous les collaborateurs Claude (y compris ceux sur le chat classique) puissent générer des BDC :

- Aller dans claude.ai > Organisation settings > Capabilities
- Vérifier que « Code execution and file creation » est activé
- Vérifier que « Skills » est activé
- Cliquer « Upload skill »
- Uploader le fichier `deskea-bdc-skill.zip`
- Choisir « Enabled by default »

Les deux canaux (Cowork + Chat) fonctionnent en parallèle. Le plugin Cowork est plus riche (commande `/bdc`, accès fichiers), le skill Chat est plus simple mais accessible à tous.

---

## Résumé

| Action | Qui | Fréquence |
|---|---|---|
| Créer le repo `tersea-group/cowork-plugins` | Admin (DSI) | 1 fois |
| Pusher les plugins dans le repo | Admin (DSI) | À chaque MAJ |
| Upload skill `.zip` dans Claude Admin | Admin (Owner) | À chaque MAJ |
| `/plugin marketplace add tersea-group/cowork-plugins` | Chaque utilisateur | 1 fois |
| `/plugin install deskea-bdc@tersea-plugins` | Chaque utilisateur | 1 fois |
