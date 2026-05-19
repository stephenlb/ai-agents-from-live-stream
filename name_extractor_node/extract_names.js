#!/usr/bin/env node
import OpenAI from "openai";

const tools = [
  {
    type: "function",
    name: "extract_names",
    description: "Extract all names in the user message and return list array of names.",
    parameters: {
      type: "object",
      properties: {
        names: {
          type: "array",
          description: "Full name of a person, place or thing.",
          items: {
            type: "string",
            description: "The name of the person, place or thing.",
          },
        },
      },
      required: ["names"],
    },
  },
];

async function extractNames(text) {
  const client = new OpenAI();
  const response = await client.responses.create({
    model: "gpt-5.5",
    input: text,
    tools,
    tool_choice: { type: "function", name: "extract_names" },
  });
  const output = response.output[0];
  const args = JSON.parse(output.arguments);
  return args.names;
}

const text =
  process.argv.slice(2).join(" ") ||
  "Hello my name is Stephen Blum! My friends names are: Torva, Mohammed, OtherWork, Limon, Ahmed, Bogyatears, Looons, Peace, Rawvee, Vozicom, Inpulsor";

const names = await extractNames(text);
console.log(names.join(", "));
