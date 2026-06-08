import React from 'react';
import type { VisibleFields, InfoField } from '../../shared/types';
import { INFO_FIELDS } from '../../shared/constants';

const CATEGORY_LABELS: Record<string, string> = {
  basic: '基础信息',
  content: '内容信息',
  styles: '样式信息',
  structure: '结构信息',
  layout: '布局信息',
};

const FIELD_DESCRIPTIONS: Record<InfoField, string> = {
  tagName: 'HTML标签名称，如 div、span、button',
  id: '元素的 id 属性',
  className: '元素的 class 属性字符串',
  classList: '拆分后的类名数组',
  textContent: '元素内的纯文本内容',
  innerHTML: '元素内部的 HTML 代码',
  outerHTML: '包含元素自身的完整 HTML',
  computedStyles: '浏览器计算后的最终样式',
  inlineStyles: '直接写在 style 属性上的样式',
  pseudoElements: '::before 和 ::after 伪元素的内容',
  attributes: '元素的所有 HTML 属性',
  dataAttributes: 'data-* 开头的自定义属性',
  children: '直接子元素的标签名和类名',
  parent: '父元素的标签名、类名和 ID',
  selector: '指向该元素的 CSS 选择器路径',
  boundingBox: '元素的位置和尺寸信息',
};

interface Props {
  visibleFields: VisibleFields;
  onChange: (fields: VisibleFields) => void;
}

const InfoFieldConfig: React.FC<Props> = ({ visibleFields, onChange }) => {
  const categories = Array.from(new Set(INFO_FIELDS.map((f) => f.category)));

  const handleToggle = (fieldId: InfoField) => {
    onChange({
      ...visibleFields,
      [fieldId]: !visibleFields[fieldId],
    });
  };

  return (
    <div className="card">
      <div className="card__title">信息字段配置</div>
      <div className="card__desc">选择悬停时在覆盖层中显示哪些元素信息</div>

      {categories.map((cat) => (
        <div className="section" key={cat}>
          <div className="section__title">{CATEGORY_LABELS[cat] ?? cat}</div>
          {INFO_FIELDS.filter((f) => f.category === cat).map((field) => (
            <div className="field-item" key={field.id}>
              <div className="field-item__info">
                <div className="field-item__label">{field.label}</div>
                <div className="field-item__desc">{FIELD_DESCRIPTIONS[field.id]}</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  className="toggle-switch__input"
                  checked={visibleFields[field.id]}
                  onChange={() => handleToggle(field.id)}
                />
                <span className="toggle-switch__slider" />
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default InfoFieldConfig;
