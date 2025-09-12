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
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// CRASH FIX HELPER: Converts a data URL to a Blob more efficiently than fetch(),
// avoiding memory spikes that can crash the browser tab on large images.
const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    if (arr.length < 2 || !arr[0] || !arr[1]) {
        throw new Error('Invalid data URL');
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) {
        throw new Error('Could not parse MIME type from data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}


const getApiError = (error: unknown): Error => {
    console.error("Gemini API Error:", error);

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('you exceeded your current quota')) {
            return new QuotaError("Usage quota for this preview model has been exceeded. Please try again later. Note: Pro plans do not increase limits on preview models.");
        }
        
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
        return error;
    }

    return new Error("An unknown error occurred. Please check the console for details.");
};

// This function is the definitive fix for "black screen" crashes. It uses createImageBitmap for robust, memory-safe decoding
// and intelligently preserves the JPEG format for uploaded photos to prevent memory bloat from PNG conversion.
export const sanitizeImage = async (
  dataUrl: string,
): Promise<{ base64: string; mimeType: 'image/jpeg' | 'image/png'; width: number; height: number }> => {
  let canvas: HTMLCanvasElement | null = document.createElement('canvas');
  try {
    const blob = dataUrlToBlob(dataUrl);

    const MAX_BLOB_SIZE = 18 * 1024 * 1024; 
    if (blob.size > MAX_BLOB_SIZE) {
        throw new Error(`Image file size (${(blob.size / 1024 / 1024).toFixed(1)}MB) exceeds the limit of 18MB.`);
    }

    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    const MAX_PIXELS = 16 * 1024 * 1024; // 16 megapixels
     if (width * height > MAX_PIXELS) {
        bitmap.close();
        throw new Error(`Image dimensions (${width}x${height}) are too large. Please use an image under 16 megapixels.`);
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        bitmap.close();
        throw new Error('Could not get canvas context for image sanitization.');
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    // MEMORY CRASH FIX: Intelligently preserve JPEG format for photos to avoid memory bloat.
    // Convert other types to PNG to handle transparency.
    const outputMimeType = blob.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const quality = outputMimeType === 'image/jpeg' ? 0.9 : undefined; // High quality for JPEGs

    const sanitizedDataUrl = canvas.toDataURL(outputMimeType, quality);
    const base64 = sanitizedDataUrl.split(',')[1];
    
    if (!base64) {
        throw new Error("Failed to extract base64 data from sanitized image.");
    }

    return { base64, mimeType: outputMimeType, width, height };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred while processing the image.';
    console.error("Image Sanitization Error:", message);
    throw new Error(`Failed to process image: ${message}`);
  } finally {
      if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
          canvas = null;
      }
  }
};


// This function has been updated for efficiency and stability. It now preserves the incoming
// image format (e.g., JPEG from Imagen) to avoid unnecessary conversion to PNG, reducing memory usage.
const postProcessApiImage = async (base64Image: string, mimeType: string): Promise<{ base64: string; mimeType: 'image/jpeg' | 'image/png'; width: number; height: number }> => {
    let canvas: HTMLCanvasElement | null = document.createElement('canvas');
    try {
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        const blob = dataUrlToBlob(dataUrl);
        const bitmap = await createImageBitmap(blob);

        let sourceW = bitmap.width;
        let sourceH = bitmap.height;

        const MAX_API_PIXELS = 8 * 1024 * 1024; // 8 MP limit
        if (sourceW * sourceH > MAX_API_PIXELS) {
            const ratio = sourceW / sourceH;
            sourceH = Math.sqrt(MAX_API_PIXELS / ratio);
            sourceW = sourceH * ratio;
        }
        const finalWidth = Math.round(sourceW);
        const finalHeight = Math.round(sourceH);

        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap.close();
            throw new Error("Could not create canvas context for post-processing.");
        }

        ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);
        bitmap.close();

        // MEMORY CRASH FIX: Preserve JPEG format from API to avoid bloat.
        const outputMimeType = mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        const quality = outputMimeType === 'image/jpeg' ? 0.9 : undefined;

        const finalDataUrl = canvas.toDataURL(outputMimeType, quality);
        const finalBase64 = finalDataUrl.split(',')[1];
        
        if (!finalBase64) {
            throw new Error("Failed to create final processed image.");
        }

        return { base64: finalBase64, mimeType: outputMimeType, width: finalWidth, height: finalHeight };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred while processing the API image.';
        console.error("API Image Post-Processing Error:", message);
        throw new Error(`Failed to process image from API: ${message}`);
    } finally {
        if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;
        }
    }
};

export const generateImage = async (
    prompt: string,
    aspectRatio: AspectRatio,
    seed?: number
): Promise<{ base64: string, mimeType: 'image/jpeg' | 'image/png', width: number, height: number }> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio === 'source' ? '1:1' : aspectRatio, // Default to 1:1 if 'source' is passed
                seed: seed,
            },
        });

        const image = response.generatedImages?.[0]?.image;
        if (!image?.imageBytes) {
            throw new Error("The API did not return an image. This might be due to safety filters.");
        }
        
        return await postProcessApiImage(image.imageBytes, 'image/jpeg');
    } catch (e) {
        throw getApiError(e);
    }
};

export const editImage = async (
    sourceImages: GeneratedImage[],
    prompt: string
): Promise<{ base64: string, mimeType: 'image/jpeg' | 'image/png', width: number, height: number }> => {
    try {
        if (sourceImages.length === 0) {
            throw new Error("At least one source image is required for editing.");
        }
        
        const parts = [
            ...sourceImages.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })),
            { text: prompt }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            // Per coding guidelines, only responseModalities is supported for this model.
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!imagePart?.inlineData) {
            const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
            const blockReason = response.candidates?.[0]?.finishReason;
            if (blockReason === 'SAFETY') {
                 throw new Error("The edit was blocked due to safety settings. The model may have refused to generate the requested content.");
            }
            throw new Error(`The API did not return an image. Reason: ${blockReason || 'Unknown'}. Response: ${textPart || 'No text response'}`);
        }
        
        return await postProcessApiImage(imagePart.inlineData.data, imagePart.inlineData.mimeType);

    } catch (e) {
        throw getApiError(e);
    }
};

export const elaboratePrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a creative assistant. Elaborate on the following user prompt for an image generation tool. Make it more descriptive and evocative. Do not add any conversational text, just the elaborated prompt. User prompt: "${prompt}"`,
            config: {
                stopSequences: ['\n'],
                temperature: 0.8,
            }
        });
        const elaborated = response.text.trim();
        if (!elaborated) {
            throw new Error("The model returned an empty elaboration.");
        }
        return elaborated;
    } catch (e) {
        throw getApiError(e);
    }
};