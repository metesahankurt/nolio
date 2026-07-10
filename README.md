<div align="center">
  <picture>
    <source srcset=".github/assets/nolio-logo-white.png" media="(prefers-color-scheme: dark)">
    <source srcset=".github/assets/nolio-logo-black.png" media="(prefers-color-scheme: light)">
    <img src=".github/assets/nolio-logo-black.png" alt="Nolio" width="100" height="100">
  </picture>

  <h1>Nolio</h1>
  <p><strong>Encrypted, local-first notes — your data never leaves your device.</strong><br>
  <em>Şifreli, yerel-öncelikli notlar — verileriniz cihazınızdan asla çıkmaz.</em></p>

  [![CI](https://github.com/metesahankurt/nolio/actions/workflows/ci.yml/badge.svg)](https://github.com/metesahankurt/nolio/actions/workflows/ci.yml)
  [![Release](https://github.com/metesahankurt/nolio/actions/workflows/release.yml/badge.svg)](https://github.com/metesahankurt/nolio/actions/workflows/release.yml)
  [![Version](https://img.shields.io/github/v/release/metesahankurt/nolio?label=Version&color=orange)](https://github.com/metesahankurt/nolio/releases/latest)
  [![License](https://img.shields.io/github/license/metesahankurt/nolio?color=blue)](LICENSE)

  <p>
    <a href="#english">🇬🇧 English</a> ·
    <a href="#türkçe">🇹🇷 Türkçe</a> ·
    <a href="https://github.com/metesahankurt/nolio/releases/latest">⬇️ Download / İndir</a>
  </p>
</div>

---

# English

Nolio stores your notes encrypted on your device. No cloud, no third-party servers, no telemetry — everything stays local. It runs in the browser, on the desktop (macOS / Windows / Linux) and on Android, all from a single codebase.

## Features

### Writing
- **Rich text editor** — Plate-based, Notion-style editing with headings, lists, task lists, quotes, code blocks, callouts, tables, images and links
- **Slash commands** — type `/` to insert any block without leaving the keyboard
- **Markdown paste** — pasted Markdown is converted into rich blocks automatically

### Organization
- **Nested pages** — organize notes as a tree with unlimited subpages
- **Favorites, Recent & All Notes views** — quick access from the sidebar
- **Trash with undo** — deleting shows an undo toast; the Trash view supports restore and permanent delete; All Notes supports multi-select bulk delete
- **Command palette** — `Cmd/Ctrl + K` for instant search and navigation

### Sticky note widgets (desktop)
- **Floating widget windows** — create a sticky note from the sidebar; it opens in its own frameless, freely resizable window (with a sensible minimum size) that can be pinned on top of everything
- **Fully integrated** — widgets are regular vault notes with the full editor and slash commands; the vault key never leaves the main window, and widgets close automatically when the vault locks

### Security
- **Encrypted vault** — AES-256-GCM per-note encryption; keys derived with Argon2id (OWASP baseline, with a 600k-iteration PBKDF2 fallback)
- **Master password** — nothing is recoverable without it; there is deliberately no password reset
- **Auto-lock** — the vault locks itself after a configurable idle period (`Cmd/Ctrl + Shift + L` locks instantly)
- **Password change** — re-wraps the vault key in place without touching note ciphertexts
- **Encrypted backups** — export the vault (ciphertext only) to a location you choose via native save dialogs; importing asks for the backup's master password, verifies it before anything is written, and unlocks the restored vault in place

### Platform
- **Desktop app** — Tauri 2 + Rust with encrypted SQLite storage, frameless window with custom chrome, in-app auto-updater styled with the app's own design system
- **Web app** — Next.js PWA with IndexedDB storage, installable to the home screen
- **Android** — built from the same codebase
- **10 languages** — EN, TR, DE, FR, ES, IT, PT, RU, JA, ZH

## Download

Grab the latest installers from the [releases page](https://github.com/metesahankurt/nolio/releases/latest):

| Platform | Files |
|----------|-------|
| Windows | `Nolio_x.y.z_x64-setup.exe`, `.msi` |
| macOS (Apple Silicon) | `Nolio_x.y.z_aarch64.dmg` |
| macOS (Intel) | `Nolio_x.y.z_x64.dmg` |
| Linux | `.AppImage`, `.deb`, `.rpm` |

The desktop app checks for updates on launch and installs them through an in-app dialog.

## Project structure

```
apps/
  web/        Next.js web app (SSR + PWA)
  native/     Tauri desktop & mobile app

packages/
  core/       Notes domain: crypto, stores, editors, page components
  ui/         Shared UI components & styles (shadcn/ui + Tailwind v4)
  i18n/       Translation messages (next-intl, 10 languages)
  cli/        npm create catalyzer — project template generator
```

## Development

**Requirements:** Node.js ≥ 20, pnpm ≥ 10, Rust stable (desktop/mobile only)

```bash
# Install dependencies
pnpm install

# Start the web app (http://localhost:3000)
pnpm web dev

# Start the desktop app
pnpm tauri dev

# Android
pnpm tauri android dev

# Quality gates (also run in CI)
pnpm check        # Biome lint + format
pnpm typecheck    # TypeScript compile check
pnpm build        # Full production build
```

## Releasing

The project uses **Release Please** + **GitHub Actions** for fully automated versioning.

1. **Commit with Conventional Commits** — `feat:` bumps minor, `fix:` bumps patch, `feat!:` / `BREAKING CHANGE:` bumps major; `docs:` / `chore:` / `ci:` don't affect the version.
2. **Push to `master`** — the Release workflow analyzes commits and opens a `chore(master): release vX.Y.Z` PR.
3. **Merge the release PR** (squash) — the `vX.Y.Z` tag and GitHub Release are created, and `build-desktop.yml` automatically builds and uploads macOS (arm64 + x86_64) `.dmg`, Windows `.exe` + `.msi`, Linux `.deb` + `.rpm` + `.AppImage` and the updater manifest (`latest.json`).
4. **Android (optional, manual)** — trigger `Actions → Build Apps → Run workflow` with a `tag_name`; APKs are signed when the keystore secrets (`BASE64_JKS`, `STORE_FILE`, `STORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) are configured.

### Workflow summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Every PR / push to master | Lint + typecheck + build validation |
| `release.yml` | Every push to master | Opens the release PR or creates the tag + release |
| `build-desktop.yml` | On release (automatic) | Builds macOS / Windows / Linux binaries + updater manifest |
| `build-apps.yml` | Manual (workflow_dispatch) | Builds all binaries for the selected platforms |
| `build-split-apk.yml` | Called by build-apps | Per-ABI Android APKs |
| `build-universal-apk.yml` | Called by build-apps | Universal APK + AAB |

### One-time repository setup

1. **Actions permissions** — under `Settings → Actions → General → Workflow permissions`, enable **"Read and write permissions"** and check **"Allow GitHub Actions to create and approve pull requests"**.
2. **Merge strategy** — under `Settings → General → Pull Requests`, keep only **Squash merging** enabled with **"Pull request title and description"** as the default commit message.
3. *(Optional)* Add a `RELEASE_PLEASE_TOKEN` secret (a PAT with `repo` + `workflow` scopes) so bot PRs trigger CI.

---

# Türkçe

Nolio, notlarınızı cihazınızda şifreli olarak saklar. Bulut yok, üçüncü taraf sunucu yok, telemetri yok — her şey yerelde kalır. Tarayıcıda, masaüstünde (macOS / Windows / Linux) ve Android'de tek bir kod tabanıyla çalışır.

## Özellikler

### Yazma
- **Zengin metin editörü** — Plate tabanlı, Notion tarzı düzenleme; başlıklar, listeler, görev listeleri, alıntılar, kod blokları, callout'lar, tablolar, görseller ve bağlantılar
- **Slash komutları** — klavyeden ayrılmadan `/` yazarak herhangi bir blok ekleyin
- **Markdown yapıştırma** — yapıştırılan Markdown otomatik olarak zengin bloklara dönüştürülür

### Düzenleme
- **İç içe sayfalar** — notları sınırsız alt sayfalı bir ağaç olarak düzenleyin
- **Favoriler, Son Kullanılanlar ve Tüm Notlar görünümleri** — kenar çubuğundan hızlı erişim
- **Geri alınabilir çöp kutusu** — silme işlemi geri al düğmeli bildirim gösterir; Çöp Kutusu görünümü geri yükleme ve kalıcı silmeyi, Tüm Notlar ise çoklu seçimle toplu silmeyi destekler
- **Komut paleti** — anında arama ve gezinme için `Cmd/Ctrl + K`

### Yapışkan not widget'ları (masaüstü)
- **Yüzen widget pencereleri** — kenar çubuğundan yapışkan not oluşturun; kendi çerçevesiz, serbestçe boyutlandırılabilir penceresinde açılır (makul bir minimum boyutla) ve her şeyin üstüne sabitlenebilir
- **Tam entegre** — widget'lar tam editör ve slash komutlarıyla çalışan normal kasa notlarıdır; kasa anahtarı ana pencereden asla çıkmaz ve kasa kilitlendiğinde widget'lar otomatik kapanır

### Güvenlik
- **Şifreli kasa** — not başına AES-256-GCM şifreleme; anahtarlar Argon2id ile türetilir (OWASP temel değerleri, 600 bin iterasyonlu PBKDF2 yedeğiyle)
- **Ana parola** — parola olmadan hiçbir şey kurtarılamaz; bilinçli olarak parola sıfırlama yoktur
- **Otomatik kilit** — kasa, ayarlanabilir bir boşta kalma süresinden sonra kendini kilitler (`Cmd/Ctrl + Shift + L` anında kilitler)
- **Parola değişikliği** — not şifrelerine dokunmadan kasa anahtarını yerinde yeniden sarar
- **Şifreli yedekler** — kasayı (yalnızca şifreli veri) native kaydetme diyaloğuyla seçtiğiniz konuma dışa aktarın; içe aktarma yedeğin ana parolasını sorar, hiçbir şey yazılmadan önce doğrular ve geri yüklenen kasayı doğrudan açar

### Platform
- **Masaüstü uygulaması** — Tauri 2 + Rust, şifreli SQLite depolama, özel pencere kromlu çerçevesiz pencere, uygulamanın kendi tasarım sistemiyle uygulama içi otomatik güncelleyici
- **Web uygulaması** — IndexedDB depolamalı Next.js PWA, ana ekrana yüklenebilir
- **Android** — aynı kod tabanından derlenir
- **10 dil** — EN, TR, DE, FR, ES, IT, PT, RU, JA, ZH

## İndirme

En güncel kurulum dosyalarını [sürümler sayfasından](https://github.com/metesahankurt/nolio/releases/latest) edinin:

| Platform | Dosyalar |
|----------|----------|
| Windows | `Nolio_x.y.z_x64-setup.exe`, `.msi` |
| macOS (Apple Silicon) | `Nolio_x.y.z_aarch64.dmg` |
| macOS (Intel) | `Nolio_x.y.z_x64.dmg` |
| Linux | `.AppImage`, `.deb`, `.rpm` |

Masaüstü uygulaması açılışta güncellemeleri denetler ve uygulama içi bir pencereyle kurar.

## Proje yapısı

```
apps/
  web/        Next.js web uygulaması (SSR + PWA)
  native/     Tauri masaüstü ve mobil uygulama

packages/
  core/       Not sistemi: şifreleme, store'lar, editörler, sayfa bileşenleri
  ui/         Paylaşılan UI bileşenleri ve stiller (shadcn/ui + Tailwind v4)
  i18n/       Çeviri mesajları (next-intl, 10 dil)
  cli/        npm create catalyzer — proje şablon oluşturucu
```

## Geliştirme

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

## Sürüm yayınlama

Proje, tamamen otomatik sürüm yönetimi için **Release Please** + **GitHub Actions** kullanır.

1. **Conventional Commits ile commit atın** — `feat:` minor, `fix:` patch, `feat!:` / `BREAKING CHANGE:` major yükseltir; `docs:` / `chore:` / `ci:` sürümü etkilemez.
2. **`master`'a push edin** — Release workflow'u commit'leri analiz eder ve `chore(master): release vX.Y.Z` başlıklı bir PR açar.
3. **Release PR'ını merge edin** (squash) — `vX.Y.Z` tag'i ve GitHub Release oluşturulur; `build-desktop.yml` otomatik olarak macOS (arm64 + x86_64) `.dmg`, Windows `.exe` + `.msi`, Linux `.deb` + `.rpm` + `.AppImage` dosyalarını ve güncelleyici manifest'ini (`latest.json`) derleyip yükler.
4. **Android (isteğe bağlı, manuel)** — `Actions → Build Apps → Run workflow` yolunu `tag_name` ile tetikleyin; keystore secret'ları (`BASE64_JKS`, `STORE_FILE`, `STORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) tanımlıysa APK'lar imzalı üretilir.

### Workflow özeti

| Workflow | Tetikleyici | Amaç |
|----------|-------------|------|
| `ci.yml` | Her PR / master push'u | Lint + typecheck + build doğrulaması |
| `release.yml` | Her master push'u | Release PR açar veya tag + release oluşturur |
| `build-desktop.yml` | Release oluşunca (otomatik) | macOS / Windows / Linux binary'leri + güncelleyici manifest'i derler |
| `build-apps.yml` | Manuel (workflow_dispatch) | Seçilen platformlar için tüm binary'leri derler |
| `build-split-apk.yml` | build-apps üzerinden | ABI başına Android APK derler |
| `build-universal-apk.yml` | build-apps üzerinden | Universal APK + AAB derler |

### Tek seferlik depo kurulumu

1. **Actions izinleri** — `Settings → Actions → General → Workflow permissions` altında **"Read and write permissions"** seçeneğini etkinleştirin ve **"Allow GitHub Actions to create and approve pull requests"** kutusunu işaretleyin.
2. **Birleştirme stratejisi** — `Settings → General → Pull Requests` altında yalnızca **Squash merging** etkin kalsın ve varsayılan commit mesajı olarak **"Pull request title and description"** seçili olsun.
3. *(İsteğe bağlı)* Bot PR'larının CI'ı tetiklemesi için `repo` + `workflow` kapsamlı bir PAT ile `RELEASE_PLEASE_TOKEN` secret'ı ekleyin.

---

<div align="center">
  <sub>GitHub: <a href="https://github.com/metesahankurt/nolio">metesahankurt/nolio</a> · License: <a href="LICENSE">MIT</a></sub>
</div>
