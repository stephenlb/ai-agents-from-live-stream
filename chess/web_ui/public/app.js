import { Chess } from 'https://esm.sh/chess.js@1.0.0-beta.6';

// State Variables
let chess = new Chess();
let selectedSquare = null;
let legalMoves = [];
let difficulty = 10;
let playSide = 'w'; // 'w' or 'b'
let isAiThinking = false;
let lastMove = null; // { from, to }

// Web Audio API Sound Synthesizer
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  try {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'move') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'capture') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'check') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(650, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'gameover') {
      // Pleasant victory sweep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.linearRampToValueAtTime(523.25, now + 0.4); // C5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.warn('Audio failed to play:', err);
  }
}

// Elements
const chessboardEl = document.getElementById('chessboard');
const sliderEl = document.getElementById('difficulty-slider');
const sliderValEl = document.getElementById('difficulty-val');
const btnRestart = document.getElementById('btn-restart');
const btnOverlayRestart = document.getElementById('btn-overlay-restart');
const activeTurnEl = document.getElementById('active-turn');
const moveCountEl = document.getElementById('move-count');
const gameStatusEl = document.getElementById('game-status');
const evalBarEl = document.getElementById('eval-bar');
const evalTextEl = document.getElementById('eval-text');
const historyBody = document.getElementById('move-history-body');
const consoleOutput = document.getElementById('console-output');
const boardOverlay = document.getElementById('board-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');

// Logs console output
function log(msg, type = 'system') {
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
  consoleOutput.appendChild(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Translate piece code (e.g. 'wp', 'br') to PNG URL
function getPieceImgUrl(piece) {
  const color = piece.color; // 'w' or 'b'
  const type = piece.type.toUpperCase(); // 'P', 'R', 'N', 'B', 'Q', 'K'
  return `https://chessboardjs.com/img/chesspieces/wikipedia/${color}${type}.png`;
}

// Render Chessboard UI
function renderBoard() {
  chessboardEl.innerHTML = '';
  const board = chess.board();
  const kingInCheck = chess.inCheck();
  const activeColor = chess.turn();

  // Define ranks and files based on player color (flip board if playing Black)
  // board[0] is rank 8 (Black's side), board[7] is rank 1 (White's side)
  const ranks = playSide === 'w' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const files = playSide === 'w' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

  for (let r of ranks) {
    for (let f of files) {
      const squareName = String.fromCharCode(97 + f) + (8 - r); // e.g. 'e4'
      const piece = board[r][f];
      
      const squareEl = document.createElement('div');
      const isLight = (r + f) % 2 === 0;
      squareEl.className = `square ${isLight ? 'light' : 'dark'}`;
      squareEl.dataset.square = squareName;

      // Highlights
      if (selectedSquare === squareName) {
        squareEl.classList.add('selected');
      }
      if (lastMove && (lastMove.from === squareName || lastMove.to === squareName)) {
        squareEl.classList.add(lastMove.from === squareName ? 'highlight-from' : 'highlight-to');
      }
      
      // King check highlight
      if (kingInCheck && piece && piece.type === 'k' && piece.color === activeColor) {
        squareEl.classList.add('check');
      }

      // Render Piece
      if (piece) {
        const pieceEl = document.createElement('img');
        pieceEl.src = getPieceImgUrl(piece);
        pieceEl.alt = `${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`;
        pieceEl.className = 'piece';
        pieceEl.draggable = true;
        
        // Add events to handle click/drag
        pieceEl.addEventListener('click', (e) => {
          e.stopPropagation();
          handleSquareClick(squareName);
        });

        squareEl.appendChild(pieceEl);
        squareEl.classList.add('has-piece');
      } else {
        squareEl.addEventListener('click', () => handleSquareClick(squareName));
      }

      // Draw Legal Move Indicators
      const isLegal = legalMoves.find(m => m.to === squareName);
      if (isLegal) {
        const dot = document.createElement('div');
        dot.className = 'legal-indicator';
        squareEl.appendChild(dot);
        // Ensure legal indicator click registers correctly
        squareEl.addEventListener('click', (e) => {
          e.stopPropagation();
          handleSquareClick(squareName);
        });
      }

      chessboardEl.appendChild(squareEl);
    }
  }

  // Update game metrics
  activeTurnEl.innerText = activeColor === 'w' ? 'White' : 'Black';
  moveCountEl.innerText = Math.floor(chess.history().length / 2) + (chess.history().length % 2);
  
  if (chess.isGameOver()) {
    handleGameOver();
  } else {
    gameStatusEl.innerText = isAiThinking ? 'AI Thinking...' : 'Your Turn';
  }
}

// Select a piece or make a move
function handleSquareClick(squareName) {
  if (isAiThinking || chess.isGameOver()) return;

  // If clicked a legal move square, execute the move
  const targetMove = legalMoves.find(m => m.to === squareName);
  if (targetMove) {
    makeMove(targetMove);
    return;
  }

  // Otherwise, select piece of the current turn color
  const piece = chess.get(squareName);
  const activeColor = chess.turn();

  if (piece && piece.color === activeColor && activeColor === playSide) {
    selectedSquare = squareName;
    legalMoves = chess.moves({ square: squareName, verbose: true });
    initAudio(); // Initialize audio context on first user click
  } else {
    selectedSquare = null;
    legalMoves = [];
  }
  renderBoard();
}

// Make a move locally
function makeMove(moveData) {
  try {
    const isCapture = chess.get(moveData.to) !== null || (moveData.flags && moveData.flags.includes('e'));
    
    // Auto-promote pawns to Queen for simple Web UI
    const movePayload = {
      from: moveData.from,
      to: moveData.to
    };
    const piece = chess.get(moveData.from);
    if (piece && piece.type === 'p' && (moveData.to.endsWith('8') || moveData.to.endsWith('1'))) {
      movePayload.promotion = 'q';
    }

    const moveResult = chess.move(movePayload);
    if (!moveResult) return;

    lastMove = { from: moveData.from, to: moveData.to };
    selectedSquare = null;
    legalMoves = [];

    // Play sounds
    if (chess.inCheck()) {
      playSound('check');
    } else if (isCapture) {
      playSound('capture');
    } else {
      playSound('move');
    }

    log(`Player moved: ${moveResult.san}`, 'player');
    updateHistory();
    renderBoard();

    // Trigger AI Move if it's the AI's turn next
    if (chess.turn() !== playSide && !chess.isGameOver()) {
      triggerAiMove();
    }
  } catch (err) {
    console.error('Invalid move attempted:', err);
  }
}

// Submit move request to local server proxying to Blocks Agent
async function triggerAiMove() {
  isAiThinking = true;
  statusDot.className = 'status-dot loading';
  statusText.innerText = 'AI thinking...';
  log('Calling Stockfish Agent via Blocks CLI...', 'system');
  renderBoard();

  try {
    const response = await fetch('/api/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fen: chess.fen(),
        difficulty: difficulty
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server returned an error.');
    }

    const data = await response.json();
    
    if (data.bestMove) {
      // Bestmove is in UCI format (e.g. "e7e5", "g1f3")
      const from = data.bestMove.slice(0, 2);
      const to = data.bestMove.slice(2, 4);
      const promotion = data.bestMove.length > 4 ? data.bestMove.charAt(4) : undefined;
      
      const isCapture = chess.get(to) !== null;
      const aiMove = chess.move({ from, to, promotion });

      if (aiMove) {
        lastMove = { from, to };
        log(`Stockfish Agent moved: ${aiMove.san}`, 'agent');
        
        // Update Evaluation UI
        if (data.evaluation) {
          updateEvaluation(data.evaluation);
        }

        // Play sounds
        if (chess.inCheck()) {
          playSound('check');
        } else if (isCapture) {
          playSound('capture');
        } else {
          playSound('move');
        }

        updateHistory();
      } else {
        log(`Error: Agent returned illegal move ${data.bestMove}`, 'error');
      }
    } else {
      log('Error: Agent did not calculate a move.', 'error');
    }
  } catch (err) {
    log(`Network/Agent Error: ${err.message}`, 'error');
  } finally {
    isAiThinking = false;
    statusDot.className = 'status-dot';
    statusText.innerText = 'Connected';
    renderBoard();
  }
}

// Update Evaluation Bar UI
function updateEvaluation(evalStr) {
  evalTextEl.innerText = evalStr;
  
  let percentage = 50;
  if (evalStr.startsWith('M')) {
    // Mate imminent
    const mateIn = parseInt(evalStr.replace('M', '')) || 1;
    percentage = mateIn > 0 ? 100 : 0;
  } else {
    const score = parseFloat(evalStr);
    if (!isNaN(score)) {
      // Clamp evaluation to [-5.00, +5.00] for visual representation
      const clamped = Math.max(-5, Math.min(5, score));
      // Map [-5, 5] to [5%, 95%] percentage
      percentage = 50 + (clamped / 5) * 45;
    }
  }

  // Draw evaluation bar (White advantage takes more height from bottom)
  evalBarEl.style.height = `${percentage}%`;
  log(`Evaluation update: ${evalStr} (${Math.round(percentage)}% white)`, 'system');
}

// Populate the Move History Table
function updateHistory() {
  historyBody.innerHTML = '';
  const history = chess.history();
  
  for (let i = 0; i < history.length; i += 2) {
    const row = document.createElement('tr');
    
    const moveIndex = document.createElement('td');
    moveIndex.innerText = Math.floor(i / 2) + 1;
    row.appendChild(moveIndex);

    const whiteMove = document.createElement('td');
    whiteMove.innerText = history[i] || '';
    row.appendChild(whiteMove);

    const blackMove = document.createElement('td');
    blackMove.innerText = history[i+1] || '';
    row.appendChild(blackMove);

    // Highlight active/last row
    if (i === history.length - 1 || i === history.length - 2) {
      row.className = 'active-row';
    }

    historyBody.appendChild(row);
  }
  
  // Auto scroll table wrapper to bottom
  const wrapper = document.querySelector('.move-list-wrapper');
  wrapper.scrollTop = wrapper.scrollHeight;
}

// Handle Checkmate / Draw states
function handleGameOver() {
  boardOverlay.classList.remove('hidden');
  playSound('gameover');

  if (chess.isCheckmate()) {
    overlayTitle.innerText = 'Checkmate';
    const loser = chess.turn() === 'w' ? 'White' : 'Black';
    overlayMsg.innerText = `${loser} is checkmated. Game Over.`;
    gameStatusEl.innerText = `Checkmate! ${loser} loses.`;
    log(`Game Over: Checkmate. ${loser} loses.`, 'error');
  } else if (chess.isDraw()) {
    overlayTitle.innerText = 'Draw';
    let drawReason = 'Draw position reached.';
    if (chess.isStalemate()) drawReason = 'Stalemate reached.';
    else if (chess.isThreefoldRepetition()) drawReason = 'Draw by Threefold Repetition.';
    else if (chess.isInsufficientMaterial()) drawReason = 'Draw by Insufficient Material.';
    overlayMsg.innerText = drawReason;
    gameStatusEl.innerText = 'Game drawn.';
    log(`Game Over: ${drawReason}`, 'system');
  }
}

// Restart game
function initNewGame() {
  chess = new Chess();
  selectedSquare = null;
  legalMoves = [];
  lastMove = null;
  isAiThinking = false;
  
  boardOverlay.classList.add('hidden');
  evalBarEl.style.height = '50%';
  evalTextEl.innerText = '0.00';
  
  // Update state indicators
  statusDot.className = 'status-dot';
  statusText.innerText = 'Connected';
  
  log('New game initialized.', 'success');
  updateHistory();
  renderBoard();

  // If playing as Black, AI gets to make the first move!
  if (playSide === 'b') {
    triggerAiMove();
  }
}

// Event Listeners
sliderEl.addEventListener('input', (e) => {
  difficulty = parseInt(e.target.value);
  sliderValEl.innerText = difficulty;
});

btnRestart.addEventListener('click', () => {
  initNewGame();
});

btnOverlayRestart.addEventListener('click', () => {
  initNewGame();
});

// Play-side change triggers a restart
document.querySelectorAll('input[name="play-side"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    playSide = e.target.value;
    log(`Side changed to: ${playSide === 'w' ? 'White' : 'Black'}. Restarting game...`, 'success');
    initNewGame();
  });
});

// Setup drag and drop events (delegated on board container)
let draggedSquare = null;

chessboardEl.addEventListener('dragstart', (e) => {
  if (isAiThinking || chess.isGameOver()) {
    e.preventDefault();
    return;
  }
  const square = e.target.closest('.square');
  if (!square) return;

  const squareName = square.dataset.square;
  const piece = chess.get(squareName);
  const activeColor = chess.turn();

  if (piece && piece.color === activeColor && activeColor === playSide) {
    draggedSquare = squareName;
    selectedSquare = squareName;
    legalMoves = chess.moves({ square: squareName, verbose: true });
    e.target.classList.add('dragging');
    renderBoard();
  } else {
    e.preventDefault();
  }
});

chessboardEl.addEventListener('dragend', (e) => {
  if (e.target.classList.contains('piece')) {
    e.target.classList.remove('dragging');
  }
  draggedSquare = null;
});

chessboardEl.addEventListener('dragover', (e) => {
  e.preventDefault(); // Required to allow drop
});

chessboardEl.addEventListener('drop', (e) => {
  e.preventDefault();
  const square = e.target.closest('.square');
  if (!square || !draggedSquare) return;

  const targetSquare = square.dataset.square;
  const targetMove = legalMoves.find(m => m.to === targetSquare);

  if (targetMove) {
    makeMove(targetMove);
  } else {
    selectedSquare = null;
    legalMoves = [];
    renderBoard();
  }
  draggedSquare = null;
});

// Start the Dashboard
window.addEventListener('DOMContentLoaded', () => {
  initNewGame();
});
