# ModelVault Bridge — Windows / Cura

Ce helper local ne nécessite que Python 3.11+ sur Windows. **Prototype préprod à tester** : il ouvre dans Cura les fichiers 3D d'un modèle depuis sa fiche ModelVault.

## Installation

1. Installer Python 3.11+ (depuis python.org) et Cura.
2. Enregistrer `bridge/modelvault_bridge.py` dans un emplacement durable sur le PC (ne pas supprimer ou déplacer ce fichier après installation).
3. Depuis PowerShell :

```powershell
py -3 modelvault_bridge.py install "C:\Program Files\UltiMaker Cura\UltiMaker-Cura.exe"
```

Adapter le chemin à l'exécutable Cura installé. En cas d'échec, vérifier le chemin réel de Cura.

4. Dans la fiche d'un modèle, cliquer **Ouvrir dans Cura**, puis accepter l'ouverture du protocole `modelvault://` dans le navigateur.

Le helper télécharge un ZIP au moyen d'un **ticket à usage unique valable deux minutes**, qui ne permet d'obtenir que ce modèle et non d'accéder au compte Google ou à une session ModelVault. Les tickets sont stockés en SHA-256 en base, et invalidés atomiquement au premier usage. Le transfert est limité aux domaines officiels préprod/prod connus, en HTTPS uniquement.

Les pièces STL, OBJ et 3MF sont extraites dans un dossier temporaire, puis transmises à Cura via les arguments de sa ligne de commande. **À vérifier selon la version de Cura :** certaines installations peuvent ne pas prendre en charge l'ouverture multipièces via arguments. Les fichiers restent disponibles pendant 20 secondes après le lancement de Cura. Si Cura met plus longtemps à les charger, l'import peut échouer : ce comportement devra être amélioré avant la production.

## Désinstallation

```powershell
py -3 modelvault_bridge.py uninstall
```

La désinstallation retire l'association `modelvault://` du registre utilisateur ; le script et le petit fichier de configuration peuvent ensuite être supprimés manuellement.

## Sécurité et limites

Ne jamais copier un lien `modelvault://` vers une autre personne : il contient un ticket éphémère. Aucun OAuth token Google n'est transmis à Windows. Le navigateur peut afficher une confirmation externe. Le helper n'interprète aucun shell ni chemin distant arbitraire. Il refuse les noms ZIP contenant des chemins et plafonne les tailles. Installation réservée à un poste Windows de confiance.
