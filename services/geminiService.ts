
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
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// This function is the definitive fix for "black screen" crashes. It uses createImageBitmap for robust, memory-safe decoding.
// It handles corrupt image data, strips EXIF metadata, and validates image dimensions to prevent out-of-memory errors.
export const sanitizeImage = async (
  dataUrl: string,
): Promise<{ base64: string; mimeType: 'image/png'; width: number; height: number }> => {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
        throw new Error("Failed to fetch image data for sanitization.");
    }
    const blob = await response.blob();

    // Limit file size to prevent crashes on extremely large files. ~18MB is a generous limit.
    const MAX_BLOB_SIZE = 18 * 1024 * 1024; 
    if (blob.size > MAX_BLOB_SIZE) {
        throw new Error(`Image file size (${(blob.size / 1024 / 1024).toFixed(1)}MB) exceeds the limit of 18MB.`);
    }

    // createImageBitmap is more robust against corrupt data than new Image().
    const bitmap = await createImageBitmap(blob);

    const { width, height } = bitmap;

    // Limit pixel count to prevent out-of-memory crashes on large-dimension images.
    const MAX_PIXELS = 16 * 1024 * 1024; // 16 megapixels
     if (width * height > MAX_PIXELS) {
        bitmap.close(); // Free up memory
        throw new Error(`Image dimensions (${width}x${height}) are too large. Please use an image under 16 megapixels.`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        bitmap.close();
        throw new Error('Could not get canvas context for image sanitization.');
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close(); // IMPORTANT: Free up memory as soon as it's drawn.

    const sanitizedDataUrl = canvas.toDataURL('image/png');
    const base64 = sanitizedDataUrl.split(',')[1];
    
    if (!base64) {
        throw new Error("Failed to extract base64 data from sanitized image.");
    }

    return { base64, mimeType: 'image/png', width, height };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred while processing the image.';
    console.error("Image Sanitization Error:", message);
    // Re-throw a more user-friendly error.
    throw new Error(`Failed to process image: ${message}`);
  }
};


// Robustly creates a canvas with the source image, preparing it for outpainting if necessary.
const createCanvasWithImage = async (
    image: GeneratedImage,
    targetAspectRatio: AspectRatio
): Promise<{ base64: string; mimeType: 'image/png' }> => {
    if (targetAspectRatio === 'source') {
        // FIX: The function must return a PNG, but the source image could be a JPEG.
        // Sanitize the image, which will also convert it to PNG.
        const dataUrl = `data:${image.mimeType};base64,${image.base64}`;
        const sanitized = await sanitizeImage(dataUrl);
        return { base64: sanitized.base64, mimeType: sanitized.mimeType };
    }

    const [targetW, targetH] = targetAspectRatio.split(':').map(Number);
    if (!isFinite(targetW) || !isFinite(targetH) || targetW <= 0 || targetH <= 0) {
        throw new Error('Invalid target aspect ratio.');
    }
    const targetRatio = targetW / targetH;

    const sourceBitmap = await createImageBitmap(await (await fetch(`data:${image.mimeType};base64,${image.base64}`)).blob());
    const sourceW = sourceBitmap.width;
    const sourceH = sourceBitmap.height;

    if (sourceW <= 0 || sourceH <= 0) {
        sourceBitmap.close();
        throw new Error("Source image has invalid dimensions (0px).");
    }

    let canvasWidth, canvasHeight;
    // Aim for a canvas size close to a standard generation, e.g., ~1MP.
    if (targetRatio >= 1) { // Landscape or square
        canvasWidth = 1024;
        canvasHeight = Math.round(1024 / targetRatio);
    } else { // Portrait
        canvasHeight = 1024;
        canvasWidth = Math.round(1024 * targetRatio);
    }
    
    // Calculate the drawing dimensions using a stable 'object-fit: contain' algorithm
    const scale = Math.min(canvasWidth / sourceW, canvasHeight / sourceH);
    const drawW = Math.round(sourceW * scale);
    const drawH = Math.round(sourceH * scale);
    const offsetX = Math.round((canvasWidth - drawW) / 2);
    const offsetY = Math.round((canvasHeight - drawH) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        sourceBitmap.close();
        throw new Error('Could not get canvas context for outpainting.');
    }
    
    // Fill with black for the outpainting area
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.drawImage(sourceBitmap, offsetX, offsetY, drawW, drawH);
    sourceBitmap.close();

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];

    if (!base64) {
        throw new Error("Failed to create outpainting canvas.");
    }
    
    return { base64, mimeType: 'image/png' };
};

// Final processing step for ALL images. Crops watermark and resizes if too large.
const cropWatermarkFromImage = async (base64Image: string, mimeType: string): Promise<{ base64: string; mimeType: 'image/png'; width: number; height: number }> => {
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    // We sanitize here AGAIN to handle images coming directly from the API.
    // This is a crucial step to prevent crashes from API-returned images with metadata or corruption.
    const sanitized = await sanitizeImage(dataUrl);
    const sourceBitmap = await createImageBitmap(await (await fetch(`data:${sanitized.mimeType};base64,${sanitized.base64}`)).blob());

    let sourceW = sourceBitmap.width;
    let sourceH = sourceBitmap.height;

    // Safety check and downscaling for oversized images from the model.
    const MAX_API_PIXELS = 8 * 1024 * 1024; // 8 MP limit
    if (sourceW * sourceH > MAX_API_PIXELS) {
        const ratio = sourceW / sourceH;
        sourceH = Math.sqrt(MAX_API_PIXELS / ratio);
        sourceW = sourceH * ratio;
    }
    sourceW = Math.round(sourceW);
    sourceH = Math.round(sourceH);
    
    const cropAmount = 8; // Gemini adds an 8px black bar at the bottom.
    const finalWidth = sourceW;
    const finalHeight = Math.max(1, sourceH - cropAmount);

    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        sourceBitmap.close();
        throw new Error("Could not create canvas context for cropping.");
    }

    // Draw the (potentially resized) bitmap onto the canvas, cropping the bottom.
    ctx.drawImage(sourceBitmap, 0, 0, sourceW, sourceH - cropAmount, 0, 0, finalWidth, finalHeight);
    sourceBitmap.close();

    const finalDataUrl = canvas.toDataURL('image/png');
    const finalBase64 = finalDataUrl.split(',')[1];
    
    if (!finalBase64) {
        throw new Error("Failed to create final cropped image.");
    }

    return { base64: finalBase64, mimeType: 'image/png', width: finalWidth, height: finalHeight };
};

export const generateImage = async (
    prompt: string,
    aspectRatio: AspectRatio,
    negativePrompt: string,
    seed?: number
): Promise<{ base64: string, mimeType: string, width: number, height: number }> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio === 'source' ? '1:1' : aspectRatio, // Default to 1:1 if 'source' is passed
                negativePrompt: negativePrompt,
                seed: seed,
            },
        });

        const image = response.generatedImages?.[0]?.image;
        if (!image?.imageBytes) {
            throw new Error("The API did not return an image. This might be due to safety filters.");
        }
        
        return await cropWatermarkFromImage(image.imageBytes, 'image/jpeg');
    } catch (e) {
        throw getApiError(e);
    }
};

export const editImage = async (
    sourceImages: GeneratedImage[],
    prompt: string,
    aspectRatio: AspectRatio,
    negativePrompt: string,
    seed?: number
): Promise<{ base64: string, mimeType: string, width: number, height: number }> => {
    try {
        if (sourceImages.length === 0) {
            throw new Error("At least one source image is required for editing.");
        }
        
        // Handle outpainting case (1 source image, different aspect ratio)
        let preparedImage = sourceImages[0];
        if (sourceImages.length === 1 && aspectRatio !== 'source') {
            const { base64, mimeType } = await createCanvasWithImage(sourceImages[0], aspectRatio);
            preparedImage = { ...sourceImages[0], base64, mimeType };
        }
        
        const parts = [
            { inlineData: { data: preparedImage.base64, mimeType: preparedImage.mimeType } },
            ...sourceImages.slice(1).map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })),
            { text: prompt }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            // FIX: Per coding guidelines, only responseModalities is supported for this model.
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
        
        return await cropWatermarkFromImage(imagePart.inlineData.data, imagePart.inlineData.mimeType);

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
