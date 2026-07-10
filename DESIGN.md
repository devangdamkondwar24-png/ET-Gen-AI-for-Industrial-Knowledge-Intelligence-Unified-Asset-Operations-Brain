# ET Gen - Industrial Knowledge Intelligence
## Design System

### 1. Brand Identity & Vibe
*   **Vibe:** Industrial, high-tech, reliable, and data-dense. The interface should feel like a modern mission-control dashboard for plant operators and reliability engineers.
*   **Visual Metaphor:** "The Cockpit." Clean lines, high contrast for visibility in industrial environments, and clear visual hierarchy for alerts and insights.
*   **Core Colors:**
    *   **Primary:** Industrial Cyan/Teal (`#00E5FF` or `#00ACC1`) for active elements, representing intelligence and scanning.
    *   **Secondary/Alert:** Warning Amber/Orange (`#FFAB00`) for non-conformances and RCA alerts. Critical Red (`#FF5252`) for failures.
    *   **Background:** Deep Charcoal/Slate (`#121212` or `#1E1E24`). This is a dark-mode first application to reduce glare on the factory floor.
    *   **Surface:** Slightly lighter slate (`#292933`) for cards and panels.
*   **Typography:** 'Inter' or 'Roboto'. Needs to be highly legible for dense data tables and long-form RCA reports.
*   **Corners:** Slightly rounded (`8px` or `sm`), maintaining a structured, engineered feel, avoiding overly bubbly or soft aesthetics.

### 2. Core Components

#### The Sidebar Navigation
*   **Style:** Fixed left sidebar.
*   **Elements:** Icons + Text (Copilot, RCA Dashboard, Compliance, Lessons Learned).
*   **Active State:** Cyan left border highlight with a subtle cyan gradient background.

#### Data Cards & Panels
*   **Style:** Flat with very subtle borders (`1px solid #333333`). No heavy drop shadows; use color contrast to separate layers.
*   **Header:** Clear title, optional status badge (e.g., "Critical", "Open") in the top right.

#### Copilot Chat Interface
*   **User Message:** Align right, muted surface background.
*   **AI Message:** Align left, transparent background, cyan border-left.
*   **Citations:** Small, clickable pill-shaped chips (e.g., `[Doc-101 p.4]`) styled with outline cyan borders. These should look like technical references.

#### RCA Dashboard & Alerts
*   **Layout:** Split view. Left side: List of failure hypotheses ranked by probability. Right side: Evidence graph or detailed citations.
*   **Badges:** High/Medium/Low confidence indicators using green/yellow/red color coding.

### 3. Layout structure
*   **Global:** Sidebar (left), Topbar (search/asset context), Main Content Area.
*   **Main Content:** Grid layouts for dashboards. 12-column structure. Use generous padding inside cards but tight margins between cards for a dense, data-rich feel.

### 4. Do's and Don'ts
*   **Do** use dark mode as the default.
*   **Do** make citations and references highly visible as click targets.
*   **Do** use monospace fonts (`Roboto Mono` or `Fira Code`) for asset IDs (e.g., `P-101`) or code snippets.
*   **Don't** use large, playful illustrations. Keep it technical and diagrammatic.
*   **Don't** use too much pure white text; use soft grays for body text to reduce eye strain against the dark background.
