import { toDisplayPrice } from './priceDisplay.js';

const numberFormat = new Intl.NumberFormat('fa-IR');

export function toDisplayValue(asset, rawPrice) {
  return toDisplayPrice({ ...asset, price: rawPrice }).value;
}

export function formatDisplayValue(asset, rawPrice) {
  if (rawPrice === null || rawPrice === undefined) return null;
  return numberFormat.format(Math.round(toDisplayValue(asset, rawPrice)));
}

export function getPriceRange(asset) {
  const range = asset.priceRange;
  if (!range) return null;
  return {
    min: formatDisplayValue(asset, range.min),
    average: formatDisplayValue(asset, range.average),
    max: formatDisplayValue(asset, range.max),
  };
}