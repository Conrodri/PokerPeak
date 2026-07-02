/**
 * Generic "pre-generate + serve instantly + refill in the background" pool.
 * Used for every exercise type expensive enough to warrant pre-computation
 * (Monte Carlo equity, multi-street scenarios, etc). Refilling yields to the
 * event loop between builds (setImmediate) so a burst of pool depletion never
 * blocks concurrent requests.
 */
export interface ExercisePool<T> {
  /** Pop one item, kicking off a background refill if below threshold. Returns undefined if empty. */
  take(): T | undefined;
  /** Seed from pre-generated data (if any), then top up to target. Call once at startup. */
  init(preloaded: T[]): void;
  size(): number;
}

export function createExercisePool<T>(opts: {
  target: number;
  threshold: number;
  build: () => T;
  label: string;
}): ExercisePool<T> {
  const { target, threshold, build, label } = opts;
  const pool: T[] = [];
  let refilling = false;

  async function refill(): Promise<void> {
    if (refilling) return;
    refilling = true;
    try {
      while (pool.length < target) {
        pool.push(build());
        await new Promise(resolve => setImmediate(resolve));
      }
    } finally {
      refilling = false;
    }
  }

  return {
    take(): T | undefined {
      if (pool.length === 0) return undefined;
      const data = pool.shift()!;
      if (pool.length < threshold) {
        refill().catch(err => console.error(`[${label}] refill error:`, err));
      }
      return data;
    },
    init(preloaded: T[]): void {
      if (preloaded.length > 0) {
        pool.push(...preloaded.slice(0, target));
        console.log(`[${label}] loaded ${pool.length} pre-generated exercises from file`);
      }
      if (pool.length < target) {
        refill().catch(err => console.error(`[${label}] init error:`, err));
      }
    },
    size(): number {
      return pool.length;
    },
  };
}
