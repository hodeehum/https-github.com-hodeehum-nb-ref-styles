import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, GeneratedImage } from "../types";

// Custom error classes for more specific error handling
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
  }
}

// Initialize the GoogleGenAI client directly with the API key from environment variables.
// This adheres to security best practices by not having fallback or hardcoded keys.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getApiError = (error: unknown): Error => {
    console.error("Gemini API Error:", error);

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Specific check for hard quota
        if (message.includes('you exceeded your current quota')) {
            return new QuotaError("Usage quota for this preview model has been exceeded. Please try again later. Note: Pro plans do not increase limits on preview models.");
        }
        
        // General rate limit check
        if (message.includes('429') || message.includes('resource_exhausted')) {
            return new RateLimitError("API rate limit reached. You may be generating images too quickly. Please wait a moment. Note that preview models may have stricter limits, regardless of your plan.");
        }
        
        if (message.includes('prompt was blocked')) {
            return new Error("The prompt was blocked due to safety settings. Please modify your prompt and try again.");
        }
        if (message.includes('api key not valid')) {
            return new Error("The API key is invalid. Please ensure it is configured correctly in your environment.");
        }
        if (message.includes('billing account not found')) {
            return new Error("Billing account not found. Please ensure your Google Cloud project is linked to a valid billing account.");
        }
        if (message.includes('service has been disabled')) {
            return new Error("The Google AI service has been disabled for your project. Please enable it in the Google Cloud Console.");
        }
        return error; // Return the original error if it's not one of the caught ones.
    }

    return new Error("An unknown error occurred. Please check the console for details.");
};

const cropWatermarkFromImage = (
  base64: string,
  mimeType: string
): Promise<{ base64: string; mimeType: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error("Could not get canvas context for processing."));
      }

      // The "Made with Gemini" frame is approximately 28 pixels high on a 1024px tall image.
      const watermarkHeightRatio = 28 / 1024;
      const watermarkHeight = Math.round(img.height * watermarkHeightRatio);
      
      // Determine the source dimensions for drawing (full image or cropped).
      const sourceY = 0;
      const sourceWidth = img.width;
      const sourceHeight = (img.height > watermarkHeight) ? img.height - watermarkHeight : img.height;
      
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      // Use high quality interpolation just in case (browser default might be low).
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the cropped image onto the canvas.
      ctx.drawImage(img, 0, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL(mimeType as 'image/png' | 'image/jpeg');
      const newBase64 = dataUrl.split(',')[1];
      
      resolve({ base64: newBase64, mimeType, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for processing."));
    };
    img.src = `data:${mimeType};base64,${base64}`;
  });
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  negativePrompt?: string,
  seed?: number,
): Promise<{ base64: string; mimeType: string; width: number; height: number }> => {
  try {
    if (aspectRatio === 'source') {
      // Fallback to 1:1 if 'source' is somehow passed to generate
      aspectRatio = '1:1';
    }

    // This model doesn't support weighted prompts, so we strip the weighting syntax
    // but keep the parentheses to allow for prompt structuring.
    const sanitizedPrompt = prompt.replace(/\(([^:]+):[\d.]+\)/g, '$1');
    const sanitizedNegative = negativePrompt?.replace(/\(([^:]+):[\d.]+\)/g, '$1');

    let generationPrompt = sanitizedPrompt;
    if (sanitizedNegative && sanitizedNegative.trim()) {
        generationPrompt += ` IMPORTANTLY, make sure to avoid the following concepts and elements: ${sanitizedNegative}.`;
    }

    const outputMimeType = 'image/jpeg';

    // Fix: 'aspectRatio' must be inside the 'config' object.
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: generationPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType,
          aspectRatio,
          ...(seed !== undefined && { seed }),
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("The model did not return an image. This could be due to safety filters or an internal error.");
    }
    
    const imageData = response.generatedImages[0];
    const base64 = imageData.image.imageBytes;
    
    if (!base64) {
        throw new Error("No image data was returned from the generation operation.");
    }

    // The 'generateImages' API generally throws an error for blocked prompts, 
    // which is handled by getApiError. Direct safety feedback isn't typically in the response body.

    return cropWatermarkFromImage(base64, outputMimeType);

  } catch (error) {
    throw getApiError(error);
  }
};


const createCanvasWithImage = (
  sourceImage: GeneratedImage,
  targetAspectRatio: AspectRatio
): Promise<{ base64: string; mimeType: 'image/png' }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }
      
      const [targetW, targetH] = targetAspectRatio.split(':').map(Number);
      
      const baseDimension = 1024;
      if (targetW > targetH) {
          canvas.width = baseDimension;
          canvas.height = Math.round((baseDimension * targetH) / targetW);
      } else {
          canvas.height = baseDimension;
          canvas.width = Math.round((baseDimension * targetW) / targetH);
      }

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const canvasAspectRatio = canvas.width / canvas.height;
      const imageAspectRatio = img.width / img.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (canvasAspectRatio > imageAspectRatio) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imageAspectRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/png' });
    };
    img.onerror = () => {
      reject(new Error("Failed to load source image for canvas composition."));
    };
    img.src = `data:${sourceImage.mimeType};base64,${sourceImage.base64}`;
  });
};


export const editImage = async (
    images: GeneratedImage[],
    prompt: string,
    aspectRatio: AspectRatio | 'source',
    negativePrompt?: string,
    seed?: number
): Promise<{ base64: string; mimeType: string; width: number; height: number }> => {
    try {
        let finalImages = images;
        let finalPrompt = prompt;

        if (aspectRatio !== 'source' && images.length === 1) {
            const compositeImage = await createCanvasWithImage(images[0], aspectRatio);
            finalImages = [{ ...images[0], base64: compositeImage.base64, mimeType: 'image/png' }];
            finalPrompt = `On the provided canvas, the central image is the source. Fill the surrounding blank (black) areas by extending the source image naturally to match the new aspect ratio. Then, apply the following edit to the entire image: ${prompt}`;
        }
        
        // This model doesn't support weighted prompts, so we strip the weighting syntax
        // but keep the parentheses to allow for prompt structuring.
        const sanitizedFinalPrompt = finalPrompt.replace(/\(([^:]+):[\d.]+\)/g, '$1');
        const sanitizedNegative = negativePrompt?.replace(/\(([^:]+):[\d.]+\)/g, '$1');
        
        let promptWithNegatives = sanitizedFinalPrompt;
        if(sanitizedNegative && sanitizedNegative.trim()) {
            promptWithNegatives += ` IMPORTANTLY, make sure to avoid the following concepts and elements: ${sanitizedNegative}.`;
        }
        
        const imageParts = finalImages.map(image => ({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            },
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    ...imageParts,
                    { text: promptWithNegatives },
                ],
            },
            // The 'gemini-2.5-flash-image-preview' model only supports 'responseModalities' in the config.
            // Other parameters like 'seed' are not supported.
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
            
        const { candidates, promptFeedback } = response;

        if (promptFeedback?.blockReason) {
            throw new Error(`The prompt was blocked due to safety filters. Reason: ${promptFeedback.blockReason}`);
        }

        if (!candidates || candidates.length === 0) {
            throw new Error("The model did not return a response. This could be due to safety filters or an internal error.");
        }
        
        for (const candidate of candidates) {
             if (candidate.finishReason === 'SAFETY') {
                const safetyRatings = candidate.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ');
                throw new Error(`The response was blocked due to safety policies. Details: ${safetyRatings}`);
            }

            const parts = candidate?.content?.parts || [];
            for (const part of parts) {
                if (part?.inlineData?.data) {
                    return cropWatermarkFromImage(part.inlineData.data, part.inlineData.mimeType);
                }
            }

            const textParts = parts.filter(p => p?.text);
            if (textParts.length > 0) {
                const textResponse = textParts.map(p => p.text).join(' ');
                throw new Error(`The model returned a text response instead of an image: "${textResponse}"`);
            }
        }

        throw new Error("No image was returned from the edit operation. The model may have refused the request due to safety policies.");
    } catch (error) {
        throw getApiError(error);
    }
};

export const elaboratePrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a creative assistant for an AI image generator. Your task is to take a user's prompt and elaborate on it, making it more descriptive, vivid, and detailed. Add details about lighting, composition, style, and mood. Do NOT change the core subject of the prompt. Respond only with the elaborated prompt text, without any preamble or explanation.",
            },
        });
        return response.text.trim();
    } catch (error) {
        throw getApiError(error);
    }
};