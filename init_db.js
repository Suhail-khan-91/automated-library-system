const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
    try {
        const db = await sqlite.open({
            filename: './library.db',
            driver: sqlite3.Database
        });

        console.log('Connected to the SQLite database.');

        await db.exec('PRAGMA foreign_keys = ON;');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS USERS (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('student', 'librarian'))
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS BOOKS (
                book_id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Issued', 'Reserved'))
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS REQUESTS (
                request_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                book_id INTEGER,
                req_type TEXT NOT NULL CHECK(req_type IN ('Checkout', 'Return')),
                status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES USERS(user_id),
                FOREIGN KEY (book_id) REFERENCES BOOKS(book_id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS TRANSACTIONS (
                trans_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                book_id INTEGER,
                issue_date DATE NOT NULL,
                due_date DATE NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('Issued', 'Returned')),
                FOREIGN KEY (user_id) REFERENCES USERS(user_id),
                FOREIGN KEY (book_id) REFERENCES BOOKS(book_id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS RESERVATIONS (
                res_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                book_id INTEGER,
                queue_pos INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES USERS(user_id),
                FOREIGN KEY (book_id) REFERENCES BOOKS(book_id)
            );
        `);

        console.log('Tables created successfully.');

        // Insert default admin/librarian
        const adminEmail = 'admin@alms.edu';
        const existingAdmin = await db.get('SELECT * FROM USERS WHERE email = ?', [adminEmail]);
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.run(`
                INSERT INTO USERS (name, email, password, role) 
                VALUES (?, ?, ?, ?)
            `, ['Librarian Admin', adminEmail, hashedPassword, 'librarian']);
            console.log('Default librarian user inserted.');
        }

        // Insert dummy books
        const bookCount = await db.get('SELECT COUNT(*) as count FROM BOOKS');
        
        if (bookCount.count === 0) {
            const books = [
                ['The Pragmatic Programmer', 'Andrew Hunt', 'Computer Science'],
                ['Clean Code', 'Robert C. Martin', 'Computer Science'],
                ['Design Patterns', 'Erich Gamma', 'Computer Science'],
                ['1984', 'George Orwell', 'Fiction'],
                ['To Kill a Mockingbird', 'Harper Lee', 'Fiction']
            ];
            
            for (const book of books) {
                await db.run(`
                    INSERT INTO BOOKS (title, author, category) 
                    VALUES (?, ?, ?)
                `, book);
            }
            console.log('Dummy books inserted.');
        }

        console.log('Database initialization complete.');
        await db.close();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initializeDatabase();
