import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildDeadlineSearchQuery,
  formatResponse,
  findUserByEmail,
} from '../utils/shortcut-api.js';

const MEMBERS = [
  {
    id: 'user-1',
    role: 'member',
    disabled: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    profile: {
      email_address: 'alice@example.com',
      name: 'Alice Smith',
      mention_name: 'alice',
    },
  },
  {
    id: 'user-2',
    role: 'admin',
    disabled: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    profile: {
      email_address: 'Bob@Example.com',
      name: 'Bob Jones',
      mention_name: 'bob',
    },
  },
];

function makeFetchResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 401,
    statusText: ok ? 'OK' : 'Unauthorized',
    json: () => Promise.resolve(body),
  } as Response);
}

describe('buildDeadlineSearchQuery', () => {
  it('no_deadline — adds !has:deadline', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'no_deadline',
    });
    expect(result).toBe('owner:alice !has:deadline');
  });

  it('has_deadline — adds has:deadline', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'has_deadline',
    });
    expect(result).toBe('owner:alice has:deadline');
  });

  it('before_date — uses startDate with < operator', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'before_date',
      startDate: '2025-06-01',
    });
    expect(result).toBe('owner:alice deadline:<2025-06-01');
  });

  it('after_date — uses startDate with > operator', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'after_date',
      startDate: '2025-06-01',
    });
    expect(result).toBe('owner:alice deadline:>2025-06-01');
  });

  it('between_dates — uses startDate..endDate range syntax', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'between_dates',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
    expect(result).toBe('owner:alice deadline:2025-01-01..2025-12-31');
  });

  it('appends a single workflow state', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'has_deadline',
      workflowStates: ['In progress'],
    });
    expect(result).toBe('owner:alice has:deadline state:"In progress"');
  });

  it('joins multiple workflow states with quoted comma-separation', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'has_deadline',
      workflowStates: ['In progress', 'In review'],
    });
    expect(result).toBe('owner:alice has:deadline state:"In progress","In review"');
  });

  it('omits state filter when workflowStates is an empty array', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'has_deadline',
      workflowStates: [],
    });
    expect(result).toBe('owner:alice has:deadline');
  });

  it('omits state filter when workflowStates is undefined', () => {
    const result = buildDeadlineSearchQuery({
      ownerMentionName: 'alice',
      filterType: 'no_deadline',
    });
    expect(result).toBe('owner:alice !has:deadline');
  });
});

describe('formatResponse', () => {
  it('returns success:true with message', () => {
    const result = formatResponse(true, 'All good');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe('All good');
  });

  it('returns success:false with message', () => {
    const result = formatResponse(false, 'Something went wrong');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.message).toBe('Something went wrong');
  });

  it('spreads extra data fields into the top-level object', () => {
    const result = formatResponse(true, 'Found user', { user: { id: 'abc' } });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.user).toEqual({ id: 'abc' });
  });

  it('content is always an array with a single text item', () => {
    const result = formatResponse(true, 'ok');
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
  });

  it('text field is valid JSON', () => {
    const result = formatResponse(true, 'ok', { count: 3 });
    expect(() => JSON.parse(result.content[0].text)).not.toThrow();
  });
});

describe('findUserByEmail', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
    vi.mocked(global.fetch).mockReturnValue(makeFetchResponse(MEMBERS));
  });

  it('returns the matching user when email matches exactly', async () => {
    const user = await findUserByEmail('alice@example.com');
    expect(user).not.toBeNull();
    expect(user.id).toBe('user-1');
    expect(user.profile.mention_name).toBe('alice');
  });

  it('returns null when no member has the given email', async () => {
    const user = await findUserByEmail('nobody@example.com');
    expect(user).toBeNull();
  });

  it('is case-insensitive on both sides of the comparison', async () => {
    const user = await findUserByEmail('bob@example.com');
    expect(user).not.toBeNull();
    expect(user.id).toBe('user-2');
  });

  it('matches when the lookup email has mixed case', async () => {
    const user = await findUserByEmail('ALICE@EXAMPLE.COM');
    expect(user).not.toBeNull();
    expect(user.id).toBe('user-1');
  });
});
