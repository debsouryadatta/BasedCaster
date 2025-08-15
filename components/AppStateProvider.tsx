'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useProfile } from '@farcaster/auth-kit'

type HexAddress = `0x${string}` | string | undefined

export type AppState = {
  wagmiAddress: HexAddress
  isWalletConnected: boolean
  authKitAddress: HexAddress
  isAuthenticated: boolean
  activeAddress: HexAddress
  profile: ReturnType<typeof useProfile>['profile']
}

const AppStateContext = createContext<AppState | undefined>(undefined)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { address: wagmiAddress, isConnected: isWalletConnected } = useAccount()
  const { profile, isAuthenticated } = useProfile()

  const authKitAddress: HexAddress = profile?.verifications?.[0] ?? profile?.custody

  const activeAddress: HexAddress = isWalletConnected && wagmiAddress ? wagmiAddress : authKitAddress

  const value = useMemo<AppState>(() => ({
    wagmiAddress,
    isWalletConnected,
    authKitAddress,
    isAuthenticated,
    activeAddress,
    profile,
  }), [wagmiAddress, isWalletConnected, authKitAddress, isAuthenticated, profile])

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext)
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return ctx
}


