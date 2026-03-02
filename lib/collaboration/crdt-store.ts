/**
 * Simplified CRDT-like store for conflict-free state merging.
 * Uses a last-writer-wins (LWW) register per key with lamport timestamps.
 */

export interface CRDTEntry<T = unknown> {
  value: T;
  timestamp: number;
  author: string;
}

export class CRDTStore {
  private state = new Map<string, CRDTEntry>();

  set<T>(key: string, value: T, author: string): void {
    const existing = this.state.get(key);
    const ts = Date.now();
    if (!existing || ts >= existing.timestamp) {
      this.state.set(key, { value, timestamp: ts, author });
    }
  }

  get<T = unknown>(key: string): T | undefined {
    return this.state.get(key)?.value as T | undefined;
  }

  getEntry(key: string): CRDTEntry | undefined {
    return this.state.get(key);
  }

  merge(incoming: Map<string, CRDTEntry>): string[] {
    const changed: string[] = [];
    for (const [key, entry] of incoming) {
      const existing = this.state.get(key);
      if (!existing || entry.timestamp > existing.timestamp) {
        this.state.set(key, entry);
        changed.push(key);
      }
    }
    return changed;
  }

  snapshot(): Map<string, CRDTEntry> {
    return new Map(this.state);
  }

  keys(): string[] {
    return Array.from(this.state.keys());
  }

  delete(key: string): boolean {
    return this.state.delete(key);
  }

  clear(): void {
    this.state.clear();
  }
}
