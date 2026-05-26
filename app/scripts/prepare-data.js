import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PUB = path.resolve(__dirname, '../public');

// Create directories if they don't exist
fs.mkdirSync(path.join(PUB, 'data'), { recursive: true });
fs.mkdirSync(path.join(PUB, 'assets'), { recursive: true });

// Copy all assets
const assetsDir = path.join(ROOT, 'assets');
const pubAssetsDir = path.join(PUB, 'assets');
fs.readdirSync(assetsDir).forEach(file => {
  fs.copyFileSync(path.join(assetsDir, file), path.join(pubAssetsDir, file));
});

// Copy data files
// Try to copy data-0.5.json first from ROOT/data, otherwise fallback to ROOT/data.json
const data05Path = path.join(ROOT, 'data', 'data-0.5.json');
const rootDataPath = path.join(ROOT, 'data.json');
const pubData05Path = path.join(PUB, 'data', 'data-0.5.json');

if (fs.existsSync(data05Path)) {
  fs.copyFileSync(data05Path, pubData05Path);
} else if (fs.existsSync(rootDataPath)) {
  fs.copyFileSync(rootDataPath, pubData05Path);
} else {
  console.error("Could not find data-0.5.json or data.json");
}

const data04Path = path.join(ROOT, 'data', 'data-0.4.json');
const pubData04Path = path.join(PUB, 'data', 'data-0.4.json');
if (fs.existsSync(data04Path)) {
  fs.copyFileSync(data04Path, pubData04Path);
} else {
  console.error("Could not find data-0.4.json");
}

console.log("Prepared data and assets successfully in app/public.");
