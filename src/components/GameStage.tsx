// GameStage: React component that mounts the PixiJS canvas and overlays the HUD
import { useEffect, useRef, useState, useCallback } from "react";
import { SlotGame, type GameStateData } from "../game/SlotGame";
import { ControlPanel } from "./ControlPanel";
import { InfoBar } from "./InfoBar";
import { Paytable } from "./Paytable";
import "./GameStage.css";

export function GameStage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<SlotGame | null>(null);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let cancelled = false;

    // Create canvas dynamically so each mount gets a fresh WebGL context
    // (React StrictMode destroys+remounts, invalidating the old canvas's GL context)
    const canvas = document.createElement("canvas");
    canvas.id = "game-canvas";
    wrapper.insertBefore(canvas, wrapper.firstChild);

    const game = new SlotGame();
    gameRef.current = game;

    game.onStateChange = (state) => {
      if (!cancelled) {
        setGameState({ ...state });
      }
    };

    game.init(canvas).then(() => {
      if (cancelled) {
        game.destroy();
      }
    });

    return () => {
      cancelled = true;
      game.destroy();
      gameRef.current = null;
      canvas.remove();
    };
  }, []);

  const handleSpin = useCallback(() => {
    gameRef.current?.spin();
  }, []);

  const handleBetChange = useCallback((delta: number) => {
    gameRef.current?.changeBet(delta);
  }, []);

  const handleLineChange = useCallback((delta: number) => {
    gameRef.current?.changeLines(delta);
  }, []);

  const handleMaxBet = useCallback(() => {
    gameRef.current?.maxBet();
  }, []);

  const handleAutoSpin = useCallback((count: number) => {
    gameRef.current?.setAutoSpin(count);
  }, []);

  const handleStopAuto = useCallback(() => {
    gameRef.current?.stopAutoSpin();
  }, []);

  const handleGamble = useCallback(() => {
    gameRef.current?.gamble();
  }, []);

  return (
    <div className="game-stage">
      <div className="game-title">
        <span className="title-neon">NEON</span>
        <span className="title-fortune">FORTUNE</span>
      </div>

      <div className="canvas-wrapper" ref={wrapperRef}>
        {/* Win message overlay */}
        {gameState?.winMessage && gameState.state === "win_present" && (
          <div
            className={`win-overlay ${
              gameState.winMessage.includes("ULTRA")
                ? "ultra"
                : gameState.winMessage.includes("MEGA")
                  ? "mega"
                  : gameState.winMessage.includes("BIG")
                    ? "big"
                    : "regular"
            }`}
          >
            <div className="win-overlay-text">{gameState.winMessage}</div>
          </div>
        )}

        {/* Free spins indicator */}
        {gameState && gameState.freeSpinsRemaining > 0 && (
          <div className="free-spin-indicator">
            <div className="free-spin-badge">
              <span className="free-spin-count">
                {gameState.freeSpinsRemaining}
              </span>
              <span className="free-spin-label">FREE SPINS</span>
            </div>
            <div className="free-spin-total">
              Total Win: ${gameState.freeSpinTotalWin.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {gameState && (
        <>
          <InfoBar
            balance={gameState.balance}
            lastWin={gameState.lastWin}
            totalBet={gameState.totalBet}
            winMessage={gameState.winMessage}
          />
          <ControlPanel
            state={gameState.state}
            betLevel={gameState.betLevel}
            activeLines={gameState.activeLines}
            autoSpinsRemaining={gameState.autoSpinsRemaining}
            lastWin={gameState.lastWin}
            balance={gameState.balance}
            totalBet={gameState.totalBet}
            onSpin={handleSpin}
            onBetChange={handleBetChange}
            onLineChange={handleLineChange}
            onMaxBet={handleMaxBet}
            onAutoSpin={handleAutoSpin}
            onStopAuto={handleStopAuto}
            onGamble={handleGamble}
            onShowPaytable={() => setShowPaytable(true)}
          />
        </>
      )}

      {showPaytable && <Paytable onClose={() => setShowPaytable(false)} />}
    </div>
  );
}
