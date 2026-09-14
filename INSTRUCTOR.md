# Instructor script: teaching the Jira → feature → PR lab

Use this document while you teach. Delegates use `README.md`. Keep this file to yourself so they still have to pull `PEOPLE-142` through the Jira tools.

**Audience:** individual developers  
**Length:** 2 hours  
**Workspace:** open `jira-ticket-development-lab` as the Cursor root, not the parent folder  
**Outcome:** each person fetches a Jira-shaped ticket in Cursor, implements against its acceptance criteria, and prepares a pull request whose title contains `PEOPLE-142`

This lab does not use live Atlassian Cloud. The local `training-jira` MCP server is the stand-in so classroom admin blocks do not stop the session.

---

## What you are teaching

Not “how to code a delete endpoint.” Teach this loop:

1. Find work in Jira (search).
2. Fetch the work item as structured fields, not as a paraphrase.
3. Treat the ticket as source of truth (story, AC, comments, out of scope).
4. Inspect the current product against that ticket.
5. Plan across layers (storage, public API, admin API, tests).
6. Implement without weakening acceptance tests.
7. Prove the change, then close the loop with a branch/PR named after the issue key and a Jira status/comment update.

Say this out loud once: **the agent is a reader and drafter. The ticket decides what “done” means.**

---

## Before the session (30–45 minutes, you only)

Do this on a spare machine that matches the classroom OS.

1. Install Node.js 20+ and Git. Confirm Cursor can use MCP.
2. Copy `jira-ticket-development-lab` to a clean folder.
3. Run:

```powershell
cd jira-ticket-development-lab
npm install
npm run build
npm test
```

Expected: six passing tests. Do **not** run `npm run test:acceptance` as a “green” check — those five tests are meant to fail until the feature exists (typically three failures, two passes, because delete currently removes the record).

4. Open **this folder** in Cursor. Settings → MCP → enable `training-jira`. If it shows an error, rebuild (`npm run build`) and restart the MCP server.
5. New Agent chat. Prompt: `Search Jira for open work in the PEOPLE project.` Confirm the agent calls `searchJiraIssues` and returns `PEOPLE-142`.
6. Prompt: `Fetch PEOPLE-142 with full description, comments and metadata.` Confirm `getJiraIssue` runs and the reply includes user story, AC1–AC5, out of scope, and Priya Shah’s comment.
7. `npm run dev` and open <http://localhost:3000>. Check:

```powershell
curl.exe -H "x-role: employee" http://localhost:3000/employees
curl.exe -H "x-role: admin" -X DELETE http://localhost:3000/admin/employees/emp-2
```

8. Prepare a **second, unused ticket key for your live demo** if you want to avoid racing the class on comments/status. If you only have `PEOPLE-142`, demo fetch + plan on it, then tell the class to reset MCP (disable/enable `training-jira`) so assignee/status start clean.
9. Decide the PR mechanism: GitHub fork + `gh pr create`, or “open a PR against the shared training repo,” or “write the PR body locally if remotes are blocked.” The teaching point is the **title and AC mapping**, not hosting.
10. Print or keep a cheat sheet of the prompts in the section **Copy-paste prompts**.

Give each delegate a **fresh copy or fork**. Shared working copies collide on branches and on in-memory Jira comments.

---

## Classroom setup (0:00–0:15)

### 0:00 — Goal and rules (3 min)

Say:

- You will not be given a Word spec. Work arrives as a Jira issue, the same way it would if Cursor were attached to Jira Cloud.
- Do not open `training-jira/issues/PEOPLE-142.json` to read the requirement. That file is the server fixture, not the lab shortcut.
- Do not implement until you have a written AC checklist from the ticket.
- The feature is **not** in the starter code. Baseline tests pass on purpose.

### 0:03 — Machines (12 min)

Walk them through this checklist. Do not start the demo until most people have a green MCP and `npm test`.

| Step | Delegate action | Success looks like |
| --- | --- | --- |
| 1 | Open `jira-ticket-development-lab` as the Cursor workspace | Explorer shows `src/`, `training-jira/`, `.cursor/` |
| 2 | Terminal in that folder: `npm install` then `npm run build` then `npm test` | `6 passed` |
| 3 | Cursor Settings → MCP → `training-jira` enabled | Status connected / tools listed, not error |
| 4 | New **Agent** chat (not Ask-only if tools cannot run) | Chat can call tools |
| 5 | Optional: `npm run dev` in a second terminal | <http://localhost:3000> loads |

**Stuck MCP:** rebuild, toggle the server off/on, fully restart Cursor, confirm they are not in the parent `AI Workflows` repo as the workspace root.

**Stuck Node:** they used an old Node; `engines` wants 20+.

Do not spend the whole 15 minutes debugging one person. Park them with a neighbour or you after the demo.

---

## Live demo (0:15–0:40) — you drive, they watch

Keep this under 25 minutes. Use a projector. Narrate **why** at each step.

### Step A — Find the work (3 min)

Prompt:

> Search Jira for open work in the PEOPLE project.

Point at the tool call `searchJiraIssues`. Show they got a **key**, **summary**, **status**, **assignee** — a search result, not the full spec.

Teaching line: *In real Jira you would also filter `assignee = currentUser()` or a sprint JQL. Here the board only has this lab ticket.*

### Step B — Fetch the work item (5 min)

Prompt:

> Fetch PEOPLE-142 with its full description, acceptance criteria, comments, status, priority, labels and component. Do not change any code. Summarise the requirement in your own words, then list AC1 to AC5 as a checklist. Quote out of scope. Note anything the comments add.

Show the JSON-shaped fields: `key`, `fields.summary`, ADF `description`, `status`, `comment`. Open the comment from Priya Shah (“no timestamp required”).

Then **challenge the summary**. Ask the room: “If the agent omitted AC5, who is wrong — the agent or the ticket?” Answer: the ticket. They must scroll the fetched issue, not trust the recap.

### Step C — Claim the work (2 min)

Prompt:

> Assign PEOPLE-142 to me and transition it to In Progress. Add a comment that I am starting implementation from the fetched acceptance criteria.

Show `assignJiraIssue`, `transitionJiraIssue`, `addJiraComment`. Say: *On Cloud this is the same habit: you own the card before you cut a branch.*

### Step D — Baseline the product (4 min)

On the projector:

```powershell
npm test
git checkout -b PEOPLE-142-retain-deleted-employees
```

Prompt:

> Inspect this codebase. How does DELETE /admin/employees/:id behave today? What do GET /employees, GET /employees/:id, GET /admin/employees and GET /admin/employees/:id do after a delete? Cite files and tests. Do not edit yet.

Walk `employeeRepository.remove`, `employeeService.delete`, and the baseline test that expects `findById` to be `undefined`.

Teaching line: *Requirements describe the future. Tests and code describe the present. You need both.*

### Step E — Plan against AC, not against a vibe (6 min)

Prompt:

> Create an implementation plan for PEOPLE-142. For each of AC1–AC5, name the production code to change, the acceptance test that already exists, and any baseline test that will become wrong. List out of scope. Do not implement.

On screen, reject a plan that only patches `delete()`. The story needs:

- persist the row and set `active: false`
- hide inactive people from directory search and directory-by-id
- keep them visible on admin list and admin-by-id
- second delete stays 204
- update the baseline “permanent delete” test; **do not** edit acceptance tests to make them pass

Call out out of scope: reactivation, real database, email uniqueness changes.

### Step F — Tiny implement slice (optional, 3 min if time)

Only if you are ahead. Implement **AC1 only** (retain + `active: false`), run `npm run test:acceptance`, show AC1 moving and others still failing. Then **revert** so the class still has a clean start — or keep it if you are teaching from a separate clone.

If time is tight, skip coding in the demo. The class learns more by doing it themselves.

### Step G — Show the finish line (2 min)

Open `.github/pull_request_template.md`. Read the AC evidence checkboxes.

Say the definition of done:

- Branch and commit contain `PEOPLE-142`
- PR title contains `PEOPLE-142`
- Each AC has a file/test note in the PR body
- `npm test`, `npm run test:acceptance`, `npm run build` all pass
- Jira moved to **In Review** with the PR URL in a comment

---

## Lab (0:40–1:50) — they work alone

Put this on a slide and leave it up.

### Checkpoint 1 — Ticket in, code untouched (by ~0:50)

They paste **Prompt 1** from below. You walk the room. If someone is already generating patches, stop them.

**Look for:** AC1–AC5 listed, out of scope listed, comment about no timestamp.

### Checkpoint 2 — Branch + current behaviour (by ~1:00)

```powershell
npm test
git checkout -b PEOPLE-142-retain-deleted-employees
```

**Prompt 2** (inspect current delete). They should be able to tell you that delete **removes** the record today.

Optional Jira assign + In Progress if they did not do it in checkpoint 1.

### Checkpoint 3 — Written plan (by ~1:10)

**Prompt 3** (plan). You personally challenge anyone whose plan is “change `remove()`.” Ask: “Where does directory search still return Ben after delete?”

### Checkpoint 4 — Implement (until ~1:40)

**Prompt 4** only after they agree the plan.

They run, in order:

```powershell
npm run test:acceptance
npm test
npm run build
```

Rules you repeat once:

- Do not delete or skip `src/acceptance/PEOPLE-142.test.ts`.
- The baseline test `currently deletes an employee permanently` **must** change; that is correct.
- Out of scope stays out.

If someone finishes early, stretch: write the PR body from the template; add a Jira comment; explain in chat why AC2 passed even before a correct AC1 (directory hide can look “green” when the record is gone — that is a teaching trap).

### Checkpoint 5 — PR and Jira close-the-loop (by 1:50)

```powershell
git add .
git commit -m "PEOPLE-142 retain deleted employee records"
```

Fill `.github/pull_request_template.md`. Open the PR if remotes exist.

**Prompt 5:** transition to In Review + comment with PR link.

If they cannot push, still write the PR markdown in the chat or a `PULL_REQUEST.md` — the linking habit matters more than GitHub succeeding.

---

## Copy-paste prompts

**Prompt 1 — pull requirements**

> Search Jira for open work in project PEOPLE. Fetch PEOPLE-142 with its full description, acceptance criteria, comments, status, priority, labels and component. Do not change code. Present: (1) one-paragraph requirement summary, (2) numbered AC1–AC5 checklist, (3) out of scope, (4) anything comments add or change. Flag if the summary disagrees with the fetched issue; prefer the issue.

**Prompt 2 — current product**

> Without editing files, explain how employee deletion works today across repository, service, HTTP routes, and tests. After DELETE /admin/employees/:id, what do GET /employees, GET /employees/:id, GET /admin/employees and GET /admin/employees/:id return? Cite paths.

**Prompt 3 — plan**

> Plan PEOPLE-142 only. Map AC1–AC5 to production files and to `src/acceptance/PEOPLE-142.test.ts`. Name the baseline test that must be updated. Do not implement reactivation, persistence, or email-rule changes. Do not implement yet.

**Prompt 4 — implement**

> Implement the agreed PEOPLE-142 plan. Keep acceptance tests as specified. Update baseline tests that assert hard delete. Do not add reactivation or extra fields.

**Prompt 5 — close the loop**

> Transition PEOPLE-142 to In Review and add a Jira comment that the pull request is ready. Include this PR URL: \<paste URL or 'local PR body ready'\>.

---

## Timed agenda (slide)

| Time | Block |
| --- | --- |
| 0:00–0:15 | Outcome, rules, machine setup |
| 0:15–0:40 | Instructor demo of the full loop |
| 0:40–1:50 | Individual lab with the five checkpoints |
| 1:50–2:00 | Debrief |

If the class is slower, cut demo coding (Step F) and stretch debrief into “show one good PR body.”

---

## Debrief (1:50–2:00)

Ask, do not lecture:

1. What did the agent drop from the ticket the first time you fetched it?
2. Why can AC2/AC3 look like they pass while AC1 fails? (Hard delete already hides the person.)
3. Why must the PR title contain `PEOPLE-142`? (Cloud: GitHub-for-Jira / Development panel.)
4. What would you do if AC were missing? (Comment on the ticket; do not invent scope.)

Close with the real-world mapping: same prompts against Atlassian Rovo MCP once an org admin has authorised Cursor; same discipline: fetch fields → plan to AC → branch named by key → PR evidence → In Review.

---

## What “good” looks like at the end

A delegate is done when:

- [ ] They fetched `PEOPLE-142` via MCP, not by opening the JSON fixture
- [ ] Branch `PEOPLE-142-…` exists
- [ ] Delete retains the row with `active: false`
- [ ] Directory list/search/detail hide inactive users (`404` on public by-id)
- [ ] Admin list and admin by-id still return the inactive user
- [ ] Second delete returns 204
- [ ] `npm test` and `npm run test:acceptance` and `npm run build` pass
- [ ] PR title/body include the key and AC evidence
- [ ] Local Jira is In Review with a comment (session may reset if MCP restarts)

---

## Coaching notes and common failures

| What you see | What to say |
| --- | --- |
| They opened `PEOPLE-142.json` | Close it. Fetch via chat. The skill is the tool path. |
| Agent starts coding in the first message | Stop. Requirements first. New chat if needed. |
| Plan only changes `remove()` | “Who still sees Ben on GET /employees?” |
| They rewrite acceptance tests | “Those tests **are** the ticket. Change production code.” |
| They add `deletedAt` or reactivation | Out of scope; Priya’s comment says no timestamp. |
| MCP unauthorised / missing tools | Workspace must be this folder; `npm run build`; toggle `training-jira`. |
| Acceptance: AC2 green, AC1 red | Hard delete already removes them from search. AC1 is the real change. |
| Port 3000 in use | Stop the extra `npm run dev`, or set `PORT=3001`. |
| Want live Jira Cloud | Different course; this classroom is the local server on purpose. |

If a delegate finishes a wrong feature that still “feels like soft delete,” run `npm run test:acceptance` with them. The tests are the referee.

---

## Resetting a person or the room

- Code: discard their branch or restore a clean copy of the folder.
- Jira assignee/status/comments: disable and enable `training-jira` (in-memory; fixture reloads).
- Do not “fix” the starter app before class. The failing acceptance suite is the lab.

---

## If you later connect real Jira Cloud

Same teaching sequence. Differences: OAuth (org admin must authorise Cursor/Rovo MCP), real JQL, real Development panel when the key is in branch and PR title. Keep this lab as the zero-admin rehearsal.
