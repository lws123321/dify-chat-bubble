/**
 * API通信相关方法模块入口
 * @module DifyChat/api
 * @author AI助手
 */

import { request } from './request.js';
import { messages } from './messages.js';
import { response } from './response.js';
import { feedback } from './feedback.js';

// 合并所有API相关模块
const API = {
  ...request,
  ...messages,
  ...response,
  ...feedback
};

export { API }; 