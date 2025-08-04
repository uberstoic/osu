import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

type GameState = 'idle' | 'running' | 'finished';

const TIME_PER_TARGET = 2; // seconds
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
  const [timeLeft, setTimeLeft] = useState(TIME_PER_TARGET);
  const [score, setScore] = useState(0);
  const [topScores, setTopScores] = useState<number[]>(getTopScores());
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<number | null>(null);

  const randomPos = useCallback(() => {
    return {
      x: Math.random() * (BOARD_SIZE - TARGET_SIZE),
      y: Math.random() * (BOARD_SIZE - TARGET_SIZE),
    };
  }, []);

  const moveTarget = useCallback(() => {
    setTargetPos(randomPos());
  }, [randomPos]);

  const endGame = useCallback(() => {
    setGameState('finished');
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTopScores(saveScore(score));
  }, [score]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(TIME_PER_TARGET);
    setGameState('running');
    moveTarget();
  };

  useEffect(() => {
    if (gameState !== 'running') return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [gameState, endGame]);

  const handleTargetClick = () => {
    setScore((s) => s + 1);
    setTimeLeft(TIME_PER_TARGET);
    moveTarget();
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
              />
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
          <p>Time: {timeLeft}</p>
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
