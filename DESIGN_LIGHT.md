# ET Gen - Industrial Knowledge Intelligence
## Design System

### 1. Brand Identity & Vibe
*   **Vibe:** Industrial, minimalist, high-tech, and clean. The interface should feel like a modern, crisp mission-control dashboard for plant operators and reliability engineers.
*   **Visual Metaphor:** "The Clinical Cockpit." Clean lines, stark white space, and clear visual hierarchy for alerts and insights.
*   **Core Colors:**
    *   **Primary:** Deep Teal (`#004D40`) for active elements and primary actions.
    *   **Secondary/Alert:** Warning Amber (`#FFB300`) for non-conformances and RCA alerts. Critical Red (`#D32F2F`) for failures.
    *   **Background:** Crisp White (`#FFFFFF`). This is a **Light Mode** application to maximize clarity and readability in well-lit factory offices.
    *   **Surface:** Very faint gray (`#F5F5F5` or `#FAFAFA`) for cards, panels, and sidebars to gently separate them from the stark white background.
*   **Typography:** 'Inter' or 'Roboto'. Needs to be highly legible for dense data tables and long-form RCA reports.
*   **Corners:** Slightly rounded (`8px` or `sm`), maintaining a structured, engineered feel, avoiding overly bubbly or soft aesthetics.

### 2. Core Components

#### The Sidebar Navigation
*   **Style:** Fixed left sidebar. Very faint gray background (`#F5F5F5`).
*   **Elements:** Icons + Text (Copilot, RCA Dashboard, Compliance, Lessons Learned). Text should be dark charcoal (`#212121`).
*   **Active State:** Deep Teal left border highlight with a subtle teal background (`#E0F2F1`).

#### Data Cards & Panels
*   **Style:** Flat with very subtle borders (`1px solid #E0E0E0`). No heavy drop shadows; use clean lines and borders to separate layers.
*   **Header:** Clear title, optional status badge (e.g., "Critical", "Open") in the top right.

#### Copilot Chat Interface
*   **User Message:** Align right, very faint gray surface background (`#F5F5F5`), dark text.
*   **AI Message:** Align left, stark white background with a subtle border, Deep Teal border-left highlight.
*   **Citations:** Small, clickable pill-shaped chips (e.g., `[Doc-101 p.4]`) styled with outline teal borders. These should look like technical references.

#### RCA Dashboard & Alerts
*   **Layout:** Split view. Left side: List of failure hypotheses ranked by probability. Right side: Evidence graph or detailed citations.
*   **Badges:** High/Medium/Low confidence indicators using green/yellow/red pastel color coding with dark text.

### 3. Layout structure
*   **Global:** Sidebar (left), Topbar (search/asset context), Main Content Area.
*   **Main Content:** Grid layouts for dashboards. 12-column structure. Use generous white space inside cards and between cards for a clean, minimalist feel.

### 4. Do's and Don'ts
*   **Do** use light mode as the default. Lots of stark `#FFFFFF` background.
*   **Do** make citations and references highly visible as click targets.
*   **Do** use monospace fonts (`Roboto Mono` or `Fira Code`) for asset IDs (e.g., `P-101`) or code snippets.
*   **Don't** use heavy drop shadows. Keep it flat and minimalist.
*   **Don't** use dark backgrounds for main content areas.
