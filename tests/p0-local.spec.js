import { expect, test } from '@playwright/test';

async function clearBrowserData(page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

test.describe('P0 本地功能巡检', () => {
  test('访客访问受保护入口时只打开登录窗口，未写入业务数据', async ({ page }) => {
    await page.route('**/auth/v1/**', (route) => route.abort());
    await page.route('**/rest/v1/**', (route) => route.abort());
    await page.goto('/');

    await page.getByRole('button', { name: '待办' }).click();
    const dialog = page.getByRole('dialog', { name: '登录' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('邮箱')).toBeVisible();
    const password = dialog.locator('#login-password');
    await expect(password).toHaveAttribute('type', 'password');

    await dialog.getByRole('button', { name: '显示密码' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await dialog.getByRole('button', { name: '忘记密码？' }).click();
    await expect(page.getByRole('heading', { name: '重设你的登录密码' })).toBeVisible();
  });

  test('预览账号可收录灵感视频，刷新后数据保留，并可进入拆解', async ({ page }) => {
    await clearBrowserData(page);
    await page.goto('/?workspace-preview&workspace-tab=creator-collection');

    await expect(page.getByRole('heading', { name: '加入对标视频' })).toBeVisible();
    await page.getByLabel('视频名称').fill('P0 本地巡检视频');
    await page.locator('input[aria-label="视频链接"]').fill('https://www.youtube.com/watch?v=p0-local');
    await page.getByPlaceholder('为什么值得收集 / 我想研究什么（可选）').fill('验证本地存储与拆解入口');
    await page.getByRole('button', { name: '加入对标库' }).click();

    await expect(page.getByText('已收录到视频库')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'P0 本地巡检视频' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'P0 本地巡检视频' })).toBeVisible();

    await page.getByRole('button', { name: '直接拆解' }).click();
    await expect(page.getByRole('heading', { name: '脚本拆解' })).toBeVisible();
  });

  test('脚本拆解草稿保存、刷新恢复、归档与导出可用', async ({ page }) => {
    await clearBrowserData(page);
    await page.goto('/?workspace-preview&workspace-tab=breakdown');

    await page.locator('input[name="title"]').fill('P0 草稿 / 文件名校验');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByRole('status')).toContainText('当前练习已保存在此浏览器');
    await page.reload();
    await expect(page.locator('input[name="title"]')).toHaveValue('P0 草稿 / 文件名校验');

    await page.getByRole('button', { name: '完成并归档' }).click();
    await expect(page.getByRole('status')).toContainText('已完成并归档');

    await page.getByRole('button', { name: '导出' }).click();
    await page.getByLabel('导出位置').selectOption('download');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('region', { name: '导出选项' }).getByRole('button', { name: '导出' }).click();
    const download = await downloadPromise;
    await expect(download.suggestedFilename()).toBe('P0 草稿 - 文件名校验.md');
  });

  test('预览账号的订阅筛选与续费计算可以完成', async ({ page }) => {
    await clearBrowserData(page);
    await page.goto('/?workspace-preview&workspace-tab=subscriptions');

    await expect(page.getByLabel('订阅概览')).toBeVisible();
    await page.getByLabel('按到期状态筛选').selectOption('expired');
    await expect(page.locator('.compact-subscription-card')).toHaveCount(1);
    await page.getByLabel('按到期状态筛选').selectOption('all');

    await page.locator('.compact-subscription-card').first().click();
    await page.getByRole('dialog', { name: '订阅详情' }).getByRole('button', { name: /已续费|确认已扣款/ }).click();
    await expect(page.getByLabel('订阅概览')).toBeVisible();
  });
});
