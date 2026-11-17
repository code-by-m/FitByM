import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';

async function open(page: Page, route = '') {
  await page.goto(`./#/${route}`);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.getByText('Kayıtların hazırlanıyor…')).toHaveCount(0);
}
async function controlled(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
  });
}
async function backup(page: Page) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON yedek indir' }).click();
  const download = await downloadPromise;
  return JSON.parse(await fs.readFile((await download.path())!, 'utf8'));
}

test('custom exercise → program → multiple sets → reload/resume → history → weight → backup/restore', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, 'egzersizler');
  await page.getByRole('button', { name: 'Egzersiz oluştur', exact: true }).click();
  await page.getByLabel('Egzersiz adı', { exact: true }).fill('QA Ev Hareketi');
  await page.getByLabel('Uygulama adımları').fill('Kontrollü uygula.');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await open(page, 'programlar');
  await page.getByRole('button', { name: 'Program oluştur' }).click();
  await page.getByLabel('Program adı', { exact: true }).fill('QA Günlük Program');
  await page
    .getByRole('combobox', { name: 'Egzersiz seç', exact: true })
    .selectOption({ label: 'QA Ev Hareketi' });
  await page.getByRole('button', { name: 'Egzersizi ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Programı kaydet' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const card = page
    .locator('section.card')
    .filter({ has: page.getByRole('heading', { name: 'QA Günlük Program', exact: true }) });
  await card.getByRole('button', { name: 'Başla', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'QA Günlük Program', exact: true })).toBeVisible();
  await page.getByLabel('Tekrar', { exact: true }).nth(0).fill('9');
  await page.getByRole('button', { name: '1. set tamamla', exact: true }).click();
  await page.getByLabel('Tekrar', { exact: true }).nth(1).fill('10');
  await page.getByRole('button', { name: '2. set tamamla', exact: true }).click();
  await expect(page.getByText('2 / 2 set tamamlandı')).toBeVisible();
  await page.reload();
  await expect(page.getByText('2 / 2 set tamamlandı')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Antrenmanı bitir', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('1. set: 9 tekrar');
  await expect(page.getByRole('dialog')).toContainText('2. set: 10 tekrar');
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await open(page, 'gelisim');
  await page.getByRole('button', { name: 'Ölçüm ekle', exact: true }).click();
  await page.getByLabel('Ağırlık (kg)', { exact: true }).fill('88.5');
  await page.getByRole('button', { name: 'Ölçümü kaydet' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('88.5 kg ·', { exact: false })).toBeVisible();
  await open(page, 'ayarlar');
  const data = await backup(page);
  expect(data.schemaVersion).toBe(2);
  expect(
    data.workoutSessions.filter((s: { status: string }) => s.status === 'Completed'),
  ).toHaveLength(1);
  expect(data.workoutSets.filter((s: { isCompleted: boolean }) => s.isCompleted)).toHaveLength(2);
  expect(data.bodyMeasurements[0].weightKg).toBe(88.5);
  const invalid = { ...data, schemaVersion: 999 };
  await page.getByLabel('Yedek seç').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Verileri kontrol edin');
  await page.getByLabel('Yedek seç').setInputFiles({
    name: 'synthetic-qa-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.getByRole('dialog')).toContainText('1 ölçüm');
  await page.getByRole('button', { name: 'Onaylıyorum, verileri değiştir' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const restored = await backup(page);
  for (const key of [
    'exercises',
    'workoutPlans',
    'workoutPlanExercises',
    'workoutSessions',
    'workoutSessionExercises',
    'workoutSets',
    'bodyMeasurements',
    'userGoals',
    'profiles',
    'nutritionEntries',
  ])
    expect(restored[key]).toEqual(data[key]);
  expect(errors).toEqual([]);
});

test('all pages: narrow phone and desktop, light/dark, accessibility and hash refresh', async ({
  page,
}) => {
  test.setTimeout(120000);
  const routes = [
    '',
    'egzersizler',
    'programlar',
    'antrenman',
    'gecmis',
    'gelisim',
    'ayarlar',
    'beslenme',
  ];
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await open(page, route);
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          )
          .toBe(true);
        if (width === 390) {
          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(
            results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          ).toEqual([]);
        }
      }
    }
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Beslenme', exact: true })).toBeVisible();
  await page.locator('.skip').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(page.url()).toContain('#/beslenme');
});

test('service worker scope, cached lazy routes, offline reload, offline data and backup', async ({
  page,
  context,
}) => {
  await open(page);
  await controlled(page);
  expect(
    await page.evaluate(async () => new URL((await navigator.serviceWorker.ready).scope).pathname),
  ).toBe('/FitByM/');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Harekete iyi bir başlangıç/ })).toBeVisible();
  await open(page, 'programlar');
  await page
    .locator('section.card')
    .filter({ has: page.getByRole('heading', { name: 'FULL BODY A', exact: true }) })
    .getByRole('button', { name: 'Başla', exact: true })
    .click();
  await page.getByRole('button', { name: '1. set tamamla', exact: true }).first().click();
  await expect(page.getByText('1 / 12 set tamamlandı')).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 / 12 set tamamlandı')).toBeVisible();
  await open(page, 'ayarlar');
  const data = await backup(page);
  expect(data.workoutSets.filter((s: { isCompleted: boolean }) => s.isCompleted)).toHaveLength(1);
  await context.setOffline(false);
});

test('waiting service worker update is gated during workout and preserves data after activation', async ({
  page,
}) => {
  await open(page, 'programlar');
  await controlled(page);
  await page.getByRole('button', { name: 'Başla', exact: true }).first().click();
  await page.getByRole('button', { name: '1. set tamamla', exact: true }).first().click();
  await expect(page.getByText('1 / 12 set tamamlandı')).toBeVisible();
  const original = await fs.readFile('dist/sw.js', 'utf8');
  try {
    await fs.writeFile('dist/sw.js', `${original}\n// synthetic update QA ${Date.now()}\n`);
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.ready).update();
    });
    await expect(page.getByRole('button', { name: 'Güncelle', exact: true })).toBeDisabled();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Antrenmanı bitir', exact: true }).click();
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Güncelle', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Güncelle', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Güncelle', exact: true })).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Antrenman geçmişi', exact: true }),
    ).toBeVisible();
    await open(page, 'ayarlar');
    const data = await backup(page);
    expect(data.workoutSessions[0].status).toBe('Completed');
    expect(data.workoutSets.filter((s: { isCompleted: boolean }) => s.isCompleted)).toHaveLength(1);
  } finally {
    await fs.writeFile('dist/sw.js', original);
  }
});

test('exercise media editor saves links and retains them after reload', async ({ page }) => {
  const image = 'https://media.example.test/squat.png';
  await page.route(image, async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: await fs.readFile('public/icons/icon-192.png'),
    }),
  );
  await open(page, 'egzersizler');
  await page.getByRole('button', { name: /Bodyweight Squat/ }).click();
  await page.getByRole('button', { name: 'Resim / video düzenle' }).click();
  await page.getByLabel('Resim bağlantısı').fill(image);
  await page.getByLabel('Video bağlantısı').fill('https://media.example.test/squat.mp4');
  await page.getByRole('button', { name: 'Medyayı kaydet' }).click();
  const picture = page.getByRole('img', { name: 'Bodyweight Squat uygulama görseli' });
  await expect(picture).toHaveAttribute('src', image);
  await expect
    .poll(() => picture.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBe(192);
  await expect(page.locator('video')).toHaveAttribute('preload', 'none');
  await expect(page.locator('video')).toHaveAttribute('playsinline', '');
  await page.reload();
  await page.getByRole('button', { name: /Bodyweight Squat/ }).click();
  await expect(picture).toHaveAttribute('src', image);
  await page.getByRole('button', { name: 'Resim / video düzenle' }).click();
  await page.getByLabel('Video bağlantısı').fill('https://video.example.test/watch');
  await page.getByRole('button', { name: 'Medyayı kaydet' }).click();
  await expect(page.getByRole('link', { name: 'Videoyu yeni sekmede izle' })).toHaveAttribute(
    'href',
    'https://video.example.test/watch',
  );
  await expect(page.locator('iframe,video')).toHaveCount(0);
});

test('all built-in exercises have ready previews, including offline and during a workout', async ({
  page,
  context,
}) => {
  await open(page, 'egzersizler');
  await expect(page.locator('.exercise-card .movement-preview svg')).toHaveCount(12);
  await controlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.exercise-card .movement-preview svg')).toHaveCount(12);
  await page.getByRole('button', { name: /Bodyweight Squat/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.movement-preview svg')).toBeVisible();
  await expect(dialog.locator('.movement-preview circle')).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Hareketi oynat' }).click();
  await expect(dialog.locator('.movement-preview circle')).toHaveCount(1);
  const first = await dialog.locator('.movement-preview polyline').first().getAttribute('points');
  await expect
    .poll(() => dialog.locator('.movement-preview polyline').first().getAttribute('points'))
    .not.toBe(first);
  await dialog.getByRole('button', { name: 'Durdur' }).click();
  await expect(dialog.locator('.movement-preview circle')).toHaveCount(2);
  await page.screenshot({
    path: test.info().outputPath('ready-preview-phone.png'),
    fullPage: true,
  });
  await dialog.getByRole('button', { name: 'Kapat', exact: true }).click();
  await open(page, 'programlar');
  await page.getByRole('button', { name: 'Başla', exact: true }).first().click();
  const guide = page.locator('.workout-guide').first();
  await expect(guide.locator('svg')).toBeVisible();
  await expect(guide.locator('summary')).toHaveCount(0);
  await expect(guide.getByRole('button', { name: 'Hareketi oynat' })).toBeVisible();
  await context.setOffline(false);
});

test('workout follows program order one movement at a time with an always visible preview', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await open(page, 'programlar');
  await page.getByRole('button', { name: 'Başla', exact: true }).first().click();
  const card = page.locator('.workout-exercise');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('heading', { name: 'Bodyweight Squat', exact: true })).toBeVisible();
  await expect(page.locator('.workout-steps button')).toHaveCount(6);
  await expect(card.locator('.workout-guide svg')).toBeVisible();
  await expect(page.getByRole('button', { name: /Önceki hareket/ })).toBeDisabled();
  await page.getByRole('button', { name: /Sonraki hareket/ }).click();
  await expect(card.getByRole('heading', { name: 'Wall Push-Up', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Önceki hareket/ }).click();
  await page.getByRole('button', { name: '1. set tamamla', exact: true }).click();
  await expect(page.getByText('1 / 12 set tamamlandı')).toBeVisible();
  await page.getByRole('button', { name: '2. set tamamla', exact: true }).click();
  await expect(card.getByRole('heading', { name: 'Wall Push-Up', exact: true })).toBeVisible();
  await expect(page.getByText('2 / 12 set tamamlandı')).toBeVisible();
  await page.reload();
  await expect(card.getByRole('heading', { name: 'Wall Push-Up', exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({
    path: test.info().outputPath('sequential-workout-phone.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(card.locator('.workout-guide svg')).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('sequential-workout-desktop.png'),
    fullPage: true,
  });
  await page.locator('.workout-steps button').first().click();
  await expect(card.getByRole('heading', { name: 'Bodyweight Squat', exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: '1. set geri al', exact: true })).toBeVisible();
  await page.locator('.workout-steps button').nth(1).click();
  await card.getByRole('button', { name: 'Atla', exact: true }).click();
  await expect(card.getByRole('heading', { name: 'Glute Bridge', exact: true })).toBeVisible();
  await page.reload();
  await expect(card.getByRole('heading', { name: 'Glute Bridge', exact: true })).toBeVisible();
  await page.locator('.workout-steps button').nth(1).click();
  await card.getByRole('button', { name: 'Geri ekle', exact: true }).click();
  await expect(card.getByRole('button', { name: '1. set tamamla', exact: true })).toBeVisible();
});

test('nutrition tracks local days, portions, CRUD, backups and offline meals', async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date('2026-11-16T21:30:00Z') });
  await open(page, 'beslenme');
  await expect(page.getByLabel('Gün', { exact: true })).toHaveValue('2026-11-17');
  await expect(page.getByText('Bu gün için henüz yemek kaydı yok.')).toBeVisible();
  await page.getByRole('button', { name: 'Yemek ekle', exact: true }).click();
  await page.getByLabel('Yemek adı', { exact: true }).fill('Test Öğünü');
  await page.getByRole('combobox', { name: 'Öğün', exact: true }).selectOption({ label: 'Öğle' });
  await page.getByLabel('Porsiyon açıklaması').fill('1 test porsiyonu');
  await page.getByLabel('Porsiyon adedi').fill('2');
  await page.getByLabel('Kalori (kcal)', { exact: true }).fill('200');
  await page.getByLabel('Protein (g)', { exact: true }).fill('10');
  await page.getByLabel('Karbonhidrat (g)', { exact: true }).fill('20');
  await page.getByLabel('Yağ (g)', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Yemeği kaydet', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('400');
  await expect(page.locator('.nutrition-remaining')).toContainText('1.900');
  await page.getByRole('button', { name: 'Test Öğünü düzenle', exact: true }).click();
  await page.getByLabel('Porsiyon adedi').fill('3');
  await page.getByRole('button', { name: 'Yemeği kaydet', exact: true }).click();
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('600');
  await page.reload();
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('600');
  await page.getByRole('button', { name: 'Test Öğünü kopyala', exact: true }).click();
  await page.getByRole('button', { name: 'Yemeği kaydet', exact: true }).click();
  await expect(page.locator('.nutrition-entry')).toHaveCount(2);
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('1.200');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Test Öğünü sil', exact: true }).first().click();
  await expect(page.locator('.nutrition-entry')).toHaveCount(1);
  await page.getByRole('button', { name: 'Sonraki gün', exact: true }).click();
  await expect(page.getByLabel('Gün', { exact: true })).toHaveValue('2026-11-18');
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('0');
  await page.getByRole('button', { name: 'Önceki gün', exact: true }).click();
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('600');
  await open(page);
  await expect(page.locator('.nutrition-overview')).toContainText('600');
  await open(page, 'ayarlar');
  const data = await backup(page);
  expect(data.schemaVersion).toBe(2);
  expect(data.nutritionEntries).toHaveLength(1);
  const legacy = { ...data, schemaVersion: 1 };
  delete legacy.nutritionEntries;
  await page.getByLabel('Yedek seç').setInputFiles({
    name: 'legacy-v1.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.getByRole('dialog')).toContainText('Bu eski yedek yemek kaydı içermez');
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  expect((await backup(page)).nutritionEntries).toHaveLength(1);
  await page.getByLabel('Yedek seç').setInputFiles({
    name: 'nutrition-v2.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.getByRole('dialog')).toContainText('1 yemek kaydı');
  await page.getByRole('button', { name: 'Onaylıyorum, verileri değiştir', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await backup(page)).nutritionEntries).toEqual(data.nutritionEntries);
  await controlled(page);
  await context.setOffline(true);
  await open(page, 'beslenme');
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('600');
  await page.getByRole('button', { name: 'Yemek ekle', exact: true }).click();
  await page.getByLabel('Yemek adı', { exact: true }).fill('Çevrimdışı kayıt');
  await page.getByLabel('Porsiyon adedi').fill('0.25');
  await page.getByLabel('Kalori (kcal)', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Yemeği kaydet', exact: true }).click();
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('625');
  await expect(page.getByText('0,25 porsiyon', { exact: true })).toBeVisible();
  await expect(
    page.getByText('1 kayıtta makro bilgisi eksik; toplamlar yalnızca girilen değerleri içerir.'),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('.nutrition-kcal > strong')).toContainText('625');
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations.map((v) => v.id)).toEqual([]);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: test.info().outputPath('nutrition-phone.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: test.info().outputPath('nutrition-desktop.png'), fullPage: true });
  await context.setOffline(false);
});
