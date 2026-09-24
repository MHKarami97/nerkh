#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const SOURCE_URL = 'https://stdt.ir/product-category/meat-sheep/'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'protein-sheep.json')

function toNumber(value) { const parsed = Number(String(value || '').replace(/[٬,\s]/g, '')); return Number.isFinite(parsed) ? parsed : null }
function text(value) { return value.replace(/&nbsp;/gi, ' ').replace(/&/gi, '&').replace(/"/gi, '"').replace(/'/gi, "'").replace(/&zwnj;/gi, '‌').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
function parseRow(row) { const cells = (row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map(text); if (cells.length < 2) return null; const priceCell = cells.find(cell => /تومان/.test(cell) && /[\d۰-۹]/.test(cell)); const price = toNumber((priceCell || '').match(/[\d٬,]+/)?.[0]); if (!price || price <= 0) return null; const title = cells.find(cell => cell && cell !== priceCell && !/تومان|کیلو|گرم|تازه|داخلی|وارداتی|سرد|گرمسیری|سردسیری/i.test(cell)) || cells[0]; if (!title) return null; return { title, freshness: cells.find(cell => /تازه|منجمد|سرد/.test(cell)) || null, origin: cells.find(cell => /داخلی|وارداتی/.test(cell)) || null, unit: cells.find(cell => /کیلو|گرم/.test(cell)) || null, price } }
async function renderPage() { const browser = await chromium.launch({ headless: true }); try { const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' }); await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }); try { await page.waitForFunction(() => document.body.innerText.includes('تومان'), { timeout: 20000 }) } catch { await page.waitForTimeout(4000) }; return await page.content() } finally { await browser.close() } }
async function main() { const html = await renderPage(); const sourceUpdatedAt = text(html).match(/([۰-۹\d]{1,2}\s+[\u0600-\u06FF]+\s+[۰-۹\d]{4})/)?.[1] || null; const items = html.split(/<tr[^>]*>/).map(parseRow).filter(Boolean); if (!items.length) throw new Error('Could not parse any non-zero sheep records'); const payload = { source: SOURCE_URL, generatedAt: new Date().toISOString(), sourceUpdatedAt, category: 'پروتئین - گوسفند', currency: 'تومان', items }; await mkdir(dirname(OUTPUT_PATH), { recursive: true }); await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n'); console.log(`[fetch-protein-sheep] wrote ${items.length} records`) }
main().catch(error => { console.error('[fetch-protein-sheep] failed:', error); process.exitCode = 1 })
