import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findUserByEmail, makeShortcutRequest, formatResponse } from "../utils/shortcut-api.js";

export function getUserEpicsByEmail(server: McpServer) {
  server.tool(
    "get epics by email",
    "Get all epics owned by a user (searched by email)",
    {
      email: z.string().describe("The email address of the user"),
      limit: z.number().optional().default(25).describe("Maximum number of epics to return (default: 25)"),
    },
    async ({ email, limit }) => {
      try {
        const user = await findUserByEmail(email);

        if (!user) {
          return formatResponse(false, `No user found with email: ${email}`, { epics: [] });
        }

        const searchQuery = `owner:${user.profile.mention_name}`;
        const epics = await makeShortcutRequest(
          `/search/epics?query=${encodeURIComponent(searchQuery)}&page_size=${limit}`
        );

        return formatResponse(true, `Found ${epics.data.length} epics for user ${user.profile.name}`, {
          user: {
            id: user.id,
            name: user.profile.name,
            email: user.profile.email_address,
          },
          epics: epics.data.map((epic: any) => {
            const pointsProgress = epic.stats?.num_points > 0
              ? Math.round((epic.stats.num_points_done / epic.stats.num_points) * 100)
              : 0;

            const storiesProgress = epic.stats?.num_stories_total > 0
              ? Math.round((epic.stats.num_stories_done / epic.stats.num_stories_total) * 100)
              : 0;

            return {
              id: epic.id,
              name: epic.name,
              description: epic.description,
              state: epic.state,
              completed: epic.completed,
              started: epic.started,
              created_at: epic.created_at,
              updated_at: epic.updated_at,
              deadline: epic.deadline,
              app_url: epic.app_url,
              progress: {
                points_percentage: pointsProgress,
                stories_percentage: storiesProgress,
                points: {
                  done: epic.stats?.num_points_done || 0,
                  started: epic.stats?.num_points_started || 0,
                  unstarted: epic.stats?.num_points_unstarted || 0,
                  total: epic.stats?.num_points || 0,
                },
                stories: {
                  done: epic.stats?.num_stories_done || 0,
                  started: epic.stats?.num_stories_started || 0,
                  unstarted: epic.stats?.num_stories_unstarted || 0,
                  total: epic.stats?.num_stories_total || 0,
                }
              }
            };
          })
        });
      } catch (error) {
        return formatResponse(false, `Error retrieving epics: ${error instanceof Error ? error.message : 'Unknown error'}`, { epics: [] });
      }
    }
  );
}
