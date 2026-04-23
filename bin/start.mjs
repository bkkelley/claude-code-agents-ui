#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { resolve, dirname, join } from 'node:path'
import { existsSync, cpSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outputServer = resolve(root, '.output', 'server', 'index.mjs')

if (!existsSync(outputServer)) {
  console.log('Building agents-ui...')
  execSync('npx nuxi build', { cwd: root, stdio: 'inherit' })
}

// --- node-pty native-binary safety net ---
// Nitro's tracer can miss node-pty's dynamically-loaded prebuilds/build binaries.
// If the built output is missing native files, copy them from the source node_modules.
ensureNodePtyNative()

const port = process.env.PORT || 3030
process.env.PORT = String(port)
process.env.HOST = process.env.HOST || '0.0.0.0'

console.log(`Starting agents-ui on http://localhost:${port}`)

import(outputServer)

function ensureNodePtyNative() {
  const src = resolve(root, 'node_modules', 'node-pty')
  const dst = resolve(root, '.output', 'server', 'node_modules', 'node-pty')
  if (!existsSync(src)) return // nothing to copy from

  const hasPrebuild = dirHasFile(join(dst, 'prebuilds'), 'pty.node') ||
                      existsSync(join(dst, 'build', 'Release', 'pty.node'))
  if (hasPrebuild) return

  try {
    mkdirSync(dirname(dst), { recursive: true })
    // Mirror the entire node-pty directory — preserves prebuilds/, build/, lib/.
    cpSync(src, dst, { recursive: true, force: true })
    console.log('[agents-ui] Restored node-pty native binaries into .output/')
  } catch (err) {
    console.warn('[agents-ui] Failed to copy node-pty native files:', err.message)
  }
}

function dirHasFile(dir, filename) {
  if (!existsSync(dir)) return false
  try {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry)
      if (statSync(p).isDirectory()) {
        if (dirHasFile(p, filename)) return true
      } else if (entry === filename) {
        return true
      }
    }
  } catch {}
  return false
}
