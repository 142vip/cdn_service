import path from 'path'
import fs from 'fs/promises'

async function printDirectoryTree(dir, level = 0) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = await fs.lstat(fullPath);
      const indent = '  '.repeat(level);
      console.log(`${indent}${file}`);
      if (stats.isDirectory()) {
        await printDirectoryTree(fullPath, level + 1);
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${dir}`, error);
  }
}
