# Jira Ticket → Feature → Pull Request Lab

This self-contained project teaches a developer to retrieve a realistic Jira work item in Cursor, analyse it, implement the requested feature, and prepare a traceable pull request.

It does **not** require a live Atlassian account. A local MCP server exposes Jira-shaped tools and returns the ticket in the same field-oriented JSON form an agent receives from Jira Cloud, including Atlassian Document Format for the description.

The starter product is a working TypeScript/Express Employee Directory API. Its current tests pass. The change requested by `PEOPLE-142` is deliberately not implemented.

## Prerequisites

- Node.js 20 or later
- Cursor with MCP support
- Git

## Instructor setup

Timed teaching script, demo prompts, checkpoints, and coaching notes: [INSTRUCTOR.md](INSTRUCTOR.md). Delegates should use this README only.

Give each delegate a fresh copy or fork of this folder.

```powershell
cd jira-ticket-development-lab
npm install
npm run build
npm test
```

Open **this folder itself** as the Cursor workspace. Cursor discovers `.cursor/mcp.json`; enable `training-jira` in **Cursor Settings → MCP** if it is not already enabled. Restart the MCP server after rebuilding.

There is no login. This is intentionally local so a classroom is not blocked by Atlassian organization administration.

## Confirm the complete setup

1. In Cursor Agent chat, ask: `Search Jira for open work in the PEOPLE project.`
2. The agent should call `searchJiraIssues` and return `PEOPLE-142`.
3. Ask: `Fetch PEOPLE-142, including its full description, comments and metadata.`
4. Run the product:

```powershell
npm run dev
```

Open <http://localhost:3000>. API requests use either `x-role: employee` or `x-role: admin`.

Useful checks:

```powershell
curl.exe -H "x-role: employee" http://localhost:3000/employees
curl.exe -H "x-role: admin" http://localhost:3000/admin/employees
curl.exe -X DELETE -H "x-role: admin" http://localhost:3000/admin/employees/emp-2
```

## Delegate workflow

Do not open `training-jira/issues/PEOPLE-142.json` to read the requirement. Retrieve it through the Jira tools, just as you would in a connected development environment.

### 1. Pull and understand the work

Use this prompt:

> Search Jira for open work in project PEOPLE. Fetch PEOPLE-142 with its full description, acceptance criteria, comments, status, priority, labels and component. Do not change code yet. Present a concise requirement summary and a numbered acceptance-criteria checklist. Identify contradictions or missing decisions.

Check the agent's summary against the ticket. The ticket—not the summary—is the source of truth.

### 2. Establish the baseline

```powershell
npm test
git checkout -b PEOPLE-142-retain-deleted-employees
```

Ask Cursor to inspect the current implementation and explain how delete, employee search, employee detail and admin views behave today. Require file references and test references.

Optionally use the local Jira tools to assign the issue and transition it to **In Progress**.

### 3. Plan before editing

Ask for a plan that maps every acceptance criterion to:

- production code likely to change;
- tests that prove the criterion;
- existing tests whose old assumptions must change;
- explicit out-of-scope items.

Challenge any plan that changes only the DELETE route. This story crosses storage, public reads, admin reads and tests.

### 4. Implement and verify

Implement one coherent slice at a time. Run:

```powershell
npm test
npm run test:acceptance
npm run build
```

`npm run test:acceptance` intentionally fails before the feature is implemented. Do not weaken these tests to make them pass. The existing baseline test that expects permanent deletion **must** be updated because the requirement supersedes it.

### 5. Prepare the pull request

Commit and PR names must contain the Jira key:

```powershell
git add .
git commit -m "PEOPLE-142 retain deleted employee records"
```

Use `.github/pull_request_template.md`. In the PR description, map each acceptance criterion to code and test evidence rather than saying only “tests pass.”

Finally, ask the Jira tool to transition `PEOPLE-142` to **In Review** and add a comment containing the PR URL. The local ticket updates last for the current MCP server session.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the product with reload |
| `npm test` | Run the shipped baseline suite |
| `npm run test:acceptance` | Run `PEOPLE-142` acceptance tests |
| `npm run test:all` | Run all tests together |
| `npm run build` | Type-check and compile product and MCP server |
| `npm start` | Run the compiled product |
| `npm run jira` | Run the compiled Jira MCP server manually |

## Resetting the exercise

Give the delegate a clean copy/fork, or discard their branch. Restarting the `training-jira` MCP process resets its in-memory assignee, comments and status to the fixture.

## Why this resembles Jira Cloud

The server offers search, issue retrieval, assignment, transition and comment operations. `getJiraIssue` returns:

- issue ID, key and REST-style `self` URL;
- project, issue type, status, priority and assignee;
- description in Atlassian Document Format;
- acceptance criteria embedded in the description;
- reporter, labels, component, sprint and story points;
- timestamps and comments.

The tool names are training-friendly rather than a guaranteed copy of Atlassian's internal MCP tool names, which can change between Rovo MCP versions. The important developer experience—asking an agent to retrieve a work item as structured Jira data—is preserved.
