import { getPriceHistoryRange, putPriceHistory } from './db.js';

export const HISTORY_RANGES = ['week', 'month', 'year', 'all'];

const RANGE_DAYS = { week: 7, month: 30, year: 365, all: Infinity };
const MAX_DATE_KEY = '9999-12-31';
const MIN_DATE_KEY = '0000-01-01';
const DAY_MS = 86400000;

export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class PriceHistoryRecorder {
  #lastSaved = new Map();

  async record(assets, now = new Date()) {
    const date = toLocalDateKey(now);
    const timestamp = now.toISOString();
    const pending = [];

    for (const asset of assets) {
      if (!Number.isFinite(asset.price) || asset.price <= 0) continue;
      const signature = `${date}|${asset.price}`;
      if (this.#lastSaved.get(asset.symbol) === signature) continue;
      pending.push({ symbol: asset.symbol, date, price: asset.price, t: timestamp });
    }

    if (pending.length === 0) return;

    await putPriceHistory(pending);
    for (const entry of pending) {
      this.#lastSaved.set(entry.symbol, `${entry.date}|${entry.price}`);
    }
  }
}

export const priceHistoryRecorder = new PriceHistoryRecorder();

export async function getSymbolHistory(symbol, range = 'month', now = new Date()) {
  const days = RANGE_DAYS[range] ?? RANGE_DAYS.month;
  const from = Number.isFinite(days)
    ? toLocalDateKey(new Date(now.getTime() - (days - 1) * DAY_MS))
    : MIN_DATE_KEY;

  const rows = await getPriceHistoryRange(symbol, from, MAX_DATE_KEY);
  return rows.map((row) => ({
    date: row.date,
    t: new Date(`${row.date}T12:00:00`).getTime(),
    p: row.price,
  }));
}