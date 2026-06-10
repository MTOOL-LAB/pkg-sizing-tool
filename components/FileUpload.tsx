import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
      // Reset input to allow re-uploading the same file
      e.target.value = '';
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative block w-full h-48 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-300 ${
          disabled
            ? 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed'
            : isDragging 
            ? 'border-indigo-400 bg-gray-800/50'
            : 'border-gray-500 hover:border-indigo-400 hover:bg-gray-800/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="mt-2 text-sm font-semibold text-gray-300">
              Drag & drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP supported</p>
        </div>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
};

export default FileUpload;