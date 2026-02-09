import React, { useEffect, useRef, useState } from "react";
import { SlotGame } from "../game/SlotGame";
import { ControlPanel } from "./ControlPanel";
import "./GameStage.css";

export const GameStage: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<SlotGame | null>(null);
  const [balance, setBalance] = useState(1000);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const initGame = async () => {
      const game = new SlotGame(1280, 720, (newBalance) => {
        setBalance(newBalance);
      });
      gameInstanceRef.current = game;
      await game.initialize(gameContainerRef.current!);
    };

    if (!gameInstanceRef.current) {
      initGame();
    }

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.cleanUp();
        gameInstanceRef.current = null;
      }
    };
  }, []);

  const handleSpin = async () => {
    if (gameInstanceRef.current && !isSpinning) {
      setIsSpinning(true);
      await gameInstanceRef.current.spin();
      // Spin duration is handled inside game, but we need to know when it unlocks.
      // Simplified: Re-enable button after a set time or use a callback from game.
      // For now, let's assume game.spin() returns promise or we wait distinct time.
      // My SlotGame.spin is async but doesn't wait for completion. Use a timeout for UI.
      setTimeout(() => setIsSpinning(false), 3000);
    }
  };

  return (
    <div className="game-stage-container" ref={gameContainerRef}>
      <ControlPanel
        onSpin={handleSpin}
        balance={balance}
        disabled={isSpinning || balance < 10}
      />
    </div>
  );
};
