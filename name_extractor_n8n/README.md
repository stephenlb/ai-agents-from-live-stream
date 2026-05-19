# name_extractor (n8n)

n8n port of the `name_extractor` agent. Extracts names from input text using OpenAI function-calling.

## Workflow

`Webhook` → `OpenAI Extract Names` (HTTP Request to `/v1/responses`) → `Format Names` (Set node) → `Respond to Webhook`

## Import

1. In n8n: **Workflows → Import from File** → select `workflow.json`.
2. Open the **OpenAI Extract Names** node and assign your OpenAI credential.
3. Activate the workflow.

## Trigger

```bash
curl -X POST "$N8N_HOST/webhook/name-extractor" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello my name is Stephen Blum! My friends names are: Torva, Mohammed, Limon, Ahmed."}'
```

Response is `text/plain` — comma-separated names.
