Write-Host "🧹 Cleaning up old installation..."
# Remove old files
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP/metro-*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "📦 Installing dependencies..."
# Core dependencies for Expo 49
npm install --save `
    expo@49.0.0 `
    react@18.2.0 `
    react-native@0.72.6 `
    @react-navigation/native@6.1.9 `
    @react-navigation/bottom-tabs@6.5.11 `
    @react-navigation/stack@6.3.20 `
    react-native-screens@~3.22.0 `
    react-native-safe-area-context@4.6.3 `
    react-native-reanimated@~3.3.0 `
    react-native-gesture-handler@~2.12.0 `
    @react-native-async-storage/async-storage@1.18.2 `
    react-native-paper@5.11.1 `
    @expo/vector-icons@13.0.0 `
    expo-camera@~13.4.2 `
    expo-file-system@~15.4.4 `
    expo-status-bar@~1.6.0 `
    axios@1.6.2

Write-Host "📦 Installing dev dependencies..."
# Development dependencies
npm install --save-dev `
    @babel/core@^7.20.0 `
    typescript@~5.1.3 `
    @types/react@~18.2.14 `
    @types/react-native@~0.72.6

Write-Host "🧹 Clearing Metro bundler cache..."
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.4"

Write-Host "🚀 Starting Expo..."
npx expo start --clear
