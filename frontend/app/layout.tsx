import "./globals.css";

export const metadata = {
  title: "Inovexa ERP",
  description: "Plateforme de gestion d'entreprise nouvelle génération",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
