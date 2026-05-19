!macro customUnInstall
  # Only remove app files, never ask about app data
!macroend

!macro customInit
  # Kill any running Quant processes before uninstall/upgrade
  nsExec::Exec '"taskkill.exe" /f /im Quant.exe'
  Pop $0
  nsExec::Exec '"taskkill.exe" /f /im quant-api.exe'
  Pop $0
  nsExec::Exec '"taskkill.exe" /f /im quant-cli.exe'
  Pop $0
!macroend
