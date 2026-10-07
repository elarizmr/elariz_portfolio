import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const targetDir = './public/textures/gallery';
const potValues: number[] = [64, 128, 256, 512, 1024, 2048, 4096];

function getNearestLowerPOT(value: number): number {
    let nearest = potValues[0];
    for (let pot of potValues) {
        if (pot <= value) {
            nearest = pot;
        } else {
            break;
        }
    }
    return nearest;
}

async function optimizeFolder(): Promise<void> {
    const files = fs.readdirSync(targetDir).filter((f: string) => f.match(/\.(webp|png|jpg|jpeg)$/i));
    
    for (const file of files) {
        const filePath = path.join(targetDir, file);
        const tempPath = path.join(targetDir, `temp_${file}`);
        
        try {
            const image = sharp(filePath);
            const metadata = await image.metadata();
            
            const newWidth = getNearestLowerPOT(metadata.width ?? 0);
            const newHeight = getNearestLowerPOT(metadata.height ?? 0);
            
            console.log(`Optimizing ${file}: ${metadata.width}x${metadata.height} -> ${newWidth}x${newHeight}`);
            
            await sharp(filePath)
                .resize(newWidth, newHeight, {
                    fit: 'fill'
                })
                .webp({ quality: 80 })
                .toFile(tempPath);
            
            fs.unlinkSync(filePath);
            fs.renameSync(tempPath, filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
            
        } catch (error: unknown) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}

optimizeFolder();
