interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

export class ConcurrencyLimiter {
  private running = 0;
  private readonly queue: QueuedTask<any>[] = [];

  constructor(private readonly maxConcurrent: number) {
    if (!Number.isFinite(maxConcurrent) || maxConcurrent < 1) {
      throw new Error(`Invalid maxConcurrent value: ${maxConcurrent}`);
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift() as QueuedTask<any>;
    this.running += 1;

    void next.fn()
      .then((value) => {
        this.running -= 1;
        next.resolve(value);
        this.processQueue();
      })
      .catch((error) => {
        this.running -= 1;
        next.reject(error);
        this.processQueue();
      });
  }
}
