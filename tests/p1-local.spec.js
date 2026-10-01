import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const desktop = { width: 1440, height: 1000 };

async function clearBrowserData(page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

async function assertNoA11yViolations(page, url, ready) {
  await page.goto(url);
  await expect(ready).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const summary = results.violations.map((item) => `${item.id}: ${item.help}`).join('\n');
  expect(results.violations, summary).toEqual([]);
}

test.describe('P1 本地桌面质量巡检', () => {
  test('桌面端预览页没有页面异常、同源 4xx/5xx 或明显慢加载', async ({ page }) => {
    await page.setViewportSize(desktop);
    const pageErrors = [];
    const consoleErrors = [];
    const failedResponses = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.url().startsWith('http://127.0.0.1:') && response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    for (const [url, ready] of [
      ['/?workspace-preview&workspace-tab=creator-collection', page.getByRole('heading', { name: '收录视频' })],
      ['/?workspace-preview&workspace-tab=breakdown', page.getByRole('heading', { name: '脚本拆解' })],
      ['/?workspace-preview&workspace-tab=subscriptions', page.getByRole('heading', { name: '订阅' })],
    ]) {
      await page.goto(url);
      await expect(ready).toBeVisible();
      const navigation = await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.duration ?? 0);
      expect(navigation, `${url} 加载过慢：${navigation.toFixed(0)}ms`).toBeLessThan(4_000);
    }

    expect(pageErrors, `页面异常：\n${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `控制台错误：\n${consoleErrors.join('\n')}`).toEqual([]);
    expect(failedResponses, `同源失败请求：\n${failedResponses.join('\n')}`).toEqual([]);
  });

  for (const [name, url, heading] of [
    ['访客工作台', '/', '个人工作台'],
    ['灵感视频', '/?workspace-preview&workspace-tab=creator-collection', '收录视频'],
    ['脚本拆解', '/?workspace-preview&workspace-tab=breakdown', '脚本拆解'],
  ]) {
    test(`${name}通过自动无障碍扫描`, async ({ page }) => {
      await page.setViewportSize(desktop);
      if (url === '/') {
        await page.route('**/auth/v1/**', (route) => route.abort());
        await page.route('**/rest/v1/**', (route) => route.abort());
      }
      await assertNoA11yViolations(page, url, page.getByRole('heading', { name: heading }));
    });
  }

  test('损坏的本地存储不会使创作页面白屏', async ({ page }) => {
    await page.setViewportSize(desktop);
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.addInitScript(() => {
      window.localStorage.setItem('video-collection-v1', '{not-json');
      window.localStorage.setItem('script-breakdown-draft-v1', '{not-json');
      window.localStorage.setItem('creator-growth-dashboard-v1', '{not-json');
    });

    await page.goto('/?workspace-preview&workspace-tab=creator-collection');
    await expect(page.getByRole('heading', { name: '收录视频' })).toBeVisible();
    await expect(page.getByText('收录完成的视频会保存在这里，可按标签查找并进入拆解学习。')).toBeVisible();
    await page.goto('/?workspace-preview&workspace-tab=breakdown');
    await expect(page.getByRole('heading', { name: '脚本拆解' })).toBeVisible();
    expect(pageErrors, `损坏存储导致页面异常：\n${pageErrors.join('\n')}`).toEqual([]);
  });

  test('日程入口可进入日历视图', async ({ page }) => {
    await page.setViewportSize(desktop);
    await clearBrowserData(page);
    await page.goto('/?workspace-preview&workspace-tab=dashboard');
    await page.getByRole('button', { name: '查看日历' }).click();
    await expect(page.getByRole('button', { name: '日历' })).toHaveClass(/active/);
  });

  test('桌面视觉证据：日程、灵感视频与脚本拆解', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chrome', '视觉证据只在 Chrome 桌面端生成一次');
    await page.setViewportSize(desktop);
    await clearBrowserData(page);

    await page.goto('/?workspace-preview&workspace-tab=dashboard');
    await expect(page.getByRole('button', { name: '查看日历' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('desktop-dashboard.png'), fullPage: true });

    await page.goto('/?workspace-preview&workspace-tab=creator-collection');
    await expect(page.getByRole('heading', { name: '收录视频' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('desktop-creator-collection.png'), fullPage: true });

    await page.goto('/?workspace-preview&workspace-tab=breakdown');
    await expect(page.getByRole('heading', { name: '脚本拆解' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('desktop-breakdown.png'), fullPage: true });
  });
});
