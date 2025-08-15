import type { Metadata } from 'next'
import Analyzer from './sections/Analyzer'

export const metadata: Metadata = {
  title: 'BasedCaster',
  description: 'Analyze a Twitter user for Base/Farcaster vibes',
}

export default function Page() {
  return (
    <main className="app-container pb-24 bg-indigo-600 min-h-screen">
      <div className="py-6" />
      <header className="mb-6">
        <h1 className="headline-1 text-white">BasedCaster</h1>
        <p className="text-sm text-indigo-100 mt-1">Analyze crypto vibes, get degen-grade art, coin and NFT ideas, and a playlist. Come back for fresh takes anytime.</p>
      </header>
      <Analyzer />
      <div className="py-10" />
    </main>
  )
}
