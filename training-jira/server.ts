import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type JiraIssue = {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: { id: string; name: string; statusCategory: { key: string; name: string } };
    assignee: null | { accountId: string; displayName: string; emailAddress: string };
    updated: string;
    comment: {
      total: number;
      comments: Array<{
        id: string;
        author: { displayName: string };
        created: string;
        body: string;
      }>;
    };
    [key: string]: unknown;
  };
};

const issueFile = join(process.cwd(), "training-jira", "issues", "PEOPLE-142.json");
const issue = JSON.parse(await readFile(issueFile, "utf8")) as JiraIssue;

const server = new McpServer({
  name: "training-jira-cloud",
  version: "1.0.0"
});

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }]
  };
}

function requireIssue(issueKey: string): JiraIssue {
  if (issueKey.toUpperCase() !== issue.key) {
    throw new Error(`Issue ${issueKey} does not exist or you do not have permission to view it.`);
  }
  return issue;
}

server.tool(
  "getJiraIssue",
  "Get one Jira work item by key, including its Jira fields, Atlassian document-format description, acceptance criteria, comments, and metadata.",
  { issueKey: z.string().describe("Jira issue key, for example PEOPLE-142") },
  async ({ issueKey }) => textResult(requireIssue(issueKey))
);

server.tool(
  "searchJiraIssues",
  "Search Jira work items using a small training-compatible subset of JQL. Returns issue keys, summaries, statuses, and assignees.",
  {
    jql: z.string().describe("JQL query. The training server contains PEOPLE-142."),
    maxResults: z.number().int().min(1).max(50).default(10)
  },
  async ({ jql, maxResults }) => {
    const query = jql.toLowerCase();
    const matches =
      query.includes("people") ||
      query.includes("people-142") ||
      query.includes("assignee") ||
      query.includes("status");

    const issues = matches
      ? [{
          id: issue.id,
          key: issue.key,
          self: issue.self,
          fields: {
            summary: issue.fields.summary,
            status: issue.fields.status,
            assignee: issue.fields.assignee
          }
        }].slice(0, maxResults)
      : [];

    return textResult({
      startAt: 0,
      maxResults,
      total: issues.length,
      issues
    });
  }
);

server.tool(
  "assignJiraIssue",
  "Assign a Jira work item to the current training user.",
  { issueKey: z.string() },
  async ({ issueKey }) => {
    const target = requireIssue(issueKey);
    target.fields.assignee = {
      accountId: "delegate-developer",
      displayName: "Delegate Developer",
      emailAddress: "delegate@example.test"
    };
    target.fields.updated = new Date().toISOString();
    return textResult({ key: target.key, assignee: target.fields.assignee });
  }
);

server.tool(
  "transitionJiraIssue",
  "Transition a Jira work item to To Do, In Progress, or In Review.",
  {
    issueKey: z.string(),
    status: z.enum(["To Do", "In Progress", "In Review"])
  },
  async ({ issueKey, status }) => {
    const target = requireIssue(issueKey);
    const statuses = {
      "To Do": { id: "10000", key: "new" },
      "In Progress": { id: "3", key: "indeterminate" },
      "In Review": { id: "10002", key: "indeterminate" }
    } as const;
    const selected = statuses[status];
    target.fields.status = {
      id: selected.id,
      name: status,
      statusCategory: { key: selected.key, name: status }
    };
    target.fields.updated = new Date().toISOString();
    return textResult({ key: target.key, status: target.fields.status });
  }
);

server.tool(
  "addJiraComment",
  "Add a plain-text comment to a Jira work item.",
  {
    issueKey: z.string(),
    body: z.string().min(1).max(2000)
  },
  async ({ issueKey, body }) => {
    const target = requireIssue(issueKey);
    const comment = {
      id: String(20001 + target.fields.comment.comments.length),
      author: { displayName: "Delegate Developer" },
      created: new Date().toISOString(),
      body
    };
    target.fields.comment.comments.push(comment);
    target.fields.comment.total = target.fields.comment.comments.length;
    target.fields.updated = comment.created;
    return textResult(comment);
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
