/**
 * UI相关方法模块入口
 * @module DifyChat/ui
 * @author AI助手
 */

import { styles } from './styles.js';
import { elements } from './elements.js';
import { messages, forms } from './messages.js';
import { events } from './events.js';
import { layout } from './layout.js';
import { buttons } from './buttons.js';

// 合并所有UI相关模块
const UI = {
  ...styles,
  ...elements,
  ...messages,
  ...forms,
  ...events,
  ...layout,
  ...buttons
};

export { UI }; 