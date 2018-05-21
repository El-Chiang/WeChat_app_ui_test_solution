# 小程序UI自动化测试方案
## 0x00. 准备工作

- [Node.js](https://nodejs.org/en/)
- [wept](https://github.com/chemzqm/wept)
- [puppeteer](https://github.com/GoogleChrome/puppeteer)
- [Jest](https://github.com/facebook/jest)



## 0x01. 工具介绍

### Node.js

这个解决方案中要求`node`版本大于`v7.6.0`，因为`puppeteer`要求最低版本是`v6.4.0`，但是官方实例中大量使用`async` `await`新特性，所以需要使用`v7.6.0`或更高版本的`node`。

### wept

`wept`是一个微信小程序web端实时运行工具。它的后台使用 node 提供服务完全动态生成小程序，前端实现了 view 层、service 层和控制层之间的相关通讯逻辑。支持 Mac, Window 以及 Linux。

### puppeteer

Chrome团队出品的一款更友好的Headless Chrome Node API ,用于代替用户在页面上面点击、拖拽、输入等多种操作，常见的使用场景还是应用到UI自动化测试，puppeteer可以对页面进行截图保存为图片或者PDF，解决爬虫无法实现的一些操作（异步加载页面内容） 。

其他类似的工具：

- [phantomjs](http://phantomjs.org/)
- [seleniumhq](http://seleniumhq.github.io/selenium/docs/api/javascript/)
- [nightmare](https://github.com/segmentio/nightmare)

在`puppeteer`出来以后，`phantomjs`即宣布不再继续开发维护，而`puppeteer`的使用更简单，功能更丰富，所以这里选择了`puppeteer`。

### Jest

`Jest` 是 Facebook 出品的一个测试框架，相对其他测试框架，其一大特点就是就是内置了常用的测试工具，比如自带断言、测试覆盖率工具，实现了开箱即用。 

其他类似的工具：

- [mocha](https://github.com/mochajs/mocha)
- [chai](https://github.com/chaijs/chai)



## 0x02. 开始配置环境

```shell
npm i -g wept
npm i --save-dev puppeteer jest
```

### 踩过的坑

在安装`puppeteer`有可能会出现以下报错：

```shell
ERROR: Failed to download Chromium r508693! Set "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" env variable to skip download.
Error: Download failed: server returned code 502. URL: https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/508693/chrome-win32.zip
    at ClientRequest.https.get.response (D:\chromium\node_modules\puppeteer\utils\ChromiumDownloader.js:197:21)
    at Object.onceWrapper (events.js:316:30)
    at emitOne (events.js:115:13)
    at ClientRequest.emit (events.js:210:7)
    at HTTPParser.parserOnIncomingClient [as onIncoming] (_http_client.js:565:21)
    at HTTPParser.parserOnHeadersComplete (_http_common.js:116:23)
    at Socket.socketOnData (_http_client.js:454:20)
    at emitOne (events.js:115:13)
    at Socket.emit (events.js:210:7)
    at ClientRequest.onsocket (D:\chromium\node_modules\https-proxy-agent\index.js:181:14)
```

原因是安装`puppeteer`时，都会下载Chromium，然而墙内网络环境不友好可能会导致下载失败。

### 解决方案

安装`puppeteer`时直接跳过Chromium的下载：

```shell
npm install puppeteer --ignore-scripts
```

手动下载chrome开发版，Win平台下载链接是<https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/508693/chrome-win32.zip> 

翻开仓库源码可以得知其他下载地址：

```javascript
const downloadURLs = {
    linux: 'https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/%d/chrome-linux.zip',
    mac: 'https://storage.googleapis.com/chromium-browser-snapshots/Mac/%d/chrome-mac.zip',
    win32: 'https://storage.googleapis.com/chromium-browser-snapshots/Win/%d/chrome-win32.zip',
    win64: 'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/%d/chrome-win32.zip',
};
```

选择对应平台，将`%d`替换成具体编号下载即可。

## 0x03. 一个测试实例

### 1. 执行wept

直接在小程序根目录执行`wept`，然后打开chrome访问<http://localhost:3000/#!pages/index/index>  ，就可以看到小程序运行在chrome上了

![](https://cl.ly/3D0g2w2H2m1L/Image%202018-05-19%20at%206.44.47%20PM.png)

### 2. 用puppeteer抓取小程序里的内容

新建一个`/test`目录，并增加一个`hello.test.js`测试，直接上代码：

```javascript
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

(async () => {
    try {
        const browser = await puppeteer.launch({
            // 如果是手动下载chromium则需要制定chromium所在目录的地址
            // executablePath: '/chromium/chrome.exe'
            headless: false
        });
        // 新建选项卡
        const page = await browser.newPage();
        // 设置展示设备
        await page.emulate(devices['iPhone 6']);
        // waitUnitil参数为了保证截图不是白屏
        await page.goto('http://localhost:3000/#!pages/index/index', { waitUntil: 'networkidle2' });
        // 截图
        // await page.screenshot({path: 'example.png'});
        // 根据iframe的name属性来获取正确的iframe
        const frames = await page.frames();
        const weChatFrame = frames.find(f => f.name() === 'view-0');
        const outerText = await weChatFrame.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('.container'));
            return anchors.map(anchor => anchor.textContent);
        });
        console.log('the outerText: ', outerText);
        // 关闭页面
        await browser.close();
    } catch (e) {
        console.log(e);
    }
})();

```

### 3. 加入Jest来进行测试

完整代码：

```javascript
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

test('should return "Hello WorldHello World"', () => {
    (async () => {
        try {
            const browser = await puppeteer.launch({
                headless: false
            });
            const page = await browser.newPage();
            await page.emulate(devices['iPhone 6']);
            await page.goto('http://localhost:3000/#!pages/index/index', { waitUntil: 'networkidle2' });
            const frames = await page.frames();
            const weChatFrame = frames.find(f => f.name() === 'view-0');
            const outerText = await weChatFrame.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('.container'));
                return anchors.map(anchor => anchor.textContent);
            });
            console.log('the outerText: ', outerText);
            expect(outerText[0]).toBe('Hello WorldHello World');
            await browser.close();
        } catch (e) {
            console.log(e);
        }
    })();
})

```

运行效果：

![](https://cl.ly/3n2W2w3K2J3e/Image%202018-05-19%20at%207.23.18%20PM.png)



## 其他

此套方案的优点是易于set up，无需代理，支持目前所有的小程序API，可使用Chrome调试。缺点是wept项目作者不再继续维护，并且测试环境和正式环境有一定差异。

另外小程序官方也有一个云测试，但是一个开发者24小时内只能提交一次。