# Kill all running claude-chronicle processes
$procs = Get-Process -Name "claude-chronicle" -ErrorAction SilentlyContinue
if ($procs) {
    $procs | ForEach-Object {
        Write-Host "Killing PID $($_.Id) — $($_.ProcessName)"
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "Done. Killed $($procs.Count) process(es)."
} else {
    Write-Host "No claude-chronicle processes found."
}
