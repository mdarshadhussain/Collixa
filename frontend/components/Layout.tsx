import { ReactNode } from 'react'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
}

export default function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="bg-white min-h-screen">
      {showHeader && <Header />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
