$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.4"

Write-Host "Clearing Metro bundler cache..."
Remove-Item -Path "$env:TEMP/metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Starting Expo..."
npx expo start --clear
