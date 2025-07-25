type StorageKey = string
type StorageValue = {
	/** timestamp */
	deleteAt: number
	value: string
}

export class Cache {
	private storage: Record<StorageKey, StorageValue> = {}

	constructor() {
		setInterval(() => {
			for (const key of Object.keys(this.storage)) {
				if (this.isFlushable(key)) {
					this.flush(key)
				}
			}
		}, 1000)
	}

	private isFlushable(key: StorageKey): boolean
	private isFlushable(val: StorageValue): boolean
	private isFlushable(keyOrVal: StorageKey | StorageValue): boolean{
		const value = typeof keyOrVal === 'string' ? this.storage[keyOrVal] : keyOrVal
		return new Date().getTime() >= value.deleteAt
	}

	public get(key: StorageKey): StorageValue['value'] {
		return this.storage[key].value
	}

	public set(key: StorageKey, value: StorageValue['value'], ttl?: number) {
		ttl = ttl ?? 60

		this.storage[key] = {
			deleteAt: new Date().setSeconds(new Date().getSeconds() + ttl),
			value,
		}
	}

	public flush(key: StorageKey) {
		delete this.storage[key];
	}

	public flushAll() {
		this.storage = {}
	}
}