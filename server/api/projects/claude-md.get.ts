import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveHome } from '../../utils/path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = query.path as string

  if (!path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  const expandedPath = resolveHome(path)
  const claudeMdPath = join(expandedPath, 'CLAUDE.md')

  if (!existsSync(claudeMdPath)) {
    return { exists: false, content: '', path: claudeMdPath }
  }

  try {
    const content = await readFile(claudeMdPath, 'utf-8')
    return { exists: true, content, path: claudeMdPath }
  } catch (e) {
    console.error(`Failed to read CLAUDE.md for ${path}:`, e)
    return { exists: false, content: '', path: claudeMdPath }
  }
})
