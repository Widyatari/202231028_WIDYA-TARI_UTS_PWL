// Struktur Project
// - backend/ (Node.js + Express + SQL + JWT Auth)
// - frontend/ (React)

// === BACKEND ===
// File: backend/server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pln_services'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi ke database:', err.message);
    return;
  }
  console.log('✅ Koneksi ke database berhasil');
});


const SECRET = 'rahasiaJWT123';

// === Auth ===
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'User registered successfully' });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login data:', username, password); // 👈 tambahkan ini
  ...

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, results[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: results[0].id }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(403);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// === Booking CRUD ===
app.post('/api/bookings', verifyToken, (req, res) => {
  const { name, email, service_type, schedule_date } = req.body;
  const sql = 'INSERT INTO bookings (name, email, service_type, schedule_date) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, service_type, schedule_date], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Booking created', id: result.insertId });
  });
});

app.get('/api/bookings', verifyToken, (req, res) => {
  db.query('SELECT * FROM bookings', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.put('/api/bookings/:id', verifyToken, (req, res) => {
  const { name, email, service_type, schedule_date } = req.body;
  const sql = 'UPDATE bookings SET name=?, email=?, service_type=?, schedule_date=? WHERE id=?';
  db.query(sql, [name, email, service_type, schedule_date, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Booking updated' });
  });
});


app.delete('/api/bookings/:id', verifyToken, (req, res) => {
  db.query('DELETE FROM bookings WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Booking deleted' });
  });
});

app.get('/api/bookings/:id', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM bookings WHERE id=?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: 'Booking not found' });
    res.json(results[0]);
  });
});


app.listen(port, () => console.log(`Server running on http://localhost:${port}`));