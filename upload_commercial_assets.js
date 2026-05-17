/* global process */
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

const storage = new Storage();
const artifactsDir = '/usr/local/google/home/ivanramirez/.gemini/jetski/brain/d415520e-95b9-4362-960e-a1d3de227090';

async function uploadAssets() {
  const bucketName = process.argv[2] || process.env.VITE_FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    console.error('\n❌ ERROR: GCS Bucket name missing.');
    console.error('Usage: node upload_commercial_assets.js <YOUR_GCS_BUCKET_NAME>');
    console.error('   OR: VITE_FIREBASE_STORAGE_BUCKET=my-bucket node upload_commercial_assets.js\n');
    process.exit(1);
  }

  console.log(`\n🚀 LAUNCHING GCS COMMERCIAL ASSET UPLOADER...`);
  console.log(`Target Bucket: ${bucketName}`);
  console.log(`---------------------------------------------------\n`);

  const bucket = storage.bucket(bucketName);

  try {
    const files = fs.readdirSync(artifactsDir);

    const targetFiles = files.filter(file => {
      return (file.endsWith('.png') && (
        file.startsWith('kitchen_table_hook') ||
        file.startsWith('scifi_theming_transition') ||
        file.startsWith('gamification_coins_end') ||
        file.startsWith('parent_rewards_end') ||
        file.startsWith('outro_text_end')
      )) || file === 'commercial_production_script.md';
    });

    if (targetFiles.length === 0) {
      console.warn('⚠️ No commercial assets found in artifacts directory.');
      return;
    }

    for (const file of targetFiles) {
      const filePath = path.join(artifactsDir, file);
      const destination = `commercial_assets/${file}`;

      console.log(`📤 Uploading ${file} to gs://${bucketName}/${destination}...`);

      await bucket.upload(filePath, {
        destination: destination,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      console.log(`✅ Successfully uploaded ${file}`);
    }

    console.log(`\n🎉 ALL COMMERCIAL ASSETS UPLOADED SUCCESSFULLY to gs://${bucketName}/commercial_assets/`);
  } catch (err) {
    console.error(`\n❌ FATAL ERROR during upload:`, err.message);
    console.error(`Please verify your GCS bucket permissions and IAM roles.\n`);
  }
}

uploadAssets();
