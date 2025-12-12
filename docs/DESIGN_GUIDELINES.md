# edmap Design Guidelines

> **Status**: ✅ Active - These guidelines apply to all UI development

## Design Approach

**System**: Hybrid combining Linear's clean modernism, Notion's structured hierarchy, and Stripe's professional restraint. Journey-focused interface emphasizing progression and milestone achievements.

**Key Principles**: Clear state transitions, celebration moments at milestones, visual continuity across application-to-onboarding flow.

---

## Typography System

**Primary Font**: Inter via Google Fonts

| Use Case | Size | Weight |
|----------|------|--------|
| Journey Headers | 3xl to 4xl | bold |
| Stage Titles | xl to 2xl | semibold |
| Card Titles | base to lg | medium |
| Status Text | sm to base | normal |
| Labels/Metadata | xs to sm | medium, uppercase tracking-wide |
| Celebration Headlines | 4xl to 5xl | extrabold |

---

## Layout Architecture

**Container System**: `max-w-7xl mx-auto` with `px-6` to `px-8`

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Card padding: `p-6` to `p-8`
- Section gaps: `gap-6` to `gap-8`
- Journey step spacing: `space-y-8`

---

## Journey Flow Architecture

### Header Navigation

**Sticky header** (`h-16`) with:
- Left: "edmap" logo + Journey breadcrumb ("Application → Onboarding")
- Center: Progress indicator showing overall journey stage
- Right: Notifications + User avatar + Help icon

### Journey Progress Visualization

**Horizontal stepper component** positioned below header (`py-6`):
- 4 connected steps with circular nodes
- States: Completed (checkmark), Active (pulse ring), Upcoming (outlined)
- Steps: "Apply" → "Interview" → "Offer" → "Onboarding"
- Line connectors between nodes with gradient fill showing progress
- Current step highlighted with larger node + label below

### Application Details View

**Two-column layout** (`grid-cols-3`):

**Left Column (`col-span-2`)**:
- Interview Stages Card:
  - Stage list with expandable accordion items
  - Each stage: Badge status + Date + Interviewer name + Notes section
  - Feedback display area with avatar of interviewer + rating stars

- Offer Negotiation Card (appears after interviews):
  - Salary slider with current vs offered amounts
  - Benefits checklist with toggle states
  - Counteroffer form
  - Negotiation history timeline
  - Final offer badge when settled

**Right Column (`col-span-1`)**:
- Application Summary sticky card
- Timeline Activity Feed

---

## Component Specifications

### Journey Step Node
- Circle: `h-12 w-12`, `rounded-full`
- Active state: `ring-4` with pulse animation
- Completed: Checkmark icon inside
- Connector line: `h-0.5` between nodes

### Status Badges
- Pill shape: `rounded-full px-4 py-1.5`
- States: Scheduled, In Progress, Completed, Pending Review, Accepted, Declined
- Size variants: sm (`text-xs`) and lg (`text-sm font-semibold`)

### Interview Stage Card
- Accordion pattern with chevron icon
- Collapsed: Shows stage name + status + date (`h-16`)
- Expanded: Reveals feedback area, notes, action buttons
- Border-left accent color indicates status

### Offer Card
- Prominent display: `border-2` with `shadow-lg`
- Salary comparison: Two columns (Current vs Offered)
- Accept/Decline buttons: Full-width split layout (`grid-cols-2 gap-4`)

### Celebration Elements
- Modal backdrop: `backdrop-blur-md` with semi-transparent background
- Confetti: CSS animation or minimal library
- Success icons: Large (`h-24 w-24`), celebratory colors
- CTA buttons in celebration: Extra-large (`h-14 text-lg font-semibold`)

---

## Milestone Celebration Modal

**Triggered on offer acceptance**:
- Full-screen overlay with backdrop blur
- Center card (`max-w-2xl`)
- Confetti animation background
- Large congratulatory headline
- Primary CTA: "Start Onboarding Journey" (large, `h-14`, `w-full`)
- Auto-dismiss after 8 seconds or user action

---

## Images

**Hero Image**: Onboarding transition screen
- Placement: Full-width hero on transition screen
- Description: Professional workspace environment or team collaboration scene
- Treatment: Subtle gradient overlay from bottom for text readability
- Size: `h-96` on desktop, `h-64` on mobile

**Supporting Images**:
- Company logos: `h-16 w-16`, `rounded-lg`
- Interviewer avatars: Circular (`h-12 w-12`)
- Empty state illustrations: Centered, `max-w-sm`
- Celebration graphics: Abstract geometric shapes or minimal 3D elements

---

## Accessibility

- Journey progress: `aria-current` on active step, `aria-label` descriptions
- Modal focus trap: Lock focus within celebration modal
- Button minimum: `h-11` touch targets
- Keyboard navigation: Tab through interview stages, offer actions
- Status announcements: Use `aria-live` for progress updates

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (lg+) | Two-column layout, horizontal stepper |
| Tablet (md) | Single column, horizontal stepper (scaled) |
| Mobile | Stacked cards, vertical timeline (left-aligned) |

- Modal: Full-screen on mobile with slide-up animation

---

## Micro-interactions

| Element | Animation |
|---------|-----------|
| Step completion | Checkmark draw animation (500ms) |
| Offer acceptance | Button transforms to checkmark with scale |
| Card reveals | Stagger fade-in (100ms delay each) |
| Progress bar | Smooth width transition (`transition-all duration-700`) |
| Modal entrance | Scale + fade (`scale-95` to `scale-100`, 300ms) |

**Animation philosophy**: Purposeful feedback at milestone moments only—no gratuitous effects during standard navigation.

---

## Color Coding

| Context | Color |
|---------|-------|
| Journey Mode | Blue (primary) |
| Practice Mode | Teal |
| Success/Complete | Green |
| Warning/Pending | Amber |
| Error/Blocked | Red |
| Neutral/Inactive | Gray |
