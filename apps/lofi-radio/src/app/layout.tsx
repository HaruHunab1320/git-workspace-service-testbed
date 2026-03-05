import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lofi Radio",
  description: "A cozy lofi radio for the village",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
