const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

test('should return "Hello World"', () => {
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
            expect(outerText[0]).toBe('Hello World');
            // await browser.close();
        } catch (e) {
            console.log(e);
        }
    })();
})
