const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'study.db');
const db = new sqlite3.Database(dbPath);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      title TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(test_id) REFERENCES tests(id)
    )
  `);

  await seedIfEmpty();
}

async function seedIfEmpty() {
  const count = await get('SELECT COUNT(*) AS count FROM topics');
  if (count.count > 0) return;

  const topics = [
    ['Математика', '5–6', 'Дроби та відсотки', 'Звичайні дроби, десяткові дроби, відсотки, пропорції.', 'in_progress', 'high'],
    ['Математика', '7', 'Лінійні рівняння', 'Рівняння, вирази, степені, многочлени.', 'todo', 'high'],
    ['Математика', '8', 'Квадратні рівняння', 'Дискримінант, теорема Вієта, квадратні корені.', 'todo', 'high'],
    ['Математика', '9', 'Функції та графіки', 'Лінійна і квадратична функції, графіки, нерівності.', 'todo', 'normal'],
    ['Математика', '10', 'Тригонометрія і похідна', 'Формули, рівняння, правила диференціювання.', 'todo', 'high'],
    ['Хімія', '7', 'Формули і валентність', 'Атоми, молекули, хімічні формули, валентність.', 'todo', 'normal'],
    ['Хімія', '8', 'Реакції та класи речовин', 'Оксиди, кислоти, основи, солі, рівняння реакцій.', 'todo', 'normal'],
    ['Хімія', '9–10', 'Розрахунки та органіка', 'Кількість речовини, розчини, органічні речовини.', 'todo', 'normal'],
    ['Українська мова', '5–7', 'Частини мови', 'Іменник, прикметник, дієслово, прислівник, службові частини мови.', 'todo', 'normal'],
    ['Українська мова', '8–10', 'Синтаксис і пунктуація', 'Просте та складне речення, коми, редагування.', 'todo', 'high'],
    ['Історія України', '7–8', 'Русь-Україна і козацтво', 'Князі, хрещення, Запорозька Січ, Хмельницький.', 'todo', 'normal'],
    ['Історія України', '9–10', 'Україна 1900–1945', 'Українська революція, Голодомор, Друга світова.', 'todo', 'high']
  ];

  for (const topic of topics) {
    await run(
      'INSERT INTO topics (subject, grade, title, description, status, priority) VALUES (?, ?, ?, ?, ?, ?)',
      topic
    );
  }

  const tests = [
    ['Математика', 'Відсотки', 'Скільки буде 20% від 150?', '30', '20% = 0,2. 150 × 0,2 = 30.'],
    ['Математика', 'Квадратне рівняння', 'Чому дорівнює дискримінант рівняння x² - 5x + 6 = 0?', '1', 'D = b² - 4ac = 25 - 24 = 1.'],
    ['Хімія', 'Кількість речовини', 'Яка формула кількості речовини через масу і молярну масу?', 'n=m/M', 'Кількість речовини n дорівнює масі m, поділеній на молярну масу M.'],
    ['Українська мова', 'Частини мови', 'Яка частина мови відповідає на питання хто? що?', 'іменник', 'Іменник називає предмет і відповідає на питання хто? що?'],
    ['Історія України', 'Русь-Україна', 'У якому році відбулося хрещення Русі-України?', '988', 'Хрещення Русі-України відбулося за князя Володимира Великого у 988 році.'],
    ['Історія України', 'Українська революція', 'Коли відбувся Акт Злуки УНР і ЗУНР?', '22 січня 1919', 'Акт Злуки проголошено 22 січня 1919 року.']
  ];

  for (const test of tests) {
    await run(
      'INSERT INTO tests (subject, title, question, answer, explanation) VALUES (?, ?, ?, ?, ?)',
      test
    );
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'my-summer-study-app' });
});

app.get('/api/topics', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM topics ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { subject, grade, title, description = '', priority = 'normal' } = req.body;
    if (!subject || !grade || !title) {
      return res.status(400).json({ error: 'subject, grade and title are required' });
    }
    const result = await run(
      'INSERT INTO topics (subject, grade, title, description, priority) VALUES (?, ?, ?, ?, ?)',
      [subject, grade, title, description, priority]
    );
    const topic = await get('SELECT * FROM topics WHERE id = ?', [result.lastID]);
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/topics/:id', async (req, res) => {
  try {
    const { status, priority, title, description, subject, grade } = req.body;
    const current = await get('SELECT * FROM topics WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Topic not found' });

    await run(
      `UPDATE topics
       SET status = ?, priority = ?, title = ?, description = ?, subject = ?, grade = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        status ?? current.status,
        priority ?? current.priority,
        title ?? current.title,
        description ?? current.description,
        subject ?? current.subject,
        grade ?? current.grade,
        req.params.id
      ]
    );
    const updated = await get('SELECT * FROM topics WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/topics/:id', async (req, res) => {
  try {
    await run('DELETE FROM topics WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const total = await get('SELECT COUNT(*) AS count FROM topics');
    const done = await get("SELECT COUNT(*) AS count FROM topics WHERE status = 'done'");
    const inProgress = await get("SELECT COUNT(*) AS count FROM topics WHERE status = 'in_progress'");
    const percent = total.count === 0 ? 0 : Math.round((done.count / total.count) * 100);
    const bySubject = await all(`
      SELECT subject,
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
      FROM topics
      GROUP BY subject
      ORDER BY subject
    `);
    res.json({ total: total.count, done: done.count, inProgress: inProgress.count, percent, bySubject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/random', async (req, res) => {
  try {
    const subject = req.query.subject;
    const rows = subject
      ? await all('SELECT id, subject, title, question FROM tests WHERE subject = ? ORDER BY RANDOM() LIMIT 1', [subject])
      : await all('SELECT id, subject, title, question FROM tests ORDER BY RANDOM() LIMIT 1');
    if (!rows[0]) return res.status(404).json({ error: 'No tests found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tests/:id/check', async (req, res) => {
  try {
    const test = await get('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const userAnswer = req.body.answer || '';
    const isCorrect = normalize(userAnswer) === normalize(test.answer);

    await run('INSERT INTO test_results (test_id, user_answer, is_correct) VALUES (?, ?, ?)', [
      test.id,
      userAnswer,
      isCorrect ? 1 : 0
    ]);

    res.json({
      correct: isCorrect,
      correctAnswer: test.answer,
      explanation: test.explanation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Study app is running on http://localhost:${PORT}`);
      console.log(`Database: ${dbPath}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
