import { getClaudeCodeProjects } from '../../utils/claudeCodeHistory'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const nameOrPath = query.name as string

  if (!nameOrPath) {
    throw createError({
      statusCode: 400,
      message: 'Missing project name or path'
    })
  }

  try {
    const projects = await getClaudeCodeProjects()
    
    // Helper to normalize strings for comparison (sluggify)
    const normalize = (str: string) => {
      return str.toLowerCase()
        .replace(/[^a-z0-9]/g, '-') // Replace all non-alphanumeric with dashes
        .replace(/-+/g, '-')       // Collapse multiple dashes
        .replace(/^-|-$/g, '')    // Trim leading/trailing dashes
    }

    const target = normalize(nameOrPath)

    // 1. Try exact match by name
    let project = projects.find(p => p.name === nameOrPath || normalize(p.name) === target)
    
    // 2. Try match by path
    if (!project) {
      project = projects.find(p => normalize(p.path) === target)
    }

    // 3. Try fuzzy match (is the target a suffix of the path slug?)
    if (!project) {
      project = projects.find(p => {
        const pathSlug = normalize(p.path)
        return pathSlug.endsWith(target) || target.endsWith(pathSlug)
      })
    }

    if (project) {
      return { projectName: project.name }
    }

    return { projectName: null }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to resolve project'
    })
  }
})
