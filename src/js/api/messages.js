/**
 * API消息相关方法
 * @module DifyChat/api/messages
 * @author AI助手
 */

// 处理深度思考内容
function extractThinkingContent(text) {
  if (!text) return null;

  // 捕获<think>标签中的内容，支持多行
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  if (!thinkMatch) return null;

  // 提取思考内容，不做额外处理
  let thinkContent = thinkMatch[1];
  console.log('提取到思考内容，长度:', thinkContent.length);

  // 确保内容存在
  if (thinkContent && thinkContent.length > 0) {
    return thinkContent;
  }

  return null;
}

// 从文本中移除think标签及其内容
function removeThinkContent(text) {
  if (!text) return text;

  // 移除<think>标签及其内容，处理多种形式
  let cleanedText = text.replace(/<think[^>]*>[\s\S]*?<\/think>/g, '');

  // 移除可能包含属性的空think标签
  cleanedText = cleanedText.replace(/<think[^>]*><\/think>/g, '');

  // 移除可能剩余的孤立think标签
  cleanedText = cleanedText.replace(/<think[^>]*>/g, '');
  cleanedText = cleanedText.replace(/<\/think>/g, '');

  return cleanedText;
}

// 消息相关API方法
const messages = {
  /**
   * 获取会话历史消息
   * @param {string} first_id - 分页参数，第一条消息的ID
   * @param {number} limit - 获取消息数量
   * @returns {Promise<Object>} 历史消息响应结果
   * @private
   */
  async _fetchChatHistory(first_id = null, limit = 30) {
    if (!this.options.conversation_id || !this.options.user) {
      console.error('获取历史消息失败: 缺少会话ID或用户标识');
      return null;
    }

    try {
      // 构造查询参数
      const params = new URLSearchParams();
      params.append('conversation_id', this.options.conversation_id);
      params.append('user', this.options.user);
      
      if (first_id) {
        params.append('first_id', first_id);
      }
      
      params.append('limit', limit);

      const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
      // 发送请求
      const response = await fetch(`${baseUrl}/messages?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取历史消息失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('获取历史消息成功:', result);
      
      // 处理历史消息
      this._displayChatHistory(result);
      
      // 设置已加载历史标志
      this.hasHistoryLoaded = true;
      
      return result;
    } catch (error) {
      console.error('获取历史消息时出错:', error);
      return null;
    }
  },
  
  /**
   * 显示历史消息到聊天界面
   * @param {Object} historyResult - 历史消息API返回结果
   * @private
   */
  _displayChatHistory(historyResult) {
    console.log('historyResult:', historyResult);
    
    if (!historyResult || !historyResult.data || !historyResult.data.length) {
      console.log('没有历史消息可显示');
      return;
    }
    
    // 清空现有消息
    if (this.elements.messagesContainer) {
      this.elements.messagesContainer.innerHTML = '';
    }
    
    // 重置消息数组
    this.conversation.messages = [];
    
    // 按照API返回的顺序处理消息（API本身返回的是倒序，最新的消息在前）
    const messages = historyResult.data;
    
    // 遍历并显示消息
    messages.forEach(message => {
      // 处理用户消息
      if (message.query) {
        // 使用_addMessage方法添加用户消息，标记为历史消息
        this._addMessage(message.query, 'user', true);
        
        // 更新消息历史
        this.conversation.messages.push({
          role: 'user',
          content: message.query
        });
      }
      
      // 处理AI回答
      if (message.answer) {
        // 使用_addMessage方法添加AI消息，标记为历史消息
        this._addMessage(message.answer, 'assistant', true);
        
        // 获取刚添加的消息元素
        const assistantElement = this.elements.messagesContainer.lastElementChild;
        
        // 如果API返回了消息ID，使用API提供的ID
        if (message.id && assistantElement) {
          assistantElement.dataset.messageId = message.id;
        }
        
        // 添加反馈按钮
        if (assistantElement) {
          this._addFeedbackButtons(assistantElement, message.answer);
          
          // 确保历史消息中的按钮也获得样式，但不添加点击事件
          setTimeout(() => {
            // 找出所有带data-message属性的按钮
            const buttons = assistantElement.querySelectorAll('button[data-message]');
            if (buttons.length > 0) {
              console.log(`找到历史消息中的${buttons.length}个按钮，应用样式`);
              // 应用按钮样式
              buttons.forEach(button => {
                const variant = button.getAttribute('data-variant') || 'primary';
                button.classList.add('btn', `btn-${variant}`, 'btn-medium');
              });
            }
          }, 0);
        }
        
        // 如果有反馈信息，更新按钮状态
        if (message.feedback && message.feedback.rating && assistantElement) {
          // 延迟执行，确保DOM元素已经渲染完成
          setTimeout(() => {
            const rating = message.feedback.rating;
            if (['like', 'dislike'].includes(rating)) {
              const likeBtn = assistantElement.querySelector('.xyg-chat-like-btn');
              const dislikeBtn = assistantElement.querySelector('.xyg-chat-dislike-btn');
              
              // 激活相应的按钮
              const feedbackBtn = assistantElement.querySelector(`.xyg-chat-${rating}-btn`);
              if (feedbackBtn) {
                feedbackBtn.classList.add('active');
                
                // 实现互斥显示
                if (rating === 'like' && dislikeBtn) {
                  dislikeBtn.style.display = 'none'; // 隐藏点踩按钮
                } else if (rating === 'dislike' && likeBtn) {
                  likeBtn.style.display = 'none'; // 隐藏点赞按钮
                }
              }
            }
          }, 0);
        }
        
        // 处理引用资源（如果有）
        if (message.retriever_resources && assistantElement) {
          this._handleRetrieverResources(message.retriever_resources, assistantElement);
        }
        
        // 更新消息历史
        this.conversation.messages.push({
          role: 'assistant',
          content: message.answer
        });
      }
    });
    
    // 滚动到底部
    setTimeout(() => {
      this._scrollToBottom();
    }, 100);
  },

  /**
   * 发送聊天消息
   * @param {string} message - 要发送的消息
   * @private
   */
  async _sendMessage(message) {
    console.log(`=== 开始发送消息: "${message}" ===`);
    
    if (!message || !message.trim()) return;

    // 只读模式下，如果不是初始查询，则不允许发送消息
    if (this.options.readOnly && this.conversation.messages.length > 0) {
      console.warn('只读模式下不允许发送新消息');
      return;
    }
    
    console.log('发送消息前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    // 执行发送消息前置钩子
    console.log('开始执行前置钩子，消息内容:', message);
    const shouldContinue = await this._executeHooks('before:sendMessage', message);
    console.log('前置钩子执行结果:', shouldContinue);
    console.log('钩子执行后 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    if (!shouldContinue) {
      console.log('发送消息被前置钩子阻止');
      return;
    }
    console.log('前置钩子验证通过，继续发送消息');

    // 触发发送消息开始事件
    this._emit('sendMessage:start', message);
    
    // 重置自动滚动冻结标志
    this.shouldFreezeScroll = false;
    
    // 开始监听滚动事件
    this._setupScrollListener();

    console.log('UI准备前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    // 准备UI（避免触发可能影响inputs的事件）
    const { userMessageElement, loadingElement, stopButton } = this._prepareUiForSendMessageSafely(message);
    
    console.log('UI准备后 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    // 设置当前请求状态
    this.isGenerating = true;
    let currentTaskId = null;

    try {
      console.log('开始准备请求数据...');
      // 准备请求数据
      const requestData = await this._prepareRequestData(message);
      console.log('最终发送的请求数据:', JSON.stringify(requestData, null, 2));
      console.log('此时 options.inputs:', JSON.stringify(this.options.inputs, null, 2));

      // 发送消息请求
      const response = await this._sendApiRequest(requestData);
      
      // 处理流式响应
      const { assistantResponse, assistantElement, retrieverResources } = 
        await this._handleStreamResponse(response, loadingElement, stopButton, currentTaskId);

      // 更新对话历史
      this._updateConversationHistory(message, assistantResponse, assistantElement);

      // 处理引用资源
      if (retrieverResources && assistantElement) {
        this._handleRetrieverResources(retrieverResources, assistantElement);
      }

      // 添加回答后的推荐问题
      if (this.suggestedQuestionsAfterAnswer && this.suggestedQuestionsAfterAnswer.length > 0) {
        this._addSuggestedQuestionsAfterAnswer(this.suggestedQuestionsAfterAnswer);
        this.suggestedQuestionsAfterAnswer = null;
      }

      // 触发发送消息成功事件
      this._emit('sendMessage:success', message, assistantResponse);
    } catch (error) {
      console.error('发送消息时出错:', error);
      this._handleSendMessageError(error, loadingElement);
      
      // 触发发送消息失败事件
      this._emit('sendMessage:error', message, error);
    } finally {
      // 重置状态和UI
      this._resetUiAfterSendMessage(stopButton);
      
      // 重置跳过表单更新标记
      this._skipFormUpdateFlag = false;
      console.log('已重置跳过表单更新标记');
      
      // 触发发送消息结束事件
      this._emit('sendMessage:end', message);
    }
    
    console.log(`=== 消息发送完成: "${message}" ===`);
  },

  /**
   * 处理检索资源（引用来源）
   * @param {Array} retrieverResources - 检索资源数组
   * @param {HTMLElement} messageElement - 消息元素
   * @private
   */
  _handleRetrieverResources(retrieverResources, messageElement) {
    if (!retrieverResources || !retrieverResources.length || !messageElement)
      return;

    // 创建引用资源容器
    const resourcesContainer = document.createElement('div');
    resourcesContainer.className = 'xyg-chat-retriever-resources';

    // 添加标题
    const titleElement = document.createElement('div');
    titleElement.className = 'xyg-chat-retriever-title';
    titleElement.textContent = '引用来源:';
    resourcesContainer.appendChild(titleElement);

    // 添加资源列表
    const resourcesList = document.createElement('ul');
    resourcesList.className = 'xyg-chat-retriever-list';

    retrieverResources.forEach((resource, index) => {
      const resourceItem = document.createElement('li');
      resourceItem.className = 'xyg-chat-retriever-item';

      const resourceLink = document.createElement('a');
      resourceLink.href = resource.url || '#';
      resourceLink.target = '_blank';
      resourceLink.rel = 'noopener';
      resourceLink.className = 'xyg-chat-retriever-link';

      const resourceTitle = document.createElement('div');
      resourceTitle.className = 'xyg-chat-retriever-resource-title';
      resourceTitle.textContent = resource.title || `资源${index + 1}`;
      resourceItem.appendChild(resourceTitle);

      resourceLink.appendChild(resourceTitle);
      resourceItem.appendChild(resourceLink);
      resourcesList.appendChild(resourceItem);
    });

    resourcesContainer.appendChild(resourcesList);
    messageElement.appendChild(resourcesContainer);
  },

  /**
   * 处理发送消息错误
   * @param {Error} error - 错误对象
   * @param {HTMLElement} loadingElement - 加载提示元素
   * @private
   */
  _handleSendMessageError(error, loadingElement) {
    // 移除加载提示
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }

    // 添加错误消息
    const errorMessage = '很抱歉，发生了错误: ' + error.message;
    const errorElement = this._createMessageElement(errorMessage, 'error');
    this.elements.messagesContainer.appendChild(errorElement);
    this._scrollToBottom();
    
    // 移除滚动事件监听器
    this._removeScrollListener();
  },

  /**
   * 移除停止按钮
   * @param {HTMLElement} stopButton - 停止按钮元素
   * @private
   */
  _removeStopButton(stopButton) {
    if (stopButton && stopButton.parentNode) {
      stopButton.parentNode.removeChild(stopButton);
    } else {
      // 查找输入容器中的停止按钮
      const stopButtonInInput = this.elements.inputContainer?.querySelector('.xyg-chat-stop-button');
      if (stopButtonInInput) {
        stopButtonInInput.parentNode.removeChild(stopButtonInInput);
      }
    }
  },

  /**
   * 启用输入区域
   * @private
   */
  _enableInputArea() {
    if (!this.options.readOnly) {
      this.elements.messageInput.disabled = false;
      this.elements.messageInput.focus();
      this.elements.sendButton.disabled = false;
    }
  },

  /**
   * 重置发送消息后的UI
   * @param {HTMLElement} stopButton - 停止按钮元素
   * @private
   */
  _resetUiAfterSendMessage(stopButton) {
    // 重置生成状态
    this.isGenerating = false;
    
    // 移除停止按钮
    this._removeStopButton(stopButton);
    
    // 启用输入区域
    this._enableInputArea();
    
    // 移除滚动事件监听器
    this._removeScrollListener();
  },

  /**
   * 更新对话历史
   * @param {string} userMessage - 用户消息
   * @param {string} assistantResponse - 助手响应
   * @param {HTMLElement} assistantElement - 助手消息元素
   * @private
   */
  _updateConversationHistory(userMessage, assistantResponse, assistantElement) {
    // 获取助手消息元素的ID
    const messageId = assistantElement ? assistantElement.dataset.messageId : null;
    
    // 更新对话历史
    this.conversation.messages.push(
      { role: 'user', content: userMessage },
      {
        role: 'assistant',
        content: assistantResponse || '服务器未返回有效回复',
        id: messageId // 存储消息ID，方便后续查找
      }
    );
    
    // 如果有回调函数用于通知消息更新，可以在这里调用
    if (typeof this.options.onMessagesUpdate === 'function') {
      try {
        this.options.onMessagesUpdate(this.conversation.messages);
      } catch (error) {
        console.error('执行onMessagesUpdate回调时出错:', error);
      }
    }
  },

  /**
   * 设置滚动事件监听器
   * 用于检测用户手动滚动以冻结自动滚动
   * @private
   */
  _setupScrollListener() {
    if (!this.elements.messagesContainer) return;
    
    // 确保不重复添加监听器
    this._removeScrollListener();
    
    // 创建滚动处理函数
    this._handleUserScroll = () => {
      // 计算距离底部的距离
      const scrollBottom = this.elements.messagesContainer.scrollHeight - 
                           this.elements.messagesContainer.scrollTop - 
                           this.elements.messagesContainer.clientHeight;
      
      // 如果用户向上滚动超过一定距离（例如100像素），冻结自动滚动
      if (scrollBottom > 100) {
        this.shouldFreezeScroll = true;
      } else if (scrollBottom < 10) {
        // 如果用户滚动到接近底部，恢复自动滚动
        this.shouldFreezeScroll = false;
      }
    };
    
    // 添加滚动事件监听器
    this.elements.messagesContainer.addEventListener('scroll', this._handleUserScroll);
  },
  
  /**
   * 移除滚动事件监听器
   * @private
   */
  _removeScrollListener() {
    if (this.elements.messagesContainer && this._handleUserScroll) {
      this.elements.messagesContainer.removeEventListener('scroll', this._handleUserScroll);
      this._handleUserScroll = null;
    }
    
    // 重置滚动冻结标志
    this.shouldFreezeScroll = false;
  },
};

export { messages, extractThinkingContent, removeThinkContent }; 