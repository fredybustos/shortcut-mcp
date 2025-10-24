# Shortcut MCP Server

An MCP (Model Context Protocol) server for integrating with the Shortcut API. This server allows searching for users by email and retrieving their assigned epics and stories.

## Features

### Available Tools

1. **`search_user_by_email`** - Search for a user by their email address
2. **`get_user_epics_by_email`** - Get all epics for a user (searched by email)
3. **`get_user_stories_by_email`** - Get all stories for a user (searched by email)
4. **`get_user_work_by_email`** - Get both epics and stories for a user in a single call
5. **`get_stories_by_due_date`** - Get all stories owned by a user filtered by due date

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Configuration

To use this MCP server, you need:

1. **Shortcut API Token**: Get your token from your Shortcut profile in Settings → API Tokens
2. **Configure the server in your MCP client** (like Copilot)

### VS Code Copilot Configuration

Add this to your VS Code configuration file: `~/Library/Application Support/Code/User`
Or if you prefer to use it only in a specific project: `.vscode/mcp.json`

```json
{
  "shortcut": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "tsx",
      "/your/path/to/shortcut-mcp/src/main.ts"
    ],
    "env": {
      "SHORTCUT_API_TOKEN": "your shortcut token"
    },
    "gallery": true
  }
}
```

## Usage

### Example 1: Search user by email

```
Search for the user with email "user@example.com"
```

### Example 2: Get epics for a user

```
Get the epics for user "user@example.com"
```

### Example 3: Get complete work for a user

```
Get both epics and stories for user "user@example.com"
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
- `filterType` (string, required): Type of filter: 'no_deadline' (stories without due date), 'has_deadline' (stories with any due date), 'before_date' (deadline before specified date), 'after_date' (deadline after specified date), 'between_dates' (deadline between two dates)
- `startDate` (string, optional): Start date in YYYY-MM-DD format (required for 'before_date', 'after_date', and 'between_dates')
- `endDate` (string, optional): End date in YYYY-MM-DD format (required for 'between_dates')
- `workflowStates` (array of strings, optional): Optional array of workflow state names to filter by. Available states: 'Backlog', 'Tasking', 'Todo', 'In progress', 'In review', 'In Qa', 'Ready to release', 'Released'. Example: ['In progress', 'In review'] for in-progress or in-review stories
- `limit` (number, optional): Maximum number of stories to return (default: 100)

## Responses

All tools return JSON in the following format:

```json
{
  "success": true/false,
  "message": "Description of the result",
  "user": { ... },  // Information about the found user
  "epics": [ ... ], // Array of epics (if applicable)
  "stories": [ ... ] // Array of stories (if applicable)
}
```

## Error Handling

The server handles various types of errors:
- User not found by email
- Authentication errors with Shortcut API
- Network errors
- Malformed API responses

All errors are returned in the standard format with `success: false` and a descriptive message.

## Limitations

- Email search requires listing all workspace members (no direct email search endpoint in Shortcut)
- Pagination limits are set by default to avoid very large responses
- A valid API token with read permissions in the workspace is required
