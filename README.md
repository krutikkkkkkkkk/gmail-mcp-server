# Gmail MCP Server with AI SDK

This project demonstrates how to create a Gmail MCP (Model Context Protocol) server and integrate it with the AI SDK for intelligent email management.

## Features

- **MCP Server**: Provides Gmail tools via Model Context Protocol
- **AI SDK Integration**: Uses AI to interact with Gmail through MCP tools
- **Gmail Operations**: Search, read, send, and delete emails
- **Multiple Transport Types**: Supports stdio, HTTP, and SSE transports

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - Gmail OAuth credentials (for production use)

3. **Build the project**:
   ```bash
   npm run build
   ```

## Usage

### Running the MCP Server

Start the Gmail MCP server:

```bash
npm run server
```

### Running the AI Client

Run the AI client that connects to the MCP server:

```bash
npm run client
```

Or run with a custom message:

```bash
npm run client "Search for emails about project updates"
```

### Development Mode

Run in development mode with hot reloading:

```bash
npm run dev
```

## Project Structure

```
src/
├── server/
│   └── mcp-server.ts     # Gmail MCP server implementation
├── client/
│   └── mcp-client.ts     # AI SDK client with MCP integration
└── index.ts              # Main entry point
```

## MCP Tools Available

The Gmail MCP server provides these tools:

1. **search_emails**: Search for emails by query
2. **get_email**: Get details of a specific email
3. **send_email**: Send a new email
4. **delete_email**: Delete an email

## Example Interactions

- "Search for emails from john@example.com"
- "Find emails about project updates and summarize them"
- "Send an email to team@company.com about the meeting"
- "Delete the email with ID 12345"

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI SDK        │───▶│   MCP Client    │───▶│   MCP Server    │
│   (OpenAI)      │    │   (stdio)       │    │   (Gmail)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The AI SDK connects to the Gmail MCP server through a stdio transport, allowing the AI to use Gmail tools naturally in conversation.

## Extending

To add more MCP servers:

1. Create additional MCP server implementations
2. Add new transports in `mcp-client.ts`
3. Combine tools from multiple servers

## License

MIT
