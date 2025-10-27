# Design Guidelines: only-u-new Messaging Platform

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern messaging platforms (Discord, Slack, Linear) with emphasis on real-time communication, clean information hierarchy, and intuitive interactions.

**Key Design Principles**:
- **Clarity First**: Messaging interfaces prioritize readability and quick scanning
- **Real-time Feedback**: Visual indicators for online status, typing, and message delivery
- **Conversation Focus**: Minimize UI chrome to maximize message content area
- **Hierarchy Through Depth**: Use subtle shadows and borders to create depth without heavy colors

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Background Primary: 0 0% 100%
- Background Secondary: 240 5% 96%
- Background Tertiary: 240 5% 92%
- Text Primary: 240 10% 10%
- Text Secondary: 240 5% 45%
- Border: 240 6% 90%
- Accent Primary: 217 91% 60% (Blue - for links, primary actions)
- Accent Secondary: 142 76% 36% (Green - for online status, success)
- Alert: 0 84% 60% (Red - for notifications, errors)

**Dark Mode**:
- Background Primary: 240 10% 8%
- Background Secondary: 240 8% 12%
- Background Tertiary: 240 8% 16%
- Text Primary: 0 0% 98%
- Text Secondary: 240 5% 65%
- Border: 240 6% 20%
- Accent Primary: 217 91% 65%
- Accent Secondary: 142 70% 45%
- Alert: 0 84% 65%

### B. Typography

**Font Families**:
- Primary: Inter (via Google Fonts) - for UI elements, messages, body text
- Monospace: 'JetBrains Mono' - for code snippets, timestamps

**Type Scale**:
- Headlines: text-2xl font-semibold (conversation titles)
- Body: text-base font-normal (messages, main content)
- Small: text-sm (timestamps, metadata)
- Tiny: text-xs (badges, helper text)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 8, 12, and 16 for consistent rhythm
- Compact spacing: p-2, gap-2 (message bubbles, inline elements)
- Standard spacing: p-4, gap-4 (cards, list items)
- Generous spacing: p-8, gap-8 (sections, page padding)

**Grid Structure**:
- Sidebar: Fixed 280px width on desktop, collapsible on mobile
- Main Content: Flexible width with max-w-4xl for messages
- Right Panel: 320px for user info/settings (when shown)

### D. Component Library

**Navigation**:
- Left Sidebar: User list, conversation list with unread badges
- Top Bar: Current conversation title, online status, search
- Use subtle hover states (background opacity changes)

**Message Components**:
- Message Bubble: Rounded corners (rounded-lg), subtle shadows
- Sender's messages: Align right, accent color background
- Received messages: Align left, secondary background
- Timestamps: Small, secondary text, positioned below messages
- Unread Indicator: Red dot badge, subtle pulse animation

**Forms & Inputs**:
- Message Input: Fixed bottom bar, rounded-xl, border focus state
- Attachment Button: Icon-only, ghost style
- Send Button: Accent color, icon or text based on input state

**Cards & Lists**:
- Conversation Items: Hover state, active state for selected
- User Avatars: Circular, with online status indicator (green dot)
- Notification Badges: Red background, white text, rounded-full

**Data Displays**:
- Typing Indicator: Three animated dots in secondary color
- Message Status: Check marks (sent, delivered, read)
- Time Separators: Centered text with horizontal lines

**Overlays**:
- Modals: Centered, backdrop blur, rounded corners
- Tooltips: Small, dark background, white text
- Dropdowns: Subtle shadow, border

### E. Animations

**Minimal, Purposeful Animations**:
- Message Send: Subtle slide-up and fade-in (duration-200)
- Unread Badge: Gentle pulse when new message arrives
- Typing Indicator: Smooth dot bounce
- NO scroll-triggered animations or complex transitions

---

## Images

**Profile Avatars**: 40px × 40px circular images throughout the interface. Use placeholder images from UI Avatars API (https://ui-avatars.com/api/)

**No Hero Section**: This is a utility-focused messaging app - no marketing hero needed. The interface should load directly into the messaging view for authenticated users, or a simple login screen for unauthenticated users.

**Media in Messages**: Support inline image previews (max 400px width) with rounded corners, clickable to expand.

---

## Key Layout Patterns

**Three-Column Layout** (Desktop):
1. Left Sidebar (280px): Conversations list, search, user menu
2. Center Panel (flexible): Active conversation messages
3. Right Panel (320px, toggleable): User profile, shared media

**Mobile Layout**:
- Single column view
- Bottom navigation for switching between conversations/profile
- Full-screen conversation view with back button

**Conversation View**:
- Messages flow from top to bottom
- Sticky input bar at bottom
- Scroll-to-bottom button when scrolled up
- Date separators between message groups