# Dashboard Design Guidelines - B2B Workspace Simulator

## Design Approach
**System**: Hybrid approach combining Linear's clean modernism, Notion's data organization, and Stripe's professional restraint. Enterprise-grade dashboard optimized for information density and quick scanning.

## Typography System
**Primary Font**: Inter or DM Sans via Google Fonts
- Dashboard Title/Headers: 2xl to 3xl, font-semibold
- Section Headers: xl, font-semibold  
- Card Titles: base to lg, font-medium
- Metrics/Numbers: 3xl to 4xl, font-bold (tabular numerals)
- Body Text: sm to base, font-normal
- Labels/Captions: xs to sm, font-medium, uppercase tracking-wide

## Layout Architecture
**Container System**: max-w-screen-2xl mx-auto with px-6 to px-8
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Card padding: p-6
- Section gaps: gap-6 to gap-8
- Inter-section spacing: mb-8 to mb-12

**Grid Structure**:
```
Desktop: 12-column grid system
- Main metrics: 4-column grid (grid-cols-4)
- Mixed content: 3-column grid (grid-cols-3)
- Two-column split: grid-cols-2
Tablet: Collapse to 2 columns
Mobile: Single column stack
```

## Dashboard Layout Structure

### Header Section
**Full-width sticky header** with subtle border-b
- Left: Dashboard title "Workspace Simulator" + breadcrumb navigation
- Center: Global search bar (w-96)
- Right: Notification bell icon + user avatar + settings icon
- Height: h-16, backdrop-blur effect

### Hero Metrics Banner
**No large hero image** - data dashboards prioritize immediate metric visibility
Background: Subtle gradient or pattern overlay (CSS background-image: linear-gradient or pattern)
- 4-column metric cards (grid-cols-4) with:
  - Large number display (text-4xl font-bold)
  - Label below (text-sm uppercase tracking-wide)
  - Small trend indicator (arrow icon + percentage)
  - Micro sparkline chart (optional visual enhancement)
- Height: Auto-fit content, py-8

### Main Dashboard Grid (Primary Content)

**Section 1: Active Projects Overview**
- 2/3 width on desktop (col-span-8)
- Card container with table layout:
  - Headers: Project Name | Status | Progress | Team | Last Activity
  - Each row: Avatar group, status badge, progress bar (w-full h-2 rounded-full), timestamp
  - Max 5-6 visible rows with "View All" link
- Include search/filter controls above table

**Section 2: Quick Actions Sidebar**
- 1/3 width (col-span-4)
- Stacked card layout:
  - "Resume Simulation" card with list of 3 recent simulations
  - "Team Activity" feed with avatar + action text
  - "Schedule Training" CTA card with calendar icon

**Section 3: Performance Analytics** (Full-width)
- 3-column grid layout:
  - Column 1: Donut chart "Completion Rate" with legend
  - Column 2: Bar chart "Weekly Progress" (7 bars)
  - Column 3: Line chart "Engagement Trend" (30-day view)
- Each chart card: p-6, aspect-ratio-video
- Chart title at top (text-lg font-semibold), subtitle metric below

**Section 4: Team Performance Grid**
- 3-column layout (grid-cols-3)
- Team member cards with:
  - Avatar + name + role
  - 3 mini-metrics (Simulations | Hours | Score)
  - Progress bar for current training
  - "View Profile" link
- Display 6 team members per page

**Section 5: Recent Activity Timeline**
- 2-column layout (grid-cols-2):
  - Left: Activity feed with dot indicators, timestamps, action descriptions
  - Right: "Upcoming Deadlines" card with date badges + milestone list

### Floating Action Button
- Fixed bottom-right (bottom-8 right-8)
- Circular button (h-14 w-14) with "+" icon
- Purpose: "Start New Simulation"

## Component Specifications

### Card Component
- Rounded corners: rounded-lg to rounded-xl
- Border: border with subtle opacity
- Padding: p-6
- Shadow: shadow-sm on rest, shadow-md on hover
- Transition: all 200ms ease

### Metric Card Variant
- Vertical layout: flex flex-col
- Number-first hierarchy
- Icon/badge at top-right corner
- Comparison text at bottom (text-xs)

### Chart Containers
- Aspect ratio enforcement: aspect-[4/3]
- Responsive scaling with min-height constraints
- Legend positioned below or to right (never overlap chart)
- Axis labels: text-xs font-medium
- Grid lines: Subtle, low-opacity

### Status Badges
- Pill shape: rounded-full px-3 py-1
- Text: text-xs font-semibold uppercase tracking-wide
- States: Active, Paused, Completed, Pending
- Icon prefix for quick scanning

### Progress Bars
- Height: h-2 to h-3
- Rounded: rounded-full
- Container: Full-width with background track
- Fill: Transition smooth width changes

### Navigation Tabs (if sub-sections)
- Border-bottom indicator style
- Horizontal scroll on mobile
- Active state: border-b-2 font-semibold
- Spacing: gap-8 between tabs

## Data Visualization Principles
- **Chart Library**: Use Recharts or Chart.js via CDN
- **Color Assignment**: Rely on chart library defaults, modify later
- **Density**: Balance information richness with readability
- **Tooltips**: Interactive data points on hover
- **Responsive**: Stack charts vertically on mobile
- **Loading States**: Skeleton screens for charts (pulse animation)

## Images Section
**Hero Image**: NOT APPLICABLE - Dashboard leads with live metrics banner
**Decorative Graphics**: 
- Empty state illustrations: Use abstract 3D workspace/simulation graphics for "no projects" or "no data" states
- Place at center of empty cards with text-center messaging
- Size: max-w-xs mx-auto
- Style: Minimal, geometric, professional line art

**Avatar Images**: Team member photos throughout
- Circular crop: rounded-full
- Sizes: h-8 w-8 (small), h-10 w-10 (medium), h-16 w-16 (large)
- Avatar groups: Overlapping circles with -ml-2 on subsequent avatars

## Accessibility Implementation
- All interactive elements: min-h-11 touch targets
- Chart legends: keyboard navigable
- Status indicators: Include aria-label descriptions
- Form inputs: Proper label associations
- Focus states: Clear ring indicators (ring-2 ring-offset-2)
- Skip links: "Skip to main dashboard content"

## Responsive Behavior
- Desktop (lg+): Full 12-column grid, sidebar visible
- Tablet (md): 2-column collapse, stacked sections
- Mobile: Single column, charts scale to full-width, table converts to card list view
- Horizontal scroll for data tables on mobile with sticky first column

## Micro-interactions (Minimal)
- Card hover: Subtle lift (translate-y-1 shadow-md)
- Button states: Scale on active (scale-95)
- Number transitions: Count-up animation on mount (use library like CountUp.js)
- Progress bar fills: Smooth width transition (transition-all duration-500)

**No complex animations** - focus on instant data legibility