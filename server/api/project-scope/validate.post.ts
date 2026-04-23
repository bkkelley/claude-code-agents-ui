import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawPath: string = body?.path || ''

  if (!rawPath) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  // Expand ~ to home directory
  const resolvedPath = rawPath.startsWith('~')
    ? join(homedir(), rawPath.slice(1))
    : rawPath

  if (!existsSync(resolvedPath)) {
    throw createError({ statusCode: 400, message: 'Directory does not exist' })
  }

  const claudeDir = join(resolvedPath, '.claude')
  if (!existsSync(claudeDir)) {
    throw createError({ statusCode: 400, message: 'No .claude directory found in this path' })
  }

  return { valid: true, resolvedPath }
})
