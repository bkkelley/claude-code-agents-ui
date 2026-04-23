import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolveClaudePath } from '../../utils/claudeDir'
import { parseFrontmatter } from '../../utils/frontmatter'
import { encodeAgentSlug } from '../../utils/agentUtils'
import type { Agent, AgentFrontmatter } from '~/types'

async function scanDir(dir: string, relDir: string, scope: 'global' | 'project'): Promise<Agent[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const agents: Agent[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const subAgents = await scanDir(fullPath, relDir ? `${relDir}/${entry.name}` : entry.name, scope)
      agents.push(...subAgents)
    } else if (entry.name.endsWith('.md')) {
      const raw = await readFile(fullPath, 'utf-8')
      const { frontmatter, body } = parseFrontmatter<AgentFrontmatter>(raw)
      const name = entry.name.replace(/\.md$/, '')
      const slug = encodeAgentSlug(relDir, name)
      const memoryDir = resolveClaudePath('agent-memory', slug)
      const hasMemory = existsSync(memoryDir)

      agents.push({
        slug,
        filename: entry.name,
        directory: relDir,
        frontmatter: { name: slug, ...frontmatter },
        body,
        hasMemory,
        filePath: fullPath,
        scope,
      })
    }
  }

  return agents
}

function resolvePath(rawPath: string): string {
  return rawPath.startsWith('~') ? join(homedir(), rawPath.slice(1)) : rawPath
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawProjectPath = query.projectPath as string | undefined

  const globalAgentsDir = resolveClaudePath('agents')
  const globalAgents = await scanDir(globalAgentsDir, '', 'global')

  if (!rawProjectPath) {
    return globalAgents.sort((a, b) => a.slug.localeCompare(b.slug))
  }

  const projectAgentsDir = join(resolvePath(rawProjectPath), '.claude', 'agents')
  const projectAgents = await scanDir(projectAgentsDir, '', 'project')

  // Project agents take precedence on slug collision
  const projectSlugs = new Set(projectAgents.map(a => a.slug))
  const merged = [
    ...projectAgents,
    ...globalAgents.filter(a => !projectSlugs.has(a.slug)),
  ]

  return merged.sort((a, b) => a.slug.localeCompare(b.slug))
})
