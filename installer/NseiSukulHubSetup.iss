; Nsei Sukul: School Hub Windows Installer Configuration
; Created for Inno Setup 6 (produces NseiSukulHubSetup.exe)

#define MyAppName "Nsei Sukul School Hub"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Nsei Sukul Technologies"
#define MyAppURL "https://nsei-sukul.klarifypath.com"
#define MyAppExeName "NseiSukulHub.exe"

[Setup]
AppId={{D37E6B81-54E1-4FA3-899C-A2E8BC96DF41}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Nsei Sukul Hub
DisableProgramGroupPage=yes
LicenseFile=
OutputDir=..\public\downloads
OutputBaseFilename=NseiSukulHubSetup
SetupIconFile=app-icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=force
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Dirs]
Name: "{app}"; Permissions: users-modify
Name: "{app}\public\uploads"; Permissions: users-modify

[Tasks]
Name: "desktopicon"; Description: "Create a Desktop shortcut"; GroupDescription: "Additional Icons:"
Name: "autostart"; Description: "Start School Hub automatically when Windows starts"; GroupDescription: "Startup Options:"; Flags: unchecked

[Files]
; Distribute all files bundled in dist-hub
Source: "..\dist-hub\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "app-icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app-icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app-icon.ico"; Tasks: desktopicon
Name: "{autostartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: autostart

[Run]
; Add Windows Firewall rule for incoming Wi-Fi / LAN connections on Ports 3000-3010 and 5432
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""Nsei Sukul School Hub"" dir=in action=allow protocol=TCP localport=3000-3010"; Flags: runhidden
; Launch the application upon installation finish
Filename: "{app}\{#MyAppExeName}"; Description: "Launch Nsei Sukul School Hub now"; Flags: postinstall nowait skipifsilent

[UninstallRun]
; Stop and delete Windows Service if registered
Filename: "sc"; Parameters: "stop NseiSukulHubService"; Flags: runhidden; RunOnceId: "StopHubService"
Filename: "sc"; Parameters: "delete NseiSukulHubService"; Flags: runhidden; RunOnceId: "DelHubService"
; Clean up Windows Firewall rule upon uninstall
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Nsei Sukul School Hub"""; Flags: runhidden; RunOnceId: "DelHubFwRule"

[Code]
var
  NodeKeyPage: TInputQueryWizardPage;

function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  // Forcefully terminate any running instance of NseiSukulHub or its bundled runtime
  Exec('taskkill.exe', '/F /IM NseiSukulHub.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := True;
end;

procedure InitializeWizard;
begin
  // Create custom page prompting for Hub Node Key during installation
  NodeKeyPage := CreateInputQueryPage(
    wpSelectDir,
    'School Hub Authentication',
    'Enter your Hub Node Key from the school dashboard',
    'Please paste the Node Key you generated in Settings > School Hub (e.g. hub_ffocast_...):'
  );
  NodeKeyPage.Add('Hub Node Key:', False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  NodeKey: String;
  EnvFilePath: String;
  EnvContent: String;
  ConfigFilePath: String;
  ConfigContent: String;
begin
  if CurStep = ssPostInstall then
  begin
    NodeKey := Trim(NodeKeyPage.Values[0]);
    if NodeKey <> '' then
    begin
      EnvFilePath := ExpandConstant('{app}\.env.local');
      EnvContent := 'HUB_NODE_KEY=' + NodeKey + #13#10;
      SaveStringToFile(EnvFilePath, EnvContent, False);

      ConfigFilePath := ExpandConstant('{app}\hub-node-config.json');
      ConfigContent := '{' + #13#10 +
                       '  "nodeKey": "' + NodeKey + '",' + #13#10 +
                       '  "schoolId": "hub-' + Copy(NodeKey, Length(NodeKey) - 7, 8) + '",' + #13#10 +
                       '  "schoolName": "Local School Station",' + #13#10 +
                       '  "schoolCode": "LOCAL",' + #13#10 +
                       '  "cloudSyncUrl": "https://nsei-sukul.klarifypath.com/api/v1/hub/sync"' + #13#10 +
                       '}';
      SaveStringToFile(ConfigFilePath, ConfigContent, False);
    end;
  end;
end;
