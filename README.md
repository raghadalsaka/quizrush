# quizrush
Quizrush is a timed, team-based classroom quiz app for Grade 6 English. Built with Vue 3 and hosted on GitHub Pages, it uses JSON questions, random draws, instant explanations, and a live leaderboard.

One teacher runs it on one projector for 1–5 teams. Everything happens in the browser: there is no backend, no accounts, and nothing is saved. Reloading the page starts a fresh game.

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

All content lives in [`public/contest.json`](public/contest.json). Edit it, commit, and push to `main`; the site redeploys automatically.

```json
{
  "title": "Grade 6 English Challenge",
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
| `title` | Non-blank text. |
| `settings.secondsPerQuestion` | Whole number, 1–600. The default timer on the setup screen. |
| `settings.defaultQuestionsPerTeam` | Whole number, 1–50. The default turn count on the setup screen. |
| `settings.allowCrossTeamRepeats` | `true` or `false` (no quotes). See the repeat rules below. |
| `questions[].id` | Non-blank and unique. Keep ids stable when editing. |
| `questions[].prompt` | Non-blank text. |
| `questions[].options` | Exactly four non-blank answers. |
| `questions[].correctIndex` | `0`–`3`: the position of the right answer (`0` is the first option). |
| `questions[].explanation` | Non-blank text, shown after every answer or timeout. |

If the file is missing, is not valid JSON, or breaks any rule, the app shows a teacher-facing list of problems with a **Retry** button. It never starts with broken data. The JSON is public, so anyone can read the answers.

How many questions you need:

- **Repeats off** (`false`): at least *teams × questions per team*. For example, 3 teams × 5 questions needs 15.
- **Repeats on** (`true`): at least *questions per team*. For example, 3 teams × 5 questions can run with 5.

The setup screen shows the count and disables **Start Game** until the setup works. Spare questions let teachers use **Different Card** more often.

## Game rules

- Teams play in the order they were entered, one question per turn, and every team gets the same number of turns.
- **Start** draws a random question and flips the card. The timer starts once the answers can be clicked.
- The first answer (mouse or keys 1–4) locks the question. A correct answer earns exactly 1 point. A wrong answer or a timeout earns 0. The correct answer and the explanation stay visible until the teacher presses **Next Team** (or **See Results**).
- The timer uses a real-time deadline, so a hidden or throttled tab never gets extra time.
- **Teacher controls** are available while a question is open, and each asks for confirmation:
  - **Restart Question** gives the same question the full time again. The turn and score don't change.
  - **Different Card** sets the question aside and draws another one with a fresh timer. The turn and score don't change.
- The final leaderboard celebrates every team tied for the top score.

### Repeat and replacement rules

- A team never sees the same question twice, including one it had replaced.
- **Repeats off:** a question that has been answered or timed out is used up for the whole game. A replaced question goes back into the deck for *other* teams.
- **Repeats on:** a question can come up again for a different team at any time.
- Every draw, including a replacement, only chooses questions that still leave enough for every remaining turn of every team. When no such question exists, **Different Card** is disabled with an explanation. A valid setup can therefore never run out of questions mid-game.

## Deployment (GitHub Pages)

The site is served at `https://quizrush.raghadalsaka.com`. `.github/workflows/deploy.yml` runs on every push to `main` and on manual dispatch. It runs the type-check, lint, and tests, builds, and deploys `dist/` with `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`. Only `main` is allowed to deploy to the `github-pages` environment.

### Base path

The site lives at the root of its own domain, so the CI build uses Vite's default `base` of `/`. The old `https://raghadalsaka.github.io/quizrush/` URL redirects to the custom domain.

`VITE_BASE` can override the base for a local subpath check: run `VITE_BASE=/quizrush/ npm run build && npm run preview`, then open `http://localhost:4173/quizrush/`. On Git Bash for Windows, prefix the command with `MSYS_NO_PATHCONV=1` so the path isn't rewritten.

### Hosting setup (managed manually in the GitHub and Cloudflare UIs)

- GitHub → **Settings → Pages**: Source is **GitHub Actions**, and the custom domain is `quizrush.raghadalsaka.com`. No `CNAME` file is needed in the repo; Actions-based deployments use the setting.
- Cloudflare DNS: `CNAME quizrush → raghadalsaka.github.io`, DNS only (not proxied), so GitHub can issue and renew the HTTPS certificate.
- Enable **Enforce HTTPS** under **Settings → Pages** once GitHub shows the certificate as issued.
