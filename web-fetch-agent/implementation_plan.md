# Implementation Plan - Web Fetch Agent on Blocks

This plan outlines the steps to build, configure, and publish a web fetch agent that runs on Blocks. The agent takes a URL as input, fetches its HTML, and returns the HTML content as a file/text artifact.

## User Review Required

> [!IMPORTANT]
> - **Agent Name:** The proposed agent name is `web_fetch_agent` (since hyphenated names are not allowed by the Blocks Network agent name regex `^[a-zA-Z0-9_]+$`).
> - **Authentication:** The Blocks CLI requires you to authenticate. During execution, I will instruct you to run `blocks login` in your terminal to log in.

## Proposed Changes

### Configuration and Scaffold

#### [NEW] [agent-card.json](file:///Users/stephen/Projects/agents-blocks/web-fetch-agent/agent-card.json)
- Define agent metadata: name (`web_fetch_agent`), displayName (`Web Fetch Agent`), description, and version (`1.0.0`).
- Define inputs: a JSON form-class input with a `url` field (`string` type).
- Define outputs: a `text/html` output for the fetched HTML page.
- Declare `runtime` properties with `maxRunningTimeSec: 60`.

#### [NEW] [handler.ts](file:///Users/stephen/Projects/agents-blocks/web-fetch-agent/handler.ts)
- Implement the default async handler function.
- Parse the input `url` from the request parts.
- Fetch the HTML page using the built-in `fetch` API.
- Report status updates back to the task context.
- Return the HTML content as an artifact with `mimeType: "text/html"`.

#### [NEW] [trigger.ts](file:///Users/stephen/Projects/agents-blocks/web-fetch-agent/trigger.ts)
- Script to local test/trigger the agent using inputs. We will pre-fill a test URL.

#### [NEW] [package.json](file:///Users/stephen/Projects/agents-blocks/web-fetch-agent/package.json)
- Node project configuration declaring `@blocks-network/sdk` and TypeScript dependencies.

## Verification Plan

### Automated Tests
- Run `blocks check` to validate that `agent-card.json` and the handler are valid.
- Run `npm install` and trigger a test task locally using `npx tsx trigger.ts` to verify the fetch and artifact output.

### Manual Verification
- Ask the user to run `blocks login` and then `blocks publish` to publish to the Blocks registry.
- Run `blocks dashboard` to view the agent in the Blocks dashboard interface.
