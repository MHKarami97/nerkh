export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function withRetry(task, { attempts = 3, baseDelayMs = 2000, onRetry = () => {} } = {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task(attempt)
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      onRetry(error, attempt)
      await sleep(baseDelayMs * 2 ** (attempt - 1))
    }
  }
  throw lastError
}
