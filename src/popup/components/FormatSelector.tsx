import React from 'react';
import type { CopyFormatId } from '../../shared/types';
import { COPY_FORMATS } from '../../shared/constants';
import { storage } from '../../shared/storage';

interface FormatSelectorProps {
  defaultFormat: CopyFormatId;
  onFormatChange: (format: CopyFormatId) => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ defaultFormat, onFormatChange }) => {
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value as CopyFormatId;
    await storage.updateConfig({ defaultFormat: newFormat });
    onFormatChange(newFormat);
  };

  return (
    <div className="format-selector">
      <div className="format-selector__label">复制格式</div>
      <select
        className="format-selector__dropdown"
        value={defaultFormat}
        onChange={handleChange}
      >
        {COPY_FORMATS.map((format) => (
          <option key={format.id} value={format.id}>
            {format.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormatSelector;
