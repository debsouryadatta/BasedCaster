'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export default function MiniAppReady() {
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready()
      } catch (err) {
        console.error('sdk.actions.ready() failed', err)
      }
    })()
  }, [])
  return null
}
