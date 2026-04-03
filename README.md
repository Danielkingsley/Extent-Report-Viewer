# 📊 Extent Report Viewer

A beautiful, fully client-side dashboard for viewing **ExtentReport HTML files** — with real search, filters, and scrollable step details. No server, no dependencies, no install.

![HTML](https://img.shields.io/badge/HTML-5-orange?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-blue?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

---

## 🚀 Quick Start

1. Clone or download this repo
2. Open `index.html` in any modern browser
3. Upload your `ExtentReport.html` file — done

```bash
git clone https://github.com/your-username/extent-report-viewer.git
cd extent-report-viewer
# Open index.html in your browser
```

> No build step. No npm install. No server required.

---

## ✨ Features

### 📁 File Upload
- Click **Choose File** or **drag & drop** your ExtentReport HTML onto the upload zone
- Load a different file anytime with the **↩ Load Another File** button

### 📈 Summary Cards
- Instant counts for **Total**, **Pass**, **Fail**, and **Skip**
- Click any card to filter the list by that status — click again to clear

### 🔍 Search & Filters
| Filter | Description |
|--------|-------------|
| **Search** | Searches test names AND step detail text — matches highlighted in yellow |
| **Status** | Filter by Pass / Fail / Skip |
| **Author** | Filter by test author (dynamically populated from the report) |
| **Tag** | Filter by regression tag (dynamically populated from the report) |
| **Reset** | Clears all active filters at once |

Live result count always shows how many tests match your current filters.

### 🧪 Test Cards
- Color-coded left border — 🔴 Fail · 🟢 Pass · 🟡 Skip
- Shows: status badge, test name, author, tag, start time, duration
- Click any card to **expand / collapse** the full step log

### 📋 Step Details Panel
- Per-step status badge (Pass / Fail / Skip / Info)
- Timestamp for each step
- Full detail text with stack traces rendered in a scrollable code block
- Search term highlights carry through into step details

---

## 🖼️ Screenshots

### Upload Screen
> Drag & drop or click to upload your ExtentReport HTML file.

### Dashboard View
> Summary cards, filter bar, and scrollable test list with expandable steps.

---

## 🗂️ Project Structure

```
extent-report-viewer/
├── index.html              # Main app — upload screen + full dashboard
├── assets/
│   ├── css/
│   │   └── style.css       # Legacy styles (unused by main app)
│   ├── js/
│   │   └── dashboard.js    # Legacy script (unused by main app)
│   └── sample-report.html  # Sample ExtentReport for testing
├── templates/
│   └── dashboard.html      # Jinja2 template for Python pipeline
├── build_dashboard.py      # Optional Python pipeline (BeautifulSoup + Plotly)
├── ExtendsReport.html      # Sample report (not committed in production)
└── README.md
```

> The entire viewer lives in `index.html` — no external CSS or JS files needed.

---

## 🔧 How It Works

1. User uploads an ExtentReport HTML file via file picker or drag & drop
2. The file is read client-side using the `FileReader` API — **nothing is sent to any server**
3. The HTML is parsed with `DOMParser`, extracting every `li.test-item` element
4. Test name, status, author, tag, duration, and all step rows are pulled from the DOM
5. The dashboard renders dynamically — all filtering and search happens in memory

---

## 🐍 Optional: Python Pipeline

A `build_dashboard.py` script is included for generating a static dashboard from a report file using **BeautifulSoup**, **Pandas**, and **Plotly**.

```bash
pip install beautifulsoup4 pandas plotly jinja2
python build_dashboard.py
```

Output is written to `output/index.html`.

---

## 🌐 Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome  | ✅ |
| Firefox | ✅ |
| Edge    | ✅ |
| Safari  | ✅ |

---

## 📄 License

MIT — free to use, modify, and distribute.

---

## 🙌 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.
