# NeuroLearn Accessibility Platform (NLAP)

NeuroLearn is a modern, responsive web application designed to support neurodivergent learners (including individuals with dyslexia, ADHD, and other cognitive styles). It provides a personalized educational dashboard with tailored accessibility filters, focus assistance tools, and reading assessments to optimize the learning experience.

## Features

- **Personalized Accessibility Panel**: Dynamically customize the reading environment with adjustments for:
  - Font styling (e.g., OpenDyslexic / clean sans-serif)
  - Color filters (contrast adjustments, tint overlays, and dark mode)
  - Layout assistance (line height, word spacing, letter spacing, and page focus overlays)
  - Interactive line reader to help track reading progress
- **Focus Mode & Pomodoro Timer**: Dedicated workspace with built-in task tracking and a customizable Pomodoro timer using Zustand state management.
- **Content Simplifier**: A cognitive support tool to parse and simplify complex texts or lessons into digestible chunks.
- **Reading Profile Assessment**: Interactive questionnaire to assess user needs and suggest optimal accessibility settings.
- **Comprehensive Dashboard**: Track learning progress, access profile settings, and manage educational content.
- **Authentication**: User sign-in and sign-up integration using Firebase.

## Technology Stack

- **Framework**: Next.js 16 (with Turbopack enabled)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query v5
- **Auth & Backend**: Firebase integration

---

## Getting Started

Follow the steps below to set up and run the NeuroLearn dashboard on your local machine.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 18.x or 20.x recommended) along with `npm` (v10+).

### 1. Installation

Install all required npm dependencies:

```bash
npm install
```

### 2. Environment Configuration

The application requires environment variables for Firebase configuration. 

1. Copy the `.env.example` file to `.env.local` (or `.env`):
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and replace the placeholder values with your actual Firebase project credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Running the App Locally

Start the development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Build and Production

To build the application for production:

```bash
npm run build
```

To run the built production application:

```bash
npm run start
```

## Project Structure

```
├── public/              # Static assets (icons, logos, SVGs)
├── src/
│   ├── app/             # Next.js App Router pages and layouts
│   ├── components/      # UI, layout, and feature-specific components
│   ├── context/         # React Contexts (Accessibility, Auth)
│   ├── lib/             # Utility files, Firebase client, and mock data
│   └── store/           # Zustand global state stores (Pomodoro)
├── package.json         # Scripts and dependencies configuration
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.ts   # Tailwind configuration
```
