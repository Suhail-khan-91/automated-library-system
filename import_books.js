const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');

const categories = ['Computer Science', 'Data Science', 'Mathematics', 'Business', 'Fiction'];

async function importBooks() {
    try {
        const db = await sqlite.open({
            filename: './library.db',
            driver: sqlite3.Database
        });

        console.log('Connected to the SQLite database.');

        const results = [];
        fs.createReadStream('books.csv')
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let count = 0;
                for (const row of results) {
                    const book_id = row.book_id;
                    const title = row.book_name;
                    const author = "Various Authors";
                    const category = categories[Math.floor(Math.random() * categories.length)];
                    
                    try {
                        await db.run(
                            `INSERT OR REPLACE INTO BOOKS (book_id, title, author, category) 
                             VALUES (?, ?, ?, ?)`,
                            [book_id, title, author, category]
                        );
                        count++;
                    } catch (err) {
                        console.error(`Error inserting book_id ${book_id}:`, err);
                    }
                }
                console.log(`Successfully processed ${count} books from CSV.`);
                await db.close();
            });
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}

importBooks();
