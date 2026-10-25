# Тренажёр аккордов. План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Статический сайт-тренажёр аккордов фортепиано для айфона: экранная клавиатура, звук рояля, упражнения четырёх видов, повторения по FSRS, карта мастерства, прогрессии под метроном, справочник.

**Architecture:** Чистая логика (теория аккордов, curriculum, FSRS, сборка сессии) живёт в `src/theory` и `src/learning` без React и тестируется Vitest. Состояние одно (`Progress`), хранится в localStorage через reducer в React context. Звук через Web Audio: сэмплер на 61 mp3 и метроном с опережающим планировщиком. Экраны React переключаются по хэшу.

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest, ts-fsrs 5, vite-plugin-pwa 2, обычный CSS с переменными.

**Spec:** `docs/superpowers/specs/2026-10-26-piano-chords-design.md`

## Global Constraints

- Без бэкенда и аккаунтов; данные только в localStorage, экспорт/импорт JSON.
- Язык интерфейса русский; названия аккордов латиницей; настройка «B или H»; подсказка слогами «до ре ми».
- Клавиатура: две октавы C4–B5 (midi 60–83) везде.
- Safari iOS: AudioContext создаётся и `resume()` вызывается только из обработчика жеста; `100dvh`, `env(safe-area-inset-*)`, `touch-action: none` на клавиатуре, `user-scalable=no`.
- Регистрация service worker обёрнута в try/catch.
- `vite.config.ts`: `base: './'`, чтобы сборка работала и на Artifact-хостинге, и на GitHub Pages.
- Типы аккордов, уровни, порядок введения, пороги времени и оценки FSRS берутся из спецификации дословно.
- Коммит после каждой задачи. Сообщения коммитов на английском, с trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. В «Собери» нажаты C4, C5, E4 (три клавиши, два класса нот): автопроверка срабатывает по количеству и должна показать ошибку с недостающей G, без исключений. Тест в задаче 4.
2. Сессия закончена в 23:59, следующая в 00:01: ключ дня по местному времени, стрик растёт на 1, а не на 2 и не сбрасывается. Тест в задаче 10.
3. Импорт чужого или битого JSON не должен затереть прогресс: `importProgress` бросает ошибку, UI показывает сообщение. Тест в задаче 10.
4. Сэмплы не загрузились (нет сети): упражнения идут дальше, `noteOn` не бросает, звучит запасной синтез. Тест в задаче 11.
5. Аккорды с двойными знаками (F♯aug, D♯ maj) пишутся простыми нотами (D вместо C𝄪). Тест в задаче 3.

---

### Task 1: Каркас проекта

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/base.css`, `src/vite-env.d.ts`, `.gitignore`, `README.md`
- Create: `public/samples/*.mp3` (61 файл из `/private/tmp/claude-501/-Users-anton-Piano/b7c4be7e-0f1b-49ff-8781-bfdb991a70db/scratchpad/samples-out/`), `public/samples/LICENSE.txt`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Produces: скрипты `npm run dev`, `npm run build`, `npm test` (vitest run), `npm run typecheck`.

- [ ] **Step 1: Создать проект** `npm create vite@latest . -- --template react-ts` (в пустой папке с docs: при вопросе про существующие файлы выбрать «игнорировать»), затем `npm i ts-fsrs` и `npm i -D vitest vite-plugin-pwa jsdom @testing-library/react`. Если установился TypeScript 7 и `tsc` падает, зафиксировать `typescript@^5.9`.
- [ ] **Step 2: Настроить** `vite.config.ts`: `base: './'`, плагин react, `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Аккорды', short_name: 'Аккорды', lang: 'ru', display: 'standalone', background_color: '#121010', theme_color: '#121010', icons: [...] }, workbox: { globPatterns: ['**/*.{js,css,html,svg,png,mp3,woff2}'], maximumFileSizeToCacheInBytes: 4e6 } })`, `test: { environment: 'jsdom' }`. В `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style=black-translucent`, `<html lang="ru">`, `<title>Аккорды</title>`.
- [ ] **Step 3: Токены** в `src/styles/tokens.css`: `--bg: #121010; --surface: #1d1a19; --surface-2: #272321; --text: #f3ede6; --muted: #9a918a; --accent: #f2b544; --accent-ink: #1a1200; --ok: #4ccf7a; --bad: #ef5a5a; --radius: 14px; --key-white: #f6f1ea; --key-black: #1b1817;` и `@media (prefers-color-scheme: light)` не нужен (тема только тёмная). `base.css`: reset, `body { background: var(--bg); color: var(--text); font-family: -apple-system, system-ui, sans-serif; font-variant-numeric: tabular-nums; }`, `#root { min-height: 100dvh; }`.
- [ ] **Step 4: Скопировать сэмплы** в `public/samples/` и записать `LICENSE.txt`: «Piano samples from nbrosowsky/tonejs-instruments, CC-BY 3.0; trimmed to 4 s, mono, 56 kbps».
- [ ] **Step 5: Smoke-тест** `src/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Запустить `npm test`, ожидать PASS; `npm run build`, ожидать папку `dist` с `index.html` и `samples/`.
- [ ] **Step 6: Commit** `chore: scaffold vite react app with pwa and piano samples`

### Task 2: Ноты и написание

**Files:**
- Create: `src/theory/notes.ts`
- Test: `src/theory/notes.test.ts`

**Interfaces:**
- Produces:
  - `type Midi = number` (60 = C4), `type Pc = number` (0–11)
  - `type Letter = 'C'|'D'|'E'|'F'|'G'|'A'|'B'`, `interface NoteName { letter: Letter; accidental: number }` (−2…2)
  - `const LETTER_PC: Record<Letter, Pc>`
  - `pc(midi: Midi): Pc`
  - `noteNamePc(n: NoteName): Pc`
  - `spellDegree(root: NoteName, degree: number, semitones: number): NoteName` — буква = буква корня + (degree − 1) по кругу, знак = разница полутонов (нормализованная в −6…5); если |знак| = 2 или знак стоит на белой клавише (E♯, B♯, C♭, F♭), вернуть простое имя белой клавиши (`{letter, 0}`).
  - `type NotationStyle = 'latin' | 'german'`
  - `formatNote(n: NoteName, style: NotationStyle): string` — `'D♭'`, `'F♯'`, `'C'`; в `german`: `{B,0}` → `'H'`, `{B,-1}` → `'B'`, `{B,1}` → `'H♯'`.
  - `syllable(n: NoteName): string` — `'до'`, `'ре-бемоль'`, `'фа-диез'`, `'си'`.
  - `midiName(midi: Midi, preferFlats?: boolean): NoteName` — для подписей клавиш (`61` → `{C,1}` или `{D,-1}`).
  - `MAJOR_ROOTS: NoteName[]` (индекс = pc) = C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B; `MINOR_ROOTS: NoteName[]` = C, C♯, D, E♭, E, F, F♯, G, G♯, A, B♭, B.

- [ ] **Step 1: Тесты** в `notes.test.ts`:
  - `spellDegree({C,0},3,4)` → `{E,0}`; `spellDegree({D,-1},3,4)` → `{F,0}`; `spellDegree({C,1},3,3)` → `{E,0}`; `spellDegree({E,-1},3,3)` → `{G,-1}`; `spellDegree({F,1},7,9)` → `{E,-1}` (dim7); `spellDegree({F,1},5,8)` → `{D,0}` (aug, вместо C𝄪); `spellDegree({C,0},9,14)` → `{D,0}`; `spellDegree({C,0},13,21)` → `{A,0}`; `spellDegree({E,0},5,8)` → `{C,0}` (E aug, вместо B♯); `spellDegree({B,-1},5,6)` → `{E,0}` (B♭dim, вместо F♭); `spellDegree({F,0},7,9)` → `{D,0}` (Fdim7, вместо E𝄫).
  - `formatNote({B,0},'german')` → `'H'`, `formatNote({B,-1},'german')` → `'B'`, `formatNote({B,-1},'latin')` → `'B♭'`.
  - `syllable({D,-1})` → `'ре-бемоль'`, `syllable({B,0})` → `'си'`.
  - `MAJOR_ROOTS[6]` → `{F,1}`, `MINOR_ROOTS[1]` → `{C,1}`.
- [ ] **Step 2: Запустить** `npx vitest run src/theory/notes.test.ts`, ожидать FAIL (модуль не найден).
- [ ] **Step 3: Реализовать** `src/theory/notes.ts` по интерфейсам выше.
- [ ] **Step 4: Запустить тесты**, ожидать PASS.
- [ ] **Step 5: Commit** `feat(theory): note names, spelling and display`

### Task 3: Типы аккордов и построение

**Files:**
- Create: `src/theory/chords.ts`
- Test: `src/theory/chords.test.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces:
  - `type ChordTypeId = 'maj'|'min'|'dom7'|'maj7'|'min7'|'sus2'|'sus4'|'dim'|'aug'|'add9'|'six'|'min6'|'m7b5'|'dim7'|'dom9'|'maj9'|'min9'|'dom11'|'dom13'|'7sus4'`
  - `type Level = 1|2|3|4|5|6`
  - `interface ChordType { id: ChordTypeId; symbol: string; nameRu: string; intervals: number[]; degrees: number[]; level: Level; family: 'major'|'minor'; explain: string }`
  - `const CHORD_TYPES: ChordType[]` в порядке таблицы спецификации (maj, min, dom7, maj7, min7, sus2, sus4, dim, aug, add9, six, min6, m7b5, dim7, dom9, maj9, min9, dom11, dom13, 7sus4). `degrees`: maj [1,3,5], min [1,3,5], dom7 [1,3,5,7], maj7 [1,3,5,7], min7 [1,3,5,7], sus2 [1,2,5], sus4 [1,4,5], dim [1,3,5], aug [1,3,5], add9 [1,3,5,9], six [1,3,5,6], min6 [1,3,5,6], m7b5 [1,3,5,7], dim7 [1,3,5,7], dom9 [1,3,5,7,9], maj9 [1,3,5,7,9], min9 [1,3,5,7,9], dom11 [1,5,7,9,11], dom13 [1,3,7,9,13], 7sus4 [1,4,5,7]. `family: 'minor'` у min, min7, dim, min6, m7b5, dim7, min9; остальные major. `explain` из колонки «Объяснение в уроке».
  - `chordType(id: ChordTypeId): ChordType`
  - `interface ChordSpec { root: Pc; type: ChordTypeId; inversion: number }`
  - `interface ChordVoicing { spec: ChordSpec; notes: Midi[]; pcs: Pc[]; bassPc: Pc; names: NoteName[]; rootName: NoteName; symbol: string; slash: string | null }`
  - `rootName(root: Pc, type: ChordTypeId): NoteName` — `MAJOR_ROOTS` или `MINOR_ROOTS` по family.
  - `buildChord(spec: ChordSpec, style?: NotationStyle, baseOctave = 4): ChordVoicing` — ноты в тесном расположении: корень в октаве `baseOctave` (midi 60–71), интервалы вверх; обращение n переносит n нижних нот на октаву вверх; `names` в порядке `notes`; `symbol` = `formatNote(rootName)+type.symbol` (например `'F♯m7'`, `'D♭'`, `'Cdim7'`); `slash` = `symbol + '/' + formatNote(bassNote)` когда inversion > 0, иначе null.
  - `inversionsOf(type: ChordTypeId): number` = `intervals.length` для трезвучий и септаккордов (3 или 4), `1` для add9 и типов уровня 6 (обращения не показываем).
  - `inversionLabel(n: number): string` — `'основной вид'`, `'первое обращение'`, `'второе обращение'`, `'третье обращение'`.

- [ ] **Step 1: Тесты** в `chords.test.ts`:
  - `CHORD_TYPES.length` → 20; `chordType('dom13').intervals` → `[0,4,10,14,21]`.
  - `buildChord({root:0,type:'maj',inversion:0}).notes` → `[60,64,67]`, `.symbol` → `'C'`, `.slash` → null.
  - `buildChord({root:0,type:'maj',inversion:1}).notes` → `[64,67,72]`, `.bassPc` → 4, `.slash` → `'C/E'`.
  - `buildChord({root:0,type:'maj',inversion:2}).notes` → `[67,72,76]`.
  - `buildChord({root:1,type:'maj',inversion:0}).names` → D♭ F A♭ (через `formatNote`), `.symbol` → `'D♭'`.
  - `buildChord({root:1,type:'min',inversion:0}).symbol` → `'C♯m'`, names C♯ E G♯.
  - `buildChord({root:6,type:'aug',inversion:0}).names` → F♯ A♯ D.
  - `buildChord({root:6,type:'dim7',inversion:0}).names` → F♯ A C E♭; `{root:4,type:'aug'}` → E G♯ C; `{root:10,type:'dim'}` → B♭ D♭ E.
  - `buildChord({root:0,type:'dom11',inversion:0}).notes` → `[60,67,70,74,77]`.
  - `buildChord({root:11,type:'maj',inversion:0},'german').symbol` → `'H'`; `{root:10,type:'maj'}` german → `'B'`.
  - `inversionsOf('maj')` → 3, `inversionsOf('dom7')` → 4, `inversionsOf('dom9')` → 1.
- [ ] **Step 2: Запустить**, ожидать FAIL.
- [ ] **Step 3: Реализовать** `chords.ts`.
- [ ] **Step 4: Запустить**, ожидать PASS.
- [ ] **Step 5: Commit** `feat(theory): chord types, voicings and inversions`

### Task 4: Проверка ответов

**Files:**
- Create: `src/theory/check.ts`
- Test: `src/theory/check.test.ts`

**Interfaces:**
- Consumes: `buildChord`, `pc`.
- Produces:
  - `interface BuildResult { correct: boolean; wrong: Midi[]; missing: Pc[]; bassOk: boolean }`
  - `checkBuild(pressed: Midi[], voicing: ChordVoicing): BuildResult` — `correct` когда множество классов нажатых нот равно `voicing.pcs` и класс самой низкой нажатой ноты равен `voicing.bassPc`; `wrong` = нажатые, чьего класса нет в аккорде; `missing` = классы аккорда, которых нет среди нажатых.
  - `checkSpell(selected: Pc[], voicing: ChordVoicing): boolean` — множества равны.
  - `pcsEqual(a: Pc[], b: Pc[]): boolean`.

- [ ] **Step 1: Тесты**:
  - C maj root: `[60,64,67]` → correct; `[72,64,67]` (C5 внизу нет, бас E) → `correct:false, bassOk:false, wrong:[], missing:[]`; `[48,64,67]` (C3) → correct (октава не важна); `[60,64,67,72]` → correct (дубль класса допустим).
  - Review Focus 1: `[60,72,64]` → `correct:false, missing:[7], wrong:[]`.
  - `[60,63,67]` → `wrong:[63], missing:[4]`.
  - C/E (inversion 1): `[64,67,72]` → correct; `[60,64,67]` → `bassOk:false`.
  - `checkSpell([0,4,7], Cmaj)` → true; `[0,4]` → false.
- [ ] **Step 2: FAIL. Step 3: Реализовать. Step 4: PASS.**
- [ ] **Step 5: Commit** `feat(theory): answer checking for build and spell tasks`

### Task 5: Прогрессии и тональности

**Files:**
- Create: `src/theory/progressions.ts`
- Test: `src/theory/progressions.test.ts`

**Interfaces:**
- Produces:
  - `interface Progression { id: string; title: string; numerals: string[] }`; `PROGRESSIONS`: `pop` «I–V–vi–IV» `['I','V','vi','IV']`; `pop2` «vi–IV–I–V»; `basic` «I–IV–V» `['I','IV','V','V']`; `fifties` «I–vi–IV–V»; `jazz` «ii–V–I» `['ii7','V7','Imaj7','Imaj7']`; `canon` «Канон» `['I','V','vi','iii','IV','I','IV','V']`; `blues` «Блюз 12 тактов» `['I7','I7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7']`.
  - `resolveNumeral(numeral: string, keyRoot: Pc): ChordSpec` — ступени мажорной гаммы: I/ii/iii/IV/V/vi/vii° → maj/min/min/maj/maj/min/dim; суффикс `7` у заглавных → dom7, у строчных → min7; `maj7` → maj7; inversion 0.
  - `progressionChords(p: Progression, keyRoot: Pc): ChordSpec[]`
  - `KEYS: Pc[]` = `[0,7,5,2,10,9,4,3,8,11,1,6]`
  - `keyIsRecommended(p: Progression, keyRoot: Pc, introduced: (id: string) => boolean): boolean` — все аккорды прогрессии (в основном виде) введены.
  - `keyName(keyRoot: Pc, style: NotationStyle): string` — по `MAJOR_ROOTS`.

- [ ] **Step 1: Тесты**: `resolveNumeral('vi',0)` → `{root:9,type:'min',inversion:0}`; `resolveNumeral('V7',0)` → `{root:7,type:'dom7'}`; `resolveNumeral('ii7',0)` → `{root:2,type:'min7'}`; `resolveNumeral('Imaj7',5)` → `{root:5,type:'maj7'}`; `progressionChords(pop, 7)` → корни `[7,2,4,0]`; `keyIsRecommended(pop,0, id=>['0:maj:0','7:maj:0','9:min:0','5:maj:0'].includes(id))` → true, без `5:maj:0` → false.
- [ ] **Step 2–4: FAIL → реализовать → PASS.** (Для id карточки использовать формат `${root}:${type}:${inversion}`, тот же, что в Task 6; вынести `cardId`/`parseCardId` в `src/theory/chords.ts`, чтобы не было циклического импорта.)
- [ ] **Step 5: Commit** `feat(theory): progressions and key resolution`

### Task 6: Curriculum

**Files:**
- Create: `src/learning/curriculum.ts`
- Test: `src/learning/curriculum.test.ts`

**Interfaces:**
- Consumes: `cardId`, `CHORD_TYPES`, `MAJOR_ROOTS/MINOR_ROOTS`.
- Produces:
  - `type CardId = string`
  - `interface CurriculumEntry { id: CardId; level: Level }`
  - `CURRICULUM: CurriculumEntry[]` (288) в порядке спецификации:
    - L1: C, G, Am, F, Dm, Em.
    - L2: D, E, A, Cm, Fm, Gm, D♭, E♭, A♭, C♯m, F♯m, G♯m, B♭, B♭m, B, Bm, F♯, E♭m.
    - L3: для каждого из 24 трезвучий в порядке L1+L2: inversion 1, затем inversion 2.
    - L4: G7, Cmaj7, Dm7; dom7 по `MAJOR_ORDER` без G; maj7 по `MAJOR_ORDER` без C; min7 по `MINOR_ORDER` без D. Где `MAJOR_ORDER = [0,7,5,2,4,9,1,3,8,10,11,6]`, `MINOR_ORDER = [9,2,4,0,5,7,1,6,8,10,11,3]`.
    - L5: типы sus4, sus2, dim, aug, six, min6, add9, m7b5, dim7; корни по `MAJOR_ORDER` для major-family, по `MINOR_ORDER` для minor-family.
    - L6: dom9, maj9, min9, 7sus4, dom11, dom13, корни так же.
  - `LEVELS: { level: Level; title: string; blurb: string }[]` — «Белые клавиши», «Все 24», «Обращения», «Септаккорды», «Краски», «Джаз».
  - `levelOf(id: CardId): Level`, `indexOf(id: CardId): number`, `cardsOfLevel(level): CardId[]`.

- [ ] **Step 1: Тесты**: `CURRICULUM.length` → 288; первые шесть id → `['0:maj:0','7:maj:0','9:min:0','5:maj:0','2:min:0','4:min:0']`; `CURRICULUM[24].id` → `'0:maj:1'`, `CURRICULUM[25].id` → `'0:maj:2'`; `cardsOfLevel(4)[0]` → `'7:dom7:0'`, `cardsOfLevel(4).length` → 36; `cardsOfLevel(5).length` → 108; `cardsOfLevel(6).length` → 72; все id уникальны; `levelOf('0:sus4:0')` → 5.
- [ ] **Step 2–4: FAIL → реализовать → PASS.**
- [ ] **Step 5: Commit** `feat(learning): curriculum order and levels`

### Task 7: Расписание FSRS и мастерство

**Files:**
- Create: `src/learning/scheduler.ts`
- Test: `src/learning/scheduler.test.ts`

**Interfaces:**
- Consumes: `ts-fsrs` (`fsrs`, `createEmptyCard`, `Rating`, `State`, тип `Card`).
- Produces:
  - `type TaskType = 'build'|'recognize'|'spell'|'ear'`
  - `interface AnswerResult { correct: boolean; usedHint: boolean; seconds: number }`
  - `TIME_THRESHOLDS: Record<TaskType, number>` = build 8, recognize 6, spell 8, ear 5.
  - `ratingFor(task: TaskType, r: AnswerResult, optionCount = 4): Rating` — wrong → Again; correct+hint → Hard; correct и `seconds < threshold/3` → Easy; иначе Good. Для `task === 'ear'` при `optionCount <= 2` Easy понижается до Good.
  - `interface StoredCard { due: number; stability: number; difficulty: number; elapsedDays: number; scheduledDays: number; learningSteps: number; reps: number; lapses: number; state: number; lastReview: number | null }` (числа в мс, сериализуемо).
  - `newStoredCard(now: number): StoredCard`
  - `reviewCard(card: StoredCard, rating: Rating, now: number): StoredCard` — через `fsrs().next(...)`.
  - `isDue(card: StoredCard, now: number): boolean`
  - `type Mastery = 0|1|2|3|4`; `mastery(card: StoredCard | undefined): Mastery` — undefined или reps 0 → 0; stability < 2 → 1; < 10 → 2; < 30 → 3; иначе 4.
  - `MASTERY_LABELS: string[]` = «новый», «учится», «знаю», «уверенно», «выучено».

- [ ] **Step 1: Тесты**: `ratingFor('build',{correct:false,usedHint:false,seconds:1})` → Again; `{correct:true,usedHint:true,seconds:1}` → Hard; `{correct:true,usedHint:false,seconds:2}` → Easy; `{correct:true,usedHint:false,seconds:5}` → Good; `ratingFor('ear',{correct:true,usedHint:false,seconds:1.5})` → Easy; то же с `optionCount` 2 → Good. `newStoredCard(t).due` → t, `isDue` → true. После `reviewCard(c, Good, t)` → `reps` 1, `due > t`, `isDue(.., t)` false, `isDue(.., due)` true. Три раза Good с шагом в `scheduledDays` дней → `stability` растёт. `mastery(undefined)` → 0; карточка со stability 15 и reps 3 → 3.
- [ ] **Step 2–4: FAIL → реализовать → PASS.** Проверить точные имена полей `Card` в `node_modules/ts-fsrs` перед реализацией конвертеров.
- [ ] **Step 5: Commit** `feat(learning): fsrs scheduling and mastery levels`

### Task 8: Прогресс, настройки, reducer

**Files:**
- Create: `src/state/progress.ts`, `src/state/reducer.ts`, `src/state/store.tsx`
- Test: `src/state/progress.test.ts`, `src/state/reducer.test.ts`

**Interfaces:**
- Consumes: Task 7.
- Produces:
  - `interface Settings { notation: NotationStyle; syllables: boolean; newPerDay: number; maxReviews: number; volume: number; autoCheck: boolean }`; `DEFAULT_SETTINGS` = latin, false, 3, 20, 0.8, true.
  - `interface DayStats { reviews: number; newCards: number; correct: number; sessionDone: boolean }`
  - `interface Progress { version: 1; cards: Record<CardId, StoredCard>; introduced: Record<CardId, number>; lessonsSeen: Level[]; days: Record<string, DayStats>; streak: number; lastSessionDay: string | null; settings: Settings }`
  - `createProgress(): Progress`; `STORAGE_KEY = 'piano-chords:v1'`
  - `dayKey(now: number): string` — местная дата `YYYY-MM-DD`.
  - `loadProgress(storage: Pick<Storage,'getItem'>): Progress` (битое → `createProgress()`); `saveProgress(storage, p)`.
  - `exportProgress(p): string`; `importProgress(json: string): Progress` — бросает `Error('Файл не похож на экспорт этого приложения')`, если нет `version === 1` и объектов `cards`, `settings`.
  - `type Action = { type: 'answer'; id: CardId; task: TaskType; result: AnswerResult; isNew: boolean; now: number } | { type: 'lessonSeen'; level: Level } | { type: 'sessionDone'; now: number } | { type: 'settings'; patch: Partial<Settings> } | { type: 'import'; progress: Progress } | { type: 'reset' }`
  - `reducer(p: Progress, a: Action): Progress` — `answer`: карточка создаётся при отсутствии, `introduced[id] = now` если isNew, `reviewCard` с `ratingFor`, статистика дня (`reviews`+1 или `newCards`+1, `correct`+1 если верно). `sessionDone`: `days[today].sessionDone = true`; стрик: если `lastSessionDay` = вчера → +1, = сегодня → без изменений, иначе 1; `lastSessionDay = today`.
  - `ProgressProvider`, `useProgress(): { progress: Progress; dispatch: (a: Action) => void }` — сохраняет в localStorage при каждом изменении.

- [ ] **Step 1: Тесты** `progress.test.ts`: `loadProgress({getItem: () => 'garbage'})` → равен `createProgress()`; `importProgress('{"foo":1}')` бросает; round-trip `importProgress(exportProgress(p))` равен p; `dayKey` для `new Date(2026,0,5,23,59)` → `'2026-01-05'`.
  `reducer.test.ts`: после `answer` новой карточки → `introduced[id]` задан, `cards[id].reps` 1, `days[today].newCards` 1; `sessionDone` два дня подряд (23:59 и 00:01 следующего дня) → `streak` 2; `sessionDone` дважды в один день → streak 1; пропуск дня → streak 1; `reset` → `createProgress()` с сохранением settings.
- [ ] **Step 2–4: FAIL → реализовать → PASS.**
- [ ] **Step 5: Commit** `feat(state): progress model, persistence and reducer`

### Task 9: Сборка сессии и варианты ответов

**Files:**
- Create: `src/learning/session.ts`, `src/learning/distractors.ts`
- Test: `src/learning/session.test.ts`, `src/learning/distractors.test.ts`

**Interfaces:**
- Consumes: Tasks 5–8.
- Produces:
  - `type SessionItem = { kind: 'lesson'; level: Level } | { kind: 'card'; id: CardId; task: TaskType; isNew: boolean } | { kind: 'progression'; progressionId: string; keyRoot: Pc }`
  - `EAR_TYPES: ChordTypeId[]` = maj, min, dom7, maj7, min7, dim, aug, sus4.
  - `availableTasks(spec: ChordSpec): TaskType[]` — build, recognize, spell всегда; ear только если `inversion === 0` и тип в `EAR_TYPES`.
  - `learnerLevel(p: Progress): Level` — наибольший уровень среди введённых карточек, минимум 1.
  - `earChoices(level: Level): ChordTypeId[]` — L1–3 `['maj','min']`; L4 + `dom7, maj7, min7`; L5–6 + `dim, aug, sus4`.
  - `earOptions(spec: ChordSpec, level: Level, rng): ChordTypeId[]` — тип карточки плюс остальные из `earChoices(level)` без него, не больше 6 всего, перемешаны.
  - `pickTask(isNew: boolean, spec: ChordSpec, rng: () => number, counter: number): TaskType` — new → build; иначе если `rng() < 0.5` → build, иначе по кругу среди `availableTasks(spec)` без build по `counter`.
  - `sessionCounts(p: Progress, now: number): { due: number; newAvailable: number }` — due = карточки с `isDue`, не больше `maxReviews`; newAvailable = `max(0, newPerDay − введённых сегодня)`, но не больше оставшихся в curriculum.
  - `buildSession(p: Progress, now: number, rng: () => number): SessionItem[]` — повторения по возрастанию `due` (лимит), затем новые по curriculum (лимит), с `lesson` перед первой новой карточкой уровня, которого нет в `lessonsSeen`; в конце `progression`, если есть прогрессия с рекомендуемой тональностью (выбор случайный через rng; предпочитать `pop`).
  - `buildPracticeSession(id: CardId, rng): SessionItem[]` — 5 карточек одного аккорда с задачами build, recognize, spell, build, recognize.
  - `recognizeOptions(spec: ChordSpec, rng): ChordSpec[]` — 4 варианта: верный; тот же корень, другой тип того же уровня или ниже; другой корень, тот же тип; случайный (корень и тип ≤ уровню), все без повторов, перемешаны.

- [ ] **Step 1: Тесты** `session.test.ts`: пустой прогресс, rng=0 → `[lesson 1, card '0:maj:0' build new, card '7:maj:0' build new, card '9:min:0' build new]` без прогрессии (F не введён); прогресс с 4 введёнными C G Am F и всеми due → первые 4 элемента это карточки-повторы, последний элемент `progression pop` в тональности 0; `sessionCounts` при 3 введённых сегодня → newAvailable 0; `maxReviews` 2 и 5 due → 2 повтора. `pickTask(true, …)` → build; `pickTask(false, Cmaj, () => 0.9, 1)` → spell; `availableTasks({root:0,type:'maj',inversion:1})` не содержит ear; `learnerLevel` с введённой `'0:sus4:0'` → 5.
  `distractors.test.ts`: `recognizeOptions(Cmaj)` → 4 уникальных, содержит Cmaj; `earChoices(4)` → 5 типов; `earOptions(Csus2, 1, rng)` → содержит `sus2`, длина 3; `earOptions(Cmaj, 6, rng).length` → 6.
- [ ] **Step 2–4: FAIL → реализовать → PASS.**
- [ ] **Step 5: Commit** `feat(learning): session builder and answer options`

### Task 10: Тексты уроков

**Files:**
- Create: `src/learning/lessons.ts`
- Test: `src/learning/lessons.test.ts`

**Interfaces:**
- Produces: `type Demo = { kind: 'findNote'; pc: Pc } | { kind: 'showChord'; spec: ChordSpec } | { kind: 'compare'; a: ChordSpec; b: ChordSpec } | { kind: 'none' }`; `interface LessonPage { title: string; text: string; demo: Demo }`; `LESSONS: Record<Level, LessonPage[]>` — по 2–4 страницы, каждая 2–4 предложения, по спецификации (L1: группы чёрных клавиш и C; F; формула мажора 4+3 с показом C; минор 3+4 с сравнением C и Cm. L2: формы по чёрным клавишам, показ D. L3: те же ноты в другом порядке, C и C/E; запись через дробь «аккорд / нижняя нота»; переход C→F/C. L4: септима ниже октавы, G7; maj7 и m7 сравнение. L5: «изменяем или добавляем одну ноту», sus4 vs maj. L6: нона и дальше, C9; 13 без квинты).
- [ ] **Step 1: Тест**: у каждого уровня 1–6 от 2 до 4 страниц, у каждой непустые `title`/`text`, текст короче 400 символов.
- [ ] **Step 2–4. Step 5: Commit** `feat(learning): level intro lessons`

### Task 11: Звук: сэмплер и метроном

**Files:**
- Create: `src/audio/context.ts`, `src/audio/sampler.ts`, `src/audio/metronome.ts`
- Test: `src/audio/sampler.test.ts`, `src/audio/metronome.test.ts`

**Interfaces:**
- Produces:
  - `getAudioContext(): AudioContext` — создаёт один раз, вызывает `resume()` если `suspended`.
  - `unlockAudio(): void` — один раз создаёт `<audio loop>` с коротким беззвучным wav в data-URI и вызывает `play()` (приём «unmute» для беззвучного режима iOS); ошибки глотает.
  - `sampleFor(midi: Midi): { file: string; rate: number }` — файлы `C2`…`C7` (midi 36–96) каждый полутон, имена `C4`, `Cs4`; вне диапазона ближайший край с `rate = 2^((midi − sampleMidi)/12)`.
  - `interface Piano { load(onProgress?: (done: number, total: number) => void): Promise<void>; readonly ready: boolean; readonly failed: boolean; noteOn(midi: Midi, velocity?: number): void; noteOff(midi: Midi): void; playChord(midis: Midi[], seconds?: number): void; playArpeggio(midis: Midi[], gap?: number, seconds?: number): void; stopAll(): void; setVolume(v: number): void }`
  - `createPiano(ctx: AudioContext, baseUrl: string, fetchImpl?: typeof fetch): Piano` — буферы через `fetch` + `decodeAudioData`; voice = `AudioBufferSourceNode` → `GainNode` → master; `noteOff` делает экспоненциальное затухание 0.25 с; если `load` не смог загрузить ≥ половины файлов, `failed = true`, а `noteOn` играет запасной синтез (два осциллятора triangle+sine с огибающей 1.2 с).
  - `interface Metronome { start(bpm: number, beatsPerBar: number, onBeat: (beat: number, bar: number, when: number) => void): void; stop(): void; readonly running: boolean }`
  - `createMetronome(ctx: AudioContext, scheduler?: { setInterval, clearInterval }): Metronome` — lookahead 25 мс, горизонт 120 мс, клик: осциллятор 1000 Гц 40 мс, акцент 1500 Гц на `beat === 0`; `onBeat` вызывается при планировании.
  - `scheduleBeats(nextBeatTime: number, horizon: number, secondsPerBeat: number): number[]` — чистая функция, возвращает времена долей в окне (для теста).

- [ ] **Step 1: Тесты**: `sampleFor(60)` → `{file:'C4', rate:1}`; `sampleFor(61).file` → `'Cs4'`; `sampleFor(30)` → `{file:'C2', rate: 2^(-6/12)}`; `sampleFor(100).file` → `'C7'`. `createPiano` с `fetchImpl`, который всегда отвергает: после `load()` → `failed` true, `ready` false, `noteOn(60)` не бросает (AudioContext замокать минимально: `createGain`, `createOscillator`, `createBufferSource`, `decodeAudioData`, `currentTime`, `destination`). `scheduleBeats(1.0, 0.12, 0.5)` → `[1.0]`; `scheduleBeats(1.0, 0.6, 0.5)` → `[1.0, 1.5]`.
- [ ] **Step 2–4: FAIL → реализовать → PASS.**
- [ ] **Step 5: Ручная проверка** в браузере через временную кнопку в `App.tsx`: аккорд звучит как рояль, метроном ровный. Убрать кнопку.
- [ ] **Step 6: Commit** `feat(audio): sampled piano and metronome`

### Task 12: Клавиатура

**Files:**
- Create: `src/components/Keyboard.tsx`, `src/components/keyboard.css`, `src/components/keyboardLayout.ts`
- Test: `src/components/keyboardLayout.test.ts`

**Interfaces:**
- Produces:
  - `keyboardLayout(lowMidi: Midi, octaves: number): { whites: { midi: Midi; index: number }[]; blacks: { midi: Midi; leftWhites: number }[] }` — `leftWhites` = число белых клавиш слева (чёрная рисуется по центру границы: `left = leftWhites * whiteWidth − blackWidth/2`).
  - `type KeyMark = 'selected' | 'correct' | 'wrong' | 'hint' | 'target'`
  - `interface KeyboardProps { mode: 'toggle' | 'momentary' | 'display'; selected?: Midi[]; marks?: Partial<Record<Midi, KeyMark>>; labels?: 'none' | 'letters' | 'syllables'; notation?: NotationStyle; disabled?: boolean; onToggle?(midi: Midi): void; onNoteOn?(midi: Midi, time: number): void; onNoteOff?(midi: Midi): void; shortcuts?: boolean }` (при `shortcuts` клавиши QWERTY `a w s e d f t g y h u j k o l p ;` = midi 60…76, `keydown` без повтора → down, `keyup` → up)
  - `Keyboard` — две октавы от 60; pointer events (`onPointerDown`/`Up`/`Cancel`/`Leave` на каждой клавише, `touch-action: none`, `user-select: none`); в `toggle` каждый pointerdown вызывает `onToggle` и `onNoteOn` + `onNoteOff` через 400 мс (чтобы звучало); в `momentary` down → `onNoteOn`, up → `onNoteOff`; `display` не реагирует. Подписи: буква в нижней части белых клавиш (и на чёрных мелко) при `labels !== 'none'`. Белая клавиша `flex: 1`, высота контейнера `clamp(150px, 24dvh, 220px)`, чёрная 60 % высоты и 58 % ширины белой. Лёгкая вибрация `navigator.vibrate?.(8)` на down.

- [ ] **Step 1: Тест**: `keyboardLayout(60, 2).whites.length` → 14; `.blacks.length` → 10; первая чёрная `{midi:61, leftWhites:1}`; чёрная для midi 66 → `leftWhites: 4`; нет чёрной с `leftWhites` 3 или 7.
- [ ] **Step 2–4: FAIL → реализовать → PASS.**
- [ ] **Step 5: Ручная проверка** на мобильном вьюпорте (375×812): клавиши видны целиком, два одновременных касания в `momentary` звучат.
- [ ] **Step 6: Commit** `feat(ui): touch piano keyboard`

### Task 13: Каркас приложения, навигация, общие компоненты

**Files:**
- Create: `src/router.ts`, `src/components/TabBar.tsx`, `src/components/Button.tsx`, `src/components/ProgressRing.tsx`, `src/components/ChordTitle.tsx`, `src/components/Sheet.tsx`, `src/audio/useAudio.tsx`, `src/styles/components.css`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Produces:
  - `type Route = { name: 'today' } | { name: 'map' } | { name: 'progressions' } | { name: 'reference' } | { name: 'settings' } | { name: 'session'; practice?: CardId } | { name: 'chord'; id: CardId }`; `parseRoute(hash: string): Route`; `routeHash(r: Route): string`; `useRoute(): [Route, (r: Route) => void]` (hashchange).
  - `AudioProvider`/`useAudio(): { piano: Piano | null; metronome: Metronome | null; ensure(): Promise<void>; loading: boolean; progress: number }` — `ensure()` вызывается из обработчиков кликов; создаёт контекст, пиано, грузит сэмплы один раз.
  - `TabBar` с четырьмя вкладками (иконки inline-SVG, подписи «Сегодня», «Карта», «Прогрессии», «Справочник»), `padding-bottom: env(safe-area-inset-bottom)`.
  - `ChordTitle({ spec, notation, size })` — крупный символ; обращение подписью снизу.
  - `Button({ variant: 'primary'|'secondary'|'ghost', size, ... })`, `ProgressRing({ value, size })`, `Sheet` (модальный лист снизу).
  - `App` рендерит провайдеры, экран по маршруту и `TabBar` (скрыт на `session`).

- [ ] **Step 1: Тест** `src/router.test.ts`: `parseRoute('#chord/0:maj:0')` → `{name:'chord', id:'0:maj:0'}`; `parseRoute('')` → today; `routeHash({name:'session', practice:'0:maj:0'})` → `'#session/0:maj:0'`.
- [ ] **Step 2–4: FAIL → реализовать → PASS.** Экраны пока заглушки с заголовками.
- [ ] **Step 5: Commit** `feat(app): routing, audio provider and shared components`

### Task 14: Упражнения и сессия

**Files:**
- Create: `src/screens/Session.tsx`, `src/screens/exercises/BuildTask.tsx`, `RecognizeTask.tsx`, `SpellTask.tsx`, `EarTask.tsx`, `LessonPages.tsx`, `ProgressionDrill.tsx` (заглушка до Task 17: кнопка «Пропустить»), `Summary.tsx`, `src/screens/session.css`
- Test: `src/screens/exercises/taskState.test.ts` (чистая логика состояния задачи)

**Interfaces:**
- Consumes: Tasks 4, 9, 11, 12, 13.
- Produces:
  - `src/screens/exercises/taskState.ts`: `buildTaskReducer(state, event)` где `state = { selected: Midi[]; phase: 'answering'|'correct'|'wrong'; usedHint: boolean; startedAt: number }`, события `toggle(midi)`, `hint`, `check(voicing, now)`, `reset`; при `toggle` и `selected.length === voicing.notes.length` и autoCheck → `check` автоматически (это решает компонент, reducer принимает `check`). Результат → `AnswerResult` через `finishResult(state, now): AnswerResult`.
  - `Session({ practice?: CardId })` — строит элементы (`buildSession` или `buildPracticeSession`), ведёт индекс, показывает прогресс-полосу и крестик; на ответ диспатчит `answer` (в practice не диспатчит); при ошибке добавляет ту же карточку в конец сессии один раз (перед элементом `progression`); `lesson` → `LessonPages` → `lessonSeen`; `sessionDone` диспатчится, когда отвечена последняя карточка (до прогрессии, не в practice); затем `ProgressionDrill` (если есть) с «Пропустить» и `Summary` (верно/всего, список аккордов с ошибкой, кнопка «На сегодня»).
  - Каждый `*Task` получает `{ spec, voicing, level, notation, syllables, autoCheck, piano, onDone(result: AnswerResult) }`.
  - `BuildTask`: `ChordTitle`, клавиатура `toggle`, подсказка (показывает `voicing.names` и `type.explain`, ставит `marks: hint`), при верном: marks correct + `playChord` + авто-переход через 700 мс; при ошибке: marks wrong/target + `playChord(voicing.notes)` + кнопка «Дальше».
  - `RecognizeTask`: клавиатура `display` с marks target, кнопка «Послушать», 4 кнопки `recognizeOptions`; подписи вариантов через `buildChord(...).slash ?? symbol`.
  - `SpellTask`: `ChordTitle`, 12 кнопок нот (подписи по notation, корни для подписи по family аккорда), автопроверка по количеству, зелёные/красные чипы.
  - `EarTask`: играет `voicing.notes` карточки при монтировании (после `ensure()`) и по кнопке «Послушать ещё раз»; кнопки `earOptions(spec, learnerLevel, rng)` с русскими названиями (`nameRu`); в `onDone` передаёт `optionCount` для `ratingFor`.
- [ ] **Step 1: Тест** `taskState.test.ts`: toggle добавляет/убирает; `check` с верным набором → phase correct; `hint` → usedHint true; `finishResult` считает секунды от `startedAt`.
- [ ] **Step 2–4: FAIL → реализовать → PASS.**
- [ ] **Step 5: Ручная проверка**: пройти сессию из урока и трёх новых карточек на мобильном вьюпорте; после закрытия и повторного открытия «Сегодня» показывает «новых 0».
- [ ] **Step 6: Commit** `feat(session): exercises, lessons and session runner`

### Task 15: Экраны «Сегодня» и «Настройки»

**Files:**
- Create: `src/screens/Today.tsx`, `src/screens/Settings.tsx`, `src/screens/today.css`

- [ ] **Step 1: Today**: стрик («🔥 N дней» без эмодзи-зависимости: иконка SVG), `ProgressRing` выполнения цели (sessionDone сегодня), уровень и подпись «Следующий: D» (первая не введённая карточка), кнопка «Начать сессию» с подписью «повторить N · новых M» (из `sessionCounts`); если и то и то 0 → «Дополнительно: 3 новых» (временно повышает лимит через параметр `extraNew` в маршруте `#session?extra=3`); при загрузке звука прогресс «Загружаю рояль… 40 %». Шестерёнка → `#settings`.
- [ ] **Step 2: Settings**: переключатели по спецификации; экспорт (скачать `piano-chords-YYYY-MM-DD.json` через `Blob` + `<a download>`), импорт (`<input type=file>`, ошибка в тексте), сброс с `confirm`, блок «О звуке» с атрибуцией сэмплов.
- [ ] **Step 3: Ручная проверка** на 375×812: всё помещается, кнопка начала сессии в зоне большого пальца.
- [ ] **Step 4: Commit** `feat(screens): today and settings`

### Task 16: Карта, справочник, карточка аккорда

**Files:**
- Create: `src/screens/Map.tsx`, `src/screens/Reference.tsx`, `src/screens/ChordDetail.tsx`, `src/screens/map.css`

- [ ] **Step 1: Map**: полоски прогресса по уровням (доля карточек уровня с mastery ≥ 2); сетка: строки 12 корней (подпись по `MAJOR_ROOTS`), столбцы `CHORD_TYPES` сгруппированы по уровню с заголовками; клетка показывает `type.symbol`, фон по mastery (`--m0`…`--m4`: прозрачный, тёмно-янтарный, янтарный 50 %, янтарный, зелёный), не введённые клетки с пунктирной рамкой; для maj/min/dom7/maj7/min7 внизу клетки точки обращений. Горизонтальный скролл сетки, фиксированный первый столбец. Тап → `#chord/<id>`.
- [ ] **Step 2: ChordDetail**: `ChordTitle`, клавиатура `display` с marks target, переключатель обращений (сегментированный контрол по `inversionsOf`), ноты (`names` + слоги при включённой настройке), формула («4 + 3 полутона» для триад, иначе `explain`), кнопки «Аккорд» и «Арпеджио», мастерство, кнопка «Потренировать» → `#session/<id>`, кнопка назад.
- [ ] **Step 3: Reference**: чипы корней (12) и типов (20), список подходящих аккордов карточками (символ, ноты, мастерство), тап → ChordDetail.
- [ ] **Step 4: Ручная проверка** на мобильном вьюпорте.
- [ ] **Step 5: Commit** `feat(screens): mastery map, reference and chord detail`

### Task 17: Прогрессии

**Files:**
- Create: `src/screens/Progressions.tsx`, `src/learning/strikes.ts`, `src/screens/progressions.css`
- Modify: `src/screens/exercises/ProgressionDrill.tsx`
- Test: `src/learning/strikes.test.ts`

**Interfaces:**
- Produces:
  - `createStrikeDetector(windowMs = 250, minNotes = 3): { noteOn(midi: Midi, timeMs: number): { midis: Midi[]; timeMs: number } | null; reset(): void }` — копит ноты; когда в окне от первой ноты набралось `minNotes`, возвращает удар (время = время первой ноты) и начинает новый; ноты старше окна отбрасываются.
  - `evaluateBar(strike: { midis: Midi[]; timeMs: number }, target: ChordVoicing, barStartMs: number, beatMs: number): { hit: boolean; offsetMs: number }` — hit = `pcsEqual(pcs(strike), target.pcs)`; offset = сдвиг от ближайшей доли.
  - `Progressions` экран: список прогрессий, выбор тональности (чипы `KEYS`, рекомендуемые выделены, остальные с пометкой «ещё не изучено»), темп (слайдер 50–140), режимы «Слушать» и «Играть», крупно текущий и следующий аккорд, индикатор долей (4 точки), клавиатура (`display` в Слушать, `momentary` в Играть). В «Слушать» на первой доле такта `playChord` аккорда такта. В «Играть» удары через детектор, счёт попаданий; по окончании 2 кругов — итог «попаданий X из Y, средний сдвиг Z мс».
  - `ProgressionDrill` в сессии: та же логика на 8 тактов (2 круга по 4 или 1 круг канона/блюза), с кнопкой «Пропустить».
- [ ] **Step 1: Тесты** `strikes.test.ts`: три ноты за 100 мс → удар с тремя нотами; две ноты → null; ноты через 400 мс не склеиваются; `evaluateBar` с верными классами в 20 мс от доли → `{hit:true, offsetMs:20}`; с неверными → hit false.
- [ ] **Step 2–4: FAIL → реализовать → PASS.**
- [ ] **Step 5: Ручная проверка**: метроном не плывёт 1 минуту, подсветка аккорда совпадает со звуком.
- [ ] **Step 6: Commit** `feat(progressions): metronome player and play-along drill`

### Task 18: Иконка, README, сборка, проверка на телефонном экране, публикация

**Files:**
- Create: `public/icons/icon.svg`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`
- Modify: `index.html` (apple-touch-icon), `README.md`

- [ ] **Step 1: Иконка**: SVG с тремя клавишами и янтарным кругом; PNG через `qlmanage -t -s 512 -o` или `magick`, если есть; иначе через скрипт на Node с `canvas` не ставить: оставить SVG и сгенерировать PNG в браузере вручную (canvas → toDataURL) через временную страницу.
- [ ] **Step 2: README**: что это, как запустить (`npm i && npm run dev`), как собрать, как поставить на айфон (Safari → Поделиться → На экран «Домой»), лицензия сэмплов.
- [ ] **Step 3: `npm run typecheck && npm test && npm run build`** — всё зелёное.
- [ ] **Step 4: Проверка в браузере** (`preview_start`, мобильный вьюпорт 375×812): пройти сессию, карту, прогрессии, справочник, настройки; консоль без ошибок.
- [ ] **Step 5: Публикация** сборки `dist/` как Artifact (страница `dist/index.html`, файлы `assets/*`, `samples/*`, `icons/*`, `manifest.webmanifest`, `sw.js`, `workbox-*.js`), чтобы открыть на телефоне.
- [ ] **Step 6: Commit** `chore: icons, readme and release build`
