# À TA PLACE

**Tu ferais quoi à ma place ?** — une application sociale où chacun peut raconter une situation, demander l'avis de la communauté et découvrir les votes.

## Stack actuelle
- PWA : HTML, CSS et JavaScript natifs.
- Authentification et base de données : Supabase Auth + PostgreSQL.
- Accès navigateur : clé publishable Supabase avec politiques Row Level Security (RLS).
- Hébergement prévu : Netlify.
- Code source : GitHub.

## Configuration Supabase
Le fichier `supabase-config.js` contient l'URL du projet et sa clé publishable. Cette clé est conçue pour être utilisée côté navigateur ; elle ne remplace jamais les règles RLS. Ne jamais ajouter une clé `service_role` ou une clé secrète dans le frontend.

Le schéma SQL est appliqué au projet Supabase `A-TA-PLACE`. Tables initiales :
- `profiles` : profil public minimal (aucune adresse e-mail publique).
- `stories` et `story_choices` : situations et choix.
- `votes` et `story_vote_totals` : votes et totaux agrégés sans exposer l'identité des votants.
- `comments` : commentaires avec état de modération.
- `reports` : signalements privés.
- `notifications` : notifications privées du destinataire.

RLS est activé sur toutes ces tables. Les nouvelles situations sont enregistrées en attente de modération. Une interface et un processus de modération doivent être ajoutés avant un lancement public.

## Notifications push
Le centre de notifications intégré lit la table Supabase `notifications`. Les notifications sont réservées à leur destinataire et leur création doit être effectuée par un backend de confiance. Les alertes push sur l'appareil ne sont pas encore configurées.

## Démarrage
Ouvrir `index.html` via un serveur local ou déployer le dépôt sur un hébergeur HTTPS. L'application nécessite une connexion Internet pour Supabase ; le service worker met en cache les ressources de l'interface, mais les données sociales ne sont pas disponibles hors ligne.

## État honnête
- Supabase Auth et le fil de situations/votes sont raccordés dans le code.
- Le schéma de base de données est créé et les politiques RLS sont activées.
- Les commentaires, le processus de modération, les notifications automatiques, les alertes push et le déploiement ne sont pas encore finalisés.
- Le projet n'a pas encore été testé dans un navigateur réel.
