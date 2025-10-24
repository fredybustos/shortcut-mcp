import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatResponse, findUserByEmail } from "../utils/shortcut-api.js";

export function searchUserByEmail(server: McpServer) {
  server.tool(
    "search user by email",
    "Search for a Shortcut user by their email address",
    {
      email: z.string().describe("The email address to search for"),
    },
    async ({ email }) => {
      try {
        const user = await findUserByEmail(email);

        if (!user) {
          return formatResponse(false, `No user found with email: ${email}`, { user: null });
        }

        return formatResponse(true, `User found: ${user.profile.name}`, {
          user: {
            id: user.id,
            name: user.profile.name,
            email: user.profile.email_address,
            mention_name: user.profile.mention_name,
            role: user.role,
            disabled: user.disabled,
            created_at: user.created_at,
            updated_at: user.updated_at,
          }
        });
      } catch (error) {
        return formatResponse(false, `Error searching for user: ${error instanceof Error ? error.message : 'Unknown error'}`, { user: null });
      }
    }
  );
}
