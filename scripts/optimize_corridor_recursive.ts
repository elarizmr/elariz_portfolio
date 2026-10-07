import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = './public/textures/corridor';
const BACKUP_BASE_DIR = './public/textures/corridor/backups';

function getDownscalePowerOfTwo(n: number | undefined): number {
  const pots = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
  if (n === undefined) return pots[0];
  let best = pots[0];
  for (let p of pots) {
    if (p <= n) best = p;
    else break;
  }
  return best;
}

const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
  const files = fs.readdirSync(dirPath);
  files.forEach((file: string) => {
    if (file === 'backups') return; // Skip backup dir
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.match(/\.(webp|jpg|jpeg|png)$/i)) arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
};

async function optimize(): Promise<void> {
  const allFiles = getAllFiles(ROOT_DIR);
  console.log(`Recursively optimizing ${allFiles.length} files in Corridor (Downgrade Strategy)...`);

  for (const fullPath of allFiles) {
    const relPath = path.relative(ROOT_DIR, fullPath);
    const backupPath = path.join(BACKUP_BASE_DIR, relPath);
    const backupDir = path.dirname(backupPath);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
      const inputBuffer = fs.readFileSync(fullPath);
      const metadata = await sharp(inputBuffer).metadata();
      const { width, height } = metadata;

      const newWidth = getDownscalePowerOfTwo(width);
      const newHeight = getDownscalePowerOfTwo(height);

      if (newWidth !== width || newHeight !== height) {
        console.log(`Downgrading ${relPath}: ${width}x${height} -> ${newWidth}x${newHeight}`);
        
        // Backup if not exists
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(fullPath, backupPath);
        }

        const tmpPath = fullPath + '.tmp_corridor.webp';
        await sharp(inputBuffer)
          .resize(newWidth, newHeight, { fit: 'fill' })
          .webp({ quality: 85 })
          .toFile(tmpPath);
          
        fs.renameSync(tmpPath, fullPath);
        console.log(`Success: ${relPath}`);
      } else {
        console.log(`Skipping ${relPath} - Already POT: ${width}x${height}`);
      }
    } catch (error: unknown) {
      console.error(`Error with ${relPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

optimize().then(() => console.log('Recursive Corridor Optimization complete!'));
