
import React, { useState, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import GenerateTab from './components/GenerateTab';
import EditTab from './components/EditTab';
import { GeneratedImage } from './types';
import { IconPhoto, IconEdit } from './components/Icons';

type Tab = 'generate' | 'edit';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [generatedImages, setGeneratedImages] = useLocalStorage<GeneratedImage[]>('generationHistory', []);
  const [imagesToEdit, setImagesToEdit] = useState<GeneratedImage[]>([]);

  const handleEditRequest = useCallback((image: GeneratedImage) => {
    setImagesToEdit(prev => {
        // Remove duplicate if it exists, then add the new image to the end for consistency.
        const existingImages = prev.filter(img => img.id !== image.id);
        const newImages = [...existingImages, image];
        // Ensure we only keep the last 8 images.
        return newImages.slice(-8);
    });
    setActiveTab('edit');
  }, []);

  const addGeneratedImages = useCallback((newImages: GeneratedImage[]) => {
    setGeneratedImages(prevImages => [...newImages, ...prevImages].slice(0, 12));
  }, [setGeneratedImages]);

  const clearGeneratedImages = useCallback(() => {
    setGeneratedImages([]);
  }, [setGeneratedImages]);

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        activeTab === tab 
          ? 'bg-indigo-600 text-white shadow-lg' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-black text-gray-200 font-sans">
      <header className="flex-shrink-0 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Imagen/NB Image Generation Editing Combo With Built-In Reference Styles
            </h1>
            <nav className="flex items-center gap-2 p-1 bg-gray-800 rounded-xl">
              <TabButton tab="generate" label="Generate" icon={<IconPhoto />} />
              <TabButton tab="edit" label="Edit" icon={<IconEdit />} />
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 overflow-hidden">
        <div className={`h-full ${activeTab === 'generate' ? '' : 'hidden'}`}>
          <GenerateTab 
            onImagesGenerated={addGeneratedImages}
            onEditRequest={handleEditRequest}
            generatedImages={generatedImages}
            onClearHistory={clearGeneratedImages}
          />
        </div>
        <div className={`h-full ${activeTab === 'edit' ? '' : 'hidden'}`}>
          <EditTab 
            imagesToEdit={imagesToEdit} 
            setImagesToEdit={setImagesToEdit} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;