/* 设定运行配置并启动颜色处理任务 */

global.colorDocConfig = {
    /* 文件读写编码 */
    "encode": "UTF-8",
    /* 控制台显示级别0,1,2 */
    "logLevel": 1,
    /* 要处理的项目根路径 */
    "srcPath": "./sample",
    /* 要处理的文件名后缀 */
    "srcSuffix": ".less",
    /* 扫描样式文件时忽略的路径和文件名关键字 */
    "srcIgnore": [
        "bower_components",
        "node_modules",
        ".git"
    ],
    /* 输出字典路径 */
    "colorDictFilePath": "./export/colorDict.less"
};

var runner = require('./lib/autoVariableColor');
