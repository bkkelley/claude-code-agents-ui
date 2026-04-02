# Chat Session URL Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each chat session its own URL (`/cli/project/:projectName/session/:sessionId`) so users can deep-link, use browser navigation, and reload without losing their place.

**Architecture:** Nuxt 3 nested routes — `cli.vue` becomes the persistent parent (never remounts), an empty child page at `cli/project/[projectName]/session/[sessionId].vue` registers the route, and `ChatV2Interface.vue` syncs its internal state with `useRoute().params` in both directions.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, `useRoute`, `navigateTo`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/pages/cli.vue` | Modify | Add hidden `<NuxtPage />` so Nuxt renders child routes inside parent |
| `app/pages/cli/project/[projectName]/session/[sessionId].vue` | Create | Empty child page — exists only to register route and expose params |
| `app/components/cli/chatv2/ChatV2Interface.vue` | Modify | Watch route params → trigger session load; call `navigateTo` on session select/clear |

---

## Task 1: Add `<NuxtPage />` to `cli.vue`

**Files:**
- Modify: `app/pages/cli.vue`

`cli.vue` must contain a `<NuxtPage />` element for Nuxt to render child routes. Since `ChatV2Interface` takes up the full page, `<NuxtPage />` should be hidden — it will never render visible content (the child page is empty) but must be present for routing to work.

- [ ] **Step 1: Read current `cli.vue`**

Open `app/pages/cli.vue`. It currently looks like:

```vue
<script setup lang="ts">
const { executionOptions } = useCliExecution()
useHead({ title: 'Claude Code' })
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 flex min-h-0 relative overflow-hidden">
      <div class="flex-1 flex flex-col">
        <ChatV2Interface :execution-options="executionOptions" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Add hidden `<NuxtPage />`**

Add `<NuxtPage />` as a hidden element at the bottom of the template. It must be present in the DOM for Nuxt routing to work, but produces no visible output since the child page has no content.

Replace the entire file with:

```vue
<script setup lang="ts">
const { executionOptions } = useCliExecution()

useHead({
  title: 'Claude Code',
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 flex min-h-0 relative overflow-hidden">
      <div class="flex-1 flex flex-col">
        <ChatV2Interface :execution-options="executionOptions" />
      </div>
    </div>
  </div>
  <!-- Hidden child route outlet — child page has no content, just registers route params -->
  <div class="hidden">
    <NuxtPage />
  </div>
</template>
```

- [ ] **Step 3: Verify dev server still loads `/cli`**

Run `bun run dev` and navigate to `http://localhost:3000/cli`. The page should render identically to before. No visible change.

- [ ] **Step 4: Commit**

```bash
git add app/pages/cli.vue
git commit -m "feat: add NuxtPage outlet to cli.vue for nested session routes"
```

---

## Task 2: Create Empty Child Page

**Files:**
- Create: `app/pages/cli/project/[projectName]/session/[sessionId].vue`

This file is the minimum needed to register `/cli/project/:projectName/session/:sessionId` as a valid Nuxt route. It has no template content — all UI comes from the parent `cli.vue`.

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p app/pages/cli/project/\[projectName\]/session
```

- [ ] **Step 2: Create the empty child page**

Create `app/pages/cli/project/[projectName]/session/[sessionId].vue` with:

```vue
<template>
  <!-- Empty — UI is rendered by parent cli.vue via ChatV2Interface -->
  <!-- Route params projectName and sessionId are read by ChatV2Interface via useRoute() -->
</template>
```

- [ ] **Step 3: Verify the route is registered**

With `bun run dev` running, navigate to:
```
http://localhost:3000/cli/project/test-project/session/test-session-id
```
The page should render the full `ChatV2Interface` UI (not a 404). The chat will show empty state since `test-project`/`test-session-id` don't exist — that's expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add "app/pages/cli/project/[projectName]/session/[sessionId].vue"
git commit -m "feat: add empty child route for cli session URLs"
```

---

## Task 3: Update URL When User Selects a Session

**Files:**
- Modify: `app/components/cli/chatv2/ChatV2Interface.vue`

When the user clicks a session in the sidebar, `handleClaudeCodeSessionSelected` is called. After it runs, we push the new URL. When the user clears selection or starts a new chat, we navigate back to `/cli`.

- [ ] **Step 1: Add `useRoute` and `useRouter` to `ChatV2Interface.vue`**

At the top of the `<script setup>` block (around line 17, after the imports), add:

```typescript
const route = useRoute()
const router = useRouter()
```

Nuxt auto-imports these — no import statement needed.

- [ ] **Step 2: Update `handleClaudeCodeSessionSelected` to push URL**

Find `handleClaudeCodeSessionSelected` (around line 343). After the existing logic that sets internal state, add a `navigateTo` call:

```typescript
async function handleClaudeCodeSessionSelected(payload: { projectName: string; sessionId: string; sessionSummary: string; projectDisplayName: string }) {
  viewMode.value = 'history'
  isLiveChat.value = false
  urlProjectName.value = payload.projectName
  urlSessionId.value = payload.sessionId
  currentSessionSummary.value = payload.sessionSummary
  currentProjectDisplayName.value = payload.projectDisplayName
  isContinuingHistory.value = false
  isInitialScroll.value = true

  // Update URL to reflect selected session
  await navigateTo(`/cli/project/${encodeURIComponent(payload.projectName)}/session/${encodeURIComponent(payload.sessionId)}`, { replace: false })

  // Start loading with minimum duration
  isLoadingHistoryWithDelay.value = true

  // Load messages with minimum 1000ms delay for smooth UX
  const [historyResult] = await Promise.all([
    fetchClaudeCodeMessages(payload.projectName, payload.sessionId, 100, 0),
    delay(1000)
  ])

  if (historyResult?.tokenUsage) {
    contextMonitor.updateTokenUsage(historyResult.tokenUsage)
  } else {
    contextMonitor.resetMetrics()
  }

  isLoadingHistoryWithDelay.value = false
  scrollToBottom()
}
```

Note: `navigateTo` is called **before** loading messages so the URL updates immediately when the user clicks. The loading delay still applies.

- [ ] **Step 3: Update `handleSelectionCleared` to navigate to `/cli`**

Find `handleSelectionCleared` (around line 376). Add `navigateTo` at the end:

```typescript
function handleSelectionCleared() {
  viewMode.value = 'live'
  isLiveChat.value = false
  urlProjectName.value = null
  urlSessionId.value = null
  currentSessionSummary.value = ''
  currentProjectDisplayName.value = ''
  isContinuingHistory.value = false
  contextMonitor.resetMetrics()
  navigateTo('/cli', { replace: false })
}
```

- [ ] **Step 4: Update `handleNewChat` to navigate to `/cli`**

Find `handleNewChat` (around line 390). Add `navigateTo` at the end:

```typescript
function handleNewChat(payload?: { workingDir?: string; projectDisplayName?: string }) {
  viewMode.value = 'live'
  isLiveChat.value = true
  urlProjectName.value = null
  urlSessionId.value = null
  currentSessionSummary.value = ''
  currentProjectDisplayName.value = payload?.projectDisplayName || ''
  isContinuingHistory.value = false
  sessionStore.setActiveSession(null)
  contextMonitor.resetMetrics()
  history.selectedSession.value = null
  if (!payload?.workingDir) {
    history.selectedProject.value = null
  }
  if (payload?.workingDir) {
    localWorkingDir.value = payload.workingDir
  } else {
    localWorkingDir.value = props.executionOptions.workingDir || ''
  }
  navigateTo('/cli', { replace: false })
}
```

- [ ] **Step 5: Manually verify URL updates on session click**

1. Start dev server: `bun run dev`
2. Navigate to `http://localhost:3000/cli`
3. Click a project in the sidebar, then click a session
4. Verify the URL changes to `/cli/project/<projectName>/session/<sessionId>`
5. Click the back button in the browser → URL returns to `/cli`, selection is cleared
6. Click "New Chat" → URL returns to `/cli`

- [ ] **Step 6: Commit**

```bash
git add app/components/cli/chatv2/ChatV2Interface.vue
git commit -m "feat: update URL when selecting/clearing chat sessions"
```

---

## Task 4: React to URL on Mount (Deep Linking)

**Files:**
- Modify: `app/components/cli/chatv2/ChatV2Interface.vue`

When the user navigates directly to `/cli/project/:projectName/session/:sessionId` (fresh tab, shared link, page reload), `ChatV2Interface` must detect the route params and load the correct session. This requires waiting until projects are loaded before attempting to resolve the session.

- [ ] **Step 1: Add a watcher for route params + project load state**

Add the following watcher block after the existing watchers in `ChatV2Interface.vue` (after the `watch(currentSessionId, ...)` block around line 420):

```typescript
// Deep link / browser nav: sync URL params → internal session state
// Runs on mount and whenever route params change (browser back/forward)
watch(
  () => ({
    projectName: route.params.projectName as string | undefined,
    sessionId: route.params.sessionId as string | undefined,
    projectsLoaded: history.projects.value.length > 0,
  }),
  async ({ projectName, sessionId, projectsLoaded }) => {
    // Only act when both params are present in the URL
    if (!projectName || !sessionId) return

    // Guard: already showing this session
    if (urlProjectName.value === projectName && urlSessionId.value === sessionId) return

    // Wait for projects to be loaded before resolving session metadata
    if (!projectsLoaded) return

    // Find project display name from loaded projects
    const project = history.projects.value.find(p => p.name === projectName)
    const projectDisplayName = project?.displayName || projectName

    // Fetch sessions for this project if not already loaded
    if (history.selectedProject.value?.name !== projectName) {
      history.selectedProject.value = project || null
      await history.fetchSessions(projectName)
    }

    // Find session summary
    const session = history.sessions.value.find(s => s.id === sessionId)
    const sessionSummary = session?.summary || ''

    // Trigger the existing session selection logic (handles loading, scroll, etc.)
    await handleClaudeCodeSessionSelected({
      projectName,
      sessionId,
      sessionSummary,
      projectDisplayName,
    })
  },
  { immediate: true }
)
```

The `immediate: true` ensures this runs on mount — so if the page loads at a session URL, it picks it up right away. The `projectsLoaded` guard prevents firing before `useClaudeCodeHistory` has fetched projects.

- [ ] **Step 2: Guard `handleClaudeCodeSessionSelected` against duplicate `navigateTo` calls**

The watcher calls `handleClaudeCodeSessionSelected`, which now calls `navigateTo`. When triggered from the URL (not a sidebar click), we're already at the correct URL so `navigateTo` would be a no-op — but to be explicit and avoid any race conditions, update `handleClaudeCodeSessionSelected` to skip navigation when the URL already matches:

```typescript
async function handleClaudeCodeSessionSelected(payload: { projectName: string; sessionId: string; sessionSummary: string; projectDisplayName: string }) {
  viewMode.value = 'history'
  isLiveChat.value = false
  urlProjectName.value = payload.projectName
  urlSessionId.value = payload.sessionId
  currentSessionSummary.value = payload.sessionSummary
  currentProjectDisplayName.value = payload.projectDisplayName
  isContinuingHistory.value = false
  isInitialScroll.value = true

  // Update URL only if not already there (avoids redundant navigation when triggered by route watcher)
  const targetPath = `/cli/project/${encodeURIComponent(payload.projectName)}/session/${encodeURIComponent(payload.sessionId)}`
  if (route.path !== targetPath) {
    await navigateTo(targetPath, { replace: false })
  }

  isLoadingHistoryWithDelay.value = true

  const [historyResult] = await Promise.all([
    fetchClaudeCodeMessages(payload.projectName, payload.sessionId, 100, 0),
    delay(1000)
  ])

  if (historyResult?.tokenUsage) {
    contextMonitor.updateTokenUsage(historyResult.tokenUsage)
  } else {
    contextMonitor.resetMetrics()
  }

  isLoadingHistoryWithDelay.value = false
  scrollToBottom()
}
```

- [ ] **Step 3: Manually verify deep linking**

1. While at `/cli`, click a session to navigate to its URL (e.g. `/cli/project/my-project/session/abc123`)
2. Copy that URL
3. Open a new browser tab and paste the URL
4. The session should load with the correct messages (1000ms loading delay included)
5. Verify the sidebar shows the correct project → sessions view with the session highlighted

- [ ] **Step 4: Manually verify browser back/forward**

1. Navigate to `/cli`
2. Click session A → URL updates to A's path, messages load
3. Click session B → URL updates to B's path, messages load
4. Press browser Back → URL returns to A's path, A's messages load
5. Press browser Back again → URL returns to `/cli`, empty state

- [ ] **Step 5: Commit**

```bash
git add app/components/cli/chatv2/ChatV2Interface.vue
git commit -m "feat: deep link support — load session from URL params on mount"
```

---

## Task 5: Update URL After New Session Created by SDK

**Files:**
- Modify: `app/components/cli/chatv2/ChatV2Interface.vue`

When the user sends the first message in a new chat, the SDK creates a session and fires `session_created`. The existing `watch(currentSessionId)` already handles setting `urlSessionId` and `urlProjectName`. We just need to also push the URL at that point.

- [ ] **Step 1: Find the `watch(currentSessionId)` block**

It's around line 420 and looks like:

```typescript
watch(currentSessionId, async (newId, oldId) => {
  if (newId && (!oldId || oldId.startsWith('new-session-'))) {
    // ... fetches projects, finds matching project, sets urlProjectName, urlSessionId ...
    if (matchingProject) {
      urlProjectName.value = matchingProject.name
      // ...
      urlSessionId.value = newId
      // ...
    }
  }
})
```

- [ ] **Step 2: Add `navigateTo` after `urlSessionId` is set**

Inside the `if (matchingProject)` block, after `urlSessionId.value = newId`, add:

```typescript
// Update URL to reflect the newly created session
await navigateTo(
  `/cli/project/${encodeURIComponent(matchingProject.name)}/session/${encodeURIComponent(newId)}`,
  { replace: true }  // replace so back button doesn't return to a "new chat" with empty URL
)
```

Use `replace: true` here so the back button skips the "no session" state and goes to wherever the user was before starting the chat.

Full updated block for reference:

```typescript
watch(currentSessionId, async (newId, oldId) => {
  if (newId && (!oldId || oldId.startsWith('new-session-'))) {
    console.log('[ChatV2] New session created, refreshing history:', newId)

    await history.fetchProjects()

    if (localWorkingDir.value) {
      const projects = history.projects.value
      const normalizedDir = localWorkingDir.value.replace(/\/$/, '')
      const matchingProject = projects.find(p => p.path.replace(/\/$/, '') === normalizedDir)

      if (matchingProject) {
        urlProjectName.value = matchingProject.name
        currentProjectDisplayName.value = matchingProject.displayName
        history.selectedProject.value = matchingProject
        await history.fetchSessions(matchingProject.name)
        urlSessionId.value = newId

        const newSession = history.sessions.value.find(s => s.id === newId)
        if (newSession) {
          currentSessionSummary.value = newSession.summary
          history.selectedSession.value = newSession
        }

        // Update URL to reflect the newly created session
        await navigateTo(
          `/cli/project/${encodeURIComponent(matchingProject.name)}/session/${encodeURIComponent(newId)}`,
          { replace: true }
        )
      } else {
        await history.fetchProjects()
      }
    }
  }
})
```

- [ ] **Step 3: Manually verify new session URL update**

1. Navigate to `http://localhost:3000/cli`
2. Click "New Chat" and pick or enter a working directory
3. Type a message and send it
4. Verify the URL updates to `/cli/project/<projectName>/session/<newSessionId>` after the session is created
5. Verify the chat continues normally (streaming, messages display)

- [ ] **Step 4: Commit**

```bash
git add app/components/cli/chatv2/ChatV2Interface.vue
git commit -m "feat: update URL after new SDK session is created"
```

---

## Task 6: Handle Session Continuation URL

**Files:**
- Modify: `app/components/cli/chatv2/ChatV2Interface.vue`

When a user resumes a history session by sending a message (`isContinuingHistory` becomes true), the URL should stay at the current session URL — no change needed. But we should verify the URL is already correct at that point. No code change required; this task is a verification.

- [ ] **Step 1: Manually verify continuation doesn't break URL**

1. Navigate to `/cli`
2. Click a session — URL updates to `/cli/project/.../session/...`
3. Type a message in the input and send it (this triggers `isContinuingHistory = true`)
4. Verify the URL **does not change** during continuation
5. Verify new messages appear correctly (live messages appended after history)

- [ ] **Step 2: Commit if no changes needed**

If Step 1 passes with no code changes:

```bash
git commit --allow-empty -m "chore: verify session continuation URL behavior (no change needed)"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| URL format `/cli/project/:projectName/session/:sessionId` | Task 2 |
| `cli.vue` persists (no remount) | Task 1 |
| Session click updates URL | Task 3 |
| New chat / clear → `/cli` | Task 3 |
| Deep link loads session on fresh page | Task 4 |
| Browser back/forward works | Task 4 |
| New SDK session updates URL | Task 5 |
| Session continuation URL unchanged | Task 6 |
| Loading behavior unchanged | Task 3 + 4 (1000ms delay preserved) |
