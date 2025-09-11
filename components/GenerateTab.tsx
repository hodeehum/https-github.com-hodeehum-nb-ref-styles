
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ART_STYLES, ART_STYLES_2, COLORS, EXTRA_COLORS, NUM_IMAGES_OPTIONS, RANDOM_PROMPTS, GUIDANCE_OPTIONS, ASPECT_RATIO_OPTIONS } from '../constants';
import useLocalStorage from '../hooks/useLocalStorage';
import { Style, GeneratedImage, AspectRatio } from '../types';
import { constructFinalPrompt } from '../services/promptUtils';
import { generateImage, elaboratePrompt } from '../services/geminiService';
import ImageGallery from './ImageGallery';
import Spinner from './Spinner';
import { IconSparkles, IconDice, IconBrain, IconStop, IconReset } from './Icons';
import Select from './Select';
import ToggleSwitch from './ToggleSwitch';
import AspectRatioSelect from './AspectRatioSelect';
import ImageModal from './ImageModal';
import { useImageProcessor } from '../hooks/useImageProcessor';

interface GenerateTabProps {
  onImagesGenerated: (images: GeneratedImage[]) => void;
  onEditRequest: (image: GeneratedImage) => void;
  generatedImages: GeneratedImage[];
  onClearHistory: () => void;
}

const defaultValues = {
  description: 'A majestic lion in a futuristic city',
  negative: 'low quality, lowres, blurry, out of focus, motion blur, distortion, grainy, camera shake, pixelated, jpeg artifacts, banding, posterization, noise, overexposed, underexposed, harsh shadows, blown highlights, washed out, oversaturated, oversharpened, haloing, color fringing, chromatic aberration, moire, tiling, duplicates, repeating patterns, out of frame, bad crop, cut off, frame, border, watermark, signature, bad anatomy, deformed, disfigured, malformed limbs, wrong hands, fused fingers, extra fingers, missing fingers, broken wrists, unnatural pose, distorted proportions, uncanny valley, wonky eyes, lazy eye, cross-eye, lopsided face, messy perspective, depth map errors, floating objects, clipping, intersecting limbs, mangled clothing, messy background, clutter, distracting elements, poor composition, misspelled anatomy, logo, text, misspelled text, caption',
  style1Name: 'No style',
  style2Name: 'No style',
  color: 'none',
  extraColor: 'none',
  numImages: 1,
  guidance: 7,
  aspectRatio: '1:1' as AspectRatio,
  scratchpad: '',
  showScratchpad: false,
  elaborate: false,
};

const GenerateTab: React.FC<GenerateTabProps> = ({ onImagesGenerated, onEditRequest, generatedImages, onClearHistory }) => {
  const [description, setDescription] = useLocalStorage('description', defaultValues.description);
  const [negative, setNegative] = useLocalStorage('negative', defaultValues.negative);
  const [style1Name, setStyle1Name] = useLocalStorage('style1', defaultValues.style1Name);
  const [style2Name, setStyle2Name] = useLocalStorage('style2', defaultValues.style2Name);
  const [color, setColor] = useLocalStorage('color', defaultValues.color);
  const [extraColor, setExtraColor] = useLocalStorage('extraColor', defaultValues.extraColor);
  const [numImages, setNumImages] = useLocalStorage('numImages', defaultValues.numImages);
  const [guidance, setGuidance] = useLocalStorage('guidance', defaultValues.guidance);
  const [seed, setSeed] = useLocalStorage('generateSeed', '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultValues.aspectRatio);
  const [scratchpad, setScratchpad] = useLocalStorage('scratchpad', defaultValues.scratchpad);
  const [showScratchpad, setShowScratchpad] = useLocalStorage('showScratchpad', defaultValues.showScratchpad);
  const [elaborate, setElaborate] = useLocalStorage('elaboratePromptGenerate', defaultValues.elaborate);
  
  const [isElaborating, setIsElaborating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  const originalPromptRef = useRef('');
  const finalPromptRef = useRef('');

  const { isLoading, loadingMessage, error, start: startGeneration, stop: stopGeneration, setError } = useImageProcessor({
    onSuccess: (newImageData: { base64: string, mimeType: string, width: number, height: number }) => {
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        base64: newImageData.base64,
        prompt: finalPromptRef.current,
        mimeType: newImageData.mimeType as 'image/jpeg' | 'image/png',
        width: newImageData.width,
        height: newImageData.height,
      };
      onImagesGenerated([newImage]);
    },
  });

  useEffect(() => {
    if (!NUM_IMAGES_OPTIONS.includes(numImages)) {
      setNumImages(1);
    }
  }, [numImages, setNumImages]);

  const style1 = useMemo(() => ART_STYLES.find(s => s.name === style1Name) || ART_STYLES[0], [style1Name]);
  const style2 = useMemo(() => ART_STYLES_2.find(s => s.name === style2Name) || ART_STYLES_2[0], [style2Name]);

  const handleGenerate = async () => {
    setError(null);
    try {
      const promptToUse = description || defaultValues.description;
      const negativeToUse = negative || defaultValues.negative;
      const { finalPrompt, finalNegativePrompt } = constructFinalPrompt(promptToUse, negativeToUse, style1, style2, color, extraColor, guidance);
      
      finalPromptRef.current = finalPrompt;

      const processFunction = () => generateImage(finalPrompt, aspectRatio, finalNegativePrompt, seed ? parseInt(seed, 10) : undefined);
      
      await startGeneration(processFunction, numImages);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during preparation.');
    }
  };

  const handleStop = () => {
    stopGeneration();
  };

  const handleElaborateToggle = async (checked: boolean) => {
    setElaborate(checked);
    if (checked) {
        // Always save the current state before elaborating.
        originalPromptRef.current = description;

        const promptToElaborate = description.trim() || defaultValues.description;

        setIsElaborating(true);
        setError(null);
        try {
            const elaborated = await elaboratePrompt(promptToElaborate);
            setDescription(elaborated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Elaboration failed.');
            setElaborate(false);
            // On failure, restore the original prompt.
            setDescription(originalPromptRef.current);
        } finally {
            setIsElaborating(false);
        }
    } else {
        // When toggling off, restore the saved original prompt.
        setDescription(originalPromptRef.current);
    }
  };

  const handleRandomPrompt = () => {
    const random = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setDescription(random);
  };

  const handleReset = useCallback(() => {
    setDescription(defaultValues.description);
    setNegative(defaultValues.negative);
    setStyle1Name(defaultValues.style1Name);
    setStyle2Name(defaultValues.style2Name);
    setColor(defaultValues.color);
    setExtraColor(defaultValues.extraColor);
    setNumImages(defaultValues.numImages);
    setGuidance(defaultValues.guidance);
    setSeed('');
    setAspectRatio(defaultValues.aspectRatio);
    setScratchpad(defaultValues.scratchpad);
    setShowScratchpad(defaultValues.showScratchpad);
    setElaborate(defaultValues.elaborate);
    originalPromptRef.current = defaultValues.description;
    setError(null);
  }, [setDescription, setNegative, setStyle1Name, setStyle2Name, setColor, setExtraColor, setNumImages, setGuidance, setSeed, setAspectRatio, setScratchpad, setShowScratchpad, setElaborate, setError]);
  
  const groupedStyles = useMemo(() => {
    return ART_STYLES.reduce((acc, style) => {
      acc[style.category] = [...(acc[style.category] || []), style];
      return acc;
    }, {} as Record<string, Style[]>);
  }, []);

  const groupedStyles2 = useMemo(() => {
    return ART_STYLES_2.reduce((acc, style) => {
      acc[style.category] = [...(acc[style.category] || []), style];
      return acc;
    }, {} as Record<string, Style[]>);
  }, []);

  const generateAspectRatioOptions = useMemo(() => ASPECT_RATIO_OPTIONS.filter(opt => opt.value !== 'source'), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 overflow-y-auto flex-grow pr-4 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">Generator Settings</h2>
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
                        placeholder="A little notepad for you to keep good prompts and stuff. It &quot;remembers&quot; the text that you put in it even after you refresh/close this page.&#10;&#10;The text will only be forgotten if you clear your browser's site data or click on the Reset Settings button in the Generator Settings."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <div className="absolute top-2 right-2">
                        <button onClick={() => setScratchpad('')} title="Clear Scratchpad" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                            <IconBrain />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Prompt</label>
                    <div className="flex items-center gap-2">
                        {isElaborating && <Spinner />}
                        <span className="text-xs text-gray-400">Elaborate Prompt</span>
                        <ToggleSwitch checked={elaborate} onChange={handleElaborateToggle} disabled={isElaborating} />
                    </div>
                </div>
                <div className="relative">
                    <textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={6}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="A majestic lion in a futuristic city"
                        disabled={isElaborating}
                    />
                    <div className="absolute top-2 right-2 space-y-2">
                        <button onClick={handleRandomPrompt} title="Random Prompt" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                            <IconDice />
                        </button>
                        <button onClick={() => setDescription('')} title="Clear Prompt" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                            <IconBrain />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <label htmlFor="negative" className="block text-sm font-medium text-gray-300 mb-1">Negative Prompt</label>
                <div className="relative">
                    <textarea 
                        id="negative" 
                        value={negative} 
                        onChange={e => setNegative(e.target.value)} 
                        rows={4} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" 
                        placeholder={defaultValues.negative} 
                    />
                    <div className="absolute top-2 right-2">
                        <button onClick={() => setNegative('')} title="Clear Negative Prompt" className="block bg-gray-600 p-2 rounded-md hover:bg-gray-500 transition-colors text-gray-300">
                            <IconBrain />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Style 1" value={style1Name} onChange={e => setStyle1Name(e.target.value)}>
                    {Object.entries(groupedStyles).map(([category, styles]) => (
                        <optgroup key={category} label={category}>
                            {styles.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </optgroup>
                    ))}
                </Select>
                <Select label="Style 2" value={style2Name} onChange={e => setStyle2Name(e.target.value)}>
                    {Object.entries(groupedStyles2).map(([category, styles]) => (
                        <optgroup key={category} label={category}>
                            {styles.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </optgroup>
                    ))}
                </Select>
                <Select label="Color" value={color} onChange={e => setColor(e.target.value)}>
                    {Object.keys(COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Select label="Extra Color" value={extraColor} onChange={e => setExtraColor(e.target.value)}>
                    {Object.keys(EXTRA_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                 <Select label="How many images?" value={String(numImages)} onChange={e => setNumImages(Number(e.target.value))}>
                    {NUM_IMAGES_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
                <Select label="Guidance" value={String(guidance)} onChange={e => setGuidance(Number(e.target.value))}>
                    {GUIDANCE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </Select>
            </div>
             <div>
                <AspectRatioSelect label="Aspect Ratio" value={aspectRatio} onChange={setAspectRatio} options={generateAspectRatioOptions} />
            </div>
             <div>
                <label htmlFor="generate-seed" className="block text-sm font-medium text-gray-300 mb-1">Seed</label>
                <div className="relative">
                    <input
                        type="number"
                        id="generate-seed"
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
                    onClick={handleGenerate}
                    disabled={isLoading || isElaborating}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 text-lg shadow-lg"
                >
                    <IconSparkles />
                    Generate
                </button>
            )}
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden">
        <div className="flex justify-between items-center flex-shrink-0">
            <h3 className="text-xl font-bold text-white">Generation History</h3>
            <button
                onClick={onClearHistory}
                disabled={generatedImages.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Clear History
            </button>
        </div>
        <div className="relative w-full flex-grow overflow-y-auto pr-4">
            {isLoading && generatedImages.length === 0 ? (
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
                        images={generatedImages} 
                        onEdit={onEditRequest} 
                        onImageClick={setSelectedImage}
                        emptyStateText="Generated images will appear here."
                    />
                </>
            )}
        </div>
      </div>
      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
};

export default GenerateTab;
