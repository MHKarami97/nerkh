/** Thrown when the site answers 403/429: the run must stop instead of hammering the server. */
export class BlockedError extends Error {
  constructor(url, status) {
    super(`blocked by source (HTTP ${status}) at ${url}`)
    this.name = 'BlockedError'
    this.status = status
  }
}
