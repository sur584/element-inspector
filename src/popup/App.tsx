import React, { useState, useEffect } from 'react';
import type { CopyFormatId } from '../shared/types';
import { storage } from '../shared/storage';
import { onMessage } from '../shared/messaging';
import TogglePanel from './components/TogglePanel';
import FormatSelector from './components/FormatSelector';
import QuickSettings from './components/QuickSettings';

interface LastCopiedInfo {
  tagName: string;
  id: string | null;
  className: string | null;
  text: string | null;
  raw: string;
}

const App: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState<CopyFormatId>('ai-friendly');
  const [lastCopied, setLastCopied] = useState<LastCopiedInfo | null>(null);

  useEffect(() => {
    // Load saved configuration
    storage.getConfig().then((config) => {
      setEnabled(config.enabled);
      setDefaultFormat(config.defaultFormat);
    });

    // Restore last-copied element from storage
    chrome.storage.local.get('lastCopied').then((result) => {
      if (result.lastCopied) {
        setLastCopied(result.lastCopied);
      }
    });
  }, []);

  // Listen for COPY_ELEMENT messages from the content script
  useEffect(() => {
    const handler = (message: { type: string; payload?: LastCopiedInfo }) => {
      if (message.type === 'COPY_ELEMENT' && message.payload) {
        setLastCopied(message.payload);
      }
    };

    onMessage(handler);
  }, []);

  return (
    <div className="popup-app">
      <header className="popup-header">
        <span className="popup-header__icon">&#128269;</span>
        <h1 className="popup-header__title">元素检查器</h1>
      </header>

      <TogglePanel enabled={enabled} onToggle={setEnabled} />

      <div className="divider" />

      <FormatSelector defaultFormat={defaultFormat} onFormatChange={setDefaultFormat} />

      <div className="divider" />

      <QuickSettings lastCopied={lastCopied} enabled={enabled} />

      <footer className="popup-footer">
        <a
          className="popup-footer__link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
          }}
        >
          打开完整设置
        </a>
      </footer>
    </div>
  );
};

export default App;
