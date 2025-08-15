'use client'

import { useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'

export default function WalletAutoConnect() {
  const { isConnected } = useAccount()
  const { connect, connectors, status: connectStatus } = useConnect()

  useEffect(() => {
    if (!isConnected && connectors && connectors.length > 0 && connectStatus !== 'pending') {
      const farcasterConnector = connectors.find((c) => c.name.toLowerCase().includes('farcaster')) ?? connectors[0]
      try {
        connect({ connector: farcasterConnector })
      } catch {}
    }
  }, [isConnected, connect, connectors, connectStatus])

  return null
}


