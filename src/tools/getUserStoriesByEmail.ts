import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findUserByEmail, makeShortcutRequest, formatResponse } from "../utils/shortcut-api.js";

export function getUserStoriesByEmail(server: McpServer) {
  server.tool(
    "get stories by email",
    "Get all stories owned by a user (searched by email)",
    {
      email: z.string().describe("The email address of the user"),
      limit: z.number().optional().default(25).describe("Maximum number of stories to return (default: 25)"),
    },
    async ({ email, limit }) => {
      try {
        const user = await findUserByEmail(email);

        if (!user) {
          return formatResponse(false, `No user found with email: ${email}`, { stories: [] });
        }

        const searchQuery = `owner:${user.profile.mention_name}`;
        const stories = await makeShortcutRequest(
          `/search/stories?query=${encodeURIComponent(searchQuery)}&page_size=${limit}`
        );

        return formatResponse(true, `Found ${stories.data.length} stories for user ${user.profile.name}`, {
          user: {
            id: user.id,
            name: user.profile.name,
            email: user.profile.email_address,
          },
          stories: stories.data
        });
      } catch (error) {
        return formatResponse(false, `Error retrieving stories: ${error instanceof Error ? error.message : 'Unknown error'}`, { stories: [] });
      }
    }
  );
}
