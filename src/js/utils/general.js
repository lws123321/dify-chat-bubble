/**
 * 通用工具函数
 * @module DifyChat/utils/general
 * @author AI助手
 */

// 通用工具方法
const generalUtils = {
  /**
   * Object.assign的兼容实现
   * @param {Object} target - 目标对象
   * @param {...Object} sources - 源对象
   * @returns {Object} 合并后的对象
   */
  assign(target, ...sources) {
    if (target === undefined || target === null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    const output = Object(target);
    for (let source of sources) {
      if (source !== undefined && source !== null) {
        for (let nextKey in source) {
          if (Object.prototype.hasOwnProperty.call(source, nextKey)) {
            output[nextKey] = source[nextKey];
          }
        }
      }
    }
    return output;
  },

  /**
   * 防抖函数
   * @param {Function} func - 要执行的函数
   * @param {number} wait - 等待时间(ms)
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * 节流函数
   * @param {Function} func - 要执行的函数
   * @param {number} limit - 时间间隔(ms)
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  /**
   * 生成唯一ID
   * @param {string} prefix - ID前缀
   * @returns {string} 唯一ID
   */
  generateUniqueId(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 深度合并对象
   * @param {Object} target - 目标对象
   * @param {...Object} sources - 源对象
   * @returns {Object} 合并后的对象
   */
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.deepMerge(target, ...sources);
  },

  /**
   * 检查是否为对象
   * @param {any} item - 检查的项
   * @returns {boolean} 是否为对象
   */
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  },
  
  /**
   * 滚动到底部
   * @param {HTMLElement} container - 要滚动的容器元素
   */
  scrollToBottom(container) {
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  },
  
  /**
   * 检查浏览器是否支持flex布局
   * @returns {boolean} 是否支持flex
   */
  hasFlexSupport() {
    const div = document.createElement('div');
    const vendors = ['', '-webkit-', '-moz-', '-ms-', '-o-'];

    for (let i = 0; i < vendors.length; i++) {
      const prop = vendors[i] + 'flex';
      div.style.display = prop;
      if (div.style.display === prop) {
        return true;
      }
    }

    return false;
  }
};

export { generalUtils }; 