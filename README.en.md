# Node.js Express MongoDB Project Template

A backend project template based on Express + TypeScript + MongoDB, providing complete user authentication, API validation, log management, and more.

## Features

- **Express + TypeScript** - Developed with TypeScript for type safety
- **MongoDB Connection** - Singleton pattern MongoDB connection management
- **User Authentication** - Registration, login, password update, logout
- **JWT Authentication** - JWT-based authentication middleware
- **API Validation** - Request parameter validation and processing
- **Log Management** - Daily log recording with automatic cleanup of expired logs
- **Graceful Shutdown** - Supports graceful process termination

## Technology Stack

- Node.js
- Express
- TypeScript
- MongoDB / Mongoose
- JWT
- ESLint + Prettier

## Project Structure

```
src/
├── app.ts                 # Express application configuration
├── server.ts              # Server entry file
├── config/
│   ├── env.ts             # Environment variable configuration
│   └── mongodb.ts         # MongoDB connection management
├── controller/
│   ├── index.ts           # Controller exports
│   └── modules/
│       ├── test/          # Test-related controllers
│       └── users/         # User-related controllers
├── middlewares/
│   ├── auth.ts            # Authentication middleware
│   └── logger.ts          # Logger middleware
├── models/
│   ├── index.ts           # Model exports
│   └── modules/
│       ├── test/          # Test models
│       └── users/         # User models
├── routes/
│   ├── index.ts           # Route exports
│   └── modules/
│       ├── test/          # Test routes
│       └── users/         # User routes
├── utils/
│   ├── global.ts          # Global utilities
│   ├── jwt.ts             # JWT utilities
│   ├── logger.ts          # Logger utilities
│   ├── md5.ts             # MD5 encryption
│   ├── userToken.ts       # User token utilities
│   └── utils.ts           # General utilities
├── validation/
│   ├── index.ts           # Validator exports
│   └── models/
│       ├── test/          # Test validations
│       └── users/         # User validations
└── types/
    ├── environment.d.ts   # Environment variable types
    └── global/            # Global type definitions
```

## Quick Start

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Copy the `.env.example` file to `.env` and update the configuration:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/your_database
JWT_SECRET=your_jwt_secret_key
```

### Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### User Endpoints

| Method | Path                  | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/users/register   | User registration |
| POST   | /api/users/login      | User login        |
| POST   | /api/users/updatePassword | Update password |
| POST   | /api/users/updateUserInfo | Update user info |
| POST   | /api/users/logout     | User logout       |

### Test Endpoints

| Method | Path          | Description   |
|--------|---------------|---------------|
| GET    | /api/test     | Test query    |
| POST   | /api/test     | Create test   |

## Log Information

Log files are stored in the `logs` directory, named by date, and retained for 7 days by default. Configuration can be done via the `SimpleLogger` class:

```typescript
const logger = new SimpleLogger();
logger.setMaxAge(30); // Set retention to 30 days
logger.manualClean(); // Manual cleanup
```

## Development Guidelines

- Use ESLint for code linting
- Use Prettier for code formatting
- Follow TypeScript type conventions

## License

ISC