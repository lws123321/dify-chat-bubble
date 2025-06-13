/**
 * UI布局相关方法
 * @module DifyChat/ui/layout
 * @author AI助手
 */

// 布局相关方法
const layout = {
  /**
   * 设置输入区域高度观察器
   * @private
   */
  _setupInputHeightObserver() {
    if (!this.elements.inputContainer) return;

    // 初始设置CSS变量
    this._updateHeightVariables();

    // 使用ResizeObserver监听输入容器大小变化
    if (typeof ResizeObserver !== 'undefined') {
      this.inputContainerResizeObserver = new ResizeObserver((entries) => {
        // 防止重复处理
        if (this._isUpdatingVariables) return;

        for (const entry of entries) {
          if (entry.target === this.elements.inputContainer) {
            // 输入容器大小变化时立即更新CSS变量
            this._updateHeightVariables(true);
          }
        }
      });

      // 开始观察输入容器大小变化
      this.inputContainerResizeObserver.observe(this.elements.inputContainer);
    }

    // 后备方案：使用MutationObserver监听样式变化
    this.inputStyleObserver = new MutationObserver((mutations) => {
      // 防止重复处理
      if (this._isUpdatingVariables) return;

      let shouldUpdate = false;
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' ||
            mutation.attributeName === 'class')
        ) {
          shouldUpdate = true;
          break;
        }
      }

      if (shouldUpdate) {
        this._updateHeightVariables(true);
      }
    });

    // 开始观察样式变化
    this.inputStyleObserver.observe(this.elements.inputContainer, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  },

  /**
   * 更新高度相关的CSS变量
   * @param {boolean} immediate - 是否立即更新DOM，不使用requestAnimationFrame
   * @param {boolean} forceAdjustMessagesArea - 是否强制调整消息区域大小
   * @private
   */
  _updateHeightVariables(immediate = false, forceAdjustMessagesArea = false) {
    if (!this.elements.chatContainer || !this.elements.inputContainer) return;

    // 防止重复执行或触发无限循环
    if (this._isUpdatingVariables) return;
    this._isUpdatingVariables = true;

    const updateVariables = () => {
      try {
        // 获取头部高度
        const headerHeight = this.elements.header
          ? this.elements.header.offsetHeight
          : 50;

        // 安全地获取输入区域高度，不再强制重排
        const inputHeight = this.elements.inputContainer.offsetHeight;

        // 检查输入框是否为空
        const isEmpty = this.elements.messageInput && 
                        this.elements.messageInput.value.trim() === '';
        
        // 获取当前设置的高度值
        const currentInputHeight = parseInt(
          this.elements.chatContainer.style.getPropertyValue('--input-height') || '0', 
          10
        );
        
        // 当内容为空或高度有明显变化时，立即更新
        const shouldUpdate = isEmpty || 
                             Math.abs(currentInputHeight - inputHeight) >= 3 || 
                             forceAdjustMessagesArea;

        // 只使用setProperty方法设置CSS变量，避免修改整个style属性
        this.elements.chatContainer.style.setProperty(
          '--header-height',
          `${headerHeight}px`
        );
        this.elements.chatContainer.style.setProperty(
          '--input-height',
          `${inputHeight}px`
        );

        // 当内容为空或强制更新时，立即调整消息区域大小
        if (shouldUpdate && this._ensureMessagesAreaFillsSpace) {
          this._ensureMessagesAreaFillsSpace();
        }
      } finally {
        // 确保无论如何都重置标志
        this._isUpdatingVariables = false;
      }
    };

    // 根据需求决定是否立即更新
    if (immediate) {
      updateVariables();
    } else {
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(updateVariables);
    }
  },

  /**
   * 添加聊天窗口大小变化监听
   * @private
   */
  _addChatContainerResizeListener() {
    // 使用ResizeObserver监听聊天窗口大小变化
    if (typeof ResizeObserver !== 'undefined') {
      this.chatContainerResizeObserver = new ResizeObserver(
        this._debounce((entries) => {
          for (const entry of entries) {
            if (entry.target === this.elements.chatContainer) {
              if (
                this.elements.messageInput &&
                this.elements.messageInput.value.trim() !== ''
              ) {
                // 清除缓存数据
                this._lastMeasuredWidth = null;
                this._lastMeasuredText = null;

                // 重新计算输入框高度
                this._handleInputChange();

                // console.log('聊天窗口大小变化，重新计算输入框高度');
              }
            }
          }
        }, 50)
      );

      // 开始观察聊天容器大小变化
      if (this.elements.chatContainer) {
        this.chatContainerResizeObserver.observe(this.elements.chatContainer);
      }
    } else {
      // 降级处理：如果浏览器不支持ResizeObserver，使用窗口resize事件
      this._legacyResizeHandler = this._debounce(() => {
        if (
          this.elements.messageInput &&
          this.elements.messageInput.value.trim() !== ''
        ) {
          this._lastMeasuredWidth = null;
          this._handleInputChange();
        }
      }, 100);

      window.addEventListener('resize', this._legacyResizeHandler);
    }
  },

  /**
   * 直接调整textarea高度的快速方法，不依赖其他模块
   * 用于input事件的实时响应
   * @private
   */
  _directAdjustTextareaHeight() {
    const textarea = this.elements.messageInput;
    if (!textarea) return;

    // 检查是否为空文本
    const isEmpty = textarea.value.trim() === '';

    // 保存滚动位置
    const scrollPos = textarea.scrollTop;

    // 获取当前高度
    const currentHeight = parseInt(textarea.style.height || '0', 10);

    // 对于空文本，直接设置为基础高度并更新布局
    if (isEmpty) {
      const baseHeight = 34; // 单行时的固定高度
      
      // 如果高度差异太小，不做调整，避免抖动
      if (Math.abs(baseHeight - currentHeight) < 3 && currentHeight > 0) {
        return;
      }
      
      // 设置高度
      textarea.style.height = `${baseHeight}px`;
      
      // 更新样式
      textarea.classList.remove('show-scrollbar');
      textarea.style.overflowY = 'hidden';
      
      // 更新输入容器状态
      if (this.elements.inputContainer) {
        this.elements.inputContainer.classList.add('single-line');
      }
      
      // 立即更新CSS变量，确保实时反映高度变化
      if (this._updateHeightVariables) {
        this._updateHeightVariables(true, true); // 强制更新
      }
      
      return;
    }

    // 计算行数
    const { lineCount } = this._analyzeTextLayout(textarea.value);

    // 计算单行文本的基础高度和行高
    const baseHeight = 34; // 单行时的固定高度

    // 获取实际的行高（1.2rem）
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 19.2; // 1.2rem约等于19.2px (16px * 1.2)

    // 计算高度
    let calculatedHeight;
    if (lineCount <= 1) {
      calculatedHeight = baseHeight; // 单行固定高度
    } else {
      // 修正计算公式，多行时减去15px，但考虑实际行数减1
      calculatedHeight = Math.min(
        baseHeight + (lineCount - 1) * lineHeight - 15,
        150
      );
    }

    // 如果高度差异太小，不做调整，避免抖动
    if (Math.abs(calculatedHeight - currentHeight) < 3 && currentHeight > 0) {
      return;
    }

    // 设置高度
    textarea.style.height = `${calculatedHeight}px`;

    // 超过一定行数启用滚动条
    if (lineCount >= 5 || calculatedHeight >= 140) {
      textarea.classList.add('show-scrollbar');
      textarea.style.overflowY = 'auto';
    } else {
      textarea.classList.remove('show-scrollbar');
      textarea.style.overflowY = 'hidden';
    }

    // 恢复滚动位置
    textarea.scrollTop = scrollPos;
    
    // 更新CSS变量，确保实时反映高度变化
    if (this._updateHeightVariables) {
      this._updateHeightVariables(true);
    }
  },

  /**
   * 处理输入变化
   * @private
   */
  _handleInputChange() {
    const textarea = this.elements.messageInput;
    const text = textarea.value;

    // 获取当前高度和样式
    const currentHeight = parseInt(textarea.style.height || '0', 10);
    const isSingleLine =
      this.elements.inputContainer.classList.contains('single-line');

    // 检查文本是否为空
    const isEmpty = text.trim() === '';
    
    // 如果文本为空，直接重置并更新
    if (isEmpty) {
      // 重置样式
      textarea.classList.remove('two-lines', 'multiline', 'show-scrollbar');
      textarea.style.overflowY = 'hidden';
      
      // 单行模式
      this.elements.inputContainer.classList.add('single-line');
      
      // 设置基础高度
      const baseHeight = 34;
      textarea.style.height = `${baseHeight}px`;
      
      // 强制更新高度变量
      this._updateHeightVariables(true, true);
      
      return;
    }

    // 智能判断是否需要多行及所需的行数
    const { needsMultiLine, lineCount } = this._analyzeTextLayout(text);

    // 计算单行文本的基础高度和行高
    const baseHeight = 34; // 基础高度

    // 获取实际的行高（1.2rem）
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 18; // 1.2rem约等于18px (15px * 1.2)

    // 计算高度
    let calculatedHeight;
    if (lineCount <= 1) {
      calculatedHeight = baseHeight; // 单行固定45px
    } else {
      // 修正计算公式，多行时减去15px，但考虑实际行数减1
      calculatedHeight = Math.min(
        baseHeight + (lineCount - 1) * lineHeight - 15,
        150
      );
    }

    // 是否需要更新高度 - 只有当高度差异超过阈值时才更新
    const needHeightUpdate =
      Math.abs(calculatedHeight - currentHeight) >= 3 || currentHeight <= 0;

    // 是否需要更新布局模式 - 单行/多行切换
    const needLayoutUpdate =
      (needsMultiLine && isSingleLine) || (!needsMultiLine && !isSingleLine);

    // 如果没有需要更新的内容，直接返回
    if (!needHeightUpdate && !needLayoutUpdate) {
      return;
    }

    // 清除所有类名和样式
    textarea.classList.remove('two-lines', 'multiline', 'show-scrollbar');
    textarea.style.overflowY = 'hidden';

    // 根据行数设置布局
    if (needsMultiLine) {
      // 多于1行，切换到多行布局
      this.elements.inputContainer.classList.remove('single-line');

      // 设置高度
      if (needHeightUpdate) {
        textarea.style.height = `${calculatedHeight}px`;
      }

      // 检查行数或内容是否超长
      if (lineCount >= 5 || calculatedHeight >= 140) {
        // 行数过多，启用滚动条
        textarea.classList.add('show-scrollbar');

        // 确保在DOM更新后设置滚动条
        requestAnimationFrame(() => {
          textarea.style.overflowY = 'auto';
          textarea.scrollTop = textarea.scrollHeight;
        });
      }
    } else {
      // 单行文本，使用单行布局
      this.elements.inputContainer.classList.add('single-line');

      // 单行模式固定高度
      textarea.style.height = `${baseHeight}px`;
    }

    // 总是滚动到底部
    textarea.scrollTop = textarea.scrollHeight;

    // 立即更新CSS变量，确保实时反映高度变化
    this._updateHeightVariables(true); // 使用true立即更新
  },

  /**
   * 分析文本布局需求
   * @param {string} text - 输入文本
   * @returns {Object} - 包含是否需要多行及行数的对象
   * @private
   */
  _analyzeTextLayout(text) {
    if (!text || text.trim() === '') {
      return { needsMultiLine: false, lineCount: 1 };
    }

    // 获取容器当前宽度 - 缓存当前宽度以避免重复计算
    const currentWidth = this.elements.inputWrapper.clientWidth;

    // 如果宽度与上次计算时不同，清除缓存的测量结果
    if (this._lastMeasuredWidth !== currentWidth) {
      this._cachedLineCount = null;
      this._lastMeasuredWidth = currentWidth;
    }

    // 如果文本没变且已有缓存，直接返回缓存结果
    if (this._lastMeasuredText === text && this._cachedLineCount !== null) {
      return {
        needsMultiLine: this._cachedLineCount > 1,
        lineCount: this._cachedLineCount
      };
    }

    // 计算文本实际所需行数
    const lineCount = this._countApproximateLines(text);

    // 缓存结果
    this._lastMeasuredText = text;
    this._cachedLineCount = lineCount;

    // 如果行数大于1，需要多行模式
    return {
      needsMultiLine: lineCount > 1,
      lineCount: lineCount
    };
  },

  /**
   * 判断文本是否需要多行显示
   * @param {string} text - 输入文本
   * @returns {boolean} - 是否需要多行
   * @private
   */
  _needsMultiLine(text) {
    const { needsMultiLine } = this._analyzeTextLayout(text);
    return needsMultiLine;
  },

  /**
   * 测量文本宽度
   * @param {string} text - 要测量的文本
   * @returns {number} - 文本宽度(px)
   * @private
   */
  _measureTextWidth(text) {
    // 创建临时测量元素
    const measure = document.createElement('span');

    // 复制输入框的字体样式
    const textStyle = window.getComputedStyle(this.elements.messageInput);
    measure.style.font = textStyle.font;
    measure.style.fontSize = textStyle.fontSize;
    measure.style.fontFamily = textStyle.fontFamily;
    measure.style.letterSpacing = textStyle.letterSpacing;
    measure.style.whiteSpace = 'pre'; // 保留空格
    measure.style.position = 'absolute';
    measure.style.visibility = 'hidden';

    // 设置文本并添加到DOM中测量
    measure.textContent = text;
    document.body.appendChild(measure);
    const width = measure.getBoundingClientRect().width;
    document.body.removeChild(measure);

    return width;
  },

  /**
   * 获取输入框的可用文本宽度
   * @returns {number} - 可用宽度(px)
   * @private
   */
  _getAvailableTextWidth() {
    const inputStyle = window.getComputedStyle(this.elements.messageInput);
    const paddingLeft = parseFloat(inputStyle.paddingLeft);
    const paddingRight = parseFloat(inputStyle.paddingRight);

    // 输入框宽度减去内边距和右侧按钮所占空间
    const buttonSpace = 60; // 按钮宽度+间距
    return (
      this.elements.messageInput.clientWidth -
      paddingLeft -
      paddingRight -
      buttonSpace
    );
  },

  /**
   * 估算文本的行数
   * @param {string} text - 输入文本
   * @returns {number} - 估算行数
   * @private
   */
  _countApproximateLines(text) {
    if (!text) return 1;

    // 按换行符分割
    const lines = text.split('\n');

    // 获取可用宽度
    const availableWidth = this._getAvailableTextWidth();

    // 获取当前字体样式下的平均字符宽度
    const averageCharWidth = this._getAverageCharWidth();

    // 累计行数
    let totalLines = 0;

    // 对每一行进行宽度测量
    for (const line of lines) {
      if (line.trim() === '') {
        totalLines += 1; // 空行算一行
        continue;
      }

      // 使用更精确的方法测量行宽
      const lineWidth = this._measureTextWidthAccurate(line, averageCharWidth);

      // 计算这一行文本需要的行数，考虑字体可能的变化和中英文混排情况
      // 使用1.05系数作为微调，避免高估行数
      const lineCount = Math.max(
        1,
        Math.ceil((lineWidth * 1.05) / availableWidth)
      );
      totalLines += lineCount;
    }

    return totalLines;
  },

  /**
   * 获取当前字体下的平均字符宽度
   * @returns {number} - 平均字符宽度
   * @private
   */
  _getAverageCharWidth() {
    // 创建一个包含常见字符的字符串
    const sampleText =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789中文日本語한국어';

    // 测量样本文本宽度
    const sampleWidth = this._measureTextWidth(sampleText);

    // 计算平均字符宽度
    return sampleWidth / sampleText.length;
  },

  /**
   * 更精确地测量文本宽度，考虑不同字符的宽度差异
   * @param {string} text - 要测量的文本
   * @param {number} averageCharWidth - 平均字符宽度
   * @returns {number} - 文本宽度(px)
   * @private
   */
  _measureTextWidthAccurate(text, averageCharWidth) {
    // 针对特殊字符和中日韩文字的宽度调整
    let adjustedWidth = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);

      // CJK字符通常需要两倍宽度
      if (
        (code >= 0x4e00 && code <= 0x9fff) || // 中文
        (code >= 0x3040 && code <= 0x30ff) || // 日文
        (code >= 0xac00 && code <= 0xd7af)
      ) {
        // 韩文
        adjustedWidth += averageCharWidth * 1.8;
      }
      // 宽字符（如W、M等）
      else if (/[WMwm]/.test(char)) {
        adjustedWidth += averageCharWidth * 1.5;
      }
      // 窄字符（如i、l等）
      else if (/[il|'.`]/.test(char)) {
        adjustedWidth += averageCharWidth * 0.7;
      }
      // 其他字符使用平均宽度
      else {
        adjustedWidth += averageCharWidth;
      }
    }

    // 对于长文本，直接进行实际测量，可能更准确
    if (text.length > 50) {
      const measuredWidth = this._measureTextWidth(text);
      // 取估算值和测量值的较大值，确保足够空间
      return Math.max(adjustedWidth, measuredWidth);
    }

    return adjustedWidth;
  },

  /**
   * 重置输入框
   * @private
   */
  _resetInput() {
    const textarea = this.elements.messageInput;
    textarea.value = '';
    textarea.classList.remove('two-lines', 'multiline', 'show-scrollbar');
    textarea.style.overflowY = 'hidden';

    // 重置为单行高度
    textarea.style.height = '45px';

    // 恢复单行布局
    this.elements.inputContainer.classList.add('single-line');

    textarea.focus();
  },

  /**
   * 重新计算输入框布局
   * 在窗口大小改变或容器宽度调整后调用
   * @private
   */
  _recalculateInputLayout() {
    if (!this.elements.messageInput) return;

    // 强制清除布局缓存
    this._lastMeasuredWidth = null;
    this._lastMeasuredText = null;
    this._cachedLineCount = null;

    // 如果有文本内容，使用新方法重新计算布局
    if (this.elements.messageInput.value.trim() !== '') {
      this._forceInputEvent();
    }
  },

  /**
   * 强制更新输入框布局
   * 针对输入框宽度变化的情况
   * @public
   */
  forceUpdateInputLayout() {
    if (this.elements.messageInput && this.elements.messageInput.value) {
      // 强制清除缓存的测量结果
      this._lastMeasuredWidth = null;
      this._handleInputChange();

      // 延时再次计算以确保准确
      setTimeout(() => {
        this._handleInputChange();
      }, 50);
    }
  },

  /**
   * 直接调整textarea高度的辅助方法，确保UI模块也有这个方法
   * @private
   */
  _adjustTextareaHeight() {
    // 直接使用_directAdjustTextareaHeight方法保持一致性
    this._directAdjustTextareaHeight();
  },

  /**
   * 强制触发输入事件
   * 通过修改值和恢复值的方式强制触发input事件
   * @private
   */
  _forceInputEvent() {
    if (!this.elements.messageInput) return;

    const textarea = this.elements.messageInput;
    const originalValue = textarea.value;

    // 如果文本框为空，不处理
    if (originalValue.trim() === '') return;

    // 保存当前光标位置
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    // 清除可能的正在进行的计时器
    if (this._inputLayoutTimeout) {
      clearTimeout(this._inputLayoutTimeout);
      this._inputLayoutTimeout = null;
    }

    // 直接调用调整高度方法
    this._directAdjustTextareaHeight();

    // 只调用一次布局计算，避免多次调用
    requestAnimationFrame(() => {
      this._handleInputChange();
    });

    // 恢复光标位置
    textarea.selectionStart = selectionStart;
    textarea.selectionEnd = selectionEnd;
  },

  /**
   * 确保消息区域填充可用空间
   * @private
   */
  _ensureMessagesAreaFillsSpace() {
    if (!this.elements.messagesContainer || !this.elements.chatContainer)
      return;

    // 使用requestAnimationFrame确保DOM已更新
    requestAnimationFrame(() => {
      // 获取聊天容器的高度
      const containerHeight = this.elements.chatContainer.clientHeight;

      // 获取头部的高度
      const headerHeight = this.elements.header
        ? this.elements.header.offsetHeight
        : 0;

      // 获取输入区域的高度
      const inputHeight = this.elements.inputContainer
        ? this.elements.inputContainer.offsetHeight
        : 0;

      // 计算消息区域应该的高度
      const messagesHeight = containerHeight - headerHeight - inputHeight;

      // 确保消息区域至少有一个最小高度
      const minHeight = Math.max(200, messagesHeight);

      // console.log(`设置消息区域高度: ${minHeight}px (容器: ${containerHeight}px, 头部: ${headerHeight}px, 输入: ${inputHeight}px)`);

      // 设置消息区域高度
      this.elements.messagesContainer.style.minHeight = `${minHeight}px`;
      this.elements.messagesContainer.style.maxHeight = `${messagesHeight}px`;
    });
  }
};

export { layout }; 