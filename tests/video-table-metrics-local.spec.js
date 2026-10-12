import { test, expect } from '@playwright/test';

test('视频表格账号统计保存恢复，空值与零值区分，图标编辑和删除', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1221, height: 918 });
  await page.goto('/?workspace-preview&workspace-tab=creator-benchmark&nav=sidebar-v1');
  await page.evaluate(() => {
    localStorage.setItem('benchmark-topic-groups-v1', JSON.stringify(['测试母题']));
    localStorage.setItem('benchmark-topic-metadata-v1', JSON.stringify({ '测试母题': { adaptationDirection: '改编为职场重逢' } }));
    localStorage.setItem('benchmark-accounts-v1', JSON.stringify([{ id: 'metric-account', name: '测试创作者', platform: '抖音' }]));
    localStorage.setItem('video-collection-v1', JSON.stringify([
      { id: 'metric-video', title: '统计验证视频', platform: '抖音', topicGroup: '测试母题', accountId: 'metric-account', details: { metadata: { 'benchmark-like-count': '0' } } },
      { id: 'empty-video', title: '未关联视频', platform: '小红书' },
    ]));
  });
  await page.reload();
  const frame = page.frameLocator('iframe[title="对标库工作区"]');
  await frame.getByRole('button', { name: '对标账号库', exact: true }).click();
  await frame.locator('#creator-table-body').getByRole('button', { name: '编辑', exact: true }).click();
  await frame.locator('#form-creator-work-count').fill('128');
  await frame.locator('#form-creator-follower-count').fill('42000');
  await frame.getByRole('button', { name: '保存账号', exact: true }).click();
  await page.reload();
  await frame.getByRole('button', { name: '视频全景管理', exact: true }).click();
  await expect(frame.locator('#view-videos thead th')).toHaveText(['视频标题 / 链接', '所属母题', '作者账号', '点赞量视频个数 / 粉丝量', '评级', '操作']);
  const row = frame.locator('#video-table-body tr').filter({ hasText: '统计验证视频' });
  await expect(row.locator('td').nth(1).locator('div')).toHaveText(['测试母题', '改编为职场重逢']);
  await expect(row.locator('td').nth(2)).toHaveText(/测试创作者\s+抖音/);
  await expect(row.locator('td').nth(3)).toContainText('点赞量：0');
  await expect(row.locator('td').nth(3)).toContainText('作：128 / 粉：42,000');
  const empty = frame.locator('#video-table-body tr').filter({ hasText: '未关联视频' });
  await expect(empty.locator('td').nth(2)).toHaveText(/无关联\s+小红书/);
  await expect(empty.locator('td').nth(3)).toContainText('作：待填 / 粉：待填');
  await expect(row.getByRole('button', { name: '编辑', exact: true })).toHaveText('');
  await expect(row.getByRole('button', { name: '删除', exact: true })).toHaveText('');
  await page.screenshot({ path: 'test-results/video-table-metrics-desktop.png', fullPage: true });
  for (const width of [805, 390]) {
    await page.setViewportSize({ width, height: 789 });
    const boxes = await Promise.all(['#video-platform-filter', '#video-motif-filter', '#video-creator-filter'].map(selector => frame.locator(selector).boundingBox()));
    expect(Math.max(...boxes.map(box => box.y)) - Math.min(...boxes.map(box => box.y))).toBeLessThan(1);
    await expect(frame.locator('#video-platform-filter')).toBeVisible();
    await frame.locator('#video-platform-filter').selectOption('小红书');
    await expect(frame.locator('#video-table-body tr')).toHaveCount(1);
    await expect(frame.locator('#video-table-body')).toContainText('未关联视频');
    await frame.locator('#video-platform-filter').selectOption('ALL');
    await page.screenshot({ path: `test-results/video-filters-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1221, height: 918 });
  await row.getByRole('button', { name: '编辑', exact: true }).click();
  await expect(frame.locator('#form-video-title')).toHaveValue('统计验证视频');
  await page.screenshot({ path: 'test-results/video-intake-title-link.png', fullPage: true });
  await frame.locator('#modal-video-edit').getByRole('button', { name: '取消', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await empty.getByRole('button', { name: '删除', exact: true }).click();
  await expect(frame.locator('#video-table-body tr')).toHaveCount(1);
  expect(errors).toEqual([]);
});
