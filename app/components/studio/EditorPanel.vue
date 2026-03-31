<script setup lang="ts">
import type { AgentFrontmatter, AgentMemory, AgentSkill } from '~/types'
import { MODEL_META, MODEL_IDS } from '~/utils/models'

const props = defineProps<{
  frontmatter: AgentFrontmatter
  body: string
  skills: AgentSkill[]
  loadingSkills: boolean
}>()

const emit = defineEmits<{
  'update:frontmatter': [value: AgentFrontmatter]
  'update:body': [value: string]
}>()

const { fetchAll: fetchAllSkills, skills: allSkills } = useSkills()

const activeTab = ref<'instructions' | 'settings' | 'skills'>('instructions')

const modelOptions = MODEL_IDS.map(id => ({
  value: id,
  label: MODEL_META[id].label,
  description: MODEL_META[id].description
}))

const memoryOptions: { label: string; value: AgentMemory; description: string }[] = [
  { label: 'User', value: 'user', description: 'Shared across all projects' },
  { label: 'Project', value: 'project', description: 'Specific to this repository' },
  { label: 'None', value: 'none', description: 'No persistent memory' },
]

function updateFrontmatter(key: keyof AgentFrontmatter, value: unknown) {
  emit('update:frontmatter', { ...props.frontmatter, [key]: value })
}

onMounted(() => {
  fetchAllSkills()
})

const preloadedSkillSlugs = computed({
  get: () => props.frontmatter.skills || [],
  set: (val) => updateFrontmatter('skills', val)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="shrink-0 flex border-b" style="border-color: var(--border-subtle);">
      <button
        v-for="tab in (['instructions', 'settings', 'skills'] as const)"
        :key="tab"
        class="px-4 py-2.5 text-[12px] font-medium capitalize transition-all relative"
        :style="{ color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)' }"
        @click="activeTab = tab"
      >
        {{ tab }}
        <div v-if="activeTab === tab" class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style="background: var(--accent);" />
      </button>
    </div>

    <div v-if="activeTab === 'instructions'" class="flex-1 min-h-0">
      <InstructionEditor :model-value="body" :agent-name="frontmatter.name" :agent-description="frontmatter.description" @update:model-value="emit('update:body', $event)" />
    </div>

    <div v-if="activeTab === 'settings'" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="space-y-1">
        <label class="text-[11px] font-medium" style="color: var(--text-tertiary);">Name</label>
        <input :value="frontmatter.name" class="field-input w-full" placeholder="Agent name" @input="updateFrontmatter('name', ($event.target as HTMLInputElement).value)" />
      </div>
      <div class="space-y-1">
        <label class="text-[11px] font-medium" style="color: var(--text-tertiary);">Description</label>
        <textarea :value="frontmatter.description" rows="4" class="field-input w-full" placeholder="What does this agent do?" @input="updateFrontmatter('description', ($event.target as HTMLInputElement).value)" />
      </div>
      <div class="space-y-1">
        <label class="text-[11px] font-medium" style="color: var(--text-tertiary);">Model</label>
        <div class="flex gap-2">
          <button
            v-for="opt in modelOptions"
            :key="opt.value"
            class="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            :style="{
              background: frontmatter.model === opt.value ? 'var(--accent-muted)' : 'var(--surface-raised)',
              border: '1px solid ' + (frontmatter.model === opt.value ? 'rgba(229, 169, 62, 0.2)' : 'var(--border-subtle)'),
              color: frontmatter.model === opt.value ? 'var(--accent)' : 'var(--text-secondary)'
            }"
            @click="updateFrontmatter('model', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-[11px] font-medium" style="color: var(--text-tertiary);">Memory</label>
        <div class="flex gap-2">
          <button
            v-for="opt in memoryOptions"
            :key="opt.value"
            class="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            :style="{
              background: frontmatter.memory === opt.value ? 'var(--accent-muted)' : 'var(--surface-raised)',
              border: '1px solid ' + (frontmatter.memory === opt.value ? 'rgba(229, 169, 62, 0.2)' : 'var(--border-subtle)'),
              color: frontmatter.memory === opt.value ? 'var(--accent)' : 'var(--text-secondary)'
            }"
            @click="updateFrontmatter('memory', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-[11px] font-medium" style="color: var(--text-tertiary);">Color</label>
        <input type="color" :value="frontmatter.color || '#e5a93e'" class="w-8 h-8 rounded-lg cursor-pointer border" style="border-color: var(--border-subtle);" @input="updateFrontmatter('color', ($event.target as HTMLInputElement).value)" />
      </div>
    </div>

    <div v-if="activeTab === 'skills'" class="flex-1 overflow-y-auto p-5 space-y-6">
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">Preloaded Skills</label>
          <HelpTip title="Preloading Skills" body="Injected directly into the subagent's context. Faster and more reliable than discovery." />
        </div>
        
        <UMultiSelectDropdown
          v-model="preloadedSkillSlugs"
          :options="allSkills.map(s => ({
            value: s.slug,
            label: s.frontmatter.name || s.slug,
            description: s.frontmatter.description
          }))"
          placeholder="Add skills to preload..."
          search-placeholder="Search available skills..."
          icon="i-lucide-sparkles"
        />
        
        <p class="text-[10px] leading-relaxed" style="color: var(--text-tertiary);">
          These skills will be available to the agent immediately without needing to search for them.
        </p>
      </div>

      <div class="space-y-3">
        <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">Currently Attached</label>
        
        <div v-if="loadingSkills" class="text-[11px] font-mono py-4 text-center" style="color: var(--text-disabled);">Loading attached skills...</div>
        <div v-else-if="!skills.length" class="text-[12px] py-8 text-center border border-dashed rounded-xl" style="color: var(--text-tertiary); border-color: var(--border-subtle);">
          <UIcon name="i-lucide-sparkles" class="size-5 mx-auto mb-2 opacity-20" />
          No skills attached to this agent.
        </div>
        <div v-else class="space-y-2">
          <NuxtLink 
            v-for="skill in skills" 
            :key="skill.slug" 
            :to="`/skills/${skill.slug}`"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:border-accent/30 hover:shadow-sm group/skill" 
            style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
          >
            <div class="size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover/skill:bg-accent/10" style="background: var(--accent-muted); border: 1px solid rgba(229, 169, 62, 0.1);">
              <UIcon name="i-lucide-sparkles" class="size-4" style="color: var(--accent);" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[12px] font-medium truncate group-hover/skill:text-accent transition-colors" style="color: var(--text-primary);">{{ skill.frontmatter.name }}</div>
              <div class="text-[10px] truncate" style="color: var(--text-tertiary);">{{ skill.frontmatter.description }}</div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span class="text-[9px] font-mono px-1.5 py-px rounded-full" style="background: var(--badge-subtle-bg); color: var(--text-tertiary); border: 1px solid var(--border-subtle);">{{ skill.source }}</span>
              <span v-if="frontmatter.skills?.includes(skill.slug)" class="text-[8px] font-bold uppercase tracking-tighter" style="color: var(--accent);">Preloaded</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
