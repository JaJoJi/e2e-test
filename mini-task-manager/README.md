# Mini Task Manager

A deliberately tiny, full-stack web application used as a **Lab 05 demo** for
running Playwright End-to-End tests inside Docker and executing the whole thing
from a Jenkins Pipeline.

The app is intentionally simple so the entire CI/CD pipeline stays readable:

* No database (in-memory task list)
* No cache, no message broker, no reverse proxy
* Plain HTML/CSS/vanilla JS frontend
* Node.js 20 + Express backend
* Playwright E2E suite (Chromium only)
* Docker / Docker Compose for reproducible execution
* Declarative Jenkins Pipeline

---

## 1. What the project is

A single-page "Mini Task Manager" web app that lets a user:

* Add a task (text input + button)
* See the current task list
* Mark a task as completed (checkbox)
* Delete a task

The backend exposes a small JSON API:

| Method | Path              | Description                      |
|--------|-------------------|----------------------------------|
| GET    | `/api/health`     | Liveness check                   |
| GET    | `/api/tasks`      | List all tasks                   |
| POST   | `/api/tasks`      | Create a task (`{ "title": ... }`) |
| PATCH  | `/api/tasks/:id`  | Update `completed` and/or `title`|
| DELETE | `/api/tasks/:id`  | Delete a task                    |

Tasks live in an in-memory JavaScript array. Restarting the server resets all
data — this is intentional for a lab demo.

---

## 2. Why it exists

The lab requires a project that:

1. Has a runnable web application.
2. Has Playwright E2E tests with JUnit and HTML reports.
3. Runs both inside Docker.
4. Can be wired into a Jenkins Declarative Pipeline with **JUnit publishing**
   and **artifact archiving**.

Anything bigger (databases, multiple services, auth, ...) makes the lab harder
to debug. This project is the minimum viable surface that still demonstrates
all of the above in a single command.

---

## 3. Project structure

```
mini-task-manager/
├── src/
│   ├── server.js              # Express app + in-memory store
│   └── public/
│       ├── index.html         # Page markup (uses data-testid)
│       ├── app.js             # Frontend logic (fetch / render)
│       └── style.css          # Styling
├── e2e/
│   ├── home.spec.js           # 3 tests on the home page
│   ├── task.spec.js           # 4 tests on task UI flows
│   └── api.spec.js            # 4 tests on REST endpoints
├── package.json               # Express + @playwright/test
├── package-lock.json          # Reproducible installs
├── playwright.config.js       # BASE_URL, reporters, webServer
├── Dockerfile                 # Web container (node:20-alpine)
├── Dockerfile.playwright      # Playwright container (official image)
├── docker-compose.yml         # web + playwright services
├── .dockerignore
├── .gitignore
├── Jenkinsfile                # Declarative pipeline
└── README.md
```

---

## 4. How to install dependencies

```bash
cd mini-task-manager
npm install
```

This installs:

* `express` — the web server
* `@playwright/test` (dev) — the test runner

`npm install` also generates `package-lock.json` (already committed).

> **Note:** You do **not** need to download Playwright browsers locally.
> The Docker Compose flow uses the official Playwright image, which already
> contains the Chromium binary. The local `npm run test:e2e` flow expects
> browsers to be installed with `npx playwright install chromium` plus the
> matching system libraries.

---

## 5. How to run the application locally

```bash
npm start
```

Then open <http://localhost:3000>.

The server logs:

```
Mini Task Manager listening on port 3000
```

To stop it, press `Ctrl+C` (it handles `SIGINT`/`SIGTERM`).

---

## 6. How to run Playwright locally (without Docker)

This works on any machine that has Chromium and its system dependencies:

```bash
npm run test:e2e
```

The Playwright config will:

1. Start the Express server itself (`webServer.command = node src/server.js`).
2. Wait for `http://localhost:3000` to respond.
3. Run all `e2e/*.spec.js` files in headless Chromium.
4. Write reports to `e2e/reports/` and `e2e/playwright-report/`.

You can override the base URL with an env var:

```bash
BASE_URL=http://localhost:4000 npm run test:e2e
```

---

## 7. How to run E2E using Docker Compose

The single command from the lab brief:

```bash
docker compose up --build --abort-on-container-exit --exit-code-from playwright
```

What it does:

| Step | What happens |
|------|--------------|
| 1    | Builds the `web` image from `Dockerfile` (Node 20 Alpine + Express). |
| 2    | Builds the `playwright` image from `Dockerfile.playwright` (`mcr.microsoft.com/playwright:v1.48.0-jammy`). |
| 3    | Starts the `web` container and waits until `GET /api/health` returns 200 (docker compose healthcheck). |
| 4    | Starts the `playwright` container with `BASE_URL=http://web:3000` and `SKIP_WEBSERVER=1`. |
| 5    | Playwright runs all tests in headless Chromium. |
| 6    | When the playwright container exits, `--abort-on-container-exit` tears the whole stack down. |
| 7    | `--exit-code-from playwright` makes the `docker compose` exit code mirror the playwright container's exit code. |

Host-side bind mounts mean the reports appear on your machine after the run:

```
e2e/reports/junit-e2e.xml
e2e/playwright-report/index.html
e2e/test-results/
```

To also remove containers/volumes after the run:

```bash
docker compose down --remove-orphans
```

---

## 8. Where the JUnit report is generated

```
e2e/reports/junit-e2e.xml
```

Configured in `playwright.config.js`:

```js
['junit', { outputFile: 'e2e/reports/junit-e2e.xml' }]
```

When all 11 tests pass, the file contains:

```xml
<testsuites tests="11" failures="0" errors="0" skipped="0" ...>
  <testsuite name="api.spec.js"  tests="4" ...>...</testsuite>
  <testsuite name="home.spec.js" tests="3" ...>...</testsuite>
  <testsuite name="task.spec.js" tests="4" ...>...</testsuite>
</testsuites>
```

Jenkins consumes it via the `junit` step:

```groovy
junit testResults: 'e2e/reports/junit-e2e.xml', allowEmptyResults: false
```

---

## 9. Where the HTML report is generated

```
e2e/playwright-report/index.html
```

Configured in `playwright.config.js`:

```js
['html', { outputFolder: 'e2e/playwright-report', open: 'never' }]
```

The whole `e2e/playwright-report/**` tree is archived by Jenkins:

```groovy
archiveArtifacts artifacts: 'e2e/playwright-report/**,e2e/reports/junit-e2e.xml',
                   fingerprint: true
```

---

## 10. How Jenkins executes the tests

`Jenkinsfile` runs on the `linux-build` agent label and is intentionally short:

```
Checkout
  └─► Install                (sanity-check tool versions)
       └─► Start/Test Application   (docker compose up -d --build --wait web)
            └─► Playwright E2E      (docker compose up --abort-on-container-exit
                                      --exit-code-from playwright)
            └─► (post, always)      docker compose down -v --remove-orphans
            └─► (post, success)     junit  +  archiveArtifacts
            └─► (post, failure)     junit  +  archiveArtifacts (lenient)
```

The `post { always { ... } }` block guarantees `docker compose down` runs no
matter what, so dangling containers never pile up on the agent.

`post.success` publishes JUnit and archives the Playwright HTML report only
when tests pass. `post.failure` does the same with `allowEmptyArchive: true`
so the *failed* report is still downloadable for debugging.

### Jenkins requirements on the agent

* `linux-build` label is present and an agent with that label is online.
* The agent runs Docker Engine with the Compose plugin (`docker compose version` works).
* The agent has outbound internet access to:
  * `docker.io` / `library/*` images (for `node:20-alpine`)
  * `mcr.microsoft.com/playwright:v1.48.0-jammy`
* The agent user is in the `docker` group **or** the Jenkins process itself
  runs as root (Compose needs to bind-mount host directories).

If you use a containerised agent (e.g. `linux-build` is a Jenkins JNLP agent
inside a Docker container), expose the host Docker socket into the agent
(`/var/run/docker.sock:/var/run/docker.sock`) and ensure the in-container user
has access to it.

### Jenkins job setup

1. New Item → **Pipeline**.
2. **Pipeline Definition:** *Pipeline script from SCM*.
3. **SCM:** Git, point it at this repo, branch `main`.
4. **Script Path:** `mini-task-manager/Jenkinsfile` (or `Jenkinsfile` if Jenkinsfile
   lives at the workspace root — see below).
5. Save → Build Now.

> The provided `Jenkinsfile` assumes the workspace root **is** the
> `mini-task-manager/` directory (i.e. Jenkins SCM is configured with
> `mini-task-manager` as the repository, or the Jenkinsfile is at the workspace
> root). If you check the *parent* repo into Jenkins, change `scriptPath` in the
> job config to `mini-task-manager/Jenkinsfile`.

---

## 11. How to view the archived Playwright report in Jenkins

After a build runs:

1. Open the build in the Jenkins UI (e.g. `#42).
2. In the left sidebar, click **"Playwright HTML Report"** (or whatever you
   named the artifact). The HTML report is a single page — just open
   `index.html`.
3. Alternatively: **Build Artifacts → `e2e/playwright-report/` → `index.html`**
   → click "Open" or download the whole folder and open `index.html` locally.

For JUnit results:

* Click **"Test Result"** in the build sidebar. Jenkins parses
  `e2e/reports/junit-e2e.xml` and shows the per-spec/per-test breakdown with
  trends over time.

---

## Reliable-test design notes

* The data store is in-memory, so each test creates a **uniquely-named task**
  (`AddTask-<timestamp>-<random>`). Tests therefore never collide, even when
  Playwright runs them in parallel.
* The API test that creates a task also deletes it afterwards to keep the
  running server's state minimal for subsequent tests.
* No `waitForTimeout(...)` is used — only `expect(locator).toBeVisible()`,
  `toHaveCount(...)`, `toHaveClass(...)` and similar auto-retrying assertions.
* Selectors use stable `data-testid` attributes (`task-input`, `add-task`,
  `task-list`, `task-item`, `complete-task`, `delete-task`, `app-title`).
* The Docker Compose stack uses a real `healthcheck` on the web service, so
  Playwright never races the application to start.

---

## Quick reference

```bash
# Install
npm install

# Run app
npm start                          # http://localhost:3000

# Run tests locally (needs local Chromium)
npm run test:e2e

# Run full Docker E2E (the lab command)
docker compose up --build --abort-on-container-exit --exit-code-from playwright

# Clean up afterwards
docker compose down --remove-orphans
```
