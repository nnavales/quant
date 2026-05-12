!macro customUnInstall
  # Only remove app files, never ask about app data
!macroend

!macro customInit
  # Check if previous version exists
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Quant" "UninstallString"
  ${If} $R0 != ""
    # Silently uninstall previous version without touching app data
    ExecWait '"$R0" /S _?=$INSTDIR'
  ${EndIf}
!macroend
