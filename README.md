# Events7 Dashboard

A full-stack web dashboard for Analytics teams to define and manage client events for tracking (button clicks, app events, etc.).


## Technology

### Frontend
- **Vue 3** with TypeScript (Options API)
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety throughout
- **Native Fetch API** - HTTP requests (no Axios)
- **Vitest** - Unit and integration testing

### Backend
- **NestJS** - Node.js framework (TypeScript)
- **TypeORM** - Database ORM
- **SQLite** - Database (development)
- **Vitest** - Testing framework

## Setup & Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd events7-dashboard
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
ADS_API_USER=fun7user
ADS_API_PASS=fun7pass
DATABASE_URL=sqlite://./events.db
NODE_ENV=development
PORT=3001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## How to run the dashboard
### Developement

#### Backend (Terminal 1):
```bash
cd backend
npm run start:dev
# Server will run on http://localhost:3001
```

#### Frontend (Terminal 2):
```bash
cd frontend
npm run dev
# Application will run on http://localhost:5173
```