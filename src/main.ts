import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SHORTCUT_API_TOKEN } from "./utils/shortcut-api.js";
import { searchUserByEmail } from "./tools/searchUserByEmail.js";
import { getUserEpicsByEmail } from "./tools/getUserEpicsByEmail.js";
import { getUserStoriesByEmail } from "./tools/getUserStoriesByEmail.js";
import { getUserWorkByEmail } from "./tools/getUserWorkByEmail.js";
import { getStoriesByDueDate } from "./tools/getStoriesByDueDate.js";

if (!SHORTCUT_API_TOKEN) {
  console.error("Error: SHORTCUT_API_TOKEN environment variable is required");
  process.exit(1);
}

const server = new McpServer({
  name: "shortcut-mcp",
  version: "1.0.0",
  description: "MCP server for Shortcut API integration - retrieve epics and stories by user email",
});

searchUserByEmail(server);
getUserEpicsByEmail(server);
getUserStoriesByEmail(server);
getUserWorkByEmail(server);
getStoriesByDueDate(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shortcut MCP server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
