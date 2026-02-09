import { GameLogic } from "./game/GameLogic";
import { PAYLINES } from "./config/Paylines";

const runVerification = () => {
  console.log("Starting Logic Verification...");

  // 1. Test RNG
  const logic = new GameLogic(12345, 5); // Fixed seed
  console.log("RNG initialized with seed 12345");

  // 2. Simulate 100 spins
  let totalWins = 0;
  const spins = 100;

  console.log(`Simulating ${spins} spins...`);

  for (let i = 0; i < spins; i++) {
    const grid = logic.spin(5);
    const wins = logic.checkWins(grid);
    if (wins.length > 0) {
      // console.log(`Spin ${i}: Win!`, wins);
      wins.forEach((w) => (totalWins += w.amount));
    }
  }

  console.log(`Total amount won after ${spins} spins: ${totalWins}`);

  // 3. Test Payline Logic explicitly
  console.log("Testing Payline definitions...");
  // Create a grid that SHOULD win on line 0 (Middle row all 1s)
  // Line 0 is [1, 1, 1, 1, 1] -> Row index 1
  const winningGrid = [
    [0, 0, 0], // Reel 0
    [0, 0, 0], // Reel 1
    [0, 0, 0], // Reel 2
    [0, 0, 0], // Reel 3
    [0, 0, 0], // Reel 4
  ];
  // Set middle row to symbol ID 2
  for (let r = 0; r < 5; r++) winningGrid[r][1] = 2;

  // Note: GameLogic expects grid[reelIndex][rowIndex].
  // My manual construction above:
  // grid[0] = [0, 2, 0] ...

  const wins = logic.checkWins(winningGrid);
  const line0Win = wins.find((w) => w.lineIndex === 0);

  if (line0Win && line0Win.symbolId === 2 && line0Win.count === 5) {
    console.log("✅ Payline 0 detection passed (5x Symbol 2)");
  } else {
    console.error("❌ Payline 0 detection FAILED", wins);
  }

  console.log("Verification Complete.");
};

runVerification();
