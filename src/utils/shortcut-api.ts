export const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN || "";

let membersCache: { data: any[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

async function getMembers(): Promise<any[]> {
  const now = Date.now();
  if (membersCache && now < membersCache.expiresAt) {
    return membersCache.data;
  }
  const data = await makeShortcutRequest('/members');
  membersCache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

export async function findUserByEmail(email: string): Promise<any> {
  const members = await getMembers();

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
