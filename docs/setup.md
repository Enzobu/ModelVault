# Installation (première phase)

1. Copier `.env.example` en `.env` et renseigner les valeurs locales.
2. Choisir des chemins absolus pour `MARIADB_DATA_PATH`, `THUMBNAILS_PATH` et `CACHE_PATH`.
3. Installer les dépendances via `npm install`.
4. Démarrer MariaDB via `docker compose up -d database`.
5. En développement, initialiser la base via `npx prisma db push` (ne pas utiliser en production).
6. Lancer `npm run dev`.

## Dokploy

Le dépôt doit être configuré comme projet Compose. Dokploy reconstruit l'application ; GitHub Actions ne publie aucune image.

Avant tout merge vers `main`, configurer les secrets GitHub `DOKPLOY_PROD_API_KEY` et `DOKPLOY_PROD_COMPOSE_ID`, ainsi que la variable GitHub `DOKPLOY_URL`.

La base de données n'a **pas encore de migration versionnée** : la production ne doit pas être déployée avant cette étape. Les fichiers de modèles ne sont pas encore synchronisés. Prévoir des sauvegardes cohérentes de MariaDB (par exemple `mariadb-dump`).

## Google SSO (en cours)

Configurer une application OAuth Google de type **Web** avec une URI de redirection `https://VOTRE_DOMAINE/api/auth/callback/google`. Ajouter `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` et `INITIAL_ADMIN_EMAIL` (compte Google vérifié) dans les variables serveur. Le premier compte correspondant à `INITIAL_ADMIN_EMAIL` reçoit le rôle ADMIN ; tout autre compte démarre PENDING. La lecture Drive est une autorisation distincte, non implémentée dans cette phase.

Le SSO requiert une base initialisée. La migration de production reste à créer avant le déploiement.
