import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECTS_DIR = path.resolve(__dirname, 'public/projects')
const BACKUP_DIR = path.resolve(__dirname, 'backups/projects_original')

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function restoreDirectory(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      ensureDirSync(destPath)
      restoreDirectory(srcPath, destPath)
    } else {
      ensureDirSync(path.dirname(destPath))
      fs.copyFileSync(srcPath, destPath)
      console.log(`Restored: ${path.relative(BACKUP_DIR, srcPath)}`)

      // If an optimized webp version was created for this image, remove it to return to original state
      if (/\.(jpe?g|png)$/i.test(entry.name)) {
        const parsed = path.parse(destPath)
        const webpPath = path.join(parsed.dir, `${parsed.name}.webp`)
        if (fs.existsSync(webpPath)) {
          fs.unlinkSync(webpPath)
        }
      }
    }
  }
}

function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('No backup directory found at', BACKUP_DIR)
    process.exit(1)
  }

  console.log('Restoring original assets from', BACKUP_DIR, 'to', PROJECTS_DIR)
  restoreDirectory(BACKUP_DIR, PROJECTS_DIR)
  console.log('Restore complete!')
}

main()
