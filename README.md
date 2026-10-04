# ResuMay!

ResuMay! helps you tailor a resume to a job description. Review keyword matches and gaps, refine your summary and experience bullets, preview the result, and export a PDF.

## Features

- Build and edit your resume in a guided form
- Compare resume content with a target job description and see matching or missing keywords
- Get an ATS-style match score and suggestions for your summary and experience bullets
- Preview the resume as you edit
- Export the finished resume as a PDF
- Save your workspace in your browser
- Submit and browse community reviews; shared reviews can be enabled on Vercel

## Run locally

You’ll need Node.js and npm.

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

## Shared reviews on Vercel

The frontend works without a review backend. Without one, review submissions are stored locally in the browser. To enable shared reviews, deploy with Vercel and set `BLOB_READ_WRITE_TOKEN` in the project’s environment variables. See [.env.example](.env.example) for the variable name.

The Vercel Functions in `api/` provide:

- `GET /api/reviews` — return approved public reviews
- `POST /api/reviews` — submit a review

The plain Vite development server serves the frontend only. Use Vercel’s local runtime to develop against the API routes.

## Built with

React, TypeScript, Vite, Bootstrap, jsPDF, html2canvas, and Vercel Blob.
