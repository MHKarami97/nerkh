import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BlockedError } from './errors.mjs'
import { GroupSyncJob } from './GroupSyncJob.mjs'
import { PriceRowParser } from './PriceRowParser.mjs'
import { RequestThrottle } from './RequestThrottle.mjs'
import { SnapshotMerger } from './SnapshotMerger.mjs'

const group = {
  id: 'g',
  types: [
    { id: 'a', label: 'الف', slug: 'a' },
    { id: 'b', label: 'ب', slug: 'b' },
    { id: 'c', label: 'ج', slug: 'c' },
  ],
}
const merger = () => new SnapshotMerger({ group, source: 'sanjagh', currency: 'تومان' })
const item = (id, min, max) => ({ id, title: id, unit: 'هر سرویس', minPrice: min, maxPrice: max, averagePrice: Math.round((min + max) / 2) })
const NOW = new Date('2026-10-25T00:00:00Z')
const silent = { log() {}, warn() {}, error() {} }

test('parser reads unit and range from Persian digits', () => {
  const { items } = new PriceRowParser().parse([
    ['شرح خدمت', 'قیمت میانه ی بازار (تومان)'],
    ['تعمیر یا تعویض LCD', 'هر عدد ۱٬۰۰۰٬۰۰۰ - ۲٬۵۰۰٬۰۰۰'],
  ])
  assert.deepEqual(items, [
    { id: 'تعمیر-یا-تعویض-LCD', title: 'تعمیر یا تعویض LCD', unit: 'هر عدد', minPrice: 1000000, maxPrice: 2500000, averagePrice: 1750000 },
  ])
})

test('parser skips percentage rows, collapses desktop/mobile copies, keeps distinct same-title rows', () => {
  const rows = [
    ['تعمیر یا تعویض هارد', 'کل کار ۱۰% - ۳۵%'],
    ['ایاب و ذهاب', 'هر سرویس ۲۶۱٬۰۰۰ - ۳۴۵٬۰۰۰'],
    ['ایاب و ذهاب', 'هر سرویس ۲۶۱٬۰۰۰ - ۳۴۵٬۰۰۰'],
    ['نصب', 'هر عدد ۱۰۰ - ۲۰۰'],
    ['نصب', 'هر عدد ۳۰۰ - ۴۰۰'],
    ['الف', 'جلسه‌ای ۲۰۰٬۰۰۰'],
    ['ب', 'هر سرویس ۹۰۰٬۰۰۰ - ۱۰۰٬۰۰۰'],
    ['فقط یک ستون'],
  ]
  const { items, skipped } = new PriceRowParser().parse(rows)
  assert.deepEqual(skipped, ['تعمیر یا تعویض هارد'])
  assert.deepEqual(items.map((i) => i.id), ['ایاب-و-ذهاب', 'نصب', 'نصب-2', 'الف', 'ب'])
  assert.deepEqual([items[3].minPrice, items[3].maxPrice, items[3].unit], [200000, 200000, 'جلسه‌ای'])
  assert.deepEqual([items[4].minPrice, items[4].maxPrice], [100000, 900000])
})

test('merge keeps previous data when a page fails', () => {
  const previous = { items: [{ ...item('x', 100, 200), typeId: 'b', updatedAt: 'old', changePercent: 0 }], types: [] }
  const outcomes = new Map([['a', { items: [item('m', 10, 20)] }], ['b', { error: new Error('boom') }]])
  const result = merger().merge(previous, outcomes, NOW)
  assert.deepEqual(result.staleTypeIds, ['b'])
  assert.ok(result.payload.items.some((i) => i.id === 'x'))
  assert.equal(result.payload.groupId, 'g')
})

test('merge rejects suspiciously small scrape', () => {
  const old = Array.from({ length: 10 }, (_, i) => ({ ...item(`i${i}`, 1, 2), typeId: 'a', updatedAt: 'old', changePercent: 0 }))
  const result = merger().merge({ items: old, types: [] }, new Map([['a', { items: [item('i0', 1, 2)] }]]), NOW)
  assert.deepEqual(result.freshTypeIds, [])
  assert.equal(result.payload.items.length, 10)
})

test('merge: unchanged => no write; moved => changePercent and new updatedAt', () => {
  const first = merger().merge(null, new Map([['a', { items: [item('m', 100, 300)] }]]), NOW)
  const later = new Date('2026-11-01T00:00:00Z')
  assert.equal(merger().merge(first.payload, new Map([['a', { items: [item('m', 100, 300)] }]]), later).changed, false)

  const moved = merger().merge(first.payload, new Map([['a', { items: [item('m', 150, 450)] }]]), later)
  assert.equal(moved.changed, true)
  assert.equal(moved.payload.items[0].changePercent, 50)
  assert.equal(moved.payload.items[0].updatedAt, later.toISOString())
})

test('throttle enforces the minimum gap between requests', async () => {
  let clock = 0
  const sleeps = []
  const throttle = new RequestThrottle({
    minGapMs: 1000,
    now: () => clock,
    sleep: async (ms) => { sleeps.push(ms); clock += ms },
  })
  await throttle.wait()
  clock += 300
  await throttle.wait()
  await throttle.wait()
  assert.deepEqual(sleeps, [700, 1000])
})

test('job stops at the first block, saves what it has and never calls remaining pages', async () => {
  const calls = []
  const scraper = {
    async scrape(type) {
      calls.push(type.id)
      if (type.id === 'b') throw new BlockedError('u', 429)
      return { items: [item('r', 1, 3)], skipped: [], sourceUpdatedAt: null }
    },
  }
  let saved = null
  const store = { read: async () => null, write: async (payload) => { saved = payload } }
  const summary = await new GroupSyncJob({ group, scraper, merger: merger(), store, logger: silent }).run()

  assert.deepEqual(calls, ['a', 'b'])
  assert.equal(summary.blocked, true)
  assert.equal(summary.written, true)
  assert.deepEqual(saved.types.map((t) => t.id), ['a'])
})

test('job does not touch the store when every page fails', async () => {
  const scraper = { scrape: async () => { throw new Error('down') } }
  let writes = 0
  const store = { read: async () => ({ items: [], types: [] }), write: async () => { writes++ } }
  const job = new GroupSyncJob({ group, scraper, merger: merger(), store, logger: silent })
  const summary = await job.run()
  assert.equal(writes, 0)
  assert.deepEqual(summary.freshTypeIds, [])
})
