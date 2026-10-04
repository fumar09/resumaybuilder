# ResuMay!

ResuMay! is a small set of focused tools for preparing a job application. It includes a landing page, resume builder, resume checker, and application letter writer, styled with the colors from the ResuMay logo.

## Pages

- `/` — Landing page with links to each tool
- `/resume-builder` — Build, preview, save, and export a resume as a PDF
- `/resume-checker` — Compare resume text with a job description and review keyword overlap
- `/application-letter` — Create and edit a first draft using details you provide

The checker reports exact keyword overlap as a guide. It does not predict ATS outcomes or assess qualifications. The tools run in the browser; the builder saves its draft on the current device.

## Run locally

You will need Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

Useful scripts:

```sh
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

## Built with

React, TypeScript, Vite, Bootstrap Icons, jsPDF, and html2canvas.
