/**
 * 格式化相关工具函数
 * @module DifyChat/utils/format
 * @author AI助手
 */

// 格式化相关工具函数
const formatHelpers = {
  /**
   * 转义HTML特殊字符
   * @param {string} text - 要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * 自定义SQL语法高亮函数，不依赖highlight.js
   * @param {string} code - SQL代码
   * @returns {string} - 高亮后的HTML
   */
  customSqlHighlight(code) {
    if (!code) return '';

    // SQL关键字列表
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'DELETE', 'UPDATE', 'CREATE', 'DROP',
      'ALTER', 'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION',
      'TRIGGER', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP BY',
      'ORDER BY', 'HAVING', 'AND', 'OR', 'IN', 'NOT', 'NULL', 'IS', 'LIKE',
      'BETWEEN', 'AS', 'UNION', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
      'EXISTS', 'DISTINCT', 'INTO', 'VALUES', 'SET', 'ADD', 'COLUMN', 'CONSTRAINT',
      'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'DEFAULT', 'CHECK', 'UNIQUE',
      'INDEX', 'CASCADE', 'TEMPORARY', 'IF', 'COMMENT'
    ];

    // 函数名列表
    const functions = [
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER', 'CONCAT', 'SUBSTRING',
      'TRIM', 'LENGTH', 'ROUND', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY', 'HOUR',
      'MINUTE', 'SECOND', 'FORMAT', 'CONVERT', 'CAST', 'COALESCE', 'ISNULL',
      'IFNULL', 'NVL'
    ];

    // 转义HTML特殊字符
    let escapedCode = this.escapeHtml(code);

    // 高亮SQL关键字 (使用单词边界确保匹配完整单词)
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      escapedCode = escapedCode.replace(regex, (match) => {
        return `<span class="keyword">${match}</span>`;
      });
    });

    // 高亮SQL函数
    functions.forEach((func) => {
      const regex = new RegExp(`\\b${func}\\b\\s*\\(`, 'gi');
      escapedCode = escapedCode.replace(regex, (match) => {
        return match.replace(
          /\w+/i,
          (funcName) => `<span class="function">${funcName}</span>`
        );
      });
    });

    // 高亮字符串 (单引号)
    escapedCode = escapedCode.replace(
      /'([^'\\]*(\\.[^'\\]*)*)'(?!')/g,
      `<span class="string">'$1'</span>`
    );

    // 高亮数字
    escapedCode = escapedCode.replace(
      /\b(\d+(\.\d+)?)\b/g,
      `<span class="number">$1</span>`
    );

    // 高亮注释 (--行注释和/* */块注释)
    escapedCode = escapedCode.replace(
      /--(.*)$/gm,
      `<span class="comment">--$1</span>`
    );
    escapedCode = escapedCode.replace(
      /\/\*[\s\S]*?\*\//g,
      (match) => `<span class="comment">${match}</span>`
    );

    // 添加语言类名用于CSS样式
    return `<code class="language-sql">${escapedCode}</code>`;
  }
};

export { formatHelpers }; 