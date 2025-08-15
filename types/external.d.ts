declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string)
    getGenerativeModel(opts: { model: string }): {
      // Text generation (used for analysis JSON)
      generateContent(prompt: string): Promise<{
        response: {
          text(): string
          candidates?: Array<{
            content?: {
              parts?: Array<{
                inlineData?: {
                  data: string
                  mimeType: string
                }
              }>
            }
          }>
        }
      }>
      // Image or other binary generation via responseMimeType
      generateContent(params: {
        contents: Array<{ role: string; parts: Array<{ text: string }> }>
        generationConfig: { responseMimeType: string }
      }): Promise<{
        response: {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                inlineData?: {
                  data: string
                  mimeType: string
                }
              }>
            }
          }>
        }
      }>
    }
  }
}


