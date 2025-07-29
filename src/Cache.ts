type StorageKey = string
type StorageValue = {
	/** timestamp */
	deleteAt: number
	value: string
}

export class Cache {
	/** 10 mins - in seconds */
	public static readonly DEFAULT_TTL: number = 60 * 10
	public static readonly MAX_ALLOWED_KEYS: number = 100
	public static readonly MAX_KEY_LENGTH: number = 10
	public static readonly MAX_VALUE_LENGTH: number = 1000
	public static readonly DEFAULT_CLEANUP_INTERVAL: number = 5
	public static readonly DEFAULT_PERSIST_KEY: string = '@tacs/cache'
	private static persistedObject: Storage = localStorage

	private storage: Map<StorageKey, StorageValue> = new Map()
	private flushInterval: number
	private flushOnGet: boolean
	private maxAllowedKeys: number
	private maxKeyLength: number
	private maxValueLength: number

	constructor(params?: {
		/** interval to check for flushable keys - in seconds */
		flushInterval?: number
		/** triggers every time get() is invoked */
		flushOnGet?: boolean
		/** maximum number of keys allowed */
		maxAllowedKeys?: number
		/** maximum characters allowed for the key */
		maxKeyLength?: number
		/** maximum characters allowed for the value */
		maxValueLength?: number
		preloadKey?: string | boolean
	}) {
		this.maxAllowedKeys = params?.maxAllowedKeys ?? Cache.MAX_ALLOWED_KEYS
		this.maxKeyLength = params?.maxKeyLength ?? Cache.MAX_KEY_LENGTH
		this.maxValueLength = params?.maxValueLength ?? Cache.MAX_VALUE_LENGTH
		this.flushOnGet = !!params?.flushOnGet

		this.flushInterval = setInterval(() => {
			// O(n)
			this.storage.keys().forEach(key => {
				if (this.isFlushable(key)) {
					this.flush(key)
				}
			})
		}, (params?.flushInterval ?? Cache.DEFAULT_CLEANUP_INTERVAL) * 1000)

		if (params?.preloadKey) {
			const preloadKey = typeof params.preloadKey === 'boolean' ? Cache.DEFAULT_PERSIST_KEY : params.preloadKey
			const preloadData = Cache.persistedObject.getItem(preloadKey)
			if (!preloadData) {
				throw new Error(`No preload data was found in ${preloadKey}`)
			}

			this.storage = new Map(JSON.parse(preloadData))
		}
	}

	private isFlushable(key: StorageKey): boolean {
		const value = this.storage.get(key)
		if (!value) {
			return false
		}

		return new Date().getTime() >= value.deleteAt
	}

	public get(key: StorageKey): StorageValue['value'] | undefined {
		if (!this.storage.has(key)) {
			return undefined
		}

		if (this.flushOnGet && this.isFlushable(key)) {
			this.flush(key)
			return undefined
		}

		return this.storage.get(key)!.value
	}

	/**
	 * @param key 
	 * @param value 
	 * @param ttl in seconds
	 */
	public set(
		key: StorageKey,
		value: StorageValue['value'],
		options?: {
			replace?: boolean
			/** in seconds */
			ttl?: number
		}
	): void {
		if (key.length > this.maxKeyLength) {
			throw new Error(`The key must be a string with a maximum of ${this.maxKeyLength} characters`)
		}

		if (value.length > this.maxValueLength) {
			throw new Error(`The value must be a string with a maximum of ${this.maxValueLength} characters`)
		}

		if (this.storage.size >= this.maxAllowedKeys) {
			throw new Error('No more keys allowed')
		}

		const force = options && options.replace
		if (!force && this.storage.has(key)) {
			throw new Error('This key already exists, if you wish to replace, please set the options.replace=true')
		}

		const ttl = options?.ttl ?? Cache.DEFAULT_TTL
		try {
			this.storage.set(key, {
				deleteAt: new Date().setSeconds(new Date().getSeconds() + ttl),
				value,
			})
		} catch (ex) {
			const e = ex as Error
			throw new Error(`No more memory: ${e.message}`)
		}
	}

	public flush(key: StorageKey): void {
		this.storage.delete(key)
	}

	public flushAll(): void {
		this.storage.clear()
	}

	public getAll() {
		return this.storage
	}

	public destroy(): void {
		clearInterval(this.flushInterval)
		this.storage = new Map()
	}

	public persist(key?: string): void {
		Cache.persistedObject.setItem(key ?? Cache.DEFAULT_PERSIST_KEY, JSON.stringify(this.storage.entries().toArray()))
	}
}