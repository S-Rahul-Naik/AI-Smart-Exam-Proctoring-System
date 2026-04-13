import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source and destination paths
const srcDir = path.join(__dirname, 'node_modules', '@tensorflow-models', 'coco-ssd');
const destDir = path.join(__dirname, 'public', 'models', 'coco-ssd');

// Create destination directory
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`✓ Created directory: ${destDir}`);
}

// Files to copy
const files = ['model.json', 'model.weights.bin'];

try {
  for (const file of files) {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      const stats = fs.statSync(dest);
      console.log(`✓ Copied ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      console.warn(`⚠ File not found: ${src}`);
    }
  }
  
  console.log(`\n✓ Model files copied to: ${destDir}`);
} catch (error) {
  console.error('Error copying files:', error);
  process.exit(1);
}
