# ModelVault — campagne de validation finale (préprod uniquement)

La CI couvre la compilation, le lint, le typage, la validation Prisma et les tests automatisés. **La campagne manuelle et la restauration MariaDB n'ont pas été exécutées par ces vérifications.** Ne pas merger `dev` vers `main` avant validation.

## Fonctionnel

- [ ] Connexion Google, onboarding, thèmes/palettes, accès PENDING/USER/EDITOR/ADMIN.
- [ ] Drive : créer, renommer, modifier et supprimer un modèle d'essai ; deux synchronisations consécutives ; aucune disparition de métadonnées locales.
- [ ] Worker : au moins deux passages horaires, relance après panne et non-concurrence.
- [ ] Miniatures : cache persistant après redémarrage, rotations/zoom, échec réseau, modèles lourds, 3MF/OBJ.
- [ ] Téléchargement : modèle multipièces ZIP intègre, téléchargement individuel et comptes non autorisés.
- [ ] Cura : installer l'exécutable Windows, ouvrir STL multipièces, désinstaller ; vérifier le délai de chargement.
- [ ] Mobile et desktop : recherche, filtres, favoris, modèles à organiser, édition, dashboard admin, messages d'erreur et chargements.
- [ ] Perf : durée synchronisation, CPU/RAM, volume thumbnails/cache et taux d'erreur.

## Infrastructure (à exécuter par l'opérateur)

- [ ] Sauvegarde MariaDB chiffrée et planifiée, rétention et hors-machine.
- [ ] Restauration vérifiée sur une base **isolée**, sans jamais écraser la préprod.
- [ ] Contrôle des migrations, des secrets, du DNS/HTTPS et des ports publics.
- [ ] Inventaire des variables d'environnement dans Dokploy ; ne jamais copier les secrets dans un ticket.
- [ ] Plan de rollback et sauvegarde avant migration.

## Commandes de vérification locale

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
node scripts/preflight.mjs
```

La dernière commande vérifie seulement la présence/forme des variables, **pas** leur validité distante. Exécuter dans un environnement disposant des vraies variables sans les afficher.

Après la revue UI : créer des tickets de correction précis et répéter la campagne avant une autorisation explicite de production.
