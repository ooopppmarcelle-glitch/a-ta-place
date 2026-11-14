# À TA PLACE

**Les histoires sont vraies. Les décisions sont à vous.**

À TA PLACE est une application sociale de dilemmes du quotidien. Une personne raconte une situation, la communauté vote et l'auteur peut ensuite revenir raconter la suite.

## Première version

- Interface responsive pensée pour Android et ordinateur
- Application web progressive (PWA) installable
- Fil de situations avec filtres
- Publication locale de nouveaux dilemmes
- Votes et résultats visibles après participation
- Partage via les fonctions natives du téléphone
- Mise en cache des ressources principales pour une ouverture hors connexion

## Lancer le projet

Le projet est volontairement sans dépendance ni compilation.

1. Héberger le dépôt sur un serveur HTTPS (Netlify convient).
2. Ouvrir l'URL sur Android ou ordinateur.
3. Utiliser « Installer l'application » ou « Ajouter à l'écran d'accueil ».

Pour tester localement, servir le dossier avec un serveur HTTP local. Le service worker ne fonctionne pas depuis une ouverture directe en `file://`.

## Limites actuelles

Cette première version est un prototype front-end : les publications et votes sont stockés dans le navigateur de l'utilisateur. Ils ne sont pas encore partagés entre appareils. Les comptes, la base de données, la modération serveur et les notifications seront ajoutés dans les prochaines étapes.

## Stack

HTML, CSS, JavaScript natifs, Web App Manifest et Service Worker.

## Licence

À définir avant une diffusion publique plus large.
