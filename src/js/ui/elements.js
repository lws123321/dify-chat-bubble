/**
 * UI元素创建相关方法
 * @module DifyChat/ui/elements
 * @author AI助手
 */

import { formatHelpers } from '../utils/format.js';

// 元素创建相关方法
const elements = {
  /**
   * 创建DOM元素
   * @private
   */
  _createElements() {
    // 聊天图标按钮
    this.elements.launchButton = document.createElement('div');
    this.elements.launchButton.className = 'xyg-chat-launch-button';
    this.elements.launchButton.innerHTML = this.chatIconSVG;
    document.body.appendChild(this.elements.launchButton);

    // 主聊天容器
    this.elements.chatContainer = document.createElement('div');
    this.elements.chatContainer.className = 'xyg-chat-container';
    if (this.options.readOnly) {
      this.elements.chatContainer.classList.add('xyg-chat-readonly');
    }
    this.elements.chatContainer.style.display = 'none';
    document.body.appendChild(this.elements.chatContainer);

    // 设置宽度
    this.elements.chatContainer.style.width =
      (this.options.defaultWidth || 500) + 'px';

    // 聊天头部
    this.elements.header = document.createElement('div');
    this.elements.header.className = 'xyg-chat-header';
    this.elements.chatContainer.appendChild(this.elements.header);

    // 标题
    this.elements.title = document.createElement('div');
    this.elements.title.className = 'xyg-chat-title';
    // 先设置默认标题，后续在init()方法中根据API响应或用户配置更新
    this.elements.title.textContent = this.options.title;
    this.elements.header.appendChild(this.elements.title);

    // 头部按钮容器
    this.elements.headerButtonsContainer = document.createElement('div');
    this.elements.headerButtonsContainer.className = 'xyg-chat-header-buttons';
    this.elements.header.appendChild(this.elements.headerButtonsContainer);

    // 添加窗口拖动调整大小的元素
    this.elements.resizeHandle = document.createElement('div');
    this.elements.resizeHandle.className = 'xyg-chat-resize-handle';
    this.elements.chatContainer.appendChild(this.elements.resizeHandle);

    // 消息容器
    this.elements.messagesContainer = document.createElement('div');
    this.elements.messagesContainer.className = 'xyg-chat-messages';
    this.elements.chatContainer.appendChild(this.elements.messagesContainer);

    // 只有在非只读模式下才添加输入区域
    if (!this.options.readOnly) {
      this._createInputElements();
    }
    
    // 关闭按钮
    this.elements.closeButton = document.createElement('button');
    this.elements.closeButton.className = 'xyg-chat-close-button';
    this.elements.closeButton.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4L12 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    this.elements.closeButton.title = '关闭';
    this.elements.headerButtonsContainer.appendChild(this.elements.closeButton);
  },

  /**
   * 创建输入相关元素
   * @private
   */
  _createInputElements() {
    // 查看会话ID按钮
    this.elements.viewIdButton = document.createElement('button');
    this.elements.viewIdButton.className = 'xyg-chat-view-id-button';
    this.elements.viewIdButton.innerHTML =
      '<svg t="1745911841181" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4826" width="16" height="16"><path d="M512.670266 959.469288c-246.343571 0-446.760137-200.63146-446.760137-447.240067S266.325671 64.979944 512.670266 64.979944s446.760137 200.641693 446.760137 447.2503S759.013837 959.469288 512.670266 959.469288zM512.670266 130.429585c-210.29147 0-381.381104 171.283038-381.381104 381.800659S302.378795 894.019647 512.670266 894.019647s381.381104-171.272805 381.381104-381.790426S722.961736 130.429585 512.670266 130.429585z" fill="#fff" p-id="4827"></path><path d="M447.290209 317.17171a63.891 63.959 0 1 0 130.760113 0 63.891 63.959 0 1 0-130.760113 0Z" fill="#fff" p-id="4828"></path><path d="M512.197498 820.218804c-30.093389 0-54.235229-24.416086-54.235229-54.541197L457.96227 482.062154c0-30.126134 24.14184-54.541197 54.235229-54.541197 30.093389 0 54.235229 24.416086 54.235229 54.541197l0 283.615453C566.432727 795.802718 542.290887 820.218804 512.197498 820.218804z" fill="#fff" p-id="4829"></path></svg>';
    this.elements.viewIdButton.title = '会话ID';
    this.elements.headerButtonsContainer.appendChild(
      this.elements.viewIdButton
    );
    
    // 重置会话按钮
    this.elements.resetButton = document.createElement('button');
    this.elements.resetButton.className = 'xyg-chat-clear-button';
    this.elements.resetButton.innerHTML =
      '<svg t="1745490198396" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4183" width="16" height="16"><path d="M990.08 425.6a30.72 30.72 0 0 1 0 44.8l-135.68 135.68a30.72 30.72 0 0 1-44.8 0l-135.68-135.68a31.36 31.36 0 1 1 44.8-44.8L832 538.24l113.28-112.64a30.72 30.72 0 0 1 44.8 0z" fill="#fff" p-id="4184"></path><path d="M448 928A416 416 0 1 1 864 512a32 32 0 0 1-64 0A352 352 0 1 0 448 864a345.6 345.6 0 0 0 176-47.36 32.64 32.64 0 0 1 43.52 12.16 31.36 31.36 0 0 1-11.52 43.52A414.72 414.72 0 0 1 448 928z" fill="#fff" p-id="4185"></path></svg>';
    this.elements.resetButton.title = '重置会话';
    this.elements.headerButtonsContainer.appendChild(
      this.elements.resetButton
    );

    // 底部输入区
    this.elements.inputContainer = document.createElement('div');
    this.elements.inputContainer.className =
      'xyg-chat-input-container single-line'; // 默认为单行模式
    this.elements.chatContainer.appendChild(this.elements.inputContainer);

    // 统一边框容器
    this.elements.inputArea = document.createElement('div');
    this.elements.inputArea.className = 'xyg-chat-input-area';
    this.elements.inputContainer.appendChild(this.elements.inputArea);

    // 输入框包装器
    this.elements.inputWrapper = document.createElement('div');
    this.elements.inputWrapper.className = 'xyg-chat-input-wrapper';
    this.elements.inputArea.appendChild(this.elements.inputWrapper);

    // 消息输入框
    this.elements.messageInput = document.createElement('textarea');
    this.elements.messageInput.className = 'xyg-chat-message-input';
    this.elements.messageInput.placeholder = '输入您的问题...';
    this.elements.messageInput.rows = 1;
    this.elements.inputWrapper.appendChild(this.elements.messageInput);

    // 发送按钮容器
    this.elements.sendButtonContainer = document.createElement('div');
    this.elements.sendButtonContainer.className =
      'xyg-chat-send-button-container';
    this.elements.inputArea.appendChild(this.elements.sendButtonContainer);

    // 发送按钮
    this.elements.sendButton = document.createElement('button');
    this.elements.sendButton.className = 'xyg-chat-send-button';
    this.elements.sendButton.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6667 1.33334L7.33333 8.66668" stroke="white" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.6667 1.33334L10 14.6667L7.33333 8.66668L1.33333 6.00001L14.6667 1.33334Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    this.elements.sendButton.title = '发送消息';
    this.elements.sendButtonContainer.appendChild(this.elements.sendButton);
  },

  /**
   * 创建加载指示元素
   * @returns {HTMLElement} 加载元素
   * @private
   */
  _createLoadingElement() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'xyg-chat-loading';

    const loadingDots = document.createElement('div');
    loadingDots.className = 'xyg-chat-loading-dots';

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'xyg-chat-loading-dot';
      loadingDots.appendChild(dot);
    }

    loadingElement.appendChild(loadingDots);
    return loadingElement;
  },

  /**
   * 创建停止响应按钮
   * @returns {HTMLElement} 停止按钮元素
   * @private
   */
  _createStopButton() {
    const stopButton = document.createElement('button');
    stopButton.className = 'xyg-chat-stop-button';
    stopButton.textContent = '停止响应';
    stopButton.title = '停止AI响应生成';
    
    // 添加点击事件
    stopButton.addEventListener('click', async () => {
      const taskId = stopButton.dataset.taskId;
      if (taskId) {
        console.log('正在停止响应，任务ID:', taskId);
        this.isGenerating = false;
        await this._stopResponseGeneration(taskId);
      } else {
        console.warn('无法停止响应：未找到任务ID');
        this.isGenerating = false;
      }
      
      // 移除停止按钮
      if (stopButton.parentNode) {
        stopButton.parentNode.removeChild(stopButton);
      }
    });
    
    return stopButton;
  }
};

export { elements }; 