import React, { useState, useMemo, useCallback, DragEvent, useRef, useEffect } from 'react';
import { GeneratedImage, Style, AspectRatio } from '../types';
import Spinner from './Spinner';
import { editImage, elaboratePrompt, sanitizeImage } from '../services/geminiService';
import { IconUpload, IconSparkles, IconClose, IconStop, IconReset, IconBrain, IconDownload, IconDice } from './Icons';
import { ART_STYLES, NUM_IMAGES_OPTIONS, RANDOM_PROMPTS } from '../constants';
import Select from './Select';
import { resolveRandomChoices } from '../services/promptUtils';
import ToggleSwitch from './ToggleSwitch';
import useLocalStorage from '../hooks/useLocalStorage';
import ImageModal from './ImageModal';
import AspectRatioSelect from './AspectRatioSelect';
import ImageGallery from './ImageGallery';
import { useImageProcessor } from '../hooks/useImageProcessor';

interface EditTabProps {
  imagesToEdit: GeneratedImage[];
  setImagesToEdit: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
}

const EditTab: React.FC<EditTabProps> = ({ imagesToEdit, setImagesToEdit }) => {
  const [editedImages, setEditedImages] = useLocalStorage<GeneratedImage[]>('editHistory', []);
  const [prompt, setPrompt] = useLocalStorage('editPrompt', '');
  const [referenceStyleName, setReferenceStyleName] = useLocalStorage('referenceStyle', 'No style');
  const [numImages, setNumImages] = useLocalStorage('editNumImages', 1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('source');
  const [elaborate, setElaborate] = useLocalStorage('elaboratePrompt', false);
  const [scratchpad, setScratchpad] = useLocalStorage('editScratchpad', '');
  const [showScratchpad, setShowScratchpad] = useLocalStorage('showEditScratchpad', false);
  const [seed, setSeed] = useLocalStorage('editSeed', '');
  
  const [isElaborating, setIsElaborating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  const originalPromptRef = useRef('');
  const finalPromptRef = useRef('');

  const { isLoading, loadingMessage, error, start: startEditing, stop: stopEditing, setError } = useImageProcessor({
    onSuccess: (newImageData: { base64: string, mimeType: string, width: number, height: number }) => {
      const newEditedImage: GeneratedImage = {
        id: crypto.randomUUID(),
        base64: newImageData.base64,
        prompt: finalPromptRef.current,
        mimeType: newImageData.mimeType as 'image/jpeg' | 'image/png',
        width: newImageData.width,
        height: newImageData.height,
      };
      setEditedImages(prevImages => [newEditedImage, ...prevImages].slice(0, 12));
    }
  });

  useEffect(() => {
    if (imagesToEdit.length !== 1) {
      setAspectRatio('source');
    }
  }, [imagesToEdit.length, setAspectRatio]);

  const defaultPrompt = imagesToEdit.length > 0
    ? 'Make the person from @img1 wear sunglasses.'
    : 'A majestic lion in a futuristic city, rendered using @style';

  const groupedStyles = useMemo(() => {
    return ART_STYLES.reduce((acc, style) => {
      acc[style.category] = [...(acc[style.category] || []), style];
      return acc;
    }, {} as Record<string, Style[]>);
  }, []);
  
  const handleReset = useCallback(() => {
    setImagesToEdit([]);
    setEditedImages([]);
    setPrompt('');
    setReferenceStyleName('No style');
    setNumImages(1);
    setElaborate(false);
    setAspectRatio('source');
    setSeed('');
    originalPromptRef.current = '';
    setError(null);
    setScratchpad('');
    setShowScratchpad(false);
  }, [setImagesToEdit, setEditedImages, setPrompt, setReferenceStyleName, setNumImages, setElaborate, setAspectRatio, setSeed, setScratchpad, setShowScratchpad, setError]);

  const processFiles = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 8 - imagesToEdit.length;
    if (remainingSlots <= 0) {
        setError("Maximum number of images (8) reached.");
        return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
        setError(`You can only upload ${remainingSlots} more image(s). ${files.length - remainingSlots} files were ignored.`);
    } else {
        setError(null);
    }

    const newImages: GeneratedImage[] = [];
    
    // Process files sequentially to avoid race conditions with state updates
    for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
            continue; // Skip non-image files
        }

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            // Sanitize the image to handle EXIF orientation and potential corruption
            const sanitized = await sanitizeImage(dataUrl, file.type);
            
            const { width, height } = await new Promise<{width: number, height: number}>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.onerror = reject;
                img.src = `data:${sanitized.mimeType};base64,${sanitized.base64}`;
            });

            newImages.push({
                id: crypto.randomUUID(),
                base64: sanitized.base64,
                mimeType: sanitized.mimeType,
                prompt: 'Uploaded image',
                width,
                height,
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred while processing a file.';
            setError(message);
            // Stop processing further files if one fails, as it might be a systematic issue.
            break; 
        }
    }

    if (newImages.length > 0) {
        setImagesToEdit(prev => [...prev, ...newImages].slice(-8)); // Use slice to be extra safe
        if (editedImages.length > 0) setEditedImages([]);
    }
  }, [imagesToEdit.length, editedImages.length, setImagesToEdit, setEditedImages, setError]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        processFiles(Array.from(event.target.files));
    }
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
    } else if (!e.relatedTarget) {
        setIsDragging(false);
    }
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); 
    if(!isDragging) setIsDragging(true);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };


  const handleRemoveImage = (id: string) => {
    setImagesToEdit(prev => prev.filter(img => img.id !== id));
  };
  
  const handleDownloadSourceImage = (image: GeneratedImage) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `source-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.src = `data:${image.mimeType};base64,${image.base64}`;
  };

  const handleElaborateToggle = async (checked: boolean) => {
    setElaborate(checked);
    if (checked) {
        // Always save the current state before elaborating.
        originalPromptRef.current = prompt;
        
        const promptToElaborate = prompt.trim() || defaultPrompt;

        setIsElaborating(true);
        setError(null);
        try {
            const elaborated = await elaboratePrompt(promptToElaborate);
            setPrompt(elaborated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Elaboration failed.');
            setElaborate(false);
            // On failure, restore the original prompt.
            setPrompt(originalPromptRef.current);
        } finally {
            setIsElaborating(false);
        }
    } else {
        // When toggling off, restore the saved original prompt.
        setPrompt(originalPromptRef.current);
    }
  };
  
  const handleRandomPrompt = () => {
    const random = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setPrompt(random);
  };

  const handleEdit = async () => {
    setError(null);
    let finalPrompt = prompt || defaultPrompt;
    let finalNegativePrompt = '';

    const imgRefRegex = /@img[1-8]/g;
    if (imgRefRegex.test(finalPrompt) && imagesToEdit.length === 0) {
        setError("Your prompt uses an @img reference, but no images have been uploaded. Please upload an image or remove the reference.");
        return;
    }

    try {
      const selectedStyle = ART_STYLES.find(s => s.name === referenceStyleName);

      if (finalPrompt.includes('@style')) {
        if (selectedStyle && selectedStyle.name !== 'No style') {
            const stylePrompt = selectedStyle.prompt
                .replace(/\[input\.description\]/g, '')
                .replace(/, ,/g, ',')
                .trim()
                .replace(/^,/, '')
                .trim();
            const resolvedStylePrompt = resolveRandomChoices(stylePrompt);
            finalPrompt = finalPrompt.replace('@style', resolvedStylePrompt);
        } else {
            finalPrompt = finalPrompt.replace('@style', '').trim();
        }
      }
      
      if (selectedStyle && selectedStyle.name !== 'No style') {
        finalNegativePrompt = resolveRandomChoices(selectedStyle.negative.replace(/\[input\.negative\]/g, ''));
      }
      
      finalPromptRef.current = finalPrompt;

      const processFunction = () => editImage(imagesToEdit, finalPrompt, aspectRatio, finalNegativePrompt, seed ? parseInt(seed, 10) : undefined);
      
      await startEditing(processFunction, numImages, 'Applying edit');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during preparation.');
    }
  };
  
  const handleStop = () => {
    stopEditing();
  };
  
  const handleEditResultImage = (image: GeneratedImage) => {
    if (imagesToEdit.length >= 8) {
      setError("Maximum number of source images (8) reached. Please remove an image before adding a new one.");
      return;
    }
    setImagesToEdit(prev => {
      const existingImages = prev.filter(img => img.id !== image.id);
      const newImages = [...existingImages, image];
      return newImages.slice(-8);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 overflow-y-auto flex-grow pr-4 space-y-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Editor Settings</h2>
                  <button onClick={handleReset} title="Reset Settings" className="text-gray-400 hover:text-white transition-colors"><IconReset /></button>
              </div>
              <button
                  onClick={() => setShowScratchpad(!showScratchpad)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                  {showScratchpad ? 'Hide' : 'Show'} Scratchpad
              </button>
          </div>
          
          {showScratchpad && (
              <div className="relative">
                  <textarea
                      value={scratchpad}
                      onChange={(e) => setScratchpad(e.target.value)}
                      rows={6}
                      placeholder="A little notepad for you to keep good prompts and stuff. It &quot;remembers&quot; the text that you put in it even after you refresh/close this page.&#10;&#10;The text will only be forgotten if you clear your browser's site data or click on the Reset Settings button in the Editor Settings."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <div className="absolute top-2 right-2">
                      <button onClick={() => setScratchpad('')} title="Clear Scratchpad" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                          <IconBrain />
                      </button>
                  </div>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Source Images ({imagesToEdit.length}/8)</label>
            <div 
              className={`relative p-4 border-2 border-dashed rounded-lg transition-colors duration-200 max-h-56 overflow-y-auto ${isDragging ? 'border-indigo-500 bg-indigo-900/30' : 'border-gray-600'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className={`${isDragging ? 'pointer-events-none' : ''}`}>
                {imagesToEdit.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      {imagesToEdit.map((image, index) => {
                        const aspectRatio = image.width && image.height ? `${image.width} / ${image.height}` : '1 / 1';
                        return (
                          <div key={image.id}>
                              <div className="text-center text-xs font-mono text-gray-400 mb-1">
                                  @img{index + 1}
                              </div>
                              <div 
                                  className="relative group cursor-pointer"
                                  style={{ aspectRatio }}
                                  onClick={() => setSelectedImage(image)}
                              >
                                  <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`Source ${index + 1}`} className="w-full h-full object-cover rounded-md border-2 border-transparent group-hover:border-indigo-500 transition-colors"/>
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveImage(image.id);
                                      }} 
                                      className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all transform-gpu group-hover:scale-110 focus:opacity-100 z-10"
                                      title="Remove image"
                                  >
                                      <IconClose />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadSourceImage(image);
                                    }}
                                    className="absolute bottom-1 right-1 bg-black/50 hover:bg-indigo-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all transform-gpu group-hover:scale-110 focus:opacity-100 z-10"
                                    title="Download as PNG"
                                  >
                                    <IconDownload className="w-5 h-5" />
                                  </button>
                              </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {imagesToEdit.length < 8 && (
                    <label htmlFor="file-upload" className="relative block w-full cursor-pointer bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-10 px-4 rounded-lg text-center transition-colors">
                        <div className="flex flex-col items-center justify-center">
                            <IconUpload className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">Drag &amp; drop or click</span>
                            <span className="text-sm font-medium">to upload images ({8 - imagesToEdit.length} left)</span>
                        </div>
                        <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg" multiple onChange={handleFileChange} disabled={imagesToEdit.length >= 8}/>
                    </label>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Upload up to 8 images. You can refer to them as @img1, @img2, etc. in your prompt.</p>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
              <div className="flex items-center gap-2">
                  {isElaborating && <Spinner />}
                  <span className="text-xs text-gray-400">Elaborate Prompt</span>
                  <ToggleSwitch checked={elaborate} onChange={handleElaborateToggle} disabled={isElaborating} />
              </div>
            </div>
             <div className="relative">
                <textarea
                  id="edit-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={9}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                  placeholder={defaultPrompt}
                  disabled={isElaborating}
                />
                <div className="absolute top-2 right-2 space-y-2">
                     <button onClick={handleRandomPrompt} title="Random Prompt" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                        <IconDice />
                    </button>
                    <button onClick={() => setPrompt('')} title="Clear Prompt" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                        <IconBrain />
                    </button>
                </div>
              </div>
              <div className="space-y-4 mt-4">
                  <p className="text-xs text-gray-400 px-1">
                    Tip: You can use @style in your prompt to insert the selected Reference Style.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                      <Select label="How many images?" value={String(numImages)} onChange={e => setNumImages(Number(e.target.value))}>
                          {NUM_IMAGES_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                      </Select>
                      <Select label="Reference Style" value={referenceStyleName} onChange={e => setReferenceStyleName(e.target.value)}>
                        {Object.entries(groupedStyles).map(([category, styles]) => (
                          <optgroup key={category} label={category}>
                            {styles.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </optgroup>
                        ))}
                      </Select>
                  </div>
                  <div>
                    <AspectRatioSelect 
                      label="Aspect Ratio" 
                      value={aspectRatio} 
                      onChange={setAspectRatio}
                      disabled={imagesToEdit.length !== 1} 
                    />
                    <p className="text-xs text-gray-400 mt-1 px-1">
                      When using a single source image, you can select an aspect ratio to expand the canvas. The AI will attempt to fill the new space (outpainting).
                    </p>
                  </div>
                  <div>
                    <label htmlFor="edit-seed" className="block text-sm font-medium text-gray-300 mb-1">Seed</label>
                    <div className="relative">
                        <input
                            type="number"
                            id="edit-seed"
                            min="0"
                            value={seed}
                            onChange={e => setSeed(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 pr-24 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="Random"
                        />
                        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-2">
                             <button onClick={() => setSeed('')} title="Clear Seed" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                                <IconBrain />
                            </button>
                            <button onClick={() => setSeed(String(Math.floor(Math.random() * 2147483647)))} title="Generate Random Seed" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                                <IconDice />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-1">Leave blank for a random seed.</p>
                  </div>
              </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
        
        <div className="flex-shrink-0">
          {isLoading ? (
              <button
                  onClick={handleStop}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 text-lg shadow-lg"
              >
                  <IconStop />
                  Stop
              </button>
          ) : (
              <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 text-lg shadow-lg"
              >
                  <IconSparkles />
                  Apply Edit
              </button>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden">
        <div className="flex justify-between items-center flex-shrink-0">
            <h3 className="text-xl font-bold text-white">Edit History</h3>
            <button
                onClick={() => setEditedImages([])}
                disabled={editedImages.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Clear History
            </button>
        </div>
        <div className="relative w-full flex-grow overflow-y-auto pr-4">
            {isLoading && editedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 p-8 rounded-2xl border-2 border-dashed border-gray-700 text-center">
                    <Spinner large={true} />
                    <p className="text-white mt-4">{loadingMessage}</p>
                </div>
            ) : (
                <>
                    {isLoading && (
                        <div className="absolute inset-0 bg-gray-900/70 flex flex-col items-center justify-center z-10 rounded-2xl">
                            <Spinner large={true} />
                            <p className="text-white mt-4">{loadingMessage}</p>
                        </div>
                    )}
                    <ImageGallery 
                        images={editedImages} 
                        onEdit={handleEditResultImage} 
                        onImageClick={setSelectedImage}
                        emptyStateText="Edited images will appear here."
                    />
                </>
            )}
        </div>
      </div>
      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
};

export default EditTab;