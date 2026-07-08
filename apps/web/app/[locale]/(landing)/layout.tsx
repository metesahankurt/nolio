import { Footer } from "./components/footer";
import { HeroHeader } from "./components/header";

interface LandingLayoutProps {
  children: React.ReactNode;
}

// The theme mode context (ThemeProvider) is now provided once at the locale
// root layout, covering landing, app, docs and notes alike.
export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <>
      <HeroHeader />
      {children}
      <Footer />
    </>
  );
}
