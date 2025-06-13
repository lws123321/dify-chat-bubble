/**
 * AI聊天窗口模块核心
 * @module DifyChat/core
 * @author AI助手
 */

import { UI } from './ui/index.js';
import { API } from './api/index.js';
import { Utils } from './utils/index.js';

/**
 * @typedef {Object} XygChatOptions
 * @property {string} [title='AI助手'] - 对话框标题
 * @property {string} [baseUrl] - Dify API的基础URL，例如：http://dbc-deepseek.xinyiglass.com/v1
 * @property {string} [apiKey] - Dify API的密钥
 * @property {string} [user] - 用户标识，用于定义终端用户的身份
 * @property {string} [query] - 初始提问内容
 * @property {string} [conversation_id] - 会话ID，用于获取历史消息
 * @property {Object} [inputs] - 输入字段对象，将作为inputs参数传递给API
 * @property {string} [primaryColor='#009944'] - 主题色
 * @property {string} [hoverColor='#45a049'] - 悬浮按钮hover时的颜色
 * @property {number} [minWidth=300] - 聊天窗口最小宽度(px)
 * @property {number} [defaultWidth=500] - 聊天窗口默认宽度(px)
 * @property {number} [maxWidthPercent=75] - 聊天窗口最大宽度(窗口百分比)
 * @property {number} [height=80] - 聊天窗口高度(vh)，最大为86vh
 * @property {boolean} [readOnly=false] - 是否为只读模式
 */

class DifyChat {
  /**
   * 创建AI聊天组件
   * @param {XygChatOptions} options - 配置选项
   * @param {string} [options.opening_statement] - 自定义开场白，优先级高于/parameters接口返回的值
   * @param {Array<string>} [options.suggested_questions] - 自定义推荐问题列表，优先级高于/parameters接口返回的值
   */
  constructor(options) {
    // 保存用户传入的原始配置，用于判断用户是否明确设置了某个字段
    this._userOptions = options || {};
    
    // 兼容性处理：确保Object.assign可用
    this.options = Utils.assign(
      {
        title: 'AI助手',
        baseUrl: 'https://api.dify.ai/v1',
        apiKey: '',
        user: '',
        query: '', // 添加初始提问内容参数
        conversation_id: '', // 添加会话ID参数
        opening_statement: '', // 添加开场白配置参数
        suggested_questions: [], // 添加推荐问题配置参数
        primaryColor: '#009944',
        hoverColor: '#45a049',
        minWidth: 300,
        defaultWidth: 500,
        maxWidthPercent: 75,
        height: 80, // 设置默认高度，单位为vh
        readOnly: false // 添加只读模式参数
      },
      this._userOptions
    );

    // 初始化事件系统
    this._eventListeners = {};
    this._eventHooks = {};

    // 初始化表单更新控制标记
    this._skipFormUpdateFlag = false;

    // 确保inputs对象存在
    if (!this.options.inputs) {
      this.options.inputs = {};
    }

    // 兼容旧版本参数
    if (options && options.userId) {
      this.options.user = options.userId;
    }

    if (options && options.user_id) {
      this.options.user = options.user_id;
    }

    if (options && options.initialQuery) {
      this.options.query = options.initialQuery;
    }

    if (options && options.message) {
      this.options.query = options.message;
    }

    if (!this.options.apiKey) {
      throw new Error('apiKey is required');
    }

    this.isInitialized = false;
    this.hasInitialQuerySent = false; // 添加标志，跟踪是否已发送初始查询
    this.hasHistoryLoaded = false; // 添加标志，跟踪是否已加载历史消息
    this.elements = {};
    this.conversation = {
      id: this.options.conversation_id || null, // 使用传入的会话ID
      messages: []
    };

    // 图标SVG - 默认聊天图标
    this.chatIconSVG = `<svg id="openIcon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.7586 2L16.2412 2C17.0462 1.99999 17.7105 1.99998 18.2517 2.04419C18.8138 2.09012 19.3305 2.18868 19.8159 2.43598C20.5685 2.81947 21.1804 3.43139 21.5639 4.18404C21.8112 4.66937 21.9098 5.18608 21.9557 5.74818C21.9999 6.28937 21.9999 6.95373 21.9999 7.7587L22 14.1376C22.0004 14.933 22.0007 15.5236 21.8636 16.0353C21.4937 17.4156 20.4155 18.4938 19.0352 18.8637C18.7277 18.9461 18.3917 18.9789 17.9999 18.9918L17.9999 20.371C18 20.6062 18 20.846 17.9822 21.0425C17.9651 21.2305 17.9199 21.5852 17.6722 21.8955C17.3872 22.2525 16.9551 22.4602 16.4983 22.4597C16.1013 22.4593 15.7961 22.273 15.6386 22.1689C15.474 22.06 15.2868 21.9102 15.1031 21.7632L12.69 19.8327C12.1714 19.4178 12.0174 19.3007 11.8575 19.219C11.697 19.137 11.5262 19.0771 11.3496 19.0408C11.1737 19.0047 10.9803 19 10.3162 19H7.75858C6.95362 19 6.28927 19 5.74808 18.9558C5.18598 18.9099 4.66928 18.8113 4.18394 18.564C3.43129 18.1805 2.81937 17.5686 2.43588 16.816C2.18859 16.3306 2.09002 15.8139 2.0441 15.2518C1.99988 14.7106 1.99989 14.0463 1.9999 13.2413V7.75868C1.99989 6.95372 1.99988 6.28936 2.0441 5.74818C2.09002 5.18608 2.18859 4.66937 2.43588 4.18404C2.81937 3.43139 3.43129 2.81947 4.18394 2.43598C4.66928 2.18868 5.18598 2.09012 5.74808 2.04419C6.28927 1.99998 6.95364 1.99999 7.7586 2ZM10.5073 7.5C10.5073 6.67157 9.83575 6 9.00732 6C8.1789 6 7.50732 6.67157 7.50732 7.5C7.50732 8.32843 8.1789 9 9.00732 9C9.83575 9 10.5073 8.32843 10.5073 7.5ZM16.6073 11.7001C16.1669 11.3697 15.5426 11.4577 15.2105 11.8959C15.1488 11.9746 15.081 12.0486 15.0119 12.1207C14.8646 12.2744 14.6432 12.4829 14.3566 12.6913C13.7796 13.111 12.9818 13.5001 12.0073 13.5001C11.0328 13.5001 10.235 13.111 9.65799 12.6913C9.37138 12.4829 9.15004 12.2744 9.00274 12.1207C8.93366 12.0486 8.86581 11.9745 8.80418 11.8959C8.472 11.4577 7.84775 11.3697 7.40732 11.7001C6.96549 12.0314 6.87595 12.6582 7.20732 13.1001C7.20479 13.0968 7.21072 13.1043 7.22094 13.1171C7.24532 13.1478 7.29407 13.2091 7.31068 13.2289C7.36932 13.2987 7.45232 13.3934 7.55877 13.5045C7.77084 13.7258 8.08075 14.0172 8.48165 14.3088C9.27958 14.8891 10.4818 15.5001 12.0073 15.5001C13.5328 15.5001 14.735 14.8891 15.533 14.3088C15.9339 14.0172 16.2438 13.7258 16.4559 13.5045C16.5623 13.3934 16.6453 13.2987 16.704 13.2289C16.7333 13.1939 16.7567 13.165 16.7739 13.1432C17.1193 12.6969 17.0729 12.0493 16.6073 11.7001ZM15.0073 6C15.8358 6 16.5073 6.67157 16.5073 7.5C16.5073 8.32843 15.8358 9 15.0073 9C14.1789 9 13.5073 8.32843 13.5073 7.5C13.5073 6.67157 14.1789 6 15.0073 6Z" fill="white"></path>
    </svg>`;

    // 将工具模块的函数添加到实例中，统一使用下划线前缀
    this._addClass = Utils.addClass;
    this._removeClass = Utils.removeClass;
    this._hasClass = Utils.hasClass;
    this._toggleClass = Utils.toggleClass;
    this._getStyle = Utils.getStyle;
    this._querySelector = Utils.querySelector;
    this._querySelectorAll = Utils.querySelectorAll;
    this._debounce = Utils.debounce;
    this._throttle = Utils.throttle;
    this._addEvent = Utils.addEvent || function(element, type, handler) {
      if (!element) return;
      if (element.addEventListener) {
        element.addEventListener(type, handler, false);
      } else if (element.attachEvent) {
        element.attachEvent('on' + type, handler);
      } else {
        element['on' + type] = handler;
      }
    };
    this._removeEvent = Utils.removeEvent || function(element, type, handler) {
      if (!element) return;
      if (element.removeEventListener) {
        element.removeEventListener(type, handler, false);
      } else if (element.detachEvent) {
        element.detachEvent('on' + type, handler);
      } else {
        element['on' + type] = null;
      }
    };
    this._scrollToBottom = Utils.scrollToBottom || function(container) {
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    };
    this._generateUniqueId = Utils.generateUniqueId;
    this._deepMerge = Utils.deepMerge;
    this._isObject = Utils.isObject;
    this._hasFlexSupport = Utils.hasFlexSupport || function() {
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
    };

    // 混入各模块的方法（不包括Utils，已单独处理）
    Object.assign(this, UI, API);
  }

  /**
   * 检查用户是否明确设置了某个配置字段
   * @param {string} fieldName - 字段名
   * @returns {boolean} 是否明确设置了有效值
   * @example
   * // 检查用户是否明确设置了标题
   * if (this._isUserProvided('title')) {
   *   // 使用用户设置的标题
   * } else {
   *   // 使用默认或从API获取的标题
   * }
   * @private
   */
  _isUserProvided(fieldName) {
    const hasProperty = this._userOptions && this._userOptions.hasOwnProperty(fieldName);
    const value = hasProperty ? this._userOptions[fieldName] : undefined;
    // 不仅要有属性，还要有有效值（不是undefined或null，空字符串算有效值）
    const hasValidValue = hasProperty && value !== undefined && value !== null;
    return hasValidValue;
  }

  /**
   * 显示图片预览的全局方法
   * @param {string} imgSrc - 图片地址
   * @static
   */
  static _showImagePreview(imgSrc) {
    // 创建模态框
    const modalElement = document.createElement('div');
    modalElement.className = 'xyg-chat-img-modal';
    modalElement.setAttribute('data-xyg-chat-img-modal', 'true');

    // 防止事件传播到下层
    const stopAllEvents = function (e) {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      return false; // 阻止默认行为和事件冒泡
    };

    // 创建关闭按钮
    const closeButton = document.createElement('div');
    closeButton.className = 'xyg-chat-img-modal-close';
    closeButton.innerHTML = '&times;';

    // 关闭模态框的函数，确保不触发其他事件
    const safeCloseModal = function (e) {
      if (e) {
        stopAllEvents(e);
      }

      // 恢复body的overflow
      document.body.style.overflow = originalBodyOverflow;

      // 先移除所有事件监听器
      modalElement.removeEventListener('click', modalClickHandler);
      modalElement.removeEventListener('wheel', wheelHandler);
      document.removeEventListener('keydown', escHandler);

      // 安全地移除模态框
      if (document.body.contains(modalElement)) {
        document.body.removeChild(modalElement);
      }
    };

    // 设置关闭按钮事件
    closeButton.addEventListener('click', safeCloseModal);

    // 创建图片容器
    const imgContainer = document.createElement('div');
    imgContainer.className = 'xyg-chat-img-modal-container';

    // 创建图片元素
    const imgElement = document.createElement('img');
    imgElement.className = 'xyg-chat-img-modal-content';
    imgElement.src = imgSrc;

    // 创建缩放提示
    const zoomInfo = document.createElement('div');
    zoomInfo.className = 'xyg-chat-img-modal-zoom-info';
    zoomInfo.textContent = '使用鼠标滚轮放大/缩小';

    // 缩放相关变量
    let scale = 1;
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;

    // 组装模态框
    imgContainer.appendChild(imgElement);
    modalElement.appendChild(closeButton);
    modalElement.appendChild(imgContainer);
    modalElement.appendChild(zoomInfo);

    // 记录body当前的overflow
    const originalBodyOverflow = document.body.style.overflow;
    // 设置body的overflow为hidden，防止背景滚动
    document.body.style.overflow = 'hidden';

    // 为所有内部元素添加事件阻止
    imgElement.addEventListener('click', stopAllEvents);
    imgContainer.addEventListener('click', stopAllEvents);
    zoomInfo.addEventListener('click', stopAllEvents);

    // 模态框点击事件 - 只在点击背景时关闭
    const modalClickHandler = function (e) {
      // 确保点击的是模态框背景，而不是其中的元素
      if (e.target === modalElement) {
        safeCloseModal(e);
      } else {
        // 其他元素的点击都需要阻止传播
        stopAllEvents(e);
      }
    };

    // 鼠标滚轮缩放事件处理
    const wheelHandler = function (e) {
      stopAllEvents(e);

      // 根据滚轮方向调整缩放比例
      if (e.deltaY < 0) {
        // 向上滚动，放大
        scale = Math.min(scale * 1.1, MAX_SCALE);
      } else {
        // 向下滚动，缩小
        scale = Math.max(scale * 0.9, MIN_SCALE);
      }

      // 应用缩放
      imgElement.style.transform = `scale(${scale})`;
    };

    // 按ESC键关闭模态框
    const escHandler = function (e) {
      if (e.key === 'Escape') {
        safeCloseModal(e);
      }
    };

    // 添加事件监听
    modalElement.addEventListener('click', modalClickHandler);
    modalElement.addEventListener('wheel', wheelHandler);
    document.addEventListener('keydown', escHandler);

    // 添加到body
    document.body.appendChild(modalElement);
  }

  /**
   * 初始化聊天组件
   * @returns {Promise<DifyChat>} 实例自身，支持链式调用
   */
  async init() {
    if (this.isInitialized) return this;

    this._createElements();
    this._createStyles();
    this._bindEvents();

    // 设置全局实例引用，以便流式输出时可以访问到实例方法
    // 保持XygChat类的静态方法可访问，使用单独的变量存储实例
    window.xygChatInstance = this;

    // 获取应用参数和元信息
    try {
      await this._fetchAppParameters();
      // await this._fetchAppMeta();
      await this._fetchWebappInfo();
      await this._fetchAppInfo();

      // 设置聊天窗口标题：优先使用用户明确设置的标题，否则使用从API获取的应用名称
      const userProvidedTitle = this._isUserProvided('title');
      
      if (userProvidedTitle) {
        // 用户明确设置了标题，使用用户设置的标题
        this.elements.title.textContent = this.options.title;
      } else {
        // 用户没有设置标题，优先使用从API获取的应用名称
        const appTitle = (this.appInfo && this.appInfo.name) || (this.webappInfo && this.webappInfo.title);
        if (appTitle) {
          this.elements.title.textContent = appTitle;
          // 同时更新options中的title，保持一致性
          this.options.title = appTitle;
        } else {
          // 如果API没有返回标题信息，则使用默认标题
          const defaultTitle = this.options.title || 'AI助手';
          this.elements.title.textContent = defaultTitle;
        }
      }

      // 渲染用户输入表单（如果有配置）
      this._renderUserInputForm();

      // 在非只读模式下渲染引导信息和推荐问题
      if (!this.options.readOnly) {
        this._renderIntroduction();
      }

      // 不再在init方法中发送初始查询，移到open方法中
    } catch (error) {
      console.error('初始化聊天组件时出错:', error);
    }

    this.isInitialized = true;
    return this;
  }

  /**
   * 渲染引导信息和推荐问题
   * 优先级顺序：
   * 1. 用户传入的 options.opening_statement 和 options.suggested_questions
   * 2. /parameters 接口获取的 opening_statement 和 suggested_questions
   * @private
   */
  _renderIntroduction() {
    // 只读模式下不显示引导信息
    if (this.options.readOnly) return;

    // 优先使用用户传入的配置，如果没有则使用API接口获取的配置
    let opening_statement = '';
    let suggested_questions = [];

    // 检查用户是否传入了开场白配置
    if (this._isUserProvided('opening_statement') && this.options.opening_statement) {
      opening_statement = this.options.opening_statement;
    } else if (this.appParameters && this.appParameters.opening_statement) {
      opening_statement = this.appParameters.opening_statement;
    }

    // 检查用户是否传入了推荐问题配置
    if (this._isUserProvided('suggested_questions') && Array.isArray(this.options.suggested_questions) && this.options.suggested_questions.length > 0) {
      suggested_questions = this.options.suggested_questions;
    } else if (this.appParameters && this.appParameters.suggested_questions && Array.isArray(this.appParameters.suggested_questions)) {
      suggested_questions = this.appParameters.suggested_questions;
    }

    // 如果没有开场白或推荐问题，直接返回
    if (
      !opening_statement &&
      (!suggested_questions || !suggested_questions.length)
    )
      return;

    // 如果有开场白，使用_addMessage方法创建带头像的消息
    if (opening_statement) {
      this._addMessage(opening_statement, 'assistant', false);
      
      // 获取刚添加的消息容器，为其添加开场白特殊样式
      const lastMessageContainer = this.elements.messagesContainer.lastElementChild;
      if (lastMessageContainer) {
        lastMessageContainer.classList.add('xyg-chat-opening-message');
      }
    }

    // 添加推荐问题按钮
    if (suggested_questions && suggested_questions.length > 0) {
      const suggestionsContainer = document.createElement('div');
      suggestionsContainer.className = 'xyg-chat-suggestions';

      suggested_questions.forEach((question) => {
        const button = document.createElement('button');
        button.className = 'xyg-chat-suggestion-btn';
        button.textContent = question;
        button.addEventListener('click', () => {
          this._sendMessage(question);
        });
        suggestionsContainer.appendChild(button);
      });

      // 将推荐问题添加到开场白消息中，或者作为独立容器
      if (opening_statement) {
        // 如果有开场白，将推荐问题添加到开场白消息的消息元素中
        const lastMessageContainer = this.elements.messagesContainer.lastElementChild;
        const messageElement = lastMessageContainer.querySelector('.xyg-chat-message');
        if (messageElement) {
          messageElement.appendChild(suggestionsContainer);
        }
      } else {
        // 如果没有开场白，直接添加到消息容器
        this.elements.messagesContainer.appendChild(suggestionsContainer);
      }
    }

    this._scrollToBottom();
  }

  /**
   * 打开聊天窗口
   * @public
   */
  open() {
    if (!this.isInitialized) {
      console.warn('聊天组件尚未初始化，请先调用init()方法');
      return this.init().then(() => this.open());
    }

    this.elements.chatContainer.style.display = 'block';
    setTimeout(() => {
      this._addClass(this.elements.chatContainer, 'xyg-chat-show');
      this._addClass(document.body, 'xyg-chat-open');

      // 设置焦点到输入框
      setTimeout(() => {
        if (this.elements.messageInput) {
          this.elements.messageInput.focus();
        }
      }, 300);

      this._scrollToBottom();

      // 如果有会话ID，则先加载历史消息
      if (
        this.options.conversation_id &&
        !this.hasHistoryLoaded &&
        this.options.user
      ) {
        // 加载历史消息
        this._fetchChatHistory().then(() => {
          // 如果有初始提问内容，填充到输入框而不是自动发送
          if (this.options.query && this.options.query.trim()) {
            if (this.elements.messageInput) {
              this.elements.messageInput.value = this.options.query;
              this._adjustTextareaHeight(); // 调整输入框高度
            }
          }
        });
      } else {
        // 没有会话ID，走原来的逻辑，如果有初始查询且尚未发送过，自动发送初始查询
        if (
          this.options.query &&
          this.options.query.trim() &&
          !this.hasInitialQuerySent &&
          this.conversation.messages.length === 0
        ) {
          setTimeout(() => {
            this._sendMessage(this.options.query);
            this.hasInitialQuerySent = true; // 标记已发送初始查询
          }, 500);
        }
      }
    }, 10);

    return this;
  }

  /**
   * 关闭聊天窗口
   * @public
   */
  close() {
    this._removeClass(this.elements.chatContainer, 'xyg-chat-show');
    this._removeClass(document.body, 'xyg-chat-open');

    // 延迟完全隐藏元素，以便于过渡动画完成
    setTimeout(() => {
      this.elements.chatContainer.style.display = 'none';
    }, 300);

    return this;
  }

  /**
   * 重置会话
   * @public
   */
  reset() {
    // 清理ECharts图表资源
    this._cleanupEChartsCharts();
    
    // 清理思考元素（额外安全措施）
    this._cleanupThinkingElements();
    
    // 清空消息容器
    if (this.elements.messagesContainer) {
      this.elements.messagesContainer.innerHTML = '';
    }

    // 重置对话ID (如果是从参数传入的会话ID，则保留)
    if (!this.options.conversation_id) {
      this.conversation.id = null;
    }
    this.conversation.messages = [];
    this.hasHistoryLoaded = false;
    
    // 重新获取应用参数和信息
    const resetSession = async () => {
      try {
        await this._fetchAppParameters();
        await this._fetchWebappInfo();
        await this._fetchAppInfo();
        
        // 重新渲染用户输入表单
        this._renderUserInputForm();
        
        // 重新渲染引导信息
        this._renderIntroduction();
        
        // 滚动到底部
        this._scrollToBottom();
      } catch (error) {
        console.error('重置会话时出错:', error);
      }
    };
    
    resetSession();

    return this;
  }
  
  /**
   * 清空对话 (向后兼容，调用reset方法)
   * @deprecated 使用reset()方法替代
   * @public
   */
  clear() {
    console.warn('clear()方法已被弃用，请使用reset()方法替代');
    return this.reset();
  }
  
  /**
   * 清理ECharts图表资源
   * @private
   */
  _cleanupEChartsCharts() {
    if (!this.elements.messagesContainer) return;
    
    // 查找所有ECharts图表容器
    const chartContainers = this.elements.messagesContainer.querySelectorAll('.xyg-chat-echarts-chart');
    
    chartContainers.forEach(container => {
      // 清理ECharts实例
      if (container._echartsInstance && !container._echartsInstance.isDisposed()) {
        try {
          container._echartsInstance.dispose();
          console.log('已清理ECharts实例');
        } catch (error) {
          console.warn('清理ECharts实例失败:', error);
        }
      }
      
      // 清理ResizeObserver
      if (container._resizeObserver) {
        try {
          container._resizeObserver.disconnect();
          console.log('已清理ResizeObserver');
        } catch (error) {
          console.warn('清理ResizeObserver失败:', error);
        }
      }
      
      // 清理resize事件处理函数
      if (container._resizeHandler) {
        try {
          window.removeEventListener('resize', container._resizeHandler);
          console.log('已清理resize事件处理函数');
        } catch (error) {
          console.warn('清理resize事件处理函数失败:', error);
        }
      }
      
      // 清理引用
      container._echartsInstance = null;
      container._resizeObserver = null;
      container._resizeHandler = null;
      
      // 移除内容，防止内存泄漏
      container.innerHTML = '';
    });
    
    console.log(`已清理${chartContainers.length}个ECharts图表资源`);
  }

  /**
   * 清理思考元素
   * @private
   */
  _cleanupThinkingElements() {
    if (!this.elements.messagesContainer) return;
    
    // 查找并移除所有思考元素
    const thinkingElements = this.elements.messagesContainer.querySelectorAll('.xyg-chat-thinking');
    thinkingElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
        console.log('已清理思考元素');
      }
    });
    
    // 额外检查：如果有思考元素不在消息容器中（虽然不应该发生），也清理掉
    const allThinkingElements = document.querySelectorAll('.xyg-chat-thinking');
    allThinkingElements.forEach(element => {
      // 检查是否属于当前聊天实例
      if (element.closest('.xyg-chat-container') === this.elements.chatContainer) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
          console.log('已清理错位的思考元素');
        }
      }
    });
  }

  /**
   * 销毁聊天组件
   * @public
   * @returns {Function} 返回构造函数，便于链式调用
   */
  destroy() {
    // 移除所有事件监听器
    this._removeAllEventListeners();

    // 移除DOM元素
    if (this.elements.chatContainer && this.elements.chatContainer.parentNode) {
      this.elements.chatContainer.parentNode.removeChild(
        this.elements.chatContainer
      );
    }

    if (this.elements.launchButton && this.elements.launchButton.parentNode) {
      this.elements.launchButton.parentNode.removeChild(
        this.elements.launchButton
      );
    }

    // 移除样式
    const styleElement = document.getElementById('xyg-chat-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }

    // 重置对象状态
    this.isInitialized = false;
    this.hasInitialQuerySent = false; // 重置初始查询发送标志
    this.hasHistoryLoaded = false; // 重置历史加载标志
    this.elements = {};
    this.conversation = { id: null, messages: [] };

    // 清除全局实例引用
    if (window.xygChatInstance === this) {
      window.xygChatInstance = null;
    }

    // 返回构造函数本身，而不是null，便于再次创建实例
    return this.constructor;
  }

  /**
   * 显示Demo演示页
   * @public
   */
  showDemo() {
    // 打开demo页面
    window.open('demo.html', '_blank');
  }

  /**
   * 在AI回答后添加推荐问题
   * @param {Array<string>} questions - 推荐问题列表
   * @private
   */
  _addSuggestedQuestionsAfterAnswer(questions) {
    if (!questions || !questions.length) return;

    const container = document.createElement('div');
    container.className =
      'xyg-chat-suggestions xyg-chat-after-answer-suggestions';

    questions.forEach((question) => {
      const button = document.createElement('button');
      button.className = 'xyg-chat-suggestion-btn';
      button.textContent = question;
      button.addEventListener('click', () => {
        this._sendMessage(question);
      });
      container.appendChild(button);
    });

    this.elements.messagesContainer.appendChild(container);
    this._scrollToBottom();
  }

  /**
   * 创建样式
   * @private
   */
  _createStyles() {
    // 检查是否已添加样式
    if (document.getElementById('xyg-chat-styles')) {
      return;
    }

    // 创建样式元素
    const styleElement = document.createElement('style');
    styleElement.id = 'xyg-chat-styles';

    // 设置样式内容
    styleElement.innerHTML = `
      /* 省略其他样式... */
      
      /* ECharts图表样式 */
      .xyg-chat-echarts-container {
        margin: 10px 0;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        overflow: hidden;
        background-color: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
      
      .xyg-chat-echarts-chart {
        width: 100%;
        height: 400px;
        min-height: 350px;
        min-width: 700px;
      }
      
      .xyg-chat-echarts-error {
        border: 1px solid #ffccc7;
        background-color: #fff2f0;
      }
      
      .xyg-chat-echarts-error-message {
        padding: 15px;
        color: #ff4d4f;
        font-size: 14px;
      }
      
      .xyg-chat-echarts-error-message pre {
        margin-top: 10px;
        padding: 10px;
        background-color: #f8f8f8;
        border-radius: 4px;
        overflow: auto;
        max-height: 200px;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-all;
      }
    `;

    // 添加到文档头
    document.head.appendChild(styleElement);
  }

  /**
   * 添加事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @public
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('回调函数必须是一个函数');
    }
    
    if (!this._eventListeners[eventName]) {
      this._eventListeners[eventName] = [];
    }
    
    this._eventListeners[eventName].push(callback);
    return this;
  }

  /**
   * 移除事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} [callback] - 回调函数，如果不传则移除该事件的所有监听器
   * @public
   */
  off(eventName, callback) {
    if (!this._eventListeners[eventName]) {
      return this;
    }
    
    if (!callback) {
      // 移除所有监听器
      delete this._eventListeners[eventName];
    } else {
      // 移除指定监听器
      const index = this._eventListeners[eventName].indexOf(callback);
      if (index > -1) {
        this._eventListeners[eventName].splice(index, 1);
      }
    }
    
    return this;
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {...any} args - 传递给回调函数的参数
   * @private
   */
  _emit(eventName, ...args) {
    if (!this._eventListeners[eventName]) {
      return;
    }
    
    this._eventListeners[eventName].forEach(callback => {
      try {
        callback.apply(this, args);
      } catch (error) {
        console.error(`事件 ${eventName} 的回调函数执行出错:`, error);
      }
    });
  }

  /**
   * 添加前置钩子
   * @param {string} hookName - 钩子名称
   * @param {Function} callback - 钩子回调函数，会接收done函数、options对象和其他参数
   * @public
   */
  before(hookName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('钩子回调函数必须是一个函数');
    }
    
    if (!this._eventHooks[hookName]) {
      this._eventHooks[hookName] = [];
    }
    
    this._eventHooks[hookName].push(callback);
    return this;
  }

  /**
   * 执行前置钩子
   * @param {string} hookName - 钩子名称
   * @param {...any} args - 传递给钩子的参数
   * @returns {Promise<boolean>} - 返回是否应该继续执行
   * @private
   */
  async _executeHooks(hookName, ...args) {
    console.log(`=== 开始执行钩子: ${hookName} ===`);
    console.log('钩子参数:', args);
    console.log('钩子执行前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    if (!this._eventHooks[hookName] || this._eventHooks[hookName].length === 0) {
      // 没有钩子，直接继续执行
      console.log(`没有找到钩子: ${hookName}`);
      return true;
    }

    console.log(`找到 ${this._eventHooks[hookName].length} 个钩子`);
    
    // 在钩子执行期间设置保护标记，防止表单操作覆盖钩子数据
    const originalSkipFlag = this._skipFormUpdateFlag;
    this._skipFormUpdateFlag = true;
    console.log('钩子执行期间设置保护标记');
    
    // 记录钩子执行前的options.inputs状态，用于后续同步表单
    const originalInputs = this.options.inputs ? { ...this.options.inputs } : {};
    
    try {
      for (let i = 0; i < this._eventHooks[hookName].length; i++) {
        const hook = this._eventHooks[hookName][i];
        try {
          console.log(`--- 开始执行第 ${i + 1} 个钩子 ---`);
          console.log('执行前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
          
          // 创建一个Promise来等待done()调用
          const shouldContinue = await new Promise((resolve, reject) => {
            let hasCompleted = false;
            
            // 设置超时，防止用户忘记调用done
            const timeout = setTimeout(() => {
              if (!hasCompleted) {
                hasCompleted = true;
                console.warn(`钩子 ${hookName} 超时，自动继续执行`);
                resolve(true);
              }
            }, 30000); // 30秒超时
            
            // done函数，用户必须调用这个函数才能继续执行
            const done = (continueExecution = true) => {
              console.log(`钩子 ${hookName} 的done函数被调用，参数:`, continueExecution);
              console.log('done调用时 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
              
              if (hasCompleted) {
                console.warn(`钩子 ${hookName} 的done函数被重复调用`);
                return;
              }
              hasCompleted = true;
              clearTimeout(timeout); // 清除超时定时器
              console.log(`钩子 ${hookName} 完成，继续执行:`, continueExecution);
              resolve(continueExecution);
            };

            try {
              console.log('即将调用钩子函数...');
              // 调用钩子函数，传入done、options和其他参数
              const result = hook.call(this, done, this.options, ...args);
              console.log('钩子函数调用完成，返回值:', result);
              
              // 如果钩子返回的是Promise，处理异常
              if (result && typeof result.catch === 'function') {
                result.catch(error => {
                  if (!hasCompleted) {
                    hasCompleted = true;
                    clearTimeout(timeout);
                    console.error(`钩子 ${hookName} 执行出错:`, error);
                    resolve(false);
                  }
                });
              }
            } catch (error) {
              if (!hasCompleted) {
                hasCompleted = true;
                clearTimeout(timeout);
                console.error(`钩子 ${hookName} 执行出错:`, error);
                resolve(false);
              }
            }
          });

          console.log(`第 ${i + 1} 个钩子执行完成，shouldContinue:`, shouldContinue);
          console.log('执行后 options.inputs:', JSON.stringify(this.options.inputs, null, 2));

          if (!shouldContinue) {
            // 如果任意一个钩子返回false，停止执行
            console.log('钩子返回false，停止执行');
            return false;
          }
        } catch (error) {
          console.error(`钩子 ${hookName} 执行出错:`, error);
          return false;
        }
      }

      console.log('所有钩子执行完毕');
      console.log('最终 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
      
      // 钩子执行完毕后，同步表单字段（但保持保护状态）
      console.log('开始同步表单字段，但跳过表单更新...');
      this._syncFormFieldsFromOptionsWithoutUpdate(originalInputs);

      console.log(`=== 钩子执行结束: ${hookName} ===`);
      return true;
    } finally {
      // 恢复原来的保护标记状态（但不要在这里关闭保护）
      // this._skipFormUpdateFlag = originalSkipFlag;
      console.log('钩子执行完成，保持保护状态直到消息发送完成');
    }
  }

  /**
   * 根据options.inputs同步表单字段值（不更新表单）
   * @param {Object} originalInputs - 钩子执行前的原始inputs值
   * @private
   */
  _syncFormFieldsFromOptionsWithoutUpdate(originalInputs) {
    if (!this.elements.formInputs || !this.options.inputs) {
      return;
    }

    console.log('开始同步表单字段（不更新表单）...');
    console.log('原始inputs:', originalInputs);
    console.log('当前options.inputs:', this.options.inputs);

    // 遍历表单输入字段
    this.elements.formInputs.forEach((input) => {
      const fieldName = input.name;
      
      // 检查钩子是否修改了这个字段
      if (fieldName && 
          this.options.inputs.hasOwnProperty(fieldName) && 
          this.options.inputs[fieldName] !== originalInputs[fieldName]) {
        
        const newValue = this.options.inputs[fieldName];
        console.log(`同步表单字段 ${fieldName}: "${originalInputs[fieldName]}" -> "${newValue}"`);
        
        // 根据输入类型设置值
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = !!newValue;
        } else {
          input.value = newValue || '';
        }
      }
    });
  }

  /**
   * 同步options.inputs的值到表单字段（公开方法）
   * @public
   */
  syncInputsToForm() {
    if (!this.elements.formInputs || !this.options.inputs) {
      console.log('表单或输入数据不可用');
      return;
    }

    console.log('开始同步 options.inputs 到表单字段');
    console.log('当前 options.inputs:', this.options.inputs);

    // 临时设置跳过标记，防止同步过程中触发表单更新
    const originalSkipFlag = this._skipFormUpdateFlag;
    this._skipFormUpdateFlag = true;

    try {
      this.elements.formInputs.forEach((input) => {
        const fieldName = input.name;
        const value = this.options.inputs[fieldName];

        if (value !== undefined && value !== null) {
          console.log(`同步字段 ${fieldName}: ${value}`);
          // 根据输入类型设置值
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = !!value;
          } else {
            input.value = value;
          }
        }
      });
    } finally {
      // 恢复原始标记状态
      this._skipFormUpdateFlag = originalSkipFlag;
    }

    console.log('同步完成');
  }
}

export default DifyChat;
