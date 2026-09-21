/**
 * Infrastructure: browser persistence (IndexedDB via the tiny `idb` wrapper).
 * This is the single source of truth read on startup so the UI paints
 * instantly (no network round-trip needed before first render), and the
 * write target every time a refresh succeeds.
 */
import { openDB } from 'idb'

const DB_NAME = 'nerkh-db'
const DB_VERSION = 1
const STORE_ASSETS = 'assets'
const STORE_META = 'meta'

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          db.createObjectStore(STORE_ASSETS, { keyPath: 'symbol' })
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META)
        }
      },
    })
  }
  return dbPromise
}

export async function getAllAssets() {
  const db = await getDb()
  return db.getAll(STORE_ASSETS)
}

export async function putAssets(assets) {
  const db = await getDb()
  const tx = db.transaction(STORE_ASSETS, 'readwrite')
  await Promise.all(assets.map((asset) => tx.store.put(asset)))
  await tx.done
}

export async function getMeta(key, fallback = null) {
  const db = await getDb()
  const value = await db.get(STORE_META, key)
  return value === undefined ? fallback : value
}

export async function setMeta(key, value) {
  const db = await getDb()
  await db.put(STORE_META, value, key)
}

export async function getFavorites() {
  return getMeta('favorites', [])
}

export async function setFavorites(list) {
  return setMeta('favorites', list)
}
