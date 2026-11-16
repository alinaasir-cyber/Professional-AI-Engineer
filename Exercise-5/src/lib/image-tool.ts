export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  userPrompt: string;
  enhancedPrompt?: string;
  model: string;
  error?: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  '';

// Intelligent AI Prompt Translator & Enhancer (Somali -> English Photorealistic Prompt)
async function enhancePromptForImage(userPrompt: string): Promise<string> {
  // Clean basic prompt
  let prompt = userPrompt
    .replace(/generate an image of/i, '')
    .replace(/generate image of/i, '')
    .replace(/generate image/i, '')
    .replace(/create an image of/i, '')
    .replace(/create image/i, '')
    .replace(/make a picture of/i, '')
    .replace(/sawir ii samee/i, '')
    .replace(/ii samee sawir/i, '')
    .replace(/ii abuur sawir/i, '')
    .replace(/sawir/i, '')
    .trim();

  // Try OpenRouter to translate and enrich the prompt into English
  if (OPENROUTER_API_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Chatbot',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert AI image prompt engineer. ' +
                'Translate any language (especially Somali) into an exquisite, highly detailed, photorealistic English text-to-image prompt. ' +
                'Output ONLY the raw English prompt in 1-2 descriptive sentences, without any intro, markdown, quotes, or conversational filler.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text && text.length > 5) {
          // Remove wrapping quotes if any
          return text.replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      console.warn('OpenRouter prompt translation fallback:', e);
    }
  }

  // Fallback to Gemini if OpenRouter is slow
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Translate this Somali or multilingual description into an artistic, photorealistic English image prompt: "${prompt}". Output ONLY the English prompt string.`,
                  },
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(6000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return text.replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {}
  }

  // Quick dictionary mapping for common Somali keywords if offline
  let enriched = prompt;
  enriched = enriched.replace(/\bnin\b/gi, 'man');
  enriched = enriched.replace(/\bnaag\b|\bgabar\b/gi, 'woman');
  enriched = enriched.replace(/\bdheer\b/gi, 'tall');
  enriched = enriched.replace(/\bgaaban\b/gi, 'short');
  enriched = enriched.replace(/\bsuut\b|\bsuud\b/gi, 'tailored black suit');
  enriched = enriched.replace(/\bmadow\b/gi, 'black');
  enriched = enriched.replace(/\bcad\b/gi, 'white');
  enriched = enriched.replace(/\bliibaax\b|\blibaax\b/gi, 'lion');
  enriched = enriched.replace(/\bxeeb\b/gi, 'beach');
  enriched = enriched.replace(/\bbaabuur\b|\bgaari\b/gi, 'car');

  return `A highly detailed, photorealistic 8k portrait of ${enriched}, professional cinematic lighting, realistic textures`;
}

export async function generateImageTool(params: {
  prompt: string;
  width?: number;
  height?: number;
}): Promise<ImageGenerationResult> {
  const cleanPrompt = params.prompt.trim();

  if (!cleanPrompt) {
    return {
      success: false,
      userPrompt: '',
      model: 'Flux',
      error: 'Prompt cannot be empty for image generation.',
    };
  }

  try {
    const width = params.width || 1024;
    const height = params.height || 1024;
    const seed = Math.floor(Math.random() * 1000000);

    // Translate and enhance the prompt to English for the diffusion model
    const enhancedPrompt = await enhancePromptForImage(cleanPrompt);

    // Generate with Pollinations Flux engine
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    return {
      success: true,
      imageUrl,
      userPrompt: cleanPrompt,
      enhancedPrompt,
      model: 'Flux AI (Photorealistic)',
    };
  } catch (error: any) {
    return {
      success: false,
      userPrompt: cleanPrompt,
      model: 'Flux',
      error: error.message || 'Image generation failed.',
    };
  }
}
