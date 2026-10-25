import { sleep as defaultSleep } from '../retry.mjs'

/** Guarantees a minimum (jittered) gap between two outgoing requests, even across groups. */
export class RequestThrottle {
  constructor({ minGapMs, jitterMs = 0, now = Date.now, sleep = defaultSleep, random = Math.random }) {
    this.minGapMs = minGapMs
    this.jitterMs = jitterMs
    this.now = now
    this.sleep = sleep
    this.random = random
    this.lastRequestAt = null
  }

  async wait() {
    if (this.lastRequestAt !== null) {
      const requiredGap = this.minGapMs + this.random() * this.jitterMs
      const remaining = requiredGap - (this.now() - this.lastRequestAt)
      if (remaining > 0) await this.sleep(remaining)
    }
    this.lastRequestAt = this.now()
  }
}
