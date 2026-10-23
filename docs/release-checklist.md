# ModelVault — Préparation à la production

**État : NON VALIDÉ. Ne pas fusionner `dev` vers `main` sans validation manuelle explicite.**

## Prérequis et vérifications

- [ ] Déploiement préprod à jour depuis `dev`, CI Quality/Build verte et tests navigateur vérifiés.
- [ ] Parcours SSO Google, utilisateurs PENDING, accès USER/EDITOR/ADMIN, suspension et droits vérifiés.
- [ ] Indexation Drive sur un dossier de test : ajout/renommage/suppression, absence de doublons, préservation des favoris/tags.
- [ ] Synchronisation horaire testée au-delà de deux cycles, erreurs/récupération visibles et contention évitée.
- [ ] Test STL/OBJ/3MF représentatifs, modèles multipièces et modèles volumineux ; gestion échec réseau Drive.
- [ ] Miniatures persistantes, cache/quotas/éviction/performances mesurés ; ticket #24 implémenté, à valider en préprod.
- [ ] Téléchargements simples/ZIP vérifiés sur des fichiers volumineux ; aucune fuite de token.
- [ ] ModelVault Bridge testé avec la version Windows/Cura visée ; ticket #30 implémenté, à valider sur Windows.
- [ ] Revue d'accessibilité, mobile, états vides et de l'ensemble des 8 palettes (light/dark/system).
- [ ] Google OAuth Drive : périmètre du scope `drive.readonly`, état Testing/expiration des refresh tokens et validation/politique Google.
- [ ] Secrets distincts en prod/préprod : `AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY`, `DRIVE_SYNC_CRON_SECRET`.
- [ ] Backups MariaDB automatisés et **restauration testée**, ainsi que volumes thumbnails/cache et stratégie d'éviction.
- [ ] Exposition réseau revue (pas de port MariaDB public, restriction d'accès au reverse proxy, pare-feu).
- [ ] Vérification de l'instance prod Dokploy/Compose/path et des secrets GitHub **sans déclencher le deploy-prod**.

## Mesurer la préprod

Relever avant/après une synchronisation : nombre de modèles/fichiers en base, durée (désormais journalisée par le worker HTTP), mémoire CPU du conteneur `app`, espace des montages MariaDB/cache/thumbnails, nombre d'appels Drive et taux d'erreur. Mettre les résultats datés dans le ticket #31. Éviter de déduire les performances du seul build CI.

## Sauvegarde et restauration MariaDB

Sur l'hôte Docker de préprod, après vérification des bons conteneurs, exemple manuel (à adapter à la politique de sauvegarde) :

```sh
docker exec <database-container> sh -c 'exec mariadb-dump --single-transaction -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' > modelvault-$(date +%F).sql
```

Protéger le fichier SQL : il contient potentiellement des données personnelles et le token Drive chiffré. Sauvegarder **séparément et de manière sécurisée** la clé `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY`, sans laquelle les tokens ne pourront plus être lus. Vérifier qu'aucun fichier de sauvegarde n'est stocké dans le dépôt.

Pour tester la restauration, utiliser **une instance MariaDB temporaire isolée** et non la base préprod/prod :

```sh
docker exec -i <temporary-test-db-container> sh -c 'exec mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' < modelvault-YYYY-MM-DD.sql
```

Exécuter ensuite un contrôle des tables et du nombre de lignes. Cette procédure ne remplace pas une stratégie de sauvegardes programmées avec rétention, chiffrement, surveillance et tests de restauration.

## Rollback

Avant une publication, conserver les références image/commit et une sauvegarde de la base. **Une migration Prisma n'est pas automatiquement réversible** : revenir à l'ancien conteneur peut nécessiter un plan de restauration des données et des scripts de compatibilité. Tester en préprod. Ne jamais automatiser un rollback SQL destructif sans sauvegarde vérifiée.

## Décision finale

Compléter cette liste, exécuter la [campagne de tests finale](final-qa.md), obtenir les mesures et l'accord explicite avant toute PR `dev → main`. Aucune action automatique vers `main` n'est autorisée par cette checklist.
