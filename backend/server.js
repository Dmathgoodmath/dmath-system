const express = require('express');
const cors = require('cors');
const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

let db;

(async () => {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'school'
  });
})();

// ---------------- LOGIN ----------------
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await db.query(
    'SELECT * FROM users WHERE username=? AND password=?',
    [username, password]
  );

  if (rows.length > 0) res.json(rows[0]);
  else res.status(401).send('fail');
});

// ---------------- ADD STUDENT ----------------
app.post('/students', async (req, res) => {
  const { name } = req.body;
  const student_id = 'ST' + Date.now().toString().slice(-5);

  await db.query(
    'INSERT INTO students (student_id, name) VALUES (?, ?)',
    [student_id, name]
  );

  res.json({ student_id });
});

// ---------------- ADD COURSE ----------------
app.post('/courses', async (req, res) => {
  const { student_id, total_hours } = req.body;

  await db.query(
    `INSERT INTO courses (student_id, total_hours, remaining_hours)
     VALUES (?, ?, ?)`,
    [student_id, total_hours, total_hours]
  );

  res.sendStatus(200);
});

// ---------------- GET STUDENT (QR) ----------------
app.get('/student/:id', async (req, res) => {
  const [rows] = await db.query(`
    SELECT s.name, s.student_id, c.course_id, c.remaining_hours
    FROM students s
    JOIN courses c ON s.student_id = c.student_id
    WHERE s.student_id = ?
  `, [req.params.id]);

  res.json(rows[0]);
});

// ---------------- ATTENDANCE ----------------
app.post('/attendance', async (req, res) => {
  const { student_id, course_id, hours_used } = req.body;

  await db.query(
    `INSERT INTO attendance (student_id, course_id, date, hours_used)
     VALUES (?, ?, NOW(), ?)`,
    [student_id, course_id, hours_used]
  );

  await db.query(
    `UPDATE courses SET remaining_hours = remaining_hours - ?
     WHERE course_id = ?`,
    [hours_used, course_id]
  );

  res.sendStatus(200);
});

// ---------------- EXPORT ----------------
app.get('/export', async (req, res) => {
  const [rows] = await db.query(`
    SELECT s.student_id, s.name, c.total_hours, c.remaining_hours
    FROM students s
    JOIN courses c ON s.student_id = c.student_id
  `);

  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('students');

  sheet.columns = [
    { header: 'ID', key: 'student_id' },
    { header: 'Name', key: 'name' },
    { header: 'Total', key: 'total_hours' },
    { header: 'Remain', key: 'remaining_hours' }
  ];

  sheet.addRows(rows);

  res.setHeader('Content-Type','application/vnd.openxmlformats');
  res.setHeader('Content-Disposition','attachment; filename=data.xlsx');

  await wb.xlsx.write(res);
  res.end();
});

app.listen(3000, () => console.log('API running'));
