/**
 * Sprint Planning Backlog Catalogue
 * 
 * Provides a unified source of backlog items for both planning and execution phases.
 * This ensures consistency between what users select during planning and what appears
 * on the sprint board during execution.
 */

import type { BacklogItem } from './types';
import type { CodeSnippet } from '../execution/types';

export interface CodeWorkTemplate {
  files: CodeSnippet[];
  testCommand?: string;
  testOutput?: {
    passing: string;
    failing: string;
  };
}

export interface BacklogCatalogueEntry extends BacklogItem {
  acceptanceCriteria?: string[];
  templateId?: string;
  codeWork?: CodeWorkTemplate;
}

export const PLANNING_BACKLOG_CATALOGUE: BacklogCatalogueEntry[] = [
  {
    id: 'TICK-001',
    title: 'Fix timezone display bug in user settings',
    description: 'Users in different timezones see incorrect timestamps. Transaction times are showing in UTC instead of the merchant\'s local timezone.',
    type: 'bug',
    priority: 'high',
    points: 3,
    acceptanceCriteria: [
      'Timestamps display in user\'s configured timezone',
      'Timezone preference can be set in user settings',
      'Existing timestamps are converted correctly'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/utils/dateUtils.ts',
          language: 'typescript',
          buggyCode: `export function formatTransactionDate(date: Date): string {
  // Bug: Always uses UTC, ignoring user's timezone preference
  return date.toISOString().split('T')[0];
}

export function formatTimestamp(date: Date): string {
  // Bug: Uses toUTCString which always shows UTC
  return date.toUTCString();
}`,
          fixedCode: `export function formatTransactionDate(date: Date, timezone?: string): string {
  // Fix: Use Intl.DateTimeFormat with user's timezone preference
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeZone: tz
  }).format(date);
}

export function formatTimestamp(date: Date, timezone?: string): string {
  // Fix: Format with user's timezone preference
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: tz
  }).format(date);
}`,
          highlightLines: [3, 8],
          explanation: 'The bug was using toISOString() and toUTCString() which always output in UTC. The fix uses Intl.DateTimeFormat with the user\'s timezone preference.'
        }
      ],
      testCommand: 'npm test -- dateUtils.test.ts',
      testOutput: {
        passing: '✓ formatTransactionDate displays in user timezone\n✓ formatTimestamp shows correct local time\n✓ falls back to browser timezone when not specified\n\nTests: 3 passed, 3 total',
        failing: '✗ formatTransactionDate displays in user timezone\n  Expected: "12/15/24"\n  Received: "2024-12-15"\n\nTests: 1 failed, 2 passed, 3 total'
      }
    }
  },
  {
    id: 'TICK-002',
    title: 'Implement user notifications',
    description: 'Add in-app notification system for activity updates. Users should receive notifications for important events like payment completions and team mentions.',
    type: 'feature',
    priority: 'high',
    points: 5,
    acceptanceCriteria: [
      'Notification bell icon in header with unread count',
      'Dropdown panel showing recent notifications',
      'Mark as read functionality',
      'Different notification types (info, warning, success)'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/components/NotificationBell.tsx',
          language: 'tsx',
          buggyCode: `// TODO: Implement notification bell component
export function NotificationBell() {
  return <div>Notifications</div>;
}`,
          fixedCode: `import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3 border-b font-semibold">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={\`p-3 hover:bg-gray-50 cursor-pointer \${!notification.read ? 'bg-blue-50' : ''}\`}
              >
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-gray-600">{notification.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}`,
          explanation: 'The notification bell component needs to show unread count, handle open/close state, and display a dropdown with notification items that can be marked as read.'
        }
      ],
      testCommand: 'npm test -- NotificationBell.test.tsx',
      testOutput: {
        passing: '✓ displays notification bell icon\n✓ shows unread count badge when notifications exist\n✓ opens dropdown on click\n✓ marks notification as read on click\n\nTests: 4 passed, 4 total',
        failing: '✗ shows unread count badge when notifications exist\n  Expected badge to be visible\n  Received: null\n\nTests: 1 failed, 3 passed, 4 total'
      }
    }
  },
  {
    id: 'TICK-003',
    title: 'Improve loading state feedback',
    description: 'Add skeleton loaders for better UX during data fetches. Currently, pages show blank content while loading which confuses users.',
    type: 'improvement',
    priority: 'medium',
    points: 2,
    acceptanceCriteria: [
      'Skeleton loaders on main dashboard',
      'Skeleton loaders on transaction list',
      'Loading states match final content layout'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/components/TransactionList.tsx',
          language: 'tsx',
          buggyCode: `import { useTransactions } from '@/hooks/useTransactions';

export function TransactionList() {
  const { data: transactions, isLoading } = useTransactions();
  
  // Bug: Shows nothing during loading state
  if (isLoading) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {transactions?.map(tx => (
        <div key={tx.id} className="p-4 border rounded-lg">
          <p className="font-semibold">{tx.description}</p>
          <p className="text-gray-600">\${tx.amount}</p>
        </div>
      ))}
    </div>
  );
}`,
          fixedCode: `import { useTransactions } from '@/hooks/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';

function TransactionSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

export function TransactionList() {
  const { data: transactions, isLoading } = useTransactions();
  
  // Fix: Show skeleton loaders during loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {transactions?.map(tx => (
        <div key={tx.id} className="p-4 border rounded-lg">
          <p className="font-semibold">{tx.description}</p>
          <p className="text-gray-600">\${tx.amount}</p>
        </div>
      ))}
    </div>
  );
}`,
          highlightLines: [7, 8],
          explanation: 'The loading state returned null, leaving users with a blank screen. The fix adds skeleton loaders that mimic the layout of actual transaction items.'
        }
      ],
      testCommand: 'npm test -- TransactionList.test.tsx',
      testOutput: {
        passing: '✓ shows skeleton loaders during loading\n✓ renders transactions when loaded\n✓ skeleton layout matches content layout\n\nTests: 3 passed, 3 total',
        failing: '✗ shows skeleton loaders during loading\n  Expected: skeleton elements to be visible\n  Received: null\n\nTests: 1 failed, 2 passed, 3 total'
      }
    }
  },
  {
    id: 'TICK-004',
    title: 'Fix null check in payment flow',
    description: 'Payment occasionally fails due to missing null checks. Edge cases with empty cart or missing customer data cause crashes.',
    type: 'bug',
    priority: 'high',
    points: 2,
    acceptanceCriteria: [
      'Null checks added for cart items',
      'Null checks added for customer data',
      'Error messages shown for invalid states',
      'Unit tests cover edge cases'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/services/paymentService.ts',
          language: 'typescript',
          buggyCode: `export async function processPayment(cart: Cart, customer: Customer) {
  // Bug: No null checks - crashes when cart is empty or customer data missing
  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: total * 100,
    currency: 'usd',
    customer: customer.stripeId,
    receipt_email: customer.email,
  });
  
  return paymentIntent;
}`,
          fixedCode: `export class PaymentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export async function processPayment(cart: Cart | null, customer: Customer | null) {
  // Fix: Add comprehensive null checks with meaningful error messages
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new PaymentError('Cannot process payment: Cart is empty', 'EMPTY_CART');
  }
  
  if (!customer) {
    throw new PaymentError('Cannot process payment: Customer data is missing', 'NO_CUSTOMER');
  }
  
  if (!customer.stripeId) {
    throw new PaymentError('Cannot process payment: Customer payment profile not set up', 'NO_STRIPE_ID');
  }
  
  if (!customer.email) {
    throw new PaymentError('Cannot process payment: Customer email is required', 'NO_EMAIL');
  }
  
  const total = cart.items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);
  
  if (total <= 0) {
    throw new PaymentError('Cannot process payment: Total must be greater than zero', 'INVALID_TOTAL');
  }
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: 'usd',
    customer: customer.stripeId,
    receipt_email: customer.email,
  });
  
  return paymentIntent;
}`,
          highlightLines: [2, 3, 5, 6, 7, 8, 9],
          explanation: 'The original code assumed all parameters were valid. The fix adds null checks for cart, cart items, customer, customer.stripeId, and customer.email with descriptive error codes.'
        }
      ],
      testCommand: 'npm test -- paymentService.test.ts',
      testOutput: {
        passing: '✓ processes valid payment successfully\n✓ throws EMPTY_CART error for empty cart\n✓ throws NO_CUSTOMER error for null customer\n✓ throws NO_STRIPE_ID error for missing stripeId\n✓ throws INVALID_TOTAL for zero total\n\nTests: 5 passed, 5 total',
        failing: '✗ throws EMPTY_CART error for empty cart\n  TypeError: Cannot read property \'items\' of null\n\nTests: 1 failed, 4 passed, 5 total'
      }
    }
  },
  {
    id: 'TICK-005',
    title: 'Add pagination to user list',
    description: 'User list becomes slow with many users, needs pagination. Currently loads all users at once which causes performance issues for large teams.',
    type: 'feature',
    priority: 'medium',
    points: 3,
    acceptanceCriteria: [
      'Page size of 20 users per page',
      'Previous/Next navigation buttons',
      'Page number display',
      'Jump to page functionality'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/components/UserList.tsx',
          language: 'tsx',
          buggyCode: `import { useUsers } from '@/hooks/useUsers';

export function UserList() {
  // Bug: Loads ALL users at once - slow for large datasets
  const { data: users, isLoading } = useUsers();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="space-y-2">
      {users?.map(user => (
        <div key={user.id} className="p-3 border rounded">
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      ))}
    </div>
  );
}`,
          fixedCode: `import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export function UserList() {
  const [page, setPage] = useState(1);
  
  // Fix: Load paginated data with page and limit
  const { data, isLoading } = useUsers({ page, limit: PAGE_SIZE });
  
  if (isLoading) return <div>Loading...</div>;
  
  const { users, totalPages, totalCount } = data ?? { users: [], totalPages: 0, totalCount: 0 };
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} users
      </div>
      
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="p-3 border rounded">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        
        <Button 
          variant="outline" 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}`,
          highlightLines: [4, 5],
          explanation: 'The original code fetched all users at once. The fix adds pagination with page state, server-side pagination query, and navigation controls with proper disabled states.'
        }
      ],
      testCommand: 'npm test -- UserList.test.tsx',
      testOutput: {
        passing: '✓ shows paginated user list\n✓ navigates to next page\n✓ navigates to previous page\n✓ disables previous on first page\n✓ disables next on last page\n✓ shows correct page info\n\nTests: 6 passed, 6 total',
        failing: '✗ shows paginated user list\n  Expected page controls to be visible\n  Received: null\n\nTests: 1 failed, 5 passed, 6 total'
      }
    }
  },
  // Sprint 2 tickets (tick-006, tick-007, tick-008)
  {
    id: 'tick-006',
    title: 'Usage metrics shows incorrect value - usage stats look wrong',
    description: 'The usage metrics is displaying wildly incorrect numbers. For example, adding 10 + 5 shows as 105. This appears to be a type coercion issue where values from URL query parameter are being treated as strings.',
    type: 'bug',
    priority: 'high',
    points: 3,
    acceptanceCriteria: [
      'Usage metrics correctly sums numeric values',
      'URL query parameters are properly parsed as numbers',
      'Edge cases with empty or invalid values are handled'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/services/metricsService.ts',
          language: 'typescript',
          buggyCode: `export function calculateUsageMetrics(params: URLSearchParams): number {
  // Bug: URL params are strings, concatenating instead of adding
  const current = params.get('current') || 0;
  const previous = params.get('previous') || 0;
  
  return current + previous;
}

export function parseMetricValue(value: string | null): number {
  // Bug: Returns string if value exists, causing concatenation
  return value || 0;
}`,
          fixedCode: `export function calculateUsageMetrics(params: URLSearchParams): number {
  // Fix: Parse URL params as integers before arithmetic
  const current = parseInt(params.get('current') || '0', 10);
  const previous = parseInt(params.get('previous') || '0', 10);
  
  // Validate parsed values are actual numbers
  if (isNaN(current) || isNaN(previous)) {
    return 0;
  }
  
  return current + previous;
}

export function parseMetricValue(value: string | null): number {
  // Fix: Always return a proper number
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}`,
          highlightLines: [3, 4, 5],
          explanation: 'URL query parameters are always strings. Using + operator on strings concatenates them ("10" + "5" = "105"). The fix uses parseInt() to convert strings to numbers before arithmetic.'
        }
      ],
      testCommand: 'npm test -- metricsService.test.ts',
      testOutput: {
        passing: '✓ calculateUsageMetrics adds numeric values correctly\n✓ handles empty params with default 0\n✓ handles invalid non-numeric values\n✓ parseMetricValue returns number type\n\nTests: 4 passed, 4 total',
        failing: '✗ calculateUsageMetrics adds numeric values correctly\n  Expected: 15\n  Received: "105"\n\nTests: 1 failed, 3 passed, 4 total'
      }
    }
  },
  {
    id: 'tick-007',
    title: 'Fix null reference error in user profile settings',
    description: 'The application crashes when accessing user.profile.settings for users who have not configured their profile. Need to add proper null checks.',
    type: 'bug',
    priority: 'high',
    points: 2,
    acceptanceCriteria: [
      'No crash when user.profile is null',
      'No crash when user.profile.settings is null',
      'Default values returned for missing settings',
      'Proper TypeScript types for nullable fields'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/services/userSettingsService.ts',
          language: 'typescript',
          buggyCode: `interface User {
  id: string;
  name: string;
  profile: {
    settings: {
      theme: string;
      notifications: boolean;
      language: string;
    };
  };
}

export function getUserTheme(user: User): string {
  // Bug: Crashes if profile or settings is undefined
  return user.profile.settings.theme;
}

export function getUserNotificationPreference(user: User): boolean {
  // Bug: No null check
  return user.profile.settings.notifications;
}

export function getUserLanguage(user: User): string {
  // Bug: Throws when accessing nested null
  return user.profile.settings.language;
}`,
          fixedCode: `interface UserSettings {
  theme: string;
  notifications: boolean;
  language: string;
}

interface UserProfile {
  settings?: UserSettings;
}

interface User {
  id: string;
  name: string;
  profile?: UserProfile;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  notifications: true,
  language: 'en',
};

export function getUserTheme(user: User): string {
  // Fix: Use optional chaining with nullish coalescing
  return user.profile?.settings?.theme ?? DEFAULT_SETTINGS.theme;
}

export function getUserNotificationPreference(user: User): boolean {
  // Fix: Safe access with default fallback
  return user.profile?.settings?.notifications ?? DEFAULT_SETTINGS.notifications;
}

export function getUserLanguage(user: User): string {
  // Fix: Graceful fallback for missing settings
  return user.profile?.settings?.language ?? DEFAULT_SETTINGS.language;
}`,
          highlightLines: [12, 13, 17, 21],
          explanation: 'The bug was accessing nested properties without null checks. The fix uses optional chaining (?.) and nullish coalescing (??) to safely access nested properties and provide sensible defaults.'
        }
      ],
      testCommand: 'npm test -- userSettingsService.test.ts',
      testOutput: {
        passing: '✓ getUserTheme returns theme when set\n✓ getUserTheme returns default when profile is null\n✓ getUserTheme returns default when settings is null\n✓ getUserNotificationPreference handles null profile\n✓ getUserLanguage handles missing settings\n\nTests: 5 passed, 5 total',
        failing: '✗ getUserTheme returns default when profile is null\n  TypeError: Cannot read property \'settings\' of undefined\n\nTests: 1 failed, 4 passed, 5 total'
      }
    }
  },
  {
    id: 'tick-008',
    title: 'Race condition when saving user preferences',
    description: 'When users rapidly change preferences, sometimes the wrong value gets saved. This appears to be a race condition in our async save logic.',
    type: 'bug',
    priority: 'medium',
    points: 3,
    acceptanceCriteria: [
      'Only the latest preference value is saved',
      'Previous pending saves are cancelled',
      'UI reflects the actual saved state',
      'No stale data overwrites newer data'
    ],
    codeWork: {
      files: [
        {
          filename: 'src/hooks/usePreferenceSave.ts',
          language: 'typescript',
          buggyCode: `import { useState } from 'react';

export function usePreferenceSave() {
  const [isSaving, setIsSaving] = useState(false);
  
  // Bug: Multiple rapid calls can complete out of order
  const savePreference = async (key: string, value: string) => {
    setIsSaving(true);
    
    // Simulated API call with variable delay
    await fetch('/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    
    setIsSaving(false);
  };
  
  return { savePreference, isSaving };
}`,
          fixedCode: `import { useState, useRef, useCallback } from 'react';

export function usePreferenceSave() {
  const [isSaving, setIsSaving] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveVersionRef = useRef(0);
  
  // Fix: Cancel previous pending requests and track versions
  const savePreference = useCallback(async (key: string, value: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // Track version to ignore stale responses
    const version = ++saveVersionRef.current;
    
    setIsSaving(true);
    
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
        signal: controller.signal,
      });
      
      // Only update state if this is still the latest request
      if (version === saveVersionRef.current) {
        setIsSaving(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      // Only handle error if this is still the latest request
      if (version === saveVersionRef.current) {
        setIsSaving(false);
        throw error;
      }
    }
  }, []);
  
  return { savePreference, isSaving };
}`,
          highlightLines: [7, 8, 10, 11, 12, 13],
          explanation: 'The race condition occurred because multiple async requests could complete in any order. The fix uses AbortController to cancel previous requests and a version counter to ignore stale responses.'
        }
      ],
      testCommand: 'npm test -- usePreferenceSave.test.ts',
      testOutput: {
        passing: '✓ saves preference successfully\n✓ cancels previous request on rapid calls\n✓ only processes latest request result\n✓ handles abort errors gracefully\n✓ isSaving reflects correct state\n\nTests: 5 passed, 5 total',
        failing: '✗ only processes latest request result\n  Expected: "value3" (last call)\n  Received: "value1" (first call completed last)\n\nTests: 1 failed, 4 passed, 5 total'
      }
    }
  }
];

export function getBacklogItemById(id: string): BacklogCatalogueEntry | undefined {
  return PLANNING_BACKLOG_CATALOGUE.find(item => item.id === id);
}

export function getBacklogItems(): BacklogCatalogueEntry[] {
  return PLANNING_BACKLOG_CATALOGUE;
}

export function getSelectedBacklogItems(selectedIds: string[]): BacklogCatalogueEntry[] {
  return PLANNING_BACKLOG_CATALOGUE.filter(item => selectedIds.includes(item.id));
}

export function calculateCapacity(selectedIds: string[]): number {
  return getSelectedBacklogItems(selectedIds).reduce((sum, item) => sum + item.points, 0);
}
