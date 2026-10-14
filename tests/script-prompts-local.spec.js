import { test, expect } from '@playwright/test';

test('脚本页筛选旧提示词，保存后跨页恢复，图片修改入口正常', async ({ page }) => {
  await page.goto('/?workspace-preview&workspace-tab=script-prompts&nav=sidebar-v1');
  await page.evaluate(() => localStorage.setItem('creator-growth-dashboard-v1', JSON.stringify({ prompts: [
    { id:'script-old', materialType:'script', body:'旧脚本骨架提示词', tags:[] },
    { id:'image-old', materialType:'image', body:'旧图片提示词', tags:[] },
  ] })));
  await page.reload();
  const hero = page.locator('.workspace-prompt-library-hero');
  await expect(hero.locator('h1')).toHaveText('脚本');
  await expect(page.locator('.creator-prompt')).toHaveCount(1);
  await expect(page.locator('.creator-prompt')).toContainText('旧脚本骨架提示词');
  await hero.getByRole('button', { name:'添加提示词', exact:true }).click();
  await page.locator('.creator-prompt-form textarea').fill('新增改编创作提示词');
  await page.getByRole('button', { name:'保存提示词', exact:true }).click();
  await expect(page.locator('.creator-prompt')).toHaveCount(2);
  await hero.getByRole('button', { name:'我的提示词', exact:true }).click();
  await expect(page.locator('.creator-prompt')).toHaveCount(3);
  await hero.getByRole('button', { name:'图片修改', exact:true }).click();
  await expect(hero.locator('h1')).toHaveText('图片修改');
  await expect(page.locator('.image-edit-method-card')).toHaveCount(29);
  await hero.getByRole('button', { name:'脚本', exact:true }).click();
  await expect(page.locator('.creator-prompt')).toHaveCount(2);
  await page.screenshot({path:'test-results/script-prompts-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(hero.getByRole('button', { name:'脚本', exact:true })).toBeVisible();
  const size = await hero.evaluate(element => ({width:element.clientWidth,scrollWidth:element.scrollWidth}));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.width);
  await page.screenshot({path:'test-results/script-prompts-mobile.png',fullPage:true});
});
