import type { Skill, SkillPayload } from '~/types'

export function useSkills() {
  const { activeProjectPath } = useProjectScope()
  const crud = useCrud<Skill, SkillPayload>('/api/skills', { stateKey: 'skills', label: 'skills' })

  async function fetchAll(params: any = {}) {
    const scopeParams = activeProjectPath.value ? { projectPath: activeProjectPath.value } : {}
    return crud.fetchAll({ ...scopeParams, ...params })
  }

  async function fetchOneByPath(slug: string, filePath: string) {
    return await $fetch<Skill>(`/api/skills/${encodeURIComponent(slug)}`, {
      method: 'POST',
      body: { filePath }
    })
  }

  return {
    skills: crud.items,
    loading: crud.loading,
    error: crud.error,
    fetchAll,
    fetchOne: crud.fetchOne,
    fetchOneByPath,
    create: crud.create,
    update: crud.update,
    remove: crud.remove,
  }
}
