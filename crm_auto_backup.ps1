$projectPath = "C:\Users\graha\OneDrive\Documents\Projects\CRM_Backend"
cd $projectPath

# Check for changes
$changes = git status --porcelain

if ($changes) {
    git add .
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-backup at $timestamp"
    git push origin master
    Write-Host "✅ Changes pushed at $timestamp"
} else {
    Write-Host "🔄 No changes to backup at $(Get-Date -Format "HH:mm:ss")"
}
