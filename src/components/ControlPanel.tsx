import React from "react";
import "./ControlPanel.css";

interface ControlPanelProps {
  onSpin: () => void;
  balance: number;
  disabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onSpin,
  balance,
  disabled,
}) => {
  return (
    <div className="control-panel">
      <div className="balance-display">
        <span className="label">BALANCE</span>
        <span className="value">${balance.toFixed(2)}</span>
      </div>

      <div className="controls-center">
        <button className="spin-button" onClick={onSpin} disabled={disabled}>
          SPIN
        </button>
      </div>

      <div className="bet-display">
        <span className="label">BET</span>
        <span className="value">$10.00</span>
      </div>
    </div>
  );
};
