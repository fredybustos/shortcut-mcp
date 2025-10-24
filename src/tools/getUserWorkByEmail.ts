import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findUserByEmail, makeShortcutRequest, formatResponse } from "../utils/shortcut-api.js";

export function getUserWorkByEmail(server: McpServer) {
  server.tool(
    "get work by email",
    "Get all work (epics and stories) owned by a user (searched by email)",
    {
      email: z.string().describe("The email address of the user"),
      epic_limit: z.number().optional().default(10).describe("Maximum number of epics to return (default: 10)"),
      story_limit: z.number().optional().default(25).describe("Maximum number of stories to return (default: 25)"),
    },
    async ({ email, epic_limit, story_limit }) => {
      try {
        const user = await findUserByEmail(email);

        if (!user) {
          return formatResponse(false, `No user found with email: ${email}`, {
            epics: [],
            stories: []
          });
        }

        const searchQuery = `owner:${user.profile.mention_name}`;

        const [epicsResponse, storiesResponse] = await Promise.all([
          makeShortcutRequest(
            `/search/epics?query=${encodeURIComponent(searchQuery)}&page_size=${epic_limit}`
          ),
          makeShortcutRequest(
            `/search/stories?query=${encodeURIComponent(searchQuery)}&page_size=${story_limit}`
          )
        ]);

        const epics = epicsResponse.data.map((epic: any) => ({
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
        }));

        const stories = storiesResponse.data.map((story: any) => ({
          id: story.id,
          name: story.name,
          description: story.description,
          story_type: story.story_type,
          estimate: story.estimate,
          completed: story.completed,
          started: story.started,
          created_at: story.created_at,
          updated_at: story.updated_at,
          deadline: story.deadline,
          app_url: story.app_url,
          project_id: story.project_id,
          epic_id: story.epic_id,
        }));

        return formatResponse(
          true,
          `Found ${epics.length} epics and ${stories.length} stories for user ${user.profile.name}`,
          {
            user: {
              id: user.id,
              name: user.profile.name,
              email: user.profile.email_address,
              mention_name: user.profile.mention_name,
            },
            epics,
            stories
          }
        );
      } catch (error) {
        return formatResponse(false, `Error retrieving user work: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          epics: [],
          stories: []
        });
      }
    }
  );
}
