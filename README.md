# À TA PLACE

**Les histoires sont vraies. Les décisions sont à vous.**

À TA PLACE est une PWA sociale autour des dilemmes du quotidien : une personne raconte une situation, la communauté donne son avis et l'auteur peut revenir partager la suite.

## Fonctionnalités présentes dans le dépôt

- Interface responsive Android et ordinateur, avec thème sombre et accents néon
- Application web progressive (PWA) installable
- Fil de situations de démonstration, publication et votes locaux
- Centre de notifications intégré au design de l'application
- Parcours de création de compte et connexion par e-mail avec Firebase Authentication
- Profils privés dans Cloud Firestore et réservation de noms d'utilisateur
- Préparation Firebase Cloud Messaging pour les notifications push
- Partage via les fonctions natives du téléphone
- Service worker pour la mise en cache et les notifications en arrière-plan

## Configuration Firebase obligatoire

Le code est préparé, mais les services Firebase ne fonctionneront pas tant que les valeurs de projet ne sont pas renseignées.

1. Créer un projet dans la console Firebase.
2. Ajouter une application Web et copier sa configuration dans `firebase-config.js`.
3. Dans Authentication, activer le fournisseur **E-mail / Mot de passe**.
4. Créer la base **Cloud Firestore**.
5. Dans Cloud Messaging, générer une paire de clés de certificats Web Push et copier la clé publique VAPID dans `firebase-config.js`.
6. Publier les règles du fichier `firestore.rules` dans Firestore Rules.
7. Héberger l'application en HTTPS. Les notifications Web ne fonctionnent pas sur une origine non sécurisée (hors localhost).

Les mêmes paramètres Firebase sont chargés par la page et le service worker. Ne place jamais une clé privée de compte de service, une clé Admin SDK ou une clé `service_role` dans le dépôt ou dans le navigateur.

## État des notifications

Le centre de notifications lit les documents de `users/{uid}/notifications`. Les règles Firestore empêchent les clients de créer eux-mêmes ces notifications : un backend de confiance doit les écrire lorsqu'un vote, un commentaire ou une révélation se produit. L'envoi push nécessite également ce backend pour envoyer les messages FCM. Ces déclencheurs serveur ne sont pas encore déployés.

## Lancer le projet

Le projet utilise HTML, CSS et JavaScript natifs, sans étape de compilation. Héberger le dossier sur un serveur HTTPS, par exemple Netlify, puis ouvrir l'URL sur Android ou ordinateur. Pour tester localement, utiliser un serveur HTTP local et non `file://`.

## Limites connues

Les publications et votes du fil restent actuellement stockés localement dans le navigateur : ils ne sont pas encore synchronisés entre utilisateurs. Les comptes Firebase et le centre de notifications sont intégrés côté interface, mais leur activation nécessite la configuration Firebase et le backend serveur décrit ci-dessus. La modération serveur et les commentaires restent à construire.

## Stack

HTML, CSS, JavaScript natifs, PWA, Firebase Authentication, Cloud Firestore et Firebase Cloud Messaging.
