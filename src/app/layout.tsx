import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Analytics } from '@/components/analytics'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kakšno stanovanje si lahko privoščim?",
  description: "Calculate what kind of apartment you can afford in Ljubljana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" suppressHydrationWarning>
      <head>
        <Analytics />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}