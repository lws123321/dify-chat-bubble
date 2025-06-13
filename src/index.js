// 在index.js顶部导入CSS
import './style/markdown-body.css';
// 导入主样式文件
import './style/index.css';

// 导入XygChat类
import DifyChat from './js/index.js';

// 导入Markdown库
import { marked } from 'marked';

// 导入highlight.js (ES模块方式)
import hljs from 'highlight.js';

// 设置全局变量以便UI模块使用
window.marked = marked;
window.hljs = hljs;

// 导出XygChat类
export default DifyChat;

// 确保XygChat暴露为全局变量
window.DifyChat = DifyChat;
