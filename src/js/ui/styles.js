/**
 * UI样式相关方法
 * @module DifyChat/ui/styles
 * @author AI助手
 */

// 样式相关方法
const styles = {
  /**
   * 创建样式
   * @private
   */
  _createStyles() {
    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'xyg-chat-styles';

    // 设置CSS变量
    const cssVars = `
      :root {
        --xyg-chat-width: ${this.options.defaultWidth || 500}px;
        --xyg-chat-height: ${this.options.height || 80}vh;
        --xyg-chat-primary-color: ${this.options.primaryColor || '#009944'};
        --xyg-chat-primary-color-transparent: ${
          this.options.primaryColor || '#009944'
        }dd;
        --xyg-chat-hover-color: ${this.options.hoverColor || '#45a049'};
        --xyg-chat-border-color: #e2e8f0;
        --xyg-chat-text-color: #4a5568;
        --xyg-chat-primary-color-light: ${
          this.options.primaryColor || '#009944'
        }33;
        --xyg-chat-primary-color-shadow: rgba(${(
          this.options.primaryColor || '#009944'
        )
          .slice(1)
          .match(/../g)
          .map((hex) => parseInt(hex, 16))
          .join(',')}, 0.4);
        --xyg-chat-primary-color-shadow-hover: rgba(${(
          this.options.primaryColor || '#009944'
        )
          .slice(1)
          .match(/../g)
          .map((hex) => parseInt(hex, 16))
          .join(',')}, 0.5);
      }
    `;

    // 设置样式内容为CSS变量定义
    style.textContent = cssVars;

    // 添加到文档头
    document.head.appendChild(style);

    // CSS样式已在入口文件中静态导入
  }
};

export { styles }; 