import { openDB } from 'idb';
import { DEFAULT_FAVORITE_SYMBOLS } from './pinnedSymbols.js';

const DB_NAME = 'nerkh-db';
const DB_VERSION = 3;
const STORE_ASSETS = 'assets';
const STORE_META = 'meta';
const STORE_PRICE_HISTORY = 'priceHistory';
const LEGACY_STORE_HISTORY = 'historyDays';

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          db.createObjectStore(STORE_ASSETS, { keyPath: 'symbol' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
        if (db.objectStoreNames.contains(LEGACY_STORE_HISTORY)) {
          db.deleteObjectStore(LEGACY_STORE_HISTORY);
        }
        if (!db.objectStoreNames.contains(STORE_PRICE_HISTORY)) {
          db.createObjectStore(STORE_PRICE_HISTORY, { keyPath: ['symbol', 'date'] });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllAssets() {
  const db = await getDb();
  return db.getAll(STORE_ASSETS);
}

export async function putAssets(assets) {
  const db = await getDb();
  const tx = db.transaction(STORE_ASSETS, 'readwrite');
  await Promise.all([...assets.map((asset) => tx.store.put(asset)), tx.done]);
}

export async function getMeta(key, fallback = null) {
  const db = await getDb();
  const value = await db.get(STORE_META, key);
  return value === undefined ? fallback : value;
}

export async function setMeta(key, value) {
  const db = await getDb();
  await db.put(STORE_META, value, key);
}

// Only a browser that has never saved favorites receives defaults.
// Any saved array, including an empty one, belongs to the user and is retained.
export async function getFavorites() {
  return getMeta('favorites', DEFAULT_FAVORITE_SYMBOLS);
}

export async function setFavorites(list) {
  return setMeta('favorites', list);
}

export async function putPriceHistory(entries) {
  const db = await getDb();
  const tx = db.transaction(STORE_PRICE_HISTORY, 'readwrite');
  await Promise.all([...entries.map((entry) => tx.store.put(entry)), tx.done]);
}

export async function getPriceHistoryRange(symbol, fromDate, toDate) {
  const db = await getDb();
  const range = IDBKeyRange.bound([symbol, fromDate], [symbol, toDate]);
  return db.getAll(STORE_PRICE_HISTORY, range);
}