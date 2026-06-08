import React, { useState } from 'react';
import type { ShortcutConfig as ShortcutConfigType } from '../../shared/types';

interface ShortcutConfigProps {
  shortcuts: ShortcutConfigType;
  onChange: (shortcuts: ShortcutConfigType) => void;
}

// 可配置的快捷键定义
const SHORTCUT_DEFINITIONS = [
  {
    key: 'toggle' as const,
    label: '切换检查器',
    description: '开启/关闭元素检查器',
    default: 'Ctrl+Shift+I',
    isMouse: false,
  },
  {
    key: 'copy' as const,
    label: '复制元素',
    description: '复制当前悬停元素的信息',
    default: 'C',
    isMouse: false,
  },
  {
    key: 'close' as const,
    label: '关闭检查器',
    description: '关闭元素检查器',
    default: 'Escape',
    isMouse: false,
  },
  {
    key: 'freeze' as const,
    label: '冻结元素',
    description: '冻结当前元素信息，鼠标移动不刷新',
    default: 'X',
    isMouse: false,
  },
];

const ShortcutConfig: React.FC<ShortcutConfigProps> = ({ shortcuts, onChange }) => {
  const [recording, setRecording] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleRecord = (key: string) => {
    setRecording(key);
    setTempValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;

    e.preventDefault();
    e.stopPropagation();

    // 忽略单独的功能键
    const ignoreKeys = ['Control', 'Shift', 'Alt', 'Meta'];
    if (ignoreKeys.includes(e.key)) return;

    let keyValue = '';

    // 组合键
    if (e.ctrlKey) keyValue += 'Ctrl+';
    if (e.altKey) keyValue += 'Alt+';
    if (e.shiftKey) keyValue += 'Shift+';
    if (e.metaKey) keyValue += 'Meta+';

    // 主键
    const mainKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    keyValue += mainKey;

    onChange({
      ...shortcuts,
      [recording]: keyValue,
    });
    setRecording(null);
  };

  const handleReset = (key: string) => {
    const def = SHORTCUT_DEFINITIONS.find(d => d.key === key);
    if (def) {
      onChange({
        ...shortcuts,
        [key]: def.default,
      });
    }
  };

  const handleResetAll = () => {
    const defaults: ShortcutConfigType = {
      toggle: 'Ctrl+Shift+I',
      copy: 'C',
      close: 'Escape',
      freeze: 'X',
    };
    onChange(defaults);
  };

  return (
    <div className="shortcut-config">
      <div className="shortcut-config__header">
        <h3>快捷键设置</h3>
        <button className="shortcut-config__reset-all" onClick={handleResetAll}>
          恢复默认
        </button>
      </div>

      <div className="shortcut-config__list">
        {SHORTCUT_DEFINITIONS.map((def) => (
          <div key={def.key} className="shortcut-config__item">
            <div className="shortcut-config__info">
              <div className="shortcut-config__label">{def.label}</div>
              <div className="shortcut-config__desc">{def.description}</div>
            </div>
            <div className="shortcut-config__control">
              {recording === def.key ? (
                <button
                  className="shortcut-config__input shortcut-config__input--recording"
                  onKeyDown={handleKeyDown}
                  onBlur={() => setRecording(null)}
                  autoFocus
                >
                  按下快捷键...
                </button>
              ) : (
                <>
                  <button
                    className="shortcut-config__input"
                    onClick={() => handleRecord(def.key)}
                    title="点击录制新快捷键"
                  >
                    {shortcuts[def.key]}
                  </button>
                  {shortcuts[def.key] !== def.default && (
                    <button
                      className="shortcut-config__reset"
                      onClick={() => handleReset(def.key)}
                      title="恢复默认"
                    >
                      ↺
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

      </div>

      <div className="shortcut-config__tips">
        <p>提示：点击快捷键框后，按下新的键组合即可修改。</p>
        <p>支持组合键：Ctrl + 字母 / Shift + 字母 / Alt + 字母</p>
        <p>Escape 键全局可用，切换检查器开关。冻结功能暂停鼠标移动时的信息刷新。</p>
      </div>
    </div>
  );
};

export default ShortcutConfig;
