/**
 * API响应处理相关方法
 * @module DifyChat/api/response
 * @author AI助手
 */

import { extractThinkingContent } from './messages.js';

// API响应处理相关方法
const response = {
  /**
   * 处理流式响应
   * @param {Response} response - Fetch响应对象
   * @param {HTMLElement} loadingElement - 加载提示元素
   * @param {HTMLElement} stopButton - 停止按钮元素
   * @param {string} currentTaskId - 当前任务ID
   * @returns {Promise<Object>} 处理结果
   * @private
   */
  async _handleStreamResponse(response, loadingElement, stopButton, currentTaskId) {
    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantResponse = '';
    let assistantElement = null;
    let retrieverResources = null;
    let thinkingTimeAdded = false;
    let thinkingContentShown = false;
    // 存储消息ID
    let messageId = null;

    // 从响应流中读取数据
    while (true) {
      // 如果已停止生成，则退出循环
      if (!this.isGenerating) {
        console.log('响应生成已手动停止');
        break;
      }

      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            if (jsonStr === '[DONE]') continue;

            const data = JSON.parse(jsonStr);
            
            // 提取message_id（如果存在）
            if (data.message_id && !messageId) {
              messageId = data.message_id;
              console.log('从流数据中获取到message_id:', messageId);
            }
            
            // 处理流数据
            const result = this._processStreamData(
              data, 
              assistantResponse, 
              assistantElement, 
              loadingElement, 
              thinkingContentShown, 
              thinkingTimeAdded, 
              currentTaskId, 
              stopButton
            );
            
            // 更新变量
            assistantResponse = result.assistantResponse;
            assistantElement = result.assistantElement;
            retrieverResources = result.retrieverResources || retrieverResources;
            thinkingTimeAdded = result.thinkingTimeAdded;
            thinkingContentShown = result.thinkingContentShown;
            currentTaskId = result.currentTaskId || currentTaskId;
            
            // 检查是否接收到消息结束事件并处理
            if (result.shouldBreak) {
              break;
            }
          }
        } catch (e) {
          console.error('解析响应数据时出错:', e);
        }
      }
    }

    // 确保总是有回复元素，即使没有接收到任何回复
    if (!assistantElement) {
      assistantResponse = '抱歉，服务器没有返回任何回复。';
      assistantElement = this._createMessageElement(
        assistantResponse,
        'assistant'
      );
      // 确保loading元素存在且在DOM中
      if (loadingElement && loadingElement.parentNode) {
        this.elements.messagesContainer.replaceChild(
          assistantElement,
          loadingElement
        );
      } else {
        this.elements.messagesContainer.appendChild(assistantElement);
      }
      this._scrollToBottom();
    }

    // 如果assistantResponse为空但有assistantElement，更新其内容
    if (
      (!assistantResponse || assistantResponse.trim() === '') &&
      assistantElement
    ) {
      assistantResponse = '服务器返回了空回复';
      const messageEl = assistantElement.querySelector('.xyg-chat-message');
      if (messageEl) {
        messageEl.innerHTML = this._formatMessage(assistantResponse);
      }
    }

    // 流式输出完毕，确保移除任何剩余的loading元素
    if (loadingElement && loadingElement.parentNode) {
      try {
        loadingElement.parentNode.removeChild(loadingElement);
        console.log('已移除剩余的loading元素');
      } catch (e) {
        console.warn('移除loading元素时出错:', e);
      }
    }
    
    // 额外安全措施：查找并移除所有loading元素
    const remainingLoadingElements = this.elements.messagesContainer.querySelectorAll('.xyg-chat-loading');
    remainingLoadingElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
        console.log('已移除一个剩余的loading元素');
      }
    });

    // 流式输出完毕，处理assistant元素
    if (assistantElement) {
      const messageEl = assistantElement.querySelector('.xyg-chat-message');
      if (messageEl) {
        messageEl.style.width = 'auto';
        messageEl.dataset.streaming = 'false';
        
        // 设置从流数据中获取的message_id
        if (messageId) {
          messageEl.dataset.messageId = messageId;
        }
        
        // 流式输出结束后添加反馈按钮
        this._addFeedbackButtons(messageEl, assistantResponse);
        
        // 确保最终处理消息中的所有按钮
        if (window.xygChatInstance && typeof window.xygChatInstance._processMessageButtons === 'function') {
          setTimeout(() => {
            window.xygChatInstance._processMessageButtons(messageEl, false);
          }, 50); // 使用一个短暂的延时确保DOM已完全更新
        }
      }
      
      // 最后一次滚动到底部
      this._scrollToBottom();
    }
    
    return { assistantResponse, assistantElement, retrieverResources };
  },

  /**
   * 处理流数据
   * @param {Object} data - 流数据对象
   * @param {string} assistantResponse - 当前助手响应
   * @param {HTMLElement} assistantElement - 助手消息元素
   * @param {HTMLElement} loadingElement - 加载提示元素
   * @param {boolean} thinkingContentShown - 思考内容是否已显示
   * @param {boolean} thinkingTimeAdded - 思考时间是否已添加
   * @param {string} currentTaskId - 当前任务ID
   * @param {HTMLElement} stopButton - 停止按钮元素
   * @returns {Object} 更新后的状态
   * @private
   */
  _processStreamData(
    data,
    assistantResponse,
    assistantElement,
    loadingElement,
    thinkingContentShown,
    thinkingTimeAdded,
    currentTaskId,
    stopButton
  ) {
    let shouldBreak = false;
    let newAssistantResponse = assistantResponse;
    let newAssistantElement = assistantElement;
    let newThinkingContentShown = thinkingContentShown;
    let newThinkingTimeAdded = thinkingTimeAdded;
    let retrieverResources = null;
    let newCurrentTaskId = currentTaskId;

    // 存储对话ID和任务ID
    if (data.conversation_id && !this.conversation.id) {
      this.conversation.id = data.conversation_id;
    }
    
    // 存储任务ID用于停止响应
    if (data.task_id && !newCurrentTaskId) {
      newCurrentTaskId = data.task_id;
      console.log('获取到任务ID:', newCurrentTaskId);
      if (stopButton) {
        stopButton.dataset.taskId = newCurrentTaskId;
      }
    }

    // 检查是否接收到消息结束事件
    if (data.event === 'message_end') {
      console.log('接收到消息结束事件');
      // 如果流还没有结束，但已经收到message_end事件，可以主动结束处理
      if (!shouldBreak) {
        console.log('主动结束响应处理');
        // 确保内容已完全显示
        if (!newAssistantElement && newAssistantResponse) {
          newAssistantElement = this._createMessageElement(
            newAssistantResponse,
            'assistant'
          );
          this.elements.messagesContainer.replaceChild(
            newAssistantElement,
            loadingElement
          );
          this._scrollToBottom();
        }
        shouldBreak = true;
      }
      
      // 如果接收到资源数据，存储它
      if (data.retriever_resources) {
        retrieverResources = data.retriever_resources;
      }
      
      // 保存推荐问题以便后续使用
      if (data.suggested_questions && data.suggested_questions.length > 0) {
        this.suggestedQuestionsAfterAnswer = data.suggested_questions;
      }
    } else if (data.answer) {
      // 处理思考内容和回答
      const result = this._processAnswerContent(
        data.answer,
        newAssistantResponse,
        newAssistantElement,
        loadingElement,
        newThinkingContentShown
      );
      newAssistantResponse = result.assistantResponse;
      newAssistantElement = result.assistantElement;
      newThinkingContentShown = result.thinkingContentShown;
      
      // 每次处理新内容后滚动到底部
      this._scrollToBottom();
    } else if (data.message && typeof data.message === 'string') {
      const result = this._processMessageContent(
        data.message,
        newAssistantResponse,
        newAssistantElement,
        loadingElement,
        newThinkingContentShown
      );
      newAssistantResponse = result.assistantResponse;
      newAssistantElement = result.assistantElement;
      newThinkingContentShown = result.thinkingContentShown;
      
      // 每次处理新内容后滚动到底部
      this._scrollToBottom();
    } else if (
      data.event === 'message_end' ||
      data.event === 'workflow_finished'
    ) {
      // 消息结束事件，确保内容已完全展示
      console.log('接收到消息结束事件:', data.event);
      if (!newAssistantElement && newAssistantResponse) {
        newAssistantElement = this._createMessageElement(
          newAssistantResponse,
          'assistant'
        );
        this.elements.messagesContainer.replaceChild(
          newAssistantElement,
          loadingElement
        );
        this._scrollToBottom();
      }
    }

    // 处理推荐问题
    if (
      data.suggested_questions &&
      data.suggested_questions.length > 0
    ) {
      this.suggestedQuestionsAfterAnswer = data.suggested_questions;
    }

    // 处理引用资源
    if (data.retriever_resources) {
      retrieverResources = data.retriever_resources;
    }

    // 处理思考完成时间
    if (data.thinking_completion_time && !newThinkingTimeAdded) {
      const thinkingTimeInSeconds = (data.thinking_completion_time / 1000).toFixed(2);
      console.log(`思考完成时间: ${thinkingTimeInSeconds}秒`);
      newThinkingTimeAdded = true;
    }

    return {
      assistantResponse: newAssistantResponse,
      assistantElement: newAssistantElement,
      retrieverResources,
      thinkingContentShown: newThinkingContentShown,
      thinkingTimeAdded: newThinkingTimeAdded,
      currentTaskId: newCurrentTaskId,
      shouldBreak
    };
  },

  /**
   * 处理思考内容
   * @param {string} content - 内容
   * @param {HTMLElement} loadingElement - 加载提示元素
   * @param {boolean} thinkingContentShown - 思考内容是否已显示
   * @returns {Object} 更新后的状态
   * @private
   */
  _processThinkingContent(content, loadingElement, thinkingContentShown) {
    let newThinkingContentShown = thinkingContentShown;
    
    const thinkingContent = extractThinkingContent(content);
    if (thinkingContent) {
      // 移除加载提示元素
      if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
      }

      // 添加思考内容元素
      this._addThinkingInfo(thinkingContent);
      newThinkingContentShown = true;

      // 重新添加加载提示元素
      this.elements.messagesContainer.appendChild(loadingElement);
      
      // 添加思考内容后滚动到底部
      this._scrollToBottom();
    }

    return { thinkingContentShown: newThinkingContentShown };
  },

  /**
   * 处理回答内容
   * @param {string} content - 回答内容
   * @param {string} assistantResponse - 当前助手响应
   * @param {HTMLElement} assistantElement - 助手消息元素
   * @param {HTMLElement} loadingElement - 加载提示元素
   * @param {boolean} thinkingContentShown - 思考内容是否已显示
   * @returns {Object} 更新后的状态
   * @private
   */
  _processAnswerContent(
    content,
    assistantResponse,
    assistantElement,
    loadingElement,
    thinkingContentShown
  ) {
    let newAssistantResponse = assistantResponse;
    let newAssistantElement = assistantElement;
    let newThinkingContentShown = thinkingContentShown;

    // 检查是否包含思考内容
    if (!newThinkingContentShown) {
      const result = this._processThinkingContent(
        content, 
        loadingElement, 
        newThinkingContentShown
      );
      newThinkingContentShown = result.thinkingContentShown;
    }

    // 使用原始答案（不移除思考内容）
    const originalAnswer = content;

    if (!newAssistantElement) {
      newAssistantResponse = originalAnswer;
      newAssistantElement = this._createMessageElement(
        newAssistantResponse || '服务器未返回回答内容',
        'assistant'
      );
      this.elements.messagesContainer.replaceChild(
        newAssistantElement,
        loadingElement
      );
      
      // 创建消息元素后立即处理按钮，需要找到消息元素
      const messageEl = newAssistantElement.querySelector('.xyg-chat-message');
      if (window.xygChatInstance && typeof window.xygChatInstance._processMessageButtons === 'function') {
        window.xygChatInstance._processMessageButtons(messageEl, false);
      }
      
      this._scrollToBottom();
    } else {
      // 找到消息元素进行更新
      const messageEl = newAssistantElement.querySelector('.xyg-chat-message');
      if (!messageEl) {
        console.error('无法找到消息元素');
        return {
          assistantResponse: newAssistantResponse,
          assistantElement: newAssistantElement,
          thinkingContentShown: newThinkingContentShown
        };
      }
      
      // 保存当前反馈按钮的状态
      const likeBtn = messageEl.querySelector('.xyg-chat-like-btn');
      const dislikeBtn = messageEl.querySelector('.xyg-chat-dislike-btn');
      const likeActive = likeBtn && likeBtn.classList.contains('active');
      const dislikeActive = dislikeBtn && dislikeBtn.classList.contains('active');
      const likeDisplay = likeBtn ? likeBtn.style.display : '';
      const dislikeDisplay = dislikeBtn ? dislikeBtn.style.display : '';
      
      newAssistantResponse += originalAnswer;
      // 更新消息内容
      messageEl.innerHTML = this._formatMessage(newAssistantResponse, messageEl);
      
      // 恢复反馈按钮的状态
      setTimeout(() => {
        const newLikeBtn = messageEl.querySelector('.xyg-chat-like-btn');
        const newDislikeBtn = messageEl.querySelector('.xyg-chat-dislike-btn');
        
        if (newLikeBtn && likeActive) {
          newLikeBtn.classList.add('active');
        }
        
        if (newDislikeBtn && dislikeActive) {
          newDislikeBtn.classList.add('active');
        }
        
        // 恢复互斥显示状态
        if (newLikeBtn) {
          newLikeBtn.style.display = likeDisplay;
        }
        
        if (newDislikeBtn) {
          newDislikeBtn.style.display = dislikeDisplay;
        }
        
        // 处理消息中的按钮
        if (window.xygChatInstance && typeof window.xygChatInstance._processMessageButtons === 'function') {
          window.xygChatInstance._processMessageButtons(messageEl, false);
        }
      }, 0);
      
      // 每次处理新内容后滚动到底部
      this._scrollToBottom();
    }

    return {
      assistantResponse: newAssistantResponse,
      assistantElement: newAssistantElement,
      thinkingContentShown: newThinkingContentShown
    };
  },

  /**
   * 处理消息内容
   * @param {string} content - 消息内容
   * @param {string} assistantResponse - 当前助手响应
   * @param {HTMLElement} assistantElement - 助手消息元素
   * @param {HTMLElement} loadingElement - 加载提示元素
   * @param {boolean} thinkingContentShown - 思考内容是否已显示
   * @returns {Object} 更新后的状态
   * @private
   */
  _processMessageContent(
    content,
    assistantResponse,
    assistantElement,
    loadingElement,
    thinkingContentShown
  ) {
    let newAssistantResponse = assistantResponse;
    let newAssistantElement = assistantElement;
    let newThinkingContentShown = thinkingContentShown;

    // 检查消息中是否包含思考内容
    if (!newThinkingContentShown) {
      const result = this._processThinkingContent(
        content, 
        loadingElement, 
        newThinkingContentShown
      );
      newThinkingContentShown = result.thinkingContentShown;
    }

    // 处理消息内容
    if (!newAssistantElement) {
      newAssistantResponse = content;
      newAssistantElement = this._createMessageElement(
        newAssistantResponse,
        'assistant'
      );
      this.elements.messagesContainer.replaceChild(
        newAssistantElement,
        loadingElement
      );
      
      // 创建消息元素后立即处理按钮，需要找到消息元素
      const messageEl = newAssistantElement.querySelector('.xyg-chat-message');
      if (window.xygChatInstance && typeof window.xygChatInstance._processMessageButtons === 'function') {
        window.xygChatInstance._processMessageButtons(messageEl, false);
      }
      
      this._scrollToBottom();
    } else {
      // 找到消息元素进行更新
      const messageEl = newAssistantElement.querySelector('.xyg-chat-message');
      if (!messageEl) {
        console.error('无法找到消息元素');
        return {
          assistantResponse: newAssistantResponse,
          assistantElement: newAssistantElement,
          thinkingContentShown: newThinkingContentShown
        };
      }
      
      // 保存当前反馈按钮的状态
      const likeBtn = messageEl.querySelector('.xyg-chat-like-btn');
      const dislikeBtn = messageEl.querySelector('.xyg-chat-dislike-btn');
      const likeActive = likeBtn && likeBtn.classList.contains('active');
      const dislikeActive = dislikeBtn && dislikeBtn.classList.contains('active');
      const likeDisplay = likeBtn ? likeBtn.style.display : '';
      const dislikeDisplay = dislikeBtn ? dislikeBtn.style.display : '';
      
      newAssistantResponse += content;
      // 更新消息内容
      messageEl.innerHTML = this._formatMessage(newAssistantResponse, messageEl);
      
      // 恢复反馈按钮的状态
      setTimeout(() => {
        const newLikeBtn = messageEl.querySelector('.xyg-chat-like-btn');
        const newDislikeBtn = messageEl.querySelector('.xyg-chat-dislike-btn');
        
        if (newLikeBtn && likeActive) {
          newLikeBtn.classList.add('active');
        }
        
        if (newDislikeBtn && dislikeActive) {
          newDislikeBtn.classList.add('active');
        }
        
        // 恢复互斥显示状态
        if (newLikeBtn) {
          newLikeBtn.style.display = likeDisplay;
        }
        
        if (newDislikeBtn) {
          newDislikeBtn.style.display = dislikeDisplay;
        }
        
        // 处理消息中的按钮
        if (window.xygChatInstance && typeof window.xygChatInstance._processMessageButtons === 'function') {
          window.xygChatInstance._processMessageButtons(messageEl, false);
        }
      }, 0);
      
      // 每次处理新内容后滚动到底部
      this._scrollToBottom();
    }

    return {
      assistantResponse: newAssistantResponse,
      assistantElement: newAssistantElement,
      thinkingContentShown: newThinkingContentShown
    };
  },
};

export { response }; 