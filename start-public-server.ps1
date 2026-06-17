$ErrorActionPreference = "Stop"

$node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path $node)) {
  $node = "node"
}

$env:PORT = if ($env:PORT) { $env:PORT } else { "3000" }

Write-Host "Starting Callroom server on port $env:PORT"
Write-Host "Local URL:  http://localhost:$env:PORT"
Write-Host "LAN URL:    http://YOUR-COMPUTER-IP:$env:PORT"
Write-Host ""
Write-Host "If your uploaded site is HTTPS, use a HTTPS tunnel URL for the Server box."
Write-Host "Examples: Cloudflare Tunnel, ngrok, or a real domain with HTTPS."

& $node server.js
