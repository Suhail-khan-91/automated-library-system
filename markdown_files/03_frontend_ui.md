# Phase 3: Frontend UI Development

## Objective
Build a mobile-first, responsive user interface using HTML, CSS, Vanilla JavaScript, and Bootstrap 5. The frontend will communicate with the Node.js backend via the Fetch API.

## Design Requirements
Use standard Bootstrap classes for styling (cards, tables, buttons, modals, and navbars). The UI should be clean and intuitive.

## Required Pages/Views

### 1. `index.html` (Authentication)
* A login form asking for Email and Password.
* A toggle or link to a registration form.
* On successful login, store the JWT in `localStorage` and redirect to `student_dashboard.html` or `librarian_dashboard.html` based on the role.

### 2. `student_dashboard.html`
* **Navbar:** Links to "Search Books", "My Books", "Logout".
* **Search Section:** A search bar and a grid/list of books. Show live status badges (Green 'Available', Red 'Issued'). Include a "Request" button next to available books.
* **My Books Section:** A list of books currently issued to the student, showing the due date and a "Return" button.
* **JS Logic:** Use Fetch API with the Bearer token in headers to call `/api/books`, `/api/requests`, and `/api/transactions/my-books`.

### 3. `librarian_dashboard.html`
* **Navbar:** Links to "Pending Requests", "Inventory", "All Transactions", "Logout".
* **Pending Requests Section:** A table of student requests (checkout/return) with "Approve" and "Reject" buttons.
* **Inventory Section:** A table of all books with a form/modal to add new books to the library.
* **JS Logic:** Use Fetch API to manage approvals, fetch all transactions, and update the catalog.

## Instructions for AI
1. Provide the HTML boilerplate and Bootstrap integration for these pages.
2. Provide the JavaScript code (`app.js` or inline) to handle DOM manipulation, form submissions, and Fetch API calls to the backend endpoints defined in Phase 2.
3. Ensure that if a token is missing or expired, the user is redirected back to `index.html`.