const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude virtual environment and git folders from Metro file watcher
config.resolver.blockList = [
  /.*\.venv.*/,
  /.*\.git.*/,
];

module.exports = config;
