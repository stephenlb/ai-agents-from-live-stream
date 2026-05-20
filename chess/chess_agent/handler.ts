import type { StartTaskMessage, TaskContext, HandlerResult } from '@blocks-network/sdk';
import { Chess } from 'chess.js';
import { Stockfish } from '@se-oss/stockfish';

export default async function handler(
  task: StartTaskMessage,
  ctx?: TaskContext,
): Promise<HandlerResult> {
  ctx?.reportStatus('Parsing request input...');
  
  const input = task.requestParts?.[0];
  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  let difficulty = 10;

  if (input) {
    let jsonStr = '';
    if (typeof input === 'string') {
      jsonStr = input;
    } else if (typeof input === 'object' && 'text' in input && typeof input.text === 'string') {
      jsonStr = input.text;
    } else if (typeof input === 'object' && 'fen' in input) {
      fen = (input as any).fen;
      difficulty = (input as any).difficulty ?? 10;
    }

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        fen = parsed.fen ?? fen;
        difficulty = parsed.difficulty ?? difficulty;
      } catch (err) {
        ctx?.reportStatus('Failed to parse input JSON text, using default FEN/difficulty.');
      }
    }
  }
  
  ctx?.reportStatus(`Initializing Chess board with FEN: ${fen}`);
  
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch (err: any) {
    throw new Error(`Invalid FEN string: ${err.message ?? err}`);
  }
  
  if (chess.isGameOver()) {
    throw new Error('Game is already over');
  }

  ctx?.reportStatus('Initializing Stockfish AI engine...');
  const engine = new Stockfish();
  await engine.waitReady();
  
  ctx?.reportStatus(`Running Stockfish search (depth: ${difficulty})...`);
  const analysis = await engine.analyze(fen, difficulty);
  
  if (!analysis || !analysis.bestmove) {
    throw new Error('Stockfish failed to calculate a move');
  }
  
  const bestmove = analysis.bestmove;
  ctx?.reportStatus(`Best move found: ${bestmove}`);
  
  // Format the evaluation score from White's perspective
  let evaluation = '0.00';
  if (analysis.lines && analysis.lines[0] && analysis.lines[0].score) {
    const score = analysis.lines[0].score;
    const activeColor = fen.split(' ')[1]; // 'w' or 'b'
    
    if (score.type === 'cp') {
      let scoreVal = score.value / 100;
      // If black's turn, Stockfish score is relative to black.
      // Convert to white's perspective:
      if (activeColor === 'b') {
        scoreVal = -scoreVal;
      }
      evaluation = scoreVal >= 0 ? `+${scoreVal.toFixed(2)}` : `${scoreVal.toFixed(2)}`;
    } else if (score.type === 'mate') {
      let mateVal = score.value;
      if (activeColor === 'b') {
        mateVal = -mateVal;
      }
      evaluation = `M${mateVal > 0 ? '+' : ''}${mateVal}`;
    }
  }
  
  // Play the move on chess.js to get the updated FEN
  ctx?.reportStatus('Applying move to board...');
  const from = bestmove.slice(0, 2);
  const to = bestmove.slice(2, 4);
  const promotion = bestmove.length > 4 ? bestmove.charAt(4) : undefined;
  
  try {
    chess.move({ from, to, promotion });
  } catch (err: any) {
    throw new Error(`Stockfish returned an illegal move: ${bestmove}. Error: ${err.message ?? err}`);
  }
  
  const nextFen = chess.fen();
  
  ctx?.reportStatus('Move applied successfully.');
  
  const result = {
    bestMove: bestmove,
    fen: nextFen,
    evaluation: evaluation
  };
  
  return {
    artifacts: [
      {
        data: JSON.stringify(result),
        mimeType: 'application/json'
      }
    ]
  };
}
