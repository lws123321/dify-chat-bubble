/**
 * API反馈相关方法
 * @module DifyChat/api/feedback
 * @author AI助手
 */

// API反馈相关方法
const feedback = {
  /**
   * 发送消息反馈（点赞/点踩）
   * @param {string} messageId - 消息ID
   * @param {string} rating - 评价类型: 'like', 'dislike', 或 null（撤销）
   * @param {string} content - 反馈内容（可选）
   * @returns {Promise<Object>} 响应结果
   */
  async _sendMessageFeedback(messageId, rating, content = '') {
    if (!messageId) {
      console.error('发送消息反馈失败: 缺少消息ID');
      return { result: 'error', message: '缺少消息ID' };
    }

    if (!['like', 'dislike', null].includes(rating)) {
      console.error('发送消息反馈失败: 评价类型无效');
      return { result: 'error', message: '评价类型无效' };
    }

    try {
      const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
      const response = await fetch(`${baseUrl}/messages/${messageId}/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`
        },
        body: JSON.stringify({
          rating: rating,
          user: this.options.user || 'anonymous',
          content: content
        })
      });

      if (!response.ok) {
        throw new Error(`发送消息反馈请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('消息反馈发送成功:', result);
      return result;
    } catch (error) {
      console.error('发送消息反馈时出错:', error);
      return { result: 'error', message: error.message };
    }
  },

  /**
   * 为消息元素添加反馈按钮
   * @param {HTMLElement} messageElement - 消息元素
   * @param {string} content - 消息内容
   * @private
   */
  _addFeedbackButtons(messageElement, content) {
    // 确保消息元素存在
    if (!messageElement) {
      console.warn('添加反馈按钮失败: 消息元素不存在');
      return;
    }
    
    // 防止重复添加
    if (messageElement.querySelector('.xyg-chat-message-feedback')) {
      return;
    }
    
    // 确保消息元素有相对定位，以便反馈按钮能正确定位
    messageElement.style.position = 'relative';
    
    // 获取消息ID，如果不存在则创建一个新的
    let messageId = messageElement.dataset.messageId;
    if (!messageId) {
      messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      messageElement.dataset.messageId = messageId;
    }
    
    // 添加反馈按钮容器
    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = 'xyg-chat-message-feedback';
    
    // 创建复制按钮
    const copyButton = document.createElement('button');
    copyButton.className = 'xyg-chat-message-action-btn xyg-chat-copy-btn';
    copyButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    copyButton.title = '复制';
    copyButton.setAttribute('aria-label', '复制消息内容');
    
    // 添加复制功能
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      // 创建临时元素获取纯文本内容
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // 复制到剪贴板
      navigator.clipboard.writeText(textContent).then(() => {
        // 复制成功提示
        copyButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
        setTimeout(() => {
          copyButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
      });
    });
    
    // 点赞按钮
    const likeButton = document.createElement('button');
    likeButton.className = 'xyg-chat-message-action-btn xyg-chat-like-btn';
    likeButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
    likeButton.title = '点赞';
    likeButton.setAttribute('aria-label', '点赞');
    likeButton.setAttribute('data-action', 'like');
    likeButton.setAttribute('data-message-id', messageId);
    
    // 点踩按钮
    const dislikeButton = document.createElement('button');
    dislikeButton.className = 'xyg-chat-message-action-btn xyg-chat-dislike-btn';
    dislikeButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';
    dislikeButton.title = '点踩';
    dislikeButton.setAttribute('aria-label', '点踩');
    dislikeButton.setAttribute('data-action', 'dislike');
    dislikeButton.setAttribute('data-message-id', messageId);
    
    // 为点赞和点踩按钮添加点击事件
    const handleFeedbackClick = async (button, action) => {
      const msgId = button.getAttribute('data-message-id');
      if (!msgId) {
        console.warn('无法发送反馈：消息ID不存在');
        return;
      }
      
      // 检查当前是否已激活
      const isActive = button.classList.contains('active');
      const otherButton = action === 'like' ? dislikeButton : likeButton;
      
      // 如果当前按钮已经激活，则取消激活（撤销反馈）
      if (isActive) {
        // 移除激活状态
        button.classList.remove('active');
        // 恢复显示另一个按钮
        otherButton.style.display = '';
        // 发送撤销反馈请求
        await this._sendMessageFeedback(msgId, null);
      } else {
        // 激活当前按钮
        button.classList.add('active');
        // 隐藏另一个按钮
        otherButton.style.display = 'none';
        // 确保另一个按钮没有激活
        otherButton.classList.remove('active');
        // 发送反馈请求
        await this._sendMessageFeedback(msgId, action);
      }
    };
    
    // 绑定事件
    likeButton.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      handleFeedbackClick(likeButton, 'like');
    });
    dislikeButton.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      handleFeedbackClick(dislikeButton, 'dislike');
    });
    
    // 添加按钮到反馈容器
    feedbackContainer.appendChild(copyButton);
    feedbackContainer.appendChild(likeButton);
    feedbackContainer.appendChild(dislikeButton);
    
    // 将反馈容器添加到消息元素中
    messageElement.appendChild(feedbackContainer);
    
    // 调试用：将反馈容器临时可见，以确认添加成功
    // setTimeout(() => {
    //   feedbackContainer.style.opacity = '1';
    //   feedbackContainer.style.visibility = 'visible';
    //   setTimeout(() => {
    //     feedbackContainer.style.opacity = '';
    //     feedbackContainer.style.visibility = '';
    //   }, 2000);
    // }, 500);
  }
};

export { feedback }; 