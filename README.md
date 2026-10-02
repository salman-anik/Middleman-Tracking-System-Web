# Middleman Tracking System — Web Version

A Vercel-ready browser application converted from `Middleman Tracking System.xlsx`.

## Features
- Dashboard with passenger, exam and payment metrics
- Search Console: search all sections by passenger name, passport, occupation or exam location
- Add / edit / delete passenger records
- Testing Ag, Testing Tc and Isra sections
- Exam history for 1st, 2nd and 3rd exams
- Payment and balance tracking
- Invoice preview and browser printing
- Settings for occupations, T.C./S.A., exam locations and exam statuses
- Import an updated Excel workbook
- Export the current web data back to Excel
- Responsive layout for desktop/tablet/mobile
- Local browser storage so changes remain after refresh

## Run locally
Open `index.html` in a browser. Because Excel import uses SheetJS from a CDN, an internet connection is needed for the Import/Export Excel feature.

## Deploy to Vercel
1. Upload this folder to a GitHub repository.
2. In Vercel, create a new project from that repository.
3. Framework preset: Other.
4. Build command: leave empty.
5. Output directory: `.`.
6. Deploy.

Or use Vercel's drag-and-drop deployment for the project folder.

## Important data note
This version is intentionally client-side: each browser/device has its own local copy. It is suitable for a single-user/local workflow. For a shared office system where multiple users edit the same records, the next step is to connect the UI to Supabase/PostgreSQL (or another hosted database) and add login/permissions.
"# Middleman-Tracking-System-Web" 

Tesing - https://salman-anik.github.io/Middleman-Tracking-System-Web/
