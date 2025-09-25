/**
 * Fixed-capacity FIFO Ordered Map with O(1) get/set/has/delete.
 * - Maintains insertion order (new items go to the end).
 * - On inserting a *new* key and capacity is full, evicts the oldest item (FIFO).
 * - Updating an existing key does NOT change its position (this is FIFO, not LRU).
 */
export class FixedOrderedMap<K, V> {
    private map = new Map<K, V>();

    constructor(public readonly capacity: number) {
        if (!Number.isInteger(capacity) || capacity < 1) {
            throw new Error("capacity must be a positive integer");
        }
    }

    get size(): number {
        return this.map.size;
    }

    has(key: K): boolean {
        return this.map.has(key);
    }

    get(key: K): V | undefined {
        return this.map.get(key);
    }

    /**
     * Insert or update a key.
     * - If key is new and capacity is full, evict the oldest key.
     * - If key exists, updates value without changing order.
     */
    set(key: K, value: V): this {
        if (!this.map.has(key) && this.map.size === this.capacity) {
            // Evict FIFO (oldest insertion)
            const oldest = this.map.keys().next().value as K;
            // oldest is guaranteed to exist here
            this.map.delete(oldest);
        }
        this.map.set(key, value);
        return this;
    }

    delete(key: K): boolean {
        return this.map.delete(key);
    }

    clear(): void {
        this.map.clear();
    }

    /** Oldest inserted key/value without removing */
    peekOldest(): [K, V] | undefined {
        const it = this.map.entries().next();
        return it.done ? undefined : it.value;
    }

    /** Newest inserted key/value without removing */
    peekNewest(): [K, V] | undefined {
        // Iterate once; small capacity (~100) makes this trivial
        let last: [K, V] | undefined;
        for (const entry of this.map) last = entry;
        return last;
    }

    keys(): IterableIterator<K> { return this.map.keys(); }
    values(): IterableIterator<V> { return this.map.values(); }
    entries(): IterableIterator<[K, V]> { return this.map.entries(); }
    [Symbol.iterator](): IterableIterator<[K, V]> { return this.map[Symbol.iterator](); }

    /** Snapshot to array in insertion order */
    toArray(): Array<[K, V]> {
        return Array.from(this.map.entries());
    }
}
