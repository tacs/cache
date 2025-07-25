type StorageKey = string
type StorageValue = {
	/** timestamp */
	deleteAt: number
	value: string
}

export class Cache {
	static readonly DEFAULT_TTL: number = 10
	static readonly MAX_ALLOWED_KEYS: number = 3
	
	private storage: Record<StorageKey, StorageValue> = {}
	private intervalChecker: number
	private maxAllowedKeys: number
	private numberOfKeys: number = 0

	constructor(params?: {
		maxAllowedKeys?: number
	}) {
		this.maxAllowedKeys = params?.maxAllowedKeys ?? Cache.MAX_ALLOWED_KEYS

		this.intervalChecker = setInterval(() => {
			for (const key of Object.keys(this.storage)) {
				if (this.isFlushable(key)) {
					this.flush(key)
				}
			}
		}, 1000)
	}

	private isFlushable(key: StorageKey): boolean
	private isFlushable(val: StorageValue): boolean
	private isFlushable(keyOrVal: StorageKey | StorageValue): boolean {
		const value = typeof keyOrVal === 'string' ? this.storage[keyOrVal] : keyOrVal
		return new Date().getTime() >= value.deleteAt
	}

	public get(key: StorageKey): StorageValue['value'] {
		return this.storage[key]?.value
	}

	/**
	 * @param key 
	 * @param value 
	 * @param ttl in seconds
	 */
	public set(key: StorageKey, value: StorageValue['value'], ttl?: number) {
		if (this.numberOfKeys >= this.maxAllowedKeys) {
			throw new Error('No more keys allowed')
		}

		ttl = ttl ?? Cache.DEFAULT_TTL

		this.storage[key] = {
			deleteAt: new Date().setSeconds(new Date().getSeconds() + ttl),
			value,
		}
		this.numberOfKeys++
	}

	public flush(key: StorageKey) {
		delete this.storage[key]
		this.numberOfKeys--
	}

	public flushAll() {
		this.storage = {}
		this.numberOfKeys = 0
	}

	public getAll() {
		return this.storage
	}

	public stop() {
		clearInterval(this.intervalChecker)
	}
}