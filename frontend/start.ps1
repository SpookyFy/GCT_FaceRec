Write-Host "Starting cleanup process..."

# Kill any running Metro processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" } | ForEach-Object {
    Write-Host "Killing Metro process: $($_.Id)"
    Stop-Process -Id $_.Id -Force
}

# Clean up cache directories
Write-Host "Cleaning cache directories..."
$directories = @(
    ".expo",
    "node_modules/.cache",
    "$env:TEMP/metro-*",
    "$env:TEMP/haste-map-*"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "Removing $dir"
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Set environment variables
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.4"
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# Install babel-plugin-module-resolver if not present
if (-not (Test-Path "node_modules/babel-plugin-module-resolver")) {
    Write-Host "Installing babel-plugin-module-resolver..."
    npm install --save-dev babel-plugin-module-resolver
}

Write-Host "Starting Expo..."
# Start Expo with clear cache
npx expo start --clear
