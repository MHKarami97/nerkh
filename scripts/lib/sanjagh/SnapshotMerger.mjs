import { MIN_RETENTION_RATIO } from './config.mjs'

const round2 = (value) => Math.round(value * 100) / 100

function groupBy(items, key) {
  const groups = new Map()
  for (const item of items) {
    if (!groups.has(item[key])) groups.set(item[key], [])
    groups.get(item[key]).push(item)
  }
  return groups
}

/**
 * Decides, per service type, whether to trust the fresh scrape or keep the
 * previous snapshot. Nothing is ever deleted because of a failed request.
 */
export class SnapshotMerger {
  constructor({ group, source, currency, minRetentionRatio = MIN_RETENTION_RATIO }) {
    this.group = group
    this.catalog = group.types
    this.source = source
    this.currency = currency
    this.minRetentionRatio = minRetentionRatio
  }

  merge(previous, outcomes, now = new Date()) {
    const nowIso = now.toISOString()
    const previousItems = previous?.items ?? []
    const previousTypes = new Map((previous?.types ?? []).map((type) => [type.id, type]))
    const previousByType = groupBy(previousItems, 'typeId')
    const previousById = new Map(previousItems.map((item) => [`${item.typeId}:${item.id}`, item]))

    const items = []
    const types = []
    const freshTypeIds = []
    const staleTypeIds = []

    this.catalog.forEach((type, order) => {
      const outcome = outcomes.get(type.id)
      const previousOfType = previousByType.get(type.id) ?? []
      const base = { id: type.id, label: type.label, slug: type.slug, order }

      if (this.isUsable(outcome?.items, previousOfType)) {
        items.push(
          ...outcome.items.map((scraped) => this.reconcile(type, scraped, previousById.get(`${type.id}:${scraped.id}`), nowIso)),
        )
        types.push({ ...base, status: 'fresh', checkedAt: nowIso, sourceUpdatedAt: outcome.sourceUpdatedAt ?? null })
        freshTypeIds.push(type.id)
        return
      }

      if (!previousOfType.length) return
      const old = previousTypes.get(type.id)
      items.push(...previousOfType)
      types.push({ ...base, status: 'stale', checkedAt: old?.checkedAt ?? null, sourceUpdatedAt: old?.sourceUpdatedAt ?? null })
      staleTypeIds.push(type.id)
    })

    const payload = {
      source: this.source,
      groupId: this.group.id,
      currency: this.currency,
      generatedAt: nowIso,
      types,
      items,
    }

    return { payload, changed: this.fingerprint(payload) !== this.fingerprint(previous), freshTypeIds, staleTypeIds }
  }

  isUsable(scrapedItems, previousOfType) {
    if (!Array.isArray(scrapedItems) || !scrapedItems.length) return false
    if (!previousOfType.length) return true
    return scrapedItems.length >= previousOfType.length * this.minRetentionRatio
  }

  reconcile(type, scraped, previous, nowIso) {
    const item = {
      id: scraped.id,
      typeId: type.id,
      type: type.label,
      title: scraped.title,
      unit: scraped.unit,
      minPrice: scraped.minPrice,
      maxPrice: scraped.maxPrice,
      averagePrice: scraped.averagePrice,
    }

    if (!previous) return { ...item, changePercent: 0, updatedAt: nowIso }

    const unchanged = previous.minPrice === item.minPrice && previous.maxPrice === item.maxPrice
    if (unchanged) {
      return { ...item, changePercent: previous.changePercent ?? 0, updatedAt: previous.updatedAt ?? nowIso }
    }

    const changePercent =
      previous.averagePrice > 0 ? round2(((item.averagePrice - previous.averagePrice) / previous.averagePrice) * 100) : 0
    return { ...item, changePercent, updatedAt: nowIso }
  }

  fingerprint(snapshot) {
    if (!snapshot) return ''
    return JSON.stringify({
      items: snapshot.items ?? [],
      types: (snapshot.types ?? []).map(({ id, status }) => [id, status]),
    })
  }
}
