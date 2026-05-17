import type { StartTaskMessage, TaskContext, HandlerResult } from '@blocks-network/sdk';
import ollama from 'ollama';


/**
 * Handler function for the agent.
 * Receives a task and echoes back the input text.
 */
export default async function handler(
  task: StartTaskMessage,
  ctx?: TaskContext,
): Promise<HandlerResult> {
  const text = task.requestParts?.[0]?.text ?? '';

  ctx?.reportStatus('Processing...');

  const response = await ollama.chat({
  model: 'gemma4:e4b',
    messages: [{ role: 'user', content: 'Hi!' }],
  });
  const output = response["message"]["content"];
  console.log(output);

  // Replace this with your agent logic
  return {
    artifacts: [{ data: output, mimeType: 'text/plain' }],
  };
}
