type StorageKey = string
type StorageValue = {
	/** in seconds */
	ttl: number
	value: string
}

export class Cache {
	private storage: Record<StorageKey, StorageValue> = {}

	public get(key: StorageKey): StorageValue['value'] {
		return this.storage[key].value
	}

	public set(key: StorageKey, value: StorageValue['value'], ttl?: number) {
		ttl = (ttl ?? 60) * 1000
		this.storage[key] = {
			ttl,
			value,
		}

		setTimeout(() => {
			this.flush(key)
		}, ttl)
	}

	public flush(key: StorageKey) {
		delete this.storage[key];
	}

	public flushAll() {
		this.storage = {}
	}
}