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
