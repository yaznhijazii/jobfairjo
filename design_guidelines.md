# JO Academy Talent Finder - Design Guidelines

## Design Approach

**Selected Approach**: Design System Foundation (Material Design) with Career Platform Refinements

**Justification**: This AI-powered recruitment tool requires both functional clarity for utility tasks (PDF upload, job browsing) and professional polish for employer branding. Drawing from Material Design's structured component system while incorporating best practices from LinkedIn Talent Solutions and modern SaaS dashboards ensures efficient workflows and credible presentation.

**Key Design Principles**:
1. **Progressive Disclosure**: Guide users through upload → analysis → results with clear visual hierarchy
2. **Trust & Transparency**: Make AI processing visible through status indicators and confidence metrics
3. **Scannable Results**: Job matches must be instantly comparable with clear visual differentiation
4. **Professional Polish**: Reflect JO Academy's brand credibility through clean, modern interface

---

## Core Design Elements

### A. Typography System

**Font Families**:
- **Primary**: Inter (via Google Fonts) - headings, UI elements, metrics
- **Secondary**: System UI fonts fallback - body text, descriptions

**Type Scale**:
- **Hero Title**: text-5xl (48px), font-bold, tracking-tight - "JO Academy Talent Finder"
- **Section Headers**: text-2xl (24px), font-semibold - "Submit Your Resume", "Top Matches"
- **Card Titles**: text-xl (20px), font-semibold - Job titles in results
- **Body Text**: text-base (16px), font-normal - Descriptions, instructions
- **Metadata**: text-sm (14px), font-medium - Department, location labels
- **Captions**: text-xs (12px), font-normal - Helper text, timestamps

**Hierarchy Rules**:
- All headings use tight line-height (leading-tight to leading-snug)
- Body text maintains comfortable reading (leading-relaxed, max-w-prose for long content)
- Uppercase text-transform only for labels/tags (text-xs uppercase tracking-wide)

---

### B. Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16, 24**
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-24
- Card gaps: gap-6 for horizontal, gap-8 for vertical stacks
- Content margins: mb-4 for related elements, mb-8 for section breaks

**Grid Structure**:
- **Container**: max-w-7xl mx-auto px-6 - standard content wrapper
- **Three-Column Results**: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Two-Column Upload Section**: grid md:grid-cols-2 gap-8 (instructions + upload zone)

**Page Layout Flow**:
1. Header/Navigation (fixed or sticky)
2. Hero Section (centered, contained)
3. Upload Interface (max-w-4xl centered)
4. Processing Status (full-width with centered content)
5. Results Grid (max-w-7xl, three-column cards)
6. Footer (full-width)

---

### C. Component Library

#### Navigation Header
- Full-width with max-w-7xl container
- Height: h-16 to h-20
- Logo (left): JO Academy branding with icon
- Navigation links (center/right): "How It Works", "FAQ", "Contact"
- CTA button (right): "Upload CV" sticky action

#### Hero Section
- Height: min-h-[400px] (not full viewport, allowing scroll preview)
- Centered content: max-w-3xl mx-auto text-center
- Title + tagline + visual element (illustration or abstract pattern)
- Spacing: py-16 to py-24

#### CV Upload Card
- Border radius: rounded-xl
- Shadow: shadow-lg
- Padding: p-8
- Drag-and-drop zone: min-h-[240px] with dashed border (border-dashed border-2)
- Icon: Large upload icon (w-16 h-16) centered above text
- States: Default, Hover (scale-105 transition), Active (border-solid), Uploaded (checkmark icon)

#### Status/Progress Indicators
- **Processing Bar**: Full-width bar with animated progress fill
- **Step Indicators**: Numbered circles (1, 2, 3) with connecting lines
- **Status Messages**: Toast-style notifications (fixed bottom-right, rounded-lg, shadow-xl, p-4)
- **Loading Spinner**: Centered, w-8 h-8, animated rotation

#### Job Match Cards (Primary Component)
Structure per card:
- Container: rounded-xl, shadow-md, p-6, hover:shadow-xl transition
- Rank Badge: Absolute top-right, rounded-full, px-3 py-1, text-xs font-bold
- Job Title: text-xl font-semibold, mb-2
- Match Confidence Meter:
  - Large percentage display: text-4xl font-bold
  - Visual bar: h-2 rounded-full, progress fill with gradient
  - Label below: text-xs ("Deep AI Scrutiny" or "Basic Match")
- Divider: border-t my-4
- Metadata Grid:
  - Icons + text pairs (grid grid-cols-2 gap-3)
  - Department, Location, Type, Posted Date
- Description Preview: text-sm, line-clamp-3
- Action Button: Full-width at bottom, "View Full Details"

#### Modal/Detail View
- Overlay: Full-screen backdrop (backdrop-blur-sm)
- Panel: max-w-4xl, rounded-xl, shadow-2xl, max-h-[90vh] overflow-y-auto
- Close button: Absolute top-right, rounded-full button
- Content sections: Job title, full description, requirements list, apply CTA

#### Empty/Error States
- Centered content: max-w-md mx-auto text-center
- Icon: w-24 h-24 (illustrative, not just utility icon)
- Message: text-lg font-medium
- Action button: "Try Again" or "Go Back"

---

### D. Interactive Patterns

**Micro-interactions** (Use sparingly):
- Card hover: subtle lift (hover:-translate-y-1 transition-transform)
- Button press: scale-95 active state
- File upload: fade-in animation on drop
- Match reveal: stagger animation (delay-100, delay-200, delay-300 for three cards)

**Status Updates**:
- Step-by-step visual progress through upload → extract → analyze → results
- Real-time text updates during processing ("Extracting text...", "Analyzing 47 jobs...")
- Success confirmation with subtle celebration (confetti or checkmark animation)

**Accessibility**:
- Focus states: ring-2 ring-offset-2 on all interactive elements
- ARIA labels on all icons and actions
- Keyboard navigation through cards (tab order)
- Screen reader announcements for status changes

---

## Images

**Hero Section Image**:
- **Placement**: Background element behind hero content (not full-bleed)
- **Type**: Abstract geometric pattern or subtle illustration of resumes/documents connecting to job listings
- **Treatment**: Low opacity overlay (opacity-20) allowing text readability
- **Alternative**: Side illustration (right side of hero, 40% width) showing AI/matching concept

**Empty State Illustrations**:
- Upload state: Illustration of document/upload icon (decorative, ~200px)
- No matches: Illustration of magnifying glass or empty folder
- Error state: Friendly error illustration

**Card Thumbnails**: No images in job cards - keep text-focused for scannability

---

## Responsive Behavior

**Mobile (< 768px)**:
- Single column layout for all sections
- Stack navigation items vertically (hamburger menu)
- Job cards: full-width, reduced padding (p-4)
- Match confidence: Smaller text (text-3xl instead of text-4xl)
- Upload zone: Reduced height (min-h-[180px])

**Tablet (768px - 1024px)**:
- Two-column job results grid
- Side-by-side upload instructions + drop zone
- Maintain full component padding

**Desktop (> 1024px)**:
- Three-column job results grid
- Expanded card details on hover preview (tooltip/popover)
- Fixed header navigation

---

## Page-Specific Layouts

**Main Matching Interface**:
1. Minimal header (h-16, logo + "Powered by AI")
2. Compact hero (py-12, title + one-line description)
3. Upload section (centered card, max-w-2xl)
4. Processing visualization (full-width status bar)
5. Results grid (three cards, max-w-7xl)
6. Simple footer (links only)

**How It Works Page** (if implemented):
- Timeline/step layout (vertical on mobile, horizontal on desktop)
- Three sections: Upload → AI Analysis → Get Matches
- Visual flow indicators between steps