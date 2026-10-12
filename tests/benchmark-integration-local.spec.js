import { test, expect } from '@playwright/test';

test('旧资料接入、保存保留额外字段、刷新恢复及拆解跳转', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?workspace-preview&workspace-tab=creator-benchmark');
  await page.evaluate(() => {
    localStorage.setItem('benchmark-topic-groups-v1', JSON.stringify(['旧母题']));
    localStorage.setItem('benchmark-topic-summaries-v1', JSON.stringify({ '旧母题': '旧故事骨架' }));
    localStorage.setItem('benchmark-topic-metadata-v1', JSON.stringify({ '旧母题': { category: '报恩', directions: ['温暖'], custom: '保留' } }));
    localStorage.setItem('benchmark-accounts-v1', JSON.stringify([{ id: 'old-account', name: '旧账号', platform: 'YouTube', note: '研究原因' }]));
    localStorage.setItem('video-collection-v1', JSON.stringify([{ id: 'old-video', title: '旧视频', url: 'https://example.com/v', platform: 'YouTube', topicGroup: '旧母题', accountId: 'old-account', tags: ['温暖'], note: '保留研究备注', analysisNotes: { highlights: '保留亮点' }, details: { metadata: { 'benchmark-view-count': '12.3万', 'benchmark-background-music': '保留音乐' } }, comparison: { opening: '原有开头' }, researchProfile: { score: '88', grade: 'S' } }]));
  });
  await page.reload();
  const frame = page.frameLocator('iframe[title="对标库工作区"]');
  await expect(frame.locator('.card')).toContainText('旧母题');
  await expect(frame.locator('.card')).toHaveCount(1);
  await expect(frame.locator('.card')).toHaveCSS('border-radius', '24px');
  await frame.locator('.card').getByRole('button', { name: '编辑', exact: true }).click();
  await frame.locator('#form-motif-skeleton').fill('更新故事骨架');
  await frame.locator('#form-motif-adaptation').fill('将报恩故事改编为职场重逢');
  await frame.locator('#form-motif-tags').fill('职场, 重逢');
  const directionBox = await frame.locator('#form-motif-adaptation').boundingBox();
  const tagsBox = await frame.locator('#form-motif-tags').boundingBox();
  expect(Math.abs(directionBox.y - tagsBox.y)).toBeLessThan(1);
  expect(Math.abs(directionBox.width - tagsBox.width)).toBeLessThan(1);
  expect(directionBox.x).toBeLessThan(tagsBox.x);
  await page.screenshot({ path: 'test-results/motif-adaptation-layout.png', fullPage: true });
  await frame.getByRole('button', { name: '保存母题', exact: true }).click();
  const data = await page.evaluate(() => ({ videos: JSON.parse(localStorage.getItem('video-collection-v1')), meta: JSON.parse(localStorage.getItem('benchmark-topic-metadata-v1')), backup: localStorage.getItem('benchmark-hub-before-integration-v1') }));
  expect(data.videos[0].note).toBe('保留研究备注');
  expect(data.videos[0].analysisNotes.highlights).toBe('保留亮点');
  expect(data.videos[0].details.metadata['benchmark-view-count']).toBe('12.3万');
  expect(data.videos[0].details.metadata['benchmark-background-music']).toBe('保留音乐');
  expect(data.videos[0].researchProfile.score).toBe('88');
  expect(data.meta['旧母题'].custom).toBe('保留');
  expect(data.backup).toBeTruthy();
  await page.reload();
  await expect(frame.locator('.card')).toContainText('更新故事骨架');
  await frame.locator('.card').getByRole('button', { name: '编辑', exact: true }).click();
  await expect(frame.locator('#form-motif-adaptation')).toHaveValue('将报恩故事改编为职场重逢');
  await expect(frame.locator('#form-motif-tags')).toHaveValue('职场, 重逢');
  await frame.locator('#modal-motif-edit').getByRole('button', { name: '取消', exact: true }).click();
  await page.screenshot({ path: 'test-results/integrated-benchmark-motifs.png', fullPage: true });
  await frame.getByRole('button', { name: '视频全景管理', exact: true }).click();
  await expect(frame.locator('#video-table-body')).toContainText('旧视频');
  await frame.locator('#video-table-body').getByRole('button', { name: /编辑/ }).click();
  await expect(frame.locator('#form-video-platform')).toHaveValue('YouTube');
  await expect(frame.locator('#form-video-hook')).toHaveValue('原有开头');
  await frame.getByRole('button', { name: /进入拆解学习/ }).click();
  await expect(page.locator('iframe[title="对标库工作区"]')).toHaveCount(0);
  await expect(page.locator('#breakdown-source-title')).toBeVisible();
  expect(errors).toEqual([]);
});

test('新增母题和视频、对比、备份及创建项目对接', async ({ page }) => {
  await page.goto('/?workspace-preview&workspace-tab=creator-benchmark');
  const frame = page.frameLocator('iframe[title="对标库工作区"]');
  await frame.getByRole('button', { name: '新建母题', exact: true }).click();
  await frame.locator('#form-motif-name').fill('整合验证母题');
  await frame.locator('#form-motif-skeleton').fill('受助后报恩');
  await frame.getByRole('button', { name: '保存母题', exact: true }).click();
  await frame.getByRole('button', { name: '详情研习', exact: true }).click();
  for (const name of ['版本一', '版本二']) {
    await frame.getByRole('button', { name: '+ 为此母题收录视频', exact: true }).click();
    await frame.locator('#form-video-title').fill(name);
    await frame.locator('#form-video-url').fill(`https://example.com/${encodeURIComponent(name)}`);
    await frame.locator('#form-video-hook').fill(`${name}开头`);
    await frame.locator('#modal-video-edit').getByRole('button', { name: /保存/ }).click();
  }
  await frame.locator('#check-all-compare').check();
  await frame.getByRole('button', { name: /执行勾选版本对比/ }).click();
  await expect(frame.locator('#compare-matrix-table')).toContainText('版本一开头');
  await expect(frame.locator('#compare-matrix-table')).toContainText('版本二开头');
  await frame.getByRole('button', { name: '关闭', exact: true }).click();
  const download = page.waitForEvent('download');
  await frame.getByRole('button', { name: '备份数据', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('备份');
  await frame.getByRole('button', { name: '视频全景管理', exact: true }).click();
  await frame.locator('#video-table-body').getByRole('button', { name: '编辑', exact: true }).first().click();
  await frame.getByRole('button', { name: /根据此视频创建改编项目/ }).click();
  await expect(page.locator('iframe[title="对标库工作区"]')).toHaveCount(0);
  await expect(page.locator('body')).toContainText('版本二');
});

test('空库不注入演示数据，响应式及新增账号保存', async ({ page }) => {
  await page.goto('/?workspace-preview&workspace-tab=creator-benchmark');
  const frame = page.frameLocator('iframe[title="对标库工作区"]');
  await expect(frame.locator('.card')).toHaveCount(0);
  await frame.getByRole('button', { name: '对标账号库', exact: true }).click();
  await frame.getByRole('button', { name: '+ 收录对标账号', exact: true }).click();
  await frame.locator('#form-creator-name').fill('新账号');
  await frame.getByRole('button', { name: '保存账号', exact: true }).click();
  await page.reload();
  await frame.getByRole('button', { name: '对标账号库', exact: true }).click();
  await expect(frame.locator('#creator-table-body')).toContainText('新账号');
  for (const width of [1366, 850, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await frame.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/integrated-benchmark-${width}.png`, fullPage: true });
  }
});
