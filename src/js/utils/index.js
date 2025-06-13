/**
 * 工具函数模块入口
 * @module DifyChat/utils
 * @author AI助手
 */

import { domUtils } from './dom.js';
import { formatHelpers } from './format.js';
import { generalUtils } from './general.js';

// 合并所有工具函数模块
const Utils = {
  ...domUtils,
  ...formatHelpers,
  ...generalUtils
};

export { Utils }; 