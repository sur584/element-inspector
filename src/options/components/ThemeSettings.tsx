import React from 'react';
import type { UserConfig } from '../../shared/types';

interface Props {
  overlay: UserConfig['overlay'];
  onChange: (overlay: UserConfig['overlay']) => void;
}

const ThemeSettings: React.FC<Props> = ({ overlay, onChange }) => {
  const update = <K extends keyof UserConfig['overlay']>(
    key: K,
    value: UserConfig['overlay'][K],
  ) => {
    onChange({ ...overlay, [key]: value });
  };

  return (
    <div className="card">
      <div className="card__title">覆盖层外观</div>
      <div className="card__desc">自定义悬停信息覆盖层的显示方式</div>

      <div className="setting-row">
        <div>
          <div className="setting-row__label">显示位置</div>
          <div className="setting-row__desc">覆盖层出现的位置</div>
        </div>
        <select
          className="select"
          value={overlay.position}
          onChange={(e) =>
            update('position', e.target.value as UserConfig['overlay']['position'])
          }
        >
          <option value="cursor">光标旁</option>
          <option value="element-top">元素上方</option>
          <option value="bottom-bar">底部栏</option>
        </select>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-row__label">主题</div>
          <div className="setting-row__desc">覆盖层的配色方案</div>
        </div>
        <select
          className="select"
          value={overlay.theme}
          onChange={(e) =>
            update('theme', e.target.value as UserConfig['overlay']['theme'])
          }
        >
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
          <option value="auto">跟随系统</option>
        </select>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-row__label">最大宽度</div>
          <div className="setting-row__desc">覆盖层的最大宽度</div>
        </div>
        <div className="range-row">
          <input
            type="range"
            className="range-slider"
            min={200}
            max={600}
            step={20}
            value={overlay.maxWidth}
            onChange={(e) => update('maxWidth', Number(e.target.value))}
          />
          <span className="range-value">{overlay.maxWidth}px</span>
        </div>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-row__label">高亮颜色</div>
          <div className="setting-row__desc">悬停时元素的高亮边框颜色</div>
        </div>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={overlay.highlightColor}
            onChange={(e) => update('highlightColor', e.target.value)}
          />
          <span className="color-picker__hex">{overlay.highlightColor}</span>
        </div>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-row__label">显示复制按钮</div>
          <div className="setting-row__desc">在覆盖层中显示快捷复制按钮</div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            className="toggle-switch__input"
            checked={overlay.showCopyButton}
            onChange={() => update('showCopyButton', !overlay.showCopyButton)}
          />
          <span className="toggle-switch__slider" />
        </label>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-row__label">高亮效果</div>
          <div className="setting-row__desc">悬停时是否高亮目标元素</div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            className="toggle-switch__input"
            checked={overlay.showHighlight}
            onChange={() => update('showHighlight', !overlay.showHighlight)}
          />
          <span className="toggle-switch__slider" />
        </label>
      </div>
    </div>
  );
};

export default ThemeSettings;
