<div align="center">
  <picture>
    <source srcset=".github/assets/nolio-logo-white.png" media="(prefers-color-scheme: dark)">
    <source srcset=".github/assets/nolio-logo-black.png" media="(prefers-color-scheme: light)">
    <img src=".github/assets/nolio-logo-black.png" alt="Nolio" width="100" height="100">
  </picture>

  <h1>Nolio</h1>
  <p>Şifreli, yerel-öncelikli not uygulaması</p>

  [![CI](https://github.com/metesahankurt/nolio/actions/workflows/ci.yml/badge.svg)](https://github.com/metesahankurt/nolio/actions/workflows/ci.yml)
  [![Release](https://github.com/metesahankurt/nolio/actions/workflows/release.yml/badge.svg)](https://github.com/metesahankurt/nolio/actions/workflows/release.yml)
  [![Version](https://img.shields.io/github/v/release/metesahankurt/nolio?label=Version&color=orange)](https://github.com/metesahankurt/nolio/releases/latest)
  [![License](https://img.shields.io/github/license/metesahankurt/nolio?color=blue)](LICENSE)
</div>

---

Nolio, notlarını cihazında şifreli biçimde saklar. Bulut yoktur, üçüncü taraf sunucu yoktur. Tüm veriler cihazında kalır. Web tarayıcısından, macOS / Windows / Linux masaüstünden ve Android'den çalışır; tek bir kod tabanıyla.

## Özellikler

- **Şifreli not kasası** — AES-256 tabanlı şifreleme, ana parola ile korunur
- **Zengin metin editörü** — BlockNote tabanlı, başlık / madde / alıntı desteği
- **Web depolama** — IndexedDB üzerinden tarayıcıda çalışır
- **Masaüstü depolama** — Şifreli SQLite kayıtları (Tauri + Rust)
- **Yedekleme / geri yükleme** — JSON dosyasına dışa aktar, içe aktar
- **Parola değişikliği** — Kasayı yeniden şifreler, verileri korur
- **Otomatik kilit** — Belirlenen süre sonra ekranı kilitler
- **Çoklu dil** — 10 dil desteği (TR, EN, DE, FR, ES, IT, PT, RU, JA, ZH)
- **PWA** — Tarayıcıdan ana ekrana yüklenebilir

## Proje yapısı

```
apps/
  web/        Next.js web uygulaması (SSR + PWA)
  native/     Tauri masaüstü ve mobil uygulama

packages/
  core/       Not sistemi, şifreleme, mağaza, sayfa bileşenleri
  ui/         Paylaşılan UI bileşenleri ve stiller (shadcn/ui + Tailwind v4)
  i18n/       Çeviri mesajları (next-intl, 10 dil)
  cli/        npm create catalyzer — proje şablon oluşturucu
```

## Geliştirme ortamı

**Gereksinimler:** Node.js ≥ 20, pnpm ≥ 10, Rust stable (yalnızca masaüstü/mobil için)

```bash
# Bağımlılıkları kur
pnpm install

# Web uygulamasını başlat (http://localhost:3000)
pnpm web dev

# Masaüstü uygulamasını başlat
pnpm tauri dev

# Android
pnpm tauri android dev

# Kalite kontrolleri (CI'da da çalışır)
pnpm check        # Biome lint + format
pnpm typecheck    # TypeScript derleme kontrolü
pnpm build        # Tam üretim derlemesi
```

---

## 🚀 Sürüm yayınlama ve uygulama derleme rehberi

Bu proje **Release Please** + **GitHub Actions** ile tamamen otomatik sürüm yönetimi kullanır. Aşağıdaki adımları izleyerek bir sürüm yayınlayabilir ve masaüstü / Android uygulamalarını derleyebilirsin.

---

### Adım 1 — GitHub repo ayarlarını yapılandır

Bir kez yapılması gereken kurulum:

1. **Actions izinleri**
   `Settings → Actions → General → Workflow permissions` altında **"Read and write permissions"** seçeneğini etkinleştir ve **"Allow GitHub Actions to create and approve pull requests"** kutusunu işaretle.

2. **Birleştirme stratejisi**
   `Settings → General → Pull Requests` altında yalnızca **Squash merging** seçeneğini etkin bırak ve "Default commit message" olarak **"Pull request title and description"** seç.

3. *(İsteğe bağlı)* Eğer bot PR'larının CI'ı tetiklemesini istiyorsan kişisel `RELEASE_PLEASE_TOKEN` secret'ı ekle:
   `Settings → Secrets and variables → Actions → New repository secret`
   - Name: `RELEASE_PLEASE_TOKEN`
   - Value: `repo` ve `workflow` kapsamlı bir GitHub PAT

---

### Adım 2 — Conventional Commits ile commit at

Release Please, commit mesajlarını okuyarak otomatik olarak sürüm numarası belirler. Commit mesajlarını şu kurala göre yaz:

| Prefix | Ne yapar | Sürüm etkisi |
|--------|----------|--------------|
| `feat:` | Yeni özellik | **minor** ↑ (1.0.0 → 1.1.0) |
| `fix:` | Hata düzeltmesi | **patch** ↑ (1.0.0 → 1.0.1) |
| `feat!:` veya `BREAKING CHANGE:` | Kırıcı değişiklik | **major** ↑ (1.0.0 → 2.0.0) |
| `docs:` `style:` `chore:` `ci:` | Altyapı değişikliği | sürümde görünmez |

**Örnek commit'ler:**

```bash
git commit -m "feat: not başlıklarına emoji desteği eklendi"
git commit -m "fix: kilit ekranı karanlık modda görünmüyor"
git commit -m "docs: kurulum adımları güncellendi"
```

---

### Adım 3 — master'a push et → Release PR otomatik açılır

`master` branch'ine her push sonrası **Release** workflow'u otomatik çalışır:

```
master'a push
    └─▶ release.yml çalışır
            └─▶ Release Please, commit geçmişini analiz eder
                    └─▶ "chore: release vX.Y.Z" başlıklı bir PR açar
```

Bu PR'ı `https://github.com/metesahankurt/nolio/pulls` adresinde görebilirsin. PR açıklamasında hangi commit'lerin dahil olduğu ve yeni sürüm numarası yazar.

---

### Adım 4 — Release PR'ını merge et → Tag + Release otomatik oluşur

Release PR'ını **squash merge** ile birleştir. Bunun ardından:

```
Release PR merge edilir
    └─▶ release.yml tekrar çalışır
            ├─▶ GitHub Release oluşturulur (vX.Y.Z tag'i)
            └─▶ build-desktop.yml tetiklenir (otomatik)
                    ├─▶ macOS .dmg (arm64 + x86_64)
                    ├─▶ Windows .exe + .msi
                    └─▶ Linux .deb + .rpm + .AppImage
```

Masaüstü kurulum dosyaları otomatik olarak release sayfasına eklenir:
`https://github.com/metesahankurt/nolio/releases`

---

### Adım 5 — Android APK derlemek (isteğe bağlı, manuel)

Android derlemesi otomatik çalışmaz; manuel olarak tetiklemek gerekir.

**`Actions → Build Apps → Run workflow`** yolunu izle:

1. `tag_name` alanına derlemek istediğin sürüm etiketini yaz (örn. `v1.2.0`)
2. Hangi platformları derlemek istediğini seç:
   - ✅ Build Windows
   - ✅ Build macOS
   - ✅ Build Linux
   - ✅ Build per-ABI split APKs (arm64, arm, x86, x86_64)
   - ✅ Build universal APK + AAB
3. **Run workflow** butonuna tıkla

APK'lar imzalı biçimde oluşturulur (keystore secret'ları tanımlıysa). Secret yoksa debug modunda derlenir.

**Android imzalama secret'ları** (Play Store için gerekli):

| Secret adı | Açıklama |
|------------|----------|
| `BASE64_JKS` | `.jks` keystore dosyasının base64 kodlanmış hali |
| `STORE_FILE` | Keystore dosya yolu (örn. `~/keystore.jks`) |
| `STORE_PASSWORD` | Keystore parolası |
| `KEY_ALIAS` | Key alias adı |
| `KEY_PASSWORD` | Key parolası |

> Keystore'u base64'e dönüştürmek için: `base64 -i keystore.jks | pbcopy`

---

### Workflow özeti

| Workflow | Ne zaman çalışır | Ne yapar |
|----------|-----------------|----------|
| `ci.yml` | Her PR'da | Lint + typecheck + build doğrular |
| `release.yml` | Her master push'unda | Release PR açar veya tag + release oluşturur |
| `build-desktop.yml` | Release oluşunca (otomatik) | macOS / Windows / Linux binary derler |
| `build-apps.yml` | Manuel (workflow_dispatch) | Seçilen platformlar için tüm binary'leri derler |
| `build-split-apk.yml` | build-apps üzerinden | Per-ABI Android APK derler |
| `build-universal-apk.yml` | build-apps üzerinden | Universal APK + AAB derler |

---

## Repository

GitHub: <https://github.com/metesahankurt/nolio>
