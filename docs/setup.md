# Installation et environnements

1. Copier `.env.example` en `.env` et renseigner les valeurs locales.
2. Choisir des chemins absolus pour `MARIADB_DATA_PATH`, `THUMBNAILS_PATH` et `CACHE_PATH`.
3. Installer les dépendances via `npm install`.
4. Démarrer MariaDB via `docker compose up -d database`.
5. En développement, appliquer les migrations via `npx prisma migrate deploy` (ne pas utiliser `db push` sur un environnement partagé).
6. Lancer `npm run dev`.

## Dokploy

Le dépôt doit être configuré comme projet Compose. Dokploy reconstruit l'application ; GitHub Actions ne publie aucune image.

Avant tout merge vers `main`, configurer les secrets GitHub `DOKPLOY_PROD_API_KEY` et `DOKPLOY_PROD_COMPOSE_ID`, ainsi que la variable GitHub `DOKPLOY_URL`.

La migration SQL initiale est versionnée dans `prisma/migrations`. Au démarrage du conteneur `app`, l'entrypoint exécute `prisma migrate deploy` avant `node server.js`. Les migrations échouées bloquent le démarrage. Ne pas exécuter les migrations au build Docker. Les modèles 3D sont indexés en métadonnées et les téléchargements restent déclenchés à la demande. Prévoir des sauvegardes cohérentes de MariaDB (par exemple `mariadb-dump`).

## Google SSO

Configurer une application OAuth Google de type **Web** avec une URI de redirection `https://VOTRE_DOMAINE/api/auth/callback/google`. Ajouter `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` et `INITIAL_ADMIN_EMAIL` (compte Google vérifié) dans les variables serveur. Le premier compte correspondant à `INITIAL_ADMIN_EMAIL` reçoit le rôle ADMIN ; tout autre compte démarre PENDING. La lecture Drive est une autorisation distincte et réservée aux administrateurs.

Le SSO requiert une base initialisée. Vérifier les identifiants OAuth et la connexion MariaDB avant le premier déploiement.

## Google Drive — connexion administrateur

1. Activer **Google Drive API** dans le projet Google Cloud OAuth.
2. Sur le client OAuth Web existant, ajouter l'URI de redirection exacte `https://modelvault-preprod.enzo-palermo.com/api/admin/drive/callback` (adapter pour prod).
3. Dans Dokploy, définir `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY` avec une clé **stable** de 32 octets encodée base64 : `openssl rand -base64 32`. Ne jamais l'enregistrer dans Git. Changer cette clé rend les tokens précédents illisibles.
4. Configurer le consentement Google et ajouter le compte Drive comme utilisateur de test si l'application est en test. Attention : les refresh tokens des applications externes en mode Testing peuvent expirer après 7 jours. Le scope `drive.readonly` est un scope restreint : sa publication à large échelle requiert des démarches de validation Google.
5. Se connecter en ADMIN, ouvrir `/admin/drive`, connecter Google Drive puis coller l'URL ou l'ID du dossier racine.
6. L'application vérifie que le dossier existe et est accessible avant de mémoriser son ID. La synchronisation s'effectue via le worker interne une fois le dossier racine validé.

L'autorisation Drive est **distincte de la connexion Google utilisateur**. Elle est limitée au rôle ADMIN pour le flux de connexion et la configuration ; les tokens sont chiffrés en AES-256-GCM dans MariaDB.

## Indexation Drive (phase 2)

`src/lib/drive-indexer.ts` fournit `indexDriveModels()` : la racine Drive configurée est parcourue ; chaque sous-dossier immédiat devient un modèle et ses fichiers STL/3MF/OBJ sont indexés par métadonnées (identifiants, noms, taille), sans télécharger les maillages. Les upserts ne remplacent pas les réglages d'organisation utilisateur. La synchronisation incrémentale (#21) et le déclenchement manuel/automatique (#22) sont implémentés mais certains scénarios restent à valider en préprod.

### Réconciliation Drive

La synchronisation réutilise les IDs Drive pour les upserts, actualise les noms et fichiers, supprime uniquement les lignes `ModelFile` disparues des dossiers lus avec succès et marque les modèles dont le dossier n'existe plus via `removedFromDrive` (suppression logique : catégories/tags/favoris préservés). Une erreur de liste de dossier n'entraîne pas de suppression de ses fichiers. Le worker dispose d'un verrou applicatif en base de données pour éviter les traitements concurrents.

### Synchronisation automatique (phase 2)

Ajouter `DRIVE_SYNC_CRON_SECRET` dans les variables Dokploy avec une valeur aléatoire forte (`openssl rand -base64 32`), commune au service `app` et au service interne `drive-sync-worker`. Le conteneur worker appelle uniquement l'URL interne `http://app:3000/api/internal/drive-sync` toutes les minutes. L'endpoint exige la clé privée ; il ne doit pas être appelé depuis le navigateur. Une fois le dossier racine connecté, l'indexation initiale est déclenchée au premier cycle et les suivantes environ toutes les heures. Un bouton ADMIN permet de demander une exécution anticipée, traitée au prochain passage. Le verrou en base empêche les exécutions concurrentes et permet la reprise d'une exécution interrompue depuis plus de deux heures. Les traitements s'exécutent côté serveur, sans téléchargement des maillages.

Le premier test doit vérifier les compteurs et comparer les nombres de dossiers/fichiers avec le Drive réel avant de développer la galerie.

## Mise en production

Consulter [la checklist de préproduction et de restauration](release-checklist.md) avant tout passage sur `main`. Aucun déploiement production n'est validé à ce stade.

## Miniatures 3D persistantes

La galerie lance la génération de miniatures **à la demande**, lorsque les cartes apparaissent à l'écran : rendu WebGL 320×240 (STL, OBJ, 3MF), puis stockage du PNG dans le volume Docker `THUMBNAILS_PATH` via une API authentifiée. Deux rendus maximum sont effectués simultanément dans l'onglet pour limiter la charge ; les visites suivantes réutilisent le PNG stocké. Le nom du cache dépend du modèle, de la pièce choisie et des paramètres d'orientation/zoom. Lors de la première exploration d'une page, les miniatures peuvent prendre quelques secondes. Si WebGL est indisponible, un pictogramme de secours reste affiché. Vérifier l'accès en écriture de `/app/data/thumbnails` pour l'utilisateur non-root du conteneur. Un nettoyage périodique des variantes obsolètes est à prévoir avant la production.
