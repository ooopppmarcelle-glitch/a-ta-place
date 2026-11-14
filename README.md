# À TA PLACE

**Tu ferais quoi à ma place ?** — une application sociale où chacun peut raconter une situation, demander l'avis de la communauté et découvrir les votes.

## Stack actuelle
- PWA : HTML, CSS et JavaScript natifs.
- Authentification et base de données : Supabase Auth + PostgreSQL.
- Accès navigateur : clé publishable Supabase avec politiques Row Level Security (RLS).
- Hébergement prévu : Netlify.
- Code source : GitHub.

## Configuration Supabase
Le fichier `supabase-config.js` contient l'URL du projet et sa clé publishable. Cette clé est conçue pour le navigateur ; elle ne remplace jamais les règles RLS. Ne jamais ajouter une clé `service_role` ou une clé secrète dans le frontend.

Projet : `A-TA-PLACE` — région `eu-west-3`.

Tables créées :
- `profiles` : profil public minimal (aucune adresse e-mail publique).
- `stories` et `story_choices` : situations et choix.
- `votes` et `story_vote_totals` : votes et totaux agrégés sans exposer l'identité des votants.
- `comments` : commentaires avec état de modération.
- `reports` : signalements privés.
- `notifications` : notifications privées du destinataire.

RLS est activé sur les 8 tables. Les publications et commentaires sont créés en attente de modération ; les utilisateurs ne peuvent pas s'attribuer eux-mêmes le statut publié. Les notifications internes sont générées par la base lors des votes et commentaires.

## Fonctionnalités raccordées
- Inscription et connexion par e-mail via Supabase Auth.
- Chargement du fil partagé depuis PostgreSQL.
- Création de situations et de choix.
- Un vote par compte et par situation ; résultats agrégés.
- Centre de notifications privé et marquage comme lu.
- Installation PWA et cache de l'interface.

## À terminer avant lancement public
- Interface de modération et rôles de modérateur.
- Interface de commentaires et gestion des signalements.
- Alertes push sur l'appareil (le centre interne existe, mais OneSignal ou un autre service push n'est pas configuré).
- Realtime, limites anti-spam et tests multi-comptes.
- Déploiement HTTPS sur Netlify et tests sur Android.

## Confidentialité et sécurité
Aucun message privé n'est activé. L'adresse e-mail n'est pas exposée dans le profil public. Ne publie pas d'informations permettant d'identifier ou de localiser une personne. Les contenus envoyés restent en attente de modération avant publication.

## État des tests
La création du schéma et les politiques RLS ont été vérifiées dans Supabase. Le contrôle de sécurité Supabase ne signale aucun problème. Les tests complets dans un navigateur réel et le parcours d'inscription avec confirmation e-mail restent à effectuer.
