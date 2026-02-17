# Clean up Metro bundler cache
Remove-Item -Path "$env:TEMP/metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Set environment variables
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.4"

# Start Expo with a clean cache
npx expo start --clear
