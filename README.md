# 📊 Extent Report Viewer

A production-ready, fully client-side dashboard for viewing **ExtentReport HTML files** — with a 4-tab interface, split-pane test detail, author/tag drill-down, categorized failure analysis, and CSV export. No server, no dependencies, no install.

![HTML](https://img.shields.io/badge/HTML-5-orange?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-blue?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

---

## 🚀 Quick Start

1. Clone or download this repo
2. Open `index.html` in any modern browser
3. Upload your `ExtentReport.html` — done

```bash
git clone https://github.com/Danielkingsley/Extent-Report-Viewer.git
cd extent-report-viewer
# Open index.html in your browser
```

> No build step. No npm install. No server required. Works entirely in the browser.

---

## ✨ Features at a Glance

| Feature | Description |
|---------|-------------|
| File upload | Click or drag & drop any ExtentReport HTML |
| Accurate counts | Total / Pass / Fail / Skip — scoped strictly to test items, never inflated by sidebar data |
| 4-tab navigation | Tests · Authors · Tags/Categories · Failures |
| Frozen header | Top bar and tab row always visible while scrolling |
| Split-pane detail | Test list on the left, step details on the right — header frozen, steps scrollable |
| Author stats bar | Selecting an author in Tests shows their pass/fail/skip summary inline |
| CSV export | Export currently filtered results from any tab |
| Search | Searches test names and step detail text with yellow highlights |

---

## 🗂️ Project Structure

```
extent-report-viewer/
├── index.html                  # App shell — upload screen + all 4 pages
├── assets/
│   ├── css/
│   │   └── style.css           # All shared styles (dark theme, layout, components)
│   └── js/
│       ├── parser.js           # Parses ExtentReport HTML once; shared helpers
│       ├── dashboard.js        # 🧪 Tests tab
│       ├── authors.js          # 👤 Authors tab
│       ├── tags.js             # 🏷 Tags / Categories tab
│       └── bugs.js             # ⚠️ Failures tab
├── ExtendsReport.html          # Sample ExtentReport for testing
└── README.md
```

---

## 📑 Tab Reference

### 🧪 Tests

The main test list view.

- **Summary cards** — Total / Pass / Fail / Skip counts. Click any card to filter by that status; click again to clear.
- **Filter bar** (always frozen at top):
  - Free-text search across test names and step detail text
  - Status dropdown (All / Pass / Fail / Skip)
  - Author dropdown (dynamically populated)
  - Tag dropdown (dynamically populated)
  - Reset button — clears all filters at once
  - Export CSV — downloads the currently filtered test list
- **Author stats bar** — appears below the filter bar when an author is selected, showing their total pass / fail / skip counts and pass rate
- **Split-pane layout**:
  - Left pane — scrollable test list; each row shows status badge, test name, author chip, tag chip
  - Right pane — click any test to load its full step log; the test name + status/author/tag/time header is frozen at the top while steps scroll below

---

### 👤 Authors

3-column layout — all columns always visible, no page navigation required.

| Column | Content |
|--------|---------|
| Left (260px) | SVG pie chart showing overall pass/fail/skip with legend — always visible |
| Middle (300px) | Scrollable list of author cards — each shows total, pass ✓, fail ✗, skip ⊘, and a pass-rate progress bar |
| Right | Click an author card to load their tests here. Splits into a test list (left) and step detail (right). Includes search and status filter. |

- Clicking a test row in the right pane opens its frozen-header step detail
- Export CSV exports the currently filtered tests for the selected author

---

### 🏷 Tags / Categories

Identical 3-column layout to Authors, grouped by regression tag instead of author.

| Column | Content |
|--------|---------|
| Left (260px) | SVG pie chart — always visible |
| Middle (300px) | Scrollable tag cards with pass/fail/skip counts and pass-rate bar |
| Right | Click a tag card to load its tests; test list + step detail split pane with search and status filter |

- Tests with no tag are excluded from this view
- Export CSV exports the currently filtered tests for the selected tag

---

### ⚠️ Failures

Focused view of all failed tests, categorized by exception type.

- **Filter bar** (frozen):
  - Free-text search by test name, error message, or author
  - Category dropdown — dynamically populated from detected exception types (e.g. `HttpTimeoutException`, `NoSuchElementException`, `TimeoutException`)
  - Grid / List view toggle
  - Export CSV
- **Left pane** — collapsible category groups (▶ click to expand). Each item shows test name, author chip, tag chip, and the first line of the error message. Click any item to load its step detail on the right.
- **Right pane** — frozen test header + scrollable step log (same as Tests tab)
- **Grid mode** — adds summary cards per exception category above the collapsible list

**Exception categories detected automatically:**
- `HttpTimeoutException` / `TimeoutException` / `TimeoutError`
- `NoSuchElementException`
- `StaleElementException`
- `AssertionError`
- Any other `*Exception` or `*Error` class name extracted from the stack trace
- `OtherFailure` — fallback for unrecognised errors

---

## 🔧 How It Works

1. User uploads an ExtentReport HTML file via file picker or drag & drop
2. `FileReader` reads the file client-side — **nothing is sent to any server**
3. `parser.js` uses `DOMParser` to parse the HTML, scoping strictly to `.test-list-wrapper ul.test-list-item > li.test-item` — this prevents sidebar author/tag dropdown items from being counted as tests
4. Each `li.test-item` yields: name, status, author, tag, start time, duration, and all step rows
5. `window.REPORT` is set once; all 4 tabs read from it — no re-parsing on tab switch
6. The Tests tab initialises immediately on load; Authors, Tags, and Failures initialise via `requestIdleCallback` so the UI is responsive from the first frame

---

## 📐 Layout Architecture

```
body (flex column, 100vh, overflow hidden)
└── #appShell (flex column)
    ├── .frozen-top          ← topbar + nav tabs, always visible
    └── .page.active         ← one of four pages, flex column
        ├── .page-controls   ← summary cards + filter bar, sticky
        └── content area     ← split-pane or 3-column group layout
```

**Split-pane (Tests & Failures):**
```
.split-pane (flex row, flex:1, min-height:0)
├── .split-left   (fixed width, overflow-y:auto)   ← test list
└── .split-right  (flex:1, flex column)
    ├── .split-right-header  (frozen — test name + chips)
    └── .split-right-body    (overflow-y:auto — steps table)
```

**3-column group layout (Authors & Tags):**
```
.group-page-layout (flex row, flex:1, min-height:0)
├── .group-page-left    (260px) ← pie chart, always visible
├── .group-page-middle  (300px) ← scrollable cards
└── .group-page-right   (flex:1)
    ├── .group-right-title    (frozen label)
    ├── .group-right-controls (search + filter, shown after card click)
    └── .group-right-split    (flex row)
        ├── .group-right-list   (260px, overflow-y:auto) ← test rows
        └── .group-right-detail (flex:1)                 ← step detail
```

---

## 🌐 Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome  | ✅ |
| Firefox | ✅ |
| Edge    | ✅ |
| Safari  | ✅ |

---
Sample Images
<img width="1915" height="940" alt="image" src="https://github.com/user-attachments/assets/9786ad5b-cb4e-41a4-b746-ba9ca995780e" />
<img width="1925" height="937" alt="image" src="https://github.com/user-attachments/assets/89d88812-b53d-453e-8854-be9b378d6273" />
---

## 📄 License

MIT — free to use, modify, and distribute.

---

## 🙌 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.
