import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../../utils/claudeDir'
import { parseFrontmatter } from '../../utils/frontmatter'
import { decodeAgentSlug, resolveAgentFilePath } from '../../utils/agentUtils'
import type { AgentFrontmatter } from '~/types'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const filePath = resolveAgentFilePath(slug)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: `Agent not found: ${slug}` })
  }

  const [raw, fileStat] = await Promise.all([
    readFile(filePath, 'utf-8'),
    stat(filePath),
  ])
  const { frontmatter, body } = parseFrontmatter<AgentFrontmatter>(raw)
  const { directory } = decodeAgentSlug(slug)
  const memoryDir = resolveClaudePath('agent-memory', slug)

  return {
    slug,
    filename: `${slug}.md`,
    directory,
    frontmatter: { name: slug, ...frontmatter },
    body,
    hasMemory: existsSync(memoryDir),
    filePath,
    lastModified: fileStat.mtimeMs,
  }
})
