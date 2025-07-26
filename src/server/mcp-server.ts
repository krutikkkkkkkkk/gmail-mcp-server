#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

// Gmail API mock implementation - replace with actual Gmail API calls
class GmailService {
  async searchEmails(query: string, maxResults = 10) {
    // Mock implementation - replace with actual Gmail API
    return [
      {
        id: '1',
        subject: 'Test Email 1',
        from: 'sender1@example.com',
        date: new Date().toISOString(),
        snippet: 'This is a test email snippet...'
      },
      {
        id: '2', 
        subject: 'Test Email 2',
        from: 'sender2@example.com',
        date: new Date().toISOString(),
        snippet: 'Another test email snippet...'
      }
    ];
  }

  async getEmail(emailId: string) {
    // Mock implementation - replace with actual Gmail API
    return {
      id: emailId,
      subject: 'Test Email Details',
      from: 'sender@example.com',
      to: 'recipient@example.com',
      date: new Date().toISOString(),
      body: 'This is the full email body content...'
    };
  }

  async sendEmail(to: string, subject: string, body: string) {
    // Mock implementation - replace with actual Gmail API
    console.log(`Sending email to: ${to}, Subject: ${subject}`);
    return {
      id: 'sent_' + Date.now(),
      status: 'sent'
    };
  }

  async deleteEmail(emailId: string) {
    // Mock implementation - replace with actual Gmail API
    console.log(`Deleting email: ${emailId}`);
    return { success: true };
  }
}

class GmailMCPServer {
  private server: Server;
  private gmailService: GmailService;

  constructor() {
    this.server = new Server(
      {
        name: 'gmail-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.gmailService = new GmailService();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_emails',
            description: 'Search for emails in Gmail',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for emails'
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_email',
            description: 'Get details of a specific email',
            inputSchema: {
              type: 'object',
              properties: {
                emailId: {
                  type: 'string',
                  description: 'The ID of the email to retrieve'
                }
              },
              required: ['emailId']
            }
          },
          {
            name: 'send_email',
            description: 'Send a new email',
            inputSchema: {
              type: 'object',
              properties: {
                to: {
                  type: 'string',
                  description: 'Recipient email address'
                },
                subject: {
                  type: 'string',
                  description: 'Email subject'
                },
                body: {
                  type: 'string',
                  description: 'Email body content'
                }
              },
              required: ['to', 'subject', 'body']
            }
          },
          {
            name: 'delete_email',
            description: 'Delete a specific email',
            inputSchema: {
              type: 'object',
              properties: {
                emailId: {
                  type: 'string',
                  description: 'The ID of the email to delete'
                }
              },
              required: ['emailId']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_emails': {
            const { query, maxResults = 10 } = args as { query: string; maxResults?: number };
            const emails = await this.gmailService.searchEmails(query, maxResults);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(emails, null, 2)
                }
              ]
            };
          }

          case 'get_email': {
            const { emailId } = args as { emailId: string };
            const email = await this.gmailService.getEmail(emailId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(email, null, 2)
                }
              ]
            };
          }

          case 'send_email': {
            const { to, subject, body } = args as { to: string; subject: string; body: string };
            const result = await this.gmailService.sendEmail(to, subject, body);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'delete_email': {
            const { emailId } = args as { emailId: string };
            const result = await this.gmailService.deleteEmail(emailId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gmail MCP Server running on stdio');
  }
}

// Run the server
const server = new GmailMCPServer();
server.run().catch(console.error);
