import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banki",
  description: "Banco de preguntas para practicar y exportar errores a Anki",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
