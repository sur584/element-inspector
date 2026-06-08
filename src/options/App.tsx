import React, { useState, useEffect, useCallback } from 'react';
import type { UserConfig, CopyFormatId, VisibleFields, ShortcutConfig } from '../shared/types';
import { DEFAULT_CONFIG } from '../shared/constants';
import { storage } from '../shared/storage';
import InfoFieldConfig from './components/InfoFieldConfig';
import FormatConfig from './components/FormatConfig';
import ThemeSettings from './components/ThemeSettings';
import ShortcutConfigComponent from './components/ShortcutConfig';
import ImportExport from './components/ImportExport';

type TabId = 'fields' | 'format' | 'theme' | 'shortcuts' | 'advanced' | 'import-export';

const TABS: { id: TabId; label: string }[] = [
  { id: 'fields', label: '信息字段' },
  { id: 'format', label: '复制格式' },
  { id: 'theme', label: '覆盖层外观' },
  { id: 'shortcuts', label: '快捷键' },
  { id: 'advanced', label: '高级' },
  { id: 'import-export', label: '导入/导出' },
];

const App: React.FC = () => {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<TabId>('fields');
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Load config on mount
  useEffect(() => {
    storage.getConfig().then((c) => setConfig(c));
  }, []);

  // Show toast for 2.5 seconds
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Mark config as changed
  const markDirty = useCallback(() => setDirty(true), []);

  // --- Field change helpers ---
  const updateVisibleFields = (fields: VisibleFields) => {
    setConfig((prev) => ({ ...prev, visibleFields: fields }));
    markDirty();
  };

  const updateActiveFormats = (formats: CopyFormatId[]) => {
    setConfig((prev) => ({ ...prev, activeFormats: formats }));
    markDirty();
  };

  const updateDefaultFormat = (format: CopyFormatId) => {
    setConfig((prev) => ({ ...prev, defaultFormat: format }));
    markDirty();
  };

  const updateOverlay = (overlay: UserConfig['overlay']) => {
    setConfig((prev) => ({ ...prev, overlay }));
    markDirty();
  };

  const updateShortcuts = (shortcuts: ShortcutConfig) => {
    setConfig((prev) => ({ ...prev, shortcuts }));
    markDirty();
  };

  const updateAdvanced = (advanced: Partial<UserConfig['advanced']>) => {
    setConfig((prev) => ({ ...prev, advanced: { ...prev.advanced, ...advanced } }));
    markDirty();
  };

  // --- Save / Reset ---
  const handleSave = async () => {
    await storage.updateConfig(config);
    setDirty(false);
    showToast('配置已保存');
  };

  const handleReset = async () => {
    await storage.resetConfig();
    setConfig(DEFAULT_CONFIG);
    setDirty(false);
    showToast('已恢复默认配置');
  };

  const handleImport = async (imported: UserConfig) => {
    await storage.updateConfig(imported);
    setConfig(imported);
    setDirty(false);
    showToast('配置已导入');
  };

  // --- Advanced tab local state ---
  const excludeText = config.advanced.excludeSelectors.join('\n');

  const handleExcludeChange = (text: string) => {
    const selectors = text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    updateAdvanced({ excludeSelectors: selectors });
  };

  return (
    <div className="options-app">
      {/* Header */}
      <header className="options-header">
        <h1 className="options-header__title">
          <span className="options-header__icon">&#128269;</span>
          Element Inspector 设置
        </h1>
        <p className="options-header__desc">
          自定义悬停检查器的显示字段、复制格式和外观
        </p>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-nav__item${activeTab === tab.id ? ' tab-nav__item--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'fields' && (
          <InfoFieldConfig
            visibleFields={config.visibleFields}
            onChange={updateVisibleFields}
          />
        )}

        {activeTab === 'format' && (
          <FormatConfig
            activeFormats={config.activeFormats}
            defaultFormat={config.defaultFormat}
            onActiveFormatsChange={updateActiveFormats}
            onDefaultFormatChange={updateDefaultFormat}
          />
        )}

        {activeTab === 'theme' && (
          <ThemeSettings overlay={config.overlay} onChange={updateOverlay} />
        )}

        {activeTab === 'shortcuts' && (
          <ShortcutConfigComponent shortcuts={config.shortcuts} onChange={updateShortcuts} />
        )}

        {activeTab === 'advanced' && (
          <div className="card">
            <div className="card__title">高级设置</div>
            <div className="card__desc">调整底层行为参数</div>

            <div className="setting-row">
              <div>
                <div className="setting-row__label">包含 Shadow DOM</div>
                <div className="setting-row__desc">是否检查 Shadow DOM 内部元素</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  className="toggle-switch__input"
                  checked={config.advanced.includeShadowDom}
                  onChange={() =>
                    updateAdvanced({ includeShadowDom: !config.advanced.includeShadowDom })
                  }
                />
                <span className="toggle-switch__slider" />
              </label>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-row__label">节流间隔</div>
                <div className="setting-row__desc">鼠标移动事件的节流时间（毫秒）</div>
              </div>
              <div className="range-row">
                <input
                  type="range"
                  className="range-slider"
                  min={10}
                  max={200}
                  step={10}
                  value={config.advanced.throttleMs}
                  onChange={(e) => updateAdvanced({ throttleMs: Number(e.target.value) })}
                />
                <span className="range-value">{config.advanced.throttleMs}ms</span>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-row__label">最大文本长度</div>
                <div className="setting-row__desc">截断文本内容的最大字符数</div>
              </div>
              <div className="range-row">
                <input
                  type="range"
                  className="range-slider"
                  min={50}
                  max={1000}
                  step={50}
                  value={config.advanced.maxTextLength}
                  onChange={(e) => updateAdvanced({ maxTextLength: Number(e.target.value) })}
                />
                <span className="range-value">{config.advanced.maxTextLength}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div className="advanced-input-group">
                <label className="advanced-input-group__label">
                  排除的选择器（每行一个）
                </label>
                <textarea
                  className="advanced-textarea"
                  value={excludeText}
                  onChange={(e) => handleExcludeChange(e.target.value)}
                  placeholder="script&#10;style&#10;noscript"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import-export' && (
          <ImportExport
            config={config}
            onImport={handleImport}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="options-footer">
        <button className="btn btn--secondary" onClick={handleReset}>
          重置默认
        </button>
        <button className="btn btn--primary" disabled={!dirty} onClick={handleSave}>
          {dirty ? '保存设置' : '已保存'}
        </button>
      </footer>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default App;
