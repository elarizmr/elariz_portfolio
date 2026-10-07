import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIR = './public/textures/entrance';

function isPowerOfTwo(n: number | undefined): boolean {
  return n !== undefined && n > 0 && (n & (n - 1)) === 0;
}

function getNearestPowerOfTwo(n: number | undefined): number {
  const pots = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
  if (n === undefined) return pots[0];
  return pots.reduce((prev, curr) => Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev);
}

async function fix(): Promise<void> {
  const files = fs.readdirSync(TARGET_DIR).filter((f: string) => f.match(/\.(webp|jpg|jpeg|png)$/i));
  console.log(`Found ${files.length} files to check.`);
  
  for (const file of files) {
    const fullPath = path.join(TARGET_DIR, file);
    const tmpPath = fullPath + '.tmp_pot.webp';

    try {
      const inputBuffer = fs.readFileSync(fullPath);
      const metadata = await sharp(inputBuffer).metadata();
      const { width, height } = metadata;

      if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
        const newWidth = getNearestPowerOfTwo(width);
        const newHeight = getNearestPowerOfTwo(height);

        console.log(`Fixing ${file}: ${width}x${height} -> ${newWidth}x${newHeight}`);
        
        await sharp(inputBuffer)
          .resize(newWidth, newHeight, { fit: 'fill' })
          .toFile(tmpPath);
          
        fs.renameSync(tmpPath, fullPath);
        console.log(`Success: ${file}`);
      } else {
        console.log(`Skipping ${file} - Already POT: ${width}x${height}`);
      }
    } catch (error: unknown) {
      console.error(`Error with ${file}: ${error instanceof Error ? error.message : String(error)}`);
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }
}

fix().then(() => console.log('Done!'));
