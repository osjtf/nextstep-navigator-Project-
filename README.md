NextStep Navigator – Career Passport

“Your Guide to the Future”

A fully static, responsive, and interactive career-guidance website for students, graduates, and working professionals — built with HTML5, CSS3, JavaScript, Bootstrap, and JSON (no backend).

Built by Yemen Developers: Osama Almuhaia · Alshareef Alradhi · Bakil Dahan · Loay Nasher · AbdulWali Hassan · Ali Bamatref

🚀 Live Demo

Website: 🔧 https://osjtf.github.io/nextstep-navigator-project/

📚 Table of Contents

Features

Tech Stack

Architecture

Screenshots

Folder Structure

Getting Started (Local)

Deploying to GitHub Pages

Data & Configuration

Usage Guide

Roadmap / Future Enhancements

Accessibility & Performance

Known Limitations

Contributing

License

Authors

Acknowledgments

✨ Features

User Segmentation: Students (8–12), Graduates (UG/PG), Working Professionals — dynamic menus + greeting.

Career Bank: Filter by industry; sort by title/salary; rich career cards.

Interest-Based Quiz: JSON-driven questions → instant recommendations (no page reload).

Multimedia Guidance: Curated videos & podcasts; filter by theme/user type.

Success Stories: Motivational journeys; filter by domain.

Resource Library: Articles, eBooks, Checklists, Webinars with descriptions & links.

Admissions & Coaching: Stream selection, study abroad, interview, and resume tips.

Feedback (UI only): Demo form (no server write).

Contact & About: Team info + embedded map (Sanaa, Yemen).

Extras: Bookmarks (session), recently viewed, visitor counter, clock & geolocation, hover animations.

🧰 Tech Stack

Frontend: HTML5, CSS3, Bootstrap 5, JavaScript (ES6)

Data: JSON files (no database)

Design: Figma (planning)

Hosting: GitHub Pages (static)

🧱 Architecture

Mermaid diagram renders on GitHub:

flowchart TB
  A[Presentation Layer<br/>HTML + CSS + Bootstrap] --> B[Logic Layer<br/>JavaScript + nsn-shared.js]
  B --> C[(JSON Data Files)]
  A --> A1[Structure + Styling + Responsive Grid]
  B --> B1[Filtering / Sorting]
  B --> B2[Quiz Evaluation]
  B --> B3[Bookmarks / Greeting / Utilities]
  C --> C1[careers.json]
  C --> C2[quiz.json]
  C --> C3[resources.json]
  C --> C4[multimedia.json]
  C --> C5[stories.json]

🖼 Screenshots

Place images in assets/screens/ and reference them here.

Home (user type + greeting)
![Home](assets/screens/home.png)

Career Bank (filters/sort)
![Career Bank](assets/screens/career-bank.png)

Quiz (results)
![Quiz](assets/screens/quiz.png)

Multimedia / Stories / Resources
![Multimedia](assets/screens/multimedia.png)
![Success Stories](assets/screens/stories.png)
![Resource Library](assets/screens/resources.png)

Admissions & Coaching / Feedback / Contact / About
![Admissions](assets/screens/admissions.png)
![Feedback](assets/screens/feedback.png)
![Contact](assets/screens/contact.png)
![About](assets/screens/about.png)

🗂 Folder Structure
nextstep-navigator/
├── index.html
├── careers.html
├── quiz.html
├── multimedia.html
├── stories.html
├── resources.html
├── admissions.html
├── feedback.html
├── contact.html
├── about.html
│
├── css/
│   ├── index.css  ... (page-specific styles)
│   └── ...
│
├── js/
│   ├── nsn-shared.js
│   ├── careers.js   quiz.js   multimedia.js   stories.js
│   ├── resources.js admissions.js feedback.js contact.js about.js
│   └── index.js
│
├── data/
│   ├── careers.json      ├── quiz.json
│   ├── resources.json    ├── multimedia.json
│   └── stories.json
│
└── assets/
    ├── images/ (icons, team photos)
    └── screens/ (README screenshots)

🧪 Getting Started (Local)

No build tools required — just a static server (to allow fetch of JSON).

Option A — Python (built-in):

# In project root:
python -m http.server 5500
# Open: http://localhost:5500


Option B — Node http-server (if you have Node.js):

npm install -g http-server
http-server -p 5500
# Open: http://localhost:5500

🌐 Deploying to GitHub Pages

Method 1 — Deploy from main (root):

Commit & push your project to GitHub.

Repo → Settings → Pages.

Source: Deploy from a branch → Branch: main → Folder: /root.

Save → wait for the green Your site is published banner.

Your URL will be: https://<username>.github.io/<repo>/.

Method 2 — Deploy from /docs folder:

Move site files into a docs/ folder.

Settings → Pages → Source: main → Folder: /docs.

Save and wait for publish.

If using relative paths, keep links like ./data/careers.json so it works both locally and on Pages.

🔧 Data & Configuration
JSON files

Careers (data/careers.json) — example:

{
  "id": "career-tech-001",
  "title": "Software Engineer",
  "description": "Designs and develops software applications.",
  "skills": ["Programming", "Problem Solving", "Teamwork"],
  "education": "Bachelor’s in Computer Science",
  "salaryRange": "$60,000 – $120,000",
  "industry": "Technology",
  "icon": "bi-laptop"
}


Quiz (data/quiz.json) — example:

{
  "question": "Which activity do you enjoy the most?",
  "options": ["Solving puzzles", "Helping people", "Designing things"],
  "recommendation": "Technology / Healthcare / Arts"
}


Add/modify entries to expand the catalog, quiz, resources, multimedia, and stories.

🧭 Usage Guide (Main Flows)

Home → choose Student / Graduate / Professional → personalized menu + greeting.

Career Bank → filter by industry → sort → open card → bookmark (session).

Quiz → answer → instant recommendations (JS only).

Multimedia → filter → play short video/podcast.

Stories → filter by domain → view cards.

Resources → pick type → open/download.

Admissions & Coaching → read guidance pages.

Feedback → demo form (no server storage).

Contact → see team details + map.

About → meet Yemen Developers.

🗺 Roadmap / Future Enhancements

Backend (accounts, persistent bookmarks & feedback)

Global search across careers/resources

AI-powered recommendations for the quiz

Multilingual support (Arabic/English/…)

Offline mode (service workers)

Mobile app (Flutter/React Native)

♿ Accessibility & ⚡ Performance

Clear fonts, contrast, and keyboard-friendly UI.

Responsive with Bootstrap grid for desktop/tablet/mobile.

JSON kept small; images optimized for fast loads.

No personal data collection; client-side only.

⚠️ Known Limitations

No server/database → feedback and bookmarks are not saved permanently.

Multimedia requires internet connectivity (YouTube/podcast embeds).

🤝 Contributing

This is an academic/public project by Yemen Developers.

For suggestions or bugs, open an Issue.

For small fixes, submit a Pull Request (PR).

Please keep PRs focused and include screenshots for UI changes.

📜 License

🔧 Choose a license (we recommend MIT for simplicity).

Add a LICENSE file (MIT, Apache-2.0, or your choice).

Update this section accordingly.

👤 Authors

Yemen Developers

Osama Almuhaia

Alshareef Alradhi

Bakil Dahan

Loay Nasher

AbdulWali Hassan

Ali Bamatref

Affiliation: Al-Nasser University – Yemen
Date: 2025-09-13

🙏 Acknowledgments

Our instructors and mentors for their guidance.

Everyone who provided feedback during testing and review.

Quick Links

📦 data/ — JSON datasets

🎨 css/ — stylesheets

🧠 js/ — scripts (shared utilities in nsn-shared.js)

🖼 assets/ — images & screenshots
