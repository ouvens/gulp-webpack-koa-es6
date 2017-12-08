'use strict';
/**
 * 中间件加载
 * @type {[type]}
 */

const render = require('../lib/render');
const util = require('../lib/util');
const md5 = require('../lib/md5');
const coRequest = require('../lib/coRequest');
const config = require('./common/config');
const reactComponent = require('../lib/reactComponent');

const React = require('react');
const ReactDOM = require('react-dom');
const ReactDOMServer = require('react-dom/server');

/**
 * react前后端同构页面
 * @param {[type]} req           [description]
 * @param {[type]} res           [description]
 * @yield {[type]} [description]
 */
const reactController = function*(req, res) {

    let ctx = this;
    let helloProps = {
        type: 'hello',
        data: {
            name: 'hello-name-init',
            address: 'hello-address-init',
            age: '26',
            job: 'hello-job-init'
        }
    };

    let contentProps = {
    	type: 'content',
    	data: {
	        name: 'content-name-init',
	        address: 'content-address-init',
	        age: '26',
	        job: 'content-job-init'
	    }
    }

    let reactHello = reactComponent.renderPath(ctx, 'react/react-hello/main.jsx', helloProps);
    let reactContent = reactComponent.renderPath(ctx, 'react/react-content/main.jsx', contentProps);

    ctx.body = yield render(ctx, 'pages/react', {
        reactHello,
        reactContent,
        storeData: {
            helloProps,
            contentProps
        }
    });
};

const index = function* (req, res) {
    let ctx = this;

    ctx.body = yield render(ctx, 'pages/index', {});
};

const component = function* (req, res) {
    let ctx = this;

    ctx.body = yield render(ctx, 'pages/component', {});
};


/**
 * 社团详情页
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
// const orgDetail = function*(req, res) {
//     let ctx = this;

//     try {
//         let wxJsConfig = yield config.getWxJsConfig(ctx);
//         let data = yield coRequest({
//             url: config.getPath(ctx) + "/mock/detail.json",
//             type: 'get'
//         });

//         data = JSON.parse(data.body).result;

//         // 如果是前端渲染则不渲染数据
//         if (ctx.request.query.r) {
//             ctx.body = yield render(ctx, 'pages/org-detail');
//         } else {
//             ctx.body = yield render(ctx, 'pages/org-detail', {
//                 data: data,
//                 wxJsConfig: wxJsConfig
//             });
//         }
//     } catch (e) {
//         console.log(e);
//     }
// };

/**
 * 社团排行页
 * @param {[type]} req           [description]
 * @param {[type]} res           [description]
 * @yield {[type]} [description]
 */
// const orgRank = function*(req, res) {
//     let ctx = this;

//     try {
//         let wxJsConfig = yield config.getWxJsConfig(ctx);
//         let data = yield coRequest({
//             url: config.getPath(ctx) + "/mock/rank.json",
//             type: 'get'
//         });

//         data = JSON.parse(data.body).result;

//         // 如果是前端渲染则不渲染数据
//         if (ctx.request.query.r) {
//             ctx.body = yield render(ctx, 'pages/org-rank');
//         } else {
//             ctx.body = yield render(ctx, 'pages/org-rank', {
//                 data: data,
//                 wxJsConfig: wxJsConfig
//             });
//         }
//     } catch (e) {
//         console.log(e);
//     }
// };

/**
 * 用户登录页面
 * @param {[type]} req           [description]
 * @param {[type]} res           [description]
 * @yield {[type]} [description]
 */
// const login = function*(req, res) {
//     const ctx = this;

//     let isMobile = /ipad|iphone|android/i.test(ctx.header['user-agent'])

//     ctx.body = yield render(ctx, 'pages/user-login', {
//         session: ctx.session
//     });

// }

module.exports = {
    index: index,
    component: component,
    react: reactController
}
