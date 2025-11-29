# EdMap B2B Onboarding Platform - Design Guidelines

## Design Approach
**System**: Hybrid combining Linear's clean modernism, Notion's structured hierarchy, and Stripe's professional restraint. Journey-focused interface emphasizing progression and milestone achievements.

**Key Principles**: Clear state transitions, celebration moments at milestones, visual continuity across application-to-onboarding flow.

## Typography System
**Primary Font**: Inter via Google Fonts
- Journey Headers: 3xl to 4xl, font-bold
- Stage Titles: xl to 2xl, font-semibold
- Card Titles: base to lg, font-medium
- Status Text: sm to base, font-normal
- Labels/Metadata: xs to sm, font-medium, uppercase tracking-wide
- Celebration Headlines: 4xl to 5xl, font-extrabold

## Layout Architecture
**Container System**: max-w-7xl mx-auto with px-6 to px-8
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Card padding: p-6 to p-8
- Section gaps: gap-6 to gap-8
- Journey step spacing: space-y-8

## Journey Flow Architecture

### Header Navigation
**Sticky header** (h-16) with:
- Left: "EdMap" logo + Journey breadcrumb ("Application → Onboarding")
- Center: Progress indicator showing overall journey stage (Interview/Negotiation/Offer/Onboarding)
- Right: Notifications + User avatar + Help icon

### Journey Progress Visualization
**Horizontal stepper component** positioned below header (py-6):
- 4 connected steps with circular nodes
- States: Completed (checkmark), Active (pulse ring), Upcoming (outlined)
- Steps: "Apply" → "Interview" → "Offer" → "Onboarding"
- Line connectors between nodes with gradient fill showing progress
- Current step highlighted with larger node + label below

### Application Details View

**Two-column layout** (grid-cols-3):

**Left Column (col-span-2)**: 
- Interview Stages Card:
  - Stage list with expandable accordion items
  - Each stage: Badge status + Date + Interviewer name + Notes section
  - Stage 1: Technical Interview (completed checkmark)
  - Stage 2: Behavioral Interview (in-progress spinner or completed)
  - Feedback display area with avatar of interviewer + rating stars

- Offer Negotiation Card (appears after interviews):
  - Salary slider with current vs offered amounts
  - Benefits checklist with toggle states
  - Counteroffer form (text area + "Submit Counteroffer" button)
  - Negotiation history timeline with back-and-forth exchanges
  - Final offer badge when settled

**Right Column (col-span-1)**:
- Application Summary sticky card:
  - Company logo + name
  - Position title
  - Key details list (Location, Start Date, Salary)
  - Current Status badge (large, prominent)
  
- Timeline Activity Feed:
  - Vertical timeline with dot indicators
  - Recent actions with timestamps
  - Auto-updates as stages progress

### Milestone Celebration Modal

**Triggered on offer acceptance**:
- Full-screen overlay with backdrop blur
- Center card (max-w-2xl):
  - Confetti animation background (CSS particles or lottie)
  - Large congratulatory headline "Offer Accepted! 🎉"
  - Company logo + position title
  - Brief celebratory message
  - Start date prominently displayed
  - Primary CTA: "Start Onboarding Journey" (large, h-14, w-full)
  - Secondary link: "Review Offer Details"
- Auto-dismiss after 8 seconds or user action

### Onboarding Transition Screen

**Bridge page between acceptance and workspace**:
- Hero section with illustration:
  - Welcome headline "Welcome to [Company Name]!"
  - Subtitle "Let's get you ready for day one"
  - Supporting text about onboarding process
  
- Onboarding Checklist Preview (3-column grid):
  - Pre-start tasks card (Documents, Equipment, Access)
  - Week 1 plan card (Orientation schedule, Team introductions)
  - Resources card (Handbook links, Contact info)
  
- Prominent "Enter Workspace Simulator" button (h-16, centered)

### Workspace Simulator Dashboard
*Inherits from existing dashboard guidelines*:
- Welcome banner with personalized greeting + days until start
- Quick-start simulation cards
- Integration with training modules

## Component Specifications

### Journey Step Node
- Circle: h-12 w-12, rounded-full
- Active state: ring-4 with pulse animation
- Completed: Checkmark icon inside
- Connector line: h-0.5 between nodes

### Status Badges
- Pill shape: rounded-full px-4 py-1.5
- States: Scheduled, In Progress, Completed, Pending Review, Accepted, Declined
- Size variants: sm (text-xs) and lg (text-sm font-semibold)

### Interview Stage Card
- Accordion pattern with chevron icon
- Collapsed: Shows stage name + status + date (h-16)
- Expanded: Reveals feedback area, notes, action buttons
- Border-left accent color indicates status

### Offer Card
- Prominent display: border-2 with shadow-lg
- Salary comparison: Two columns (Current vs Offered)
- Accept/Decline buttons: Full-width split layout (grid-cols-2 gap-4)
- Accept button: Primary style (h-12)
- Decline button: Secondary/outline style

### Celebration Elements
- Modal backdrop: backdrop-blur-md with semi-transparent background
- Confetti: CSS animation or minimal library
- Success icons: Large (h-24 w-24), celebratory colors
- CTA buttons in celebration: Extra-large (h-14 text-lg font-semibold)

## Images Section

**Hero Image**: YES - Onboarding transition screen
- Placement: Full-width hero on transition screen
- Description: Professional workspace environment or team collaboration scene with welcoming atmosphere
- Treatment: Subtle gradient overlay from bottom for text readability
- Size: h-96 on desktop, h-64 on mobile
- Buttons on image: Use backdrop-blur-md background on CTA button

**Supporting Images**:
- Company logos: Throughout journey (h-16 w-16, rounded-lg)
- Interviewer avatars: Circular (h-12 w-12), shown in feedback sections
- Empty state illustrations: When no interviews scheduled (centered, max-w-sm)
- Celebration graphics: Abstract geometric shapes or minimal 3D elements in modals

## Accessibility
- Journey progress: aria-current on active step, aria-label descriptions
- Modal focus trap: Lock focus within celebration modal
- Button minimum: h-11 touch targets
- Keyboard navigation: Tab through interview stages, offer actions
- Status announcements: Use aria-live for progress updates

## Responsive Behavior
- Desktop (lg+): Two-column layout, horizontal stepper
- Tablet (md): Single column, stepper stays horizontal but scales
- Mobile: Stack all cards, stepper converts to vertical timeline (left-aligned)
- Modal: Full-screen on mobile with slide-up animation

## Micro-interactions
- Step completion: Checkmark draw animation (500ms)
- Offer acceptance: Button transforms to checkmark with scale animation
- Card reveals: Stagger fade-in when transitioning between views (100ms delay each)
- Progress bar: Smooth width transition (transition-all duration-700)
- Modal entrance: Scale + fade (scale-95 to scale-100, 300ms)

**Animation philosophy**: Purposeful feedback at milestone moments only—no gratuitous effects during standard navigation.