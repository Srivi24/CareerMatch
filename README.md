# CareerPath Guide

## Overview

CareerPath Guide is a web-based psychometric career guidance system designed for Indian students after 10th/12th grade. The application helps students choose suitable courses and career paths through scientific, RIASEC-model based assessments that evaluate interests, aptitude, and personality.

The system provides personalized recommendations for academic streams (Science/Commerce/Arts), degree courses (B.E., B.Tech, B.A., B.Sc., B.Com., etc.), and career paths tailored to the Indian educational context. It features student assessment workflows, result visualization with radar charts, a comprehensive course/career library, and an admin panel for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and wizard animations
- **Charts**: Recharts for RIASEC radar chart visualization
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with TypeScript (tsx for development)
- **Framework**: Express 5
- **Authentication**: Passport.js with local strategy, express-session
- **Session Storage**: connect-pg-simple for PostgreSQL session persistence
- **Password Security**: scrypt hashing with timing-safe comparison

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

### API Design
- **Pattern**: REST API with typed route definitions in `shared/routes.ts`
- **Validation**: Zod schemas for input validation and response typing
- **Authentication**: Session-based with role-based access control (student/admin)

### Key Data Models
1. **Users**: Student profiles with class level, stream, location, language preferences
2. **Questions/Options**: Assessment questions with fields:
   - `section`: INTEREST, APTITUDE, or PERSONALITY
   - `riasecCode`: R/I/A/S/E/C for Interest questions
   - `subcategory`: LOGICAL/NUMERICAL/VERBAL (Aptitude) or LEADERSHIP/TEAMWORK/DISCIPLINE (Personality)
   - `isActive`: Enable/disable questions
   - `displayOrder`: Question ordering
   - 5 Likert scale options per question (Strongly Disagree to Strongly Agree, weights 0-4)
3. **Assessments/Answers**: User assessment sessions with:
   - `selectedQuestionIds`: JSONB array of 40 randomly selected question IDs
   - `currentQuestionIndex`: Progress tracking for auto-save
   - `scores`: JSONB with RIASEC + Aptitude + Personality scores
4. **Programmes**: Degree courses organized by stream (Engineering, Arts, Science, Commerce) with branch relationships
5. **Engineering Branches**: Parent categories for engineering programmes
6. **Careers**: Career options with stream associations and course recommendations

### Question Selection Algorithm
Each assessment randomly selects 40 balanced questions:
- **24 RIASEC Interest questions**: 4 per category (R, I, A, S, E, C)
- **8 Aptitude questions**: 3 Logical, 3 Numerical, 2 Verbal
- **8 Personality questions**: 3 Leadership, 3 Teamwork, 2 Discipline

### Scoring System
- RIASEC scores: Sum of weights (0-4) for each category, max 16 per category
- Aptitude scores: LOGICAL, NUMERICAL, VERBAL subcategory totals
- Personality scores: LEADERSHIP, TEAMWORK, DISCIPLINE subcategory totals

### Multi-language Support
- Built-in LanguageProvider supporting 10 Indian languages (English, Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati, Urdu)
- Theme support (light/dark) via ThemeProvider

### Build System
- Development: `tsx server/index.ts` with Vite dev server middleware
- Production: Custom esbuild script bundles server with selective dependency bundling for cold start optimization
- Client build outputs to `dist/public`, server to `dist/index.cjs`

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via DATABASE_URL environment variable)
- **connect-pg-simple**: Session storage in PostgreSQL

### UI Component Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, dropdown, tabs, accordion, etc.)
- **shadcn/ui**: Pre-configured component styling (components.json configuration)
- **Lucide React**: Icon library

### Development Tools
- **Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner (development only)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Express session secret (defaults to "abc123" in development)