; Nsei Sukul: School Hub Windows Installer Configuration
; Created for Inno Setup (produces NseiSukulHubSetup.exe)

#define MyAppName "Nsei Sukul School Hub"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Nsei Sukul Technologies"
#define MyAppURL "https://nsei-sukul.klarifypath.com"
#define MyAppExeName "start-server.bat"

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
SetupIconFile=..\public\favicon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "autostart"; Description: "Start School Hub automatically when Windows turns on"; GroupDescription: "Startup Options:"; Flags: unchecked
Name: "desktopicon"; Description: "Create a Desktop shortcut"; GroupDescription: "Additional Icons:"

[Files]
; Copy all files packaged in dist-hub
Source: "..\dist-hub\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\run-silent.vbs"; IconFilename: "{app}\public\favicon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\run-silent.vbs"; IconFilename: "{app}\public\favicon.ico"; Tasks: desktopicon
Name: "{autostartup}\{#MyAppName}"; Filename: "{app}\run-silent.vbs"; Tasks: autostart

[Run]
; Add Windows Firewall rule for incoming Wi-Fi connections on Port 3000
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""Nsei Sukul School Hub"" dir=in action=allow protocol=TCP localport=3000"; Flags: runhidden
; Launch the silent service upon installation finish
Filename: "{app}\run-silent.vbs"; Description: "Launch Nsei Sukul School Hub now"; Flags: postinstall shellexec skipifsilent

[UninstallRun]
; Remove Windows Firewall rule upon uninstall
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Nsei Sukul School Hub"""; Flags: runhidden; RunOnceId: "DelHubFwRule"

[Code]
var
  NodeKeyPage: TInputQueryWizardPage;

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
begin
  if CurStep = ssPostInstall then
  begin
    NodeKey := Trim(NodeKeyPage.Values[0]);
    if NodeKey <> '' then
    begin
      EnvFilePath := ExpandConstant('{app}\.env.local');
      EnvContent := 'NEXT_PUBLIC_HUB_MODE=true' + #13#10 +
                    'HUB_MODE=true' + #13#10 +
                    'HUB_NODE_KEY=' + NodeKey + #13#10 +
                    'PORT=3000' + #13#10 +
                    'CLOUD_SYNC_URL=https://nsei-sukul.klarifypath.com/api/v1/hub/sync' + #13#10;
      SaveStringToFile(EnvFilePath, EnvContent, False);
    end;
  end;
end;
