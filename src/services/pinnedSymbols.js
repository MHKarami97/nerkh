/**
 * The fixed set of assets rendered immediately on first paint (no network
 * wait, hydrated straight from IndexedDB cache). Everything else lives
 * behind the "نمایش بیشتر" (show more) button so the home page stays fast.
 *
 * Order here is the display order of the pinned grid.
 */
export const PINNED_SYMBOLS = [
  'geram18',
  'geram24',
  'price_dollar_rl',
  'price_eur',
  'price_gbp',
  'sekee',
  'sekeb',
  'crypto-bitcoin-irr',
  'crypto-tether-irr',
  'crypto-ethereum-irr',
];

export const PINNED_SYMBOL_SET = new Set(PINNED_SYMBOLS);
