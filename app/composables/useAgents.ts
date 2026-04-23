import type { Agent, AgentPayload } from '~/types'

export function useAgents() {
  const { activeProjectPath } = useProjectScope()
  const crud = useCrud<Agent, AgentPayload>('/api/agents', { stateKey: 'agents', label: 'agents' })

  async function fetchAll(params: any = {}) {
    const scopeParams = activeProjectPath.value ? { projectPath: activeProjectPath.value } : {}
    return crud.fetchAll({ ...scopeParams, ...params })
  }

  return {
    agents: crud.items,
    loading: crud.loading,
    error: crud.error,
    fetchAll,
    fetchOne: crud.fetchOne,
    create: crud.create,
    update: crud.update,
    remove: crud.remove,
  }
}
