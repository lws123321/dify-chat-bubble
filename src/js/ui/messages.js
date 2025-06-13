/**
 * UI消息相关方法
 * @module DifyChat/ui/messages
 * @author AI助手
 */

import { formatHelpers } from '../utils/format.js';

// 消息处理相关方法
const messages = {
  /**
   * 创建消息元素
   * @param {string} content - 消息内容
   * @param {string} role - 消息角色（user/assistant/error）
   * @param {boolean} isHistory - 是否是历史消息
   * @returns {HTMLElement} 消息元素
   * @private
   */
  _createMessageElement(content, role, isHistory = false) {
    // 创建消息容器
    const messageContainer = document.createElement('div');
    messageContainer.className = `xyg-chat-message-container xyg-chat-message-container-${role}`;

    // 创建头像元素
    const avatarElement = document.createElement('div');
    avatarElement.className = 'xyg-chat-message-avatar';

    // 创建消息内容元素
    const messageElement = document.createElement('div');
    messageElement.className = `xyg-chat-message xyg-chat-message-${role}`;

    // 根据角色设置头像和内容
    if (role === 'assistant') {
      // AI助手头像
      avatarElement.innerHTML = this._createAvatarHtml();
      messageElement.innerHTML = this._formatMessage(content);

      // 设置AI消息的特殊属性
      messageElement.dataset.streaming = 'true';
      messageElement.style.width = '90%';
      messageElement.style.position = 'relative';

      // 为每条AI消息生成唯一ID，用于反馈功能
      const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      messageElement.dataset.messageId = messageId;

      // 如果不是历史消息，在创建时处理按钮
      if (!isHistory && this._processMessageButtons) {
        this._processMessageButtons(messageElement, false);
      }
    } else if (role === 'user') {
      // 用户头像（默认图标）
      avatarElement.innerHTML =
        '<div class="xyg-chat-avatar xyg-chat-avatar-user"><svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-full w-full" data-icon="User" aria-hidden="true"><g clip-path="url(#clip0_5968_39205)"><rect width="512" height="512" rx="256" fill="#B2DDFF"></rect><circle opacity="0.68" cx="256" cy="196" r="84" fill="white"></circle><ellipse opacity="0.68" cx="256" cy="583.5" rx="266" ry="274.5" fill="white"></ellipse></g><defs><clipPath id="clip0_5968_39205"><rect width="512" height="512" rx="256" fill="white"></rect></clipPath></defs></svg></div>';
      messageElement.innerHTML = this._formatMessage(content);
      messageElement.style.position = 'relative';
    } else {
      // 错误消息不显示头像
      avatarElement.style.display = 'none';
      messageElement.innerHTML = this._formatMessage(content);
    }

    // 如果是历史消息，设置标记
    if (isHistory) {
      messageContainer.dataset.historyMessage = 'true';
    }

    // 组装消息容器
    if (role === 'user') {
      // 用户消息：消息在左边，头像在右边
      messageContainer.appendChild(messageElement);
      messageContainer.appendChild(avatarElement);
    } else {
      // AI消息：头像在左边，消息在右边
      messageContainer.appendChild(avatarElement);
      messageContainer.appendChild(messageElement);
    }

    return messageContainer;
  },

  /**
   * 创建AI助手头像HTML
   * @returns {string} 头像HTML字符串
   * @private
   */
  _createAvatarHtml() {
    // 如果没有webappInfo，返回默认头像
    if (!this.webappInfo || !this.webappInfo.icon_type) {
      return '<div class="xyg-chat-avatar xyg-chat-avatar-default">🤖</div>';
    }

    const { icon_type, icon, icon_url, icon_background } = this.webappInfo;

    if (icon_type === 'emoji') {
      // 使用emoji图标，支持emoji名称转换
      let emojiIcon = icon || '🤖';

      // 如果是字符串且可能是emoji名称，尝试转换
      if (
        typeof emojiIcon === 'string' &&
        emojiIcon.length > 1 &&
        !/[\u{1F000}-\u{1F9FF}]/u.test(emojiIcon)
      ) {
        // 尝试使用gemoji库进行转换
        const convertedEmoji = this._convertEmojiName(emojiIcon);
        if (convertedEmoji) {
          emojiIcon = convertedEmoji;
        }
      }

      const backgroundColor = icon_background || '#f0f0f0';
      return `<div class="xyg-chat-avatar xyg-chat-avatar-emoji" style="background-color: ${backgroundColor}">${emojiIcon}</div>`;
    } else if (icon_type === 'image' && icon_url) {
      // 使用图片图标，基准路径拼接icon_url
      const baseUrl = this.options.baseUrl || 'https://xagent.xinyiglass.com';
      const fullIconUrl = `${baseUrl}${icon_url}`.replace('/v1', '');
      console.log(fullIconUrl);

      const backgroundColor = icon_background || '#f0f0f0';
      return `<div class="xyg-chat-avatar xyg-chat-avatar-image" style="background-color: ${backgroundColor}">
        <img src="${fullIconUrl}" alt="AI助手" onerror="this.parentNode.innerHTML='🤖'">
      </div>`;
    }
  },

  /**
   * 动态加载gemoji库并转换emoji名称
   * @param {string} emojiName - emoji名称
   * @returns {string|null} 转换后的emoji字符或null
   * @private
   */
  _convertEmojiName(emojiName) {
    // 如果gemoji已经加载，直接使用
    if (window.gemoji && window.gemoji.nameToEmoji) {
      return window.gemoji.nameToEmoji[emojiName.toLowerCase()] || null;
    }

    // 如果正在加载中，返回null，避免重复加载
    if (window._gemojiLoading) {
      return null;
    }

    // 开始异步加载gemoji库
    this._loadGemojiLibrary();

    // 临时使用基础映射表作为后备方案
    const basicEmojiMap = {
      zap: '⚡',
      lightning: '⚡',
      robot: '🤖',
      bot: '🤖',
      rocket: '🚀',
      brain: '🧠',
      lightbulb: '💡',
      star: '⭐',
      fire: '🔥',
      heart: '❤️'
    };

    return basicEmojiMap[emojiName.toLowerCase()] || null;
  },

  /**
   * 动态加载gemoji库
   * @private
   */
  _loadGemojiLibrary() {
    // 避免重复加载
    if (window.gemoji || window._gemojiLoading) {
      return;
    }

    window._gemojiLoading = true;
    console.log('开始加载gemoji库...');

    // 使用ES模块动态导入（优先方案）
    try {
      // 使用eval包装避免语法错误
      const dynamicImport = new Function(
        'specifier',
        'return import(specifier)'
      );
      dynamicImport('https://esm.sh/gemoji@8')
        .then((module) => {
          window.gemoji = module;
          window._gemojiLoading = false;
          console.log(
            'gemoji库加载成功，包含',
            Object.keys(module.nameToEmoji || {}).length,
            '个emoji映射'
          );

          // 重新渲染可能需要更新的头像
          this._updateEmojiAvatars();
        })
        .catch((error) => {
          console.warn('从esm.sh加载gemoji失败，尝试备用方案:', error);
          window._gemojiLoading = false;
          this._loadGemojiFromBackup();
        });
    } catch (error) {
      console.warn('动态导入不支持，使用script标签加载:', error);
      // 降级为动态script标签加载
      this._loadGemojiFromBackup();
    }
  },

  /**
   * 使用script标签加载gemoji库（备用方案）
   * @private
   */
  _loadGemojiFromBackup() {
    if (window.gemoji || window._gemojiLoading) {
      return;
    }

    window._gemojiLoading = true;
    console.log('使用script标签加载gemoji库...');

    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import { nameToEmoji, emojiToName } from 'https://esm.sh/gemoji@8';
      window.gemoji = { nameToEmoji, emojiToName };
      window._gemojiLoading = false;
      console.log('gemoji库加载成功 (备用方案)');
      
      // 通知更新头像
      if (typeof DifyChat !== 'undefined' && DifyChat._updateEmojiAvatars) {
        DifyChat._updateEmojiAvatars();
      }
    `;

    script.onerror = () => {
      console.error('加载gemoji库失败，将使用基础映射表');
      window._gemojiLoading = false;
    };

    document.head.appendChild(script);
  },

  /**
   * 更新页面中的emoji头像
   * @private
   */
  _updateEmojiAvatars() {
    if (!window.gemoji || !window.gemoji.nameToEmoji) {
      return;
    }

    console.log('更新emoji头像...');

    // 查找所有emoji头像元素
    const emojiAvatars = document.querySelectorAll('.xyg-chat-avatar-emoji');
    let updatedCount = 0;

    emojiAvatars.forEach((avatar) => {
      const currentEmoji = avatar.textContent.trim();

      // 如果当前显示的可能是emoji名称而不是真正的emoji字符
      if (
        currentEmoji &&
        currentEmoji.length > 1 &&
        !/[\u{1F000}-\u{1F9FF}]/u.test(currentEmoji)
      ) {
        const convertedEmoji =
          window.gemoji.nameToEmoji[currentEmoji.toLowerCase()];
        if (convertedEmoji) {
          avatar.textContent = convertedEmoji;
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      console.log(`成功更新了 ${updatedCount} 个emoji头像`);
    }
  },

  /**
   * 安全地准备UI发送消息（避免触发可能影响inputs的事件）
   * @param {string} message - 用户消息
   * @returns {Object} UI元素对象
   * @private
   */
  _prepareUiForSendMessageSafely(message) {
    console.log('=== 开始UI准备 ===');
    console.log('UI准备前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    console.log('当前 _skipFormUpdateFlag:', this._skipFormUpdateFlag);
    
    // 创建用户消息元素
    const userMessageElement = this._createMessageElement(message, 'user');
    this.elements.messagesContainer.appendChild(userMessageElement);
    this._scrollToBottom();

    console.log('创建消息元素后 options.inputs:', JSON.stringify(this.options.inputs, null, 2));

    // 清空输入框（现在有跳过标记保护，不会触发表单更新）
    if (this.elements.messageInput) {
      console.log('准备清空输入框...');
      console.log('清空前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
      
      // 清空输入框
      this.elements.messageInput.value = '';
      console.log('输入框已清空');
      
      this._adjustTextareaHeight();
      console.log('高度调整完成');
      
      console.log('清空后 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    }

    console.log('输入框处理后 options.inputs:', JSON.stringify(this.options.inputs, null, 2));

    // 禁用输入区域
    if (!this.options.readOnly) {
      this.elements.messageInput.disabled = true;
      this.elements.sendButton.disabled = true;
    }

    console.log('禁用输入后 options.inputs:', JSON.stringify(this.options.inputs, null, 2));

    // 创建加载提示元素
    const loadingElement = this._createLoadingElement();
    this.elements.messagesContainer.appendChild(loadingElement);
    this._scrollToBottom();

    // 创建和显示停止响应按钮
    const stopButton = this._createStopButton();
    if (this.elements.inputContainer) {
      this.elements.inputContainer.appendChild(stopButton);
    } else {
      this.elements.messagesContainer.appendChild(stopButton);
    }
    this._scrollToBottom();

    console.log('=== UI准备完成 ===');
    console.log('最终 options.inputs:', JSON.stringify(this.options.inputs, null, 2));

    return { userMessageElement, loadingElement, stopButton };
  },

  /**
   * 格式化消息，支持Markdown和代码高亮
   * @param {string} content - 消息内容
   * @param {HTMLElement} messageElement - 消息元素，用于保留属性
   * @returns {string} 格式化后的HTML内容
   * @private
   */
  _formatMessage(content, messageElement) {
    // 如果没有内容则返回空字符串
    if (content === undefined || content === null) return '无内容';

    // 如果内容不是字符串，尝试转换
    if (typeof content !== 'string') {
      try {
        if (typeof content === 'object') {
          content = JSON.stringify(content);
        } else {
          content = String(content);
        }
      } catch (e) {
        console.error('格式化消息内容失败:', e);
        return '内容格式化失败';
      }
    }

    // 检查内容是否为空
    if (!content.trim()) return '无内容';

    try {
      // 提取<think>标签内容用于后续处理
      const thinkTags = [];
      let hasThink = content.includes('<think');

      if (hasThink) {
        // 暂时将<think>标签替换为占位符
        content = content.replace(
          /<think>([\s\S]*?)<\/think>/g,
          function (match, thinkContent, offset) {
            const id = thinkTags.length;
            thinkTags.push({ content: thinkContent, id });
            return `<!--THINK_PLACEHOLDER_${id}-->`;
          }
        );
      }

      // 最重要的修改：在使用marked之前先处理ECharts代码块
      // 保存ECharts代码块并替换为特殊占位符
      const echartsBlocks = [];
      content = content.replace(
        /```echarts\s*\n?([\s\S]*?)\n?```/g,
        (match, configStr, offset) => {
          const id = echartsBlocks.length;
          echartsBlocks.push(configStr.trim());
          return `<!--ECHARTS_PLACEHOLDER_${id}-->`;
        }
      );

      // 如果使用了marked库处理markdown
      if (typeof window.marked !== 'undefined') {
        // 配置marked选项，这里保留原有的复杂结构
        window.marked.setOptions({
          renderer: new window.marked.Renderer(),
          highlight: function (code, lang) {
            // 跳过已经处理过的ECharts块 (虽然现在应该不会进入这里)
            if (lang === 'echarts') {
              return code; // 直接返回，不进行高亮处理
            }

            // 这里保留原有的代码高亮处理逻辑
            // 由于涉及到大量条件和异常处理，这部分代码直接保留
            if (lang && lang.toLowerCase() === 'sql') {
              try {
                // 尝试获取highlight.js对象
                let hljs = window.hljs;

                // 如果window.hljs不可用，尝试获取可能的其他引用
                if (!hljs || typeof hljs.highlight !== 'function') {
                  // 尝试加载模块中可能存在的hljs
                  if (typeof require === 'function') {
                    try {
                      hljs = require('highlight.js');
                    } catch (e) {
                      console.warn('无法加载highlight.js模块:', e);
                    }
                  }
                }

                // 如果仍然无法获取hljs对象
                if (!hljs || typeof hljs.highlight !== 'function') {
                  console.warn('highlight.js不可用，使用自定义SQL高亮');
                  // 使用自定义SQL高亮函数
                  return formatHelpers.customSqlHighlight(code);
                }

                // 尝试使用不同的API调用方式
                if (typeof hljs.highlight === 'function') {
                  try {
                    // 新版API (v10+)
                    if (hljs.highlight.name === 'highlight') {
                      return hljs.highlight(code, { language: 'sql' }).value;
                    }
                    // 旧版API
                    return hljs.highlight('sql', code).value;
                  } catch (e) {
                    console.error('highlight.js API调用失败:', e);
                    // 使用自定义SQL高亮作为后备方案
                    return formatHelpers.customSqlHighlight(code);
                  }
                } else if (hljs.highlightAuto) {
                  // 尝试使用自动检测语言
                  return hljs.highlightAuto(code).value;
                }

                // 所有方法都失败，使用自定义高亮
                console.warn('无法使用highlight.js，使用自定义SQL高亮');
                return formatHelpers.customSqlHighlight(code);
              } catch (e) {
                console.error('SQL高亮处理发生异常:', e);
                // 回退到自定义的SQL高亮
                return formatHelpers.customSqlHighlight(code);
              }
            }

            // 处理非SQL代码
            try {
              // 尝试获取highlight.js对象
              let hljs = window.hljs;

              // 如果window.hljs不可用，尝试获取其他引用
              if (!hljs || typeof hljs.highlight !== 'function') {
                // 尝试模块加载
                if (typeof require === 'function') {
                  try {
                    hljs = require('highlight.js');
                  } catch (e) {
                    console.warn('无法加载highlight.js模块:', e);
                  }
                }
              }

              // 如果hljs对象可用
              if (hljs) {
                const language =
                  lang && hljs.getLanguage
                    ? hljs.getLanguage(lang)
                      ? lang
                      : 'plaintext'
                    : 'plaintext';

                if (typeof hljs.highlight === 'function') {
                  // 尝试新版API
                  if (hljs.highlight.name === 'highlight') {
                    return hljs.highlight(code, { language }).value;
                  }
                  // 尝试旧版API
                  return hljs.highlight(language, code).value;
                } else if (hljs.highlightAuto) {
                  // 尝试自动检测语言
                  return hljs.highlightAuto(code).value;
                }
              }

              // 如果highlight.js不可用，使用简单转义
              return formatHelpers.escapeHtml(code);
            } catch (e) {
              console.error('代码高亮处理失败:', e);
              return formatHelpers.escapeHtml(code);
            }
          },
          langPrefix: 'hljs language-',
          pedantic: false,
          gfm: true,
          breaks: true,
          sanitize: false,
          smartypants: false,
          xhtml: false
        });

        // 转换markdown为html
        content = window.marked(content);
      } else {
        // 若未加载marked库并且不是HTML格式，进行基本格式转换
        // 转换连续的换行符为空段落标签，然后处理单个换行符
        content = content.replace(/\n\n/g, '<p></p>');
        content = content.replace(/\n/g, '<br>');

        // 基本的代码块处理 (使用正则表达式匹配代码块)
        content = content.replace(
          /```(\w*)([\s\S]*?)```/g,
          function (match, language, code) {
            // 避免处理echarts代码块（此时应该已被替换为占位符）
            if (language === 'echarts') {
              return match;
            }

            language = language || 'plaintext';
            // 特殊处理SQL语法
            if (language.toLowerCase() === 'sql') {
              return `<pre><code class="language-sql">${formatHelpers.escapeHtml(
                code.trim()
              )}</code></pre>`;
            }
            return `<pre><code class="language-${language}">${formatHelpers.escapeHtml(
              code.trim()
            )}</code></pre>`;
          }
        );

        // 行内代码处理
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 转换链接
        content = content.replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" target="_blank" rel="noopener">$1</a>'
        );
      }

      // 现在替换回ECharts代码块占位符，并渲染为图表容器
      if (echartsBlocks.length > 0) {
        const echartsConfigs = [];

        content = content.replace(
          /<!--ECHARTS_PLACEHOLDER_(\d+)-->/g,
          (match, idStr) => {
            const id = parseInt(idStr);
            if (id >= 0 && id < echartsBlocks.length) {
              const configStr = echartsBlocks[id];
              const chartId = `echarts-chart-${Date.now()}-${Math.floor(
                Math.random() * 1000
              )}-${id}`;

              try {
                // 验证JSON配置是否有效
                let config;
                try {
                  config = JSON.parse(configStr);
                } catch (parseError) {
                  console.error(
                    'ECharts配置JSON解析失败，尝试修复:',
                    parseError
                  );

                  // 尝试修复常见的JSON错误
                  const fixedConfigStr = this._tryFixJsonString(configStr);
                  try {
                    config = JSON.parse(fixedConfigStr);
                    console.log('ECharts配置JSON修复成功');
                  } catch (fixError) {
                    throw new Error('无法解析或修复ECharts配置JSON');
                  }
                }

                echartsConfigs.push({ id: chartId, config });

                // 创建图表容器
                return `
                <div class="xyg-chat-echarts-container">
                  <div id="${chartId}" class="xyg-chat-echarts-chart" style="width: 100%; height: 400px; min-height: 300px;"></div>
                </div>
              `;
              } catch (e) {
                console.warn('ECharts配置JSON解析失败:', e);
                // 如果JSON无效，添加错误提示容器
                return `
                <div class="xyg-chat-echarts-container xyg-chat-echarts-error">
                  <div class="xyg-chat-echarts-error-message">
                    <p>图表配置无效: ${e.message || '解析错误'}</p>
                    <pre>${this._escapeHtml(configStr)}</pre>
                  </div>
                </div>
              `;
              }
            }
            return match;
          }
        );

        // 安排延迟渲染图表
        if (echartsConfigs.length > 0) {
          setTimeout(() => {
            this._renderEChartsCharts(echartsConfigs);
          }, 200);
        }
      }

      // 处理图片标签，添加点击查看大图功能
      content = this._processImageTags(content);

      // 如果没有think标签，直接返回处理后的内容
      if (!hasThink || thinkTags.length === 0) {
        return content;
      }

      // 替换所有的思考占位符并返回处理后的内容
      const resultContent = content.replace(
        /<!--THINK_PLACEHOLDER_(\d+)-->/g,
        (match, id) => {
          const thinkTag = thinkTags.find((tag) => tag.id === parseInt(id));
          if (!thinkTag) return match;

          // 这段HTML会被直接插入到DOM中，移除了内联onclick事件
          // 折叠功能将由统一的事件处理机制处理
          return `
          <div class="xyg-chat-thinking xyg-chat-thinking-collapsed" data-thinking-id="${id}">
            <div class="xyg-chat-thinking-header">
              <span class="xyg-chat-workflow-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>
              </span>
              <span class="xyg-chat-thinking-title">已深度思考</span>
              <span class="xyg-chat-thinking-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </span>
            </div>
            <div class="xyg-chat-thinking-content">${thinkTag.content}</div>
          </div>
        `;
        }
      );

      return resultContent;
    } catch (error) {
      console.error('处理消息内容时出错:', error);
      return content; // 出错时返回原始内容
    }
  },

  /**
   * 处理HTML内容中的图片标签，添加点击查看大图功能
   * @param {string} content - 原始HTML内容
   * @returns {string} - 处理后的HTML内容
   * @private
   */
  _processImageTags(content) {
    if (!content) return content;

    try {
      // 创建临时DOM元素解析HTML内容
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // 查找所有图片标签
      const imgTags = tempDiv.querySelectorAll('img');

      // 为每个图片添加点击事件和样式
      imgTags.forEach((img, index) => {
        // 为图片添加唯一ID和样式类
        img.classList.add('xyg-chat-img');
        img.dataset.imgIndex = index;

        // 将img包装在可点击的容器中
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'xyg-chat-img-wrapper';
        imgWrapper.onclick = `DifyChat._showImagePreview('${img.src}')`;
        imgWrapper.setAttribute(
          'onclick',
          `DifyChat._showImagePreview('${img.src}')`
        );

        // 替换原始img
        img.parentNode.insertBefore(imgWrapper, img);
        imgWrapper.appendChild(img);
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.error('处理图片标签时出错:', error);
      return content; // 出错时返回原始内容
    }
  },

  /**
   * 添加消息到聊天窗口
   * @param {string} content - 消息内容
   * @param {string} role - 消息角色（user/assistant/error）
   * @param {boolean} isHistory - 是否是历史消息
   * @private
   */
  _addMessage(content, role, isHistory = false) {
    const messageElement = this._createMessageElement(content, role, isHistory);
    this.elements.messagesContainer.appendChild(messageElement);
    this._scrollToBottom();

    // 更新CSS变量，确保布局正确
    this._updateHeightVariables(true);

    // 如果是AI消息，处理消息中的按钮
    if (role === 'assistant') {
      // 处理按钮，根据isHistory决定是否添加事件监听
      setTimeout(() => {
        this._processMessageButtons(messageElement, isHistory);
      }, 0);
    }
  },

  /**
   * 滚动到对话底部
   * 根据用户交互状态决定是否执行自动滚动
   * @private
   */
  _scrollToBottom() {
    // 如果没有消息容器或用户已手动滚动（滚动冻结标志为true），则不执行自动滚动
    if (!this.elements.messagesContainer || this.shouldFreezeScroll) {
      return;
    }

    // 否则执行正常滚动
    this.elements.messagesContainer.scrollTop =
      this.elements.messagesContainer.scrollHeight;
  },

  /**
   * 添加思考信息
   * @param {string} thinkingContent - 思考内容
   * @private
   */
  _addThinkingInfo(thinkingContent) {
    // 更严格的内容检查
    if (
      !thinkingContent ||
      typeof thinkingContent !== 'string' ||
      thinkingContent.trim().length === 0
    ) {
      console.log('思考内容为空，跳过添加');
      return;
    }

    // 检查是否已经存在思考元素，避免重复添加
    const existingThinking =
      this.elements.messagesContainer.querySelector('.xyg-chat-thinking');
    if (existingThinking) {
      console.log('已存在思考元素，更新内容而不是重复添加');
      const contentElement = existingThinking.querySelector(
        '.xyg-chat-thinking-content'
      );
      if (contentElement) {
        contentElement.textContent = thinkingContent.trim();
      }
      return;
    }

    console.log('添加思考信息:', thinkingContent.substring(0, 50) + '...');

    // 直接创建HTML元素，确保与CSS样式一致
    const thinkingElement = document.createElement('div');
    thinkingElement.className = 'xyg-chat-thinking xyg-chat-thinking-collapsed'; // 默认折叠

    // 创建标题行
    const headerElement = document.createElement('div');
    headerElement.className = 'xyg-chat-thinking-header';

    // 添加图标
    const iconElement = document.createElement('span');
    iconElement.className = 'xyg-chat-workflow-icon';
    iconElement.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>';

    // 添加标题
    const titleElement = document.createElement('span');
    titleElement.className = 'xyg-chat-thinking-title';
    titleElement.textContent = '已深度思考';

    // 添加折叠图标
    const collapseIcon = document.createElement('span');
    collapseIcon.className = 'xyg-chat-thinking-icon';
    collapseIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

    // 组装标题行
    headerElement.appendChild(iconElement);
    headerElement.appendChild(titleElement);
    headerElement.appendChild(collapseIcon);

    // 创建内容区域
    const contentElement = document.createElement('div');
    contentElement.className = 'xyg-chat-thinking-content';
    contentElement.textContent = thinkingContent.trim();

    // 组装完整元素
    thinkingElement.appendChild(headerElement);
    thinkingElement.appendChild(contentElement);

    // 添加到消息容器
    this.elements.messagesContainer.appendChild(thinkingElement);
    this._scrollToBottom();

    // 为标题行添加点击事件
    headerElement.addEventListener('click', (e) => {
      console.log('思考标题点击事件触发');
      e.stopPropagation(); // 阻止事件冒泡
      thinkingElement.classList.toggle('xyg-chat-thinking-collapsed');
      console.log(
        '思考元素折叠状态:',
        thinkingElement.classList.contains('xyg-chat-thinking-collapsed')
      );
    });

    console.log('思考元素已添加到DOM');
  },

  /**
   * 尝试修复JSON字符串中的常见错误
   * @param {string} jsonStr - JSON字符串
   * @returns {string} - 修复后的JSON字符串
   * @private
   */
  _tryFixJsonString(jsonStr) {
    let fixed = jsonStr;

    // 替换JS风格的注释 (单行和多行)
    fixed = fixed.replace(/\/\/.*?(\r\n|\n|$)/g, '$1');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

    // 修复没有用引号包裹的键名
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3');

    // 修复单引号为双引号
    let inString = false;
    let result = '';
    let escapeNext = false;

    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];

      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
      }

      if (char === "'" && !inString) {
        result += '"';
      } else {
        result += char;
      }
    }

    // 修复尾随逗号
    result = result.replace(/,(\s*[}\]])/g, '$1');

    return result;
  },

  /**
   * 转义HTML特殊字符
   * @param {string} text - 要转义的文本
   * @returns {string} - 转义后的文本
   * @private
   */
  _escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * 渲染ECharts图表
   * @param {Array} chartConfigs - 图表配置数组
   * @private
   */
  _renderEChartsCharts(chartConfigs) {
    // 确保ECharts库已加载
    if (typeof window.echarts === 'undefined') {
      console.warn('ECharts库未加载，尝试动态加载...');
      this._loadEChartsLibrary(() => {
        this._renderEChartsCharts(chartConfigs);
      });
      return;
    }

    // 如果配置缓存未初始化，则初始化
    if (!window._echartsConfigStore) {
      window._echartsConfigStore = {};
    }

    // 延迟一点时间确保DOM已经完全渲染并有正确的尺寸
    setTimeout(() => {
      chartConfigs.forEach(({ id, config }) => {
        // 先保存配置到全局缓存，便于后续重建图表
        window._echartsConfigStore[id] = config;

        const chartContainer = document.getElementById(id);
        if (!chartContainer) {
          console.warn(`未找到图表容器: ${id}`);
          return;
        }

        try {
          // 检查容器尺寸
          const containerRect = chartContainer.getBoundingClientRect();
          if (containerRect.width === 0 || containerRect.height === 0) {
            console.warn(
              `图表容器尺寸为0: ${id}, 宽度: ${containerRect.width}, 高度: ${containerRect.height}`
            );
            // 设置默认尺寸
            chartContainer.style.width = '100%';
            chartContainer.style.height = '400px';
            chartContainer.style.minHeight = '300px';
          }

          // 初始化ECharts实例
          const chart = window.echarts.init(chartContainer);

          // 设置默认配置
          const defaultConfig = {
            backgroundColor: 'transparent',
            textStyle: {
              fontFamily: 'Arial, sans-serif'
            },
            animation: true,
            animationDuration: 1000
          };

          // 合并配置
          const finalConfig = { ...defaultConfig, ...config };

          // 渲染图表
          chart.setOption(finalConfig);

          // 储存实例引用，用于后续的响应式处理
          chartContainer._echartsInstance = chart;

          // 监听窗口大小变化，调整图表尺寸
          if (window.ResizeObserver) {
            try {
              const resizeObserver = new ResizeObserver(() => {
                if (chart && !chart.isDisposed()) {
                  chart.resize();
                }
              });

              resizeObserver.observe(chartContainer);

              // 储存观察者引用，用于清理
              chartContainer._resizeObserver = resizeObserver;
            } catch (error) {
              console.warn('ResizeObserver初始化失败:', error);
              // 降级方案：使用窗口resize事件
              const resizeHandler = () => {
                if (chart && !chart.isDisposed()) {
                  chart.resize();
                }
              };
              window.addEventListener('resize', resizeHandler);
              // 储存处理函数引用，用于清理
              chartContainer._resizeHandler = resizeHandler;
            }
          } else {
            // 如果不支持ResizeObserver，使用窗口resize事件
            const resizeHandler = () => {
              if (chart && !chart.isDisposed()) {
                chart.resize();
              }
            };
            window.addEventListener('resize', resizeHandler);
            // 储存处理函数引用，用于清理
            chartContainer._resizeHandler = resizeHandler;
          }

          console.log(`ECharts图表渲染成功: ${id}`);
        } catch (error) {
          console.error(`渲染ECharts图表失败 (${id}):`, error);
          // 显示错误信息
          chartContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff4d4f; font-size: 14px; padding: 20px; text-align: center;">
              <span>图表渲染失败: ${error.message || '未知错误'}</span>
          </div>
        `;
        }
      });

      // 强制触发一次窗口resize事件，确保所有图表都能正确渲染尺寸
      if (window.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
    }, 200); // 增加延迟，确保DOM完全渲染
  },

  /**
   * 重新创建指定ID的图表
   * @param {string} chartId - 图表容器ID
   * @private
   */
  _recreateChart(chartId) {
    if (!chartId || !window.echarts) {
      console.warn('无法重建图表：ID无效或ECharts未加载');
      return;
    }

    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) {
      console.warn(`找不到图表容器: ${chartId}`);
      return;
    }

    // 查找该ID是否有对应的配置缓存
    const configStore = window._echartsConfigStore || {};
    const config = configStore[chartId];

    if (!config) {
      console.warn(`找不到图表配置: ${chartId}`);
      return;
    }

    console.log(`尝试重建图表: ${chartId}`);

    try {
      // 清理可能存在的实例
      if (
        chartContainer._echartsInstance &&
        !chartContainer._echartsInstance.isDisposed()
      ) {
        chartContainer._echartsInstance.dispose();
      }

      // 重新创建实例
      const chart = window.echarts.init(chartContainer);

      // 设置默认配置
      const defaultConfig = {
        backgroundColor: 'transparent',
        textStyle: {
          fontFamily: 'Arial, sans-serif'
        },
        animation: true,
        animationDuration: 1000
      };

      // 应用配置
      chart.setOption({ ...defaultConfig, ...config });

      // 存储实例引用
      chartContainer._echartsInstance = chart;

      console.log(`图表重建成功: ${chartId}`);
    } catch (error) {
      console.error(`重建图表失败 (${chartId}):`, error);
      // 显示错误信息
      chartContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff4d4f; font-size: 14px; padding: 20px; text-align: center;">
          <span>图表重建失败: ${error.message || '未知错误'}</span>
        </div>
      `;
    }
  },

  /**
   * 动态加载ECharts库
   * @param {Function} callback - 加载完成后的回调函数
   * @private
   */
  _loadEChartsLibrary(callback) {
    // 如果ECharts已经加载，直接回调
    if (window.echarts) {
      console.log('ECharts库已经加载，无需再次加载');
      if (callback) callback();
      return;
    }

    // 检查是否已经在加载中
    if (window._echartsLoading) {
      // 如果正在加载，等待加载完成
      const checkLoaded = () => {
        if (window.echarts) {
          if (callback) callback();
        } else if (!window._echartsLoading) {
          // 加载失败时尝试使用备用CDN
          console.warn('主要CDN加载ECharts库失败，尝试备用CDN');
          this._loadEChartsFromBackupCDN(callback);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      setTimeout(checkLoaded, 100);
      return;
    }

    window._echartsLoading = true;

    // 直接在控制台输出加载信息，便于调试
    console.log('开始从CDN加载ECharts库...');

    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';

    // 添加crossorigin属性增加安全性并改进错误处理
    script.crossOrigin = 'anonymous';

    // 设置加载超时
    const timeout = setTimeout(() => {
      console.error('从jsDelivr加载ECharts超时，尝试备用CDN');
      window._echartsLoading = false;
      this._loadEChartsFromBackupCDN(callback);
    }, 5000); // 5秒超时

    script.onload = () => {
      clearTimeout(timeout);
      window._echartsLoading = false;
      console.log(
        'ECharts库加载成功 (版本: ' +
          (window.echarts && window.echarts.version
            ? window.echarts.version
            : '未知') +
          ')'
      );

      // 触发重绘事件，强制重新布局
      setTimeout(() => {
        if (window.dispatchEvent) {
          window.dispatchEvent(new Event('resize'));
        }
        if (callback) callback();
      }, 100);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      window._echartsLoading = false;
      console.error('主要CDN加载ECharts库失败');
      // 尝试备用CDN
      this._loadEChartsFromBackupCDN(callback);
    };

    document.head.appendChild(script);
  },

  /**
   * 从备用CDN加载ECharts库
   * @param {Function} callback - 加载完成后的回调函数
   * @private
   */
  _loadEChartsFromBackupCDN(callback) {
    if (window.echarts) {
      if (callback) callback();
      return;
    }

    window._echartsLoading = true;
    console.log('尝试从备用CDN加载ECharts');

    // 尝试多个备用CDN
    const backupSources = [
      'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js',
      'https://unpkg.com/echarts@5.4.3/dist/echarts.min.js',
      'https://fastly.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
    ];

    let currentSourceIndex = 0;

    const tryNextSource = () => {
      if (currentSourceIndex >= backupSources.length) {
        window._echartsLoading = false;
        console.error('所有CDN源都加载失败');
        this._showEChartsLoadError();
        return;
      }

      const backupScript = document.createElement('script');
      backupScript.src = backupSources[currentSourceIndex];
      backupScript.crossOrigin = 'anonymous';

      console.log(`尝试从CDN加载: ${backupSources[currentSourceIndex]}`);

      backupScript.onload = () => {
        window._echartsLoading = false;
        console.log(
          `ECharts库从备用CDN加载成功 (${backupSources[currentSourceIndex]})`
        );

        // 触发resize事件
        setTimeout(() => {
          if (window.dispatchEvent) {
            window.dispatchEvent(new Event('resize'));
          }
          if (callback) callback();
        }, 100);
      };

      backupScript.onerror = () => {
        console.error(`从CDN加载失败: ${backupSources[currentSourceIndex]}`);
        currentSourceIndex++;
        tryNextSource();
      };

      document.head.appendChild(backupScript);
    };

    tryNextSource();
  },

  /**
   * 显示ECharts加载错误消息
   * @private
   */
  _showEChartsLoadError() {
    // 找到所有图表容器
    const chartContainers = document.querySelectorAll(
      '.xyg-chat-echarts-container'
    );
    chartContainers.forEach((container) => {
      const chartElement = container.querySelector('.xyg-chat-echarts-chart');
      if (chartElement) {
        chartElement.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff4d4f; font-size: 14px; text-align: center; padding: 20px;">
            <span>图表库加载失败，请刷新页面重试或检查网络连接</span>
          </div>
        `;
      }
    });
  }
};

/**
 * 用户输入表单相关方法
 * @module DifyChat/ui/forms
 * @author AI助手
 */

// 用户输入表单相关方法
const forms = {
  /**
   * 渲染用户输入表单
   * @private
   */
  _renderUserInputForm() {
    // 检查是否有表单配置数据
    if (
      !this.appParameters ||
      !this.appParameters.user_input_form ||
      !Array.isArray(this.appParameters.user_input_form) ||
      this.appParameters.user_input_form.length === 0
    ) {
      console.log('没有找到用户输入表单配置');
      return;
    }

    console.log('开始渲染用户输入表单:', this.appParameters.user_input_form);

    // 创建表单容器
    this._createFormContainer();

    // 渲染表单字段
    this._renderFormFields(this.appParameters.user_input_form);

    // 绑定表单事件
    this._bindFormEvents();

    // 初始化位置监听器
    this._initFormPositionListeners();

    // 在输入区域添加参数设置按钮
    this._addParameterToggleButton();

    // 同步初始值到表单字段
    this._syncInitialValuesToForm();

    // 标记表单已渲染
    this.hasFormRendered = true;
  },

  /**
   * 创建表单容器
   * @private
   */
  _createFormContainer() {
    // 移除已存在的表单容器
    if (this.elements.formContainer) {
      this.elements.formContainer.remove();
    }

    // 创建主表单容器
    this.elements.formContainer = document.createElement('div');
    this.elements.formContainer.className = 'xyg-chat-form-container';

    // 创建表单内容区域
    this.elements.formContent = document.createElement('div');
    this.elements.formContent.className = 'xyg-chat-form-content';

    // 创建表单字段容器
    this.elements.formFields = document.createElement('div');
    this.elements.formFields.className = 'xyg-chat-form-fields';

    // 组装表单结构
    this.elements.formContent.appendChild(this.elements.formFields);
    this.elements.formContainer.appendChild(this.elements.formContent);

    // 将表单添加到输入容器内，但不修改输入容器的定位
    if (this.elements.inputContainer) {
      this.elements.inputContainer.appendChild(this.elements.formContainer);
    }

    // 初始化为隐藏状态
    this.elements.formContainer.style.display = 'none';
  },

  /**
   * 渲染表单字段
   * @param {Array} formConfig - 表单配置数组
   * @private
   */
  _renderFormFields(formConfig) {
    this.elements.formInputs = [];

    formConfig.forEach((fieldConfig, index) => {
      // 获取字段类型和配置
      const fieldType = Object.keys(fieldConfig)[0];
      const config = fieldConfig[fieldType];
      // 如要用hide控制则加上  || config.hide
      if (!config || !config.variable) {
        console.warn('表单字段配置无效:', fieldConfig);
        return;
      }

      // 创建字段容器
      const fieldContainer = this._createFieldContainer(
        config,
        fieldType,
        index
      );

      // 根据类型创建具体的输入控件
      const inputElement = this._createInputElement(config, fieldType);

      if (inputElement) {
        fieldContainer.appendChild(inputElement);
        this.elements.formFields.appendChild(fieldContainer);

        // 保存输入元素引用
        this.elements.formInputs.push(inputElement);
      }
    });
  },

  /**
   * 创建字段容器
   * @param {Object} config - 字段配置
   * @param {string} fieldType - 字段类型
   * @param {number} index - 字段索引
   * @returns {HTMLElement} 字段容器元素
   * @private
   */
  _createFieldContainer(config, fieldType, index) {
    const container = document.createElement('div');
    container.className = 'xyg-chat-form-field';
    container.dataset.fieldType = fieldType;
    container.dataset.fieldIndex = index;

    // 创建标签
    const label = document.createElement('label');
    label.className = 'xyg-chat-form-label';
    label.textContent = config.label || config.variable;

    // 添加必填标记
    if (config.required) {
      const required = document.createElement('span');
      required.className = 'xyg-chat-form-required';
      required.textContent = '*';
      label.appendChild(required);
    }

    container.appendChild(label);
    return container;
  },

  /**
   * 创建输入元素
   * @param {Object} config - 字段配置
   * @param {string} fieldType - 字段类型
   * @returns {HTMLElement} 输入元素
   * @private
   */
  _createInputElement(config, fieldType) {
    let inputElement;

    switch (fieldType) {
      case 'text-input':
        inputElement = this._createTextInput(config);
        break;
      case 'paragraph':
        inputElement = this._createTextarea(config);
        break;
      case 'select':
        inputElement = this._createSelect(config);
        break;
      case 'number':
        inputElement = this._createNumberInput(config);
        break;
      default:
        console.warn('不支持的字段类型:', fieldType);
        return null;
    }

    if (inputElement) {
      // 设置通用属性
      inputElement.name = config.variable;
      inputElement.dataset.required = config.required || false;
      inputElement.dataset.fieldType = fieldType;

      // 添加通用样式类
      inputElement.classList.add('xyg-chat-form-input');

      if (config.required) {
        inputElement.classList.add('xyg-chat-form-required-field');
      }
    }

    return inputElement;
  },

  /**
   * 创建文本输入框
   * @param {Object} config - 字段配置
   * @returns {HTMLElement} 输入元素
   * @private
   */
  _createTextInput(config) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `请输入${config.label || config.variable}`;

    if (config.max_length) {
      input.maxLength = config.max_length;
    }

    if (config.default) {
      input.value = config.default;
    }

    return input;
  },

  /**
   * 创建多行文本输入框
   * @param {Object} config - 字段配置
   * @returns {HTMLElement} 输入元素
   * @private
   */
  _createTextarea(config) {
    const textarea = document.createElement('textarea');
    textarea.placeholder = `请输入${config.label || config.variable}`;
    textarea.rows = 3;

    if (config.max_length) {
      textarea.maxLength = config.max_length;
    }

    if (config.default) {
      textarea.value = config.default;
    }

    return textarea;
  },

  /**
   * 创建下拉选择框
   * @param {Object} config - 字段配置
   * @returns {HTMLElement} 输入元素
   * @private
   */
  _createSelect(config) {
    const select = document.createElement('select');

    // 添加默认选项
    if (!config.required) {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = `请选择${config.label || config.variable}`;
      select.appendChild(defaultOption);
    }

    // 添加选项
    if (config.options && Array.isArray(config.options)) {
      config.options.forEach((option) => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
      });
    }

    if (config.default) {
      select.value = config.default;
    }

    return select;
  },

  /**
   * 创建数字输入框
   * @param {Object} config - 字段配置
   * @returns {HTMLElement} 输入元素
   * @private
   */
  _createNumberInput(config) {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = `请输入${config.label || config.variable}`;

    if (config.default) {
      input.value = config.default;
    }

    return input;
  },

  /**
   * 绑定表单事件
   * @private
   */
  _bindFormEvents() {
    // 绑定输入事件，实时更新数据
    if (this.elements.formInputs) {
      this.elements.formInputs.forEach((input) => {
        input.addEventListener('input', () => {
          this._updateFormData();
        });

        input.addEventListener('change', () => {
          this._updateFormData();
        });
      });
    }

    // 监听输入框高度变化，实时更新表单位置
    if (this.elements.messageInput && this.elements.inputContainer) {
      // 使用ResizeObserver监听输入容器尺寸变化
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
          // 如果表单正在显示，更新其位置
          if (
            this.elements.formContainer &&
            this.elements.formContainer.style.display !== 'none'
          ) {
            this._updateFormPosition();
          }
        });

        resizeObserver.observe(this.elements.inputContainer);

        // 保存观察者引用以便后续清理
        this._formResizeObserver = resizeObserver;
      } else {
        // 备用方案：监听输入框的input事件
        this.elements.messageInput.addEventListener('input', () => {
          // 延迟更新，等待DOM更新完成
          setTimeout(() => {
            if (
              this.elements.formContainer &&
              this.elements.formContainer.style.display !== 'none'
            ) {
              this._updateFormPosition();
            }
          }, 0);
        });
      }
    }
  },

  /**
   * 切换表单显示状态
   * @private
   */
  _toggleFormCollapse() {
    if (!this.elements.formContainer) return;

    const isVisible = this.elements.formContainer.style.display !== 'none';

    if (isVisible) {
      // 隐藏表单
      this.elements.formContainer.style.display = 'none';
    } else {
      // 显示表单前，动态计算位置
      this._updateFormPosition();
      this.elements.formContainer.style.display = 'block';
    }
  },

  /**
   * 动态更新表单位置，基于输入容器的实际高度
   * @private
   */
  _updateFormPosition() {
    if (!this.elements.formContainer || !this.elements.inputContainer) return;

    // 获取输入容器的实际高度
    const inputContainerRect =
      this.elements.inputContainer.getBoundingClientRect();
    const inputContainerHeight = inputContainerRect.height;

    // 计算距离底部的距离：输入容器高度 + 额外间距
    const bottomOffset = inputContainerHeight + 6; // 12px额外间距

    // 设置表单的bottom位置
    this.elements.formContainer.style.bottom = `${bottomOffset}px`;

    console.log(
      `动态设置表单位置: bottom = ${bottomOffset}px (输入容器高度: ${inputContainerHeight}px)`
    );
  },

  /**
   * 初始化表单位置监听器
   * @private
   */
  _initFormPositionListeners() {
    // 监听窗口大小变化
    if (!this._windowResizeHandler) {
      this._windowResizeHandler = () => {
        if (
          this.elements.formContainer &&
          this.elements.formContainer.style.display !== 'none'
        ) {
          // 延迟更新，等待布局稳定
          setTimeout(() => {
            this._updateFormPosition();
          }, 100);
        }
      };

      window.addEventListener('resize', this._windowResizeHandler);
    }
  },

  /**
   * 更新表单数据到options.inputs
   * @private
   */
  _updateFormData() {
    console.log('=== _updateFormData 被调用 ===');
    console.log('this对象信息:', {
      hasSkipFlag: this.hasOwnProperty('_skipFormUpdateFlag'),
      skipFlagValue: this._skipFormUpdateFlag,
      thisConstructor: this.constructor.name
    });
    console.log('调用前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    // 如果正在发送消息过程中，跳过表单更新避免覆盖钩子数据
    if (this._skipFormUpdateFlag) {
      console.log('跳过表单更新（发送消息过程中），保护钩子数据');
      console.log('保护的 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
      return;
    }
    
    if (!this.elements.formInputs) {
      console.log('没有表单输入字段，退出');
      return;
    }

    console.log('正常执行表单更新');

    // 获取当前表单数据
    const formData = {};
    this.elements.formInputs.forEach((input) => {
      const name = input.name;
      let value = input.value;

      // 根据字段类型处理值
      if (input.dataset.fieldType === 'number' && value) {
        value = Number(value);
      } else if (!value.trim()) {
        value = '';
      }

      formData[name] = value;
    });

    // 确保options.inputs存在
    if (!this.options.inputs) {
      this.options.inputs = {};
    }
    
    console.log('表单数据:', JSON.stringify(formData, null, 2));
    console.log('合并前 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    // 实现优先级逻辑：
    // 1. 保留所有现有的非表单字段数据（这些可能来自钩子或初始传入）
    // 2. 只更新表单字段，且只在表单字段有值时更新
    const updatedInputs = { ...this.options.inputs };
    
    Object.keys(formData).forEach(fieldName => {
      const formValue = formData[fieldName];
      const currentValue = this.options.inputs[fieldName];
      
      // 如果表单字段有值，则更新；如果表单字段为空但原来有值，保持原值
      if (formValue !== '' && formValue !== null && formValue !== undefined) {
        updatedInputs[fieldName] = formValue;
        console.log(`表单字段 ${fieldName} 更新为: ${formValue}`);
      } else if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
        // 保持原有的非空值（可能来自初始传入或钩子设置）
        console.log(`保持字段 ${fieldName} 的原有值: ${currentValue}`);
      }
    });
    
    this.options.inputs = updatedInputs;

    console.log('表单数据已更新:', JSON.stringify(formData, null, 2));
    console.log('合并后的options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    console.log('=== _updateFormData 完成 ===');
  },

  /**
   * 验证表单数据
   * @returns {Object|null} 验证通过的表单数据或null
   * @private
   */
  _validateInputForm() {
    if (!this.elements.formContainer || !this.elements.formInputs) {
      return this.options.inputs || null;
    }

    const formData = {};
    let isValid = true;
    const errors = [];

    // 清除之前的错误状态
    this.elements.formInputs.forEach((input) => {
      input.classList.remove('xyg-chat-input-error');
    });

    // 验证每个字段
    this.elements.formInputs.forEach((input) => {
      const name = input.name;
      const value = input.value;
      const required = input.dataset.required === 'true';
      const fieldType = input.dataset.fieldType;

      // 检查必填字段
      if (required && !value.trim()) {
        isValid = false;
        input.classList.add('xyg-chat-input-error');
        errors.push(
          `${input
            .closest('.xyg-chat-form-field')
            .querySelector('.xyg-chat-form-label')
            .textContent.replace('*', '')} 为必填项`
        );
        return;
      }

      // 处理数据类型
      let processedValue = value;
      if (fieldType === 'number' && value) {
        processedValue = Number(value);
        if (isNaN(processedValue)) {
          isValid = false;
          input.classList.add('xyg-chat-input-error');
          errors.push(
            `${input
              .closest('.xyg-chat-form-field')
              .querySelector('.xyg-chat-form-label')
              .textContent.replace('*', '')} 必须是有效数字`
          );
          return;
        }
      }

      formData[name] = processedValue;
    });

    if (!isValid) {
      // 显示错误消息
      this._showFormErrors(errors);
      return null;
    }

    // 隐藏错误消息
    this._hideFormErrors();
    return formData;
  },

  /**
   * 显示表单错误消息
   * @param {Array} errors - 错误消息数组
   * @private
   */
  _showFormErrors(errors) {
    // 移除现有的错误消息
    this._hideFormErrors();

    if (errors.length === 0) return;

    // 创建错误消息容器
    const errorContainer = document.createElement('div');
    errorContainer.className = 'xyg-chat-form-errors';

    const errorList = document.createElement('ul');
    errors.forEach((error) => {
      const errorItem = document.createElement('li');
      errorItem.textContent = error;
      errorList.appendChild(errorItem);
    });

    errorContainer.appendChild(errorList);

    // 插入到表单内容区域
    if (this.elements.formContent) {
      this.elements.formContent.insertBefore(
        errorContainer,
        this.elements.formFields
      );
    }

    // 保存引用以便后续移除
    this.elements.formErrorContainer = errorContainer;
  },

  /**
   * 隐藏表单错误消息
   * @private
   */
  _hideFormErrors() {
    if (this.elements.formErrorContainer) {
      this.elements.formErrorContainer.remove();
      this.elements.formErrorContainer = null;
    }
  },

  /**
   * 在输入区域添加参数设置按钮
   * @private
   */
  _addParameterToggleButton() {
    // 检查是否已经存在按钮
    if (this.elements.parameterToggleButton) {
      return;
    }

    // 创建按钮元素
    const button = document.createElement('button');
    button.className = 'xyg-chat-parameter-toggle-btn';
    button.innerHTML = '📝'//表单符号;
    button.title = '输入字段设置';
    button.type = 'button';

    // 绑定点击事件
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._toggleFormCollapse();
    });

    // 保存按钮引用
    this.elements.parameterToggleButton = button;

    // 插入到输入区域 - 在发送按钮前面
    if (this.elements.sendButton && this.elements.sendButton.parentNode) {
      this.elements.sendButton.parentNode.insertBefore(
        button,
        this.elements.sendButton
              );
      }
    },

    /**
     * 同步初始值到表单字段
     * @private
     */
    _syncInitialValuesToForm() {
      if (!this.options.inputs || !this.elements.formInputs) {
        console.log('没有可用的options.inputs或表单字段');
        return;
      }

      console.log('开始同步初始值到表单字段');
      console.log('当前 options.inputs:', this.options.inputs);

      this.elements.formInputs.forEach((input) => {
        const name = input.name;
        const value = this.options.inputs[name];

        if (value !== undefined && value !== null && value !== '') {
          console.log(`同步字段 ${name}: ${value}`);
          // 根据输入类型设置值
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = !!value;
          } else {
            input.value = value;
          }
        }
      });

      console.log('初始值同步完成');
    }
  };

export { messages, forms };
