export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  prompt: string;
  model: string;
  error?: string;
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
      prompt: '',
      model: 'Flux-Schnell',
      error: 'Prompt cannot be empty for image generation.',
    };
  }

  try {
    const width = params.width || 1024;
    const height = params.height || 1024;
    const seed = Math.floor(Math.random() * 1000000);

    // Using Pollinations Flux engine (100% free, high-resolution, instant)
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    return {
      success: true,
      imageUrl,
      prompt: cleanPrompt,
      model: 'Flux (High-Resolution)',
    };
  } catch (error: any) {
    return {
      success: false,
      prompt: cleanPrompt,
      model: 'Flux-Schnell',
      error: error.message || 'Image generation failed.',
    };
  }
}
