import React from 'react';
import type { CopyFormatId } from '../../shared/types';
import { COPY_FORMATS } from '../../shared/constants';

const FORMAT_PREVIEWS: Record<CopyFormatId, string> = {
  'ai-friendly': `Element: <div>
ID: #app-container
Classes: .wrapper .flex .col
Text: Hello World
Selector: body > div#app-container.wrapper`,
  json: `{
  "tagName": "div",
  "id": "app-container",
  "classList": ["wrapper", "flex", "col"],
  "textContent": "Hello World"
}`,
  'html-snippet': `<div id="app-container" class="wrapper flex col">
  Hello World
</div>`,
  'css-selector': `Selector: body > div#app-container.wrapper.flex.col

Computed styles:
  display: flex
  flex-direction: column
  padding: 16px`,
};

interface Props {
  activeFormats: CopyFormatId[];
  defaultFormat: CopyFormatId;
  onActiveFormatsChange: (formats: CopyFormatId[]) => void;
  onDefaultFormatChange: (format: CopyFormatId) => void;
}

const FormatConfig: React.FC<Props> = ({
  activeFormats,
  defaultFormat,
  onActiveFormatsChange,
  onDefaultFormatChange,
}) => {
  const handleToggle = (formatId: CopyFormatId) => {
    if (activeFormats.includes(formatId)) {
      const next = activeFormats.filter((f) => f !== formatId);
      onActiveFormatsChange(next);
      // If disabling the default format, switch to first active
      if (formatId === defaultFormat && next.length > 0) {
        onDefaultFormatChange(next[0]);
      }
    } else {
      onActiveFormatsChange([...activeFormats, formatId]);
    }
  };

  return (
    <div className="card">
      <div className="card__title">复制格式配置</div>
      <div className="card__desc">启用或禁用复制格式，选择默认使用的格式</div>

      {COPY_FORMATS.map((fmt) => {
        const isActive = activeFormats.includes(fmt.id);
        const isDefault = defaultFormat === fmt.id;

        return (
          <div
            className={`format-item${isActive ? ' format-item--active' : ''}`}
            key={fmt.id}
          >
            <div className="format-item__toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  className="toggle-switch__input"
                  checked={isActive}
                  onChange={() => handleToggle(fmt.id)}
                />
                <span className="toggle-switch__slider" />
              </label>
            </div>
            <div className="format-item__content">
              <div className="format-item__header">
                <span className="format-item__label">{fmt.label}</span>
                {isDefault && (
                  <span className="format-item__default-badge">默认</span>
                )}
              </div>
              <div className="format-item__desc">{fmt.description}</div>
              {isActive && (
                <pre className="format-item__preview">{FORMAT_PREVIEWS[fmt.id]}</pre>
              )}
            </div>
            {isActive && !isDefault && (
              <button
                className="format-item__set-default"
                onClick={() => onDefaultFormatChange(fmt.id)}
              >
                设为默认
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FormatConfig;
