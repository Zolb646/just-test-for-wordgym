const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite web
config.resolver.assetExts.push("wasm");

// Ensure sourceExts includes necessary extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, "wasm"];
