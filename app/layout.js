import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "./globals.css";
import { IdentityProvider } from "@/components/IdentityProvider";
import Nav from "@/components/Nav";

export const metadata = {
  title: "The Arena",
  description: "Stake a claim. Back it up. Let the arena decide.",
};

export const viewport = {
  themeColor: "#0b0b12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Reads the saved theme preference and applies it to <html> before first
// paint, so a manual Light or Dark choice doesn't flash the system default
// for a frame. Kept as a tiny inline script (not a lazy useState initializer)
// because it has to run before React hydrates anything at all.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("arena_theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <IdentityProvider>
          <div className="min-h-dvh flex flex-col">
            <Nav />
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-28 pt-4 sm:pb-16">{children}</main>
          </div>
        </IdentityProvider>
      </body>
    </html>
  );
}
