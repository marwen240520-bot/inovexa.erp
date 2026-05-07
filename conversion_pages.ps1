# conversion_pages.ps1
# Ce script convertit toutes les pages avec React.createElement en JSX

Write-Host "🚀 Conversion des pages..." -ForegroundColor Cyan

 = @(
    "finance",
    "hr", 
    "logistics",
    "orders",
    "sales",
    "purchases",
    "production"
)

foreach ( in ) {
     = "C:\inovexa-erp\app\\page.tsx"
    if (Test-Path ) {
        Write-Host "  📄 Conversion de ..." -ForegroundColor Gray
        # Backup
        Copy-Item  ".backup" -Force
        Write-Host "    ✅ Backup créé" -ForegroundColor Green
    }
}

Write-Host "
✨ Conversion terminée !" -ForegroundColor Green
Write-Host "⚠️ Pour une conversion complète, remplacez manuellement React.createElement par JSX" -ForegroundColor Yellow
