# modus-bg.ru — статический лендинг

7 готовых HTML-файлов. Сборка не требуется, зависимостей нет — открывается двойным кликом в браузере.

## Файлы

| Файл | URL на проде | Назначение |
|---|---|---|
| `index.html` | `/` | Главная |
| `medicine.html` | `/medicine` | Медицина |
| `stroyka.html` | `/stroyka` | Стройка |
| `it.html` | `/it` | IT-сектор |
| `tamozhenaya.html` | `/tamozhenaya-garantiya` | Таможенные гарантии |
| `privacy.html` | `/privacy` | Политика конфиденциальности (заглушка) |
| `personal-data-consent.html` | `/personal-data-consent` | Согласие на обработку ПД (заглушка) |

## Как развернуть

### Netlify (текущий хостинг сайта)

1. Залогиниться в `app.netlify.com`, открыть проект `modus-bg`.
2. **Deploys → Deploy manually** → перетащить всю папку (или ZIP).
3. Если URL должны быть без `.html` (`/medicine` вместо `/medicine.html`) — добавить в корень `_redirects`:
   ```
   /medicine               /medicine.html               200
   /stroyka                /stroyka.html                200
   /it                     /it.html                     200
   /tamozhenaya-garantiya  /tamozhenaya.html            200
   /privacy                /privacy.html                200
   /personal-data-consent  /personal-data-consent.html  200
   ```

### Любой статический хостинг (Vercel, GitHub Pages, S3, FTP)

Просто залить все 7 HTML в корень. Если нужны URL без `.html` — настроить rewrites средствами хостинга.

### Свой сервер (nginx)

```nginx
location / {
  root /var/www/modus-bg;
  try_files $uri $uri.html $uri/ =404;
}
```

## Что доделать после деплоя

В коде есть **3 заглушки**, которые нужно заменить, когда придут данные:

1. **Max-кнопки** (шапка / hero / футер) — сейчас `href="#"` + `class="ic-disabled"` / `alt-disabled`. Когда появится URL Max-аккаунта Модус — заменить `href="#"` на реальный URL и убрать `ic-disabled`/`alt-disabled`.
2. **Telegram-кнопки** — то же самое: сейчас disabled до получения официального URL канала.
3. **Тексты `privacy.html` и `personal-data-consent.html`** — сейчас placeholder «Текст будет добавлен». Подставить юр. тексты по 152-ФЗ от юриста.

## Стек

- Чистый HTML/CSS/JS, без сборки.
- Шрифты Google Fonts: Manrope, Fraunces, JetBrains Mono (грузятся с CDN).
- Никаких внешних JS-библиотек.
- Калькулятор стоимости БГ работает локально (4 закона × 4 типа БГ × диапазон ставок 1.7%–5.5% × округление до 100 ₽ × минимум 1200 ₽).
- Опрос для предварительного решения — 4 шага + расчёт вероятности одобрения и количества подходящих банков.
- Адаптив до 375px включительно. Sticky-CTA на мобильных (≤760px).

## Аналитика

Не подключена. Когда будут готовы счётчики (Яндекс.Метрика / GA / Calltouch) — подставить в `<head>` каждого HTML, либо поднять на сервере один общий `analytics.js` и подключить везде.
