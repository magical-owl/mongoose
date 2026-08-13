#!/usr/bin/env node

/**
 * Meadow App Initialization Script
 * Usage: npm run init-app -- --name "My App Name" --slug "myapp" --bundle "com.mycompany.myapp"
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
};

const appName = getArg('--name') || process.env.APP_NAME || 'Meadow App';
const appSlug = getArg('--slug') || appName.toLowerCase().replace(/[^a-z0-9]/g, '');
const bundleId = getArg('--bundle') || `com.meadow.${appSlug}`;

console.log('🚀 Initializing new app on Meadow Platform...');
console.log(`   • App Name:          ${appName}`);
console.log(`   • App Slug:          ${appSlug}`);
console.log(`   • Bundle Identifier: ${bundleId}`);

// 1. Update app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.expo.name = appName;
  appJson.expo.slug = appSlug;
  appJson.expo.scheme = appSlug;
  if (appJson.expo.ios) {
    appJson.expo.ios.bundleIdentifier = bundleId;
  }
  if (appJson.expo.android) {
    appJson.expo.android.package = bundleId;
  }
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  console.log('✅ Updated app.json successfully.');
}

// 2. Update package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.name = appSlug;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ Updated package.json name successfully.');
}

console.log('\n🎉 App Initialization Complete!');
console.log('Next steps:');
console.log('   1. Customize brand colors in src/theme/colors.ts');
console.log('   2. Build features in src/features/');
console.log('   3. Run npm run typecheck && npm test to verify setup\n');
