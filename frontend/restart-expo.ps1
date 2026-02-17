# Stop any running Metro bundler processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" } | Stop-Process -Force

# Clean Metro cache
Write-Host "Cleaning Metro cache..."
Remove-Item -Path "$env:TEMP/metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Set environment variables
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.4"
$env:EXPO_PACKAGER_PROXY_URL = "http://192.168.1.4:8081"
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# Start the Metro bundler
Write-Host "Starting Expo..."
npx expo start --clear
