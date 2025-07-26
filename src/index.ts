import { runAIWithMCPTools, exampleGmailInteraction } from './client/mcp-client.js';

async function main() {
  console.log('Gmail MCP Server with AI SDK Demo');
  console.log('=====================================\n');

  try {
    // Run example interaction
    await exampleGmailInteraction();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runAIWithMCPTools, exampleGmailInteraction };
