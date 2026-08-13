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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
