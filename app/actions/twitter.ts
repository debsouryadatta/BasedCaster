 'use server'

type Tweet = {
  id?: string
  text: string
  created_at?: string
  createdAt?: string
}

const MIN_INTERVAL_MS = Number(process.env.TWITTERAPI_IO_MIN_INTERVAL_MS || 5000)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getTweets(username: string, desiredCount: number = 30): Promise<Tweet[]> {
  if (!username) {
    throw new Error('Twitter username is required.')
  }

  const apiKey = process.env.TWITTERAPI_IO_KEY
  if (!apiKey) {
    throw new Error('Twitter API key is not configured.')
  }

  const fetchPage = async (page: number) => {
    const url = `https://api.twitterapi.io/twitter/user/last_tweets?userName=${encodeURIComponent(username)}&page=${page}`
    console.log(`[tweets] fetching page=${page} url=${url}`)
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
      },
      next: { revalidate: 3600 },
    })
    console.log(`[tweets] page=${page} status=${response.status}`)
    if (!response.ok) {
      let message = 'Failed to fetch tweets.'
      try {
        const err = await response.json()
        message = err?.message || message
      } catch {}
      throw new Error(message)
    }
    const data = await response.json()
    const tweets = (data?.tweets ?? []) as Tweet[]
    console.log(`[tweets] page=${page} count=${tweets.length}`)
    return tweets
  }

  try {
    const page1 = await fetchPage(1)
    if (desiredCount <= page1.length || page1.length === 0) return page1.slice(0, desiredCount)
    console.log(`[tweets] waiting ${MIN_INTERVAL_MS}ms to respect QPS before fetching page=2`)
    await sleep(MIN_INTERVAL_MS)
    const page2 = await fetchPage(2)
    const combined = [...page1, ...page2]
    console.log(`[tweets] combined count=${combined.length} returning=${Math.min(desiredCount, combined.length)}`)
    return combined.slice(0, desiredCount)
  } catch (error) {
    console.error('Error fetching tweets:', error)
    return []
  }
}

async function analyzeWithGemini(tweets: Tweet[], username: string): Promise<{
  score?: number
  personality?: string
  emoji?: string
  basedDescription?: string
}> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return {}
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are analyzing a Twitter user's recent tweets.
Return a compact JSON object with these exact keys:
{
  "score": number in [0,1000],        // how "based" (Base chain + Farcaster + onchain culture)
  "personality": string,              // short, 1-2 words (e.g., "Builder", "Shitposter", "Educator")
  "emoji": string,                    // a single emoji matching personality
  "basedDescription": string          // 1 short sentence that explains how based this user is based on their tweets
}

Guidelines:
- Heavily reward mentions of Base, Farcaster, Warpcast, frames, onchain culture.
- Penalize if irrelevant to crypto/onchain culture.
- Keep personality concise and avoid punctuation.
- Make basedDescription neutral, punchy, and under 120 characters.

Username: @${username}
Tweets (newest first):
${tweets.map((t, i) => `(${i + 1}) ${t.text}`).join('\n')}
Only output the JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) return {}
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as { score?: number; personality?: string; emoji?: string; basedDescription?: string }
    return parsed
  } catch (err) {
    console.error('Gemini analysis failed:', err)
    return {}
  }
}

async function generateImageWithGemini(params: {
  username: string
  score: number
  personality: string
  emoji: string
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return ''
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are a crypto-native designer generating an NFT-style SVG poster. Output a compact JSON with one key "svg" whose value is a single-line SVG string. No markdown, no explanations.

Vibe (NFT/crypto poster):
- Loud, kinetic, futuristic; meant to attract crypto users
- Neon gradient palette (electric indigo, cyan, magenta, acid green) on a dark indigo/black backdrop
- Holographic sheen using layered gradients, geometric shards, glitch lines, particle bursts
- Personality-driven abstract motif matching "${params.personality}" (e.g., builder → circuitry shapes; educator → grid/lines; shitposter → graffiti strokes)
- Use the emoji ${params.emoji} as a small accent glyph, not the main subject

Constraints:
- Square canvas 1024x1024
- Use only inline SVG (no external images). Avoid heavy filters; prefer gradients, masks, patterns, and simple blurs sparingly
- Use generic fonts (system-ui, sans-serif)
- Prominently show:
  @${params.username}
  ${params.personality} • Based Score: ${params.score}/1000
- Composition should feel bold and collectible (poster-esque)

Return exactly:
{"svg":"<svg ...>...</svg>"}`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      // Ask for JSON so we can reliably parse the SVG string
      generationConfig: { responseMimeType: 'application/json' },
    } as any)

    const text = (result as any)?.response?.text?.() ?? ''
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) return ''
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as { svg?: string }
    const svg = (parsed.svg || '').trim()
    if (!svg) return ''
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    return dataUrl
  } catch (err) {
    console.error('Gemini image generation failed:', err)
    return ''
  }
}

export async function analyzeUser(username: string): Promise<{
  score: number
  personality: string
  emoji: string
  basedDescription: string
  imageDataUrl: string
  tweets: Tweet[]
}> {
  const tweets = await getTweets(username, 30)
  const ai = await analyzeWithGemini(tweets, username)
  const score = Math.max(0, Math.min(1000, Math.round((ai.score ?? 0))))
  const personality = (ai.personality || 'Explorer').trim()
  const emoji = (ai.emoji || '🤔').trim()
  const basedDescription = (ai.basedDescription || 'Based presence unclear.').trim()
  const imageDataUrl = await generateImageWithGemini({ username, score, personality, emoji })
  return {
    score,
    personality,
    emoji,
    basedDescription,
    imageDataUrl,
    tweets,
  }
}

// For use with useActionState in a client component
export type AnalyzeState = {
  ok: boolean
  error?: string
  username?: string
  result?: {
    score: number
    personality: string
    emoji: string
    basedDescription: string
    imageDataUrl: string
    tweets: Tweet[]
  }
}

export async function analyzeUserAction(_prevState: AnalyzeState | undefined, formData: FormData): Promise<AnalyzeState> {
  const usernameRaw = (formData.get('username') || '').toString().trim()
  const username = usernameRaw.startsWith('@') ? usernameRaw.slice(1) : usernameRaw
  if (!username) {
    return { ok: false, error: 'Please enter a Twitter username.' }
  }
  try {
    const result = await analyzeUser(username)
    return { ok: true, username, result }
  } catch (err: any) {
    const message = err?.message || 'Something went wrong.'
    return { ok: false, error: message }
  }
}


export type ImageState = {
  ok: boolean
  error?: string
  imageDataUrl?: string
}

export async function generateNftImageAction(_prev: ImageState | undefined, formData: FormData): Promise<ImageState> {
  const username = (formData.get('username') || '').toString().trim()
  const score = Number((formData.get('score') || '0').toString()) || 0
  const personality = (formData.get('personality') || '').toString().trim() || 'Explorer'
  const emoji = (formData.get('emoji') || '').toString().trim() || '🤔'
  try {
    const imageDataUrl = await generateImageWithGemini({ username, score, personality, emoji })
    if (!imageDataUrl) return { ok: false, error: 'Failed to generate image.' }
    return { ok: true, imageDataUrl }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to generate image.' }
  }
}

type GeneratedItem = { title: string; subtitle?: string; reason?: string }

async function generateListWithGemini(prompt: string): Promise<GeneratedItem[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return []
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const fullPrompt = `${prompt}\nReturn strictly valid JSON with this shape: {"items":[{"title":"string","subtitle":"string(optional)","reason":"string(optional)"}]}`
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: fullPrompt }]}] } as any)
    const text = (result as any)?.response?.text?.() ?? ''
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) return []
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as { items?: GeneratedItem[] }
    return parsed.items || []
  } catch (err) {
    console.error('Gemini list generation failed:', err)
    return []
  }
}

export type MemecoinsState = { ok: boolean; error?: string; items?: GeneratedItem[] }
export async function generateMemecoinsAction(_prev: MemecoinsState | undefined, formData: FormData): Promise<MemecoinsState> {
  const personality = (formData.get('personality') || '').toString().trim() || 'Explorer'
  const prompt = `You are recommending degen, crypto-native meme coins for a user whose personality is "${personality}".
Make them fun, spicy, and on-chain culture aligned. Include both known and imaginative coin ideas.
For each item provide a catchy title (e.g., TICKER or name) and a one-line reason why it matches this personality.`
  const items = await generateListWithGemini(prompt)
  return { ok: true, items }
}

export type NftsState = { ok: boolean; error?: string; items?: GeneratedItem[] }
export async function generateNftsAction(_prev: NftsState | undefined, formData: FormData): Promise<NftsState> {
  const personality = (formData.get('personality') || '').toString().trim() || 'Explorer'
  const prompt = `Suggest NFT collections (real or imaginative) tailored to a crypto user's personality "${personality}".
Mix blue-chip vibes with degen energy. For each item, provide a title and a one-line reason aligned with onchain culture.`
  const items = await generateListWithGemini(prompt)
  return { ok: true, items }
}

export type PlaylistState = { ok: boolean; error?: string; items?: GeneratedItem[] }
export async function generatePlaylistAction(_prev: PlaylistState | undefined, formData: FormData): Promise<PlaylistState> {
  const personality = (formData.get('personality') || '').toString().trim() || 'Explorer'
  const prompt = `Create a crypto-native playlist themed for personality "${personality}".
Focus on high-energy, futuristic, degen-friendly tracks. Include title and optional artist in subtitle. Keep it hype for builders/traders.`
  const items = await generateListWithGemini(prompt)
  return { ok: true, items }
}

