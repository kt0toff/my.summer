const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'study.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function now() {
  return new Date().toISOString();
}

function initialData() {
  return {
    nextTopicId: 13,
    nextTestId: 7,
    nextResultId: 1,
    topics: [
      { id: 1, subject: 'Математика', grade: '5–6', title: 'Дроби та відсотки', description: 'Звичайні дроби, десяткові дроби, відсотки, пропорції.', status: 'in_progress', priority: 'high', created_at: now(), updated_at: now() },
      { id: 2, subject: 'Математика', grade: '7', title: 'Лінійні рівняння', description: 'Рівняння, вирази, степені, многочлени.', status: 'todo', priority: 'high', created_at: now(), updated_at: now() },
      { id: 3, subject: 'Математика', grade: '8', title: 'Квадратні рівняння', description: 'Дискримінант, теорема Вієта, квадратні корені.', status: 'todo', priority: 'high', created_at: now(), updated_at: now() },
      { id: 4, subject: 'Математика', grade: '9', title: 'Функції та графіки', description: 'Лінійна і квадратична функції, графіки, нерівності.', status: 'todo', priority: 'normal', created_at: now(), updated_at: now() },
      { id: 5, subject: 'Математика', grade: '10', title: 'Тригонометрія і похідна', description: 'Формули, рівняння, правила диференціювання.', status: 'todo', priority: 'high', created_at: now(), updated_at: now() },
      { id: 6, subject: 'Хімія', grade: '7', title: 'Формули і валентність', description: 'Атоми, молекули, хімічні формули, валентність.', status: 'todo', priority: 'normal', created_at: now(), updated_at: now() },
      { id: 7, subject: 'Хімія', grade: '8', title: 'Реакції та класи речовин', description: 'Оксиди, кислоти, основи, солі, рівняння реакцій.', status: 'todo', priority: 'normal', created_at: now(), updated_at: now() },
      { id: 8, subject: 'Хімія', grade: '9–10', title: 'Розрахунки та органіка', description: 'Кількість речовини, розчини, органічні речовини.', status: 'todo', priority: 'normal', created_at: now(), updated_at: now() },
      { id: 9, subject: 'Українська мова', grade: '5–7', title: 'Частини мови', description: 'Іменник, прикметник, дієслово, прислівник, службові частини мови.', status: 'todo', priority: 'normal', created_at: now(), updated_at: now() },
      { id: 10, subject: 'Українська мова', grade: '8–10', title: 'Синтаксис і пунктуація', description: 'Просте та складне речення, коми, редагування.', status: 'todo', priority: 'high', created_at: now(), updated_at: now() },
      { id: 11, subject: 'Історія України', grade: '7–8', title: 'Русь-Україна і козацтво', description: 'Князі, хрещення, Запорозька Січ, Хмельницький.', status: 'todo', priority: 'normal', created_at: now(), updated_at: now() },
      { id: 12, subject: 'Історія України', grade: '9–10', title: 'Україна 1900–1945', description: 'Українська революція, Голодомор, Друга світова.', status: 'todo', priority: 'high', created_at: now(), updated_at: now() }
    ],
    tests: [
      { id: 1, subject: 'Математика', title: 'Відсотки', question: 'Скільки буде 20% від 150?', answer: '30', explanation: '20% = 0,2. 150 × 0,2 = 30.', created_at: now() },
      { id: 2, subject: 'Математика', title: 'Квадратне рівняння', question: 'Чому дорівнює дискримінант рівняння x² - 5x + 6 = 0?', answer: '1', explanation: 'D = b² - 4ac = 25 - 24 = 1.', created_at: now() },
      { id: 3, subject: 'Хімія', title: 'Кількість речовини', question: 'Яка формула кількості речовини через масу і молярну масу?', answer: 'n=m/M', explanation: 'Кількість речовини n дорівнює масі m, поділеній на молярну масу M.', created_at: now() },
      { id: 4, subject: 'Українська мова', title: 'Частини мови', question: 'Яка частина мови відповідає на питання хто? що?', answer: 'іменник', explanation: 'Іменник називає предмет і відповідає на питання хто? що?', created_at: now() },
      { id: 5, subject: 'Історія України', title: 'Русь-Україна', question: 'У якому році відбулося хрещення Русі-України?', answer: '988', explanation: 'Хрещення Русі-України відбулося за князя Володимира Великого у 988 році.', created_at: now() },
      { id: 6, subject: 'Історія України', title: 'Українська революція', question: 'Коли відбувся Акт Злуки УНР і ЗУНР?', answer: '22 січня 1919', explanation: 'Акт Злуки проголошено 22 січня 1919 року.', created_at: now() }
    ],
    test_results: []
  };
}

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(initialData(), null, 2), 'utf-8');
}

function readDb() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

function publicTest(test) {
  const { answer, explanation, created_at, ...safe } = test;
  return safe;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function topicKey(topic) {
  return `${topic.subject}|${topic.grade}|${topic.title}`.toLowerCase();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'my-summer-study-app', storage: 'json' });
});

app.get('/api/topics', (req, res) => {
  try {
    const db = readDb();
    res.json([...db.topics].sort((a, b) => b.id - a.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/topics', (req, res) => {
  try {
    const { subject, grade, title, description = '', priority = 'normal' } = req.body;
    if (!subject || !grade || !title) return res.status(400).json({ error: 'subject, grade and title are required' });

    const db = readDb();
    const topic = {
      id: db.nextTopicId++,
      subject,
      grade,
      title,
      description,
      status: 'todo',
      priority,
      created_at: now(),
      updated_at: now()
    };

    db.topics.push(topic);
    writeDb(db);
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/topics/bulk', (req, res) => {
  try {
    const incoming = Array.isArray(req.body.topics) ? req.body.topics : [];
    if (incoming.length === 0) return res.status(400).json({ error: 'topics array is required' });

    const db = readDb();
    const existing = new Set(db.topics.map(topicKey));
    const added = [];
    let skipped = 0;

    for (const item of incoming) {
      if (!item.subject || !item.grade || !item.title) {
        skipped += 1;
        continue;
      }

      const key = topicKey(item);
      if (existing.has(key)) {
        skipped += 1;
        continue;
      }

      const topic = {
        id: db.nextTopicId++,
        subject: item.subject,
        grade: item.grade,
        title: item.title,
        description: item.description || '',
        status: item.status || 'todo',
        priority: item.priority || 'normal',
        created_at: now(),
        updated_at: now()
      };

      db.topics.push(topic);
      existing.add(key);
      added.push(topic);
    }

    writeDb(db);
    res.status(201).json({ added: added.length, skipped, topics: added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/topics/:id', (req, res) => {
  try {
    const db = readDb();
    const id = Number(req.params.id);
    const topic = db.topics.find((item) => item.id === id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const allowed = ['subject', 'grade', 'title', 'description', 'status', 'priority'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) topic[key] = req.body[key];
    }
    topic.updated_at = now();

    writeDb(db);
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/topics/:id', (req, res) => {
  try {
    const db = readDb();
    const id = Number(req.params.id);
    const before = db.topics.length;
    db.topics = db.topics.filter((item) => item.id !== id);
    if (db.topics.length === before) return res.status(404).json({ error: 'Topic not found' });

    writeDb(db);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const db = readDb();
    const total = db.topics.length;
    const done = db.topics.filter((topic) => topic.status === 'done').length;
    const inProgress = db.topics.filter((topic) => topic.status === 'in_progress').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const bySubjectMap = new Map();
    for (const topic of db.topics) {
      if (!bySubjectMap.has(topic.subject)) bySubjectMap.set(topic.subject, { subject: topic.subject, total: 0, done: 0 });
      const row = bySubjectMap.get(topic.subject);
      row.total += 1;
      if (topic.status === 'done') row.done += 1;
    }

    const bySubject = [...bySubjectMap.values()].sort((a, b) => a.subject.localeCompare(b.subject, 'uk'));
    res.json({ total, done, inProgress, percent, bySubject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/random', (req, res) => {
  try {
    const db = readDb();
    const subject = req.query.subject;
    const pool = subject ? db.tests.filter((test) => test.subject === subject) : db.tests;
    if (pool.length === 0) return res.status(404).json({ error: 'No tests found' });

    const test = pool[Math.floor(Math.random() * pool.length)];
    res.json(publicTest(test));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tests/:id/check', (req, res) => {
  try {
    const db = readDb();
    const id = Number(req.params.id);
    const test = db.tests.find((item) => item.id === id);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const userAnswer = req.body.answer || '';
    const isCorrect = normalize(userAnswer) === normalize(test.answer);

    db.test_results.push({
      id: db.nextResultId++,
      test_id: test.id,
      user_answer: userAnswer,
      is_correct: isCorrect,
      created_at: now()
    });
    writeDb(db);

    res.json({ correct: isCorrect, correctAnswer: test.answer, explanation: test.explanation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDatabase();

app.listen(PORT, () => {
  console.log(`Study app is running on http://localhost:${PORT}`);
  console.log(`JSON database: ${dbPath}`);
});
