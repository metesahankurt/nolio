import { ThemeInitializer } from "@workspace/core/components/common/theme-initializer";
import { siteConfig } from "@workspace/core/config/site";
import { hasLocale, messages, NextIntlClientProvider } from "@workspace/i18n";
import { routing } from "@workspace/i18n/routing";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NativeTitleBar } from "../../components/native-title-bar";
import { UpdateChecker } from "../../components/update-checker";
import { AppLayout } from "./components/app-layout";
import "@workspace/ui/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Get messages for the current locale (client-side loading for Tauri)
  const localeMessages = messages[locale as keyof typeof messages];

  return (
    <html lang={locale} suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overflow-hidden antialiased`}
      >
        <NextIntlClientProvider
          locale={locale}
          messages={localeMessages}
          timeZone="UTC"
        >
          <ThemeInitializer />
          <UpdateChecker />
          <NativeTitleBar />
          <div className="h-screen overflow-hidden pt-8">
            <AppLayout>{children}</AppLayout>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
