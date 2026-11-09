# quizrush
Quizrush is a timed, team-based classroom quiz app. Built with Vue 3 and hosted on GitHub Pages, it uses JSON questions, random draws, instant explanations, and a live leaderboard.

One teacher runs it on one interactive touch board (or a projector) for up to 30 individual players or 1–5 teams. Everything happens in the browser: there is no backend, no accounts, and nothing is saved. Reloading the page starts a fresh game. Class lists can optionally be read from a Google spreadsheet, read-only (see [Google classes](#google-classes)).

## Run it locally

Requires Node 22.12 or newer (see `.nvmrc`).

```sh
npm ci
npm run dev        # development server at http://localhost:5173
npm run check      # type-check + lint + unit tests
npm run build      # production build into dist/
npm run preview    # serve the production build at http://localhost:4173
```

## Editing the questions

Each quiz is one JSON file in [`public/contests/`](public/contests/). Edit or add a file, commit, and push to `main`; the site redeploys automatically.

- The home page (`https://quizrush.raghadalsaka.com/`) shows one button per quiz, grouped under its `category`. Categories are sorted by name and the quizzes inside each by title.
- Each quiz has its own address made from its `slug`: `https://quizrush.raghadalsaka.com/<slug>/`. Share that link to open a quiz directly.
- To add a quiz, copy an existing file, give it a new `slug`, `title` and `category`, and replace the questions. The file name doesn't matter; the slug does.
- The setup screen has an **All Quizzes** button that goes back to the home page. It isn't shown during a game.

```json
{
  "title": "Classroom Challenge",
  "slug": "classroom-challenge",
  "category": "Midterm",
  "settings": {
    "secondsPerQuestion": 60,
    "defaultQuestionsPerTeam": 5,
    "allowCrossTeamRepeats": false
  },
  "questions": [
    {
      "id": "present-perfect-01",
      "prompt": "Which sentence uses the present perfect correctly?",
      "options": ["She have finished her book.", "She has finished her book.", "She has finish her book.", "She finished has her book."],
      "correctIndex": 1,
      "explanation": "Use has with she, followed by the past participle finished."
    }
  ]
}
```

| Field | Rule |
| --- | --- |
| `title` | Non-blank text. Shown on the home page button and the setup screen. |
| `slug` | The quiz's address: lowercase letters and digits joined by single hyphens, such as `present-perfect`. Unique across all quizzes; `assets` and `contests` are reserved. Changing it breaks links already shared. |
| `category` | Non-blank text. The heading the quiz appears under on the home page. Quizzes with exactly the same text share a heading, and a new text creates a new heading. |
| `settings.secondsPerQuestion` | Whole number, 1–600. The default timer on the setup screen. |
| `settings.defaultQuestionsPerTeam` | Whole number, 1–50. The default turn count on the setup screen. |
| `settings.allowCrossTeamRepeats` | `true` or `false` (no quotes). See the repeat rules below. |
| `questions[].id` | Non-blank and unique. Keep ids stable when editing. |
| `questions[].prompt` | Non-blank text. Line breaks (`\n`) are kept, so a prompt can carry a notice, list or short passage; prompts over 160 characters are shown smaller. |
| `questions[].options` | Exactly four non-blank answers. |
| `questions[].correctIndex` | `0`–`3`: the position of the right answer (`0` is the first option). |
| `questions[].explanation` | Non-blank text, shown after every answer or timeout. |

The build and the CI tests validate every file in `public/contests/` and reject duplicate slugs, so a file that breaks any rule is never deployed. A quiz needs at least one question; the setup screen only allows team and question counts that fit it. An address that matches no quiz shows a "couldn't be found" page with a link to the home page. If the quiz still can't load (for example, no internet), players see a plain "couldn't be loaded" message with a **Try again** button, and the technical details go to the browser console (F12 → Console). The app never starts with broken data. The JSON is public, so anyone can read the answers.

How many questions you need:

- **Repeats off** (`false`): at least *teams × questions per team* (or *players × questions per player*). For example, 3 teams × 5 questions needs 15, and 30 players × 1 question needs 30.
- **Repeats on** (`true`): at least *questions per team*. For example, 3 teams × 5 questions can run with 5.

If there aren't enough, the setup screen says so and keeps **Start Game** disabled. Spare questions let teachers use **Different Card** more often.

## Game rules

- The setup screen starts in **Individual Players** mode every time a quiz is opened. Type up to 30 names, one per line; turns follow that order and each player gets one question unless the teacher changes it. **Teams** mode is the 1–5 team setup. When Google is set up, a whole class can be loaded instead of typing names (see [Google classes](#google-classes)).
- Every player or team gets an emoji, picked beside its name or left on the one it was given. The emoji is shown next to the name on the turn heading, the scoreboard and the final results.
- Players or teams play in the order they were entered, one question per turn, and everyone gets the same number of turns. Everyone has a turn before the next round starts.
- **Start** draws a random question and flips the card. The timer starts once the answers can be clicked.
- The first answer (mouse or keys 1–4) locks the question. A correct answer earns exactly 1 point. A wrong answer or a timeout earns 0. The correct answer and the explanation stay visible until the teacher presses **Next Team: <name of the next team>**. With one team it reads **Next Question**, and after the last turn **See Results**.
- The timer uses a real-time deadline, so a hidden or throttled tab never gets extra time.
- **Pause** (in the teacher controls, while a question is open) stops the timer and locks the answers. The question stays on screen. **Continue** resumes with the time that was left, or the teacher can press **Different Card** instead.
- **Different Card** (in the teacher controls, while a question is open) asks for confirmation, then sets the question aside and draws another one with a fresh timer. The turn and score don't change.
- On screens narrower than 1024px (phones and small tablets) the teacher controls are hidden: there is no Pause, Different Card or New Game, and **Next Team** appears under the explanation instead. Reload the page to start over.
- On wider screens every screen fits the window without scrolling; shorter windows scale the whole layout down.
- The final leaderboard ranks everyone, with tied scores sharing a rank, and celebrates everyone tied for the top score.

### Repeat and replacement rules

- A team never sees the same question twice, including one it had replaced.
- **Repeats off:** a question that has been answered or timed out is used up for the whole game. A replaced question goes back into the deck for *other* teams.
- **Repeats on:** a question can come up again for a different team at any time.
- Every draw, including a replacement, only chooses questions that still leave enough for every remaining turn of every team. When no such question exists, **Different Card** is disabled with an explanation. A valid setup can therefore never run out of questions mid-game.

## Google classes

When the site is built with `VITE_GOOGLE_CLIENT_ID` and `VITE_ROSTER_SHEET_ID` (see `.env.example`), Individual Players mode offers **Google Class** beside **Type Names**. The teacher presses **Connect Google**, picks a class, and presses **Start Game**. The whole class plays, top to bottom in the spreadsheet's row order, and the setup screen shows a read-only preview of the names with their photos or emojis. There is no student selection, renaming, reordering or emoji picking in this mode: roster changes are made in the spreadsheet and show the next time the class is loaded.

- **The spreadsheet is QuestRush's.** It reads the `classrooms` tab (`slug`, `name`) for the class list and the `students` tab (`classroom_slug`, `name`, `emoji`, `photo`) for the students; the `position` column is ignored. Columns are found by their header name, so don't rename the header cells.
- **Read-only.** The sign-in asks only for `https://www.googleapis.com/auth/spreadsheets.readonly`, and QuizRush only sends GET requests. It never writes rosters, attendance or scores to Google.
- **Photos** are shown only when the cell holds a small inline JPEG, PNG or WebP picture (a `data:image/...;base64,` value, as QuestRush writes them). A missing or other photo falls back to the student's emoji, and a missing emoji to an unused one from the pool.
- A class with more than 30 students can't be started. Names longer than 30 characters or repeated names block Start Game until they are fixed in the spreadsheet.
- The Google token lives in memory only, so reloading or opening another quiz asks the teacher to connect again.

### Setup (manual, in the Google Cloud console and GitHub)

1. In the Google Cloud project behind QuestRush's sign-in client (or a new one with the **Google Sheets API** enabled), add `https://www.googleapis.com/auth/spreadsheets.readonly` under **Google Auth Platform → Data access**.
2. On the OAuth client (type **Web application**), add `https://quizrush.raghadalsaka.com` and `http://localhost:5173` under **Authorized JavaScript origins**.
3. Each teacher's Google account needs at least view access to the spreadsheet, and must be a test user while the app is in **Testing**.
4. In this GitHub repository, set the variables `QUIZRUSH_GOOGLE_CLIENT_ID` and `QUIZRUSH_ROSTER_SHEET_ID` (neither is secret), then redeploy. For local development, put the same values in `.env`.

## Deployment (GitHub Pages)

The site is served at `https://quizrush.raghadalsaka.com`. `.github/workflows/deploy.yml` runs on every push to `main` and on manual dispatch. It runs the type-check, lint, and tests, builds, and deploys `dist/` with `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`. Only `main` is allowed to deploy to the `github-pages` environment.

GitHub Pages can't rewrite URLs, so the build (the plugin in `build/contestCatalog.ts`) copies the app's `index.html` to `<slug>/index.html` for every quiz and to `404.html` for unknown addresses.

### Base path

The site lives at the root of its own domain, so the CI build uses Vite's default `base` of `/`. The old `https://raghadalsaka.github.io/quizrush/` URL redirects to the custom domain.

`VITE_BASE` can override the base for a local subpath check: run `VITE_BASE=/quizrush/ npm run build && npm run preview`, then open `http://localhost:4173/quizrush/`. On Git Bash for Windows, prefix the command with `MSYS_NO_PATHCONV=1` so the path isn't rewritten.

### Hosting setup (managed manually in the GitHub and Cloudflare UIs)

- GitHub → **Settings → Pages**: Source is **GitHub Actions**, and the custom domain is `quizrush.raghadalsaka.com`. No `CNAME` file is needed in the repo; Actions-based deployments use the setting.
- Cloudflare DNS: `CNAME quizrush → raghadalsaka.github.io`, DNS only (not proxied), so GitHub can issue and renew the HTTPS certificate.
- Enable **Enforce HTTPS** under **Settings → Pages** once GitHub shows the certificate as issued.
