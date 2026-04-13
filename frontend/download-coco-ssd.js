import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, 'public', 'models', 'coco-ssd');

// Create directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Files to download from COCO-SSD
const files = [
  {
    url: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/model.json',
    name: 'model.json'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/model.weights.bin',
    name: 'model.weights.bin'
  }
];

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filePath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded to ${filePath}`);
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    console.log('Downloading COCO-SSD model files...\n');
    
    // Download model files
    for (const file of files) {
      const filePath = path.join(modelsDir, file.name);
      try {
        await downloadFile(file.url, filePath);
      } catch (err) {
        console.warn(`Warning: Could not download ${file.name}:`, err.message);
      }
    }

    console.log('\n✓ Model download complete!');
    console.log(`Models saved to: ${modelsDir}`);
  } catch (error) {
    console.error('Error downloading model:', error);
    process.exit(1);
  }
}

main();
