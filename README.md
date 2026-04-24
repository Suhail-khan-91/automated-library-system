# Automated Library Management System (ALMS)

A full-stack, responsive web application designed to streamline library operations, from book discovery to automated circulation management. Built with a focus on security, concurrency, and a modern User Experience.

## 🚀 Features

### For Students
* **Dynamic Catalog:** Browse and search books by title or category.
* **Request System:** Securely request checkouts and returns with built-in accidental-click protection.
* **Personal Dashboard:** Track active borrowings, due dates, and full transaction history.
* **Real-time Feedback:** Modern UI notifications via Bootstrap modals for status updates.

### For Librarians
* **Dual-Queue Management:** Separate, organized views for pending Checkout and Return requests.
* **Inventory Control:** Live tracking of book status (Available, Issued, or Pending).
* **One-Click Approval:** Simplified workflow to approve student requests and update the database instantly.

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5.
* **Backend:** Node.js, Express.js.
* **Database:** SQLite3 (Relational).
* **Authentication:** JWT (JSON Web Tokens) with tab-isolated `sessionStorage`.

## 🔒 Key Security & Logic Fixes
* **Tab Isolation:** Fixed session bleeding by migrating from `localStorage` to `sessionStorage`.
* **Spam Protection:** Implemented backend checks to prevent duplicate pending requests for the same book.
* **Race Condition Handling:** Automatic rejection of competing checkout requests once a book is issued.
* **Role Validation:** Strict server-side middleware to ensure students cannot access librarian routes.

## 📦 Installation & Setup
1.  **Clone the repo:**
    ```bash
    git clone https://github.com/Suhail-khan-91/automated-library-system.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Initialize the Database:**
    ```bash
    node init_db.js
    ```
4.  **Run the Server:**
    ```bash
    node server.js
    ```
5.  **Access the App:** Open `http://localhost:3000` in your browser.

---
*Developed as a Final Year Project for B.Sc. (Information Technology).*
