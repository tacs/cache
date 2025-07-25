import { Cache } from "./Cache.ts";

const TTL_OFFSET = 1

const cache = new Cache()

const key1 = 'tacs'
const value1 = 'olá!!'
cache.set(key1, value1)
console.assert(cache.get(key1) === value1, 'get(key1) failed')
setTimeout(() => {
	console.assert(cache.get(key1) === undefined, 'get(key1) after TTL failed')
}, (Cache.DEFAULT_TTL + TTL_OFFSET) * 1000)

const key2 = 'tacs2'
const value2 = 'xau!'
const ttl2 = 5
cache.set(key2, value2, ttl2)
console.assert(cache.get(key2) === value2, 'get(key2) failed')
setTimeout(() => {
	console.assert(cache.get(key2) === undefined, 'get(key2) after TTL failed')
}, (ttl2 + TTL_OFFSET) * 1000)

console.log(cache.getAll())

setTimeout(() => Deno.exit(), 15000)