/**
 * DOM操作工具函数
 * @module DifyChat/utils/dom
 * @author AI助手
 */

// DOM操作相关工具函数
const domUtils = {
  /**
   * 添加类名
   * @param {HTMLElement} element - 目标元素
   * @param {string} className - 要添加的类名
   */
  addClass(element, className) {
    if (!element) return;
    if (element.classList) {
      element.classList.add(className);
    } else {
      element.className += ' ' + className;
    }
  },

  /**
   * 移除类名
   * @param {HTMLElement} element - 目标元素
   * @param {string} className - 要移除的类名
   */
  removeClass(element, className) {
    if (!element) return;
    if (element.classList) {
      element.classList.remove(className);
    } else {
      element.className = element.className
        .replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  },

  /**
   * 检查元素是否有指定类名
   * @param {HTMLElement} element - 目标元素
   * @param {string} className - 要检查的类名
   * @returns {boolean} 是否有该类名
   */
  hasClass(element, className) {
    if (!element) return false;
    if (element.classList) {
      return element.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    }
  },

  /**
   * 切换类名
   * @param {HTMLElement} element - 目标元素
   * @param {string} className - 要切换的类名
   */
  toggleClass(element, className) {
    if (!element) return;
    if (element.classList) {
      element.classList.toggle(className);
    } else {
      if (this.hasClass(element, className)) {
        this.removeClass(element, className);
      } else {
        this.addClass(element, className);
      }
    }
  },

  /**
   * 获取元素计算样式
   * @param {HTMLElement} element - 目标元素
   * @param {string} prop - 样式属性
   * @returns {string} 计算后的样式值
   */
  getStyle(element, prop) {
    if (!element) return '';
    if (window.getComputedStyle) {
      return window.getComputedStyle(element, null)[prop];
    } else {
      return element.currentStyle[prop]; // IE8
    }
  },

  /**
   * 查询单个元素
   * @param {string} selector - CSS选择器
   * @param {HTMLElement|Document} context - 上下文元素
   * @returns {HTMLElement|null} 查询结果
   */
  querySelector(selector, context = document) {
    if (!context || !selector) return null;
    return context.querySelector(selector);
  },

  /**
   * 查询多个元素
   * @param {string} selector - CSS选择器
   * @param {HTMLElement|Document} context - 上下文元素
   * @returns {NodeList} 查询结果
   */
  querySelectorAll(selector, context = document) {
    if (!context || !selector) return [];
    return context.querySelectorAll(selector);
  },
  
  /**
   * 添加事件监听
   * @param {HTMLElement} element - 目标元素
   * @param {string} type - 事件类型
   * @param {Function} handler - 事件处理函数
   */
  addEvent(element, type, handler) {
    if (!element) return;
    if (element.addEventListener) {
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + type, handler);
    } else {
      element['on' + type] = handler;
    }
  },

  /**
   * 移除事件监听
   * @param {HTMLElement} element - 目标元素
   * @param {string} type - 事件类型
   * @param {Function} handler - 事件处理函数
   */
  removeEvent(element, type, handler) {
    if (!element) return;
    if (element.removeEventListener) {
      element.removeEventListener(type, handler, false);
    } else if (element.detachEvent) {
      element.detachEvent('on' + type, handler);
    } else {
      element['on' + type] = null;
    }
  }
};

export { domUtils }; 