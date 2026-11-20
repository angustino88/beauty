import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  // A configured baseURL exercises the deployed asset layout. Otherwise serve the standalone files.
  const origin = baseURL || 'http://little-acre.test';
  if (!baseURL) {
    await page.route(origin + '/farm-game/**', route => {
      const pathname = new URL(route.request().url()).pathname;
      const file = new URL('..' + pathname, import.meta.url);
      return route.fulfill({ path: fileURLToPath(file) });
    });
  }
  await page.clock.install({time:new Date(2026,5,15,12)});
  await page.goto(origin + '/farm-game/index.html');
});

for (const { line, fare } of [{ line: 'passenger', fare: 16 }, { line: 'freight', fare: 23 }]) {
  test(`restore the ${line} ferry and settle its first crossing once`, async ({ page }) => {
    test.slow();
    const click = id => page.locator('#' + id).click();
    const go = name => page.locator('#destinations').getByRole('button', { name }).click();
    const plots = page.locator('.plot');
    const sign = page.locator('#sign-letter');
    const coins = page.locator('#coins');

    await click('read-letter');
    await page.selectOption('#letter-language', 'vi');
    await expect(sign).toBeDisabled();
    await click('close-letter');
    await plots.nth(0).click();
    await plots.nth(1).click();
    await click('water-all');
    await page.clock.fastForward(86400000);
    await page.locator('[data-tool="harvest"]').click();
    await plots.nth(0).click();
    await plots.nth(1).click();
    await click('read-letter');
    await sign.click();
    await expect(coins).toHaveText('38');
    await expect(sign).toBeHidden();

    await click('next-letter');
    await click('letter-travel');
    await click('read-letter');
    await expect(sign).toBeDisabled();
    for (const gate of ['inlet', 'sluice', 'inlet', 'sluice']) await click(gate);
    await expect(page.locator('#lock-level')).toHaveText('4/6');
    await sign.click();
    await expect(coins).toHaveText('56');
    await click('close-letter');

    await click('fish');
    await go('Cider Orchard');
    await click('pick');
    await click('press');
    await go('Clover Meadow');
    await click('tend-hives');
    await page.clock.fastForward(86400000);
    await click('collect-honey');
    await go('Cider Orchard');
    await click('bottle');
    await click('pick');
    await go('Clover Meadow');
    await click('read-letter');
    await sign.click();
    await click('close-letter');
    await go('Homestead');
    await click('cook');
    await expect(page.locator('#cook')).toBeDisabled();
    await page.clock.fastForward(86400000);
    await click('cook');
    await go('Willow Wharf');
    await click('read-letter');
    await page.locator(`[name="ferry-line"][value="${line}"]`).check();
    await sign.click();
    await click('next-letter');
    const title = line === 'passenger' ? 'Phà chở khách' : 'Phà chở hàng';
    await expect(page.locator('#letter-heading')).toHaveText(title);
    await page.selectOption('#archive', '0');
    await expect(sign).toBeHidden();
    await expect(page.locator('#letter-stock')).toHaveText('Ký ngày 2');
    await click('close-letter');
    await expect(coins).toHaveText('106');

    if (line === 'freight') await click('fish');
    await click('sail');
    await page.reload();
    await go('Willow Wharf');
    await expect(page.locator('#sail')).toBeDisabled();
    await page.clock.fastForward(86400000);
    await click('sail');
    await expect(coins).toHaveText(String(106 + fare));
    await page.reload();
    await go('Willow Wharf');
    await expect(page.locator('#sail')).toHaveText('Cho phà xuất bến');
    await expect(page.locator('#crossing-stock')).toContainText('Số chuyến: 1');
    await expect(coins).toHaveText(String(106 + fare));
  });
}

test('mill a wheat harvest across a saved day', async ({ page }) => {
  const plots = page.locator('.plot');
  const mill = page.locator('#mill');
  await page.locator('#quick-seed').selectOption('wheat');
  await plots.nth(0).click();
  await plots.nth(1).click();
  for (let day = 0; day < 2; day++) {
    await page.click('#water-all');
    await page.clock.fastForward(86400000);
  }
  await page.locator('[data-tool="harvest"]').click();
  await plots.nth(0).click();
  await plots.nth(1).click();
  await page.getByRole('button', { name: 'Stone windmill' }).click();
  await expect(page.locator('#sell')).toBeDisabled();
  await page.reload();
  await expect(mill).toBeDisabled();
  await page.clock.fastForward(86400000);
  await mill.click();
  await expect(page.locator('#coins')).toHaveText('50');
  await expect(mill).toBeDisabled();
});

test('each photograph opens with a decoded image and its own download', async ({ page }) => {
  const dialog = page.locator('#photo');
  let previous;
  for (const light of ['morning', 'evening']) {
    await page.clock.setSystemTime(new Date(2026,5,15,light === 'morning' ? 8 : 18));
    await page.click('#take-photo');
    await expect(dialog).toBeVisible();
    expect(await dialog.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    const download = dialog.getByRole('link', { name: 'Save PNG' });
    await expect(download).toHaveAttribute('download', 'little-acre-home-day-1.png');
    const url = await download.getAttribute('href');
    expect(url).toMatch(/^blob:/);
    expect(url).not.toBe(previous);
    previous = url;
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('real dawn advances a watered crop and rotates the destination', async ({page}) => {
  await page.locator('.plot').first().click();
  await expect(page.locator('.plot-feedback').first()).toBeVisible();
  await page.click('#water-all');
  await page.evaluate(() => {
    const farm = JSON.parse(localStorage.getItem('little-acre-v1'));
    farm.calendarDay -= 1;
    localStorage.setItem('little-acre-v1',JSON.stringify(farm));
  });
  await page.reload();
  await expect(page.locator('#day')).toHaveText('2');
  await expect(page.locator('.plot').first()).toHaveAttribute('aria-label', /ready to harvest/);
  await page.click('#market-visit');
  await expect(page.locator('#place-name')).toHaveText('Clover Meadow');
});
