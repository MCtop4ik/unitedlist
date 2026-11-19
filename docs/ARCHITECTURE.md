# ARCHITECTURE — GD United List

Документ описывает, как устроен объединённый демонлист: зоны, данные, API и UI. Идея и границы проекта — в `docs/PRD.md`.

## 1. Базовая модель

Ключевая сущность — **Level**. Один уровень существует в каталоге ровно один раз и определяется по `levelId` Geometry Dash.

```ts
type Level = {
  levelId: number;
  name: string;
  author: string;
  zone: "pointercrate" | "aredl" | "gdladder";
  zoneRank: number;
  globalRank: number;
  difficulty: string;
  thumbnailUrl: string;
  verificationUrl?: string;
  song?: string;
  length?: "tiny" | "short" | "medium" | "long" | "xl";
};
```

Инварианты:

- `levelId` уникален во всём каталоге.
- У уровня одна основная зона (`zone`) и позиция внутри неё (`zoneRank`).
- `globalRank` уникален и задаёт порядок в ALL.
- ALL не хранит отдельный список: это все уровни, отсортированные по `globalRank`.
- Зоны не пересекаются. Пересечение с ALL не считается дублем: ALL — это представление, а не пятая зона.

Принадлежность уровней разрешается по приоритету источников:

1. Pointercrate топ-150 → `pointercrate`, `zoneRank` 1–150.
2. Экстрим-демоны AREDL вне топ-150 → `aredl`.
3. Остальные уровни GDDL → `gdladder`.

Если уровень есть в нескольких источниках, он остаётся в зоне с более высоким приоритетом, а остальные позиции используются только как справочные.

## 2. Зоны

### ALL

Полный каталог, отсортированный по `globalRank`. Служит главной страницей и поиском. Фильтры: зона, сложность, длина, автор, статус прохождения. ALL — единственное место, где смешиваются зоны.

### Pointercrate zone

Топ-150 Pointercrate, две вкладки:

- `main` — позиции 1–75;
- `extended` — позиции 76–150.

`zoneRank` равен позиции Pointercrate. Синхронизация берёт `GET /api/v2/demons/listed/` и отбрасывает записи с `position > 150`. Это самая сильная и самая быстро меняющаяся часть каталога.

### AREDL zone

Все экстрим-демоны AREDL, кроме топ-150 Pointercrate. Источник: `GET /api/aredl/levels?exclude_legacy=true`; `zoneRank` — позиция AREDL. Исключение топ-150 задаётся не вручную, а правилом при синхронизации: если `levelId` уже принадлежит Pointercrate, уровень в AREDL не попадает.

### GD Ladder zone

Все уровни GDDL, не попавшие в Pointercrate и AREDL. Источник: `GET /api/levels`; `zoneRank` — порядок по убыванию GDDL `rating` (выше рейтинг — сложнее), при равенстве — по `id`. Зона включает любые уровни GDDL, а не только экстрим-демоны: так каталог покрывает оставшуюся часть списка. AREDL и Pointercrate имеют приоритет, поэтому пересечений между зонами нет.

## 3. Порядок ALL и сложность

`globalRank` — хранимое поле в `data/`, а не значение, которое пересчитывается на каждом запросе. Причины:

- списки используют разные шкалы, поэтому автоматическое сведение позиций искажает сложность;
- ручная правка одного уровня не должна незаметно менять весь каталог;
- клиенту нужна стабильная позиция для отображения.

Начальный `globalRank` заполняется при импорте по приоритету зон и позициям внутри них, дальше поддерживается вместе с `data/`. В карточке уровня показываются обе позиции: общая (`globalRank`) и внутри зоны (`zoneRank`), чтобы не терять контекст источника.

Сложность (`difficulty`) отображается как в источнике зоны. Единая шкала сложности не вводится, пока нет подтверждённого правила сопоставления.

## 4. Игроки, прогресс и прохождения

```ts
type Player = {
  id: string;
  displayName: string;
  createdAt: string;
};

type Completion = {
  playerId: string;
  levelId: number;
  percent: number;
  completedAt: string;
  videoUrl?: string;
};

type Progress = {
  playerId: string;
  levelId: number;
  percent: number;
  updatedAt: string;
};
```

Аккаунты:

- Игрок регистрируется с email, display name и паролем. Пароль хранится только как
  необратимый scrypt-verifier, а сессии — как хеши случайных токенов.
- `accounts` расширяет `players` 1:1; `account_sessions` хранит устройства, срок
  действия и отзыв. Сессия живёт 30 дней с последнего использования.
- Прогресс и прохождения пишутся только от имени аккаунта из сессии. Guest-токены
  прежней поставки больше не разрешают запись, а их профили остаются read-only.
- `POST /api/players` удалён. Публичные чтения профилей остаются открытыми.

Правила:

- **Прохождение** — запись с `percent = 100`.
- **Прогресс** — лучший процент меньше 100. Отображается в профиле и карточке уровня.
- На уровне у игрока одна запись прогресса (лучший результат) и одна запись прохождения.
- Список прошедших уровень — все `Completion` по уровню, отсортированные по дате; показывается игрок и метка аккаунта/legacy/источника.
- Очки, очки-производные статусы, общий рейтинг и лидерборд не используются.

Личный кабинет показывает: профиль, количество прохождений, прогресс и лучшие прохождения.

## 5. Данные

`data/` — версионируемая таблица уровней, основной источник каталога. Минимальные колонки:

| Колонка | Назначение |
|---|---|
| `levelId` | ключ уровня, уникален |
| `name`, `author` | отображение |
| `zone` | `pointercrate` / `aredl` / `gdladder` |
| `zoneRank` | позиция внутри зоны |
| `globalRank` | позиция в ALL, уникальна |
| `difficulty` | сложность в терминах зоны |
| `thumbnailUrl` | превью |
| `videoUrl` | верификация/прохождение |
| `song`, `length` | карточка уровня |

Прохождения и игроки не хранятся в `data/`: это изменяемые пользовательские данные бэкенда. Справочная информация об уровнях может обновляться из источников, но `zone`, `zoneRank` и `globalRank` остаются под контролем `data/`.

## 6. Runtime catalog

Каталог уровней не хранится в SQLite. Backend загружает `data/levels.json` в память и
обновляет Pointercrate/AREDL по TTL (`CATALOG_TTL_MS`, по умолчанию 10 минут). GDDL
восстанавливается из официального backup CSV (`data/GDDL backup - GDDL.csv`): API отдаёт
не более 25 уровней на страницу, а runtime не ходит в GDDL напрямую. SQLite хранит
аккаунты, сессии, игроков, progress и completions. Guest-профили прежней поставки
сохраняются как read-only legacy-данные.

## 7. Внешние источники

- **Pointercrate API** — `https://pointercrate.com/api/v2/demons/listed/` (позиции, `level_id`, превью; пагинация `limit`/`after`/`before`, не более 100 за запрос) и `https://pointercrate.com/api/v1/records/` (прохождения, фильтры `demon_id`, `player`, `progress`). Топ-150 — это `position` 1–150 из `listed`. При открытии уровня зоны Pointercrate бэкенд запрашивает `records` с `demon_position` и `progress=100` в реальном времени. Документация: `https://pointercrate.com/documentation/index/`.
- **AREDL API v2** — база `https://api.aredl.net/v2/api`: `GET /aredl/levels` (позиции, `level_id`, `gddl_tier`, `points`), `GET /aredl/levels/{level_id}/records` (прохождения, пагинация `page`/`per_page`). Документация: `https://api.aredl.net/v2/docs`, OpenAPI: `https://api.aredl.net/v2/openapi.json`.
- **GDDL API** — база `https://gdladder.com`: `GET /api/levels` (пагинация `limit`/`page`, поиск `name`/`creator`, фильтры `minRating`/`maxRating`/`difficulty`, `excludeUnrated`; 10 000+ уровней), `GET /api/levels/{levelID}` (детали уровня), `GET /api/levels/{levelID}/submissions` (прохождения и прогресс, `limit`/`page`/`progressFilter`/`username`). `id` уровня совпадает с GD level ID, `rating` — сложность GDDL (больше = сложнее), `showcase` — YouTube ID. Документация: `https://registry.scalar.com/@gddemonladder/apis/gddl-api`.
- **boomlings.dev** — информация об уровнях.
- **levelthumbs.prevter.me** — превью: `https://levelthumbs.prevter.me/thumbnail/{levelId}/small`.

Правила интеграции:

- Фронтенд не обращается к внешним API напрямую.
- Бэкенд кеширует ответы с TTL; ошибка источника не ломает каталог, а отдаёт последние известные данные.
- Внешние данные не перезаписывают `zone`/`zoneRank`/`globalRank` автоматически без явного шага синхронизации.
- Превью кешируются или проксируются бэкендом, чтобы не зависеть от горячих ссылок и лимитов.

### Refresh scope (MVP)

`scripts/refresh-levels.ts` обновляет уровни и позиции Pointercrate и AREDL, берёт GDDL из
официального backup CSV, удаляет исчезнувшие из источников уровни и сохраняет приоритет
зон. `scripts/restore-gddl.ts` пересобирает только GDDL из backup CSV без сетевых запросов.
`scripts/refresh-completions.ts` автоматически импортирует completion records из
Pointercrate, AREDL и GDDL. Для AREDL/GDDL используются per-level adapters с bounded
concurrency, exponential backoff и resumable cursor. Imported records остаются read-only
и не входят в пользовательские записи сайта.

## 8. Архитектура

```
frontend (React + Radix UI)
        │  REST
        ▼
backend (Node.js)
  ├── levels   ← data/
  ├── players / completions / progress
  └── integrations + cache → Pointercrate, AREDL, GDDL, boomlings.dev
```

Бэкенд владеет:

- валидацией входных данных и прав доступа;
- объединением уровней и разрешением принадлежности зонам;
- кешем и деградацией при недоступности источников.

Фронтенд владеет отображением, фильтрами и состоянием UI. Он не решает, к какой зоне относится уровень.

### API (минимальный контракт)

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/levels?zone=&q=&difficulty=&page=&sort=
GET  /api/levels/:levelId
GET  /api/levels/:levelId/completions
GET  /api/players/:playerId
GET  /api/players/:playerId/completions
GET  /api/players/:playerId/progress
POST /api/progress          (account session required)
POST /api/completions       (account session required)
```

Списки всегда пагинируются на сервере. Клиент не загружает 10 000+ уровней целиком.

## 9. UI

- **ALL** — главный экран: таблица/список уровней, поиск, фильтры, пагинация.
- **Зоны** — вкладки Pointercrate (`main`/`extended`), AREDL, GD Ladder (GDDL). Radix Tabs.
- **Карточка уровня** — Radix Dialog: превью, позиции, сложность, автор, прохождения, прогресс игрока.
- **Профиль игрока** — прохождения, прогресс и лучшие прохождения.
- **Карточка игрока в списке прошедших** — Radix HoverCard/Popover с краткой информацией.

Radix UI используется для поведения и доступности примитивов (Tabs, Dialog, DropdownMenu, Popover, Tooltip, Progress, ScrollArea). Визуальный слой — собственные компоненты поверх Radix, без второй UI-библиотеки.

Состояние URL должно отражать зону, фильтры и страницу, чтобы ссылкой можно было поделиться.

## 10. Производительность

- Серверная пагинация и сортировка для каталога.
- Индексы по `globalRank`, `zone + zoneRank`, `levelId`.
- Список прохождений уровня тоже пагинируется.
- Превью грузятся лениво; для списка используется `small`-вариант.
- Кеш внешних источников не блокирует отдачу каталога.

## 11. Interaction Map

Все клики и состояния описаны в Penpot-борде `09 / Interaction Map`. Реализация
обязана повторять эти сценарии:

| Действие | Ответ интерфейса |
|---|---|
| Клик по строке уровня | Radix Dialog с деталями; ESC/backdrop закрывают, фокус возвращается на строку |
| «Record completion» без аккаунта | Radix Dialog «Account required» с входом или созданием аккаунта |
| «Record completion» с профилем | Radix AlertDialog с подтверждением и предупреждением о необратимости; после подтверждения — toast и обновление списков |
| «Update progress» | Radix Dialog с полем/слайдером 1–99; меньшее значение игнорируется, большее становится новым best |
| Ввод в поиск | Debounce 300 мс, skeleton, сброс страницы на 1, `?q=` в URL |
| Клик по фильтрам | Radix Popover с чекбоксами; Apply обновляет URL и результаты, Reset очищает |
| Клик по сортировке | Radix DropdownMenu с одним выбором; применяется сразу |
| Переключение зоны/подзоны | Radix Tabs; скелетон загрузки, URL сохраняет состояние |
| Клик по странице пагинации | Загрузка новой страницы, scroll to top, `?page=` в URL |
| Клик по импортированной записи | Radix HoverCard/Popover: источник, read-only |
| «Share» | Копирование URL с зоной, фильтрами и страницей; toast об успехе |
| Удаление прохождения администратором | Только внутренний инструмент/скрипт с явным подтверждением; в player UI такого действия нет |
| Ошибка источника | Inline-ошибка, последние данные остаются доступны, кнопка Retry |
| Уровень на мобильном | Bottom sheet; закрытие свайпом, backdrop или ESC |
| Клавиатура | `/` или `⌘K` фокусируют поиск; ESC закрывает оверлеи; Tab и focus-visible обязательны |

Правила: destructive-действия всегда требуют подтверждения; игрок не может удалить
или понизить свою запись; импортированные записи никогда не получают edit-действий.

## 12. Открытые решения

- Кто и как подтверждает прохождения, добавленные вручную.
- Восстановление пароля и подтверждение email не входят в текущую поставку.
