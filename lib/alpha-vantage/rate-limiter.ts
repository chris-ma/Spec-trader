export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sequential<T>(
  tasks: Array<() => Promise<T>>,
  delayMs = 12000
): Promise<Array<{ result: T | null; error: string | null }>> {
  const results: Array<{ result: T | null; error: string | null }> = [];
  for (let i = 0; i < tasks.length; i++) {
    try {
      const result = await tasks[i]();
      results.push({ result, error: null });
    } catch (err) {
      results.push({ result: null, error: err instanceof Error ? err.message : String(err) });
    }
    if (i < tasks.length - 1) await delay(delayMs);
  }
  return results;
}
