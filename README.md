# FitByM by CodeByM

Türkçe, cihazda çalışan kişisel fitness PWA'sı. React + TypeScript + Vite, Tailwind, React Router, Dexie/IndexedDB, React Hook Form/Zod, Lucide ve Recharts kullanır. Backend, hesap veya ücretli hizmet gerektirmez.

## Çalıştırma

Node.js 24 ve npm kullanın. Windows PowerShell yürütme ilkesi npm.ps1'i engelliyorsa `npm.cmd` kullanın.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Yerel adres: http://localhost:5173/FitByM/ . Üretim çıktısı `dist/` içindeki statik dosyalardır.

## Özellikler

- Gerçek kayıtlardan hesaplanan ana sayfa, haftalık hedefler ve A/B önerisi.
- İlk kurulumda 12 egzersiz, düzenlenebilir FULL BODY A/B ve kişisel tercihler. Sahte seans veya vücut ölçümü oluşturulmaz.
- Egzersiz arama/filtreleme, Türkçe yönergeler, özel egzersiz oluşturma/düzenleme/silme.
- Başlangıçtaki 12 hareket için **hazır çizimli önizlemeler**: kart ve detayda iki pozisyon, detayda oynat/durdur, antrenman içinde açılabilir rehber. Kullanıcı bağlantısı veya dosya yükleme gerekmez; uygulamayla birlikte çevrimdışı çalışır. Bunlar özgün şemalardır, gerçek video kaydı değildir. Mevcut veritabanlarında da otomatik görünür.
- Hazır/özel egzersiz detayında **Resim / video düzenle** ile HTTPS medya bağlantıları ekleme/kaldırma. Resimler detayda, doğrudan MP4/WebM/MOV videolar inline oynatıcıda; video sayfaları yeni sekmede açılır. Medya dosyaları offline önbelleğe alınmaz; bağlantılar JSON yedeğine dahildir.
- Program oluşturma, güncelleme, sıralama, set/tekrar/süre/dinlenme/not, kopyalama ve silme.
- Aktif seansı sürdürme, set kaydı, ek set, egzersiz atlama, dinlenme sayacı, bitirme/iptal ve geçmiş ayrıntıları.
- Ağırlık/bel/göğüs/kalça/kol kaydı, grafikler, haftalık tutarlılık ve egzersiz performansı.
- Düzenlenebilir profil/hedefler, sistem/açık/koyu tema, metrik birimler.
- Sürüm kontrollü JSON yedek, doğrulama, önizleme, açık onay ve transaction ile geri yükleme; CSV dışa aktarma.
- Mobil alt gezinme, masaüstü kenar çubuğu, iPhone safe-area, PWA manifest ve güncelleme bildirimi.

## Veri ve gizlilik

Tüm fitness verileri tarayıcıdaki `FitByM` IndexedDB veritabanındadır. Sunucuya gönderilmez, repoya yazılmaz. Cihazlar ve tarayıcılar birbirinden bağımsızdır. Tarayıcı temizliği, depolama baskısı veya cihaz kaybı kayıtları silebilir. **Düzenli JSON yedeği alın.** CSV tam yedek değildir.

Başlangıçtaki 90 kg bir profil tercihidir; yapılmış ölçüm olarak gösterilmez. Başlangıç değerleri tıbbi tavsiye değildir. Egzersiz medyası veya video adresi uydurulmamıştır.

Veri sıfırlama profil/hedefleri korur, fitness tablolarını boşaltır. İlk programlar tekrar başlatmada geri eklenmez. Geri yükleme tüm tabloları değiştirir; önce mevcut yedeğinizi indirin.

## GitHub Pages

Bkz. [dağıtım kılavuzu](docs/DEPLOYMENT.md). Vite base ve manifest scope `/FitByM/`; HashRouter sayesinde yenilemede sunucu yönlendirmesi gerekmez. Workflow `main` push ve manuel tetikleme ile kontrollerden sonra Pages'e dağıtır.

16 Kasım 2026'da [public GitHub deposu](https://github.com/code-by-m/FitByM) oluşturuldu ve ilk yayın tamamlandı. **Canlı uygulama: https://code-by-m.github.io/FitByM/**. HTTPS 200, JS/CSS/marka varlıkları, tüm rotalarda yenileme, manifest/ikonlar, service worker kapsamı ve IndexedDB başlangıcı gerçek Chromium üzerinden doğrulandı. Aynı izole oturumda offline yeniden açılış da geçti. [Başarılı dağıtım](https://github.com/code-by-m/FitByM/actions/runs/43858682938), uygulama commit'i: `24e5316`.

## iPhone kurulumu

Önce uygulamayı HTTPS üzerinden Safari'de açın. Paylaş → Ana Ekrana Ekle. İlk başarılı çevrimiçi açılış ve service worker kurulumu sonrasında uygulama kabuğu çevrimdışı açılır. Yeni sürüm bildirimi geldiğinde güncellemeyi seçin. iOS arka planda JavaScript'i durdurabilir; sayaçlar başlangıç/bitiş zamanları üzerinden yeniden hesaplanır. Gerçek iPhone üzerinde yükleme ve çevrimdışı testleri ayrıca yapılmalıdır.

## Mimari

- `src/features`: Ekranlar ve özelliklere ait formlar.
- `src/database/db.ts`: Tipli tablolar ve v1 şeması.
- `src/database/seed.ts`: Yalnızca ilk oluşturulmada çalışan tohum verileri.
- `src/database/repository.ts`: Doğrulama, ilişkiler ve transaction kullanan iş kuralları.
- `src/database/backup.ts`: Zod yedek şeması, ilişki kontrolleri, atomik içe aktarma.
- `src/types/models.ts`: Şemalar ve ortak tipler.
- `src/components`: Bildirimler, erişilebilir native dialog.

Yeni şema sürümleri Dexie `.version(2).stores(...).upgrade(...)` ile eklenmelidir; mevcut v1'i değiştirerek kullanıcı verisini kırmayın. Geçmiş kayıtları program/egzersiz silinse bile oturum snapshot'larından okunur. TanStack Query kullanılmadı; yerel Dexie live query bu sürüm için yeterli.

## Marka

Bkz. [marka incelemesi](docs/BRAND.md). Özgün CodeByM varlıkları kullanılır; CSS filtreleriyle yeniden renklendirilmez. FitByM metni ürün başlığıdır, yeni bir resmî CodeByM logosu değildir.

## Üretim QA — Faz 7

`npm run typecheck`, `npm run lint`, `npm test` (15 test), `npm run build`, `npm run verify:production` ve `npm run test:e2e` (4 Chromium senaryosu) başarıyla çalıştırıldı. Workflow ayrıca actionlint ile denetlendi. Tarayıcı testleri gerçek üretim çıktısı üzerinden veri kalıcılığı/restore, 7 ekranın 320/390/1440px açık-koyu görünümü, axe erişilebilirlik taraması, gerçek service worker ile offline reload ve onaylı sürüm güncellemesini kapsar.

Playwright hazırlığı (Windows):

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.playwright"
npm.cmd exec playwright -- install chromium
npm.cmd run build
npm.cmd run verify:production
npm.cmd run test:e2e
```

Chromium testleri ayrı sentetik bağlamlarda çalışır; gerçek kullanıcı kayıtlarını silmez. Aktif antrenman sırasında güncelleme ertelenir. Runtime dependency audit temiz; geliştirme/derleme araçlarında 12 dolaylı audit kaydı sürüyor.

Faz 8'de GitHub CLI kuruldu, `code-by-m` hesabı doğrulandı ve Pages, GitHub Actions/HTTPS ile yayına alındı. CI'da 15 test ve 4 Chromium senaryosu geçti; canlı site ayrıca doğrulandı. [Dağıtım adımları](docs/DEPLOYMENT.md), [ayrıntılı sonuçlar](docs/STATUS.md), [üretim kontrol listesi](docs/PRODUCTION_CHECKLIST.md), [fiziksel iPhone kabul listesi](docs/IPHONE_TESTING.md).

## Doğrulama sınırları

Birim testleri fake-indexeddb, uçtan uca testler gerçek Chromium IndexedDB/service worker kullanır. Canlı Pages üzerinde başlangıç, rotalar ve offline yeniden açılış doğrulandı; A→B güncelleme senaryosu CI'ın izole üretim provasında sınandı. Chromium mobil görünümü Safari veya fiziksel iPhone testi değildir. Fiziksel iPhone kurulum, VoiceOver, storage eviction ve standalone senaryoları ayrıca doğrulanmalıdır. Başarıyla çalıştırılan kontroller `docs/STATUS.md` içinde kaydedilir.
