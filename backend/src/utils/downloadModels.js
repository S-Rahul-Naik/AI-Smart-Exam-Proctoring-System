import fs from 'fs';
import fsProm from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../../public/models/face-api');
const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

// List of models to download
const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-weights_0.buf',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-weights_0.buf',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-weights_0.buf',
  'face_recognition_model-weights_1.buf',
];

// Download a file from CDN
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Download all models
export async function downloadFaceApiModels() {
  try {
    console.log('📦 Checking face-api models...');
    
    // Create models directory if it doesn't exist
    await fsProm.mkdir(MODELS_DIR, { recursive: true });
    console.log(`✓ Models directory ready: ${MODELS_DIR}`);
    
    // Check which models need downloading
    const modelsToDownload = [];
    for (const model of MODELS) {
      const filepath = path.join(MODELS_DIR, model);
      try {
        await fsProm.stat(filepath);
        console.log(`✓ Model already exists: ${model}`);
      } catch (err) {
        modelsToDownload.push(model);
      }
    }
    
    if (modelsToDownload.length === 0) {
      console.log('✅ All face-api models already downloaded');
      return;
    }
    
    console.log(`📥 Downloading ${modelsToDownload.length} model files...`);
    
    for (const model of modelsToDownload) {
      try {
        const url = CDN_URL + model;
        const filepath = path.join(MODELS_DIR, model);
        console.log(`  ⬇️  ${model}...`);
        await downloadFile(url, filepath);
        console.log(`  ✓ Downloaded: ${model}`);
      } catch (err) {
        console.error(`  ✗ Failed to download ${model}:`, err.message);
        throw err;
      }
    }
    
    console.log('✅ All face-api models downloaded successfully');
  } catch (error) {
    console.error('❌ Failed to download face-api models:', error.message);
    throw error;
  }
}
