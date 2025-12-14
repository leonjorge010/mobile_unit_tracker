import { AuthProvider } from "@/lib/auth-context";
import { EventsProvider } from "@/lib/events-context";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <EventsProvider>
              {children}
            </EventsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}