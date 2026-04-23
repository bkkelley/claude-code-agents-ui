export type ProjectScopeMode = 'global' | 'global+project'

const STORAGE_MODE_KEY = 'projectScopeMode'
const STORAGE_PATH_KEY = 'projectScopePath'

export function useProjectScope() {
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

  const validating = ref(false)
  const validationError = ref<string | null>(null)
  const validated = ref(false)

  const activeProjectPath = computed(() =>
    mode.value === 'global+project' && validated.value ? projectPath.value : ''
  )

  function setMode(newMode: ProjectScopeMode) {
    mode.value = newMode
    if (import.meta.client) localStorage.setItem(STORAGE_MODE_KEY, newMode)
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

  // Re-validate on client mount if we have a saved path + mode
  onMounted(async () => {
    if (mode.value === 'global+project' && projectPath.value) {
      await validatePath()
    }
  })

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
