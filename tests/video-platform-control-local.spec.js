import { test, expect } from '@playwright/test';

test('链接自动识别，手动平台保存恢复，再切回自动识别', async ({ page }) => {
  await page.setViewportSize({ width: 1123, height: 789 });
  await page.goto('/?workspace-preview&workspace-tab=creator-benchmark&nav=sidebar-v1');
  const frame = page.frameLocator('iframe[title="对标库工作区"]');
  await frame.getByRole('button', { name: '视频全景管理', exact: true }).click();
  await frame.getByRole('button', { name: '+ 录入新视频', exact: true }).click();
  const url = frame.locator('#form-video-url');
  const platform = frame.locator('#form-video-platform');
  await expect(platform).toHaveValue('其他');
  for (const [link, expected] of [
    ['https://v.douyin.com/test/', '抖音'],
    ['https://youtu.be/test', 'YouTube'],
    ['https://b23.tv/test', 'Bilibili'],
    ['https://www.kuaishou.com/short-video/test', '快手'],
    ['https://xhslink.com/test', '小红书'],
    ['https://channels.weixin.qq.com/test', '视频号'],
    ['https://douyin.com.example.com/test', '其他'],
  ]) {
    await url.fill(link);
    await expect(platform).toHaveValue(expected);
  }
  await platform.selectOption('抖音');
  await url.fill('https://youtu.be/test');
  await expect(platform).toHaveValue('抖音');
  await expect(platform).toHaveAttribute('title', /手动选择/);
  await frame.locator('#form-video-title').fill('平台验证视频');
  await page.screenshot({ path: 'test-results/video-platform-control.png', fullPage: true });
  await frame.locator('#modal-video-edit').getByRole('button', { name: /保存/ }).click();
  await page.reload();
  await frame.getByRole('button', { name: '视频全景管理', exact: true }).click();
  await frame.locator('#video-table-body').getByRole('button', { name: '编辑', exact: true }).click();
  await expect(platform).toHaveValue('抖音');
  await url.fill('https://b23.tv/test');
  await expect(platform).toHaveValue('抖音');
  await platform.selectOption('AUTO');
  await expect(platform).toHaveValue('Bilibili');
  await frame.locator('#modal-video-edit').getByRole('button', { name: /保存/ }).click();
  await page.reload();
  await frame.getByRole('button', { name: '视频全景管理', exact: true }).click();
  await frame.locator('#video-table-body').getByRole('button', { name: '编辑', exact: true }).click();
  await url.fill('https://youtu.be/test');
  await expect(platform).toHaveValue('YouTube');
});
