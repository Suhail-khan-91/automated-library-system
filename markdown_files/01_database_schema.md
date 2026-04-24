# Phase 1: Database Initialization (SQLite)

## Objective
Set up the SQLite database (`library.db`) and create the necessary tables for the Automated Library Management System. Write a Node.js script (e.g., `init_db.js`) to initialize this schema.

## Database Schema Requirements
Convert the following relational structure into valid SQLite syntax. Ensure foreign key constraints are enabled.

### 1. USERS Table
* `user_id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `name`: TEXT NOT NULL
* `email`: TEXT UNIQUE NOT NULL
* `password`: TEXT NOT NULL (will store hashed passwords)
* `role`: TEXT NOT NULL (Values: 'student' or 'librarian')

### 2. BOOKS Table
* `book_id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `title`: TEXT NOT NULL
* `author`: TEXT NOT NULL
* `category`: TEXT NOT NULL
* `status`: TEXT DEFAULT 'Available' (Values: 'Available', 'Issued', 'Reserved')

### 3. REQUESTS Table
* `request_id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `user_id`: INTEGER (Foreign Key referencing USERS.user_id)
* `book_id`: INTEGER (Foreign Key referencing BOOKS.book_id)
* `req_type`: TEXT NOT NULL (Values: 'Checkout', 'Return')
* `status`: TEXT NOT NULL DEFAULT 'Pending' (Values: 'Pending', 'Approved', 'Rejected')
* `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 4. TRANSACTIONS Table (Active Issues)
* `trans_id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `user_id`: INTEGER (Foreign Key referencing USERS.user_id)
* `book_id`: INTEGER (Foreign Key referencing BOOKS.book_id)
* `issue_date`: DATE NOT NULL
* `due_date`: DATE NOT NULL
* `status`: TEXT NOT NULL (Values: 'Issued', 'Returned')

### 5. RESERVATIONS Table (Queue Management)
* `res_id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `user_id`: INTEGER (Foreign Key referencing USERS.user_id)
* `book_id`: INTEGER (Foreign Key referencing BOOKS.book_id)
* `queue_pos`: INTEGER NOT NULL

## Instructions for AI
1. Write the `init_db.js` script to establish a connection to SQLite.
2. Enable foreign keys (`PRAGMA foreign_keys = ON;`).
3. Create the tables if they do not exist.
4. Insert a default admin/librarian user and some dummy books so we can test the system immediately.