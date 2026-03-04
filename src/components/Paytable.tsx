// Paytable: Modal showing symbols, payouts, paylines, and rules
import { SYMBOL_LIST, SYMBOLS, SymbolId } from "../config/symbols";
import { PAYLINES, PAYLINE_COLORS } from "../config/paylines";
import { GAME_CONFIG } from "../config/gameConfig";
import "./Paytable.css";

interface PaytableProps {
  onClose: () => void;
}

export function Paytable({ onClose }: PaytableProps) {
  return (
    <div className="paytable-overlay" onClick={onClose}>
      <div className="paytable-modal" onClick={(e) => e.stopPropagation()}>
        <button className="paytable-close" onClick={onClose}>
          ✕
        </button>
        <h2 className="paytable-title">PAYTABLE</h2>

        {/* Symbol Payouts */}
        <div className="paytable-section">
          <h3 className="section-title">SYMBOL PAYOUTS</h3>
          <div className="symbol-grid">
            {SYMBOL_LIST.map((sym) => (
              <div
                key={sym.id}
                className="symbol-card"
                style={{ borderColor: sym.color + "40" }}
              >
                <div className="symbol-emoji">{sym.emoji}</div>
                <div className="symbol-name" style={{ color: sym.color }}>
                  {sym.name}
                </div>
                {sym.type === "wild" && (
                  <div className="symbol-badge wild-badge">WILD</div>
                )}
                {sym.type === "scatter" && (
                  <div className="symbol-badge scatter-badge">SCATTER</div>
                )}
                <div className="symbol-payouts">
                  {Object.entries(sym.payouts).map(([count, mult]) => (
                    <div key={count} className="payout-row">
                      <span className="payout-count">×{count}</span>
                      <span className="payout-mult">{mult}x</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Symbols */}
        <div className="paytable-section">
          <h3 className="section-title">SPECIAL SYMBOLS</h3>
          <div className="special-info">
            <div className="special-card">
              <span className="special-emoji">
                {SYMBOLS[SymbolId.WILD].emoji}
              </span>
              <div className="special-text">
                <strong>Wild</strong> — Substitutes for all symbols except
                Scatter. Appears on all reels.
              </div>
            </div>
            <div className="special-card">
              <span className="special-emoji">
                {SYMBOLS[SymbolId.SCATTER].emoji}
              </span>
              <div className="special-text">
                <strong>Scatter (Diamond)</strong> — 3 or more anywhere trigger{" "}
                {GAME_CONFIG.FREE_SPIN_COUNT} Free Spins with{" "}
                {GAME_CONFIG.FREE_SPIN_MULTIPLIER}x multiplier! Free spins can
                be re-triggered.
              </div>
            </div>
          </div>
        </div>

        {/* Paylines */}
        <div className="paytable-section">
          <h3 className="section-title">PAYLINES ({PAYLINES.length})</h3>
          <div className="paylines-grid">
            {PAYLINES.map((pattern, i) => (
              <div key={i} className="payline-mini">
                <span className="payline-number">{i + 1}</span>
                <div className="payline-visual">
                  {pattern.map((row, col) => (
                    <div key={col} className="payline-col">
                      {[0, 1, 2].map((r) => (
                        <div
                          key={r}
                          className={`payline-cell ${r === row ? "active" : ""}`}
                          style={
                            r === row
                              ? {
                                  backgroundColor: `#${PAYLINE_COLORS[i].toString(16).padStart(6, "0")}`,
                                }
                              : {}
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="paytable-section">
          <h3 className="section-title">GAME RULES</h3>
          <ul className="rules-list">
            <li>All wins pay left to right on active paylines</li>
            <li>Scatter wins pay anywhere on the reels</li>
            <li>Only the highest win per payline is paid</li>
            <li>Wild substitutes for all symbols except Scatter</li>
            <li>Gamble feature: Double or nothing after any win</li>
            <li>Malfunction voids all pays and plays</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
