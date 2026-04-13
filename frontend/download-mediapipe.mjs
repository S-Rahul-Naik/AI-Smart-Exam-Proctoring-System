#!/usr/bin/env node
/**
 * Download MediaPipe WASM runtime and face detection model for local bundling
 * eliminates CDN dependency and loads instantly
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MEDIAPIPE_DIR = path.join(__dirname, 'public', 'mediapipe');
const WASM_DIR = path.join(MEDIAPIPE_DIR, 'wasm');
const MODELS_DIR = path.join(MEDIAPIPE_DIR, 'models');

// Create directories
[MEDIAPIPE_DIR, WASM_DIR, MODELS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created ${dir}`);
  }
});

// Files to download
const downloads = [
  {
    url: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_internal.js',
    dest: path.join(WASM_DIR, 'vision_wasm_internal.js'),
    name: 'Vision WASM JS',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_internal.wasm',
    dest: path.join(WASM_DIR, 'vision_wasm_internal.wasm'),
    name: 'Vision WASM Binary',
  },
  {
    url: 'https://storage.googleapis.com/mediapipe-assets/face_landmarker.task',
    dest: path.join(MODELS_DIR, 'face_landmarker.task'),
    name: 'Face Landmarker Model',
  },
];

function downloadFile(url, dest, name) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`✓ ${name} already exists, skipping`);
      resolve();
      return;
    }

    console.log(`⬇ Downloading ${name}...`);
    const file = fs.createWriteStream(dest);

    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${name}: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(dest).size;
          const mb = (size / 1024 / 1024).toFixed(2);
          console.log(`✓ Downloaded ${name} (${mb}MB)`);
          resolve();
        });
      })
      .on('error', err => {
        fs.unlink(dest, () => {}); // Delete incomplete file
        reject(err);
      });
  });
}

async function main() {
  console.log('\n📦 Downloading MediaPipe files for local bundling...\n');

  try {
    for (const download of downloads) {
      await downloadFile(download.url, download.dest, download.name);
    }

    console.log('\n✅ MediaPipe files downloaded successfully!');
    console.log(`📁 Location: ${MEDIAPIPE_DIR}`);
    console.log('\n💡 Face detection will now load instantly from local files');
    console.log('   No more CDN dependency or network delays!\n');
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

main();
