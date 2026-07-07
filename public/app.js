const state = {
  topics: [],
  stats: null,
  currentQuestion: null
};

const subjects = [
  { name: 'Математика', icon: '📐' },
  { name: 'Хімія', icon: '⚗️' },
  { name: 'Українська мова', icon: '✍️' },
  { name: 'Історія України', icon: '🏛️' }
];

const statusLabels = {
  todo: 'План',
  in_progress: 'В роботі',
  done: 'Готово'
};

const priorityLabels = {
  low: 'Низький',
  normal: 'Звичайний',
  high: 'Високий'
};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

function setTodayLabel() {
  const date = new Date();
  qs('#todayLabel').textContent = date.toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

function setupNavigation() {
  qsa('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      qsa('.nav-btn').forEach((item) => item.classList.remove('active'));
      qsa('.view').forEach((view) => view.classList.remove('active'));
      btn.classList.add('active');
      qs(`#${btn.dataset.view}`).classList.add('active');
    });
  });
}

async function loadData() {
  const [topics, stats] = await Promise.all([
    api('/api/topics'),
    api('/api/stats')
  ]);
  state.topics = topics;
  state.stats = stats;
  renderAll();
}

function renderAll() {
  renderStats();
  renderActiveTopics();
  renderTopicsList();
}

function getSubjectStats() {
  const byName = new Map();

  subjects.forEach((subject) => {
    byName.set(subject.name, {
      ...subject,
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
      percent: 0
    });
  });

  state.topics.forEach((topic) => {
    if (!byName.has(topic.subject)) {
      byName.set(topic.subject, {
        name: topic.subject,
        icon: '📚',
        total: 0,
        done: 0,
        inProgress: 0,
        todo: 0,
        percent: 0
      });
    }

    const item = byName.get(topic.subject);
    item.total += 1;
    if (topic.status === 'done') item.done += 1;
    else if (topic.status === 'in_progress') item.inProgress += 1;
    else item.todo += 1;
  });

  return [...byName.values()].map((item) => ({
    ...item,
    percent: item.total === 0 ? 0 : Math.round((item.done / item.total) * 100)
  }));
}

function renderStats() {
  const stats = state.stats;
  qs('#overallPercent').textContent = `${stats.percent}%`;
  qs('#doneCount').textContent = `${stats.done} / ${stats.total}`;
  qs('#progressFill').style.width = `${stats.percent}%`;

  const subjectStats = getSubjectStats();
  renderSubjectCards('#subjectCards', subjectStats);
  renderSubjectCards('#topicSubjectCards', subjectStats, true);

  const subjectProgress = qs('#subjectProgress');
  subjectProgress.innerHTML = '';

  subjectStats.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.innerHTML = `
      <span>${item.icon} ${item.name}</span>
      <div class="mini-track"><div class="mini-fill" style="width: ${item.percent}%"></div></div>
      <strong>${item.percent}%</strong>
    `;
    subjectProgress.appendChild(row);
  });
}

function renderSubjectCards(selector, subjectStats, compact = false) {
  const container = qs(selector);
  if (!container) return;

  container.innerHTML = '';

  subjectStats.forEach((subject) => {
    const card = document.createElement('div');
    card.className = `subject-card ${compact ? 'subject-card-compact' : ''}`;
    card.innerHTML = `
      <div class="subject-card-top">
        <div class="subject-icon">${subject.icon}</div>
        <div>
          <h4>${subject.name}</h4>
          <p>${subject.done} з ${subject.total} тем готово</p>
        </div>
        <strong>${subject.percent}%</strong>
      </div>
      <div class="subject-big-track">
        <div class="subject-big-fill" style="width: ${subject.percent}%"></div>
      </div>
      <div class="subject-mini-stats">
        <span>План: ${subject.todo}</span>
        <span>В роботі: ${subject.inProgress}</span>
        <span>Готово: ${subject.done}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function topicCard(topic, compact = false) {
  const card = document.createElement('div');
  card.className = 'topic-card';
  card.innerHTML = `
    <p class="eyebrow">${topic.subject} • ${topic.grade}</p>
    <h4>${escapeHtml(topic.title)}</h4>
    <p class="muted">${escapeHtml(topic.description || 'Без опису')}</p>
    <div class="topic-meta">
      <span class="tag ${topic.status}">${statusLabels[topic.status] || topic.status}</span>
      <span class="tag ${topic.priority}">${priorityLabels[topic.priority] || topic.priority}</span>
    </div>
  `;

  if (!compact) {
    const actions = document.createElement('div');
    actions.className = 'topic-actions';
    actions.innerHTML = `
      <button data-status="todo">План</button>
      <button data-status="in_progress">В роботі</button>
      <button data-status="done">Готово</button>
      <button class="danger" data-delete="true">Видалити</button>
    `;

    actions.querySelectorAll('[data-status]').forEach((button) => {
      button.addEventListener('click', () => updateTopic(topic.id, { status: button.dataset.status }));
    });

    actions.querySelector('[data-delete]').addEventListener('click', () => deleteTopic(topic.id));
    card.appendChild(actions);
  }

  return card;
}

function renderActiveTopics() {
  const container = qs('#activeTopics');
  container.innerHTML = '';

  const active = state.topics
    .filter((topic) => topic.status !== 'done')
    .sort((a, b) => (b.priority === 'high') - (a.priority === 'high'))
    .slice(0, 6);

  if (active.length === 0) {
    container.innerHTML = '<div class="empty">Усі теми закриті. Це вже звучить як легенда.</div>';
    return;
  }

  active.forEach((topic) => container.appendChild(topicCard(topic, true)));
}

function renderTopicsList() {
  const container = qs('#topicsList');
  container.innerHTML = '';

  if (state.topics.length === 0) {
    container.innerHTML = '<div class="empty">Поки тем немає. Додай першу.</div>';
    return;
  }

  state.topics.forEach((topic) => container.appendChild(topicCard(topic)));
}

async function updateTopic(id, payload) {
  await api(`/api/topics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  await loadData();
}

async function deleteTopic(id) {
  const ok = confirm('Видалити цю тему?');
  if (!ok) return;

  await api(`/api/topics/${id}`, { method: 'DELETE' });
  await loadData();
}

function setupTopicForm() {
  qs('#topicForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      subject: qs('#subjectInput').value,
      grade: qs('#gradeInput').value.trim(),
      title: qs('#titleInput').value.trim(),
      description: qs('#descriptionInput').value.trim(),
      priority: qs('#priorityInput').value
    };

    await api('/api/topics', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    event.target.reset();
    qs('#subjectInput').value = 'Математика';
    qs('#priorityInput').value = 'normal';
    await loadData();
  });
}

function setupTests() {
  qs('#newQuestionBtn').addEventListener('click', loadQuestion);

  qs('#answerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.currentQuestion) return;

    const answer = qs('#answerInput').value.trim();
    if (!answer) return;

    const result = await api(`/api/tests/${state.currentQuestion.id}/check`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });

    renderAnswerResult(result);
  });
}

async function loadQuestion() {
  const subject = qs('#testSubject').value;
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  const question = await api(`/api/tests/random${query}`);
  state.currentQuestion = question;

  qs('#questionBox').innerHTML = `
    <p class="eyebrow">${question.subject} • ${question.title}</p>
    <h4>${escapeHtml(question.question)}</h4>
  `;
  qs('#answerInput').value = '';
  qs('#answerResult').className = 'answer-result';
  qs('#answerResult').innerHTML = '';
}

function renderAnswerResult(result) {
  const box = qs('#answerResult');
  box.className = `answer-result show ${result.correct ? 'correct' : 'wrong'}`;
  box.innerHTML = result.correct
    ? `<strong>Правильно ✅</strong><p>${escapeHtml(result.explanation || '')}</p>`
    : `<strong>Не зовсім ❌</strong><p>Правильна відповідь: <b>${escapeHtml(result.correctAnswer)}</b></p><p>${escapeHtml(result.explanation || '')}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function main() {
  setTodayLabel();
  setupNavigation();
  setupTopicForm();
  setupTests();
  await loadData();
}

main().catch((error) => {
  console.error(error);
  alert(`Помилка: ${error.message}`);
});
