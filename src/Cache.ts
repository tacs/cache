/** type for the storage key */
type StorageKey = string
/** the object stored in the Cache object to properly manage a key */
type StorageValue = {
	/** timestamp */
	deleteAt: number
	/** the value to store */
	value: string
}

/**
 * Small Cache library. It allows to persist the data in a Storage (at the moment, only localStorage is used)
 * 
 * @example
 * ```ts
 * const Cache = new Cache()
 * cache.set('hello', 'world')
 * cache.get('hello')
 * cache.destroy()
 * ```
 * 
 * @module
 */
export class Cache {
	/** 10 mins - in seconds */
	public static readonly DEFAULT_TTL: number = 60 * 10
	public static readonly MAX_ALLOWED_KEYS: number = 100
	public static readonly MAX_KEY_LENGTH: number = 10
	public static readonly MAX_VALUE_LENGTH: number = 1000
	public static readonly DEFAULT_CLEANUP_INTERVAL: number = 5
	public static readonly DEFAULT_PERSIST_KEY: string = '@tacs/cache'
	private static persistedObject: Storage = globalThis.localStorage

	private storage: Map<StorageKey, StorageValue> = new Map()
	private flushInterval: ReturnType<typeof setInterval>
	private flushOnGet: boolean
	private maxAllowedKeys: number
	private maxKeyLength: number
	private maxValueLength: number
	private persistKey?: string

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
		/** if not set, it will not persist. If set as true, it will use the DEFAULT_PERSIST_KEY, but if set as string, it will use that as the persist key  */
		persistKey?: string | boolean
	}) {
		this.maxAllowedKeys = params?.maxAllowedKeys ?? Cache.MAX_ALLOWED_KEYS
		this.maxKeyLength = params?.maxKeyLength ?? Cache.MAX_KEY_LENGTH
		this.maxValueLength = params?.maxValueLength ?? Cache.MAX_VALUE_LENGTH
		this.flushOnGet = !!params?.flushOnGet

		this.flushInterval = setInterval(() => {
			// O(n)
			for (const key of this.storage.keys()) {
				if (this.isFlushable(key)) {
					this.flush(key)
				}
			}
		}, (params?.flushInterval ?? Cache.DEFAULT_CLEANUP_INTERVAL) * 1000)

		if (params?.persistKey) {
			this.persistKey = typeof params.persistKey === 'string' ? params.persistKey : Cache.DEFAULT_PERSIST_KEY
			const persistedData = Cache.persistedObject.getItem(this.persistKey)
			if (!persistedData) {
				//throw new Error(`No persisted data was found in ${this.persistKey}`)
				return
			}

			this.storage = new Map(JSON.parse(persistedData))
		}
	}

	private isFlushable(key: StorageKey): boolean {
		const value = this.storage.get(key)
		if (!value) {
			return false
		}

		return new Date().getTime() >= value.deleteAt
	}

	/** get the value from a key */
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
	 * set a value, proving a key and an optional TTL
	 * @param key 
	 * @param value 
	 * @param ttl in seconds, by default uses DEFAULT_TTL
	 */
	public set(
		key: StorageKey,
		value: StorageValue['value'],
		options?: {
			replace?: boolean
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

	/** flushes a key */
	public flush(key: StorageKey): void {
		this.storage.delete(key)
	}

	/** flushes all keys */
	public flushAll(): void {
		this.storage.clear()
	}

	/** gets the storage object used internally to hold data */
	public getAll(): typeof this.storage {
		return this.storage
	}

	/** clears all the cache and optionally can be set to remove the persisted data */
	public destroy(includePersistedData?: boolean): void {
		clearInterval(this.flushInterval)
		this.storage.clear()

		if (includePersistedData) {
			this.destroyPersistedData()
		}
	}

	private checkPersistKey(): void {
		if (!this.persistKey) throw new Error(`persistKey is undefined, please set one through the constructor`)
	}

	/** persists all the cached data using the persistKey set in the constructor */
	public persist(): void {
		this.checkPersistKey()

		Cache.persistedObject.setItem(this.persistKey!, JSON.stringify(Array.from(this.storage.entries())))
	}

	/** remove the persistent data from the Persistent Storage */
	public destroyPersistedData(): void {
		this.checkPersistKey()

		Cache.persistedObject.removeItem(this.persistKey!)
	}
}