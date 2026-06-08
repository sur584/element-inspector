import React from 'react';
import { sendMessage } from '../../shared/messaging';

interface TogglePanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const TogglePanel: React.FC<TogglePanelProps> = ({ enabled, onToggle }) => {
  const handleToggle = async () => {
    const newEnabled = !enabled;
    onToggle(newEnabled);

    try {
      await sendMessage({ type: 'TOGGLE_INSPECTOR', payload: { enabled: newEnabled } });
    } catch {
      // Content script may not be injected yet; ignore gracefully
    }
  };

  return (
    <div className="toggle-panel">
      <div>
        <div className="toggle-panel__label">元素检查器</div>
        <div className="toggle-panel__status">
          {enabled ? '检查器已开启' : '检查器已关闭'}
        </div>
      </div>
      <label className="toggle-switch">
        <input
          className="toggle-switch__input"
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          aria-label="Toggle element inspector"
        />
        <span className="toggle-switch__slider" />
      </label>
    </div>
  );
};

export default TogglePanel;
