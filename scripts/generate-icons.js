#!/usr/bin/env node

/**
 * Icon Generation Script
 *
 * This script helps generate PWA icons from a source image.
 *
 * Requirements:
 * - ImageMagick (for PNG conversion)
 * - OR use online tools like https://realfavicongenerator.net/
 *
 * Usage:
 * 1. Place your source icon (512x512px PNG) in public/icon-source.png
 * 2. Run: node scripts/generate-icons.js
 *
 * OR use online tools:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const sourceIcon = path.join(publicDir, 'icon-source.png');

console.log('📱 PWA Icon Generator\n');

if (!fs.existsSync(sourceIcon)) {
  console.log('❌ Source icon not found at:', sourceIcon);
  console.log('\n📝 Instructions:');
  console.log('1. Create a 512x512px PNG icon');
  console.log('2. Save it as: public/icon-source.png');
  console.log('3. Run this script again\n');
  console.log('💡 Alternative: Use online tools:');
  console.log('   - https://realfavicongenerator.net/');
  console.log('   - https://www.pwabuilder.com/imageGenerator');
  console.log('   - https://github.com/onderceylan/pwa-asset-generator\n');
  process.exit(1);
}

console.log('✅ Source icon found!');
console.log('\n📋 Required icons:');
console.log('   - pwa-192x192.png (192x192px)');
console.log('   - pwa-512x512.png (512x512px)');
console.log('   - apple-touch-icon.png (180x180px)');
console.log('   - favicon.ico (multi-size ICO file)\n');

console.log('🔧 To generate icons, you can:');
console.log('\n1. Use ImageMagick (if installed):');
console.log(
  '   convert public/icon-source.png -resize 192x192 public/pwa-192x192.png',
);
console.log(
  '   convert public/icon-source.png -resize 512x512 public/pwa-512x512.png',
);
console.log(
  '   convert public/icon-source.png -resize 180x180 public/apple-touch-icon.png',
);
console.log(
  '   convert public/icon-source.png -define icon:auto-resize=256,128,64,48,32,16 public/favicon.ico\n',
);

console.log('2. Use online tools:');
console.log('   Visit: https://realfavicongenerator.net/');
console.log('   Upload your icon-source.png');
console.log('   Download generated icons');
console.log('   Place them in the public/ folder\n');

console.log('3. Use PWA Asset Generator:');
console.log('   npx @vite-pwa/assets-generator public/icon-source.png\n');

console.log('✨ After generating icons, rebuild your app:');
console.log('   npm run build\n');
