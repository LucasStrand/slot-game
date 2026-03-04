// InfoBar: Balance, Last Win, Total Bet display
import { useEffect, useState, useRef } from "react";
import "./InfoBar.css";

interface InfoBarProps {
  balance: number;
  lastWin: number;
  totalBet: number;
  winMessage: string;
}

export function InfoBar({
  balance,
  lastWin,
  totalBet,
  winMessage,
}: InfoBarProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const animFrameRef = useRef<number>(0);

  // Animate balance count-up
  useEffect(() => {
    const start = displayBalance;
    const end = balance;
    const diff = end - start;

    if (Math.abs(diff) < 0.01) {
      // Use rAF to defer the setState to avoid synchronous update in effect
      animFrameRef.current = requestAnimationFrame(() => {
        setDisplayBalance(end);
      });
      return () => cancelAnimationFrame(animFrameRef.current);
    }

    const duration = Math.min(800, Math.abs(diff) * 20);
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(start + diff * eased);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [balance]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="info-bar">
      <div className="info-item">
        <span className="info-label">BALANCE</span>
        <span className="info-value balance-value">
          ${displayBalance.toFixed(2)}
        </span>
      </div>

      <div className="info-item center">
        {winMessage ? (
          <div className={`win-ticker ${lastWin > 0 ? "active" : ""}`}>
            <span className="win-ticker-text">{winMessage}</span>
          </div>
        ) : (
          <div className="info-divider">
            <span className="divider-dot"></span>
            <span className="divider-line"></span>
            <span className="divider-dot"></span>
          </div>
        )}
      </div>

      <div className="info-item">
        <span className="info-label">LAST WIN</span>
        <span
          className={`info-value win-value ${lastWin > 0 ? "highlight" : ""}`}
        >
          ${lastWin.toFixed(2)}
        </span>
      </div>

      <div className="info-item">
        <span className="info-label">TOTAL BET</span>
        <span className="info-value">${totalBet.toFixed(2)}</span>
      </div>
    </div>
  );
}
