# ModelVault

Médiathèque 3D auto-hébergée (en cours de développement).

## Stack

Next.js · TypeScript · Tailwind · MariaDB · Prisma · Docker Compose

## État actuel

Premier socle uniquement : page d'accueil, endpoint `/api/health`, schéma initial Prisma, Docker Compose et GitHub Actions.

Le SSO Google, la connexion Google Drive, les visualiseurs, la gestion des modèles, les thèmes et le bridge Cura feront l'objet des prochaines phases.

Voir [installation](docs/setup.md).

## Git

`main` → `dev` → `feat/*` / `fix/*` → PR vers `dev` → PR vers `main`.

La CI vérifie les changements ; Dokploy construit et déploie uniquement après push sur `main`.
