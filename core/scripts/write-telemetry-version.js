const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

// Replace version placeholder in telemetry files
const telemetryFiles = [
  '../dist/telemetry.js',
  '../dist/esm/telemetry.js'
];

telemetryFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/__FLYDE_VERSION__/g, version);
    fs.writeFileSync(filePath, content);
  }
});