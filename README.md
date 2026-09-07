# shoppable-feed

Лента товаров. Рабочий репозиторий продукта **shoppable-feed**.

Goals живут в [win-predict-ai-orchestrator](https://github.com/onlyzoran/win-predict-ai-orchestrator).

## Стек

Next.js (App Router) + React + TypeScript.

## Быстрый старт

```bash
git clone https://github.com/onlyzoran/shoppable-feed.git
cd shoppable-feed
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер с hot reload |
| `npm run build` | Production-сборка |
| `npm run lint` | ESLint |
| `npm run start` | Запуск production-сборки (после `build`) |

## Instagram posts API

`GET /api/posts?url=` загружает последние посты публичного профиля Instagram.

### Режимы загрузки (`INSTAGRAM_FETCH_MODE`)

| Значение | Поведение |
|----------|-----------|
| `auto` (по умолчанию) | Сначала direct HTML-scrape; при 429, 5xx или сетевой ошибке — fallback на RapidAPI |
| `direct` | Только прямой scrape страницы профиля |
| `rapidapi` | Только RapidAPI PullAPI |

### Переменные окружения

| Переменная | Обязательность | Описание |
|------------|----------------|----------|
| `RAPIDAPI_KEY` | Для `rapidapi` и fallback в `auto` | Ключ RapidAPI ([Instagram Scraper API от PullAPI](https://rapidapi.com/pullapi-pullapi-default/api/instagram-scraper-api14)) |
| `INSTAGRAM_FETCH_MODE` | Нет | `direct` \| `rapidapi` \| `auto` (default: `auto`) |
| `RAPIDAPI_HOST` | Нет | Host RapidAPI (default: `instagram-scraper-api14.p.rapidapi.com`) |

### Infisical (preview / prod)

1. Зарегистрируйтесь на [RapidAPI](https://rapidapi.com/) и подпишитесь на **Instagram Scraper API** (PullAPI).
2. Скопируйте **X-RapidAPI-Key** из dashboard.
3. В Infisical для окружения preview/prod добавьте секрет `RAPIDAPI_KEY` со значением ключа.
4. Опционально: `INSTAGRAM_FETCH_MODE=auto`, `RAPIDAPI_HOST=instagram-scraper-api14.p.rapidapi.com`.

## Структура

```
src/
  app/          # App Router: layout, page, стили
  components/   # React-компоненты
  lib/          # Утилиты и константы
```
