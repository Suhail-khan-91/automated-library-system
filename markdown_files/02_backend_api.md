# Phase 2: Backend Setup & API Development

## Objective
Create the Node.js/Express server framework and the RESTful API routes required to support the frontend operations. Use SQLite for database operations.

## Setup Requirements
* Initialize an Express server on port 3000.
* Implement `cors` and `express.json()` middleware.
* Implement JWT authentication middleware to protect specific routes and verify user roles.

## Required API Routes

### 1. Authentication (`/api/auth`)
* `POST /register`: Hash password (using bcrypt), create a new student user.
* `POST /login`: Verify email/password, return a JWT token including the user's ID and role.

### 2. Books Catalog (`/api/books`)
* `GET /`: Fetch all books (public or student access). Support query parameters for searching by title or category.
* `POST /`: Add a new book (Librarian only).
* `PUT /:id`: Update book status or details (Librarian only).

### 3. Requests Workflow (`/api/requests`)
* `POST /`: Create a new checkout or return request (Student only). Must check if the book is 'Available' before allowing a checkout request.
* `GET /pending`: Fetch all pending requests (Librarian only).
* `PUT /:id/approve`: Approve a request (Librarian only). This should update the request status, update the BOOK status to 'Issued', and create a record in the TRANSACTIONS table with a due date (e.g., 14 days from now).

### 4. Transactions (`/api/transactions`)
* `GET /my-books`: Fetch all active transactions for the logged-in student (Student only).
* `GET /all`: Fetch all active and past transactions (Librarian only).

## Instructions for AI
1. Provide the code for `server.js` and structure the routes cleanly.
2. Include the middleware for JWT verification (`authMiddleware.js`).
3. Ensure error handling is implemented for database queries.