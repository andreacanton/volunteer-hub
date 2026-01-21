# Volunteer Attendance Management

A web application designed to help volunteers and coordinators manage attendance across various charity services.

## Overview

This application streamlines the organization of volunteer services by allowing volunteers to subscribe to specific service shifts, set their attendance status in advance, and helping coordinators ensure adequate staffing for each service.

## Features

### 1. Service Management
The application supports four types of services:
1. Evening
2. Breakfast
3. Cooks
4. Logistics

### 2. Volunteer Subscriptions
1. Volunteers can subscribe to service shifts based on specific days of the week
2. Each subscription is tied to a service-day-of-the-week combination (e.g., Evening-Tuesday)
3. Volunteers can manage multiple subscriptions across different services and days

### 3. Coordinator Assignment
1. Each service-day-of-the-week group has a default coordinator
2. Coordinators can be temporarily changed to another volunteer within the group when needed
3. Coordinator changes are managed on an exceptional basis

### 4. Attendance Tracking
1. Volunteers can set their attendance status before the service day
2. Real-time visibility of volunteer availability for each service
3. Coordinators can assess if there are enough volunteers to organize the service
4. Early warning system for understaffed services

### 5. Authentication & User Management
1. Personal accounts for each volunteer
2. Email and password authentication
3. User registration is not available (accounts are created by administrators)

## Technology Stack

- **Frontend**: Flutter (Dart) - Cross-platform mobile app (iOS & Android)
- **Backend Runtime**: Bun.js
- **Backend Framework**: Elysia (TypeScript)
- **Database**: SQLite
- **Authentication**: JWT tokens
- **API**: RESTful API

## Installation

### Backend Setup

```bash
# Clone the repository
git clone [repository-url]

# Navigate to backend directory
cd ronda-carita-attendance/backend

# Install dependencies with Bun
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
bun run migrate

# Start development server
bun run dev
```

### Frontend (Flutter) Setup

```bash
# Ensure Flutter SDK is installed
# Visit: https://docs.flutter.dev/get-started/install

# Navigate to frontend directory
cd ronda-carita-attendance/frontend

# Get Flutter dependencies
flutter pub get

# Run on iOS simulator (macOS only)
flutter run -d ios

# Run on Android emulator
flutter run -d android

# Or run on connected device
flutter run
```

## Usage

### For Volunteers
1. Log in with your email and password credentials
2. View available services and subscribe to shifts
3. Set your attendance status for upcoming services
4. View your schedule and upcoming commitments

### For Coordinators
1. Access your assigned service-day groups
2. View volunteer attendance for your services
3. Assess staffing levels and plan accordingly
4. Temporarily assign coordinator role to another volunteer if needed

### For Administrators
1. Create and manage volunteer accounts
2. Configure services and default coordinators
3. Oversee all service schedules and attendance

## Project Structure

```
/
├── backend/                # Bun.js + Elysia backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Authentication, validation
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   ├── tests/             # Backend tests
│   ├── migrations/        # Database migrations
│   ├── database/          # SQLite database files
│   └── package.json
│
├── frontend/              # Flutter mobile app
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/        # Data models (User, Service, Attendance)
│   │   ├── services/      # API client and service layer
│   │   ├── providers/     # State management (Provider/Riverpod)
│   │   ├── screens/       # UI screens
│   │   ├── widgets/       # Reusable widgets
│   │   └── utils/         # Helper functions
│   ├── test/              # Flutter tests
│   ├── assets/            # Images, fonts, etc.
│   └── pubspec.yaml
│
└── docs/                  # Shared documentation
```

## Data Model

### Core Entities
1. **User/Volunteer**: Account information, email, role
2. **Service**: Type of charity service (Evening, Breakfast, Cooks, Logistics)
3. **DayOfWeek**: Days when services are available
4. **ServiceGroup**: Combination of Service + DayOfWeek + Default Coordinator
5. **Subscription**: Volunteer subscription to a ServiceGroup
6. **Attendance**: Attendance status for a specific date and volunteer

## Development Roadmap

### Phase 1: Foundation
1. Set up backend API with Bun.js + Elysia
2. Design and implement SQLite database schema
3. Create Flutter project structure
4. Implement JWT authentication (backend + frontend)
5. Set up API client in Flutter (using dio package)

### Phase 2: Core Features
1. User login screen and secure token storage
2. Service and day-of-week configuration API
3. Volunteer subscription system (backend + UI)
4. Attendance tracking functionality
5. Coordinator management features
6. Dashboard screens for volunteers and coordinators

### Phase 3: Enhancement
1. Push notifications for attendance reminders
2. Offline support with local data caching
3. Reporting and statistics screens
4. Data export capabilities
5. Italian localization
6. Dark mode support

### Future Considerations
1. User self-registration with admin approval workflow
2. Web admin panel (using Flutter Web)
3. Integration with calendar apps (Google Calendar, Apple Calendar)
4. Advanced analytics dashboard
5. Automated reminder system via email/SMS
6. Multi-organization support

## Why SQLite?

SQLite was chosen for this project because:
1. **Simplicity**: Single file database, no separate server process needed
2. **Portability**: Easy to backup, migrate, and version control
3. **Performance**: Fast for read-heavy workloads typical of this application
4. **Zero Configuration**: No database server setup or maintenance required
5. **Perfect for Scale**: Handles thousands of volunteers and records efficiently
6. **Bun.js Integration**: Excellent native support with bun:sqlite

## Why Elysia?

Elysia was chosen as the backend framework because:
1. **Bun-First Design**: Built specifically for Bun.js runtime
2. **Performance**: One of the fastest TypeScript frameworks available
3. **Type Safety**: End-to-end type safety with TypeScript
4. **Developer Experience**: Clean API and excellent documentation
5. **Validation**: Built-in schema validation with TypeBox
6. **Plugin Ecosystem**: Rich plugin system for common features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Special thanks to all the volunteers and coordinators who make charity services possible.

---

*Last updated: January 2026*
