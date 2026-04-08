import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveHome } from '../../utils/path'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { path, content } = body

  if (!path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  if (typeof content !== 'string') {
    throw createError({ statusCode: 400, message: 'Content is required' })
  }

  const expandedPath = resolveHome(path)
  const claudeMdPath = join(expandedPath, 'CLAUDE.md')

  try {
    await writeFile(claudeMdPath, content, 'utf-8')
    return { success: true, path: claudeMdPath }
  } catch (e: any) {
    console.error(`Failed to write CLAUDE.md for ${path}:`, e)
    throw createError({ statusCode: 500, message: `Failed to save CLAUDE.md: ${e.message}` })
  }
})
