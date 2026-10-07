import { Jimp } from 'jimp';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIR = './public/textures/entrance';
const BACKUP_DIR = './public/textures/entrance/backups';

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function getNearestPowerOfTwo(n: number): number {
  const pots = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
  return pots.reduce((prev, curr) => Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev);
}

async function fix(): Promise<void> {
  const files = fs.readdirSync(TARGET_DIR);
  for (const file of files) {
    const fullPath = path.join(TARGET_DIR, file);
    if (!fs.statSync(fullPath).isFile() || !file.match(/\.(webp|jpg|jpeg|png)$/i)) continue;

    try {
      const image = await Jimp.read(fullPath);
      const width = image.width;
      const height = image.height;

      if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
        const newWidth = getNearestPowerOfTwo(width);
        const newHeight = getNearestPowerOfTwo(height);

        console.log(`Fixing ${file}: ${width}x${height} -> ${newWidth}x${newHeight}`);
        
        // Use resize directly
        image.resize({ w: newWidth, h: newHeight });
        await image.write(fullPath as `${string}.${string}`);
        console.log(`Success: ${file}`);
      }
    } catch (error: unknown) {
      console.error(`Error with ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

fix();
