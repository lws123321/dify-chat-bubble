# DifyChat AI 聊天组件

基于 Dify API 封装的前端聊天组件，支持流式输出、图片上传、用户输入表单等功能。
演示可查看demo.html
## 特性

- 流式输出 - 实时显示 AI 回复内容
- 富文本渲染 - 支持 Markdown 和 HTML 格式
- 用户输入表单 - 支持自定义输入表单（需 API 配置）
- 引用来源 - 显示 AI 回答的引用来源（需 API 启用）
- 推荐问题 - 提供初始推荐问题和回答后的建议问题
- 响应式设计 - 适配移动端和桌面端
- 自适应布局 - 输入框根据内容自动调整高度，消息区域动态适应
- 禁用状态样式 - 支持输入框和发送按钮的禁用状态样式
- 实时高度计算 - 使用CSS变量实现精确的高度计算和布局
- 可调整大小 - 支持拖拽调整聊天窗口大小
- 历史消息 - 支持读取用户历史对话记录
- 事件钩子系统 - 支持监听各种聊天相关的事件，以及在关键操作前添加前置钩子

## 项目结构

项目采用模块化结构设计，便于维护和扩展：

```
src/
├── index.js          # 入口文件
├── demo.html         # 演示页面
├── js/
│   ├── core.js       # 核心类和构造函数
│   ├── ui.js         # UI 相关方法
│   ├── api.js        # API 通信方法
│   ├── events.js     # 事件处理方法
│   ├── utils.js      # 辅助工具方法
│   └── utils-with-purify.js # 带DOMPurify的工具方法
└── style/
    ├── index.css     # 主要样式文件
    └── markdown-body.css # Markdown 渲染样式
```

## 使用方法

### 基本使用

```html
<!-- 1. 引入JS文件，可部署在线上 -->
<script src="./difychat.min.js"></script>

<!-- 2. 初始化和使用 -->
<script>
  // 创建AI聊天组件
  const chat = new DifyChat({
    baseUrl: 'https://你的API基础URL', 
    apiKey: '你的API密钥',
    user: '可选的用户ID',
    conversation_id: '可选的会话ID', // 如果传入会话ID，将获取历史消息
    title: 'AI助手'
  });
  
  // 初始化聊天组件
  chat.init().then(() => {
    // 可以在页面加载后自动打开，或者绑定到按钮点击事件
    // chat.open();
  });
  
  // 绑定事件示例
  document.getElementById('openBtn').addEventListener('click', () => {
    chat.open(); // 打开聊天窗口
  });
  
  document.getElementById('closeBtn').addEventListener('click', () => {
    chat.close(); // 关闭聊天窗口
  });
  
  document.getElementById('clearBtn').addEventListener('click', () => {
    chat.reset(); // 重置会话
  });
  
  document.getElementById('destroyBtn').addEventListener('click', () => {
    chat = chat.destroy(); // 销毁聊天 chat变为null
  });
</>
```

### 配置选项

```javascript
const chat = new DifyChat({
  // 必填配置
  baseUrl: 'https://api.dify.ai/v1',  // Dify API 的基础 URL
  apiKey: 'app-xxx',                  // Dify API 的密钥
  
  // 可选配置
  title: 'AI助手',                 // 对话框标题
  user: 'user123',                   // 用户标识
  conversation_id: 'conv-123',       // 会话ID，配合用户ID获取对应用户历史消息
  query: '请介绍一下你自己',           // 初始提问内容
  inputs: {                          // 自定义输入字段
    name: '阿松',                    // 会作为参数传递给API
    // 可添加更多键值对
  },
  primaryColor: '#009944',          // 主题颜色
  hoverColor: '#45a049',            // 悬停时的颜色
  minWidth: 300,                    // 最小宽度(px)
  defaultWidth: 400,                // 默认宽度(px)
  maxWidthPercent: 70,              // 最大宽度(窗口百分比)
  height: 75,                       // 聊天窗口高度(vh)，最大86vh
  readOnly: false                   // 是否为只读模式（不能对话）
});
```

### API 方法

```javascript
// 初始化聊天组件
await chat.init();

// 打开聊天窗口
chat.open();

// 关闭聊天窗口
chat.close();

// 重置会话
chat.reset();

// 销毁聊天组件
chat = chat.destroy(); // 注意: destroy()会返回null

// 禁用输入框和发送按钮
chat.disableInput();

// 启用输入框和发送按钮
chat.enableInput();
```

### 键盘快捷键

组件支持以下键盘快捷键：

- **Alt + C**: 切换聊天窗口的显示状态（如果聊天窗口已打开则关闭，如果已关闭则打开）

快捷键仅在聊天组件已初始化后生效。

### 事件系统

XygChat提供了完整的事件系统，支持监听各种聊天相关的事件，以及在关键操作前添加前置钩子。

#### 事件监听

使用 `on()` 方法添加事件监听器：

```javascript
const chat = new DifyChat({
  // 配置选项...
});

// 监听发送消息开始事件
chat.on('sendMessage:start', (message) => {
  console.log('开始发送消息:', message);
});

// 监听发送消息成功事件
chat.on('sendMessage:success', (message, response) => {
  console.log('消息发送成功:', message, response);
});

// 监听发送消息失败事件
chat.on('sendMessage:error', (message, error) => {
  console.error('消息发送失败:', message, error);
});

// 监听发送消息结束事件（无论成功失败都会触发）
chat.on('sendMessage:end', (message) => {
  console.log('发送消息结束:', message);
});
```

#### 前置钩子

使用 `before()` 方法添加前置钩子，可以在关键操作执行前进行拦截：

```javascript
// 添加发送消息前的钩子
chat.before('before:sendMessage', (done, options, message) => {
  // 在这里可以进行消息验证、预处理等操作
  console.log('准备发送消息:', message);
  
  // 可以修改options配置（inputs已自动初始化）
  options.inputs.html_content = "<div>动态内容</div>";
  
  // 例如：检查消息是否包含敏感词
  if (message.includes('敏感词')) {
    alert('消息包含敏感内容，无法发送');
    done(false); // 传入false阻止发送
    return;
  }
  
  // 例如：显示确认对话框
  if (confirm('确定要发送这条消息吗？')) {
    done(true); // 传入true继续执行
  } else {
    done(false); // 传入false阻止发送
  }
});

// 表单同步示例 - 钩子中的修改会自动同步到表单显示
chat.before('before:sendMessage', (done, options, message) => {
  // 修改inputs数据
  options.inputs.html_content = '<div>新的HTML内容</div>';
  options.inputs.user_name = '动态用户名';
  
  // 如果表单中存在同名字段（html_content, user_name），
  // 表单的显示值会自动更新，用户可以看到修改后的值
  done(true);
});

// 异步钩子示例
chat.before('before:sendMessage', (done, options, message) => {
  // 异步操作
  setTimeout(() => {
    console.log('异步处理完成');
    // 可以在异步操作中修改配置
    options.inputs.timestamp = new Date().toISOString();
    done(true); // 必须调用done()继续执行
  }, 1000);
});

// 多个钩子会按顺序执行
chat.before('before:sendMessage', (done, options, message) => {
  console.log('第一个钩子');
  options.inputs.step1 = true;
  done(true);
});

chat.before('before:sendMessage', (done, options, message) => {
  console.log('第二个钩子');
  options.inputs.processed = true;
  done(true);
});
```

#### 移除事件监听器

使用 `off()` 方法移除事件监听器：

```javascript
// 移除特定的监听器
const handler = (message) => console.log(message);
chat.on('sendMessage:start', handler);
chat.off('sendMessage:start', handler);

// 移除事件的所有监听器
chat.off('sendMessage:start');
```

#### 注意事项

1. **前置钩子必须调用done()**: 在前置钩子中，必须调用`done()`函数才能继续执行原始操作。
2. **钩子超时机制**: 如果30秒内没有调用`done()`，系统会自动继续执行并发出警告。
3. **错误处理**: 钩子中的错误会被捕获，不会影响主程序运行。
4. **钩子顺序**: 多个钩子会按添加顺序依次执行。
5. **表单自动同步**: 如果在钩子中修改了`options.inputs`的字段，且表单中存在同名字段，表单的显示值会自动同步更新。

#### 完整示例

```javascript
// 创建聊天实例
const chat = new DifyChat({
  baseUrl: 'your-api-url',
  apiKey: 'your-api-key',
  title: '我的AI助手'
});

// 添加发送消息前的验证钩子
chat.before('before:sendMessage', (done, options, message) => {
  // 消息长度检查
  if (message.length > 500) {
    alert('消息太长，请缩短后再发送');
    done(false);
    return;
  }
  
  // 动态设置inputs参数
  options.inputs.user_message = message;
  options.inputs.timestamp = Date.now();
  
  // 继续执行
  done(true);
});

// 监听各种事件
chat.on('sendMessage:start', (message) => {
  console.log('开始发送:', message);
  // 可以在这里显示loading状态
});

chat.on('sendMessage:success', (message, response) => {
  console.log('发送成功');
  // 可以在这里进行成功后的处理
});

chat.on('sendMessage:error', (message, error) => {
  console.error('发送失败:', error);
  // 可以在这里进行错误处理
});

// 初始化并打开聊天窗口
chat.init().then(() => {
  chat.open();
});
```

## 开发构建

```bash
# 安装依赖
npm install

# 构建
npm run build
```

构建后的文件将输出到 `dist` 目录。

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+

## 快速开始

```javascript
// 基础用法
const chat = new DifyChat({
  apiKey: 'your-api-key',
  user: 'user-id'
});

chat.init().then(() => {
  chat.open();
});
```

## 配置选项

### 自定义开场白和推荐问题

你可以通过配置参数自定义开场白和推荐问题，这些配置具有最高优先级，会覆盖 `/parameters` 接口返回的值：

```javascript
const chat = new DifyChat({
  apiKey: 'your-api-key',
  user: 'user-id',
  // 自定义开场白
  opening_statement: '你好！我是你的专属AI助手，有什么可以帮助你的吗？',
  // 自定义推荐问题
  suggested_questions: [
    '请介绍一下你的功能',
    '如何使用文件上传功能？',
    '能帮我分析数据吗？',
    '有什么新功能推荐？'
  ]
});
```

**优先级说明：**
1. 用户传入的 `opening_statement` 和 `suggested_questions`（最高优先级）
2. `/parameters` 接口获取的配置（如果用户没有传入配置）

### 其他配置选项

```javascript
const chat = new DifyChat({
  apiKey: 'your-api-key',           // 必填：API密钥
  user: 'user-id',                  // 必填：用户ID
  baseUrl: 'https://api.example.com', // API基础URL
  title: '自定义标题',               // 聊天窗口标题
  query: '初始查询内容',             // 自动发送的初始消息
  conversation_id: 'conv-123',      // 恢复指定会话
  opening_statement: '欢迎语',       // 自定义开场白
  suggested_questions: ['问题1'],    // 自定义推荐问题
  primaryColor: '#009944',          // 主色调
  readOnly: false,                  // 是否只读模式
  height: 80,                       // 窗口高度（vh单位）
  inputs: {                         // 预设输入参数
    key: 'value'
  }
});
```

## API 方法

### 初始化和控制

- `init()` - 初始化组件
- `open()` - 打开聊天窗口
- `close()` - 关闭聊天窗口
- `reset()` - 重置会话
- `destroy()` - 销毁组件

### 事件监听

```javascript
// 监听消息发送事件
chat.on('sendMessage:success', (message, response) => {
  console.log('消息发送成功:', message, response);
});

// 监听错误事件
chat.on('sendMessage:error', (message, error) => {
  console.error('消息发送失败:', error);
});
```

## 特性

- ✅ 流式对话响应
- ✅ 文件上传支持
- ✅ 图表数据可视化
- ✅ 自定义开场白和推荐问题
- ✅ 会话历史管理
- ✅ 响应式设计
- ✅ 事件钩子系统

## 许可证

MIT