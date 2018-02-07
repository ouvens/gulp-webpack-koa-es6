/**
 Gulpfile for gulp-webpack-demo
 created by fwon
*/

const gulp = require('gulp'),
    os = require('os'),
    gutil = require('gulp-util'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    gulpOpen = require('gulp-open'),
    uglify = require('gulp-uglify'),
    cssmin = require('gulp-cssmin'),
    md5 = require('gulp-md5-plus'),
    swig = require('gulp-swig'),
    clean = require('gulp-clean'),
    spriter = require('gulp-css-spriter'),
    base64 = require('gulp-css-base64'),
    webpack = require('webpack'),
    webpackConfig = require('./webpack.config.dev.js'),
    webpackDevConfig = require('./webpack.config.dev.js'),
    connect = require('gulp-connect');

const BUILD_CONFIG = webpackDevConfig.plugins[1].options.BUILD_CONFIG;

// const BUILD_CONFIG = webpackConfig.BUILD_CONFIG;

const WEBPACK_FUNC = webpackDevConfig.plugins[1].options.WEBPACK_FUNC;


const host = {
    path: BUILD_CONFIG.dist_dir + '/',
    port: 3000,
    html: 'index.html'
};

//mac chrome: "Google chrome", 
const browser = os.platform() === 'linux' ? 'Google chrome' : (
  os.platform() === 'darwin' ? 'Google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));
const pkg = require('./package.json');

//将图片拷贝到目标目录
gulp.task('copy:images', function (done) {
    gulp.src([BUILD_CONFIG.src_dir + '/images/**/*']).pipe(gulp.dest(BUILD_CONFIG.dist_dir + '/images')).on('end', done);
});

//压缩合并css, css中既有自己写的.less, 也有引入第三方库的.css
gulp.task('lessmin', function (done) {
    gulp.src([BUILD_CONFIG.src_dir + '/css/main.less', BUILD_CONFIG.src_dir + '/css/*.css'])
        .pipe(less())
        //这里可以加css sprite 让每一个css合并为一个雪碧图
        //.pipe(spriter({}))
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest(BUILD_CONFIG.dist_dir + '/css/'))
        .on('end', done);
});

//将js加上10位md5,并修改html中的引用路径，该动作依赖build-js
gulp.task('md5:js', ['build-js'], function (done) {
    gulp.src(BUILD_CONFIG.dist_dir + '/js/**/*.js')
        .pipe(md5(10, BUILD_CONFIG.dist_dir + BUILD_CONFIG.html_dir + '/*.html'))
        .pipe(gulp.dest(BUILD_CONFIG.dist_dir + '/js'))
        .on('end', done);
});

//将css加上10位md5，并修改html中的引用路径，该动作依赖sprite
gulp.task('md5:css', ['sprite'], function (done) {
    gulp.src(BUILD_CONFIG.dist_dir + '/css/**/*.css')
        .pipe(md5(10, BUILD_CONFIG.dist_dir + BUILD_CONFIG.html_dir + '/*.html'))
        .pipe(gulp.dest(BUILD_CONFIG.dist_dir + '/css'))
        .on('end', done);
});

//用于在html文件中直接include文件
gulp.task('fileinclude', function (done) {
    gulp.src([BUILD_CONFIG.src_dir + BUILD_CONFIG.html_dir + '/*.html'])
        .pipe(swig({
            data: {
                my: 'testss',
                title: 'ouvenzhang',
                scripts: WEBPACK_FUNC.getImportsScriptList()
            }
        }))
        .pipe(gulp.dest(BUILD_CONFIG.dist_dir + BUILD_CONFIG.html_dir))
        .on('end', done);
        // .pipe(connect.reload())
});

//雪碧图操作，应该先拷贝图片并压缩合并css
gulp.task('sprite', ['copy:images', 'lessmin'], function (done) {
    var timestamp = +new Date();
    gulp.src(BUILD_CONFIG.dist_dir + '/css/style.min.css')
        .pipe(spriter({
            spriteSheet: BUILD_CONFIG.dist_dir + '/images/spritesheet' + timestamp + '.png',
            pathToSpriteSheetFromCSS: '../images/spritesheet' + timestamp + '.png',
            spritesmithOptions: {
                padding: 10
            }
        }))
        .pipe(base64())
        .pipe(cssmin())
        .pipe(gulp.dest(BUILD_CONFIG.dist_dir + '/css'))
        .on('end', done);
});

// 删除构建发布目录缓存
gulp.task('clean', function (done) {
    gulp.src([BUILD_CONFIG.dist_dir])
        .pipe(clean())
        .on('end', done);
});

// 进行watch编译
gulp.task('watch', function (done) {
    gulp.watch(BUILD_CONFIG.src_dir + '/**/*', ['lessmin', 'dev-js', 'fileinclude'])
        .on('end', done);
});

// 启动调试静态server
gulp.task('connect', function () {
    connect.server({
        root: host.path,
        port: host.port,
        livereload: true/* ,
        middleware: function (connect, opt) {
            var Proxy = require('gulp-connect-proxy');
            var opt = {
                root: '/',
                route: 'http://localhost:8086/js'
            }
            var proxy = new Proxy(opt);
            return [proxy]; */
        //   }
    });
});

// 打开浏览器进行调试
gulp.task('open', function (done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            // uri为启动静态服务器的登录目录
            uri: 'http://localhost:3000' + BUILD_CONFIG.html_dir
        }))
        .on('end', done);
});

var buildCompiler = webpack(Object.create(webpackConfig));

var devCompiler = webpack(Object.create(webpackDevConfig));

//引用webpack对js进行dist操作
gulp.task("build-js", ['fileinclude'], function(callback) {
    buildCompiler.run(function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build-js", err);
        gutil.log("[webpack:build-js]", stats.toString({
            colors: true
        }));
        callback();
    });
});

//引用webpack对js进行dev操作
gulp.task("dev-js", ['fileinclude'], function(callback) {
    devCompiler.run(function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:dev-js", err);
        gutil.log("[webpack:dev-js]", stats.toString({
            colors: true
        }));
        callback();
    });
});

//发布
gulp.task('dist', ['connect', 'fileinclude', 'md5:css', 'md5:js', 'open']);

//开发，不默认打开open浏览器
gulp.task('dev', ['connect', 'copy:images', 'fileinclude', 'lessmin', 'dev-js', 'watch']);
gulp.task('default', ['connect', 'copy:images', 'fileinclude', 'lessmin', 'dev-js', 'watch']);