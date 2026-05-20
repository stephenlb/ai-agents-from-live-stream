import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TaskClient } from '@blocks-network/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();
// Fallback to parent workspace directory or chess_agent directory if not found in current dir
dotenv.config({ path: path.resolve(__dirname, '../chess_agent/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to request chess engine move
app.post('/api/move', async (req: express.Request, res: express.Response) => {
  const { fen, difficulty } = req.body;

  if (!fen) {
    return res.status(400).json({ error: 'Missing required field: fen' });
  }

  const apiKey = process.env.BLOCKS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'BLOCKS_API_KEY not found in environment variables. Please run "blocks login --write-env" in the agent directory.'
    });
  }

  try {
    const client = await TaskClient.create({
      billingMode: 'free',
      apiKey: apiKey,
    });

    const session = await client.sendMessage({
      agentName: 'chess_agent',
      requestParts: [{
        partId: 'request',
        text: JSON.stringify({
          fen: fen,
          difficulty: Number(difficulty) || 10
        })
      }],
    });

    // Wait for the task to complete (timeout of 45 seconds)
    const terminal = await session.waitForTerminal(45_000);
    
    if (terminal.state !== 'completed') {
      await session.asyncClose();
      client.destroy();
      return res.status(500).json({ error: `Task execution failed with state: ${terminal.state}` });
    }

    // Retrieve the artifact containing the move result
    const artifacts = session.listArtifacts();
    if (artifacts.length === 0) {
      await session.asyncClose();
      client.destroy();
      return res.status(500).json({ error: 'No move evaluation artifact returned by the agent.' });
    }

    const downloaded = await session.downloadArtifact(artifacts[0]);
    const responseData = JSON.parse(new TextDecoder().decode(downloaded.data));

    await session.asyncClose();
    client.destroy();

    return res.json(responseData);
  } catch (err: any) {
    console.error('Error executing chess agent task:', err);
    return res.status(500).json({ error: err.message || 'An error occurred while calling the chess agent.' });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Chess UI server running at http://localhost:${port}`);
});
