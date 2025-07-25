import { assertEquals } from 'jsr:@std/assert'
import { Cache } from "./Cache.ts";

Deno.test('should store and retrieve', () => {
	const cache = new Cache()

	const key1 = 'tacs'
	const value1 = 'Olá!!'
	cache.set(key1, value1)
	assertEquals(value1, cache.get(key1))

	const key2 = 'tacs'
	const value2 = 'Olá!!'
	cache.set(key1, value2)
	assertEquals(value2, cache.get(key2))

	cache.stop()
})