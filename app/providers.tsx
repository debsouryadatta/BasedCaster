'use client'

import React, { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { AuthKitProvider } from '@farcaster/auth-kit'
import { AppStateProvider } from '@/components/AppStateProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthKitProvider config={{}}>
          <AppStateProvider>
            {children}
          </AppStateProvider>
        </AuthKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


