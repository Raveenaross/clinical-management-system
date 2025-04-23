const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Macro25**',
    database: 'user_authentication'
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

// Serve register.html at the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

// Handle registration form submission
app.post('/register', (req, res) => {
    const { nm, addr, psw, cpsw } = req.body;

    if (psw !== cpsw) {
        return res.status(400).send('Passwords do not match');
    }

    pool.getConnection((err, connection) => {
        if (err) {
            throw err;
        }

        const checkUserSql = 'SELECT * FROM users WHERE email = ?';
        connection.query(checkUserSql, [addr], (error, results) => {
            if (error) {
                connection.release();
                throw error;
            }

            if (results.length > 0) {
                connection.release();
                res.redirect('login.html'); // Redirect to login page if user already exists
            } else {
                const insertSql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
                connection.query(insertSql, [nm, addr, psw], (insertError, insertResults) => {
                    connection.release();

                    if (insertError) {
                        throw insertError;
                    }

                    res.redirect('/login'); // Redirect to login page after successful registration
                });
            }
        });
    });
});

// Serve home.html at /home
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

// Serve login.html at /login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { addr, psw } = req.body;

    pool.getConnection((err, connection) => {
        if (err) {
            throw err;
        }

        const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
        connection.query(sql, [addr, psw], (error, results) => {
            connection.release();

            if (error) {
                throw error;
            }

            if (results.length > 0) {
                res.redirect('/home'); // Redirect to home page if login is successful
            } else {
                res.status(400).send('Login failed. Incorrect email or password.');
            }
        });
    });
});
app.post('/book', (req, res) => {
    const { nm, addr, pp, mn, dept, dt, tm } = req.body;

    // Use the connection pool to execute the query
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database: ', err);
            return res.status(500).send('Error connecting to database');
        }

        // Insert a new record into the appointments table
        const sql = `INSERT INTO appointments (name, email, purpose, mobileNumber, department, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [nm, addr, pp, mn, dept, dt, tm];

        connection.query(sql, values, (err, result) => {
            connection.release(); // release connection

            if (err) {
                console.error('Error executing query: ', err);
                return res.status(500).send('Error saving data to database');
            }

            console.log('Form data inserted successfully');
            // Redirect to book.html after successful form submission
            res.redirect('/book.html');
        });
    });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
