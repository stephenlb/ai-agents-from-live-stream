import { writeFile } from 'node:fs/promises';
import { TaskClient } from '@blocks-network/sdk';

const apiKey = process.env.BLOCKS_API_KEY;
if (!apiKey) {
  console.error('Set BLOCKS_API_KEY (run: blocks login --write-env or export it).');
  process.exit(1);
}

const cards = [
  { id: 'emberkit',     taskId: '87c4b97d-541e-4abb-ae7f-d0e27f40b77e' },
  { id: 'tidecaller',   taskId: '4496faf2-cb92-48d0-b8f7-84781d6470cf' },
  { id: 'verdantling',  taskId: '328160d7-c8e2-40e9-80e2-0d58073cefbf' },
  { id: 'stormhowl',    taskId: '8db97e16-d9e6-40b1-87f7-1f143cc2ca0f' },
  { id: 'frostpaw',     taskId: 'be28f4b5-ac9e-4b76-b5f6-6fbb8ef6feb0' },
  { id: 'cinderwing',   taskId: 'd888d958-a5bc-4afe-9d14-85ce1d0a8152' },
  { id: 'mossback',     taskId: '2c2d2d84-bcd9-48be-b31e-187e68d50317' },
  { id: 'voidstalker',  taskId: '86fde8ce-33d2-4874-9137-49ac136e4286' },
  { id: 'aetherwisp',   taskId: '54277f09-beb6-42d0-a287-d5f90d854839' },
  { id: 'boulderback',  taskId: '51a08c3d-0ad6-4b13-9d09-a7fda1d9882b' },
  { id: 'mirelurk',     taskId: '97d80954-4862-47bd-b4a8-597d78962fc1' },
  { id: 'sunblade',     taskId: '45f2f5a3-12a4-4616-8c00-43f4793c558b' },
];

const client = await TaskClient.create({ billingMode: 'paid', apiKey });

for (const card of cards) {
  process.stdout.write(`Downloading ${card.id}... `);
  const session = await client.connect({ taskId: card.taskId });
  const refs = session.listArtifacts();
  if (!refs.length) { console.log('NO ARTIFACTS'); continue; }
  const dl = await session.downloadArtifact(refs[0]);
  await writeFile(`./public/cards/${card.id}.png`, dl.data);
  console.log(`${dl.data.length} bytes`);
}

await client.destroy?.();
process.exit(0);
