/**
 * UI按钮相关方法
 * @module DifyChat/ui/buttons
 * @author AI助手
 */

// 按钮相关方法
const buttons = {
  /**
   * 初始化按钮事件委托
   * @private
   */
  _initButtonEventDelegation() {
    // 使用事件委托，只需要绑定一次
    if (!this._buttonEventDelegationInitialized) {
      this.elements.messagesContainer.addEventListener('click', (e) => {
        // 检查点击的是否是data-message按钮
        const button = e.target.closest('button[data-message]');
        if (!button) return;
        
        // 检查是否是历史消息中的按钮
        const messageContainer = button.closest('.xyg-chat-message-container');
        if (messageContainer && messageContainer.dataset.historyMessage === 'true') {
          return; // 历史消息按钮不响应点击
        }
        
        const message = button.getAttribute('data-message');
        if (message) {
          // 获取按钮的禁用状态
          const isDisabled = button.classList.contains('btn-disabled') || 
                            button.hasAttribute('disabled');
          
          // 如果按钮已禁用，不执行任何操作
          if (isDisabled) return;
          
          // 发送消息
          this._sendMessage(message);
        }
      });
      
      this._buttonEventDelegationInitialized = true;
    }
  },

  /**
   * 处理消息中的按钮
   * @param {HTMLElement} messageElement - 消息元素
   * @param {boolean} isHistory - 是否是历史消息
   * @private
   */
  _processMessageButtons(messageElement, isHistory = false) {
    if (!messageElement) return;
    
    // 检查消息元素是否已标记为历史消息
    if (messageElement.dataset.historyMessage === 'true') {
      isHistory = true;
    }
    
    // 查找消息中的所有按钮
    const buttons = messageElement.querySelectorAll('button[data-message]');
    
    buttons.forEach(button => {
      // 获取按钮变体类型
      const variant = button.getAttribute('data-variant') || 'primary';
      
      // 添加基础按钮类（可以重复添加，不会重复）
      button.classList.add('btn', `btn-${variant}`, 'btn-medium');
    });
    
    // 确保事件委托已初始化
    this._initButtonEventDelegation();
  },
  
  /**
   * 为历史消息中的按钮添加样式
   * @private
   */
  _processHistoryButtons() {
    // 获取所有历史消息
    const historyMessages = this.elements.messagesContainer.querySelectorAll('.xyg-chat-message');
    
    // 遍历所有历史消息，处理其中的按钮
    historyMessages.forEach(messageElement => {
      this._processMessageButtons(messageElement, true);
    });
  },
  
  /**
   * 处理从历史消息API获取的消息
   * @param {HTMLElement} messageElement - 消息元素
   * @private
   */
  _processHistoryApiMessage(messageElement) {
    if (!messageElement) return;
    
    // 标记为历史消息
    messageElement.dataset.historyMessage = 'true';
    
    // 处理消息中的按钮，传入isHistory=true
    this._processMessageButtons(messageElement, true);
  }
};

export { buttons }; 