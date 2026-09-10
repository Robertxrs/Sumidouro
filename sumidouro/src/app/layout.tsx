import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sumidouro',
  description: 'Seu segundo cérebro',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <Sidebar />
        <div className="md:pl-64 pb-16 md:pb-0 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
