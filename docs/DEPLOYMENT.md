# GitHub Pages dağıtımı — Faz 7

## Mevcut erişim durumu

16 Kasım 2026 kontrolü: Bu klasör Git deposu değil; `git remote -v` çalışmıyor. `gh` komutu kurulu değil. GH_TOKEN/GITHUB_TOKEN ortam değişkenleri yok; değerleri okunmadı veya yazdırılmadı. GitHub eklentisi henüz bağlı değil.

Anonim istekler: `api.github.com/users/code-by-m` → 200; `api.github.com/repos/code-by-m/FitByM` → 404; beklenen Pages adresi → 404. Hesap adı mevcut. Kimlik doğrulaması olmadan deponun yokluğu ile özel/erişilemeyen depo ayrıştırılamaz. Kaynak gönderilmedi, depo oluşturulmadı ve yayın yapılmadı.

## GitHub erişimini açma (kullanıcı işlemi gerekli)

GitHub eklentisini kurup hesabınızı bağlayabilir veya aşağıdaki CLI yolunu kullanabilirsiniz. Tokenı sohbete ya da dosyaya yazmayın; web girişini kullanın.

Windows PowerShell:

```powershell
winget install --id GitHub.cli --exact --source winget
```

Yeni terminal açın:

```powershell
gh auth login --hostname github.com --git-protocol https --web
gh auth status
gh api user --jq .login
gh repo view code-by-m/FitByM --json nameWithOwner,isPrivate,defaultBranchRef,url
```

`code-by-m` hesabı veya o hesap adına depo oluşturma/yazma/Pages yönetim yetkisi gerekir. Authenticated 404 de tek başına deponun olmadığına kanıt değildir: hesap sahibinin GitHub arayüzünden de doğrulaması gerekir. Özel bir depo bulunursa görünürlüğünü otomatik değiştirmeyin; public yapmak için ayrıca değerlendirin. Bu çalışma mevcut özel bir deponun görünürlüğünü değiştirmedi.

## Yalnızca yeni/boş depo için ilk gönderim

GitHub'da deponun bulunmadığı doğrulandıysa public ve **boş** depo oluşturun (otomatik README/.gitignore eklemeyin):

```powershell
gh repo create code-by-m/FitByM --public
```

Klasör hâlâ Git deposu değilse ve uzak depo tamamen boşsa:

```powershell
Set-Location D:\synchronize\FitByM
git init -b main
git add .
git status --short
git diff --cached --stat
git commit -m "Prepare FitByM production deployment"
git remote add origin https://github.com/code-by-m/FitByM.git
git push -u origin main
```

Commit kimliğiniz yapılandırılmamışsa kendi GitHub commit adınızı ve GitHub Settings → Emails'te gösterilen adresinizi yerel Git ayarlarına girin. Uydurma e-posta kullanmayın. Commit öncesi listede node_modules, .npm-cache, .playwright, test-results, gerçek JSON yedekleri veya gizli bilgiler olmadığını doğrulayın; `.gitignore` bunları dışlar.

**Uzak depoda geçmiş varsa bu ilk gönderim adımlarını kullanmayın.** Depoyu farklı bir klasöre clone edin, mevcut dal/geçmişi inceleyin ve bu projenin kaynak değişikliklerini o checkout'ta birleştirin. Mevcut geçmiş silinmez, force push yapılmaz. Yalnızca kaynak ve yapılandırmayı aktarın; kullanıcı verisi, node_modules, dist, browser/cache/test artifact klasörlerini taşımayın.

## Pages'i etkinleştirme

GitHub arayüzünde: repository → Settings → Pages → Build and deployment → Source → **GitHub Actions**. Settings → Actions → General'da Actions'a izin verin; organization/environment onay gereksinimlerini kontrol edin.

CLI alternatifi, gerekli Pages yönetim izniyle:

```powershell
gh api repos/code-by-m/FitByM/pages --jq '{url: .html_url, build_type: .build_type, https_enforced: .https_enforced}'
```

Pages henüz oluşturulmamışsa:

```powershell
gh api --method POST repos/code-by-m/FitByM/pages -f build_type=workflow
```

Pages zaten varsa ve kaynak yöntemi farklıysa, yalnızca mevcut ayarı inceledikten sonra:

```powershell
gh api --method PUT repos/code-by-m/FitByM/pages -f build_type=workflow
```

Workflow ana dal `main` push'unda veya manuel başlar. İlk push Pages etkinleştirilmeden yapıldıysa yeniden çalıştırın:

```powershell
gh workflow run deploy.yml --repo code-by-m/FitByM --ref main
gh run list --repo code-by-m/FitByM --workflow deploy.yml --limit 5
gh run watch RUN_ID --repo code-by-m/FitByM --exit-status
```

RUN_ID'yi gerçek run numarasıyla değiştirin. Workflow build job'unda yalnızca `contents: read`; deploy job'unda `pages: write` ve `id-token: write` kullanır. Typecheck, ESLint, unit test, build, statik PWA/workflow doğrulaması ve Chromium testleri geçmeden artifact yüklenmez. GitHub environment koruması varsa sahibi GitHub üzerinden onaylar.

## Canlı yayını doğrulama

Başarılı Actions sonucu tek başına yeterli değildir. Settings → Pages ve deploy job `page_url` çıktısını karşılaştırın. Beklenen adres `https://code-by-m.github.io/FitByM/`; **henüz doğrulanmış canlı adres değildir**.

- Gerçek HTTPS adresine GET → 200; başlık FitByM; konsolda yükleme hatası yok.
- `/FitByM/#/programlar`, `#/antrenman`, `#/gelisim`, `#/ayarlar`, `#/egzersizler`, `#/gecmis` açılıyor ve yenileniyor. Hash sonrası bölüm sunucuya gönderilmez; Pages'te özel yönlendirme gerekmez.
- Manifest start_url/scope `/FitByM/`, display standalone; apple-touch-icon ve 192/512 PNG'ler 200.
- Service worker script `/FitByM/sw.js`, scope `/FitByM/`; site dışı yolları kontrol etmiyor.
- İkinci offline açılış, ölçüm/set kaydı, JSON indirme; sürüm A→B güncellemesinde veriler korunuyor.
- [iPhone kabul listesi](IPHONE_TESTING.md) fiziksel cihazda yürütülüyor.

Vite `base`, PWA `scope` ve manifest yolları `/FitByM/` ile sabittir. Depo adı/özel domain değişirse yolları birlikte değiştirin. Domain değişikliği farklı origin demektir; yerel kayıtları taşımak için önce JSON yedeği alın.

## Yerel üretim provası

```powershell
npm.cmd ci
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.playwright"
npm.cmd exec playwright -- install chromium
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run verify:production
npm.cmd run test:e2e
```

Browser testleri gerçek `dist/` üzerinden geçici Vite preview sunucusu açar; canlı siteye veya gerçek kullanıcı kayıtlarına erişmez. `scripts/test-e2e.mjs` kendi sunucusunu doğrudan açıp kapatır; port 4173 doluysa başka sunucuya bağlanmak yerine hata verir. Güncelleme testi `dist/sw.js` dosyasına geçici sentetik sürüm yorumu ekler ve `finally` ile geri alır; kaynak/service worker yapılandırması veya kullanıcı IndexedDB'si silinmez. `test-results/` sadece sentetik test bağlamlarının artifact'larını içerir ve Git'ten dışlanır. Hata ekran görüntüsü otomatik alınır; ayrıntılı trace için testten önce `$env:FITBYM_TRACE = '1'` ayarlanabilir. Varsayılan trace kapalıdır.

`verify:production` PNG boyutları, asset dosyaları, SW precache yolları ve workflow YAML/temel sözleşmelerini kontrol eder. GitHub tarafındaki izinleri/environment ayarlarını veya Actions yürütmesini taklit etmez. Faz 7'de resmî actionlint 1.7.12 Windows release'i proje önbelleğine indirilip ayrıca çalıştırıldı; workflow hatasız. ShellCheck/Pyflakes bu ortamda olmadığından actionlint'in bu alt kontrolleri kapatıldı.
