# ZipLinks API

## Description

ZipLinks is a backend API for a URL shortening service. It allows users to create shortened URLs, manage their accounts, and track click analytics on shortened links. The API is built with Node.js and Express.js, using MongoDB as the database.

## Features

- User registration and authentication with JWT tokens
- URL shortening with custom aliases
- Redirect tracking with device and location analytics
- User profile management
- Secure password hashing
- Docker containerization support

## Tech Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Device Detection**: ua-parser-js
- **HTTP Client**: axios
- **Containerization**: Docker
- **Linting**: ESLint

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (version 18 or higher)
- npm (Node Package Manager)
- MongoDB Atlas account (or local MongoDB instance)
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/ragav2005/zip-links-api.git
   cd zip-links-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the root directory with the following variables:
   ```
   PORT=5500
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

## Environment Variables

- `PORT`: The port number on which the server will run (default: 5500)
- `MONGODB_URI`: MongoDB connection string for your database
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRES_IN`: Expiration time for JWT tokens (e.g., 7d for 7 days)

## Running the Application

### Development Mode

To run the application in development mode with nodemon:

```
npm run dev
```

### Production Mode

To run the application in production mode:

```
npm start
```

The server will start on the specified port (default: 5500).

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in an existing user
- `POST /api/auth/signout` - Sign out the current user

### User Management

- `GET /api/user/verify-token` - Verify JWT token and return user info
- `PUT /api/user/update` - Update user profile (name, avatar)

### URL Shortening

- `POST /api/url/shorten` - Create a shortened URL
- `GET /api/url/:shortId` - Redirect to original URL and track analytics

## Docker Deployment

### Building the Image

To build the Docker image with environment variables:

```
docker build \
  --build-arg PORT="5500" \
  --build-arg MONGODB_URI="your_mongodb_uri" \
  --build-arg JWT_SECRET="your_secret" \
  --build-arg JWT_EXPIRES_IN="7d" \
  -t ziplinks-api .
```

### Running the Container

To run the built container:

```
docker run -p 5500:5500 ziplinks-api
```

The application will be accessible at `http://localhost:5500`.

## Project Structure

```
zipLinks/
├── app.js                 # Main application file
├── config/
│   ├── db.js             # Database connection configuration
│   └── env.js            # Environment variables configuration
├── controllers/
│   ├── auth.controller.js    # Authentication logic
│   ├── user.controller.js    # User management logic
│   └── redirect.controller.js # URL redirect and analytics logic
├── middlewares/          # Custom middleware
├── models/
│   ├── user.model.js     # User schema
│   ├── url.model.js      # URL schema
│   └── click.model.js    # Click analytics schema
├── routes/
│   ├── auth.route.js     # Authentication routes
│   ├── user.route.js     # User routes
│   └── url.route.js      # URL routes
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (not committed)
└── README.md             # This file
```
