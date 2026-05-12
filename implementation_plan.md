# Modern Professional Light-Theme UI/UX Redesign

This document outlines the complete architectural UI rewrite of the Neuro Note application to match a professional, ultra-modern AI SaaS aesthetic with strict adherence to the new Light Theme variables and an SVG-only iconography system.

## User Review Required

> [!WARNING]
> Please review the strategy for the **Stats Row** on the Dashboard. Since the instruction states "all API calls stay exactly the same", I will calculate `Total Notes` and `Words Processed` dynamically on the frontend based on the fetched `notesList` array. For `Quizzes Taken`, since we do not store quizzes in the DB, I will provide a frontend placeholder (e.g., `0`) unless you have a preference.

## Proposed Changes

### Global Theme Implementation

#### [MODIFY] [index.css](file:///c:/Users/alkap/Documents/neuro-note/frontend/src/index.css)
- Implement `linear-gradient(to bottom right, #EEF2FF, #F8F7FF)` for the global background.
- Define explicit CSS variables for structural colors (`--primary: #6C63FF`, `--secondary: #06B6D4`).
- Update the `.glass-panel` utility to enforce the specific `box-shadow: 0 4px 20px rgba(108,99,255,0.08)`.
- Configure `*` explicit selector to enable smooth `0.3s ease` transitions on all colored elements and transformations.
- Create utility classes for "Pill Toggle" inputs, new layout grids (`.grid-3-col`), and the full-height chatbot layout mapping.

---

### Dashboard Modifications (The Core App)

#### [MODIFY] [Dashboard.jsx](file:///c:/Users/alkap/Documents/neuro-note/frontend/src/pages/Dashboard.jsx)
The entirety of `Dashboard.jsx` will be systematically updated to adopt the unified light theme and layout overhaul:

**1. The Sidebar Restructure:**
- Replace all emojis (`🧠`, `📤`, `📖`, `🤖`, `🎯`, `👤`) with highly professional, lightweight inline SVG icons.
- Redesign the layout mapping to incorporate the `1px solid #E8E6FF` right border.
- Refactor the `.sidebar-item` active class to render as a solid `#6C63FF` pill with white text.

**2. The Main Dashboard View:**
- Add a new "Hero Section" gradient header: *Turn Lectures into Smart Notes*.
- Intercept the `fetchMyNotes` data to calculate and render a dynamic 3-column "Stats Row" using standard SVG icons.
- Convert the 4 Input Tab buttons from horizontal rectangles into an elite Pill-Toggled horizontal nav.
- Upgrade the "Generate" button to a full-width gradient pulse, and implement an animated CSS spinner overlay when `loading` is true.

**3. Chatbot Integration:**
- Rip out the old boxed chat component. Build a `height: 100%` split-pane Flex layout.
- Left Pane (30% width): A scrollable side-menu mapping `notesList` with a hover mechanic.
- Right Pane (70% width): Message canvas. The AI bubbles will be pure white with a distinct left purple border.
- Build the 3-dot bouncing animation directly inside CSS for the "waiting for AI" state.

**4. My Notes Page:**
- Wire up a new React state variable `searchQuery` linked to a styled `input` bar.
- Refactor the list mapping to use `grid-template-columns: repeat(3, 1fr)`.
- Reconstruct the individual Note Card to contain: Title, formatted `createdAt` string, a derived `# words` badge, and a preview snippet preview.
- Adjust "View" and "Delete" actions into modern pill buttons.

**5. Quiz Page Flow:**
- Map an internal `[currentQuestionIndex]` to construct a "Progress Bar" UI.
- Redesign the Multi-Choice selection process to snap into pill buttons that strictly evaluate the local context against the correct array (driving Green/Red fills on click).

---

### Landing & Authentication Modifications

#### [MODIFY] [LandingPage.jsx](file:///c:/Users/alkap/Documents/neuro-note/frontend/src/pages/LandingPage.jsx)
- Remove emojis and inject strict SVG iconography. 
- Ensure gradient styling matches the global context `#EEF2FF` to `#F8F7FF`.

#### [MODIFY] [Login.jsx](file:///c:/Users/alkap/Documents/neuro-note/frontend/src/pages/Login.jsx) & [Signup.jsx](file:///c:/Users/alkap/Documents/neuro-note/frontend/src/pages/Signup.jsx)
- Adapt elements to leverage soft SVG branding and the clean global layout. 

## Open Questions

> [!IMPORTANT]
> The Quiz interface originally mapped all questions vertically without a step-by-step progress bar. I will implement a pagination-style logic (1 question at a time) to satisfy the "Progress bar at top showing question number" requirement. Is this acceptable? 

## Verification Plan

### Automated/Manual Verification
- Execute `npm run dev` and navigate manually across all structural paths.
- Ensure zero errors map to the DOM.
- Verify that every Emoji has been successfully scrubbed and replaced with inline SVGs globally.
- Verify clicking a quiz executes the exact same Gemini API routes, evaluating strictly via structural UI classes instead of functional alterations.
