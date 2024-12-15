interface Constructor<T> {
  update: () => Promise<T>;
  ttl: number;
}

export class MemoryCache<T> {
  private state?: T;
  private ttl: number;
  private lastUpdatedAt: number;
  private updater: () => Promise<T>;

  constructor({ update, ttl }: Constructor<T>) {
    this.ttl = ttl;
    this.lastUpdatedAt = Date.now();
    this.updater = update;
  }

  private isOutdated = () => {
    return Date.now() - this.lastUpdatedAt >= this.ttl;
  };

  update = async () => {
    try {
      this.state = await this.updater();
      this.lastUpdatedAt = Date.now();
    } catch (e) {
      console.error("Failed to update cache: ", e);
    }
  };

  read = async (): Promise<T | undefined> => {
    if (!this.state || this.isOutdated()) {
      await this.update();
    }

    return this.state;
  };
}

export interface UserDataStreamState {
  requestKey: string;
  isAborted: boolean;
}
