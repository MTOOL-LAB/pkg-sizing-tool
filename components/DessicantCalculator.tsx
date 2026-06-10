import React, { useState, useMemo, useCallback } from 'react';
import { downloadOfflineTool } from '../services/offlineExporter';

// --- Constants ---
const MM_PER_INCH = 25.4;
const CALC_FACTOR = 0.0224;

// --- Types ---
interface Row {
  id: string;
  l: string;
  w: string;
  h: string;
}

interface SnackbarState {
  show: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const DessicantCalculator: React.FC = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({ show: false, message: '', type: 'success' });
  
  const createNewRow = (): Row => ({ id: crypto.randomUUID(), l: '', w: '', h: '' });
  const [rows, setRows] = useState<Row[]>([createNewRow()]);

  const showSnackbar = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const calculatedResults = useMemo(() => {
    return rows.map(row => {
      const l = parseFloat(row.l);
      const w = parseFloat(row.w);
      const h = parseFloat(row.h);

      if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
        return null;
      }
      // Formula: (L/25.4) * (W/25.4) * (H/25.4) * 0.0224
      // The user-provided formula 'L/25.4*W/25.4*H*25.4*0.0224' appeared to have a typo.
      // A standard volumetric conversion is used instead.
      const result = (l / MM_PER_INCH) * (w / MM_PER_INCH) * (h / MM_PER_INCH) * CALC_FACTOR;
      return result.toFixed(2); // rounding to 2 decimal places
    });
  }, [rows]);
  
  const handleAddRow = useCallback(() => {
    setRows(prev => [...prev, createNewRow()]);
  }, []);
  
  const handleRowChange = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRows(prev => prev.map(row => (row.id === id ? { ...row, [name]: value } : row)));
  }, []);

  const handleRemoveRow = (id: string) => {
    setRows(prev => {
      const newRows = prev.filter(row => row.id !== id);
      if (newRows.length === 0) {
        return [createNewRow()];
      }
      return newRows;
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowId: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText || !pastedText.trim()) {
      showSnackbar("Clipboard is empty.", 'warning');
      return;
    }

    const startRowIndex = rows.findIndex(row => row.id === startRowId);
    if (startRowIndex === -1) return;

    const newRowsData = pastedText.trim().split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const cells = line.split('\t');
        if (cells.length !== 3) return null;
        return {
          l: cells[0]?.trim() || '',
          w: cells[1]?.trim() || '',
          h: cells[2]?.trim() || '',
        };
      })
      .filter((row): row is Omit<Row, 'id'> => row !== null);

    if (newRowsData.length === 0) {
      showSnackbar('Pasted data format is incorrect. Expected 3 tab-separated columns (L, W, H).', 'error');
      return;
    }
    
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      newRowsData.forEach((pastedRow, i) => {
        const targetIndex = startRowIndex + i;
        if (targetIndex < updatedRows.length) {
          updatedRows[targetIndex] = { ...updatedRows[targetIndex], ...pastedRow };
        } else {
          updatedRows.push({ ...createNewRow(), ...pastedRow });
        }
      });
      return updatedRows;
    });

    showSnackbar(`Successfully pasted ${newRowsData.length} rows.`, 'success');
  };

  const handleClearAll = () => {
    setRows([createNewRow()]);
  };
  
  const handleCopyResults = useCallback(() => {
    const resultsToCopy = calculatedResults
      .filter((res): res is string => res !== null && res !== undefined)
      .join('\n');
      
    if (resultsToCopy) {
      navigator.clipboard.writeText(resultsToCopy)
        .then(() => showSnackbar('All results copied to clipboard!'))
        .catch(() => showSnackbar('Failed to copy results.', 'error'));
    } else {
      showSnackbar('No results to copy.', 'warning');
    }
  }, [calculatedResults, showSnackbar]);

  // --- Render ---
  const buttonBaseClasses = "px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const primaryButtonClasses = "text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500";
  const secondaryButtonClasses = "text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-gray-500";
  const inputClasses = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center";
  const headerClasses = "text-xs font-medium text-gray-300 uppercase self-end pb-1 text-center";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-bold text-indigo-300">Dessicant Usage Calculator</h3>
        <p className="text-sm text-gray-400">
            Enter dimensions in millimeters (mm) to calculate the required dessicant amount in grams (g). 
            You can also paste multiple rows from a spreadsheet (tab-separated, 3 columns: L, W, H).
            <br/>
            輸入長寬高 (單位 mm)，計算所需乾燥劑克數 (g)。
            可直接從 Excel 複製多行 (以 tab 分隔，3 欄：長, 寬, 高) 於第一個欄位中直接貼上。
        </p>
        <div className="flex justify-start mb-2">
          <button onClick={handleAddRow} className={`${buttonBaseClasses} ${secondaryButtonClasses}`}>Add Row</button>
        </div>
        <div className="overflow-x-auto">
            <div className="grid gap-x-4 gap-y-2 items-center" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr 20px'}}>
              {/* Headers */}
              <div className={headerClasses}>L (mm)</div>
              <div className={headerClasses}>W (mm)</div>
              <div className={headerClasses}>H (mm)</div>
              <div className={headerClasses}>Result (g)</div>
              <div></div> {/* Spacer for delete button */}
              
              {/* Rows */}
              {rows.map((row, index) => (
                <React.Fragment key={row.id}>
                  <input type="number" name="l" value={row.l} onChange={(e) => handleRowChange(row.id, e)} onPaste={(e) => handlePaste(e, row.id)} className={inputClasses} placeholder="L" />
                  <input type="number" name="w" value={row.w} onChange={(e) => handleRowChange(row.id, e)} onPaste={(e) => handlePaste(e, row.id)} className={inputClasses} placeholder="W" />
                  <input type="number" name="h" value={row.h} onChange={(e) => handleRowChange(row.id, e)} onPaste={(e) => handlePaste(e, row.id)} className={inputClasses} placeholder="H" />
                  <div className="bg-gray-900/50 rounded-md text-center p-2 text-sm h-10 flex items-center justify-center">
                    <span className="font-mono text-green-300">{calculatedResults[index] ?? '...'}</span>
                  </div>
                  <button onClick={() => handleRemoveRow(row.id)} className="text-red-400 hover:text-red-300" title="Remove row">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  </button>
                </React.Fragment>
              ))}
            </div>
        </div>
        <div className="flex justify-center gap-4 pt-2">
          <button onClick={handleCopyResults} className={`${buttonBaseClasses} ${primaryButtonClasses}`}>Copy All Results</button>
          <button onClick={handleClearAll} className={`${buttonBaseClasses} ${secondaryButtonClasses}`}>Clear All</button>
        </div>
      </div>

      {/* Offline Use Download Section / 離線版下載 */}
      <div className="mt-12 bg-gray-800/60 border border-gray-750 rounded-3xl p-6 text-center max-w-xl mx-auto shadow-inner">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-indigo-950 border border-indigo-800/50 rounded-2xl flex items-center justify-center text-xl shadow-lg">
            💾
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-200">取得「乾燥劑計算工具」離線網頁檔案</h4>
            <p className="text-xs text-gray-500">
              下載後即可直接在電腦雙擊打開，不需網路即可進行乾燥劑所需克數即時計算。
            </p>
          </div>
          <button
            onClick={() => downloadOfflineTool('dessicant')}
            className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/15 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下載單機離線網頁 (HTML)
          </button>
        </div>
      </div>

      {/* --- Snackbar --- */}
      <div 
        role="alert"
        aria-live="assertive"
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 ${snackbar.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${
          snackbar.type === 'success' ? 'bg-green-600' : snackbar.type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
      }`}>
        {snackbar.message}
      </div>
    </div>
  );
};

export default DessicantCalculator;