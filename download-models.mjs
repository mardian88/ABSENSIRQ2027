import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2"
];

const baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";
const outDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function downloadFile(file) {
  const url = baseUrl + file;
  const outPath = path.join(outDir, file);
  console.log(`Downloading ${url}...`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(buffer));
    console.log(`Saved ${file}`);
  } catch (err) {
    console.error(`Failed to download ${file}:`, err);
  }
}

async function run() {
  for (const file of files) {
    await downloadFile(file);
  }
  console.log("All done!");
}

run();
