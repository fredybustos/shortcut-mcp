# Shortcut MCP Server

An MCP (Model Context Protocol) server for integrating with the Shortcut API. This server allows searching for users by email and retrieving their assigned epics and stories.

## Features

### Available Tools

1. **`search_user_by_email`** - Search for a user by their email address
2. **`get_user_epics_by_email`** - Get all epics for a user (searched by email)
3. **`get_user_stories_by_email`** - Get all stories for a user (searched by email)
4. **`get_user_work_by_email`** - Get both epics and stories for a user in a single call
5. **`get_stories_by_due_date`** - Get all stories owned by a user filtered by due date

## Requirements

- Node.js >= 18
- A Shortcut API Token (Settings → API Tokens in your Shortcut workspace)

## Configuration

### Claude Code (recommended)

```bash
claude mcp add shortcut-mcp -e SHORTCUT_API_TOKEN=your_token -- npx -y shortcut-mcp
```

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shortcut": {
      "command": "npx",
      "args": ["-y", "shortcut-mcp"],
      "env": {
        "SHORTCUT_API_TOKEN": "your_token"
      }
    }
  }
}
```

### VS Code Copilot

Add this to your VS Code config (`~/Library/Application Support/Code/User/settings.json`) or to a project-specific `.vscode/mcp.json`:

```json
{
  "shortcut": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "shortcut-mcp"],
    "env": {
      "SHORTCUT_API_TOKEN": "your_token"
    },
    "gallery": true
  }
}
```

## Local Development

```bash
git clone https://github.com/fredybustos/shortcut-mcp
cd shortcut-mcp
npm install
SHORTCUT_API_TOKEN=your_token npm run dev
```

## Tool Parameters

### search_user_by_email
- `email` (string, required): Email of the user to search for

### get_user_epics_by_email
- `email` (string, required): User's email
- `limit` (number, optional): Maximum number of epics to return (default: 25)

### get_user_stories_by_email
- `email` (string, required): User's email
- `limit` (number, optional): Maximum number of stories to return (default: 25)

### get_user_work_by_email
- `email` (string, required): User's email
- `epic_limit` (number, optional): Maximum number of epics (default: 10)
- `story_limit` (number, optional): Maximum number of stories (default: 25)

### get_stories_by_due_date
- `email` (string, required): The email address of the user
- `filterType` (string, required): Type of filter: `no_deadline`, `has_deadline`, `before_date`, `after_date`, `between_dates`
- `startDate` (string, optional): Start date in YYYY-MM-DD format (required for `before_date`, `after_date`, and `between_dates`)
- `endDate` (string, optional): End date in YYYY-MM-DD format (required for `between_dates`)
- `workflowStates` (array of strings, optional): Filter by workflow state names. Available: `Backlog`, `Tasking`, `Todo`, `In progress`, `In review`, `In Qa`, `Ready to release`, `Released`
- `limit` (number, optional): Maximum number of stories to return (default: 100)

## Responses

All tools return JSON in the following format:

```json
{
  "success": true,
  "message": "Description of the result",
  "user": { },
  "epics": [ ],
  "stories": [ ]
}
```

## Limitations

- Email search requires listing all workspace members (no direct email search endpoint in Shortcut API). Results are cached for 5 minutes per process.
- Pagination limits are set by default to avoid very large responses.
- A valid API token with read permissions in the workspace is required.

## Contributing

We welcome contributions! If you have improvements, bug fixes, or new features, please feel free to submit a pull request.

## Acknowledgments

Thanks to Fredy Bustos for creating and maintaining this MCP server for Shortcut integration.
