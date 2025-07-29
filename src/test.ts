import { assertEquals, assertThrows } from 'jsr:@std/assert'
import { Cache } from "./Cache.ts";

Deno.test('should be able to instantiate and destroy', () => {
	const cache = new Cache()
	cache.destroy()
})

Deno.test('when setting', async t => {
	await t.step('should allow different keys', () => {
		const cache = new Cache()

		const key1 = 'tacs1'
		const value1 = 'Olá!!'
		cache.set(key1, value1)
		assertEquals(value1, cache.get(key1))
	
		const key2 = 'tacs2'
		const value2 = 'Xau!!'
		cache.set(key2, value2)
		assertEquals(value2, cache.get(key2))

		cache.destroy()
	})

	await t.step('should not allow same keys', () => {
		const cache = new Cache()

		const key = 'tacs'
		const value1 = 'Olá!!'
		cache.set(key, value1)
		assertEquals(value1, cache.get(key))
	
		const value2 = 'Xau!!'
		assertThrows(() => cache.set(key, value2))

		cache.destroy()
	})

	await t.step('should replace the value, if the key already exists and options.replace is true', () => {
		const cache = new Cache()

		const key = 'tacs'
		const value1 = 'Olá!!'
		cache.set(key, value1)
		assertEquals(value1, cache.get(key))
	
		const value2 = 'Xau!!'
		cache.set(key, value2, { replace: true })
		assertEquals(value2, cache.get(key))

		cache.destroy()
	})

	await t.step('should ', () => {
		
	})
})

Deno.test('when persisting', async t => {
	const cache = new Cache()
	const key = 'tacs'
	const value = 'Olá!!'
	cache.set(key, value)

	await t.step('should store to the default key', () => {
		cache.persist()

		const cachePersisted = new Cache({ preloadKey: true })
		assertEquals(cachePersisted.get(key), cache.get(key))
		cachePersisted.destroy()
	})

	await t.step('should store to the requested key', () => {
		const preloadKey = 'tacsy'
		cache.persist(preloadKey)
		const cachePersisted = new Cache({ preloadKey })
		assertEquals(cachePersisted.get(key), cache.get(key))
		cachePersisted.destroy()
	})

	cache.destroy()
})