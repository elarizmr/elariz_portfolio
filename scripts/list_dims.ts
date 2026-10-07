import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIR = './public/textures/entrance';

async function list(): Promise<void> {
  const files = fs.readdirSync(TARGET_DIR).filter((f: string) => f.match(/\.(webp|jpg|jpeg|png)$/i));
  for (const file of files) {
    const fullPath = path.join(TARGET_DIR, file);
    try {
      const metadata = await sharp(fullPath).metadata();
      console.log(`${file}: ${metadata.width}x${metadata.height}`);
    } catch (error: unknown) {
      console.log(`Error with ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

list();
