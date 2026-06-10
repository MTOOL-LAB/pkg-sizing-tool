
import React from 'react';

interface ActionButtonsProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDownload: () => void;
  onClearAll: () => void;
  canSelect: boolean;
  canDownload: boolean;
  canClear: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSelectAll,
  onDeselectAll,
  onDownload,
  onClearAll,
  canSelect,
  canDownload,
  canClear,
}) => {
  const buttonBaseClasses = "px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const primaryButtonClasses = `text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-indigo-500`;
  const secondaryButtonClasses = `text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-gray-500`;
  const destructiveButtonClasses = `text-red-200 bg-red-900/80 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-red-600`;
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-800/50 rounded-lg my-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={!canSelect}
            className={`${buttonBaseClasses} ${secondaryButtonClasses}`}
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            disabled={!canSelect}
            className={`${buttonBaseClasses} ${secondaryButtonClasses}`}
          >
            Deselect All
          </button>
        </div>
        <div className="flex items-center gap-2">
           <button
            onClick={onClearAll}
            disabled={!canClear}
            className={`${buttonBaseClasses} ${destructiveButtonClasses}`}
          >
            Clear All
          </button>
          <button
            onClick={onDownload}
            disabled={!canDownload}
            className={`${buttonBaseClasses} ${primaryButtonClasses}`}
          >
            Download Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;
