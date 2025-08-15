'use client'

import * as React from 'react'
import { useMemo, useState, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { toast } from 'react-hot-toast'
import { sdk } from '@farcaster/miniapp-sdk'
import {
  analyzeUserAction,
  type AnalyzeState,
  generateNftImageAction,
  type ImageState,
  generateMemecoinsAction,
  type MemecoinsState,
  generateNftsAction,
  type NftsState,
  generatePlaylistAction,
  type PlaylistState,
} from '@/app/actions/twitter'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function Spinner({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
}

function FormSubmitButton({
  children,
  className,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}) {
  const { pending } = useFormStatus()
  const isDisabled = !!disabled || pending
  return (
    <Button type="submit" className={className} disabled={isDisabled} onClick={onClick}>
      {pending ? (
        <div className="flex items-center justify-center gap-2">
          <Spinner className="text-white" />
          <span>Loading…</span>
        </div>
      ) : (
        children
      )}
    </Button>
  )
}

export default function Analyzer() {
  const [state, formAction] = useFormState<AnalyzeState, FormData>(analyzeUserAction, undefined as unknown as AnalyzeState)
  const [username, setUsername] = useState('')
  const [emojiRevealed, setEmojiRevealed] = useState(false)

  const [imageState, imageAction] = useFormState<ImageState, FormData>(generateNftImageAction, undefined as unknown as ImageState)
  const [memecoinsState, memecoinsAction] = useFormState<MemecoinsState, FormData>(generateMemecoinsAction, undefined as unknown as MemecoinsState)
  const [nftsState, nftsAction] = useFormState<NftsState, FormData>(generateNftsAction, undefined as unknown as NftsState)
  const [playlistState, playlistAction] = useFormState<PlaylistState, FormData>(generatePlaylistAction, undefined as unknown as PlaylistState)

  const score = state?.result?.score ?? 0
  const emoji = state?.result?.emoji ?? '🤔'
  const personality = state?.result?.personality ?? 'Explorer'
  const basedDescription = state?.result?.basedDescription ?? ''
  const imageDataUrl = state?.result?.imageDataUrl

  const progressColor = useMemo(() => {
    if (score > 800) return 'bg-indigo-600'
    if (score > 500) return 'bg-indigo-500'
    return 'bg-indigo-400'
  }, [score])

  // Toast on action state changes (success/error)
  const analyzeSeenRef = useRef<AnalyzeState | undefined>(undefined)
  const imageSeenRef = useRef<ImageState | undefined>(undefined)
  const memecoinsSeenRef = useRef<MemecoinsState | undefined>(undefined)
  const nftsSeenRef = useRef<NftsState | undefined>(undefined)
  const playlistSeenRef = useRef<PlaylistState | undefined>(undefined)

  React.useEffect(() => {
    if (!state || analyzeSeenRef.current === state) return
    analyzeSeenRef.current = state
    if (state.ok && state.result) {
      toast.success('Analysis ready')
    } else if (!state.ok && state.error) {
      toast.error(state.error)
    }
  }, [state])

  React.useEffect(() => {
    if (!imageState || imageSeenRef.current === imageState) return
    imageSeenRef.current = imageState
    if (imageState.ok && imageState.imageDataUrl) {
      toast.success('Image generated')
    } else if (!imageState.ok && imageState.error) {
      toast.error(imageState.error)
    }
  }, [imageState])

  React.useEffect(() => {
    if (!memecoinsState || memecoinsSeenRef.current === memecoinsState) return
    memecoinsSeenRef.current = memecoinsState
    if (memecoinsState.ok && (memecoinsState.items?.length ?? 0) > 0) {
      toast.success('Memecoin ideas ready')
    }
  }, [memecoinsState])

  React.useEffect(() => {
    if (!nftsState || nftsSeenRef.current === nftsState) return
    nftsSeenRef.current = nftsState
    if (nftsState.ok && (nftsState.items?.length ?? 0) > 0) {
      toast.success('NFT suggestions ready')
    }
  }, [nftsState])

  React.useEffect(() => {
    if (!playlistState || playlistSeenRef.current === playlistState) return
    playlistSeenRef.current = playlistState
    if (playlistState.ok && (playlistState.items?.length ?? 0) > 0) {
      toast.success('Playlist generated')
    }
  }, [playlistState])

  const shareImage = async (imageUrl: string) => {
    if (!imageUrl) return
    try {
      await sdk.actions.composeCast({
        text: 'Mintable vibes from BasedCaster',
        embeds: [imageUrl],
      } as any)
      toast.success('Opening Farcaster composer…')
      return
    } catch (err) {
      // Fallback: copy the image URL/data to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl)
        toast.success('Copied image link')
      } catch {
        toast.error('Unable to share automatically')
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="card border-indigo-100">
        <CardHeader>
          <CardTitle className="headline-2">Enter a Twitter username</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center">
            <span className="text-indigo-600 font-medium text-2xl">@</span>
            <Input
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourfavoritebuilder"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              className="h-12 rounded-xl border-indigo-200 focus-visible:ring-indigo-500 flex-1"
            />
          </div>
          {state && !state.ok && state.error ? (
            <p className="text-destructive mt-1 text-sm">{state.error}</p>
          ) : null}
        </CardContent>
      </Card>
      <div className="rounded-2xl p-3 bg-indigo-600">
        <Tabs defaultValue="generate" className="space-y-3">
          <TabsList className="rounded-xl bg-white p-1">
            <TabsTrigger value="generate" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 text-indigo-700">
              Generate
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 text-indigo-700">
              Gallery
            </TabsTrigger>
          </TabsList>
          <TabsContent value="generate">
            {!state?.result ? (
              <div className="glass rounded-xl p-3 text-white text-sm">
                <span className="font-semibold">Step 1:</span> Generate your Based score to unlock emoji, image, memecoins, NFTs, and playlist.
              </div>
            ) : null}
            <Accordion type="multiple" className="space-y-3">
          <AccordionItem value="score" className="border-none">
            <AccordionTrigger className="bg-white rounded-xl px-4 shadow-sm headline-3">
              First: Based score with description
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-xl px-4 pb-4 border border-indigo-100 border-t-0 -mt-2">
              <form action={formAction} className="space-y-3">
                <input type="hidden" name="username" value={username} />
                <FormSubmitButton className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setEmojiRevealed(false)}>
                  Generate
                </FormSubmitButton>
              </form>
              {state?.ok && state.result ? (
                <div className="space-y-3 mt-3 rounded-xl border border-indigo-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-base font-medium">{personality}</div>
                    <div className="text-xs text-muted-foreground">Based score: {score}/1000</div>
                  </div>
                  {basedDescription ? (
                    <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                      {basedDescription}
                    </p>
                  ) : null}
                  <div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${progressColor}`} style={{ width: `${Math.min(100, Math.round((score / 1000) * 100))}%` }} />
                    </div>
                  </div>
                  <form action={formAction}>
                    <input type="hidden" name="username" value={username} />
                    <FormSubmitButton className="mt-2 h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      Regenerate
                    </FormSubmitButton>
                  </form>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="emoji" className="border-none">
            <AccordionTrigger className="bg-white rounded-xl px-4 shadow-sm headline-3">
              Second: Personality emoji{!state?.result ? ' (locked)' : ''}
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-xl px-4 pb-4 border border-indigo-100 border-t-0 -mt-2">
              <div className="space-y-3">
                <Button
                  type="button"
                  className="h-12 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                  disabled={!state?.ok || !state.result}
                  onClick={() => setEmojiRevealed(true)}
                >
                  Reveal
                </Button>
                {emojiRevealed && state?.result ? (
                  <div className="flex items-center gap-3 rounded-xl border border-indigo-100 p-4">
                    <div className="text-4xl leading-none">{emoji}</div>
                    <div className="text-sm text-muted-foreground">{personality}</div>
                  </div>
                ) : null}
                <form action={formAction}>
                  <input type="hidden" name="username" value={username} />
                  <FormSubmitButton className="mt-2 h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                    Regenerate analysis
                  </FormSubmitButton>
                </form>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="image" className="border-none">
            <AccordionTrigger className="bg-white rounded-xl px-4 shadow-sm headline-3">
              Third: NFT-style image{!state?.result ? ' (locked)' : ''}
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-xl px-4 pb-4 border border-indigo-100 border-t-0 -mt-2">
              <form action={imageAction} className="space-y-2">
                <input type="hidden" name="username" value={state?.username || username} />
                <input type="hidden" name="score" value={String(score)} />
                <input type="hidden" name="personality" value={personality} />
                <input type="hidden" name="emoji" value={emoji} />
                <FormSubmitButton className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Generate
                </FormSubmitButton>
              </form>
              {imageState?.ok && imageState.imageDataUrl ? (
                <div className="rounded-xl overflow-hidden border border-indigo-100 shadow-sm mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageState.imageDataUrl} alt="NFT style poster" className="w-full h-auto" />
                  <div className="p-3 flex items-center gap-2">
                    <SaveToGalleryButton imageDataUrl={imageState.imageDataUrl} username={(state?.username || username) || ''} />
                    <Button
                      type="button"
                      onClick={() => shareImage(imageState.imageDataUrl!)}
                      className="h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Share to Farcaster
                    </Button>
                  </div>
                </div>
              ) : null}
              <form action={imageAction} className="mt-2">
                <input type="hidden" name="username" value={state?.username || username} />
                <input type="hidden" name="score" value={String(score)} />
                <input type="hidden" name="personality" value={personality} />
                <input type="hidden" name="emoji" value={emoji} />
                <FormSubmitButton className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Regenerate
                </FormSubmitButton>
              </form>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="memecoins" className="border-none">
            <AccordionTrigger className="bg-white rounded-xl px-4 shadow-sm headline-3">
              Fourth: Memecoin suggestions{!state?.result ? ' (locked)' : ''}
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-xl px-4 pb-4 border border-indigo-100 border-t-0 -mt-2">
              <form action={memecoinsAction} className="space-y-2">
                <input type="hidden" name="personality" value={personality} />
                <FormSubmitButton className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Generate
                </FormSubmitButton>
              </form>
              {memecoinsState?.ok && memecoinsState.items && memecoinsState.items.length > 0 ? (
                <ul className="space-y-2 mt-3">
                  {memecoinsState.items.slice(0, 6).map((it, i) => (
                    <li key={`mc-${i}`} className="rounded-lg border border-indigo-100 p-3 text-sm">
                      <div className="font-medium">{it.title}</div>
                      {it.subtitle ? <div className="text-xs text-muted-foreground">{it.subtitle}</div> : null}
                      {it.reason ? <div className="text-xs text-indigo-700 mt-1">{it.reason}</div> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              <form action={memecoinsAction} className="mt-2">
                <input type="hidden" name="personality" value={personality} />
                <FormSubmitButton className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Regenerate
                </FormSubmitButton>
              </form>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="nfts" className="border-none">
            <AccordionTrigger className="bg-white rounded-xl px-4 shadow-sm headline-3">
              Fifth: NFT suggestions{!state?.result ? ' (locked)' : ''}
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-xl px-4 pb-4 border border-indigo-100 border-t-0 -mt-2">
              <form action={nftsAction} className="space-y-2">
                <input type="hidden" name="personality" value={personality} />
                <FormSubmitButton className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Generate
                </FormSubmitButton>
              </form>
              {nftsState?.ok && nftsState.items && nftsState.items.length > 0 ? (
                <ul className="space-y-2 mt-3">
                  {nftsState.items.slice(0, 6).map((it, i) => (
                    <li key={`nft-${i}`} className="rounded-lg border border-indigo-100 p-3 text-sm">
                      <div className="font-medium">{it.title}</div>
                      {it.subtitle ? <div className="text-xs text-muted-foreground">{it.subtitle}</div> : null}
                      {it.reason ? <div className="text-xs text-indigo-700 mt-1">{it.reason}</div> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              <form action={nftsAction} className="mt-2">
                <input type="hidden" name="personality" value={personality} />
                <FormSubmitButton className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Regenerate
                </FormSubmitButton>
              </form>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="playlist" className="border-none">
            <AccordionTrigger className="bg-white rounded-xl px-4 shadow-sm headline-3">
              Sixth: Crypto playlist{!state?.result ? ' (locked)' : ''}
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-xl px-4 pb-4 border border-indigo-100 border-t-0 -mt-2">
              <form action={playlistAction} className="space-y-2">
                <input type="hidden" name="personality" value={personality} />
                <FormSubmitButton className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Generate
                </FormSubmitButton>
              </form>
              {playlistState?.ok && playlistState.items && playlistState.items.length > 0 ? (
                <ul className="space-y-2 mt-3">
                  {playlistState.items.slice(0, 8).map((it, i) => (
                    <li key={`pl-${i}`} className="rounded-lg border border-indigo-100 p-3 text-sm">
                      <div className="font-medium">{it.title}</div>
                      {it.subtitle ? <div className="text-xs text-muted-foreground">{it.subtitle}</div> : null}
                      {it.reason ? <div className="text-xs text-indigo-700 mt-1">{it.reason}</div> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              <form action={playlistAction} className="mt-2">
                <input type="hidden" name="personality" value={personality} />
                <FormSubmitButton className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50" disabled={!state?.ok || !state.result}>
                  Regenerate
                </FormSubmitButton>
              </form>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
          </TabsContent>
          <TabsContent value="gallery">
            <Gallery onShare={shareImage} />
          </TabsContent>
        </Tabs>
      </div>

      {state?.result?.tweets && state.result.tweets.length > 0 ? (
        <Card className="card border-indigo-100">
          <CardHeader>
            <CardTitle className="headline-2">Recent tweets</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {state.result.tweets.slice(0, 12).map((t, idx) => (
                <li key={t.id ?? idx} className="rounded-xl border border-indigo-100 p-4 text-sm leading-relaxed">
                  {t.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

type GalleryItem = { username: string; imageDataUrl: string; createdAt: number }

function Gallery({ onShare }: { onShare: (url: string) => void }) {
  const [items, setItems] = React.useState<GalleryItem[]>([])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('basedcaster.gallery')
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center text-sm text-muted-foreground">
        Your saved posters will appear here. Generate an image and hit "Save to gallery".
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4">
      <div className="grid grid-cols-3 gap-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-xl overflow-hidden border border-indigo-100 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.imageDataUrl} alt={it.username} className="w-full h-auto" />
            <div className="p-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium truncate">@{it.username}</span>
              <button
                type="button"
                onClick={() => onShare(it.imageDataUrl)}
                className="text-[11px] rounded-lg bg-indigo-600 text-white px-2 py-1 hover:bg-indigo-700"
              >
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SaveToGalleryButton({ imageDataUrl, username }: { imageDataUrl: string; username: string }) {
  const [saved, setSaved] = React.useState(false)
  return (
    <Button
      type="button"
      className="h-10 rounded-lg bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
      onClick={() => {
        try {
          const raw = localStorage.getItem('basedcaster.gallery')
          const list: GalleryItem[] = raw ? JSON.parse(raw) : []
          const next: GalleryItem[] = [{ username, imageDataUrl, createdAt: Date.now() }, ...list].slice(0, 60)
          localStorage.setItem('basedcaster.gallery', JSON.stringify(next))
          setSaved(true)
          toast.success('Saved to gallery')
        } catch {}
      }}
    >
      {saved ? 'Saved ✓' : 'Save to gallery'}
    </Button>
  )
}


