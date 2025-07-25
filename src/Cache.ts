type StorageKey = string
type StorageValue = string

export class Cache {
	private storage: Record<StorageKey, StorageValue> = {}

	public get(key: StorageKey): StorageValue {
		return this.storage[key]
	}

	public set(key: StorageKey, value: StorageValue) {
		this.storage[key] = value
	}

	public flush(key: StorageKey) {
		delete this.storage[key];
	}

	public flushAll() {
		this.storage = {}
	}
}