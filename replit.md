# JoAcademy Talent Finder

## Overview

JoAcademy Talent Finder is an AI-powered recruitment platform that matches job seekers with career opportunities at JoAcademy. Users upload their resume as a PDF, and the system performs intelligent job matching using a two-stage AI process: quick semantic filtering via embeddings followed by deep analysis using OpenAI's GPT-5 model. The application provides ranked job matches with confidence scores, helping candidates discover the most relevant positions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: Shadcn/ui with Radix UI primitives
- Uses the "new-york" style variant with custom Tailwind configuration
- Component library includes 40+ pre-built accessible components (buttons, cards, dialogs, forms, etc.)
- Design system based on Material Design principles with professional polish for career platform branding

**Styling Approach**: Tailwind CSS with custom CSS variables for theming
- Supports light/dark mode through CSS custom properties
- Custom elevation system for hover/active states
- Typography uses Inter font family from Google Fonts
- Neutral color palette with professional blue accents

**State Management**: 
- React Query (TanStack Query) for server state and API calls
- Local React state for UI interactions and form handling
- Custom hooks for mobile detection and toast notifications

**Routing**: Wouter for lightweight client-side routing

**Key Pages**:
- Home page: Main upload interface with drag-and-drop CV upload, processing status display, and job match results
- 404 page: Simple not-found handler

**Key Features**:
- Progressive disclosure UI showing upload → analysis → results flow
- Real-time processing status with animated step indicators
- Job match cards with visual ranking badges and confidence scores
- Modal detail views for individual job listings
- Responsive design with mobile-first approach

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Structure**:
- RESTful endpoints with JSON responses
- File upload handling via Multer middleware (memory storage, 10MB limit, PDF-only validation)
- Request logging with duration tracking for API calls

**Key Endpoints**:
- `POST /api/upload-cv`: Accepts PDF file, extracts text, returns extracted content
- `POST /api/match-jobs`: Takes CV text, performs two-stage matching, returns ranked results

**Service Layer Architecture**:

1. **PDF Processing Service** (`server/services/pdf-parser.ts`)
   - Uses pdf-parse library to extract text from PDF buffers
   - Error handling for invalid or unreadable PDFs
   - Minimum text validation (50 characters required)

2. **Jobs Service** (`server/services/jobs.ts`)
   - Fetches live job listings from JoAcademy careers API
   - Implements in-memory caching (10-minute TTL) to reduce API calls
   - Fallback data for API failures
   - Timeout protection (10 second limit)
   - Maps external API format to internal job schema

3. **Matching Service** (`server/services/matching.ts`)
   - **Two-Stage AI Matching Process**:
     - Stage 1: Quick semantic filtering using OpenAI embeddings (filters to top 10 candidates)
     - Stage 2: Deep GPT-5 analysis on top candidates for final ranking (returns top 3)
   - Weighted scoring: 70% deep AI analysis + 30% embedding similarity
   - Cosine similarity calculation for vector comparison

4. **OpenAI Service** (`server/services/openai.ts`)
   - Uses OpenAI's GPT-5 model (latest as of August 2025)
   - Generates embeddings for semantic similarity
   - Performs deep analysis comparing CV skills/experience against job requirements
   - Returns structured JSON responses with 0-1 similarity scores

**Development/Production Setup**:
- Vite middleware for hot module replacement in development
- Static file serving in production
- Environment-based configuration

### Data Storage Solutions

**Current Implementation**: In-memory storage (`MemStorage` class)
- User management with UUID-based IDs
- Map-based storage (non-persistent)
- Simple CRUD operations for user entities

**Database Configuration**: 
- Drizzle ORM configured for PostgreSQL (via Neon serverless driver)
- Schema defined in `shared/schema.ts`
- Migration support via drizzle-kit
- **Note**: Database is configured but not actively used for job matching (jobs are fetched live from API, no persistence layer for matches)

**Schema Design**:
- Job listings validated with Zod schemas
- Type-safe API contracts between frontend and backend
- Shared type definitions in `shared/schema.ts` for consistency

### Authentication and Authorization

**Current State**: Basic user storage infrastructure exists but no active authentication flow implemented

The application currently does not require authentication - it's a public-facing tool for job matching. User storage exists as a foundation for potential future features.

### External Dependencies

**Third-Party APIs**:
- **JoAcademy Careers API**: Live job listings source
  - Endpoint: `https://careers.joacademy.com/en/api/v1/career_page/jobs/live`
  - Provides job title, description, department, location, and application links
  - Paginated results (50 per page)
  
- **OpenAI API**: AI/ML capabilities
  - GPT-5 model for deep semantic analysis
  - Text embeddings for quick similarity matching
  - Structured JSON responses for scoring

**Key NPM Packages**:
- `pdf-parse`: PDF text extraction
- `multer`: File upload handling
- `openai`: Official OpenAI SDK
- `@neondatabase/serverless`: PostgreSQL client for serverless environments
- `drizzle-orm`: TypeScript ORM with Zod integration
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Accessible UI primitives (20+ component packages)
- `tailwindcss`: Utility-first CSS framework
- `zod`: Schema validation and type inference
- `wouter`: Lightweight routing
- `date-fns`: Date manipulation utilities

**Database**: 
- PostgreSQL (configured via Neon serverless)
- Connection via `DATABASE_URL` environment variable

**Build Tools**:
- Vite: Frontend bundling and dev server
- esbuild: Backend bundling for production
- TypeScript: Type checking across entire codebase
- PostCSS with Autoprefixer: CSS processing

**Development Tools**:
- Replit-specific plugins for dev banner, cartographer, and runtime error overlay
- tsx: TypeScript execution for development server