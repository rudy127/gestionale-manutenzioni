import "./globals.css";

export const metadata = {
  title: "Gestionale Manutenzioni",
  description: "Gestione clienti e manutenzioni",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>

        <link rel="manifest" href="/manifest.json" />

        <meta name="theme-color" content="#111827" />

        <link rel="apple-touch-icon" href="/icon-192.png" />

        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="apple-mobile-web-app-capable" content="yes" />

      </head>

      <body>
        {children}
      </body>

    </html>
  );
}