// scripts/bump-version.ts
import { parse } from '@std/jsonc'

function bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
	const [major, minor, patch] = version.split('.').map(Number)
	if (type === 'major') return `${major + 1}.0.0`
	if (type === 'minor') return `${major}.${minor + 1}.0`
	return `${major}.${minor}.${patch + 1}`
}

const bumpType = Deno.args[0] || 'patch' // Default to patch
const configPath = 'deno.jsonc'

// Read and parse deno.jsonc
const configContent = await Deno.readTextFile(configPath)
const config = parse(configContent) as { version?: string }

// Check if version exists
if (!config.version) {
	console.error('Error: "version" key not found in deno.jsonc')
	Deno.exit(1)
}

// Bump version
const newVersion = bumpVersion(config.version, bumpType as 'major' | 'minor' | 'patch')
console.log(`Version bumped to ${newVersion}`)
const newConfigContent = configContent.replace(`"version": "${config.version}"`, `"version": "${newVersion}"`)

// Write updated config back to file
await Deno.writeTextFile(configPath, newConfigContent)