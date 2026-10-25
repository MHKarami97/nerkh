import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RepairPriceRowParser } from './RepairPriceRowParser.mjs'
import { SnapshotMerger } from './SnapshotMerger.mjs'

const catalog = [
  { id: 'mirror', label: 'آینه', slug: 'a' },
  { id: 'gearbox', label: 'گیربکس', slug: 'b' },
]
const merger = () => new SnapshotMerger({ catalog, source: 'sanjagh', currency: 'تومان' })
const item = (id, min, max) => ({ id, title: id, unit: 'هر سرویس', minPrice: min, maxPrice: max, averagePrice: Math.round((min + max) / 2) })
const NOW = new Date('2026-10-25T00:00:00Z')

test('parser reads unit and range from Persian digits', () => {
  const [row] = new RepairPriceRowParser().parse([
    ['شرح خدمت', 'قیمت میانه ی بازار (تومان)'],
    ['تعویض شیشه آینه', 'هر عدد ۱۵۰٬۰۰۰ - ۳۰۰٬۰۰۰'],
  ])
  assert.deepEqual(row, {
    id: 'تعویض-شیشه-آینه',
    title: 'تعویض شیشه آینه',
    unit: 'هر عدد',
    minPrice: 150000,
    maxPrice: 300000,
    averagePrice: 225000,
  })
})

test('parser handles single price, reversed range, duplicates and junk rows', () => {
  const rows = new RepairPriceRowParser().parse([
    ['الف', 'جلسه‌ای ۲۰۰٬۰۰۰'],
    ['ب', 'هر سرویس ۹۰۰٬۰۰۰ - ۱۰۰٬۰۰۰'],
    ['ب', 'هر سرویس ۱ - ۲'],
    ['توضیحات', 'بدون قیمت'],
    ['تک ستون'],
  ])
  assert.equal(rows.length, 2)
  assert.deepEqual([rows[0].minPrice, rows[0].maxPrice, rows[0].unit], [200000, 200000, 'جلسه‌ای'])
  assert.deepEqual([rows[1].minPrice, rows[1].maxPrice], [100000, 900000])
})

test('merge keeps previous data when a page fails', () => {
  const previous = { items: [{ ...item('x', 100, 200), typeId: 'gearbox', updatedAt: 'old', changePercent: 0 }], types: [] }
  const outcomes = new Map([['mirror', { items: [item('m', 10, 20)] }], ['gearbox', { error: new Error('boom') }]])
  const result = merger().merge(previous, outcomes, NOW)
  assert.deepEqual(result.staleTypeIds, ['gearbox'])
  assert.ok(result.payload.items.some((i) => i.id === 'x'))
})

test('merge rejects suspiciously small scrape', () => {
  const old = Array.from({ length: 10 }, (_, i) => ({ ...item(`i${i}`, 1, 2), typeId: 'mirror', updatedAt: 'old', changePercent: 0 }))
  const outcomes = new Map([['mirror', { items: [item('i0', 1, 2)] }]])
  const result = merger().merge({ items: old, types: [] }, outcomes, NOW)
  assert.deepEqual(result.freshTypeIds, [])
  assert.equal(result.payload.items.length, 10)
})

test('merge reports changePercent only when price moved and no change when identical', () => {
  const first = merger().merge(null, new Map([['mirror', { items: [item('m', 100, 300)] }]]), NOW)
  const same = merger().merge(first.payload, new Map([['mirror', { items: [item('m', 100, 300)] }]]), new Date('2026-11-01T00:00:00Z'))
  assert.equal(same.changed, false)

  const moved = merger().merge(first.payload, new Map([['mirror', { items: [item('m', 150, 450)] }]]), new Date('2026-11-01T00:00:00Z'))
  assert.equal(moved.changed, true)
  assert.equal(moved.payload.items[0].changePercent, 50)
  assert.equal(moved.payload.items[0].updatedAt, '2026-11-01T00:00:00.000Z')
})
