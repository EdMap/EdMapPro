/**
 * Sprint Planning Backlog Catalogue
 * 
 * Provides a unified source of backlog items for both planning and execution phases.
 * This ensures consistency between what users select during planning and what appears
 * on the sprint board during execution.
 */

import type { BacklogItem } from './types';

export interface BacklogCatalogueEntry extends BacklogItem {
  acceptanceCriteria?: string[];
  templateId?: string;
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
