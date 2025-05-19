# Set project directory and move into it
$projectPath = "C:\Users\graha\OneDrive\Documents\Projects\CRM_Backend"
Set-Location $projectPath

# Check for changes
$changes = git status --porcelain

if ($changes) {
    git add .
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-backup at $timestamp"
    git push origin main

    # Log to file
    "[$timestamp] ✅ Backup pushed successfully." | Out-File -Append "$projectPath\backup_log.txt"

    Write-Host "✅ Changes pushed at $timestamp"
} else {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] 🔄 No changes to commit." | Out-File -Append "$projectPath\backup_log.txt"

    Write-Host "🔄 No changes to backup at $timestamp"
}
