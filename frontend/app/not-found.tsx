'use client'

import Link from 'next/link'
import { Home, AlertCircle } from 'lucide-react'
import Button from '@/components/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-sage-light dark:bg-sage-dark rounded-full flex items-center justify-center">
            <AlertCircle size={40} className="text-sage-dark dark:text-sage-light" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Page Not Found</h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, the page you&apos;re looking for doesn&apos;t exist in Collixa. It might have been moved or deleted.
        </p>

        <Link href="/">
          <Button variant="primary" size="lg" fullWidth>
            <Home size={20} />
            Back to Home
          </Button>
        </Link>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link href="/dashboard">
            <button className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-center w-full">
              <p className="font-medium text-gray-900 dark:text-white">Dashboard</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View projects</p>
            </button>
          </Link>
          <Link href="/skills">
            <button className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-center w-full">
              <p className="font-medium text-gray-900 dark:text-white">Skills</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Find collaborators</p>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
