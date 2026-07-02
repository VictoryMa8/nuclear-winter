# 04 — DevOps

> "DevOps" sounds like a job title with a Kubernetes cluster attached. Strip away the
> buzzwords and it's a simple question: **how does code get from your editor into
> someone's hands, reliably and repeatably?** Every project answers it, whether or not
> anyone calls it DevOps. This chapter walks Nuclear Winter's answer — which is
> deliberately minimal — and then shows you the next rungs of the ladder so you know
> where you're headed.

---

## 1. The lifecycle of a change

Here's the full journey of one edit to this game, from thought to player:

```
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │  1. EDIT │──►│ 2. RUN   │──►│ 3. COMMIT│──►│ 4. DEPLOY│──►│ 5. PLAY  │
  │  a file  │   │ locally  │   │ to git   │   │ to web   │   │ (someone │
  │          │   │ & verify │   │          │   │          │   │  plays)  │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
       ▲              │
       └──────────────┘
        the inner loop
      (edit→run→observe,
       many times a minute)
```

Steps 1–2 are the **inner loop** — the thing you do hundreds of times a day. Steps 3–5
are the **outer loop** — sharing and shipping. DevOps is mostly about making both loops
*fast* and *trustworthy*. A slow inner loop wastes your life in ten-second increments; a
flaky outer loop means "works on my machine" and 2 a.m. panics. Let's walk each step.

---

## 2. The inner loop: edit → run → observe

### Running the game locally

The top-level [README](../README.md) says it:

```sh
python3 -m http.server 8642
# then open http://localhost:8642
```

Why a server at all? You *could* double-click `index.html` and it'd mostly work — but
loading over `file://` breaks some browser features (fonts, certain fetches, and later
if you switch to ES modules, those too). Serving over `http://` mirrors how the game
will really run on the web, so **your local environment matches production.** That
"dev matches prod" instinct — test in conditions that resemble reality — prevents a
whole category of "worked locally, broke live" surprises. `python3 -m http.server` is
just the smallest possible web server; any static server (`npx serve`, VS Code's Live
Server, etc.) does the same job.

### The `.claude/launch.json` file

This repo has a small config at [`.claude/launch.json`](../.claude/launch.json):

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "nuclear-winter", "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8642"], "port": 8642 }
  ]
}
```

It's a tiny piece of **"configuration as code"**: instead of everyone remembering the
exact command to start the dev server, the command is *written down in the repo.* New
contributor clones the project and the "how do I run this" answer travels *with* the
code. This is the germ of a huge DevOps idea — **encode operational knowledge in files,
not in people's heads or a wiki that goes stale.** The same instinct scales up to
Dockerfiles, `Makefile`s, CI configs, and infrastructure-as-code.

### Observing: your browser's DevTools are your instruments

The "observe" half of the inner loop matters as much as running. When something's
wrong, you don't guess — you look. Open the browser DevTools (F12) and you have:

- **Console** — where `console.log()` output and errors show up. If the game freezes,
  an error here usually says exactly which file and line died.
- **Network tab** — did all six `js/` files actually load? A red 404 here explains a
  lot of "nothing happens" mysteries.
- **Sources / debugger** — you can set a *breakpoint* on a line and the game pauses
  there so you can inspect variables. Far more powerful than sprinkling `console.log`.

Learning to *read your instruments* instead of guessing is one of the biggest force
multipliers in engineering. A junior dev stares at code wondering why; a stronger dev
opens the console, reads the error, and knows in five seconds.

---

## 3. The outer loop: version control with Git

### What Git actually is, and why every project uses it

Git is a **time machine and a collaboration tool** for your code. It records snapshots
("commits") of your project, each with a message explaining *why* the change happened.
This buys you three things you can't live without:

1. **Undo across time.** Broke something three days ago? You can see exactly what
   changed and revert it. Your code has a rewindable history.
2. **A written record of *why*.** `git log` is a narrated story of how the project got
   to now. Good commit messages are documentation that never goes out of date because
   it's attached to the change itself.
3. **Safe parallel work.** *Branches* let you build a risky feature off to the side
   without endangering the working version, then merge it in when it's ready.

### The everyday Git rhythm

```sh
git status                 # what have I changed? (run this constantly)
git diff                   # show me exactly what changed, line by line
git add js/game.js         # stage the files I want in this commit
git commit -m "Add a new enemy type: the Ash Wraith"   # snapshot, with a reason
git log --oneline          # the project's history, one line per commit
```

A few habits that separate tidy repos from messy ones:

- **Commit small and often.** One commit should be one coherent idea ("add the shop,"
  "fix the flee bug"), not "did a bunch of stuff." Small commits are easy to review,
  easy to revert, and easy to understand later.
- **Write the message for future-you.** `"fix"` tells you nothing in six months.
  `"Fix flee button letting you escape the boss fight"` tells the whole story. Explain
  *why*, not just *what* — the diff already shows what.
- **Branch for anything risky.** `git switch -c try-daynight-cycle` gives you a
  sandbox. If it works, merge it; if it doesn't, throw the branch away and nothing was
  harmed.

### What *not* to commit: the `.gitignore`

Not everything belongs in version control. Generated files, secrets, OS junk
(`.DS_Store`), and dependency folders (`node_modules`) should be ignored. This project
barely needs one because it has no build output and no dependencies — but the moment
you add tooling, create a `.gitignore`:

```gitignore
# example, for when this project grows
node_modules/
dist/
.DS_Store
*.log
.env            # NEVER commit secrets/API keys — this is the big one
```

> **Burn this in now:** never, ever commit passwords, API keys, or tokens. Git
> remembers *everything* — deleting a secret in a later commit doesn't remove it from
> history. Leaked keys in git history are one of the most common real-world security
> incidents. Secrets go in environment variables or a secrets manager, never in the
> repo.

---

## 4. Deploying: getting it onto the internet

Because this is a **static site** — just HTML, CSS, and JS with no server-side code —
deploying is gloriously easy. There's nothing to "run" on a server; a host just needs
to hand your files to browsers. That makes it perfect for free static hosting.

### The easiest real deployment: GitHub Pages

1. Push the repo to GitHub.
2. In the repo's **Settings → Pages**, choose the `main` branch as the source.
3. GitHub serves it at `https://<your-username>.github.io/nuclear-winter/`.

That's a real, public, HTTPS-secured deployment of your game, for free, in three
clicks. Netlify, Vercel, and Cloudflare Pages do the same thing with similar ease and
add niceties like automatic deploys on every push. The reason it's *this* easy is
directly downstream of a system-design choice from chapter 1: **no backend means no
servers to manage.** Architecture decisions and ops difficulty are the same coin — a
simpler system is a simpler thing to run. That connection is the whole reason "DevOps"
exists as a discipline: the people building it and the people running it are making one
set of decisions together.

### The one gotcha: relative paths

Notice the game loads its scripts with **relative** paths:

```html
<script src="js/game.js"></script>   <!-- not "/js/game.js" -->
```

That leading-slash-or-not matters. `/js/game.js` means "from the root of the domain,"
which breaks when your game lives in a *subfolder* like
`username.github.io/nuclear-winter/`. `js/game.js` means "relative to this page," which
works no matter what folder it's deployed into. Small detail, extremely common
first-deploy bug ("it works locally but all my files 404 on GitHub Pages"). The fix is
almost always: use relative paths.

---

## 5. Automation: CI/CD, and a starter pipeline

Right now the outer loop is manual: you commit, you deploy. **CI/CD** — Continuous
Integration / Continuous Deployment — is about letting a robot do the repetitive,
error-prone parts *every single time*, so quality doesn't depend on you remembering.

- **CI (Continuous Integration):** every time you push, automatically *check* the code —
  run tests, run a linter, make sure it isn't broken. Catch problems in minutes, before
  they reach anyone.
- **CD (Continuous Deployment):** every time the checks pass on `main`, automatically
  *deploy* it. No human runs a manual deploy; merging *is* shipping.

Here's a real, working GitHub Actions workflow you could add at
`.github/workflows/deploy.yml`. It checks the JavaScript for syntax errors on every push
and deploys to GitHub Pages when `main` is green:

```yaml
name: CI + Deploy
on:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4              # get the code
      - uses: actions/setup-node@v4            # install Node (for the syntax check)
        with: { node-version: '20' }
      - name: Syntax-check every JS file       # the "CI" gate
        run: for f in js/*.js; do node --check "$f"; done

  deploy:
    needs: check                               # only deploy if `check` passed
    runs-on: ubuntu-latest
    permissions: { pages: write, id-token: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with: { path: '.' }
      - uses: actions/deploy-pages@v4          # the "CD" step
```

Read the *shape*, not the exact syntax. A pipeline is a list of **jobs**, each a list of
**steps**, triggered by an **event** (here, "push to main"). The `needs: check` line is
the key idea: **deploy is gated on checks passing.** The robot refuses to ship broken
code. That gate is the entire value of CI — it turns "I hope I didn't break anything"
into "the machine confirmed I didn't."

Notice the CI step reuses the *exact* command you'd run by hand — `node --check`. Good
automation is usually just "the manual thing you already do, run automatically and
consistently." You don't need to master YAML today; you need to understand that CI is a
**safety net that runs the same checks every time so humans can't forget.**

### What you'd add as the project grows

The moment this game gets more serious, the natural next rungs on the ladder:

| Need | Tool you'd reach for | What it does |
| --- | --- | --- |
| Catch style/bug patterns | **ESLint** | Flags likely mistakes and enforces consistency. |
| Consistent formatting | **Prettier** | Auto-formats so nobody argues about spaces. |
| Confidence when refactoring | **Vitest / Jest** | Automated tests that prove logic (like `calculateDamage`) still works. |
| Faster loads, bundling | **Vite / esbuild** | Bundles + minifies; enables ES modules. |
| Types that catch bugs early | **TypeScript** | Catches "you passed a string where a number goes" before runtime. |

Each of these is a rung, not a requirement. Add them *when the pain they solve is real*,
not before. A test suite for a 200-line game nobody's shipping is procrastination
dressed as diligence. A test suite for `calculateDamage` once six people depend on the
balance being stable is wisdom. Same tool, different moment. **The judgment of *when*
is the actual skill** — the tools themselves are easy to learn once you need them.

---

## 6. The mental model to keep

Everything in this chapter reduces to one loop, repeated at two speeds:

> **make a change → verify it's good → share it → repeat**

- The **inner loop** (change → verify) should be *seconds*. Optimize it ruthlessly —
  it's most of your life as a developer.
- The **outer loop** (share → ship) should be *trustworthy*. Automate the checks so
  "good" doesn't depend on anyone being careful on a bad day.

DevOps, at every scale from this tiny game to a company running thousands of servers,
is just making those two loops fast and reliable. The tools get fancier; the goal never
changes.

---

**Next:** [05 — Exercises](05-exercises.md) — because you don't actually learn any of
this by reading. You learn it by changing the code and watching what happens.
