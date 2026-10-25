# 🎉 Jashn – AI Celebration & Event Planner

> **"Jashn"** *(noun)*: Celebration, festivities, and shared moments of joy.
>
> Built for the **Google Virtual Prompt Wars** Challenge: *Celebration & Event Planner*.
> Built for learning purpose.
---
**Live demo:**
## 🌟 Overview

**Jashn** is a GenAI-powered celebration and event planning assistant engineered to help anyone organize unforgettable **weddings, birthdays, community festivals, and social gatherings**. 

It eliminates planning chaos by orchestrating:
- 📊 **Dynamic Budget Allocations & Live Expense Tracking** with strict largest-remainder rounding and tight-budget intelligence.
- 📅 **Milestone Timeline & Checklists** featuring automatic schedule compression (Fast-Track mode for short lead times) and **iCalendar (.ics) export**.
- 🤝 **Vendor Pipeline Management** tracking statuses from search to contracts, quotes, and direct contacts.
- 💡 **Personalized AI Celebration Concepts** generating curated themes, decor highlights, dietary-compliant multi-course menus (Vegetarian, Vegan, Jain, Halal, Gluten-Free), and minute-by-minute run-of-show itineraries.
- 💬 **Context-Aware AI Assistant** capable of answering questions about budget variances, next critical tasks, rain contingency plans, and guest headcount dynamics.
- 🖨️ **Printable Dossiers & Data Portability** with paper-optimized print styles, JSON backup, and CSV spreadsheets.

---



## 🎨 Design & Accessibility Principles

- **Accessible Color Contrast**: Complies with WCAG 2.1 AA standards across both Light and Dark modes.
- **No Heavy Frameworks or Build Steps**: Pure HTML5, modern CSS custom properties (tokens), and native JavaScript ES modules.
- **Visuals Without External Bandwidth**: Lightweight inline SVG badges and unicode icons ensure instant load times and complete repository size under 10 MB.
- **Keyboard Navigation & ARIA**: Screen-reader friendly skip links, semantic roles, aria-live status regions, and keyboard-operable modals.
- **Responsive & Printable**: Seamless experience across mobile, tablet, and desktop viewports, with a dedicated `@media print` stylesheet.

---

## 📂 Project Architecture

```
JashnAi/
├── public/                     # Frontend client assets
│   ├── css/
│   │   ├── tokens.css          # Design system color palettes, typography, spacing
│   │   ├── base.css            # Layout, typography, responsive grids
│   │   ├── components.css      # Cards, buttons, tables, progress bars, rings
│   │   └── print.css           # Paper-optimized dossier stylesheet
│   ├── js/
│   │   ├── api.js              # Fetch client wrapper
│   │   ├── store.js            # Reactive state management with localStorage
│   │   ├── seed.js             # 3 diverse pre-filled celebrations with dynamic dates
│   │   ├── utils.js            # Formatting, iCalendar generator, safe DOM escaping
│   │   ├── router.js           # Client-side hash routing
│   │   ├── app.js              # Entry point, theme switcher, event selector
│   │   └── views/              # View components (Dashboard, Budget, Timeline,
│   │                           # Vendors, Ideas, Chat, Wizard, Export)
│   └── index.html              # Single Page Application container
├── server/                     # Backend Express server
│   ├── config.js               # Environment & rate-limit configurations
│   ├── index.js                # Server bootstrap & helmet security headers
│   ├── schemas.js              # Zod validation schemas
│   ├── engine/
│   │   ├── budget.js           # Budget allocation & rounding engine
│   │   ├── timeline.js         # Milestone generation & fast-track scheduler
│   │   ├── ideas.js            # Deterministic offline celebration generator
│   │   ├── intents.js          # NLP keyword/pattern intent parser
│   │   └── readiness.js        # Event readiness scoring algorithm
│   ├── services/
│   │   └── gemini.js           # Gemini 2.0 Flash integration with offline fallback
│   ├── routes/                 # Express API routes (/api/plan/*, /api/ai/*)
│   └── middleware/             # Rate-limiting, validation, and error handling
├── tests/                      # 77 Node test runner specifications
├── package.json
└── README.md
```

---

## 📄 License

MIT &copy; 2026 Jashn Team. Built with ❤️ for the Google Virtual Prompt Wars Challenge.
