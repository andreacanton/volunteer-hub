# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Volunteer Attendance Management - a full-stack application for coordinating charity volunteer services. Volunteers subscribe to service shifts (Evening, Breakfast, Cooks, Logistics) on specific days, set attendance status, and coordinators manage staffing levels.

## Technology Stack

- **Backend**: Bun.js + Elysia (TypeScript), SQLite with bun:sqlite
- **Frontend**: Flutter (Dart) for iOS/Android
- **Auth**: JWT tokens
- **API**: RESTful

## Project Structure

```
backend/           # Bun.js + Elysia API
  src/
    routes/        # API routes
    controllers/   # Request handlers
    models/        # Database models
    middleware/    # Auth, validation
    services/      # Business logic
  migrations/      # SQLite migrations
  tests/

frontend/          # Flutter mobile app
  lib/
    models/        # Data models
    services/      # API client (dio)
    providers/     # State management
    screens/       # UI screens
    widgets/       # Reusable widgets
  test/
```

## Common Commands

### Backend (Bun.js)
```bash
cd backend
bun install          # Install dependencies
bun run migrate      # Run database migrations
bun run dev          # Start development server
```

### Frontend (Flutter)
```bash
cd frontend
flutter pub get      # Get dependencies
flutter run          # Run on connected device
flutter run -d ios   # Run on iOS simulator
flutter run -d android  # Run on Android emulator
flutter test         # Run tests
```

## Data Model

Core entities: User (volunteer), Service (type), DayOfWeek, ServiceGroup (Service + Day + Coordinator), Subscription (volunteer to ServiceGroup), Attendance (status per date).

User roles: volunteers, coordinators (per ServiceGroup), administrators (create accounts, configure services).


