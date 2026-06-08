import React, { useState, useRef } from 'react';
import type { UserConfig } from '../../shared/types';
import { DEFAULT_CONFIG } from '../../shared/constants';

interface Props {
  config: UserConfig;
  onImport: (config: UserConfig) => void;
  onReset: () => void;
}

const ImportExport: React.FC<Props> = ({ config, onImport, onReset }) => {
  const [dialog, setDialog] = useState<null | 'reset' | 'import-error'>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'element-inspector-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        // Basic validation: check for required keys
        if (!parsed.visibleFields || !parsed.overlay || !parsed.advanced) {
          throw new Error('配置文件格式不正确，缺少必要字段');
        }
        onImport(parsed as UserConfig);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : '无法解析配置文件');
        setDialog('import-error');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const confirmReset = () => {
    setDialog(null);
    onReset();
  };

  return (
    <>
      <div className="card">
        <div className="ie-section">
          <div className="ie-section__icon">&#128190;</div>
          <div className="ie-section__title">导入 / 导出配置</div>
          <div className="ie-section__desc">
            导出当前配置为 JSON 文件备份，或从文件导入之前的配置
          </div>
          <div className="ie-actions">
            <button className="btn btn--primary btn--small" onClick={handleExport}>
              导出配置
            </button>
            <button className="btn btn--secondary btn--small" onClick={handleImportClick}>
              导入配置
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden-input"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="card">
        <div className="ie-section">
          <div className="ie-section__icon">&#9888;&#65039;</div>
          <div className="ie-section__title">恢复默认设置</div>
          <div className="ie-section__desc">
            将所有配置恢复为出厂默认值，此操作不可撤销
          </div>
          <div className="ie-actions">
            <button
              className="btn btn--danger btn--small"
              onClick={() => setDialog('reset')}
            >
              恢复默认
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {dialog === 'reset' && (
        <div className="dialog-overlay" onClick={() => setDialog(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog__title">确认恢复默认设置？</div>
            <div className="dialog__message">
              所有自定义配置将被清除，恢复为出厂默认值。建议先导出当前配置作为备份。
            </div>
            <div className="dialog__actions">
              <button className="btn btn--secondary btn--small" onClick={() => setDialog(null)}>
                取消
              </button>
              <button className="btn btn--danger btn--small" onClick={confirmReset}>
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Error Dialog */}
      {dialog === 'import-error' && (
        <div className="dialog-overlay" onClick={() => setDialog(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog__title">导入失败</div>
            <div className="dialog__message">{importError}</div>
            <div className="dialog__actions">
              <button className="btn btn--secondary btn--small" onClick={() => setDialog(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportExport;
