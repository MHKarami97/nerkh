/**
 * Infrastructure: browser persistence (IndexedDB via the tiny `idb` wrapper).
 * Two concerns live here:
 *  - `assets`/`meta`: the live price cache read on startup so the UI paints
 *    instantly (no network round-trip needed before first render).
 *  - `historyDays`: cached daily history snapshots (see services/history.js).
 *    Currently unused while history collection is disabled server-side,
 *    but kept so it's a no-op re-enable later.
 */
import { openDB } from 'idb'
import { DEFAULT_FAVORITE_SYMBOLS } from './pinnedSymbols.js'

const DB_NAME = 'nerkh-db'
const DB_VERSION = 2
const STORE_ASSETS = 'assets'
const STORE_META = 'meta'
const STORE_HISTORY = 'historyDays'

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
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          db.createObjectStore(STORE_HISTORY)
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

/** First-ever launch has no saved favorites yet, so it starts pre-populated
 *  with DEFAULT_FAVORITE_SYMBOLS; once the user saves any change of their
 *  own (even removing everything), that saved list takes over for good. */
export async function getFavorites() {
  return getMeta('favorites', DEFAULT_FAVORITE_SYMBOLS)
}

export async function setFavorites(list) {
  return setMeta('favorites', list)
}

export async function getHistoryDay(dateKey) {
  const db = await getDb()
  return db.get(STORE_HISTORY, dateKey)
}

export async function setHistoryDay(dateKey, entry) {
  const db = await getDb()
  await db.put(STORE_HISTORY, entry, dateKey)
}
