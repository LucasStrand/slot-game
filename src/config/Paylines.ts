// 5 Reels, 3 Rows (0, 1, 2)
// Each payline is an array of 5 integers representing the row index on each reel.

export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // 1. Middle
  [0, 0, 0, 0, 0], // 2. Top
  [2, 2, 2, 2, 2], // 3. Bottom
  [0, 1, 2, 1, 0], // 4. V shape
  [2, 1, 0, 1, 2], // 5. Inverted V
  [0, 0, 1, 0, 0], // 6. Top dip
  [2, 2, 1, 2, 2], // 7. Bottom bump
  [1, 0, 0, 0, 1], // 8. Middle to top
  [1, 2, 2, 2, 1], // 9. Middle to bottom
  [0, 1, 1, 1, 0], // 10. Top center
  [2, 1, 1, 1, 2], // 11. Bottom center
  [0, 1, 0, 1, 0], // 12. Zigzag top
  [2, 1, 2, 1, 2], // 13. Zigzag bottom
  [1, 0, 1, 0, 1], // 14. Center Zigzag A
  [1, 2, 1, 2, 1], // 15. Center Zigzag B
  [0, 1, 2, 2, 2], // 16. Top diagonal down
  [2, 1, 0, 0, 0], // 17. Bottom diagonal up
  [0, 2, 0, 2, 0], // 18. Wide Zigzag
  [2, 0, 2, 0, 2], // 19. Wide Zigzag Inverted
  [0, 0, 2, 0, 0], // 20. Top Drop
];
