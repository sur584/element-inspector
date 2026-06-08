import React, { useState } from 'react';

interface LastCopiedInfo {
  tagName: string;
  id: string | null;
  className: string | null;
  text: string | null;
  raw: string;
}

interface QuickSettingsProps {
  lastCopied: LastCopiedInfo | null;
  enabled: boolean;
}

const QuickSettings: React.FC<QuickSettingsProps> = ({ lastCopied, enabled }) => {
  const [copied, setCopied] = useState(false);

  const handleRecopy = async () => {
    if (!lastCopied) return;

    try {
      await navigator.clipboard.writeText(lastCopied.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable; fail silently
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const elementLabel = lastCopied
    ? buildElementLabel(lastCopied)
    : null;

  return (
    <div className="quick-settings">
      <div className="quick-settings__label">最近复制</div>
      <div className="quick-settings__card">
        {!enabled ? (
          <div className="quick-settings__empty">
            请先启用检查器
          </div>
        ) : !lastCopied ? (
          <div className="quick-settings__empty">
            悬停在元素上并复制
          </div>
        ) : (
          <div className="quick-settings__element">
            <div className="quick-settings__element-info">
              <div className="quick-settings__element-tag">
                &lt;{lastCopied.tagName}&gt;
              </div>
              <div className="quick-settings__element-detail">
                {elementLabel}
              </div>
            </div>
            <button
              className={`quick-settings__copy-btn ${copied ? 'quick-settings__copy-btn--copied' : ''}`}
              onClick={handleRecopy}
              title="重新复制到剪贴板"
            >
              {copied ? '已复制!' : '复制'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function buildElementLabel(info: LastCopiedInfo): string {
  const parts: string[] = [];

  if (info.id) {
    parts.push(`#${info.id}`);
  }
  if (info.className) {
    const classes = info.className.trim().split(/\s+/).slice(0, 3).join('.');
    if (classes) {
      parts.push(`.${classes}`);
    }
  }
  if (info.text) {
    const truncated = info.text.length > 40 ? info.text.slice(0, 40) + '...' : info.text;
    parts.push(`"${truncated}"`);
  }

  return parts.join(' ') || '(无额外信息)';
}

export default QuickSettings;
