# Uygulama durumu — 16 Kasım 2026

## Son geliştirme — kalori ve beslenme takibi (17 Kasım 2026)

Beslenme ekranı ve mobil/masaüstü gezinme bağlantısı eklendi. Kullanıcı tarih/öğün, yemek adı, porsiyon açıklaması/adedi, bir porsiyonun kalorisi ve isteğe bağlı protein/karbonhidrat/yağ bilgisi girer. Kaloriler ve girilmiş makrolar porsiyonla çarpılır; günlük toplam, güncel hedef ve kalan/aşılan miktar gösterilir. Bilinmeyen makrolar eksik olarak belirtilir. Kayıt düzenleme/kopyalama/onaylı silme ve önceki/sonraki gün gezintisi vardır. Ana sayfa bugünkü kalori özetini gösterir; gece yarısı veya uygulamaya dönüşte gün yenilenir.

IndexedDB'nin yayımlanmış v1 tanımı değişmedi; v2 yalnızca boş `nutritionEntries` tablosunu ekler. Migration testi eski egzersiz/program/seans/set/ölçüm/profil/hedef verilerinin birebir korunmasını ve silinen tohumların geri gelmemesini doğruladı. Yeni yemekler seed edilmez. Besin değeri tahmini, gıda API'si, backend veya yeni dependency eklenmedi.

Yeni JSON yedekleri schemaVersion 2 ve yemek dizisini içerir. v1 yedekleri normalize edilerek kabul edilir; yemek içermeyen eski yedeğin mevcut yemek kayıtlarını sileceği, önizlemede açıkça yazılır. Tam restore yalnızca kullanıcı onayıyla tek transaction içindedir. Yeni yemek tablosuna yazma hatası enjekte edilen test, bütün tabloların rollback ile korunduğunu doğruladı. Eksik v2 yemek dizisi, desteklenmeyen sürüm ve geçersiz kayıtlar reddedilir.

Yerel typecheck, ESLint, üretim build/PWA doğrulaması başarılı. **33 test, 8 gerçek Chromium senaryosu geçti.** Beslenme CRUD, porsiyon toplamları, İstanbul'da gece yarısına yakın yerel gün, gün filtresi, dashboard özeti, v1 uyarısı/onaydan önce veri korunması, v2 backup/restore, offline yemek kaydı/reload, eksik makrolar ve axe/taşma denetimi kapsanır. Yeni ekran 320/390/1440px ve açık/koyu temalarda tarandı; mobil/masaüstü görüntüler incelendi. Fiziksel iPhone testi yapılmadı.

## Önceki geliştirme — sıralı antrenman ekranı (17 Kasım 2026)

Antrenman programındaki hareketler üstte numaralı bir sıralama üzerinden seçilir; aynı anda bir hareketin açık önizlemesi ve setleri gösterilir. Önizleme artık açılır bölümün arkasında değildir. Önceki/sonraki düğmeleri ve doğrudan hareket seçimi vardır. Bir hareketin tüm setleri tamamlandığında veya hareket atlandığında sıradaki tamamlanmamış harekete geçilir. Tamamlanan hareketler incelenebilir ve atlanan hareket geri eklenebilir.

Setler IndexedDB'ye kaydedildikten sonra güncel kayıtlardan ilerleme hesaplanır. Sayfa yenilendiğinde ilk tamamlanmamış hareket sürdürülür; setler, ağırlıklar, notlar ve dinlenme saati korunur. Şema/tohum değişikliği yoktur. Masaüstünde önizleme ve setler yan yana; telefonda önizleme üstte gösterilir. Hareket sıralaması oturum snapshot'ındaki sortOrder'dır.

Typecheck, lint, 24 test, üretim derlemesi ve PWA doğrulaması geçti. 7 Chromium senaryosuyla gezinme, görünür önizleme, otomatik geçiş, reload sonrası devam, tamamlanmış setlerin korunması ve atla/geri ekle kontrol edildi. Aktif ekranın koyu temada axe taraması ve mobil taşma kontrolü geçti; mobil/masaüstü ekran görüntüleri incelendi. Fiziksel iPhone testi yapılmadı.

## Önceki geliştirme — hazır hareket önizlemeleri (17 Kasım 2026)

Kullanıcının medya yüklemesi gerekmemesi için başlangıçtaki 12 egzersize özgün SVG şemaları eklendi. Egzersiz kartları başlangıç/hareket pozisyonlarını hazır gösterir; detayda iki pozisyon oynatılıp durdurulabilir. Antrenman ekranında açılabilir hareket rehberi vardır. Yüzüstü hareketler üstten görünüm olarak etiketlenir. Gösterimler şematiktir; gerçek video veya fotoğraf olarak sunulmaz.

Önizlemeler uygulama koduyla paketlenip PWA cache'ine alınır; harici medya adresi, hesap veya yükleme gerekmez. Kimlik/ad eşlemesi mevcut ilk egzersiz kayıtlarını da kapsar. IndexedDB şeması/tohumları değiştirilmedi; silinen kayıtlar tekrar eklenmez, mevcut kullanıcı medyası korunur. Özel egzersizlere yanlış bir hazır hareket atanmaz. Oynatma yalnızca açık kullanıcı eylemiyle başlar ve kapanışta timer temizlenir.

Yerel testlerde **24 test ve 6 Chromium senaryosu** geçti. Yeni testler 12 hareketin kapsanmasını, bilinmeyen kimliğin reddini, oynat/durdur kontrolünü, offline hazır önizlemeleri ve antrenman içindeki rehberi doğrular. Mobil ekran görüntüsü görsel olarak incelendi. Fiziksel iPhone testi yapılmadı.

## Önceki geliştirme — isteğe bağlı egzersiz medyası

Hazır ve özel egzersizlerde detay → **Resim / video düzenle** ile HTTPS resim/video bağlantıları eklenebilir veya kaldırılabilir. Resimler detayda gösterilir; doğrudan MP4/WebM/MOV dosyaları controls/playsinline ve preload=none ile oynatılır; diğer video sayfaları yeni sekmede açılır. Yükleme hataları için açıklama ve kaynak bağlantısı vardır. Harici medya offline cache'e alınmaz ve dosyaları yedeğe kopyalanmaz; yalnızca URL'ler mevcut JSON yedeğinde saklanır.

IndexedDB v1 şeması aynı kaldı; mevcut imageUrl/videoUrl alanları kullanılır. Hazır egzersizlerin yönerge ve kimlikleri değiştirilmeden medya güncellenir. HTTPS dışı ve kimlik bilgisi içeren yeni URL'ler reddedilir; eski yedeklerdeki geçersiz URL'ler renderer tarafından yüklenmez. Varsayılan egzersizlere doğrulanmamış medya eklenmedi.

Bu değişiklik için yerel typecheck, lint, build ve üretim doğrulaması başarılı; **21 test ve 5 gerçek Chromium senaryosu** geçti. Yeni browser testi medya formu, resim yükleme, video oynatıcı ayarları, yenileme sonrası kalıcılık ve harici video bağlantısını kapsar. Video codec/harici sağlayıcı erişimi cihaz ve kaynak tarafından belirlenir; fiziksel iPhone medya kabulü henüz yapılmadı.

## Faz 8 — ilk yayın doğrulandı

16 Kasım 2026'da GitHub CLI 2.104.0 kuruldu ve kullanıcı tarayıcı onayıyla `code-by-m` hesabı doğrulandı. Hesap yönetim/yazma yetkisine sahip. Authenticated sorguda bulunmayan `code-by-m/FitByM` public olarak oluşturuldu ve boş olduğu doğrulandı. Mevcut Git kimliği kullanıldı; kimlik uydurulmadı.

- İlk commit/push: `f31430b`; hazırlanmış 51 dosyada yasaklı artifact/backup yolu veya gizli anahtar örüntüsü bulunmadı. Uzak geçmiş yoktu; force push yapılmadı.
- İlk CI'da Linux axe taraması dekoratif hero yazısını düşük kontrast olarak işaretledi. Yalnızca dekoratif yazı aynı görünümle CSS pseudo-elementlerine taşındı; test kuralı kapatılmadı, resmî artwork ve işlevler değiştirilmedi.
- İlk yayın uygulama commit'i: `24e53160082c41836467c54fbfc17bb3125da1f0`.
- [Başarılı workflow](https://github.com/code-by-m/FitByM/actions/runs/43858682938): build ve deploy başarılı; typecheck/lint/build/PWA kontrolleri, 15 test ve 4 Chromium senaryosu geçti.
- Pages build_type `workflow`, HTTPS zorunlu; github-pages ortamı `main` dalına izin veriyor. Yazma/OIDC yetkileri yalnızca deploy job'unda.
- **Doğrulanmış canlı adres: https://code-by-m.github.io/FitByM/** — gerçek HTTPS GET 200.
- Canlı JS, CSS, CodeByM simgesi, manifest, SW ve apple-touch-icon GET 200; manifest scope/start_url `/FitByM/`, standalone, ikon PNG boyutları doğru.
- İzole Chromium oturumunda 7 ekran, hash rota yenilemeleri, dar ekran taşması ve logo yüklemesi kontrol edildi; JavaScript pageerror yok.
- Canlı SW `activated`, kapsam `https://code-by-m.github.io/FitByM/`. Yeni izole IndexedDB: 12 egzersiz, 2 program, 0 ölçüm ve 0 antrenman; sahte geçmiş oluşturulmadı.
- Canlı uygulamada offline reload ve program ekranının açılması geçti. Gerçek kullanıcı veritabanına dokunulmadı; kontrol ayrı geçici tarayıcı bağlamında yapıldı.

GitHub girişi Windows keyring'de saklanır; projeye token yazılmadı. Kısıtlı ortam keyring'e erişemediğinde 401 verdi; yetkili yürütme ortamında oturum doğrulandı. Git Schannel sorunu için yalnızca push komutlarında OpenSSL backend kullanıldı; TLS doğrulaması kapatılmadı.

Kalan işler: fiziksel iPhone/Safari kabulü ve bilinen 12 dolaylı dev/build audit kaydının upstream düzeltmelerle giderilmesi. Canlı sürümler arası A→B güncellemesi fiziksel cihazda henüz doğrulanmadı. Bu yayında IndexedDB v1 şeması değiştirilmedi.

Aşağıdaki Faz 7 bölümleri **yayından önceki tarihsel durumdur**; eski erişim engelleri Faz 8'de çözüldü.

## Faz 7 sonucu (yayından önce)

Mevcut MVP üzerinde üretime hazırlık, hata düzeltmeleri ve yerel gerçek tarayıcı doğrulaması tamamlandı. **GitHub Pages yayını yapılmadı.** Kimliği doğrulanmış GitHub erişimi ve fiziksel iPhone kabulü bekliyor. Beklenen adres doğrulanmış canlı URL olarak sunulmaz.

## GitHub incelemesi

- Çalışma klasöründe `.git` yok; Git status/remote sorguları “not a git repository” döndü.
- `gh` kurulu değil; CLI oturumu denetlenemiyor. GH_TOKEN/GITHUB_TOKEN bulunmuyor; token değerleri okunmadı/yazdırılmadı.
- GitHub bağlantısı için kullanılabilir eklenti bulundu ve önerildi; bağlantısı onaylanmadı.
- Anonim GitHub API: `users/code-by-m` 200; `repos/code-by-m/FitByM` 404.
- Beklenen Pages adresine gerçek GET: 404.
- Git Credential Manager helper mevcut, fakat etkileşimsiz git erişimi kimlik doğrulaması sağlayamadı. Varsayılan Schannel TLS isteği SEC_E_NO_CREDENTIALS ile başarısız oldu. Yalnızca o komutta OpenSSL backend kullanıldığında da credential manager erişimi tamamlanmadı; kullanıcı etkileşimi zorlanmadı ve kalıcı Git ayarı değiştirilmedi.
- 404'ün yok depo ile özel/izinsiz depo ayrımı authenticated erişim olmadan yapılamaz. Repo oluşturulmadı, commit/push yapılmadı, mevcut uzak geçmişe dokunulmadı.

Gerekli kullanıcı komutları ve mevcut depo geçmişini koruma adımları: [DEPLOYMENT.md](DEPLOYMENT.md).

## Düzeltilen gerçek sorunlar

- HashRouter rotasını bozan `#content` atlaması yerine ana içeriğe odak aktarımı.
- Dar ekran grid/input taşması için min-width; uzun kullanıcı metinleri için satır kırılması; mobil 16px alanlar ve safe-area üst/yatay boşlukları.
- Yeni set numarasının güncel kayıtlar üzerinden transaction içinde hesaplanması; eşzamanlı eklemelerde farklı numaralar.
- Set kimliğinin başka egzersize taşınmasının ve tamamlanmış seansın yeniden bitirilip/iptal edilmesinin engellenmesi.
- Mevcut verilerde bulunabilecek eski yinelenmiş set numaralarının düzenlenmesi engellenmez; yeni yinelenmiş numara oluşturulmaz.
- visibilitychange/focus sonrası zamanın anında yeniden hesaplanması.
- İlk SW kurulumunda clientsClaim ile açık sayfanın kontrol devralması; güncellemeler yine kullanıcı onayı bekler.
- Aktif seans sırasında güncelleme düğmesinin engellenmesi; başka sekmeden kontrolcü değişirse otomatik zorunlu reload yerine bildirim.
- Hızlı ardışık SW sürümlerinde plugin olay sınıflandırmasına bağımlı kalmadan controllerchange üzerinden kullanıcı onaylı reload.
- Safari dosya indirmesi için DOM'a bağlı geçici anchor ve geciktirilmiş object URL temizliği.
- Koyu temada güncelleme kutusu metin renginin tasarım tokenına bağlanması.
- Windows test kapanışı için önizleme sunucusunu doğrudan yöneten test komutu; ayrıntılı trace kaydı isteğe bağlıdır.

## Değişen / eklenen dosyalar

- `src/App.tsx`, `src/features/Workout.tsx`, `src/hooks/useClock.ts`.
- `src/database/repository.ts`, `src/database/backup.ts`, `src/styles/global.css`.
- `vite.config.ts`, `.github/workflows/deploy.yml` (build/deploy ayrımı ve minimum job izinleri).
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `.gitignore`, `.prettierignore`.
- `playwright.config.ts`, `e2e/production.spec.ts`, `scripts/verify-production.mjs`, `scripts/test-e2e.mjs`.
- `tests/database.test.ts`, `tests/clock.test.tsx`.
- README, STATUS, DEPLOYMENT; yeni IPHONE_TESTING ve PRODUCTION_CHECKLIST belgeleri.

CodeByM artwork dosyaları ve IndexedDB v1 şeması değiştirilmedi. Gerçek kullanıcı kaydı okunmadı/silinmedi. Otomatik testler ayrı sentetik veritabanları ve izole Chromium bağlamları kullanır.

## Gerçekte çalıştırılan son kontroller

| Kontrol                       | Sonuç                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`           | Başarılı; uygulama, testler, Playwright config ve e2e tip kontrolü                                              |
| `npm run lint`                | Başarılı; hata/uyarı yok                                                                                        |
| `npm test`                    | 3 dosya, **15 test geçti**                                                                                      |
| `npm run build`               | Başarılı; statik dist, manifest, SW ve 25 precache girdisi                                                      |
| `npm run verify:production`   | Asset yolları, ikon PNG boyutları, manifest scope/start_url/standalone, SW girdileri ve YAML sözleşmeleri geçti |
| `npm run test:e2e`            | Gerçek Chromium üzerinde **4 senaryo geçti**                                                                    |
| actionlint 1.7.12             | Workflow hatasız; ShellCheck/Pyflakes mevcut olmadığından bu alt kontroller kapalı                              |
| `npm audit --omit=dev --json` | **0** runtime bulgusu                                                                                           |
| `npm audit --json`            | **12** dev/build kaydı: 2 düşük, 10 orta; yüksek/kritik yok                                                     |

İlk tarayıcı turunda bir locator eşlemesi düzeltildi. Sonraki turlarda ilk sayfanın SW kontrolüne alınması ve hızlı sürüm aktivasyonu sorunları yakalanıp uygulamada düzeltildi. Nihai başarı bu düzeltmelerden sonraki testlere aittir.

### 15 testin kapsadığı veri koruması

İlk kurulum, silinen tohumların tekrar oluşmaması, özel egzersiz CRUD, program kaydı/güncelleme ve bozuk ilişkide rollback, snapshot'lar, aktif seans/set kalıcılığı, geçmiş, ölçüm/hedef güncelleme, şema/sürüm/ilişki doğrulama, JSON restore, eşzamanlı set ekleme ve bitmiş seansın değişmezliği. Yeni bağlantıyla aynı v1 veritabanını açıp tüm kayıtları karşılaştıran test vardır; migration gerektiren şema değişikliği yapılmadı. Sayaç testi arka plan dönüşü olaylarını ve dinleyici temizliğini sınar.

### 4 tarayıcı senaryosu

1. UI üzerinden özel egzersiz ve program → iki set → gerçek page reload → aktif seansı sürdürme → bitirme/özet → ölçüm → reload → JSON export → geçersiz sürüm reddi → önizleme/onaylı restore → tüm 9 tabloyu karşılaştırma.
2. 7 ekran × 320/390/1440px × açık/koyu tema: yatay taşma denetimi; 390px'te axe WCAG A/AA taraması; hash rotası yenileme ve İçeriğe geç odağı. Tarama kapsamındaki sayfalarda ihlal bulunmadı; tam WCAG sertifikası değildir. 390px ana sayfa ekran görüntüsü ayrıca görsel olarak incelendi.
3. İlk online yükleme ve gerçek SW scope/kontrol → Chromium context offline → reload → önceden açılmamış lazy rota → offline set kaydı → reload → offline JSON export.
4. Sentetik yeni SW sürümü → aktif antrenmanda Güncelle devre dışı → bitirme → açık onaylı aktivasyon/reload → geçmiş ve setlerin korunması. Test geçici dist/sw.js yorumunu finally ile geri alır.

## Bağımlılık değerlendirmesi

Raporlanan kayıtlar dolaylı minimatch/glob/deepmerge üzerinden lint/PWA build zincirindedir. Browser uygulamasının runtime audit'i temizdir; bu durum build zincirindeki açıkları ortadan kaldırmaz. Doğrudan sürümler npm registry'den, advisory kapsamları resmî GitHub advisory sayfalarından kontrol edildi. Uyumlu sürüm aralıkları içinde tümünü düzelten bir güncelleme bulunmadı; `audit fix --force`, major override veya eski üst sürüme dönüş uygulanmadı. Ayrıntı ve kaynaklar: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).

## Doğrulanmayanlar / sonraki adımlar

- Authenticated GitHub repo görünürlüğü, sahiplik/izinler, Pages ayarı ve gerçek Actions çalışması.
- Canlı Pages HTTPS yanıtı, ağ/cache başlıkları ve canlı A→B güncellemesi.
- Fiziksel iPhone/Safari kurulumu, VoiceOver, klavye, ekran kilidi, iOS storage eviction ve standalone davranışı.
- Chromium mobil viewport testi iPhone veya Safari motor testi değildir. Otomatik axe taraması manuel erişilebilirlik kabulünün yerine geçmez.
- İlk sürüm metrik birimlerle sınırlı; cloud sync veya beslenme kaydı yok.

Sonraki adım: GitHub erişimini aç, uzak geçmişi koruyarak kaynak gönder, Pages workflow'unu çalıştır; gerçek URL'yi doğrula ve [iPhone kabul listesini](IPHONE_TESTING.md) fiziksel cihaz/sürüm kaydıyla tamamla.
