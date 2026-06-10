import React, { useState, useRef, MouseEvent } from 'react';
import type { ProcessedImage } from '../types';

interface ImageProcessorProps {
  image: ProcessedImage;
  onToggleSelect: (id: string) => void;
  onRetry: (id: string, mode: 'remove_white' | 'enhanced' | 'masked', selection?: { x: number; y: number; width: number; height: number }) => void;
}

const ImageProcessor: React.FC<ImageProcessorProps> = ({ image, onToggleSelect, onRetry }) => {
  const { id, originalUrl, processedUrl, isSelected, status, error } = image;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanPoint = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // --- Selection Box State ---
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startDrawPoint = useRef({ x: 0, y: 0 });


  const resetPan = () => setPan({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 1);
    if (newZoom <= 1) {
      resetPan();
      setZoom(1);
    } else {
      setZoom(newZoom);
    }
  };
  
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Pan logic
    if (zoom > 1) {
      e.preventDefault();
      setIsPanning(true);
      startPanPoint.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }
    // Selection logic
    if (e.button === 0 && zoom <= 1) {
      e.preventDefault();
      const rect = imageContainerRef.current!.getBoundingClientRect();
      startDrawPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setIsDrawing(true);
      setSelection({ x: startDrawPoint.current.x, y: startDrawPoint.current.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
     // Pan logic
    if (isPanning && zoom > 1) {
      e.preventDefault();
      const newX = e.clientX - startPanPoint.current.x;
      const newY = e.clientY - startPanPoint.current.y;
      if (imageContainerRef.current) {
          const container = imageContainerRef.current;
          const imgWidth = container.offsetWidth * zoom;
          const imgHeight = container.offsetHeight * zoom;
          const maxPanX = Math.max(0, (imgWidth - container.offsetWidth) / 2);
          const maxPanY = Math.max(0, (imgHeight - container.offsetHeight) / 2);
          const clampedX = Math.max(-maxPanX, Math.min(maxPanX, newX));
          const clampedY = Math.max(-maxPanY, Math.min(maxPanY, newY));
          setPan({ x: clampedX, y: clampedY });
      } else {
          setPan({ x: newX, y: newY });
      }
      return;
    }
    // Selection logic
    if (isDrawing && zoom <= 1) {
        e.preventDefault();
        const rect = imageContainerRef.current!.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const x = Math.min(startDrawPoint.current.x, currentX);
        const y = Math.min(startDrawPoint.current.y, currentY);
        const width = Math.abs(currentX - startDrawPoint.current.x);
        const height = Math.abs(currentY - startDrawPoint.current.y);
        
        const clampedX = Math.max(0, x);
        const clampedY = Math.max(0, y);
        const clampedWidth = Math.min(width, rect.width - clampedX);
        const clampedHeight = Math.min(height, rect.height - clampedY);

        setSelection({ x: clampedX, y: clampedY, width: clampedWidth, height: clampedHeight });
    }
  };

  const handleMouseUpOrLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
        e.preventDefault();
        setIsPanning(false);
    }
    if (isDrawing) {
        e.preventDefault();
        setIsDrawing(false);
    }
  };

  const handleMaskedRetry = () => {
    if (!selection || selection.width < 10 || selection.height < 10) return;
    const container = imageContainerRef.current;
    if (!container) return;

    const selectionInPercent = {
        x: (selection.x / container.offsetWidth) * 100,
        y: (selection.y / container.offsetHeight) * 100,
        width: (selection.width / container.offsetWidth) * 100,
        height: (selection.height / container.offsetHeight) * 100,
    };
    onRetry(id, 'masked', selectionInPercent);
    setSelection(null); // Clear selection after using it
  };

  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70 rounded-lg">
      <div className="w-10 h-10 border-4 border-t-indigo-500 border-gray-600 rounded-full animate-spin"></div>
    </div>
  );
  
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-80 p-4 rounded-lg text-center">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-300 mb-2" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm font-semibold text-red-200">{message}</p>
    </div>
  );

  const zoomButtonClasses = "w-7 h-7 flex items-center justify-center bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500";
  
  const panAndZoomStyle = {
    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
    willChange: 'transform' as const
  };
  
  let cursorClass = 'cursor-default';
  if (zoom > 1) {
    cursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  } else if (status !== 'processing') {
    cursorClass = isDrawing ? 'cursor-crosshair' : 'cursor-crosshair';
  }
  
  const retryButtonClasses = "px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";


  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:shadow-2xl hover:scale-105">
      <div className="grid grid-cols-2 gap-px bg-gray-700">
        <div 
          ref={imageContainerRef}
          className={`relative overflow-hidden bg-gray-900 ${cursorClass}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          <img 
            src={originalUrl} 
            alt="Original" 
            className="w-full h-full object-contain transition-transform duration-100 ease-out" 
            style={panAndZoomStyle}
            draggable="false"
          />
           <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full pointer-events-none">ORIGINAL</div>
           {selection && zoom <= 1 && (
             <div
                className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/20 pointer-events-none"
                style={{
                  left: `${selection.x}px`,
                  top: `${selection.y}px`,
                  width: `${selection.width}px`,
                  height: `${selection.height}px`,
                }}
              />
           )}
        </div>
        <div 
            className={`relative bg-gray-900 overflow-hidden ${cursorClass}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
        >
          {status === 'processing' && <LoadingSpinner />}
          {status === 'error' && error && <ErrorDisplay message={error}/>}
          {status === 'success' && processedUrl && (
            <img 
              src={processedUrl} 
              alt="Processed" 
              className="w-full h-full object-contain transition-transform duration-100 ease-out" 
              style={panAndZoomStyle}
              draggable="false"
            />
          )}
          {status === 'pending' && (
             <div className="w-full h-full bg-gray-700"></div>
          )}
           <div className="absolute top-2 right-2 bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded-full pointer-events-none">WHITE BACKGROUND</div>
        </div>
      </div>
      <div className="p-4 bg-gray-800 flex flex-col gap-3">
         <label htmlFor={`checkbox-${id}`} className="flex items-center space-x-3 cursor-pointer">
          <input
            id={`checkbox-${id}`}
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(id)}
            disabled={status !== 'success'}
            className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-gray-300 font-medium truncate" title={image.originalFile.name}>{image.originalFile.name}</span>
        </label>
        <div className="flex items-center justify-between mt-2 flex-wrap gap-y-2">
            <div>
                 {(status === 'success' || status === 'error') && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => onRetry(id, 'remove_white')}
                            className={`${retryButtonClasses} text-sky-200 bg-sky-900/80 hover:bg-sky-800 focus:ring-sky-500`}
                            title="Ensure the background is solid white."
                        >
                            Fix Background
                        </button>
                        <button
                            onClick={() => onRetry(id, 'enhanced')}
                            className={`${retryButtonClasses} text-amber-200 bg-amber-900/80 hover:bg-amber-800 focus:ring-amber-500`}
                            title="Aggressively isolate subject on white."
                        >
                            Force Remove
                        </button>
                        <button
                          onClick={handleMaskedRetry}
                          disabled={!selection || selection.width < 10 || selection.height < 10}
                          className={`${retryButtonClasses} text-yellow-200 bg-yellow-900/80 hover:bg-yellow-800 focus:ring-yellow-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed`}
                          title="Draw a box on the original image, then click to place that area on white."
                        >
                          Retry with Selection
                        </button>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">Zoom: {Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomOut} disabled={zoom <= 1} className={zoomButtonClasses}>
                    -
                </button>
                <button onClick={handleZoomIn} disabled={zoom >= 3} className={zoomButtonClasses}>
                    +
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageProcessor;