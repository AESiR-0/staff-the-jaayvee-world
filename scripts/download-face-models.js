const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsPath = path.join(__dirname, '../public/models');

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('Downloading face-api.js models...\n');
  
  if (!fs.existsSync(modelsPath)) {
    fs.mkdirSync(modelsPath, { recursive: true });
  }

  for (const model of models) {
    const url = `${baseUrl}/${model}`;
    const filepath = path.join(modelsPath, model);
    
    try {
      await downloadFile(url, filepath);
    } catch (err) {
      console.error(`✗ Failed to download ${model}:`, err.message);
    }
  }
  
  console.log('\n✓ All models downloaded successfully!');
}

downloadModels().catch(console.error);

