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

---

## Soft Skill Events UI Architecture

> **Status**: 🔄 In Design - Pending implementation

### Overview

Soft skill events are workplace scenarios that appear during sprints to practice professional communication. The UI uses a **channel-aware dispatcher architecture** where each event specifies which communication channel(s) to use.

### User Experience Narrative

**Day 2 of your sprint. You're in the zone, working on your ticket...**

A subtle notification badge pulses in the workspace header. You tap it and see: "Marcus needs to talk to you about the timeline."

You click through, and the team chat opens with Marcus's message already there:

> "Hey, just got out of a meeting with the client. They're asking if we can get the payment integration done by Thursday instead of next Monday. I know it's tight. What do you think?"

Below the chat input, you see three suggestion chips (if you're an intern, they're prominently labeled "Recommended"):

- **Ask for details** - "What specifically needs to be ready for the demo?"
- **Propose reduced scope** - "I could have the core flow ready, but edge cases would need to wait"
- **Need time to assess** - "Let me check my current tasks and get back to you in an hour"

You tap "Propose reduced scope" and the text appears in your input field. You tweak it slightly: "I could have the happy path ready by Thursday, but error handling and edge cases would need to ship Monday. Would that work for the demo?"

You hit send. A moment later, Marcus replies: "That actually works - they mainly want to show the flow. Thanks for being flexible!"

A subtle card slides in showing your evaluation:
- **Communication**: 88 - Clear and professional
- **Problem-solving**: 92 - Offered concrete alternative  
- **Assertiveness**: 85 - Maintained realistic scope

The event completes. Your soft skills competency ticks up. You return to your ticket, a little more prepared for the real world.

---

### Communication Channels

| Channel | Use Case | Visual Treatment |
|---------|----------|------------------|
| `chat_dm` | Direct message scenarios (deadline pressure, help requests) | Appears in team chat with persona avatar |
| `pr_review_thread` | Code feedback scenarios | Appears as review comment in PR panel |
| `ceremony_agenda` | Meeting negotiation (planning tension, retro conflict) | Appears as agenda card in ceremony module |
| `notification_badge` | Alerts and urgency indicators | Badge in workspace header |
| `modal_standalone` | Complex or multi-step scenarios (fallback) | Dedicated modal overlay |

### Multi-Channel Support

Events can specify multiple channels:

```typescript
channels: [
  { channelId: "chat_dm", role: "primary", responseCapture: "self" },
  { channelId: "notification_badge", role: "auxiliary", lifecycle: { dismissOnPrimaryOpened: true } }
]
```

**Coordination rules:**
- Primary channel captures the user's response for evaluation
- Auxiliary channels alert/coordinate but don't capture responses
- Lifecycle hooks dismiss auxiliary surfaces when primary is addressed

### Level-Aware Scaffolding

| Level | Suggestions | Visual State |
|-------|-------------|--------------|
| Intern | Always visible | Expanded, labeled "Recommended" |
| Junior | Visible | Expanded with subtle helper text |
| Mid | Available | Collapsed, labeled "Optional prompts" |
| Senior | Accessible | Hidden behind discreet icon |

### Event Log Surface

All soft skill events are tracked in a universal **Event Log** accessible from the workspace sidebar:
- View past events and your responses
- See evaluation feedback and growth areas
- Track soft skill competency progression
- Replay scenarios for review

### Visual Affordances

| Element | Treatment |
|---------|-----------|
| Event badge | Subtle pulse animation, accent color |
| "Soft Skill Event" ribbon | Small label on injected messages/comments |
| Suggestion chips | Rounded pills with hover state, click inserts text |
| Evaluation card | Slide-in from right, dismissible after 5s |
| Completion indicator | Checkmark animation on event log entry |

### Design Requirements Before Implementation

1. **Formalize contracts** - Channel descriptor schema, coordinator hooks, lifecycle policies
2. **Design event log surface** - Universal place to see/review all soft skill events  
3. **Define entry affordances** - Consistent "you're in an event" framing across channels
4. **Plan testing strategy** - Contract tests per renderer, integration tests for bindings
5. **Level-aware consistency** - Suggestion scaffolding must work identically across all renderers
