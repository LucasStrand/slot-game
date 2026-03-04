// Control Panel: Spin button, bet controls, autoplay, max bet
import { useState, useRef, useEffect } from "react";
import type { GameState } from "../game/SlotGame";
import "./ControlPanel.css";

interface ControlPanelProps {
  state: GameState;
  betLevel: number;
  activeLines: number;
  autoSpinsRemaining: number;
  lastWin: number;
  balance: number;
  totalBet: number;
  onSpin: () => void;
  onBetChange: (delta: number) => void;
  onLineChange: (delta: number) => void;
  onMaxBet: () => void;
  onAutoSpin: (count: number) => void;
  onStopAuto: () => void;
  onGamble: () => void;
  onShowPaytable: () => void;
}

export function ControlPanel({
  state,
  betLevel,
  activeLines,
  autoSpinsRemaining,
  lastWin,
  balance,
  totalBet,
  onSpin,
  onBetChange,
  onLineChange,
  onMaxBet,
  onAutoSpin,
  onStopAuto,
  onGamble,
  onShowPaytable,
}: ControlPanelProps) {
  const [showAutoMenu, setShowAutoMenu] = useState(false);
  const autoMenuRef = useRef<HTMLDivElement>(null);
  const isIdle = state === "idle";
  const isSpinning = state === "spinning" || state === "stopping";
  const canGamble = isIdle && lastWin > 0;
  const canSpin = isIdle && balance >= totalBet;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        autoMenuRef.current &&
        !autoMenuRef.current.contains(e.target as Node)
      ) {
        setShowAutoMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && isIdle) {
        e.preventDefault();
        onSpin();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isIdle, onSpin]);

  return (
    <div className="control-panel">
      {/* Left controls */}
      <div className="controls-left">
        {/* Lines */}
        <div className="control-group">
          <span className="control-label">LINES</span>
          <div className="control-value-row">
            <button
              className="control-btn small"
              onClick={() => onLineChange(-1)}
              disabled={!isIdle}
              aria-label="Decrease lines"
            >
              −
            </button>
            <span className="control-value">{activeLines}</span>
            <button
              className="control-btn small"
              onClick={() => onLineChange(1)}
              disabled={!isIdle}
              aria-label="Increase lines"
            >
              +
            </button>
          </div>
        </div>

        {/* Bet */}
        <div className="control-group">
          <span className="control-label">BET</span>
          <div className="control-value-row">
            <button
              className="control-btn small"
              onClick={() => onBetChange(-1)}
              disabled={!isIdle}
              aria-label="Decrease bet"
            >
              −
            </button>
            <span className="control-value">${betLevel.toFixed(2)}</span>
            <button
              className="control-btn small"
              onClick={() => onBetChange(1)}
              disabled={!isIdle}
              aria-label="Increase bet"
            >
              +
            </button>
          </div>
        </div>

        {/* Max Bet */}
        <button
          className="control-btn accent"
          onClick={onMaxBet}
          disabled={!isIdle}
        >
          MAX BET
        </button>
      </div>

      {/* Center: Spin button */}
      <div className="controls-center">
        <button
          className={`spin-btn ${isSpinning ? "spinning" : ""} ${canSpin ? "" : "disabled"}`}
          onClick={autoSpinsRemaining > 0 ? onStopAuto : onSpin}
          disabled={!isIdle && autoSpinsRemaining <= 0}
        >
          <div className="spin-btn-inner">
            {autoSpinsRemaining > 0 ? (
              <>
                <span className="spin-text">STOP</span>
                <span className="spin-sub">{autoSpinsRemaining} left</span>
              </>
            ) : isSpinning ? (
              <span className="spin-text spinning-text">⟳</span>
            ) : (
              <>
                <span className="spin-text">SPIN</span>
                <span className="spin-sub">${totalBet.toFixed(2)}</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="controls-right">
        {/* Gamble */}
        <button
          className={`control-btn gamble ${canGamble ? "active" : ""}`}
          onClick={onGamble}
          disabled={!canGamble}
        >
          GAMBLE
        </button>

        {/* Auto */}
        <div className="auto-container" ref={autoMenuRef}>
          <button
            className="control-btn"
            onClick={() => setShowAutoMenu(!showAutoMenu)}
            disabled={!isIdle}
          >
            AUTO
          </button>
          {showAutoMenu && (
            <div className="auto-menu">
              {[10, 25, 50, 100].map((count) => (
                <button
                  key={count}
                  className="auto-option"
                  onClick={() => {
                    onAutoSpin(count);
                    setShowAutoMenu(false);
                  }}
                >
                  {count} Spins
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paytable */}
        <button className="control-btn info-btn" onClick={onShowPaytable}>
          ℹ
        </button>
      </div>
    </div>
  );
}
