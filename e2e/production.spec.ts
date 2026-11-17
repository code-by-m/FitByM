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
  expect(data.schemaVersion).toBe(1);
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
  ])
    expect(restored[key]).toEqual(data[key]);
  expect(errors).toEqual([]);
});

test('all pages: narrow phone and desktop, light/dark, accessibility and hash refresh', async ({
  page,
}) => {
  test.setTimeout(120000);
  const routes = ['', 'egzersizler', 'programlar', 'antrenman', 'gecmis', 'gelisim', 'ayarlar'];
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
  await expect(page.getByRole('heading', { name: 'Ayarlar', exact: true })).toBeVisible();
  await page.locator('.skip').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(page.url()).toContain('#/ayarlar');
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
  await guide.locator('summary').click();
  await expect(guide.locator('svg')).toBeVisible();
  await expect(guide.getByRole('button', { name: 'Hareketi oynat' })).toBeVisible();
  await context.setOffline(false);
});
