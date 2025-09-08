#!/usr/bin/env tsx

import { MicrosoftPlaywrightMCPClient } from '../src/mcp/microsoft-playwright-mcp-client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test Microsoft Playwright MCP server connection
 */
async function testMCPConnection(): Promise<void> {
  console.log('Testing Microsoft Playwright MCP server connection...\n');

  const mcpClient = new MicrosoftPlaywrightMCPClient({
    enabled: true
  });

  try {
    // Initialize connection
    console.log('1. Initializing MCP client...');
    await mcpClient.initialize();

    // Test connection
    console.log('2. Testing MCP connection...');
    const isConnected = await mcpClient.testConnection();
    
    if (isConnected) {
      console.log('SUCCESS: MCP connection successful!');
      
      // Get available tools
      console.log('3. Fetching available MCP tools...');
      const tools = await mcpClient.getAvailableTools();
      
      if (tools.length > 0) {
        console.log(`Available tools (${tools.length}):`);
        tools.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool}`);
        });
      } else {
        console.log('WARNING: No tools available from MCP server');
      }

      // Test basic test generation
      console.log('\n4. Testing basic test generation...');
      const testScenario = {
        title: 'Test MCP Integration',
        description: 'Verify MCP can generate valid Playwright tests',
        type: 'positive'
      };

      const generatedTest = await mcpClient.generateValidatedTest(testScenario);
      
      if (generatedTest && generatedTest.length > 0) {
        console.log('SUCCESS: Test generation successful!');
        console.log(`Generated test length: ${generatedTest.length} characters`);
        console.log('Test preview:');
        console.log('─'.repeat(50));
        console.log(generatedTest.substring(0, 300) + '...');
        console.log('─'.repeat(50));
      } else {
        console.log('ERROR: Test generation failed - empty result');
      }

    } else {
      console.log('ERROR: MCP connection failed');
    }

    // Disconnect
    console.log('\n5. Disconnecting from MCP server...');
    await mcpClient.disconnect();
    console.log('SUCCESS: Disconnected successfully');

  } catch (error) {
    console.error('ERROR: MCP test failed:', error);
    
    // Try to disconnect even if there was an error
    try {
      await mcpClient.disconnect();
    } catch (disconnectError) {
      console.error('ERROR: Failed to disconnect:', disconnectError);
    }
  }

  console.log('\nMCP Connection Test Complete!');
  console.log('\nSummary:');
  console.log('   • Microsoft Playwright MCP server: @playwright/mcp');
  console.log('   • Connection method: stdio transport');
  console.log('   • Capabilities: Real-time Playwright API validation');
  console.log('   • Benefits: Eliminates syntax errors, provides accurate selectors');
}

// Run the test
if (require.main === module) {
  testMCPConnection().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
