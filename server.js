const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole, SECRET_KEY } = require('./authMiddleware');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let db;

async function startServer() {
    db = await sqlite.open({
        filename: './library.db',
        driver: sqlite3.Database
    });

    console.log('Connected to SQLite database.');

    const LIBRARIAN_PASSKEY = '9821444431';

    // Authentication Routes
    app.post('/api/auth/register', async (req, res) => {
        const { name, student_id, password } = req.body;
        if (!name || !student_id || !password) {
            return res.status(400).json({ error: 'Name, student_id, and password are required' });
        }

        const trimmedName = name.trim();
        const trimmedStudentId = student_id.trim();

        if (password.trim().length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters.' });
        }

        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(trimmedName)) {
            return res.status(400).json({ error: 'Name must contain only alphabetical letters and spaces' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await db.run(
                'INSERT INTO USERS (name, student_id, password, role) VALUES (?, ?, ?, ?)',
                [trimmedName, trimmedStudentId, hashedPassword, 'student']
            );
            res.status(201).json({ message: 'User registered successfully', userId: result.lastID });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ error: 'Student ID already exists' });
            }
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        const { role, student_id, password, code } = req.body;

        if (!role) return res.status(400).json({ error: 'Role is required' });

        if (role === 'librarian') {
            if (!code || code !== LIBRARIAN_PASSKEY) {
                return res.status(401).json({ error: 'Invalid access code' });
            }
            const token = jwt.sign(
                { id: 0, role: 'librarian' },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            return res.json({ token, user: { id: 0, name: 'Librarian', role: 'librarian' } });
        }

        if (role === 'student') {
            if (!student_id || !password) {
                return res.status(400).json({ error: 'Student ID and password are required' });
            }
            try {
                const user = await db.get('SELECT * FROM USERS WHERE student_id = ?', [student_id]);
                if (!user) {
                    return res.status(401).json({ error: 'Invalid Student ID or password' });
                }

                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Invalid Student ID or password' });
                }

                const token = jwt.sign(
                    { id: user.user_id, role: user.role },
                    SECRET_KEY,
                    { expiresIn: '24h' }
                );

                return res.json({ token, name: user.name, user: { id: user.user_id, name: user.name, role: user.role } });
            } catch (error) {
                return res.status(500).json({ error: 'Database error' });
            }
        }

        return res.status(400).json({ error: 'Invalid role' });
    });

    app.get('/api/auth/verify', authenticateToken, (req, res) => {
        res.json({ valid: true, user: req.user });
    });

    // Books Catalog Routes
    app.get('/api/books', async (req, res) => {
        const { search, category } = req.query;
        let query = 'SELECT * FROM BOOKS WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND title LIKE ?';
            params.push(`%${search}%`);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        try {
            const books = await db.all(query, params);
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.post('/api/books', authenticateToken, requireRole('librarian'), async (req, res) => {
        let { title, author, category } = req.body;
        if (!title || !author || !category) {
            return res.status(400).json({ error: 'Title, author, and category are required' });
        }
        title = title.trim();
        author = author.trim();
        category = category.trim();

        try {
            const result = await db.run(
                'INSERT INTO BOOKS (title, author, category) VALUES (?, ?, ?)',
                [title, author, category]
            );
            res.status(201).json({ message: 'Book added successfully', bookId: result.lastID });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.put('/api/books/:id', authenticateToken, requireRole('librarian'), async (req, res) => {
        const { id } = req.params;
        const { title, author, category, status } = req.body;
        
        let updateQuery = 'UPDATE BOOKS SET ';
        let params = [];
        let updates = [];

        if (title) { updates.push('title = ?'); params.push(title.trim()); }
        if (author) { updates.push('author = ?'); params.push(author.trim()); }
        if (category) { updates.push('category = ?'); params.push(category.trim()); }
        if (status) { updates.push('status = ?'); params.push(status.trim()); }

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

        updateQuery += updates.join(', ') + ' WHERE book_id = ?';
        params.push(id);

        try {
            const result = await db.run(updateQuery, params);
            if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });
            res.json({ message: 'Book updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Requests Workflow Routes
    app.post('/api/requests', authenticateToken, requireRole('student'), async (req, res) => {
        const { book_id, req_type } = req.body;
        if (!book_id || !req_type) {
            return res.status(400).json({ error: 'book_id and req_type are required' });
        }
        if (!['Checkout', 'Return'].includes(req_type)) {
            return res.status(400).json({ error: 'Invalid req_type' });
        }

        try {
            if (req_type === 'Checkout') {
                const book = await db.get('SELECT status FROM BOOKS WHERE book_id = ?', [book_id]);
                if (!book) return res.status(404).json({ error: 'Book not found' });
                if (book.status !== 'Available') {
                    return res.status(400).json({ error: 'Book is not available for checkout' });
                }

                const existingRequest = await db.get(
                    'SELECT * FROM REQUESTS WHERE user_id = ? AND book_id = ? AND status = "Pending"',
                    [req.user.id, book_id]
                );
                if (existingRequest) {
                    return res.status(400).json({ error: 'You already have a pending request for this book.' });
                }
            }

            if (req_type === 'Return') {
                const transaction = await db.get(
                    'SELECT * FROM TRANSACTIONS WHERE user_id = ? AND book_id = ? AND status = "Issued"', 
                    [req.user.id, book_id]
                );
                if (!transaction) {
                    return res.status(400).json({ error: 'You do not have this book issued' });
                }

                const existingReturn = await db.get(
                    'SELECT * FROM REQUESTS WHERE user_id = ? AND book_id = ? AND req_type = "Return" AND status = "Pending"',
                    [req.user.id, book_id]
                );
                if (existingReturn) {
                    return res.status(400).json({ error: 'A return request for this book is already pending librarian approval.' });
                }
            }

            const result = await db.run(
                'INSERT INTO REQUESTS (user_id, book_id, req_type) VALUES (?, ?, ?)',
                [req.user.id, book_id, req_type]
            );
            res.status(201).json({ message: 'Request submitted successfully', requestId: result.lastID });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.get('/api/requests/pending', authenticateToken, requireRole('librarian'), async (req, res) => {
        try {
            const requests = await db.all(`
                SELECT r.*, u.name as user_name, b.title as book_title
                FROM REQUESTS r
                JOIN USERS u ON r.user_id = u.user_id
                JOIN BOOKS b ON r.book_id = b.book_id
                WHERE r.status = 'Pending'
            `);
            res.json(requests);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.put('/api/requests/:id/approve', authenticateToken, requireRole('librarian'), async (req, res) => {
        const { id } = req.params;

        try {
            await db.run('BEGIN TRANSACTION');

            const request = await db.get('SELECT * FROM REQUESTS WHERE request_id = ? AND status = "Pending"', [id]);
            if (!request) {
                await db.run('ROLLBACK');
                return res.status(404).json({ error: 'Pending request not found' });
            }

            await db.run('UPDATE REQUESTS SET status = "Approved" WHERE request_id = ?', [id]);

            if (request.req_type === 'Checkout') {
                const book = await db.get('SELECT status FROM BOOKS WHERE book_id = ?', [request.book_id]);
                if (book.status !== 'Available') {
                    await db.run('ROLLBACK');
                    return res.status(400).json({ error: 'Book is no longer available' });
                }

                await db.run('UPDATE BOOKS SET status = "Issued" WHERE book_id = ?', [request.book_id]);

                const issueDate = new Date();
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 14);

                await db.run(
                    'INSERT INTO TRANSACTIONS (user_id, book_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
                    [request.user_id, request.book_id, issueDate.toISOString().split('T')[0], dueDate.toISOString().split('T')[0], 'Issued']
                );

                // Reject all other pending checkout requests for this book (race condition fix)
                await db.run(
                    `UPDATE REQUESTS SET status = 'Rejected' WHERE book_id = ? AND req_type = 'Checkout' AND status = 'Pending' AND request_id != ?`,
                    [request.book_id, id]
                );
            } else if (request.req_type === 'Return') {
                const transaction = await db.get(
                    'SELECT * FROM TRANSACTIONS WHERE user_id = ? AND book_id = ? AND status = "Issued"',
                    [request.user_id, request.book_id]
                );
                let fine = 0;
                if (transaction) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const dueDate = new Date(transaction.due_date);
                    dueDate.setHours(0,0,0,0);
                    if (today > dueDate) {
                        const diffTime = Math.abs(today - dueDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        fine = diffDays * 10;
                    }
                }

                await db.run('UPDATE BOOKS SET status = "Available" WHERE book_id = ?', [request.book_id]);
                await db.run(
                    'UPDATE TRANSACTIONS SET status = "Returned", fine_amount = ? WHERE user_id = ? AND book_id = ? AND status = "Issued"',
                    [fine, request.user_id, request.book_id]
                );
            }

            await db.run('COMMIT');
            res.json({ message: 'Request approved successfully' });
        } catch (error) {
            await db.run('ROLLBACK');
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Transactions Routes
    app.get('/api/transactions/my-books', authenticateToken, requireRole('student'), async (req, res) => {
        try {
            const transactions = await db.all(`
                SELECT t.*, b.title as book_title, b.author as book_author
                FROM TRANSACTIONS t
                JOIN BOOKS b ON t.book_id = b.book_id
                WHERE t.user_id = ? AND t.status = 'Issued'
            `, [req.user.id]);

            const today = new Date();
            today.setHours(0,0,0,0);
            transactions.forEach(t => {
                const dueDate = new Date(t.due_date);
                dueDate.setHours(0,0,0,0);
                if (today > dueDate) {
                    const diffTime = Math.abs(today - dueDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    t.current_fine = diffDays * 10;
                } else {
                    t.current_fine = 0;
                }
            });

            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.get('/api/transactions/my-history', authenticateToken, requireRole('student'), async (req, res) => {
        try {
            const transactions = await db.all(`
                SELECT t.*, b.title as book_title, b.author as book_author
                FROM TRANSACTIONS t
                JOIN BOOKS b ON t.book_id = b.book_id
                WHERE t.user_id = ?
                ORDER BY t.issue_date DESC
            `, [req.user.id]);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.get('/api/transactions/all', authenticateToken, requireRole('librarian'), async (req, res) => {
        try {
            const transactions = await db.all(`
                SELECT t.*, u.name as user_name, u.student_id as user_student_id, b.title as book_title
                FROM TRANSACTIONS t
                JOIN USERS u ON t.user_id = u.user_id
                JOIN BOOKS b ON t.book_id = b.book_id
            `);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);
