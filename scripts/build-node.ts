import { build, emptyDir } from '@deno/dnt'

const version = Deno.args[0]
if (!version?.match(/[0-9]+\.[0-9]+\.[0-9]+/)) {
	console.log('Invalid version!!')
	Deno.exit()
}

await emptyDir('./npm')

await build({
	entryPoints: ['./src/Cache.ts'],
	filterDiagnostic(diagnostic) {
		// ignore TS errors on this library
		if (diagnostic.file?.fileName.includes('/@std/assert/')) return false

		// ignore localStorage TS error
		if (diagnostic.messageText === `Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.`) return false

		return true
	},
	outDir: './npm',
	package: {
		// package.json properties
		bugs: {
			url: 'https://github.com/tacs/cache/issues',
		},
		declaration: true,
		description: 'Cache library',
		license: 'MIT',
		name: '@tacs/cache',
		repository: {
			type: 'git',
			url: 'git+https://github.com/tacs/cache.git',
		},
		test: false,
		typeCheck: true,
		version,
	},
	postBuild() {
		// steps to run after building and before running the tests
		Deno.copyFileSync('README.md', 'npm/README.md')
	},
	shims: {
		// see JS docs for overview and more options
		deno: true,
	},
})
