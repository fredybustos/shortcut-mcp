import { vi } from 'vitest';

// Set before any module import so SHORTCUT_API_TOKEN const is captured correctly
process.env.SHORTCUT_API_TOKEN = 'test-token';

global.fetch = vi.fn();
