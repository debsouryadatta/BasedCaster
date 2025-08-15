'use client'

import { Toaster } from 'react-hot-toast'

export default function HotToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        className: 'font-sans',
        style: {
          background: 'white',
          color: '#111',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 8px 24px rgba(31,41,55,0.08)',
        },
        success: {
          iconTheme: {
            primary: '#4f46e5',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
        },
      }}
    />
  )
}


