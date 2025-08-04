import { useState, useEffect, useCallback } from 'react';
import './App.css';

type GameState = 'idle' | 'running' | 'finished';

const BOARD_SIZE = 400;
const TARGET_SIZE = 40;
const ROUND_DURATION = 30;
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
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [topScores, setTopScores] = useState<number[]>(getTopScores());

  const moveTarget = useCallback(() => {
    const x = Math.random() * (BOARD_SIZE - TARGET_SIZE);
    const y = Math.random() * (BOARD_SIZE - TARGET_SIZE);
    setTargetPos({ x, y });
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(ROUND_DURATION);
    setGameState('running');
    moveTarget();
  };

  useEffect(() => {
    if (gameState !== 'running') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('finished');
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'finished') {
      setTopScores(saveScore(score));
    }
  }, [gameState, score]);

  const handleTargetClick = () => {
    setScore((s) => s + 1);
    moveTarget();
  };

  return (
    <div className="container">
      <div className="game-wrapper">
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
                  key={score} // Reset animation on new target
                  className="approach-circle"
                  style={{ animationDuration: `1s` }}
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
      </div>
    </div>
  );
}
