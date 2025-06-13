/**
 * API请求相关方法
 * @module DifyChat/api/request
 * @author AI助手
 */

// API请求相关方法
const request = {
  /**
   * 获取应用参数
   * @returns {Promise<Object>} 应用参数对象
   * @private
   */
  async _fetchAppParameters() {
    try {
      const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
      const response = await fetch(`${baseUrl}/parameters`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取应用参数失败: ${response.status}`);
      }

      this.appParameters = await response.json();
      return this.appParameters;
    } catch (error) {
      console.error('获取应用参数时出错:', error);
      this.appParameters = {};
      return this.appParameters;
    }
  },

  /**
   * 获取应用元信息
   * @returns {Promise<Object>} 应用元信息对象
   * @private
   */
  async _fetchAppMeta() {
    try {
      const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
      const response = await fetch(`${baseUrl}/meta`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取应用元信息失败: ${response.status}`);
      }

      this.appMeta = await response.json();
      console.log('应用元信息:', this.appMeta);
      return this.appMeta;
    } catch (error) {
      console.error('获取应用元信息时出错:', error);
      this.appMeta = {};
      return this.appMeta;
    }
  },

  /**
   * 获取应用基本信息
   * @returns {Promise<Object>} 应用基本信息对象
   * @private
   */
  async _fetchAppInfo() {
    try {
      const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
      const response = await fetch(`${baseUrl}/info`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取应用基本信息失败: ${response.status}`);
      }

      this.appInfo = await response.json();
      console.log('应用基本信息:', this.appInfo);
      return this.appInfo;
    } catch (error) {
      console.error('获取应用基本信息时出错:', error);
      this.appInfo = {};
      return this.appInfo;
    }
  },

  /**
   * 获取WebApp设置信息
   * @returns {Promise<Object>} WebApp设置信息对象
   * @private
   */
  async _fetchWebappInfo() {
    try {
      const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
      const response = await fetch(`${baseUrl}/site`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取WebApp设置信息失败: ${response.status}`);
      }

      this.webappInfo = await response.json();
      console.log('WebApp设置信息:', this.webappInfo);
      return this.webappInfo;
    } catch (error) {
      console.error('获取WebApp设置信息时出错:', error);
      this.webappInfo = {};
      return this.webappInfo;
    }
  },

  /**
   * 停止响应生成
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 响应结果
   * @private
   */
  async _stopResponseGeneration(taskId) {
    if (!taskId) {
      console.error('停止响应失败: 缺少任务ID');
      return { result: 'error', message: '缺少任务ID' };
    }

    try {
      const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
      const response = await fetch(`${baseUrl}/chat-messages/${taskId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`
        },
        body: JSON.stringify({
          user: this.options.user || 'unknown'
        })
      });

      if (!response.ok) {
        throw new Error(`停止响应请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('停止响应成功:', result);
      return result;
    } catch (error) {
      console.error('停止响应时出错:', error);
      return { result: 'error', message: error.message };
    }
  },

  /**
   * 准备API请求数据
   * @param {string} message - 用户消息
   * @returns {Promise<Object>} 请求数据对象
   * @private
   */
  async _prepareRequestData(message) {
    console.log('=== 开始准备请求数据 ===');
    console.log('_prepareRequestData入口 - options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    // 准备文件上传数据（如果有）
    const files = await this._prepareFileUploadData();

    // 构建请求数据
    let requestData = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: this.conversation.id || undefined,
      user: this.options.user || 'unknown'
    };

    // 添加上传的文件数据
    if (files && files.length > 0) {
      requestData.files = files;
      console.log('添加文件数据:', files);
    }

    console.log('初始请求数据:', JSON.stringify(requestData, null, 2));

    // 首先添加表单数据作为基础
    const formData = this._validateInputForm();
    console.log('表单验证结果:', JSON.stringify(formData, null, 2));
    
    if (formData) {
      console.log('合并表单数据前 requestData.inputs:', JSON.stringify(requestData.inputs, null, 2));
      requestData.inputs = { ...formData };
      console.log('合并表单数据后 requestData.inputs:', JSON.stringify(requestData.inputs, null, 2));
    }

    // 然后合并配置选项中的inputs数据（优先级更高，可覆盖表单数据）
    console.log('准备合并options.inputs:', JSON.stringify(this.options.inputs, null, 2));
    
    if (this.options.inputs && Object.keys(this.options.inputs).length > 0) {
      console.log('合并前 requestData.inputs:', JSON.stringify(requestData.inputs, null, 2));
      console.log('即将合并的 options.inputs:', JSON.stringify(this.options.inputs, null, 2));
      
      requestData.inputs = { ...requestData.inputs, ...this.options.inputs };
      
      console.log('合并后 requestData.inputs:', JSON.stringify(requestData.inputs, null, 2));
    } else {
      console.log('options.inputs为空或不存在，跳过合并');
    }

    console.log('=== 请求数据准备完成 ===');
    console.log('最终 requestData:', JSON.stringify(requestData, null, 2));
    return requestData;
  },

  /**
   * 发送API请求
   * @param {Object} requestData - 请求数据
   * @returns {Promise<Response>} Fetch响应对象
   * @private
   */
  async _sendApiRequest(requestData) {
    const baseUrl = this.options.baseUrl || 'https://api.dify.ai/v1';
    const response = await fetch(`${baseUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('浏览器不支持Streams API');
    }

    return response;
  },

  /**
   * 准备文件上传数据
   * @returns {Promise<Array>} 处理好的文件数据
   * @private
   */
  async _prepareFileUploadData() {
    if (!this.uploadedFiles || !this.uploadedFiles.length) return [];

    const filePromises = this.uploadedFiles.map(async (fileObj) => {
      if (fileObj.data) {
        return {
          data: fileObj.data,
          type: fileObj.type,
          name: fileObj.name
        };
      }

      try {
        const result = await this._uploadFile(fileObj.file);
        return {
          data: result,
          type: fileObj.type,
          name: fileObj.name
        };
      } catch (error) {
        console.error('处理文件时出错:', error);
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    return results.filter(Boolean);
  },

  /**
   * 上传文件并获取Base64数据
   * @param {File} file - 文件对象
   * @returns {Promise<string>} Base64编码的文件数据
   * @private
   */
  async _uploadFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        const result = event.target.result;
        const base64Data = result.split(',')[1]; // 移除data:image/jpeg;base64,前缀
        resolve(base64Data);
      };

      reader.onerror = function (error) {
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * 验证输入表单
   * @returns {Object|null} 表单数据
   * @private
   */
  _validateInputForm() {
    if (!this.elements.formContainer || !this.elements.formInputs) {
      return null;
    }

    const formData = {};
    let isValid = true;

    // 遍历所有输入字段
    this.elements.formInputs.forEach((input) => {
      const { name, value, required } = input;

      if (required && !value.trim()) {
        isValid = false;
        input.classList.add('xyg-chat-input-error');
      } else {
        input.classList.remove('xyg-chat-input-error');
        formData[name] = value;
      }
    });

    return isValid ? formData : null;
  }
};

export { request }; 