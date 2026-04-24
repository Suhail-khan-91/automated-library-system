# Overall Project Goal: Automated Library Management System (ALMS)

## Project Overview
We are building a responsive, web-based Automated Library Management System for a college. This system replaces the traditional manual "card and stamp" process with a digital request loop. It features a mobile-first UI for students and a high-speed administrative dashboard for librarians.

## Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript, Bootstrap 5
* **Backend:** Node.js, Express.js
* **Database:** SQLite (using the `sqlite3` or `sqlite` npm package)
* **Authentication:** JWT (JSON Web Tokens) for secure, stateless sessions

## User Roles
1.  **Student:** Can log in, search the digital catalog, check real-time book availability, send checkout requests, return books, and view their active transactions and due dates.
2.  **Librarian:** Can log in, approve/reject student checkout and return requests, manage the book inventory (add/edit books), and view all transaction histories.

## Core Workflow
1. Student searches for a book and clicks "Request Checkout".
2. The book request goes into a "Pending" state in the database.
3. The Librarian sees the pending request on their dashboard.
4. The Librarian hands over the physical book and clicks "Approve".
5. The system updates the book status to "Issued" and logs a transaction with a due date.
6. The student can later initiate a "Return", which the librarian also approves to make the book "Available" again.