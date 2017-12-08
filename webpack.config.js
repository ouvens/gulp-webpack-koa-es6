const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const paseEs6Imports = require('parse-es6-imports');

const uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

const dependencies = require('./package.json').dependencies;

// 构建目录配置
const BUILD_CONFIG = {
    dist_dir: 'server/dist/',   //构建后生成的根目录,不要带目录'/'符号
    src_dir: 'src',             // 构建源目录,不要带目录'/'符号
    html_dir: '/pages',         // html目录名称，src和page相同
    js_dir: 'src/js',           // 构建js目录,不要带目录'/'符号
    html_domain: '',
    css_domain: '',
    js_domian: ''
}

const srcDir = path.resolve(process.cwd(), BUILD_CONFIG.src_dir);
const jsDir = path.resolve(process.cwd(), BUILD_CONFIG.js_dir);

// 读取开发中的全局依赖
let alias = {}

for(let key in dependencies){
    alias[key] = path.resolve(jsDir, dependencies[key])
}

// 获取页面的每个入口文件，用于配置中的entry
function getEntry() {
    const jsPath = jsDir;
    const dirs = fs.readdirSync(jsPath);
    let matchs = [], files = _getImportsScriptList();   // 先解析加载imports解析到的map文件
    dirs.forEach(function (item) {
        matchs = item.match(/(.+)\.js$/);
        // 如果_getImportsScriptList获取到的文件已经含有，则跳过不覆盖解析
        if (matchs && !files[matchs[1]]) {
            files[matchs[1]] = path.resolve(jsDir, item);
        }
    });
    return files;
}

/**
 * 从代码中分析import找出所有应用的模块列表
 * 
 * @returns files 返回模块列表
 */
function _getImportsScriptList() {
    const jsPath = jsDir;
    const dirs = fs.readdirSync(jsPath);
    let matchs = [], files = {}, fileContent, moduleId;

    dirs.forEach(function (item) {
        matchs = item.match(/(.+)\.js$/);
        if (matchs) {
            fileContent = fs.readFileSync(path.resolve(jsDir, item), 'utf-8');
            let modulesList = paseEs6Imports(fileContent);
            for(let key in modulesList){
                // 优先取dependencies中的路劲作为id，否则则用paseEs6Imports解析出来的id
                if (dependencies[modulesList[key].fromModule]) {
                    moduleId = dependencies[modulesList[key].fromModule];
                    files[moduleId] = [path.resolve(jsDir, dependencies[modulesList[key].fromModule])];
                } else {
                    moduleId = path.resolve(jsDir, modulesList[key].fromModule).replace(jsDir + '\\', '');
                    // 这里为什么要用数组，原因是入口文件不能被引用，https://github.com/webpack/webpack/issues/300
                    files[moduleId] = [path.resolve(jsDir, modulesList[key].fromModule)];
                }
            }
        }
    });

    return files;
}

module.exports = {
    cache: true,
    BUILD_CONFIG: BUILD_CONFIG,
    devtool: '#source-map',
    entry: getEntry(),
    output: {
        path: path.join(__dirname, BUILD_CONFIG.dist_dir + '/js/'),
        publicPath: BUILD_CONFIG.dist_dir + '/js/',
        filename: '[name].js',
        chunkFilename: '[chunkhash].js'
    },
    resolve: {
        // 全局依赖id，例如使用了就可以在全局require使用key，使用package.json里面的配置，例如: var $ = require('juery')，另外，同时也可以使用相对路径来使用
        alias: alias,

        // extensions中第一个空串不能去，官方解释如下：
        // Using this will override the default array, meaning that webpack will no longer try to resolve modules using the default extensions. 
        // For modules that are imported with their extension, e.g. import SomeFile from "./somefile.ext", to be properly resolved, an empty string must be included in the array.
        extensions: ['', '.js', '.jsx']
    },
    module: {
        // babel loader配置
        loaders: [{
            test: /\.js$/,
            include: path.join(__dirname, 'src'),
            loader: 'babel-loader',
            query: {
                presets: ["react"]
            }
        }],
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('common.js')/* ,
        new uglifyJsPlugin({
            compress: {
                warnings: false
            }
        }) */
    ],
    WEBPACK_FUNC: {
        getImportsScriptList: _getImportsScriptList
    }
};