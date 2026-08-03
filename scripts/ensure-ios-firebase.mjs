import { readFile, writeFile } from 'node:fs/promises';

const packagePath = new URL('../ios/App/CapApp-SPM/Package.swift', import.meta.url);
let source = await readFile(packagePath, 'utf8');

if (!source.includes('firebase-ios-sdk')) {
  source = source.replace(
    '        .package(name: "CapacitorStatusBar", path: "../../../node_modules/@capacitor/status-bar")',
    '        .package(name: "CapacitorStatusBar", path: "../../../node_modules/@capacitor/status-bar"),\n        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", exact: "11.15.0")'
  );
  source = source.replace(
    '                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar")',
    '                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar"),\n                .product(name: "FirebaseCore", package: "firebase-ios-sdk"),\n                .product(name: "FirebaseMessaging", package: "firebase-ios-sdk")'
  );
}

if (!source.includes('firebase-ios-sdk') || !source.includes('FirebaseMessaging')) {
  throw new Error('Could not add Firebase products to the generated iOS Swift package.');
}

await writeFile(packagePath, source);
console.log('Firebase iOS products ensured in CapApp-SPM.');
