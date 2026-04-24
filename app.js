const API_BASE = 'http://localhost:3000/api';

// Custom Alert Modal
function showAlert(message) {
    const msgEl = document.getElementById('customAlertMessage');
    if (msgEl) msgEl.textContent = message;
    const modalEl = document.getElementById('customAlertModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
    else console.warn(message);
}

// Utilities
function getCurrentToken() {
    return sessionStorage.getItem('token');
}

function getUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function checkAuth(requiredRole = null) {
    const user = getUser();
    const token = getCurrentToken();

    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }

    if (requiredRole && user.role !== requiredRole) {
        showAlert('Access denied');
        logout();
    }

    verifySession();
}

async function verifySession() {
    try {
        const res = await fetch(`${API_BASE}/auth/verify`, { headers: getHeaders() });
        if (!res.ok) return logout();
        const data = await res.json();
        const user = getUser();
        if (!user || data.user.role !== user.role) logout();
    } catch (err) {
        logout();
    }
}

function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('name');
    window.location.href = 'index.html';
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCurrentToken()}`
    };
}

function populateStudentName() {
    const el = document.getElementById('userBranding');
    if (el) {
        const name = sessionStorage.getItem('name') || 'Student';
        el.innerText = `Hello, ${name}`;
    }
}

// Authentication forms handling
function initAuth() {
    const studentAuthArea = document.getElementById('studentAuthArea');
    const librarianAuthArea = document.getElementById('librarianAuthArea');
    const roleToggles = document.querySelectorAll('input[name="roleToggle"]');

    // Role toggle handler
    if (roleToggles.length) {
        roleToggles.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'librarian') {
                    studentAuthArea.classList.add('d-none');
                    librarianAuthArea.classList.remove('d-none');
                } else {
                    librarianAuthArea.classList.add('d-none');
                    studentAuthArea.classList.remove('d-none');
                }
            });
        });
    }

    // Student login
    const studentLoginForm = document.getElementById('studentLoginForm');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const student_id = document.getElementById('loginStudentId').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'student', student_id, password })
                });
                const data = await res.json();

                if (res.ok) {
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    sessionStorage.setItem('name', data.name || data.user.name || 'Student');
                    window.location.href = 'student_dashboard.html';
                } else {
                    showAlert(data.error);
                }
            } catch (err) {
                showAlert('Login failed');
            }
        });
    }

    // Librarian login
    const librarianLoginForm = document.getElementById('librarianLoginForm');
    if (librarianLoginForm) {
        librarianLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('librarianCode').value.trim();

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'librarian', code })
                });
                const data = await res.json();

                if (res.ok) {
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'librarian_dashboard.html';
                } else {
                    showAlert(data.error);
                }
            } catch (err) {
                showAlert('Login failed');
            }
        });
    }

    // Student register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const student_id = document.getElementById('regStudentId').value.trim();
            const password = document.getElementById('regPassword').value;

            try {
                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, student_id, password })
                });
                const data = await res.json();

                if (res.ok) {
                    showAlert('Registration successful! Please login.');
                    document.getElementById('login-tab').click();
                } else {
                    showAlert(data.error);
                }
            } catch (err) {
                showAlert('Registration failed');
            }
        });
    }
}

// Student Dashboard Functions
async function loadBooks() {
    const search = document.getElementById('searchInput')?.value || '';
    const category = document.getElementById('categoryInput')?.value || '';

    try {
        const res = await fetch(`${API_BASE}/books?search=${search}&category=${category}`);
        const books = await res.json();
        const grid = document.getElementById('booksGrid');

        if (!grid) return;
        grid.innerHTML = '';

        const categories = new Set();

        books.forEach(book => {
            if (book.category) categories.add(book.category);
            const isAvailable = book.status === 'Available';
            const badgeClass = isAvailable ? 'bg-success' : 'bg-danger';
            const collapseId = `collapse-${book.book_id}`;

            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${book.author}</h6>
                        <p class="card-text">Category: ${book.category}</p>
                        <span class="badge ${badgeClass} mb-3">${book.status}</span>
                        ${isAvailable ? `
                        <div>
                            <a class="text-primary text-decoration-none fw-semibold" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                                Request book &#9660;
                            </a>
                            <div class="collapse mt-2" id="${collapseId}">
                                <button class="btn btn-outline-primary btn-sm w-100" onclick="requestCheckout(${book.book_id})">Confirm Request Checkout</button>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        const categoryOptions = document.getElementById('categoryOptions');
        if (categoryOptions) {
            categoryOptions.innerHTML = '';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                categoryOptions.appendChild(option);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function requestCheckout(bookId) {
    try {
        const res = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ book_id: bookId, req_type: 'Checkout' })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('Request submitted successfully');
            loadBooks();
        } else {
            showAlert(data.error);
        }
    } catch (err) {
        showAlert('Request failed');
    }
}

async function loadMyBooks() {
    try {
        const res = await fetch(`${API_BASE}/transactions/my-books`, {
            headers: getHeaders()
        });
        const data = await res.json();
        const tbody = document.getElementById('myBooksTableBody');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No records found.</td></tr>';
            return;
        }

        data.forEach(t => {
            const tr = document.createElement('tr');
            const fineDisplay = t.current_fine > 0 ? `<span class="text-danger fw-bold">${t.current_fine}</span>` : '0';
            tr.innerHTML = `
                <td>${t.book_title}</td>
                <td>${t.book_author}</td>
                <td>${t.issue_date}</td>
                <td>${t.due_date}</td>
                <td>${fineDisplay}</td>
                <td><button class="btn btn-warning btn-sm" onclick="requestReturn(${t.book_id})">Return</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadMyHistory() {
    try {
        const res = await fetch(`${API_BASE}/transactions/my-history`, {
            headers: getHeaders()
        });
        const data = await res.json();
        const tbody = document.getElementById('myHistoryTableBody');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No records found.</td></tr>';
            return;
        }

        data.forEach(t => {
            const statusBadge = t.status === 'Returned'
                ? `<span class="badge bg-secondary">Returned</span>`
                : `<span class="badge bg-primary">Issued</span>`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.book_title}</td>
                <td>${t.issue_date}</td>
                <td>${t.due_date}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function requestReturn(bookId) {
    try {
        const res = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ book_id: bookId, req_type: 'Return' })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('Return request submitted');
        } else {
            showAlert(data.error);
        }
    } catch (err) {
        showAlert('Request failed');
    }
}

// Librarian Dashboard Functions
async function loadPendingRequests() {
    try {
        const res = await fetch(`${API_BASE}/requests/pending`, {
            headers: getHeaders()
        });
        const requests = await res.json();

        // Sort oldest first
        requests.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const checkoutTbody = document.getElementById('checkoutRequestsTableBody');
        const returnTbody = document.getElementById('returnRequestsTableBody');

        if (checkoutTbody) checkoutTbody.innerHTML = '';
        if (returnTbody) returnTbody.innerHTML = '';

        const checkouts = requests.filter(r => r.req_type === 'Checkout');
        const returns = requests.filter(r => r.req_type === 'Return');

        const renderRows = (tbody, rows) => {
            if (!tbody) return;
            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No records found.</td></tr>';
                return;
            }
            rows.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${r.user_name}</td>
                    <td>${r.book_title}</td>
                    <td>${new Date(r.created_at).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="approveRequest(${r.request_id})">Approve</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        };

        renderRows(checkoutTbody, checkouts);
        renderRows(returnTbody, returns);
    } catch (err) {
        console.error(err);
    }
}

async function approveRequest(reqId) {
    try {
        const res = await fetch(`${API_BASE}/requests/${reqId}/approve`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (res.ok) {
            showAlert('Request approved');
            loadPendingRequests();
        } else {
            const data = await res.json();
            showAlert(data.error);
        }
    } catch (err) {
        showAlert('Action failed');
    }
}

async function loadInventory() {
    try {
        const res = await fetch(`${API_BASE}/books`);
        const books = await res.json();
        const tbody = document.getElementById('inventoryTableBody');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (books.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records found.</td></tr>';
            return;
        }

        books.forEach(b => {
            const statusClass = b.status === 'Available' ? 'text-success' : 'text-danger';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${b.book_id}</td>
                <td>${b.title}</td>
                <td>${b.author}</td>
                <td>${b.category}</td>
                <td class="${statusClass} fw-bold">${b.status}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadAllTransactions() {
    try {
        const res = await fetch(`${API_BASE}/transactions/all`, {
            headers: getHeaders()
        });
        const transactions = await res.json();
        const tbody = document.getElementById('transactionsTableBody');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records found.</td></tr>';
            return;
        }

        transactions.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.user_name} (${t.user_student_id})</td>
                <td>${t.book_title}</td>
                <td>${t.issue_date}</td>
                <td>${t.due_date}</td>
                <td><span class="badge ${t.status === 'Returned' ? 'bg-secondary' : 'bg-primary'}">${t.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

// Add Book Form Handler
const addBookForm = document.getElementById('addBookForm');
if (addBookForm) {
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const category = document.getElementById('bookCategory').value;

        try {
            const res = await fetch(`${API_BASE}/books`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ title, author, category })
            });
            if (res.ok) {
                showAlert('Book added successfully');
                document.querySelector('.btn-close').click();
                addBookForm.reset();
                loadInventory();
            } else {
                const data = await res.json();
                showAlert(data.error);
            }
        } catch (err) {
            showAlert('Failed to add book');
        }
    });
}
