; ModelVault Bridge setup - per-user, no administrator rights
#define MyAppName "ModelVault Bridge"
#define MyAppVersion "1.0.0"
[Setup]
AppId={{A349ABDE-B89D-4D45-A6D3-0598253B1D0A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={localappdata}\ModelVaultBridge
DefaultGroupName=ModelVault
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=ModelVaultBridge-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
WizardStyle=modern
UninstallDisplayName=ModelVault Bridge
[Files]
Source: "..\dist\ModelVaultBridge.exe"; DestDir: "{app}"; Flags: ignoreversion
[Run]
Filename: "{app}\ModelVaultBridge.exe"; Parameters: "install"; Flags: runhidden waituntilterminated
[UninstallRun]
Filename: "{app}\ModelVaultBridge.exe"; Parameters: "uninstall"; Flags: runhidden waituntilterminated
