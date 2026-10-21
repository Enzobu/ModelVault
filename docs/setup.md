# Installation (première phase)

1. Copier `.env.example` en `.env` et renseigner les valeurs locales.
2. Choisir des chemins absolus pour `MARIADB_DATA_PATH`, `THUMBNAILS_PATH` et `CACHE_PATH`.
3. Installer les dépendances via `npm install`.
4. Démarrer MariaDB via `docker compose up -d database`.
5. En développement, appliquer les migrations via `npx prisma migrate deploy` (ne pas utiliser `db push` sur un environnement partagé).
6. Lancer `npm run dev`.

## Dokploy

Le dépôt doit être configuré comme projet Compose. Dokploy reconstruit l'application ; GitHub Actions ne publie aucune image.

Avant tout merge vers `main`, configurer les secrets GitHub `DOKPLOY_PROD_API_KEY` et `DOKPLOY_PROD_COMPOSE_ID`, ainsi que la variable GitHub `DOKPLOY_URL`.

La migration SQL initiale est versionnée dans `prisma/migrations`. Au démarrage du conteneur `app`, l'entrypoint exécute `prisma migrate deploy` avant `node server.js`. Les migrations échouées bloquent le démarrage. Ne pas exécuter les migrations au build Docker. Les fichiers de modèles ne sont pas encore synchronisés. Prévoir des sauvegardes cohérentes de MariaDB (par exemple `mariadb-dump`).

## Google SSO (en cours)

Configurer une application OAuth Google de type **Web** avec une URI de redirection `https://VOTRE_DOMAINE/api/auth/callback/google`. Ajouter `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` et `INITIAL_ADMIN_EMAIL` (compte Google vérifié) dans les variables serveur. Le premier compte correspondant à `INITIAL_ADMIN_EMAIL` reçoit le rôle ADMIN ; tout autre compte démarre PENDING. La lecture Drive est une autorisation distincte, non implémentée dans cette phase.

Le SSO requiert une base initialisée. Vérifier les identifiants OAuth et la connexion MariaDB avant le premier déploiement.

## Google Drive — connexion administrateur

1. Activer **Google Drive API** dans le projet Google Cloud OAuth.
2. Sur le client OAuth Web existant, ajouter l'URI de redirection exacte `https://modelvault-preprod.enzo-palermo.com/api/admin/drive/callback` (adapter pour prod).
3. Dans Dokploy, définir `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY` avec une clé **stable** de 32 octets encodée base64 : `openssl rand -base64 32`. Ne jamais l'enregistrer dans Git. Changer cette clé rend les tokens précédents illisibles.
4. Configurer le consentement Google et ajouter le compte Drive comme utilisateur de test si l'application est en test. Attention : les refresh tokens des applications externes en mode Testing peuvent expirer après 7 jours. Le scope `drive.readonly` est un scope restreint : sa publication à large échelle requiert des démarches de validation Google.
5. Se connecter en ADMIN, ouvrir `/admin/drive`, connecter Google Drive puis coller l'URL ou l'ID du dossier racine.
6. L'application vérifie que le dossier existe et est accessible avant de mémoriser son ID. Aucun contenu Drive n'est synchronisé pendant cette phase.

L'autorisation Drive est **distincte de la connexion Google utilisateur**. Elle est limitée au rôle ADMIN pour le flux de connexion et la configuration ; les tokens sont chiffrés en AES-256-GCM dans MariaDB.
