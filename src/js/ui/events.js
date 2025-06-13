/**
 * UI事件相关方法
 * @module DifyChat/ui/events
 * @author AI助手
 */

// 事件相关方法
const events = {
  /**
   * 绑定各种事件处理
   * @private
   */
  _bindEvents() {
    // 直接调用Utils中的方法
    const addEvent = (element, type, handler) => {
      if (!element) return;

      if (element.addEventListener) {
        element.addEventListener(type, handler, false);
      } else if (element.attachEvent) {
        element.attachEvent('on' + type, handler);
      } else {
        element['on' + type] = handler;
      }
    };

    // 处理历史消息中的按钮
    this._processHistoryButtons();
    
    // 初始化按钮事件委托
    this._initButtonEventDelegation();

    // 只在非只读模式下绑定发送相关事件
    if (!this.options.readOnly) {
      // 发送按钮点击
      addEvent(this.elements.sendButton, 'click', () => {
        const message = this.elements.messageInput.value.trim();
        if (message) {
          this._sendMessage(message);
        }
      });

      // 输入框回车发送
      addEvent(this.elements.messageInput, 'keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const message = this.elements.messageInput.value.trim();
          if (message) {
            this._sendMessage(message);
          }
        }
      });

      // 文件上传按钮点击
      if (this.elements.fileButton) {
        addEvent(this.elements.fileButton, 'click', () => {
          this.elements.fileInput.click();
        });
      }

      // 文件输入变化
      if (this.elements.fileInput) {
        addEvent(
          this.elements.fileInput,
          'change',
          this._handleFileInputChange.bind(this)
        );
      }

      // 输入框实时调整高度
      addEvent(
        this.elements.messageInput,
        'input',
        this._adjustTextareaHeight.bind(this)
      );
    }

    // 关闭按钮
    addEvent(this.elements.closeButton, 'click', () => {
      this.close();
    });

    // 重置按钮
    if (this.elements.resetButton) {
      addEvent(this.elements.resetButton, 'click', () => {
        this.reset();
      });
    }

    // 查看会话ID按钮
    if (this.elements.viewIdButton) {
      addEvent(this.elements.viewIdButton, 'click', (e) => {
        // 阻止事件冒泡，避免触发文档点击事件
        e.stopPropagation();

        // 获取当前会话ID
        const conversationId = this.conversation?.id || '暂无会话ID';

        // 移除可能已存在的旧tooltip
        const existingTooltip = document.querySelector('.xyg-chat-id-tooltip');
        if (existingTooltip) {
          document.body.removeChild(existingTooltip);
          return;
        }

        // 创建tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'xyg-chat-id-tooltip';

        // 创建ID文本
        const idText = document.createElement('span');
        idText.className = 'xyg-chat-id-text';
        idText.textContent = conversationId;
        tooltip.appendChild(idText);

        // 创建复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'xyg-chat-id-copy-btn';
        copyBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        copyBtn.title = '复制';
        tooltip.appendChild(copyBtn);

        // 复制按钮点击事件 - 使用mousedown而不是click以更早捕获事件
        copyBtn.addEventListener('mousedown', (e) => {
          // 立即阻止事件传播
          e.stopPropagation();
          e.preventDefault();

          // 创建临时文本区域用于复制
          const textarea = document.createElement('textarea');
          textarea.value = conversationId;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);

          // 显示复制成功提示
          copyBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';

          // 延迟后自动隐藏tooltip
          setTimeout(() => {
            if (document.body.contains(tooltip)) {
              document.body.removeChild(tooltip);
            }
          }, 1000);

          return false; // 确保不会有进一步的事件处理
        });

        // 为tooltip添加点击事件，阻止冒泡
        tooltip.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        // 定位tooltip
        const buttonRect = this.elements.viewIdButton.getBoundingClientRect();
        tooltip.style.top = `${buttonRect.top}px`;
        tooltip.style.right = `${
          document.documentElement.clientWidth - buttonRect.left + 10
        }px`;
        tooltip.style.left = 'auto'; // 清除可能的left值
        tooltip.classList.add('xyg-chat-id-tooltip-left'); // 添加左侧显示的类

        // 添加到文档
        document.body.appendChild(tooltip);

        // 点击其他地方关闭tooltip - 使用mousedown事件
        const closeTooltip = (e) => {
          // 确保不是点击tooltip内部元素或者按钮本身
          if (
            tooltip &&
            !tooltip.contains(e.target) &&
            e.target !== this.elements.viewIdButton
          ) {
            if (document.body.contains(tooltip)) {
              document.body.removeChild(tooltip);
            }
            document.removeEventListener('mousedown', closeTooltip, true);
          }
        };

        // 延迟添加事件监听，避免立即触发 - 使用捕获阶段
        setTimeout(() => {
          document.addEventListener('mousedown', closeTooltip, true);
        }, 100);
      });
    }

    // 启动按钮点击 - 修改为切换显示状态
    addEvent(this.elements.launchButton, 'click', () => {
      // 如果聊天窗口已显示则关闭，否则打开
      if (
        this.elements.chatContainer &&
        this.elements.chatContainer.style.display !== 'none' &&
        this._hasClass(this.elements.chatContainer, 'xyg-chat-show')
      ) {
        this.close();
      } else {
        this.open();
      }
    });

    // 添加点击外部关闭功能
    addEvent(document, 'mousedown', (e) => {
      // 如果聊天窗口未显示，不做处理
      if (
        !this.elements.chatContainer ||
        this.elements.chatContainer.style.display === 'none' ||
        !this._hasClass(this.elements.chatContainer, 'xyg-chat-show')
      ) {
        return;
      }

      // 检查是否点击在图片预览模态框内，如果是则不关闭聊天窗口
      const isClickInImgModal =
        e.target.closest('.xyg-chat-img-modal') ||
        e.target.closest('[data-xyg-chat-img-modal="true"]');
      if (isClickInImgModal) {
        return;
      }

      // 检查点击是否在聊天窗口内或在启动按钮上
      const isClickInside = this.elements.chatContainer.contains(e.target);
      const isClickOnLaunchButton = this.elements.launchButton.contains(
        e.target
      );

      // 如果点击在窗口外且不是点击启动按钮，则关闭窗口
      if (!isClickInside && !isClickOnLaunchButton) {
        this.close();
      }
    });

    // 初始化拖拽调整大小
    this._initResize();

    // 窗口大小改变时调整
    this._setupResizeHandler();

    // 初始化think标签折叠功能
    this._initThinkCollapse();

    // 初始化消息反馈功能
    this._bindMessageFeedbackEvents();
    
    // 绑定输入框事件
    this._bindInputEvents();
    
    // 绑定键盘快捷键
    this._bindKeyboardShortcuts();
  },

  /**
   * 绑定输入框事件处理
   * @private
   */
  _bindInputEvents() {
    if (!this.elements.messageInput) return;

    // 监听输入事件，自动调整高度
    this.elements.messageInput.addEventListener('input', (e) => {
      // 立即调整高度，提供实时反馈
      this._directAdjustTextareaHeight();

      // 防抖处理布局变化，避免频繁调用
      if (this._inputLayoutTimeout) {
        clearTimeout(this._inputLayoutTimeout);
      }

      // 延迟调用行布局调整，确保高度调整完成后再计算行布局
      this._inputLayoutTimeout = setTimeout(() => {
        this._handleInputChange();
      }, 100); // 延长防抖时间，避免频繁计算
    });

    // 监听窗口大小变化，确保重新计算输入框布局
    window.addEventListener(
      'resize',
      this._debounce(() => {
        if (
          this.elements.messageInput &&
          this.elements.messageInput.value.trim() !== ''
        ) {
          // 清除之前的计时器
          if (this._inputLayoutTimeout) {
            clearTimeout(this._inputLayoutTimeout);
          }

          // 立即调整高度
          this._directAdjustTextareaHeight();

          // 稍后再做一次布局调整
          this._inputLayoutTimeout = setTimeout(() => {
            this._handleInputChange();
          }, 100);
        }
      }, 200)
    ); // 增加防抖时间，避免在窗口调整大小过程中频繁计算

    // 监听输入事件，检测多行状态
    this.elements.messageInput.addEventListener('input', () => {
      this._handleInputChange();
    });

    // 监听键盘事件
    this.elements.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!e.shiftKey) {
          e.preventDefault();
          // 触发发送按钮点击事件
          if (this.elements.messageInput.value.trim() !== '') {
            this.elements.sendButton.click();
          }
        }
      }
      
      // 处理Backspace和Delete键，当内容即将为空时，确保立即更新高度
      if ((e.key === 'Backspace' || e.key === 'Delete') && 
          this.elements.messageInput.value.length <= 1) {
        // 使用setTimeout确保在键盘事件处理完成后执行
        setTimeout(() => {
          // 清空之前的计时器，避免冲突
          if (this._inputLayoutTimeout) {
            clearTimeout(this._inputLayoutTimeout);
          }
          
          // 强制更新高度相关变量
          if (typeof this._updateHeightVariables === 'function') {
            this._updateHeightVariables(true);
          }
          
          // 确保直接调整高度
          this._directAdjustTextareaHeight();
          
          // 重新计算布局
          this._handleInputChange();
        }, 0);
      }
    });

    // 监听焦点，确保在输入时检查多行状态
    this.elements.messageInput.addEventListener('focus', () => {
      this._handleInputChange();
    });
  },

  /**
   * 设置窗口调整大小处理程序
   * @private
   */
  _setupResizeHandler() {
    // 窗口大小改变时调整聊天窗口
    const handleWindowResize = () => {
      if (!this.elements.chatContainer) return;

      // 获取窗口宽度
      const windowWidth =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;

      // 计算最大宽度
      const maxWidth =
        ((this.options.maxWidthPercent || 70) * windowWidth) / 100;

      // 如果当前宽度大于最大宽度，则调整
      const currentWidth = parseInt(
        getComputedStyle(this.elements.chatContainer).width,
        10
      );
      if (currentWidth > maxWidth) {
        this.elements.chatContainer.style.width = maxWidth + 'px';
      }

      // 在窗口大小改变时重新计算输入框布局
      this._recalculateInputLayout();

      // 更新CSS变量
      this._updateHeightVariables();
      
      // 调整ECharts图表大小
      this._resizeEChartsCharts();
    };

    // 监听窗口大小改变事件
    window.addEventListener('resize', this._debounce(handleWindowResize, 100));
  },
  
  /**
   * 调整所有ECharts图表的大小
   * @private
   */
  _resizeEChartsCharts() {
    if (!this.elements.messagesContainer) return;
    
    // 查找所有ECharts图表容器
    const chartContainers = this.elements.messagesContainer.querySelectorAll('.xyg-chat-echarts-chart');
    let resizedCount = 0;
    
    chartContainers.forEach(container => {
      if (container._echartsInstance && !container._echartsInstance.isDisposed()) {
        try {
          // 检查容器是否可见
          const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
          
          // 只有当容器可见时才调整大小
          if (isVisible) {
          container._echartsInstance.resize();
            resizedCount++;
          }
        } catch (error) {
          console.warn('调整ECharts图表大小失败:', error);
        }
      } else if (container.id) {
        // 如果实例不存在但容器存在，可能是初始化失败，尝试重新渲染
        console.log(`尝试重新渲染图表: ${container.id}`);
        
        if (typeof this._recreateChart === 'function') {
          // 如果有重建图表方法，尝试重建
          this._recreateChart(container.id);
        } else if (window.echarts && typeof window.echarts.getInstanceByDom !== 'function') {
          // 检查是否有echarts实例
          const existingChart = window.echarts.getInstanceByDom(container);
          if (!existingChart) {
            console.log(`为容器 ${container.id} 创建新的ECharts实例`);
            try {
              const newChart = window.echarts.init(container);
              container._echartsInstance = newChart;
            } catch (error) {
              console.warn(`为容器 ${container.id} 创建新图表失败:`, error);
            }
          }
        }
      }
    });
    
    if (resizedCount > 0) {
      console.log(`成功调整了${resizedCount}/${chartContainers.length}个ECharts图表的大小`);
    }
  },

  /**
   * 初始化调整大小功能
   * @private
   */
  _initResize() {
    if (!this.elements.resizeHandle || !this.elements.chatContainer) return;

    let startX, startWidth;
    let animationFrameId = null;
    let resizing = false;
    let targetWidth = null;

    const startResize = (e) => {
      // 获取起始位置和宽度
      startX =
        e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      startWidth = parseInt(
        document.defaultView.getComputedStyle(this.elements.chatContainer)
          .width,
        10
      );
      targetWidth = startWidth;
      resizing = true;

      // 添加平滑过渡类
      document.body.style.cursor = 'ew-resize';
      document.body.classList.add('xyg-chat-resizing');
      this.elements.chatContainer.style.transition = 'none';
      this.elements.chatContainer.style.willChange = 'width';

      // 添加事件监听
      if (e.type === 'mousedown') {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResize);
      } else if (e.type === 'touchstart') {
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', stopResize);
      }

      // 启动渲染循环
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateSize);
      }

      e.preventDefault();
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        calculateTargetWidth(e.touches[0].clientX);
      }
    };

    const handleMouseMove = (e) => {
      calculateTargetWidth(e.clientX);
    };

    const calculateTargetWidth = (clientX) => {
      if (!resizing) return;

      // 计算新宽度 (鼠标向左移动，宽度增加)
      const newWidth = startWidth + (startX - clientX);

      // 获取窗口宽度
      const windowWidth =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;

      // 设置最小宽度和最大宽度（百分比）
      const minWidth = this.options.minWidth || 300;
      const maxWidth =
        ((this.options.maxWidthPercent || 70) * windowWidth) / 100;

      // 更新目标宽度，但不直接应用
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        targetWidth = newWidth;
      }
    };

    const updateSize = () => {
      if (resizing && targetWidth !== null) {
        // 应用宽度
        this.elements.chatContainer.style.width = `${targetWidth}px`;

        // 在拖动调整大小的过程中实时更新输入框高度
        if (
          this.elements.messageInput &&
          this.elements.messageInput.value.trim() !== ''
        ) {
          // 清除布局缓存，确保下一次计算采用新宽度
          this._lastMeasuredWidth = null;

          // 重新计算文本布局
          const { needsMultiLine, lineCount } = this._analyzeTextLayout(
            this.elements.messageInput.value
          );

          // 计算单行文本的基础高度和行高
          const lineHeight = 18; // 单行文字高度
          const baseHeight = 34; // 基础高度

          // 修正计算公式，减去多余的18px
          const calculatedHeight = Math.min(
            baseHeight + (lineCount - 1) * lineHeight - 18,
            150
          );

          // 设置高度
          this.elements.messageInput.style.height = `${calculatedHeight}px`;

          // 更新单行/多行布局状态
          if (needsMultiLine) {
            this.elements.inputContainer.classList.remove('single-line');

            // 超过一定行数启用滚动条
            if (lineCount >= 5 || calculatedHeight >= 140) {
              this.elements.messageInput.classList.add('show-scrollbar');
              this.elements.messageInput.style.overflowY = 'auto';
            } else {
              this.elements.messageInput.classList.remove('show-scrollbar');
              this.elements.messageInput.style.overflowY = 'hidden';
            }
          } else {
            this.elements.inputContainer.classList.add('single-line');
          }
        }
      }

      // 如果还在调整大小，则继续请求下一帧
      if (resizing) {
        animationFrameId = requestAnimationFrame(updateSize);
      }
    };

    const stopResize = () => {
      resizing = false;
      targetWidth = null;

      // 移除事件监听
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopResize);

      // 取消动画帧请求
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // 恢复样式
      document.body.style.cursor = '';
      document.body.classList.remove('xyg-chat-resizing');
      this.elements.chatContainer.style.willChange = 'auto';

      // 保存当前宽度到本地存储，用于下次打开时恢复
      if (window.localStorage) {
        try {
          localStorage.setItem(
            'xyg-chat-width',
            this.elements.chatContainer.style.width
          );
        } catch (e) {
          // 忽略本地存储错误
          console.warn('Failed to save chat width to localStorage:', e);
        }
      }

      // 调整完大小后重新计算输入框布局
      if (
        this.elements.messageInput &&
        this.elements.messageInput.value.trim() !== ''
      ) {
        // 清除布局缓存，确保下一次计算采用新宽度
        this._lastMeasuredWidth = null;
        this._debounceHandleInputChange();
      }

      // 在调整后添加过渡效果，使后续调整更平滑
      setTimeout(() => {
        if (this.elements.chatContainer) {
          this.elements.chatContainer.style.transition = 'width 0.2s ease';
        }
      }, 10);
    };

    // 鼠标事件
    this.elements.resizeHandle.addEventListener('mousedown', startResize);

    // 触摸事件
    this.elements.resizeHandle.addEventListener('touchstart', startResize, {
      passive: false
    });
  },
  
  /**
   * 绑定消息反馈（点赞/点踩）事件
   * @private
   */
  _bindMessageFeedbackEvents() {
    // 使用事件委托，监听消息容器中的点赞/点踩按钮点击
    if (this.elements.messagesContainer) {
      this.elements.messagesContainer.addEventListener('click', (e) => {
        // 查找被点击的反馈按钮
        const feedbackBtn = e.target.closest('.xyg-chat-message-feedback-btn');
        if (!feedbackBtn) return;

        // 获取消息ID和反馈类型
        const messageId = feedbackBtn.getAttribute('data-message-id');
        const feedbackType = feedbackBtn.getAttribute('data-feedback-type');
        
        if (!messageId || !feedbackType) return;

        // 判断是点赞还是点踩
        this._handleMessageFeedback(messageId, feedbackType);
      });
    }
  },

  /**
   * 处理文件输入变化事件
   * @param {Event} event - 文件输入事件对象
   * @private
   */
  _handleFileInputChange(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 创建文件预览区，如果不存在
    if (!this.elements.filePreviewContainer) {
      this.elements.filePreviewContainer = document.createElement('div');
      this.elements.filePreviewContainer.className = 'xyg-chat-file-previews';
      this.elements.inputWrapper.insertBefore(
        this.elements.filePreviewContainer,
        this.elements.inputContainer
      );
    }

    // 处理每个选中的文件
    Array.from(files).forEach((file) => {
      // 创建文件对象，添加唯一ID
      const fileObj = {
        id: this._generateUniqueId(),
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      };

      // 添加到选择的文件列表
      if (!this.selectedFiles) {
        this.selectedFiles = [];
      }
      this.selectedFiles.push(fileObj);

      // 添加文件预览
      this._addFilePreview(fileObj);
    });

    // 重置文件输入，允许再次选择相同文件
    event.target.value = '';
  },
  
  /**
   * 添加文件预览
   * @param {Object} fileObj - 文件对象
   * @private
   */
  _addFilePreview(fileObj) {
    // 创建文件预览元素
    const previewElem = document.createElement('div');
    previewElem.className = 'xyg-chat-file-preview';
    previewElem.setAttribute('data-file-id', fileObj.id);

    // 添加文件类型图标
    const iconElem = document.createElement('div');
    iconElem.className = 'xyg-chat-file-icon';
    
    // 根据文件类型设置不同的图标
    let iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    
    if (fileObj.type.startsWith('image/')) {
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    }
    
    iconElem.innerHTML = iconSvg;
    previewElem.appendChild(iconElem);

    // 添加文件名
    const nameElem = document.createElement('div');
    nameElem.className = 'xyg-chat-file-name';
    nameElem.textContent = fileObj.name.length > 20 ? fileObj.name.substring(0, 17) + '...' : fileObj.name;
    nameElem.title = fileObj.name;
    previewElem.appendChild(nameElem);

    // 添加删除按钮
    const removeBtn = document.createElement('button');
    removeBtn.className = 'xyg-chat-file-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = '移除文件';
    
    // 为删除按钮添加点击事件
    removeBtn.addEventListener('click', () => {
      this._removeFilePreview(fileObj.id);
    });
    
    previewElem.appendChild(removeBtn);

    // 添加到预览容器
    this.elements.filePreviewContainer.appendChild(previewElem);
    
    // 显示文件预览区
    this.elements.filePreviewContainer.style.display = 'flex';
  },
  
  /**
   * 移除文件预览
   * @param {string} fileId - 文件ID
   * @private
   */
  _removeFilePreview(fileId) {
    // 从DOM中移除预览
    const previewElem = this.elements.filePreviewContainer.querySelector(`[data-file-id="${fileId}"]`);
    if (previewElem) {
      this.elements.filePreviewContainer.removeChild(previewElem);
    }
    
    // 从选择的文件列表中移除
    this.selectedFiles = this.selectedFiles.filter(file => file.id !== fileId);
    
    // 如果没有文件了，隐藏预览区
    if (this.selectedFiles.length === 0) {
      this.elements.filePreviewContainer.style.display = 'none';
    }
  },
  
  /**
   * 调整文本区域高度
   * @private
   */
  _adjustTextareaHeight() {
    if (!this.elements.messageInput) return;
    
    // 重置文本区域高度，获取实际的scrollHeight
    this.elements.messageInput.style.height = 'auto';
    
    // 计算新的高度，限制最大高度
    const scrollHeight = this.elements.messageInput.scrollHeight;
    const maxHeight = 150; // 最大高度
    const newHeight = Math.min(scrollHeight, maxHeight);
    
    // 设置新高度
    this.elements.messageInput.style.height = `${newHeight}px`;
    
    // 启用或禁用滚动条
    if (scrollHeight > maxHeight) {
      this.elements.messageInput.style.overflowY = 'auto';
    } else {
      this.elements.messageInput.style.overflowY = 'hidden';
    }
    
    // 检查文本内容是否为空
    const isEmpty = this.elements.messageInput.value.trim() === '';
    
    // 添加或删除对应的CSS类
    if (isEmpty) {
      this.elements.inputContainer.classList.add('empty');
      this.elements.inputContainer.classList.add('single-line');
    } else {
      this.elements.inputContainer.classList.remove('empty');
      
      // 如果高度大于基本高度，则为多行
      if (newHeight > 36) {
        this.elements.inputContainer.classList.remove('single-line');
      } else {
        this.elements.inputContainer.classList.add('single-line');
      }
    }
    
    // 更新布局
    if (this._updateLayout && typeof this._updateLayout === 'function') {
      this._updateLayout();
    }
  },
  
  /**
   * 直接调整文本区域高度，不做额外处理
   * @private
   */
  _directAdjustTextareaHeight() {
    if (!this.elements.messageInput) return;
    
    // 重置高度获取实际scrollHeight
    this.elements.messageInput.style.height = 'auto';
    
    // 计算新高度，限制最大高度
    const scrollHeight = this.elements.messageInput.scrollHeight;
    const maxHeight = 150;
    const newHeight = Math.min(scrollHeight, maxHeight);
    
    // 设置新高度
    this.elements.messageInput.style.height = `${newHeight}px`;
    
    // 启用或禁用滚动条
    if (scrollHeight > maxHeight) {
      this.elements.messageInput.style.overflowY = 'auto';
    } else {
      this.elements.messageInput.style.overflowY = 'hidden';
    }
  },
  
  /**
   * 处理输入变化
   * @private
   */
  _handleInputChange() {
    if (!this.elements.messageInput) return;
    
    const value = this.elements.messageInput.value;
    const isEmpty = value.trim() === '';
    
    // 更新输入容器的状态
    if (isEmpty) {
      this.elements.inputContainer.classList.add('empty');
      this.elements.inputContainer.classList.add('single-line');
    } else {
      this.elements.inputContainer.classList.remove('empty');
      
      // 分析文本布局
      const { needsMultiLine } = this._analyzeTextLayout(value);
      
      if (needsMultiLine) {
        this.elements.inputContainer.classList.remove('single-line');
      } else {
        this.elements.inputContainer.classList.add('single-line');
      }
    }
    
    // 直接调整高度
    this._directAdjustTextareaHeight();
  },
  
  /**
   * 防抖处理输入变化
   * @private
   */
  _debounceHandleInputChange() {
    // 使用防抖函数限制调用频率
    if (this._inputChangeTimeout) {
      clearTimeout(this._inputChangeTimeout);
    }
    
    this._inputChangeTimeout = setTimeout(() => {
      this._handleInputChange();
    }, 100);
  },
  
  /**
   * 检查实例是否有特定方法
   * @param {string} methodName - 方法名
   * @returns {boolean} - 是否有该方法
   * @private
   */
  _hasMethod(methodName) {
    return typeof this[methodName] === 'function';
  },

  /**
   * 移除所有事件监听器
   * @private
   */
  _removeAllEventListeners() {
    // 简化版，仅通用方法
    if (window) {
      window.removeEventListener('resize', null);
    }
  },
  
  /**
   * 初始化think标签折叠功能
   * @private
   */
  _initThinkCollapse() {
    // 使用事件委托，监听消息容器中的think标签点击
    if (this.elements.messagesContainer) {
      this.elements.messagesContainer.addEventListener('click', (e) => {
        // 查找被点击的think标题 - 支持两种类型
        const thinkTitle = e.target.closest('.xyg-chat-think-title');
        const thinkingHeader = e.target.closest('.xyg-chat-thinking-header');
        
        // 处理传统的think标签
        if (thinkTitle) {
          // 获取think容器
          const thinkContainer = thinkTitle.closest('.xyg-chat-think');
          if (!thinkContainer) return;
          
          // 切换折叠状态
          this._toggleClass(thinkContainer, 'xyg-chat-think-collapsed');
          
          // 更新折叠图标
          const collapseIcon = thinkTitle.querySelector('.xyg-chat-think-collapse-icon');
          if (collapseIcon) {
            if (this._hasClass(thinkContainer, 'xyg-chat-think-collapsed')) {
              collapseIcon.innerHTML = '+';
              collapseIcon.title = '展开思考过程';
            } else {
              collapseIcon.innerHTML = '−';
              collapseIcon.title = '收起思考过程';
            }
          }
          e.stopPropagation();
          return;
        }
        
        // 处理新式的thinking标签（包括历史消息）
        if (thinkingHeader) {
          // 获取thinking容器
          const thinkingContainer = thinkingHeader.closest('.xyg-chat-thinking');
          if (!thinkingContainer) return;
          
          console.log('深度思考标题被点击，当前折叠状态:', thinkingContainer.classList.contains('xyg-chat-thinking-collapsed'));
          
          // 切换折叠状态
          thinkingContainer.classList.toggle('xyg-chat-thinking-collapsed');
          
          console.log('深度思考折叠状态已切换为:', thinkingContainer.classList.contains('xyg-chat-thinking-collapsed'));
          
          // 更新折叠图标
          const collapseIcon = thinkingHeader.querySelector('.xyg-chat-thinking-icon');
          if (collapseIcon) {
            if (thinkingContainer.classList.contains('xyg-chat-thinking-collapsed')) {
              collapseIcon.style.transform = 'rotate(-90deg)';
            } else {
              collapseIcon.style.transform = 'rotate(0deg)';
            }
          }
          
          e.stopPropagation();
          return;
        }
      });
      
      // 监听DOM变化，为新添加的think标签添加折叠功能
      if (window.MutationObserver) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  // 查找新添加的think标签（两种类型）
                  const thinkElements = node.querySelectorAll('.xyg-chat-think');
                  thinkElements.forEach((thinkElement) => {
                    this._setupThinkCollapseFeature(thinkElement);
                  });
                  
                  const thinkingElements = node.querySelectorAll('.xyg-chat-thinking');
                  thinkingElements.forEach((thinkingElement) => {
                    this._setupThinkingCollapseFeature(thinkingElement);
                  });
                  
                  // 如果节点本身就是think标签
                  if (node.classList && node.classList.contains('xyg-chat-think')) {
                    this._setupThinkCollapseFeature(node);
                  }
                  
                  // 如果节点本身就是thinking标签
                  if (node.classList && node.classList.contains('xyg-chat-thinking')) {
                    this._setupThinkingCollapseFeature(node);
                  }
                }
              });
            }
          });
        });
        
        // 开始观察消息容器
        observer.observe(this.elements.messagesContainer, {
          childList: true,
          subtree: true
        });
        
        // 保存观察者引用，以便后续可以断开
        this._thinkObserver = observer;
      }
      
      // 初始化时处理已存在的thinking元素
      const existingThinkingElements = this.elements.messagesContainer.querySelectorAll('.xyg-chat-thinking');
      existingThinkingElements.forEach((thinkingElement) => {
        this._setupThinkingCollapseFeature(thinkingElement);
      });
      
      console.log(`已为${existingThinkingElements.length}个现有深度思考元素设置折叠功能`);
    }
  },
  
  /**
   * 为think元素设置折叠功能
   * @param {HTMLElement} thinkElement - think标签元素
   * @private
   */
  _setupThinkCollapseFeature(thinkElement) {
    // 检查是否已设置折叠功能
    if (thinkElement.dataset.collapsible === 'true') return;
    
    // 标记为已设置折叠功能
    thinkElement.dataset.collapsible = 'true';
    
    // 查找或创建标题元素
    let titleElement = thinkElement.querySelector('.xyg-chat-think-title');
    if (!titleElement) {
      titleElement = document.createElement('div');
      titleElement.className = 'xyg-chat-think-title';
      titleElement.textContent = '思考过程';
      
      // 如果think元素有子元素，将标题插入到第一个位置
      if (thinkElement.firstChild) {
        thinkElement.insertBefore(titleElement, thinkElement.firstChild);
      } else {
        thinkElement.appendChild(titleElement);
      }
    }
    
    // 添加折叠图标，如果没有
    if (!titleElement.querySelector('.xyg-chat-think-collapse-icon')) {
      const collapseIcon = document.createElement('span');
      collapseIcon.className = 'xyg-chat-think-collapse-icon';
      collapseIcon.innerHTML = '−';
      collapseIcon.title = '收起思考过程';
      titleElement.appendChild(collapseIcon);
    }
    
    // 默认状态：展开
    if (this._hasClass(thinkElement, 'xyg-chat-think-collapsed')) {
      const collapseIcon = titleElement.querySelector('.xyg-chat-think-collapse-icon');
      if (collapseIcon) {
        collapseIcon.innerHTML = '+';
        collapseIcon.title = '展开思考过程';
      }
    }
  },
  
  /**
   * 为thinking元素设置折叠功能
   * @param {HTMLElement} thinkingElement - thinking标签元素
   * @private
   */
  _setupThinkingCollapseFeature(thinkingElement) {
    // 检查是否已设置折叠功能
    if (thinkingElement.dataset.thinkingCollapsible === 'true') return;
    
    // 标记为已设置折叠功能
    thinkingElement.dataset.thinkingCollapsible = 'true';
    
    // 确保有正确的初始状态
    if (!thinkingElement.classList.contains('xyg-chat-thinking-collapsed')) {
      thinkingElement.classList.add('xyg-chat-thinking-collapsed');
    }
    
    // 确保折叠图标的初始状态
    const collapseIcon = thinkingElement.querySelector('.xyg-chat-thinking-icon');
    if (collapseIcon && thinkingElement.classList.contains('xyg-chat-thinking-collapsed')) {
      collapseIcon.style.transform = 'rotate(-90deg)';
    }
    
    console.log('为thinking元素设置了折叠功能');
  },

  /**
   * 绑定键盘快捷键
   * @private
   */
  _bindKeyboardShortcuts() {
    // 直接调用Utils中的方法
    const addEvent = (element, type, handler) => {
      if (!element) return;

      if (element.addEventListener) {
        element.addEventListener(type, handler, false);
      } else if (element.attachEvent) {
        element.attachEvent('on' + type, handler);
      } else {
        element['on' + type] = handler;
      }
    };

    // 监听全局键盘事件
    addEvent(document, 'keydown', (e) => {
      // Alt + C 切换聊天窗口
      if (e.altKey && (e.key === 'c' || e.key === 'C' || e.keyCode === 67)) {
        e.preventDefault(); // 阻止默认行为
        e.stopPropagation(); // 阻止事件冒泡
        
        // 检查聊天组件是否已初始化
        if (!this.isInitialized) {
          console.warn('聊天组件尚未初始化，无法使用快捷键');
          return;
        }
        
        // 切换聊天窗口显示状态
        if (
          this.elements.chatContainer &&
          this.elements.chatContainer.style.display !== 'none' &&
          this._hasClass(this.elements.chatContainer, 'xyg-chat-show')
        ) {
          // 当前已打开，关闭聊天窗口
          this.close();
        } else {
          // 当前已关闭，打开聊天窗口
          this.open();
        }
      }
    });
  }
};

export { events }; 