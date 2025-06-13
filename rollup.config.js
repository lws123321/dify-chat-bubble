import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';
import postcss from 'rollup-plugin-postcss';

// 创建包含版本号和作者信息的banner
const banner = `/*!
 * DifyChat v${pkg.version}
 * (c) ${new Date().getFullYear()} ${pkg.author || '作者名称'}
 * 构建日期: ${new Date().toISOString().split('T')[0]}
 */`;

// 公共插件配置
const commonPlugins = [
  nodeResolve(),
  commonjs(),
  postcss({
    inject: true, // 保持CSS内联
    minimize: true,
    extensions: ['.css'],
    extract: false // 确保不提取CSS到单独文件
  })
];

// 生成时间戳
const timestamp = Date.now();

export default [
  // 压缩版本
  {
    input: 'src/index.js',
    output: {
      file: 'dist/difychat.min.js',
      format: 'umd',
      name: 'DifyChat',
      banner
    },
    plugins: [
      del({ targets: 'dist/*' }),
      ...commonPlugins,
      terser({
        output: {
          comments: (node, comment) => {
            return comment.type === 'comment2' && /^\s*!/.test(comment.value);
          }
        },
        compress: {
          drop_console: true, // 生产环境移除console
          drop_debugger: true
        }
      }),
      copy({
        targets: [
          { 
            src: 'src/demo.html', 
            dest: 'dist',
            transform: (contents) => {
              // 替换JS引用添加时间戳
              return contents.toString()
                .replace(/<script src="\.\/difychat\.min\.js"><\/script>/g, 
                         `<script src="./difychat.min.js?v=${timestamp}"></script>`);
            }
          }
        ]
      })
    ]
  },
  // 非压缩版本 - 真正的非压缩
  {
    input: 'src/index.js',
    output: {
      file: 'dist/difychat.js',
      format: 'umd',
      name: 'DifyChat',
      banner
    },
    plugins: commonPlugins
  },
  // ESM模块版本(支持tree-shaking)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/difychat.esm.js',
      format: 'es',
      banner
    },
    plugins: commonPlugins
  }
];
