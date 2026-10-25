export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function withRetry(task, { attempts = 2, baseDelayMs = 3000, shouldRetry = () => true, onRetry = () => {} } = {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task(attempt)
    } catch (error) {
      lastError = error
      if (attempt === attempts || !shouldRetry(error)) break
      onRetry(error, attempt)
      await sleep(baseDelayMs * 2 ** (attempt - 1))
    }
  }
  throw lastError
}
