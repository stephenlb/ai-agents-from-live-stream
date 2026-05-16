import 'dotenv/config';
import { TaskClient, textPart, decodeInlineArtifact } from '@blocks-network/sdk';
import type { ProgressEvent, ArtifactEvent, TerminalEvent } from '@blocks-network/sdk';

/**
 * Trigger a task on the name_extractor agent and print the result.
 * Usage: npx tsx trigger.ts
 */
async function main() {
  const client = await TaskClient.create({
    billingMode: 'free',
    apiKey: process.env.BLOCKS_API_KEY!,
  });

  const session = await client.sendMessage({
    agentName: 'name_extractor',
    requestParts: [textPart('Hello my name is Stephen Blum! My friends names are: Torva, Mohammed, OtherWork, Limon, Ahmed, Bogyatears, Looons, Peace, Rawvee, Vozicom, Snot-123, Inpulsor', 'request')],
  });

  console.log('Task created:', session.taskId);

  session.onProgress((event: ProgressEvent) => {
    console.log('[progress]', event.message ?? event.progress ?? '');
  });
  session.onArtifact(async (event: ArtifactEvent) => {
    const ref = event.artifactRef;
    if (ref.kind === 'inline' && ref.data) {
      const bytes = decodeInlineArtifact(ref);
      console.log('[artifact]', new TextDecoder().decode(bytes));
    } else {
      const downloaded = await session.downloadArtifact(ref);
      console.log('[artifact]', new TextDecoder().decode(downloaded.data));
    }
  });
  session.onTerminal((_event: TerminalEvent) => {
    console.log('[done] Task complete');
    session.close();
    client.destroy();
    process.exit(0);
  });
}

main().catch(console.error);
