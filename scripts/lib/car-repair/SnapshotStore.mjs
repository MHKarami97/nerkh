import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export class SnapshotStore {
  constructor(filePath) {
    this.filePath = filePath
  }

  async read() {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
  }

  async write(payload) {
    await mkdir(dirname(this.filePath), { recursive: true })
    const tempPath = `${this.filePath}.tmp`
    await writeFile(tempPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
    await rename(tempPath, this.filePath)
  }
}
