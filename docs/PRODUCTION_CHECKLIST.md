# Üretime hazırlık kontrol listesi — Faz 7

Bu belge yerel otomasyon ile canlı/fiziksel cihaz doğrulamasını ayırır. Canlı yayın yapılmadan release kabulü tamamlanmış sayılmaz.

## Kaynak ve yapılandırma

- [x] Mevcut React/Dexie uygulaması korunarak incelendi; yeniden kurulmadı.
- [x] README, STATUS, DEPLOYMENT, paketler, Vite, workflow, IndexedDB ve yedek kodları okundu.
- [x] Vite base, manifest start_url/scope, SW registration scope: `/FitByM/`.
- [x] HashRouter; rota yenilemesi sunucuda ayrı alt yol istemiyor.
- [x] Özgün CodeByM artwork dosyaları değiştirilmedi; ikon boyutları denetleniyor.
- [x] iPhone viewport, apple-touch-icon, standalone, güvenli alanlar ve mobil 16px form alanları.
- [x] Build/deploy job'ları ayrıldı; Pages/OIDC yazma yetkisi yalnızca deploy job'unda.
- [x] main push ve manuel workflow_dispatch tetiklemesi.
- [x] Asset/PWA ve YAML sözleşme kontrolü `npm run verify:production` içinde.
- [ ] GitHub Actions runner'ında gerçek workflow çalışması (GitHub erişimi bekliyor).
- [x] actionlint 1.7.12 workflow kontrolü geçti; ShellCheck/Pyflakes alt kontrolleri bu ortamda yok.

## Veri koruma

- [x] IndexedDB adı ve v1 şeması aynı; migration/schema değişikliği yapılmadı.
- [x] Tohumlar sadece populate sırasında; her açılışta clear/delete/reset yok.
- [x] Yalnızca açık kullanıcı sıfırlaması veya onaylı yedek geri yüklemesi tabloları temizleyebilir.
- [x] Oturum snapshot'ları ve geçmiş kayıtları korunur.
- [x] Ek set numarası transaction içinde hesaplanır; bitmiş seans tekrar değiştirilemez.
- [x] Yedek şema/sürüm/ilişki kontrolü, önizleme ve açık onay.
- [x] Testler izole/sentetik veritabanı ve tarayıcı bağlamı kullanır; gerçek kullanıcı IndexedDB'sine erişmez.
- [ ] Fiziksel iPhone'da kalıcılık, düşük depolama ve uygulama geçişleri kabulü.

## UI ve erişilebilirlik

- [x] 7 ekran için 320/390/1440px ve açık/koyu tema Chromium taraması tanımlandı.
- [x] Yatay taşma ve axe WCAG A/AA kontrolleri otomatik sınanır.
- [x] HashRouter ile uyumlu İçeriğe geç; native dialog ve görünür odak.
- [x] Aktif antrenmanda PWA güncellemesi ertelenir; açık formları kaydetme uyarısı.
- [x] Sayaç interval yanında visibilitychange/focus ile eşitlenir.
- [ ] VoiceOver, büyük yazı, gerçek dokunma ve Safari klavyesi kabulü.

## PWA ve offline

- [x] Yerel üretim çıktısında gerçek Chromium service worker/cache testleri tanımlandı.
- [x] İlk online açılış → kontrol devralma → offline reload → lazy rota → set kaydı → backup akışı sınanır.
- [x] Bekleyen SW sürümü ve kullanıcı onaylı etkinleştirme testi; sonrasında veri karşılaştırması.
- [ ] Canlı HTTPS Pages üzerinde cache/scope ve ikinci offline açılış.
- [ ] Fiziksel iPhone ana ekrandan kurulum, offline yeniden başlatma ve A→B güncellemesi.

## Güvenlik ve bağımlılıklar

- [x] Token değerleri yazdırılmadı; frontend secret/backend/fake auth eklenmedi.
- [x] Üretim runtime denetimi ayrıca `npm audit --omit=dev` ile ayrılır.
- [x] Geliştirme/build zinciri: 12 audit kaydı (2 düşük, 10 orta). Birbirine bağlı araç paketleri sayılır; 12 ayrı kök açık anlamına gelmez.
- [x] Doğrudan paket sürümleri ve advisory kapsamları incelendi; kırıcı/otomatik force düzeltme uygulanmadı.
- [ ] Dolaylı glob/minimatch/deepmerge açıklarının uyumlu upstream düzeltmelerle giderilmesi.

Kaynaklar: [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). Bunlar build/lint girdilerini işleyen dolaylı paketlerdir; bu uygulamanın runtime paket denetiminde bulunmaz. Saldırgan kontrollü kaynak/config/pattern kabul eden build ortamları için önem taşırlar; güvenilir kaynakla çalışma ve job yetkilerini azaltma riski sınırlar, açığı yamalamaz. deepmerge için inceleme anında patched version listelenmiyor. glob düzeltmesi 14.0.2+, minimatch düzeltmesi 11.0.1+; mevcut bağımlılıkların major aralıkları dışındalar. Sırf audit sayısını düşürmek için üst paketi eski sürüme indirme veya major override yapılmadı.

## Yayın kapısı

- [ ] Doğru GitHub hesabı doğrulandı; repo varlığı/görünürlüğü/izinler authenticated kontrol edildi.
- [ ] Mevcut uzak geçmiş korunarak kaynak gönderildi.
- [ ] Pages source GitHub Actions; HTTPS ve environment izinleri hazır.
- [ ] Gerçek Actions run typecheck/lint/test/build/PWA/Chromium kontrolleri geçti.
- [ ] Gerçek page_url GET 200, tüm rotalarda yenileme ve statik assetler doğrulandı.
- [ ] [IPHONE_TESTING.md](IPHONE_TESTING.md) cihaz/sürüm/sonuç kaydıyla tamamlandı.

Kesin çalıştırma sonuçları ve bilinen engeller: [STATUS.md](STATUS.md). GitHub yetki adımları: [DEPLOYMENT.md](DEPLOYMENT.md).
