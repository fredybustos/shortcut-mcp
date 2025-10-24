import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  findUserByEmail,
  makeShortcutRequest,
  formatResponse,
  buildDeadlineSearchQuery,
} from "../utils/shortcut-api.js";

export function getStoriesByDueDate(server: McpServer) {
  server.tool(
    "get stories by due date",
    "Get all stories owned by a user filtered by due date.",
    {
      email: z.string().describe("The email address of the user"),
      filterType: z.enum(["no_deadline", "has_deadline", "before_date", "after_date", "between_dates"])
        .describe("Type of filter: 'no_deadline' (stories without due date), 'has_deadline' (stories with any due date), 'before_date' (deadline before specified date), 'after_date' (deadline after specified date), 'between_dates' (deadline between two dates)"),
      startDate: z.string().optional().describe("Start date in YYYY-MM-DD format (required for 'before_date', 'after_date', and 'between_dates')"),
      endDate: z.string().optional().describe("End date in YYYY-MM-DD format (required for 'between_dates')"),
      workflowStates: z.array(z.string()).optional().describe("Optional array of workflow state names to filter by. Available states: 'Backlog', 'Tasking', 'Todo', 'In progress', 'In review', 'In Qa', 'Ready to release', 'Released'. Example: ['In progress', 'In review'] for in-progress or in-review stories"),
      limit: z.number().optional().default(100).describe("Maximum number of stories to return (default: 100)"),
    },
    async ({ email, filterType, startDate, endDate, workflowStates, limit }) => {
      try {
        if ((filterType === "before_date" || filterType === "after_date") && !startDate) {
          return formatResponse(false, `startDate is required for filterType '${filterType}'`, { stories: [] });
        }
        if (filterType === "between_dates" && (!startDate || !endDate)) {
          return formatResponse(false, "Both startDate and endDate are required for filterType 'between_dates'", { stories: [] });
        }

        const user = await findUserByEmail(email);

        if (!user) {
          return formatResponse(false, `No user found with email: ${email}`, { stories: [] });
        }

        const searchQuery = buildDeadlineSearchQuery({
          ownerMentionName: user.profile.mention_name,
          filterType,
          startDate,
          endDate,
          workflowStates
        });

        const stories = await makeShortcutRequest(
          `/search/stories?query=${encodeURIComponent(searchQuery)}&page_size=${limit}`
        );

        const filterDescription = {
          no_deadline: "without due date",
          has_deadline: "with due date",
          before_date: `with due date before ${startDate}`,
          after_date: `with due date after ${startDate}`,
          between_dates: `with due date between ${startDate} and ${endDate}`,
        };

        const stateDescription = workflowStates && workflowStates.length > 0
          ? ` and workflow state(s): ${workflowStates.join(", ")}`
          : "";

        return formatResponse(
          true,
          `Found ${stories.data.length} stories for user ${user.profile.name} ${filterDescription[filterType]}${stateDescription}`,
          {
            user: {
              id: user.id,
              name: user.profile.name,
              email: user.profile.email_address,
            },
            filter: {
              type: filterType,
              startDate,
              endDate,
              workflowStates,
            },
            stories: stories.data
          }
        );
      } catch (error) {
        return formatResponse(
          false,
          `Error retrieving stories: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { stories: [] }
        );
      }
    }
  );
}
