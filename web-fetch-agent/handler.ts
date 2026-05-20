import type { StartTaskMessage, TaskContext, HandlerResult } from '@blocks-network/sdk';

/**
 * Handler function for the agent.
 * Fetches the HTML content of the provided URL and returns it as a text/html artifact.
 */
export default async function handler(
  task: StartTaskMessage,
  ctx?: TaskContext,
): Promise<HandlerResult> {
  const input = task.requestParts?.[0];
  let url: string | undefined;

  if (input) {
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        url = parsed.url;
      } catch {
        url = input;
      }
    } else if (typeof input === 'object') {
      if ('url' in input && typeof input.url === 'string') {
        url = input.url;
      } else if ('text' in input && typeof input.text === 'string') {
        try {
          const parsed = JSON.parse(input.text);
          url = parsed.url ?? input.text;
        } catch {
          url = input.text;
        }
      }
    }
  }

  if (!url) {
    throw new Error(`URL input is required. Input received: ${JSON.stringify(input)}`);
  }

  ctx?.reportStatus(`Fetching HTML from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();

    ctx?.reportStatus(`Successfully fetched ${html.length} bytes of HTML.`);

    return {
      artifacts: [
        {
          data: html,
          mimeType: 'text/html',
          fileName: 'page.html',
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    ctx?.reportStatus(`Error: ${errorMessage}`);
    throw error;
  }
}
