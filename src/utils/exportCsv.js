const jalaliLatinFormat = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toJalaliKey(timestamp) {
  const parts = Object.fromEntries(jalaliLatinFormat.formatToParts(timestamp).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function escapeCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toFileName(raw) {
  return raw.replace(/[^\w\u0600-\u06FF-]+/g, '_').replace(/^_+|_+$/g, '') || 'prices';
}

/** rows: [{ date: 'YYYY-MM-DD', t: number, value: number }] */
export function buildPriceCsv(rows, unit) {
  const lines = ['date,jalali_date,value,unit'];
  for (const row of rows) {
    lines.push([row.date, toJalaliKey(row.t), row.value, escapeCell(unit)].join(','));
  }
  return lines.join('\r\n');
}

export function downloadPriceCsv(baseName, rows, unit) {
  // BOM so Excel opens Persian text as UTF-8
  const blob = new Blob(['\ufeff', buildPriceCsv(rows, unit)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${toFileName(baseName)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
