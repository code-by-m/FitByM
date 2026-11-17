# iPhone ve Safari kabul testi

Bu liste fiziksel cihazda henüz yürütülmedi. Chromium'daki mobil ekran testleri Safari/iOS testi değildir.

## Test kaydı

- Cihaz modeli / iOS sürümü:
- Safari sürümü:
- Canlı adres (yalnızca doğrulandıktan sonra):
- Test tarihi / test eden:
- Test edilen Git commit / Actions run:
- Sonuç / ekran görüntüsü / hata kaydı:

Güncel Safari önerilir; Tailwind 4 için Safari 16.4 ve üzeri hedeflenir. Safari sekmesi ve Ana Ekran uygulaması ayrı test edilmelidir. Kayıtlar, aynı cihazda bile farklı tarayıcı/kurulum depolama bağlamlarında değişebilir. Başlamadan önce mevcut gerçek verileri JSON olarak yedekleyin. Veri silme ve geri yükleme testlerini yalnızca sentetik test kayıtlarıyla yapın.

## Kurulum ve görünüm

- [ ] HTTPS adresi sertifika uyarısı olmadan açılıyor.
- [ ] Safari → Paylaş → Ana Ekrana Ekle: FitByM adı ve bozulmamış CodeByM simgesi görünüyor.
- [ ] Ana ekrandan açılış standalone; gezinme ve geri dönüş çalışıyor.
- [ ] Küçük ekran, çentikli ekran, dikey/yatay yönler: üst başlık, güvenli alan ve alt gezinme kesilmiyor.
- [ ] Tüm 8 ekran: Ana Sayfa, Egzersizler, Programlar, Antrenman, Geçmiş, Gelişim, Beslenme, Ayarlar açılıyor.
- [ ] Uzun egzersiz/program adları taşıp yatay kaydırma oluşturmuyor.
- [ ] Açık/koyu/sistem temalarında yazılar, grafikler ve düğmeler okunuyor; resmî simge özgün renklerini koruyor.
- [ ] Klavye açıldığında form alanına erişilebiliyor; sayısal alanlar otomatik sayfa yakınlaştırması oluşturmuyor.
- [ ] Modallar ekrana sığıyor, kaydırılıyor ve Kapat ile kapanıyor.
- [ ] VoiceOver ile alan etiketleri, düğmeler ve odak sırası anlaşılır; modal odağı dışarı kaçmıyor.
- [ ] Harici klavyede Tab, Enter, Escape ve İçeriğe geç bağlantısı çalışıyor.
- [ ] Dokunma hedefleri rahat; hareket azaltma ayarında gereksiz animasyon yok.

## Veri akışı (Safari ve standalone için ayrı tekrar)

- [ ] Özel egzersiz oluştur, düzenle; arama ve filtrelerde bul.
- [ ] Program oluştur; egzersiz ekle/çıkar/sırala, hedef ve dinlenmeyi düzenle.
- [ ] Programı başlat, iki setin gerçek tekrar/süre/ağırlığını kaydet.
- [ ] Safari sayfasını yenile; aktif seans ve tamamlanan setler aynı.
- [ ] Ana ekrana dön, başka uygulamaya geç, ekranı 2 dakika kilitle; geri dönünce geçen süre/dinlenme hemen gerçek zamana göre doğru.
- [ ] Offline durumda bir set daha kaydet; uygulamayı kapatıp aç ve seansı sürdür.
- [ ] Seansı bitir; özette setler, süre ve notlar doğru. Programı değiştir/sil; geçmiş snapshot'ı değişmiyor.
- [ ] Ağırlık, bel ve göğüs kaydet; yeniden açınca ölçümler ve grafikler doğru.
- [ ] Negatif/boş/geçersiz formlar kaydedilmiyor ve anlaşılır hata gösteriliyor.
- [ ] Program/ölçüm silmede İptal seçeneği veriyi koruyor.

## Yedek ve geri yükleme

- [ ] Güncellemeden sonra eski antrenmanlar/ölçümler/hedefler korunuyor; Beslenme boş kayıtlarla açılıyor.
- [ ] Yemek ekle: 2 porsiyon × 200 kcal = 400 kcal; isteğe bağlı makrolar doğru hesaplanıyor.
- [ ] Yemek düzenleme/kopyalama/silme, tarih değiştirme, gece yarısında Bugün ve ana sayfa özeti doğru.
- [ ] Uçak modunda yemek kaydet, yenile; kayıt ve toplam korunuyor.
- [ ] v2 JSON yedeği yemekleri içeriyor; eski v1 yedeği seçilince yemek kaydı bulunmadığı/silineceği açıkça belirtiliyor. Önizlemeyi iptal etmek kayıtları değiştirmiyor.

- [ ] Ayarlar → JSON yedek indir → Dosyalar'a kaydet; dosya okunabiliyor.
- [ ] Ölçüm ve geçmiş CSV indirme çalışıyor; Türkçe karakterler doğru.
- [ ] Geçersiz JSON/uyumsuz sürüm yükle: hata var, mevcut veriler aynı.
- [ ] Geçerli yedek seç: tarih ve kayıt sayıları gösteriliyor; onay verilmeden kayıtlar değişmiyor.
- [ ] Önizlemeyi kapat: kayıtlar aynı. Tekrar aç ve açık onay ver: tüm kayıtlar/ilişkiler geri geliyor.
- [ ] Offline durumda JSON yedeği dışa aktarılabiliyor ve Dosyalar'a kaydediliyor.

## Offline ve güncelleme

- [ ] İlk açılışı çevrimiçi yap; service worker kurulumu/cache tamamlandıktan sonra uçak modunu aç.
- [ ] Safari ve ana ekran uygulamasını yeniden aç; tüm ekranlar ve grafik modülü yükleniyor.
- [ ] İlk kez hiç açılmamış bir cihazın offline açılışı beklenmez; bunu hata olarak raporlama.
- [ ] Uçak modunda ölçüm/set kaydet, yenile, geçmişi aç ve JSON indir.
- [ ] A sürümü açıkken B sürümünü dağıt. Uygulamaya dönünce yeni sürüm bildirimi geliyor.
- [ ] Aktif antrenman varken Güncelle devre dışı; setleri kaydet ve seansı bitir.
- [ ] Açık formları kaydet; Güncelle'yi seç. Yeni sürüm açılıyor; gerçek kayıtlar ve yedek aynı.
- [ ] Güncelleme sırasında internet kesilirse eski çalışan sürüm ve veriler korunuyor; yeniden çevrimiçi dene.

## Depolama sınırları

- [ ] Tarayıcı depolama izni reddedildiğinde açıklayıcı hata gösteriliyor.
- [ ] Özel gezinmede kalıcılığın garanti olmadığı kullanıcıya anlatılıyor.
- [ ] iOS depolama tahliyesi/cihaz kaybı/tarayıcı temizliğinin veriyi silebileceği ve düzenli yedek gereği doğrulandı.

Kabul: Başarısız adımlar düzeltilmeden gerçek iPhone kabulü tamamlandı olarak işaretlenmez. Model/iOS/sürüm kaydı olmayan test fiziksel cihaz kanıtı sayılmaz.
