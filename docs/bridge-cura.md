# ModelVault Bridge — Windows / Cura

## Installation simplifiée (.exe)

Le workflow GitHub Actions **Bridge Windows Installer** construit automatiquement `ModelVaultBridge-Setup.exe` depuis `dev`. Dans les [exécutions du workflow](https://github.com/Enzobu/ModelVault/actions/workflows/bridge-windows.yml), ouvrir le dernier build réussi et récupérer l'artifact **ModelVaultBridge-Windows-Setup** ; décompresser puis double-cliquer sur `ModelVaultBridge-Setup.exe`.

L'installation est limitée à l'utilisateur Windows courant, **sans droits administrateur** ni Python à installer. Elle enregistre `modelvault://` et recherche Cura automatiquement. Les modèles reçus restent dans `%LOCALAPPDATA%\\ModelVaultBridge\\models` pour que Cura ait le temps de les lire ; les anciens dossiers de plus de sept jours sont supprimés au transfert suivant. Si Cura n'est pas détecté, exécuter `ModelVaultBridge.exe install "C:\\chemin\\vers\\UltiMaker-Cura.exe"`.

Puis ouvrir une fiche ModelVault et cliquer **Ouvrir dans Cura**. Le navigateur demandera éventuellement l'autorisation d'ouvrir le programme externe.

## Utilitaire et sécurité

Sécurité et limites


Ne jamais copier un lien `modelvault://` vers une autre personne : il contient un ticket éphémère. Aucun OAuth token Google n'est transmis à Windows. Le navigateur peut afficher une confirmation externe. Le helper n'interprète aucun shell ni chemin distant arbitraire. Il refuse les noms ZIP contenant des chemins et plafonne les tailles. Installation réservée à un poste Windows de confiance.


Aucun token Google n'est envoyé au PC. Le lien contient un ticket ponctuel valable deux minutes. L'extraction refuse les chemins relatifs/absolus et limite les tailles et formats STL/OBJ/3MF. La désinstallation via les paramètres Windows retire l'association de protocole. Ce binaire est actuellement distribué par les artifacts CI et non signé : Windows SmartScreen peut demander une confirmation. Les tests d'installation et d'import multipièces sont regroupés dans la validation finale.
