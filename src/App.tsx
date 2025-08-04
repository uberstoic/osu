import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

type GameState = 'idle' | 'running' | 'finished';

const BOARD_SIZE = 400;
const TARGET_SIZE = 40;
const STORAGE_KEY = 'osu_clicker_scores';

function getTopScores(): number[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveScore(score: number) {
  const scores = getTopScores();
  scores.push(score);
  scores.sort((a, b) => b - a);
  const top5 = scores.slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top5));
  return top5;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [targetLifetime, setTargetLifetime] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [topScores, setTopScores] = useState<number[]>(getTopScores());
  const timerRef = useRef<number | null>(null);

  const moveTarget = useCallback(() => {
    // Random lifetime from 2 to 4 seconds
    const newLifetime = Math.random() * 2 + 2;
    setTargetLifetime(newLifetime);
    setTimeLeft(newLifetime);

    const x = Math.random() * (BOARD_SIZE - TARGET_SIZE);
    const y = Math.random() * (BOARD_SIZE - TARGET_SIZE);
    setTargetPos({ x, y });
  }, []);

  const endGame = useCallback(() => {
    setGameState('finished');
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTopScores(saveScore(score));
  }, [score]);

  const startGame = () => {
    setScore(0);
    moveTarget();
    setGameState('running');
  };

  useEffect(() => {
    if (gameState !== 'running') return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          endGame();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [gameState, endGame]);

  const handleTargetClick = () => {
    // Score only if clicked within the last second
    if (timeLeft <= 1 && timeLeft > 0) {
      setScore((s) => s + 1);
      moveTarget();
    } else {
      // Optional: Add a penalty or visual feedback for clicking too early
      console.log('Too early!');
    }
  };

  return (
    <div className="container">
      <div className="game-wrapper">
        <div className="game-column">
          <h1>osu! Clicker</h1>
          <div
            className="board"
            style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
          >
            {gameState === 'running' && (
              <button
                className="target"
                style={{
                  left: targetPos.x,
                  top: targetPos.y,
                  width: TARGET_SIZE,
                  height: TARGET_SIZE,
                }}
                onClick={handleTargetClick}
              >
                <div
                  key={targetLifetime} // Reset animation on new target
                  className="approach-circle"
                  style={{ animationDuration: `${targetLifetime}s` }}
                />
              </button>
            )}
            {gameState === 'idle' && (
              <button className="start-btn" onClick={startGame}>
                Start
              </button>
            )}
            {gameState === 'finished' && (
              <div className="result">
                <p>Your score: {score}</p>
                <button onClick={startGame}>Play again</button>
              </div>
            )}
          </div>
        </div>

        <div className="info">
          <p>Time: {timeLeft.toFixed(2)}</p>
          <p>Score: {score}</p>

          <h3>Top 5</h3>
          <ol>
            {topScores.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
