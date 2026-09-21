/**
 * Infrastructure: category resolver.
 * Buckets a raw TGJU-style symbol key into one of the app's display
 * categories purely from its key shape (prefix / known-name match).
 * Kept isomorphic (no browser/Node API) so both the client and the
 * server-side fetch script can share it.
 */

export const CATEGORY = Object.freeze({
  CURRENCY: 'currency',
  GOLD_COIN: 'gold',
  CRYPTO: 'crypto',
  GLOBAL_INDEX: 'index',
  FUND: 'fund',
  OTHER: 'other',
});

export const CATEGORY_LABELS = {
  [CATEGORY.CURRENCY]: 'ارز',
  [CATEGORY.GOLD_COIN]: 'طلا و سکه',
  [CATEGORY.CRYPTO]: 'رمزارز',
  [CATEGORY.GLOBAL_INDEX]: 'شاخص و کامودیتی جهانی',
  [CATEGORY.FUND]: 'صندوق‌های کالایی',
  [CATEGORY.OTHER]: 'سایر',
};

const GOLD_COIN_KEYS = new Set([
  'geram18', 'geram24', 'geram18buy', 'geram24buy',
  'sekeb', 'sekee', 'sekeb_buy', 'sekee_buy', 'sekeb_blubber',
  'sekee_real', 'sekee_down', 'sekee_dollar',
  'retail_sekee', 'retail_sekeb', 'retail_rob', 'retail_nim', 'retail_gerami',
  'nim', 'nim_down', 'nim_blubber', 'rob', 'rob_down', 'rob_blubber',
  'gerami', 'gerami_blubber', 'mesghal', 'ons', 'ons_buy',
  'silver', 'silver_999', 'silver_925', 'platinum', 'palladium',
  'tether_gold_xaut', 'tgju_gold_irg18', 'tgju_gold_irg18_buy',
  'gold_melted_wholesale', 'gold_melted_transfer', 'goldminisize', 'gold_futures',
]);

const GLOBAL_INDEX_KEYS = new Set([
  's_p_500_us', 'nasdaq_us', 'dowjones_us', 'oil', 'oil_brent', 'oil_opec', 'bourse',
]);

export function resolveCategory(symbolKey) {
  if (symbolKey.startsWith('crypto-')) return CATEGORY.CRYPTO;
  if (symbolKey.startsWith('price_') || symbolKey === 'usd_afn_bid' || symbolKey === 'afghan_usd') {
    return CATEGORY.CURRENCY;
  }
  if (symbolKey.startsWith('ime_fund_')) return CATEGORY.FUND;
  if (GOLD_COIN_KEYS.has(symbolKey)) return CATEGORY.GOLD_COIN;
  if (GLOBAL_INDEX_KEYS.has(symbolKey)) return CATEGORY.GLOBAL_INDEX;
  return CATEGORY.OTHER;
}
