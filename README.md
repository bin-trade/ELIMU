# Portail client — paquet GitHub Pages

Ce dossier est la copie nettoyée prête à envoyer à la racine du dépôt GitHub Pages de l’établissement. La source éditable se trouve dans `../PORTALS/PORTAL CLIENT`.

## Contenu

- `index.html` : accueil et accès aux espaces ;
- `parent/` : portail parents ;
- `professeur/` : portail professeur ;
- `proprietaire/` : portail direction ;
- `config.js` : configuration centrale commune aux trois portails ;
- `assets/school-logo.png` : logo de l’établissement ;
- `assets/static/` : assets fixes et icônes communes.

## Publication

Envoyer le contenu de ce dossier à la racine de la branche `main`, puis dans GitHub : **Settings → Pages → Deploy from a branch → main → / (root)**.

Adresses attendues :

```text
https://<compte>.github.io/<depot>/
https://<compte>.github.io/<depot>/parent/
https://<compte>.github.io/<depot>/professeur/
https://<compte>.github.io/<depot>/proprietaire/
```

## Test local

```powershell
py -m http.server 5502 --directory "GITHUB_PORTAL_CLIENT"
```

Ouvrir `http://127.0.0.1:5502/`. Les trois portails doivent utiliser la même URL `/exec` d’établissement, définie une seule fois dans `config.js`. Ne jamais mettre dans ce dossier une base SQLite, un export d’élèves, un mot de passe ou une clé API privée.

Le portail parent propose **Mémoriser cet appareil pendant 30 jours**. Cette option conserve un jeton signé dans le navigateur et restaure directement la session parent à la prochaine ouverture. Le bouton **Quitter** efface cette session ; il faut la désactiver sur un appareil partagé.
