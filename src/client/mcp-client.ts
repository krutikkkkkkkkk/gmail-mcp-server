import { experimental_createMCPClient, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MCPClientManager {
  private clients: any[] = [];

  async initializeClients() {
    try {
      // Initialize Gmail MCP client via stdio
      const gmailTransport = new StdioClientTransport({
        command: 'tsx',
        args: [path.join(__dirname, '../server/mcp-server.ts')],
      });

      const gmailClient = await experimental_createMCPClient({
        transport: gmailTransport,
      });

      this.clients.push(gmailClient);

      // You can add more MCP clients here
      // Example: StreamableHTTP MCP server
      // const httpTransport = new StreamableHTTPClientTransport(
      //   new URL('http://localhost:3000/mcp'),
      // );
      // const httpClient = await experimental_createMCPClient({
      //   transport: httpTransport,
      // });
      // this.clients.push(httpClient);

      // Example: SSE MCP server
      // const sseTransport = new SSEClientTransport(
      //   new URL('http://localhost:3000/sse'),
      // );
      // const sseClient = await experimental_createMCPClient({
      //   transport: sseTransport,
      // });
      // this.clients.push(sseClient);

      return this.clients;
    } catch (error) {
      console.error('Failed to initialize MCP clients:', error);
      throw error;
    }
  }

  async getTools() {
    const allTools = {};
    
    for (const client of this.clients) {
      try {
        const toolSet = await client.tools();
        Object.assign(allTools, toolSet);
      } catch (error) {
        console.error('Failed to get tools from client:', error);
      }
    }

    return allTools;
  }

  async closeAllClients() {
    await Promise.all(
      this.clients.map(client => 
        client.close().catch((error: any) => 
          console.error('Error closing client:', error)
        )
      )
    );
    this.clients = [];
  }
}

export async function runAIWithMCPTools(userMessage: string) {
  const clientManager = new MCPClientManager();
  
  try {
    // Initialize MCP clients
    await clientManager.initializeClients();
    
    // Get all available tools
    const tools = await clientManager.getTools();
    
    console.log('Available tools:', Object.keys(tools));

    // Generate response using AI with MCP tools
    const response = await generateText({
      model: openai('gpt-4o'),
      tools,
      maxSteps: 5,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    return response;
  } catch (error) {
    console.error('Error running AI with MCP tools:', error);
    throw error;
  } finally {
    // Always close clients
    await clientManager.closeAllClients();
  }
}

// Example usage function
export async function exampleGmailInteraction() {
  try {
    const response = await runAIWithMCPTools(
      'Search for emails from sender@example.com and show me the first result'
    );

    console.log('AI Response:', response.text);
    console.log('Tool calls made:', response.steps?.length || 0);
    
    // Print details of tool calls
    response.steps?.forEach((step: any, index: number) => {
      if (step.toolCalls) {
        console.log(`Step ${index + 1} tool calls:`, step.toolCalls);
      }
    });

  } catch (error) {
    console.error('Example interaction failed:', error);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const userMessage = process.argv[2] || 'Search for recent emails and summarize them';
  
  console.log('Running AI with MCP tools...');
  console.log('User message:', userMessage);
  
  runAIWithMCPTools(userMessage)
    .then(response => {
      console.log('\n=== AI Response ===');
      console.log(response.text);
      
      if (response.steps && response.steps.length > 0) {
        console.log('\n=== Tool Usage ===');
        response.steps.forEach((step: any, index: number) => {
          if (step.toolCalls) {
            step.toolCalls.forEach((call: any) => {
              console.log(`Step ${index + 1}: Called ${call.toolName} with:`, call.args);
            });
          }
        });
      }
    })
    .catch(console.error);
}
