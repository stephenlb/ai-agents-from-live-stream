import type { StartTaskMessage, TaskContext, HandlerResult } from '@blocks-network/sdk';
import OpenAI from "openai";

/**
 * Handler function for the agent.
 * Receives a task and echoes back the input text.
 */
export default async function handler(
  task: StartTaskMessage,
  ctx?: TaskContext,
): Promise<HandlerResult> {
  const text = task.requestParts?.[0]?.text ?? '';
  console.log('text', text);
  const client = new OpenAI();
  const response = await client.responses.create({
    model: "gpt-5.5",
    input: text,
  });
  console.log(response.output_text);

  ctx?.reportStatus('Processing...');

  // Replace this with your agent logic
  return {
    artifacts: [{ data: response.output_text, mimeType: 'text/plain' }],
  };
}
