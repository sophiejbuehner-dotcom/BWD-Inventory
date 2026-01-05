# BWD Inventory Management System

## Overview

This is an interior design inventory management system called "Aesthetix" built for BWD (an interior design business). The application enables tracking of a master inventory catalog and managing project-based "pull lists" - items assigned to specific client projects with status tracking (pulled, returned, installed).

The system follows a monorepo architecture with a React frontend, Express backend, and PostgreSQL database. It uses a shared schema and API contract pattern for type-safe communication between client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (CSS variables for theming)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

The frontend follows a pages-based structure with shared components and custom hooks for API interactions. Each entity (items, projects, project-items) has dedicated hooks that wrap fetch calls with React Query.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints defined in a shared route contract (shared/routes.ts)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod

The storage layer uses a repository pattern (IStorage interface) implemented by DatabaseStorage class, providing clean separation between route handlers and database operations.

### Database Schema
Three main tables:
1. **items**: Master inventory catalog (SKU, name, vendor, cost, client price, BWD price, category, quantity)
2. **projects**: Client projects with name, client name, and status
3. **projectItems**: Junction table linking items to projects with quantity, status (pulled/returned/installed), and notes

### Build System
- Development: tsx for TypeScript execution with Vite dev server
- Production: Custom build script using esbuild for server bundling and Vite for client
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage for PostgreSQL (available but session auth not currently implemented)

### UI/Frontend Libraries
- **Radix UI**: Full suite of accessible primitives (dialogs, dropdowns, tabs, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities
- **papaparse**: CSV export functionality for pull lists
- **embla-carousel-react**: Carousel component

### Development Tools
- **Vite plugins**: @replit/vite-plugin-runtime-error-modal, cartographer, dev-banner for Replit integration
- **Tailwind CSS**: Utility-first styling with custom configuration