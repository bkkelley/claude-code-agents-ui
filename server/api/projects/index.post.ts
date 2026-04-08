import { existsSync } from 'node:fs'
import { addManualProject } from '../../utils/claudeCodeHistory'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path: string; displayName?: string }>(event)

  if (!body?.path?.trim()) {
    throw createError({ statusCode: 400, message: 'path is required' })
  }

  const path = body.path.trim()

  if (!existsSync(path)) {
    throw createError({ statusCode: 400, message: `Directory not found: ${path}` })
  }

  const project = await addManualProject(path, body.displayName?.trim() || undefined)
  return project
})
