; Script generated by the Inno Script Studio Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "Keybase"
#define MyAppVersion "1.0"
#define MyAppPublisher "Keybase, Inc."
#define MyAppURL "http://www.keybase.io/"
#define MyAppExeName "keybase.exe"
#define MyGoPath GetEnv('GOPATH')
#if MyGoPath == ""
#define MyGoPath "c:\work\"
#endif

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{70E747DE-4E09-44B0-ACAD-784AA9D79C02}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputBaseFilename=keybase_setup{#MyAppVersion}
SetupIconFile={#MyGoPath}src\github.com\keybase\keybase\public\images\favicon.ico
Compression=lzma
SolidCompression=yes
UninstallDisplayIcon={app}\keybase.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "{#MyGoPath}bin\keybase.exe"; DestDir: "{app}"; Flags: ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{group}\{#MyAppName} CMD"; Filename: "cmd.exe"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; Parameters: "/K ""set PATH=%PATH%;{app}"""

[Registry]
Root: "HKCU"; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Keybase.exe"; ValueType: string; ValueData: "{app}\Keybase.exe"; Flags: uninsdeletekey

[Messages]
WelcomeLabel2=This will install [name/ver] on your computer.

[Run]
Filename: "{app}\keybase.exe"; Parameters: "ctl watchdog"; WorkingDir: "{app}"; Flags: postinstall runhidden nowait; Description: "Start Keybase service"

[UninstallDelete]
Type: files; Name: "{userstartup}\{#MyAppName}.vbs"

[InstallDelete]
Type: files; Name: "{userstartup}\{#MyAppName}.vbs"

[Code]
// Simply invoking "Keybase.exe service" at startup results in an unsightly
// extra console window, so we'll emit this bit of script instead.
// (yes, this is pascal code that generates vbscript.)
// Note that we delete it at uninstall.
function CreateStartupScript(): boolean;
var
  fileName : string;
  lines : TArrayOfString;
begin
  Result := true;
  fileName := ExpandConstant('{userstartup}\{#MyAppName}.vbs');
  SetArrayLength(lines, 4);

  lines[0] := 'Dim WinScriptHost';
  lines[1] := 'Set WinScriptHost = CreateObject("WScript.Shell")';
  lines[2] := ExpandConstant('WinScriptHost.Run Chr(34) & "{app}\{#MyAppExeName}" & Chr(34) & " ctl watchdog", 0');
  lines[3] := 'Set WinScriptHost = Nothing';

  Result := SaveStringsToFile(filename,lines,true);
  exit;
end;

procedure StopKeybaseService();
var
  WMIService: Variant;
  WbemLocator: Variant;
  WbemObjectSet: Variant;
  ResultCode: Integer;
  CommandName: string;
begin
  WbemLocator := CreateOleObject('WbemScripting.SWbemLocator');
  WMIService := WbemLocator.ConnectServer('localhost', 'root\CIMV2');
  WbemObjectSet := WMIService.ExecQuery(ExpandConstant('SELECT * FROM Win32_Process Where Name="{#MyAppExeName}"'));
  
  // Fairly simple check just to see if a process is running named Keybase.exe
  // No point in trying to stop it otherwise (it will hang).
  if not VarIsNull(WbemObjectSet) and (WbemObjectSet.Count > 0) then
  begin
    // Launch Keybase ctl stop and wait for it to terminate
    CommandName := ExpandConstant('{app}\{#MyAppExeName}');
    Exec(CommandName, 'ctl stop', '', SW_SHOW,
      ewWaitUntilTerminated, ResultCode);
  end;
end;
 
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if  CurStep=ssPostInstall then
    begin
         CreateStartupScript();
    end
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if  CurUninstallStep=usUninstall then
    begin
         StopKeybaseService();
    end
end;
