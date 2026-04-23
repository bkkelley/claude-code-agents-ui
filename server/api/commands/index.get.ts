import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolveClaudePath } from '../../utils/claudeDir'
import { parseFrontmatter } from '../../utils/frontmatter'
import type { Command, CommandFrontmatter } from '~/types'

async function scanDir(dir: string, relDir: string): Promise<Command[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const commands: Command[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const subCommands = await scanDir(fullPath, relDir ? `${relDir}/${entry.name}` : entry.name)
      commands.push(...subCommands)
    } else if (entry.name.endsWith('.md')) {
      const raw = await readFile(fullPath, 'utf-8')
      const { frontmatter, body } = parseFrontmatter<CommandFrontmatter>(raw)
      const filename = entry.name
      const directory = relDir
      const slug = directory
        ? `${directory.replace(/\//g, '--')}--${filename.replace(/\.md$/, '')}`
        : filename.replace(/\.md$/, '')

      commands.push({
        slug,
        filename,
        directory,
        frontmatter: { name: slug, ...frontmatter },
        body,
        filePath: fullPath,
      })
    }
  }

  return commands
}

function expandPath(p: string): string {
  return p.startsWith('~') ? join(homedir(), p.slice(1)) : p
}

export default defineEventHandler(async (event) => {
  const { projectPath } = getQuery(event) as { projectPath?: string }

  const globalCommandsDir = resolveClaudePath('commands')
  const globalCommands = await scanDir(globalCommandsDir, '')

  if (!projectPath) {
    return globalCommands.sort((a, b) => a.frontmatter.name.localeCompare(b.frontmatter.name))
  }

  const projectCommandsDir = join(expandPath(projectPath), '.claude', 'commands')
  const projectCommands = await scanDir(projectCommandsDir, '')

  // Project commands take precedence on slug collision.
  const projectSlugs = new Set(projectCommands.map(c => c.slug))
  const merged = [
    ...projectCommands,
    ...globalCommands.filter(c => !projectSlugs.has(c.slug)),
  ]

  return merged.sort((a, b) => a.frontmatter.name.localeCompare(b.frontmatter.name))
})
