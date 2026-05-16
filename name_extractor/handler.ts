import type { StartTaskMessage, TaskContext, HandlerResult } from '@blocks-network/sdk';
import OpenAI from "openai";

const tools = [{
    "type": "function",
    "name": "extract_names",
    "description": "Extract all names in the user message and return list array of names.",
    "parameters": {
        "type": "object",
        "properties": {
            "names": {
                "type": "array",
                "description": "Full name of a person, place or thing.",
                "items" : {
                    "name" : "The name of the person, place or thing.",
                }
            },
        },
        "required": ["names"],
    }
}];


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
    tools: tools,
    tool_choice: {"type": "function", "name": "extract_names"},
  });
  const output = response.output[0];
  const args = JSON.parse(output['arguments']);
  console.log(args);
  const names = args['names'].join(', ');

  ctx?.reportStatus('Processing...');

  // Replace this with your agent logic
  return {
    artifacts: [{ data: `${names}`, mimeType: 'text/plain' }],
  };
}
