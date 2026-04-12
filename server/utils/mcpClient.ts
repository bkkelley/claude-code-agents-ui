import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export async function getMcpCapabilities(config: {
  transport: 'stdio' | 'sse' | 'http'
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}) {
  let transport
  if (config.transport === 'stdio') {
    if (!config.command) throw new Error('Command is required for stdio transport')
    transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...process.env, ...(config.env || {}), ...(config.headers || {}) }
    })
  } else {
    if (!config.url) throw new Error(`URL is required for ${config.transport} transport`)
    
    const configHeaders = config.headers || {}
    const transportOpts = {
      fetch: async (url: string | URL, init?: RequestInit) => {
        const isPost = init?.method?.toUpperCase() === 'POST'
        const headers = new Headers(init?.headers)
        
        // MCP standard headers
        if (!isPost) {
          headers.set('Accept', 'text/event-stream')
        }
        headers.set('mcp-protocol-version', '2024-11-05')
        
        for (const [key, value] of Object.entries(configHeaders)) {
          if (!isPost && ['content-type', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
            continue
          }
          headers.set(key, value)
        }

        console.log(`[MCP Client] [${config.transport}] Fetching ${init?.method || 'GET'} ${url.toString()}`)
        try {
          const response = await fetch(url, {
            ...init,
            headers
          })
          console.log(`[MCP Client] [${config.transport}] Response: ${response.status} ${response.statusText}`)
          return response
        } catch (err: any) {
          console.error(`[MCP Client] [${config.transport}] Fetch error: ${err.message}`)
          throw err
        }
      }
    }

    if (config.transport === 'http') {
      transport = new StreamableHTTPClientTransport(new URL(config.url), transportOpts)
    } else {
      transport = new SSEClientTransport(new URL(config.url), transportOpts)
    }
  }

  const client = new Client({
    name: 'claude-code-agents-ui',
    version: '1.0.0'
  }, {
    capabilities: {}
  })

  try {
    await client.connect(transport)

    // Parallel fetch of all capabilities
    const [toolsRes, resourcesRes, promptsRes] = await Promise.all([
      client.listTools().catch((err) => {
        console.error('[MCP Client] Failed to list tools:', err)
        return { tools: [] }
      }),
      client.listResources().catch((err) => {
        console.error('[MCP Client] Failed to list resources:', err)
        return { resources: [] }
      }),
      client.listPrompts().catch((err) => {
        console.error('[MCP Client] Failed to list prompts:', err)
        return { prompts: [] }
      })
    ])

    return {
      tools: toolsRes.tools || [],
      resources: resourcesRes.resources || [],
      prompts: promptsRes.prompts || []
    }
  } catch (err: any) {
    console.error('[MCP Client] Connection failed:', err)
    throw err
  } finally {
    try {
      await client.close()
    } catch {
      // Ignore cleanup errors
    }
  }
}
