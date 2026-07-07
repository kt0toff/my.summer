# Як запустити сайт

Це невеликий сайт для літнього навчання з сервером, JSON-базою даних, progress bar, списком тем і мінітестами.

Версія з JSON зроблена спеціально, щоб нормально запускатися в Termux без проблем зі `sqlite3`.

## 1. Встанови Node.js і Git у Termux

```bash
pkg update && pkg upgrade
pkg install nodejs git
```

Перевірка:

```bash
node -v
npm -v
```

## 2. Склонуй репозиторій

```bash
git clone https://github.com/kt0toff/my.summer.git
cd my.summer
```

Якщо репозиторій уже є на телефоні, онови його:

```bash
cd ~/my.summer
git pull
```

## 3. Очисти стару невдалу установку, якщо була помилка з sqlite3

```bash
rm -rf node_modules package-lock.json
```

## 4. Встанови залежності

```bash
npm install
```

Тепер має встановитися тільки `express`, без компіляції SQLite.

## 5. Запусти сервер

```bash
npm start
```

Після запуску сайт буде тут:

```text
http://localhost:3000
```

База даних створиться автоматично:

```text
data/study.json
```

## 6. Запуск через ngrok

В іншому терміналі Termux запусти:

```bash
ngrok http 3000
```

ngrok дасть посилання типу:

```text
https://example-name.ngrok-free.app
```

Відкрий його в браузері — сайт буде доступний через інтернет.

## Що є на сайті

- гарний dashboard;
- progress bar;
- додавання тем до вивчення;
- статуси тем: план, в роботі, готово;
- мінітести;
- JSON база даних;
- швидкі переходи до підручників і roadmap.

## Корисні команди

Запуск:

```bash
npm start
```

Перезапуск після змін:

```bash
Ctrl + C
npm start
```

Якщо треба очистити базу:

```bash
rm -rf data/study.json
npm start
```

Після цього база створиться заново з початковими темами і тестами.
