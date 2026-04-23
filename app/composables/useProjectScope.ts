export type ProjectScopeMode = 'global' | 'global+project'

const STORAGE_MODE_KEY = 'projectScopeMode'
const STORAGE_PATH_KEY = 'projectScopePath'

export function useProjectScope() {
  // All state is shared via useState so it stays consistent across components.
  const mode = useState<ProjectScopeMode>('projectScopeMode', () => {
    if (import.meta.client) {
      return (localStorage.getItem(STORAGE_MODE_KEY) as ProjectScopeMode) || 'global'
    }
    return 'global'
  })

  const projectPath = useState<string>('projectScopePath', () => {
    if (import.meta.client) {
      return localStorage.getItem(STORAGE_PATH_KEY) || ''
    }
    return ''
  })

  const validating = useState<boolean>('projectScopeValidating', () => false)
  const validationError = useState<string | null>('projectScopeValidationError', () => null)
  const validated = useState<boolean>('projectScopeValidated', () => false)

  // The active project path is used for API queries. We do NOT gate on `validated`
  // — the server gracefully handles missing/invalid paths by returning no items.
  // `validated` is only used for UI feedback on the settings page.
  const activeProjectPath = computed(() =>
    mode.value === 'global+project' && projectPath.value.trim() ? projectPath.value.trim() : ''
  )

  function setMode(newMode: ProjectScopeMode) {
    mode.value = newMode
    if (import.meta.client) localStorage.setItem(STORAGE_MODE_KEY, newMode)
    // Moving to global-only clears validation state.
    if (newMode === 'global') {
      validated.value = false
      validationError.value = null
    }
  }

  function setProjectPath(path: string) {
    projectPath.value = path
    validated.value = false
    validationError.value = null
    if (import.meta.client) localStorage.setItem(STORAGE_PATH_KEY, path)
  }

  async function validatePath() {
    if (!projectPath.value) {
      validationError.value = 'Enter a project directory path'
      validated.value = false
      return false
    }
    validating.value = true
    validationError.value = null
    try {
      await $fetch('/api/project-scope/validate', {
        method: 'POST',
        body: { path: projectPath.value },
      })
      validated.value = true
      return true
    } catch (e: any) {
      validationError.value = e.data?.message || 'Invalid path'
      validated.value = false
      return false
    } finally {
      validating.value = false
    }
  }

  return {
    mode,
    projectPath,
    activeProjectPath,
    validating,
    validationError,
    validated,
    setMode,
    setProjectPath,
    validatePath,
  }
}
