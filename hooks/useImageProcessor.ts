import { useState, useRef, useCallback } from 'react';
import { RateLimitError } from '../services/geminiService';

// T is the expected return type from the process function, e.g., { base64: string; mimeType: string }
type ProcessFunction<T> = () => Promise<T>;

interface UseImageProcessorOptions<T> {
  onSuccess: (result: T) => void;
}

export const useImageProcessor = <T,>({ onSuccess }: UseImageProcessorOptions<T>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isCancelled = useRef(false);

  const stop = useCallback(() => {
    isCancelled.current = true;
    setIsLoading(false);
    setLoadingMessage('');
    setError("Operation stopped by user.");
  }, [setError]);

  const start = useCallback(async (
    processFunction: ProcessFunction<T>,
    numImages: number,
    processName: 'Generating' | 'Applying edit' = 'Generating'
  ) => {
    isCancelled.current = false;
    setIsLoading(true);
    setLoadingMessage(`Preparing to ${processName.toLowerCase()} images...`);
    setError(null);

    let criticalError = null;

    for (let i = 0; i < numImages; i++) {
      if (isCancelled.current) break;

      let success = false;
      let attempt = 0;
      const maxAttempts = 3;

      while (!success && attempt < maxAttempts && !isCancelled.current) {
        attempt++;
        try {
          setLoadingMessage(`${processName} image ${i + 1} of ${numImages}... (Attempt ${attempt}/${maxAttempts})`);
          
          const result = await processFunction();
          
          if (isCancelled.current) break;

          onSuccess(result);
          success = true;

        } catch (err) {
          const isRateLimit = err instanceof RateLimitError;

          if (isRateLimit && attempt < maxAttempts && !isCancelled.current) {
            const waitTime = 60100 * Math.pow(2, attempt - 1);
            const message = `Rate limit hit. Retrying image ${i + 1} in`;
            
            const startWait = Date.now();
            let elapsed = 0;
            
            while (elapsed < waitTime && !isCancelled.current) {
              const remaining = Math.ceil((waitTime - elapsed) / 1000);
              setLoadingMessage(`${message} ${remaining}s...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              elapsed = Date.now() - startWait;
            }

            if (isCancelled.current) break;

          } else {
            // Treat QuotaErrors and other errors as critical and non-retryable
            criticalError = err as Error;
            break; 
          }
        }
      }
      
      if (criticalError) break;

      if (!success && !isCancelled.current) {
        criticalError = new Error(`Failed to process image ${i + 1} after ${maxAttempts} attempts.`);
        break;
      }

      if (i < numImages - 1 && !isCancelled.current) {
        const waitTime = 60100;
        const startWait = Date.now();
        let elapsed = 0;
        
        while (elapsed < waitTime && !isCancelled.current) {
          const remaining = Math.ceil((waitTime - elapsed) / 1000);
          setLoadingMessage(`Image ${i + 1} complete. To avoid rate limits, next image starts in ${remaining}s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          elapsed = Date.now() - startWait;
        }
      }
    }

    if (!isCancelled.current) {
        if (criticalError) {
            setError(criticalError.message);
        }
        setIsLoading(false);
        setLoadingMessage('');
    }
    // If cancelled, stop() has already handled state changes.
  }, [onSuccess, stop]);
  
  return { isLoading, loadingMessage, error, start, stop, setError };
};
