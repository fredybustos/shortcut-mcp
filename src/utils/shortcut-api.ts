export const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN || "";

export type DeadlineFilterType = "no_deadline" | "has_deadline" | "before_date" | "after_date" | "between_dates";

export interface DeadlineSearchQueryParams {
  ownerMentionName: string;
  filterType: DeadlineFilterType;
  startDate?: string;
  endDate?: string;
  workflowStates?: string[];
}

export async function makeShortcutRequest(endpoint: string): Promise<any> {
  if (!SHORTCUT_API_TOKEN) {
    throw new Error("SHORTCUT_API_TOKEN environment variable is required");
  }

  const response = await fetch(`https://api.app.shortcut.com/api/v3${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Shortcut-Token': SHORTCUT_API_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`Shortcut API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function findUserByEmail(email: string): Promise<any> {
  const members = await makeShortcutRequest('/members');

  const user = members.find((member: any) =>
    member.profile?.email_address?.toLowerCase() === email.toLowerCase()
  );

  return user || null;
}

export function formatResponse(success: boolean, message: string, data: any = null) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          success,
          message,
          ...data,
        }, null, 2)
      }
    ]
  };
}



export function buildDeadlineSearchQuery({
  ownerMentionName,
  filterType,
  startDate,
  endDate,
  workflowStates
}: DeadlineSearchQueryParams): string {
  const baseQuery = `owner:${ownerMentionName}`;

  let deadlineFilter = "";
  switch (filterType) {
    case "no_deadline":
      deadlineFilter = " !has:deadline";
      break;
    case "has_deadline":
      deadlineFilter = " has:deadline";
      break;
    case "before_date":
      deadlineFilter = ` deadline:<${startDate}`;
      break;
    case "after_date":
      deadlineFilter = ` deadline:>${startDate}`;
      break;
    case "between_dates":
      deadlineFilter = ` deadline:${startDate}..${endDate}`;
      break;
  }

  const stateFilter = workflowStates && workflowStates.length > 0
    ? ` state:"${workflowStates.join('","')}"`
    : "";

  return `${baseQuery}${deadlineFilter}${stateFilter}`;
}
