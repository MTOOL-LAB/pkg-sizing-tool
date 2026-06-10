
import React, { useState, useCallback } from 'react';
import type { ProcessedImage } from '../types';
import { removeBackground } from '../services/geminiService';
import FileUpload from './FileUpload';
import ActionButtons from './ActionButtons';
import ImageProcessor from './ImageProcessor';
import { downloadOfflineTool } from '../services/offlineExporter';

interface SnackbarState {
  show: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

function BackgroundRemover() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ show: false, message: '', type: 'success' });

  const showSnackbar = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const MAX_IMAGES = 10;
    let filesToProcess = Array.from(files);

    if (filesToProcess.length > MAX_IMAGES) {
      showSnackbar(`一次最多處理 10 張圖片。將只處理前 10 張圖片。`, 'warning');
      filesToProcess = filesToProcess.slice(0, MAX_IMAGES);
    }

    setIsProcessing(true);

    const newImages: ProcessedImage[] = filesToProcess.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      isSelected: false,
      status: 'processing',
      error: null,
    }));

    setImages(prev => [...prev, ...newImages]);

    const CONCURRENCY_LIMIT = 10;
    const queue = [...newImages];

    const processImage = async (image: ProcessedImage) => {
      try {
        const processedBase64 = await removeBackground(image.originalFile, 'standard');
        const processedUrl = `data:image/png;base64,${processedBase64}`;
        setImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, processedUrl, status: 'success', isSelected: true } : img
          )
        );
      } catch (error) {
        console.error(`Failed to process image ${image.originalFile.name}:`, error);
        setImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, status: 'error', error: (error as Error).message } : img
          )
        );
      }
    };

    const workers = Array(CONCURRENCY_LIMIT).fill(null).map(async () => {
      while (queue.length > 0) {
        // Dequeue is atomic in single-threaded JS
        const imageToProcess = queue.shift();
        if (imageToProcess) {
          await processImage(imageToProcess);
        }
      }
    });

    await Promise.all(workers);

    setIsProcessing(false);
  };

  const handleRetry = useCallback(async (
    id: string, 
    mode: 'remove_white' | 'enhanced' | 'masked', 
    selection?: { x: number; y: number; width: number; height: number }
  ) => {
    const imageToRetry = images.find(img => img.id === id);
    if (!imageToRetry) return;

    // Set the specific image to processing state
    setImages(prev =>
        prev.map(img =>
            img.id === id ? { 
                ...img, 
                status: 'processing', 
                processedUrl: null, 
                error: null, 
                isSelected: false // Deselect on retry
            } : img
        )
    );

    try {
        const processedBase64 = await removeBackground(imageToRetry.originalFile, mode, selection);
        const processedUrl = `data:image/png;base64,${processedBase64}`;
        setImages(prev =>
            prev.map(img =>
                img.id === id ? { ...img, processedUrl, status: 'success', isSelected: true } : img
            )
        );
    } catch (error) {
        console.error(`Failed to re-process image ${imageToRetry.originalFile.name}:`, error);
        setImages(prev =>
            prev.map(img =>
                img.id === id ? { ...img, status: 'error', error: (error as Error).message } : img
            )
        );
    }
  }, [images]);

  const handleToggleSelect = useCallback((id: string) => {
    setImages(prev =>
      prev.map(img =>
        img.id === id ? { ...img, isSelected: !img.isSelected } : img
      )
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setImages(prev => prev.map(img => img.status === 'success' ? { ...img, isSelected: true } : img));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setImages(prev => prev.map(img => ({ ...img, isSelected: false })));
  }, []);

  const handleDownloadSelected = useCallback(() => {
    const selectedImages = images.filter(img => img.isSelected && img.processedUrl);
    selectedImages.forEach(image => {
      const link = document.createElement('a');
      link.href = image.processedUrl!;
      const nameParts = image.originalFile.name.split('.');
      nameParts.pop(); // remove extension
      const name = nameParts.join('.');
      link.download = `${name}_no_bg.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }, [images]);
  
  const handleClearAll = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    images.forEach(image => URL.revokeObjectURL(image.originalUrl));
    setImages([]);
  }, [images]);

  const processedImagesExist = images.some(img => img.status === 'success');
  const selectedImagesExist = images.some(img => img.isSelected);
  
  const processedCount = images.filter(img => img.status === 'success' || img.status === 'error').length;
  const progressPercentage = images.length > 0 ? (processedCount / images.length) * 100 : 0;

  return (
    <>
      <div className="w-full max-w-4xl mx-auto mb-6 px-4">
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex flex-col md:flex-row items-center justify-center gap-3 shadow-sm text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-6 md:w-6 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex flex-col items-center md:items-start">
                <p className="text-yellow-200 font-semibold text-sm md:text-base">
                    Testing mode: Currently there are many issues and it is unstable.
                </p>
                <p className="text-yellow-200/80 font-medium text-sm md:text-base mt-0.5 md:self-center">
                    測試中，目前運作上還有許多問題且不穩定。
                </p>
            </div>
        </div>
      </div>

      <FileUpload onFilesSelected={handleFilesSelected} disabled={isProcessing} />
      
      <div className="w-full max-w-4xl mx-auto px-4 text-center -mt-2 mb-2">
          <p className="text-xs text-gray-400">
            Note: Due to API limitations, a maximum of 10 images can be processed at once. If more than 10 are uploaded, only the first 10 will be processed.
            <br />
            備註：由於 API 限制，單次最多處理 10 張圖片。若上傳超過 10 張，將只處理前 10 張。
          </p>
      </div>

      {isProcessing && images.length > 0 && (
        <div className="w-full max-w-4xl mx-auto p-4">
          <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-indigo-300">Processing Images...</span>
            <span className="text-sm font-medium text-indigo-300">{processedCount} / {images.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-linear" 
              style={{ width: `${progressPercentage}%` }}>
            </div>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <ActionButtons
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onDownload={handleDownloadSelected}
          onClearAll={handleClearAll}
          canSelect={processedImagesExist && !isProcessing}
          canDownload={selectedImagesExist && !isProcessing}
          canClear={images.length > 0 && !isProcessing}
        />
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map(image => (
            <ImageProcessor
              key={image.id}
              image={image}
              onToggleSelect={handleToggleSelect}
              onRetry={handleRetry}
            />
          ))}
        </div>
      ) : (
         <div className="text-center py-16 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No images uploaded</h3>
            <p className="mt-1 text-sm">Start by uploading some images to begin.</p>
         </div>
      )}

      {/* Offline Use Download Section / 離線版下載 */}
      <div className="mt-12 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 text-center max-w-xl mx-auto shadow-inner">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-indigo-950 border border-indigo-800/50 rounded-2xl flex items-center justify-center text-xl shadow-lg">
            💾
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-200">取得「去背功能」離線網頁檔案</h4>
            <p className="text-xs text-gray-400">
              下載後即可直接在電腦雙擊打開，不需網路即可在瀏覽器本機快速去背。
            </p>
          </div>
          <button
            onClick={() => downloadOfflineTool('remover')}
            className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/15 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下載單機離線網頁 (HTML)
          </button>
        </div>
      </div>

      <div 
        role="alert"
        aria-live="assertive"
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 z-50 ${snackbar.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'} ${
          snackbar.type === 'success' ? 'bg-green-600' : snackbar.type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
      }`}>
        {snackbar.message}
      </div>
    </>
  );
}

export default BackgroundRemover;
