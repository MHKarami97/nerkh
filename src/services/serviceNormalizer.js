const RIAL_PER_TOMAN = 10
const HEADLINE_RANK = 1000

const toRial = (toman) => (Number.isFinite(toman) ? toman * RIAL_PER_TOMAN : null)

function changeDirectionFromPercent(percent) {
  if (!Number.isFinite(percent) || percent === 0) return 'neutral'
  return percent > 0 ? 'up' : 'down'
}

/**
 * The first row of every service type is a "headline" row and sorts before all
 * other rows, so the 4 pinned cards cover 4 different service types.
 */
function buildSortOrder(typeOrder, rowIndex) {
  return rowIndex === 0 ? typeOrder : HEADLINE_RANK + typeOrder * HEADLINE_RANK + rowIndex
}

/**
 * `foodMeta` is reused on purpose: AssetCard and AssetDetailView already render
 * `foodMeta.unit` and `foodMeta.updatedLabel`, so no UI file needs to change.
 * Here `updatedLabel` carries the service type (e.g. "جلوبندی").
 */
export function normalizeServicePayload(payload, category, prefix) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  const typeOrderById = new Map((payload?.types ?? []).map((type) => [type.id, type.order ?? 0]))
  const rowCounters = new Map()

  return items
    .filter((item) => item?.title && Number.isFinite(item.averagePrice))
    .map((item) => {
      const rowIndex = rowCounters.get(item.typeId) ?? 0
      rowCounters.set(item.typeId, rowIndex + 1)

      return {
        symbol: `service:${prefix}:${item.typeId}:${item.id}`,
        label: item.title,
        category,
        price: toRial(item.averagePrice),
        changePercent: item.changePercent ?? 0,
        changeDirection: changeDirectionFromPercent(item.changePercent),
        unit: 'ریال',
        updatedAt: item.updatedAt ?? payload.generatedAt,
        source: payload.source ?? 'sanjagh',
        sortOrder: buildSortOrder(typeOrderById.get(item.typeId) ?? 0, rowIndex),
        priceRange: {
          min: toRial(item.minPrice),
          average: toRial(item.averagePrice),
          max: toRial(item.maxPrice),
        },
        foodMeta: { unit: item.unit ?? '', updatedLabel: item.type ?? '' },
      }
    })
}
