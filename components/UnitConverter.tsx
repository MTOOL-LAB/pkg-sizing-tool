import React, { useState } from 'react';
import { downloadOfflineTool } from '../services/offlineExporter';

// --- Constants ---
const CM_PER_INCH = 2.54;
const LBS_PER_KG = 2.20462;

// --- Types ---
interface Result {
  l: string;
  w: string;
  h: string;
  sizeUnit: string;
  weight: string;
  weightUnit: string;
}

interface BulkRow {
  id: string;
  l: string;
  w: string;
  h: string;
  weight: string;
  sizeUnit: 'cm' | 'in';
  weightUnit: 'kg' | 'lbs';
}

interface SnackbarState {
  show: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const UnitConverter: React.FC = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({ show: false, message: '', type: 'success' });
  const [decimalPlaces, setDecimalPlaces] = useState(1);

  // --- Bulk Mode State ---
  const createNewBulkRow = (): BulkRow => ({
    id: crypto.randomUUID(),
    l: '', w: '', h: '', weight: '',
    sizeUnit: 'cm', weightUnit: 'kg'
  });
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([createNewBulkRow()]);
  const [bulkResults, setBulkResults] = useState<Result[]>([]);

  const showSnackbar = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };
  
  const copyToClipboard = async (text: string, entity: string) => {
    if (text && text.trim()) {
      try {
        await navigator.clipboard.writeText(text);
        showSnackbar(`${entity} copied to clipboard!`);
      } catch (err) {
        showSnackbar('Failed to copy text.', 'error');
      }
    } else {
      showSnackbar(`Nothing to copy for ${entity}.`, 'warning');
    }
  };

  const handleAddBulkRow = () => {
    setBulkRows(prev => [...prev, createNewBulkRow()]);
  };

  const handleRemoveBulkRow = (id: string) => {
    setBulkRows(prev => {
        const newRows = prev.filter(row => row.id !== id);
        // Ensure there's always at least one row
        if (newRows.length === 0) {
            return [createNewBulkRow()];
        }
        return newRows;
    });
  };
  
  const handleBulkRowChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBulkRows(prev => prev.map(row => row.id === id ? { ...row, [name]: value } : row));
  };
  
  const handleSetAllSystem = (system: 'metric' | 'imperial') => {
    setBulkRows(prev => prev.map(row => ({
      ...row,
      sizeUnit: system === 'metric' ? 'cm' : 'in',
      weightUnit: system === 'metric' ? 'kg' : 'lbs',
    })));
  };

  const handleBulkPaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowId: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText || !pastedText.trim()) {
      showSnackbar("Clipboard is empty or contains only whitespace.", 'warning');
      return;
    }

    const startRowIndex = bulkRows.findIndex(row => row.id === startRowId);
    if (startRowIndex === -1) return;

    let skippedCount = 0;
    const newRowsData = pastedText.trim().split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const cells = line.split('\t');
        if (cells.length !== 4 && cells.length !== 6) {
          skippedCount++;
          return null;
        }

        const l = cells[0]?.trim() || '';
        const w = cells[1]?.trim() || '';
        const h = cells[2]?.trim() || '';
        let weight: string, sizeUnit: 'cm' | 'in' = 'cm', weightUnit: 'kg' | 'lbs' = 'kg';

        if (cells.length === 4) {
          weight = cells[3]?.trim() || '';
        } else { // 6 columns
          const sizeUnitRaw = cells[3]?.trim().toLowerCase();
          weight = cells[4]?.trim() || '';
          const weightUnitRaw = cells[5]?.trim().toLowerCase();
          if (sizeUnitRaw === 'in') sizeUnit = 'in';
          if (weightUnitRaw === 'lbs') weightUnit = 'lbs';
        }
        
        return { l, w, h, weight, sizeUnit, weightUnit };
      })
      .filter((row): row is Omit<BulkRow, 'id'> => row !== null);

    if (newRowsData.length === 0) {
      showSnackbar('Pasted data format is incorrect. Expected 4 or 6 tab-separated columns per row.', 'error');
      return;
    }

    setBulkRows(prevRows => {
        const updatedRows = [...prevRows];
        newRowsData.forEach((pastedRow, i) => {
            const targetIndex = startRowIndex + i;
            if (targetIndex < updatedRows.length) {
                updatedRows[targetIndex] = { ...updatedRows[targetIndex], ...pastedRow };
            } else {
                updatedRows.push({ ...createNewBulkRow(), ...pastedRow });
            }
        });
        return updatedRows;
    });

    let message = `Successfully pasted ${newRowsData.length} rows.`;
    if (skippedCount > 0) {
      message += ` Skipped ${skippedCount} invalid rows.`;
    }
    showSnackbar(message, 'success');
  };

  const handleBulkConvert = () => {
    const results: Result[] = [];
    const format = (num: number) => num.toFixed(decimalPlaces);
    let invalidRowCount = 0;

    for (const row of bulkRows) {
      const { l: lStr, w: wStr, h: hStr, weight: weightStr, sizeUnit: sizeUnitIn, weightUnit: weightUnitIn } = row;
      
      if (!lStr && !wStr && !hStr && !weightStr) continue;

      const lIn = parseFloat(lStr);
      const wIn = parseFloat(wStr);
      const hIn = parseFloat(hStr);
      const weightIn = parseFloat(weightStr);

      if (isNaN(lIn) || isNaN(wIn) || isNaN(hIn) || isNaN(weightIn)) {
          invalidRowCount++;
          continue;
      }

      let lOut: number, wOut: number, hOut: number, weightOut: number, sizeUnitOut: string, weightUnitOut: string;
      
      if (sizeUnitIn === 'cm') {
        lOut = lIn / CM_PER_INCH;
        wOut = wIn / CM_PER_INCH;
        hOut = hIn / CM_PER_INCH;
        sizeUnitOut = "in";
      } else {
        lOut = lIn * CM_PER_INCH;
        wOut = wIn * CM_PER_INCH;
        hOut = hIn * CM_PER_INCH;
        sizeUnitOut = "cm";
      }

      if (weightUnitIn === 'kg') {
        weightOut = weightIn * LBS_PER_KG;
        weightUnitOut = "lbs";
      } else {
        weightOut = weightIn / LBS_PER_KG;
        weightUnitOut = "kg";
      }

      results.push({
        l: format(lOut), w: format(wOut), h: format(hOut), sizeUnit: sizeUnitOut,
        weight: format(weightOut), weightUnit: weightUnitOut
      });
    }
    setBulkResults(results);

    if (results.length > 0) {
        let message = `Successfully converted ${results.length} rows.`;
        if (invalidRowCount > 0) {
            message += ` Skipped ${invalidRowCount} rows with non-numeric values.`;
        }
        showSnackbar(message, 'success');
    } else {
      showSnackbar('No valid data to convert.', 'warning');
    }
  };

  const handleBulkClear = () => {
    setBulkRows([createNewBulkRow()]);
    setBulkResults([]);
  };

  const copyBulkTable = () => {
    const tableContent = bulkResults.map(r => 
      [r.l, r.w, r.h, r.sizeUnit, r.weight, r.weightUnit].join('\t')
    ).join('\n');
    copyToClipboard(tableContent, 'Table content');
  };

  // --- Render ---
  const buttonBaseClasses = "px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const primaryButtonClasses = "text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500";
  const secondaryButtonClasses = "text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-gray-500";
  const inputClasses = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center";
  const selectClasses = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const headerClasses = "text-xs font-medium text-gray-300 uppercase self-end pb-1 text-center";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-indigo-300">Bulk Dimension & Weight Converter</h3>
        </div>
        <p className="text-sm text-gray-400">
            Manually enter data or paste multiple rows from a spreadsheet (tab-separated). Expected formats are 4 columns (L, W, H, Weight) or 6 columns (L, W, H, Size Unit, Weight, Weight Unit).
            <br/>
            可手動輸入，或直接從 Excel 複製多行（以 tab 分隔）於第一個欄位中直接貼上。
            支持 4 欄 (長, 寬, 高, 重量) 或 6 欄 (長, 寬, 高, 尺寸單位, 重量, 重量單位) 格式。
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 border-b border-gray-700 pb-4">
            <div className="flex gap-2">
                <button onClick={() => handleSetAllSystem('metric')} className={`${buttonBaseClasses} ${secondaryButtonClasses} py-1 px-3`}>Set all to: Metric (cm/kg)</button>
                <button onClick={() => handleSetAllSystem('imperial')} className={`${buttonBaseClasses} ${secondaryButtonClasses} py-1 px-3`}>Set all to: Imperial (in/lbs)</button>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="decimal-places" className="text-sm text-gray-300">Precision:</label>
                <select 
                  id="decimal-places"
                  value={decimalPlaces} 
                  onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                  className={`${selectClasses} py-1 text-sm w-20 text-center`}
                  aria-label="Select number of decimal places for results"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
            </div>
        </div>

        <div className="flex justify-start pt-2">
            <button onClick={handleAddBulkRow} className={`${buttonBaseClasses} ${secondaryButtonClasses}`}>Add Row</button>
        </div>
        
        <div className="overflow-x-auto pt-2">
            <div className="grid gap-x-4 gap-y-2 items-center" style={{gridTemplateColumns: '1fr 1fr 1fr 0.6fr 1fr 0.6fr 20px'}}>
              {/* Headers */}
              <div className={headerClasses}>L</div>
              <div className={headerClasses}>W</div>
              <div className={headerClasses}>H</div>
              <div className={headerClasses}>Size Unit</div>
              <div className={headerClasses}>Weight</div>
              <div className={headerClasses}>Weight Unit</div>
              <div></div> {/* Spacer for delete button */}
              
              {/* Rows */}
              {bulkRows.map((row) => (
                <React.Fragment key={row.id}>
                  <input type="number" name="l" value={row.l} onChange={(e) => handleBulkRowChange(row.id, e)} onPaste={(e) => handleBulkPaste(e, row.id)} className={inputClasses} placeholder="L"/>
                  <input type="number" name="w" value={row.w} onChange={(e) => handleBulkRowChange(row.id, e)} onPaste={(e) => handleBulkPaste(e, row.id)} className={inputClasses} placeholder="W"/>
                  <input type="number" name="h" value={row.h} onChange={(e) => handleBulkRowChange(row.id, e)} onPaste={(e) => handleBulkPaste(e, row.id)} className={inputClasses} placeholder="H"/>
                  <select name="sizeUnit" value={row.sizeUnit} onChange={(e) => handleBulkRowChange(row.id, e)} className={`${selectClasses} text-center`}>
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                  <input type="number" name="weight" value={row.weight} onChange={(e) => handleBulkRowChange(row.id, e)} onPaste={(e) => handleBulkPaste(e, row.id)} className={inputClasses} placeholder="Weight"/>
                  <select name="weightUnit" value={row.weightUnit} onChange={(e) => handleBulkRowChange(row.id, e)} className={`${selectClasses} text-center`}>
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                  <button onClick={() => handleRemoveBulkRow(row.id)} className="text-red-400 hover:text-red-300" title="Remove row">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  </button>
                </React.Fragment>
              ))}
            </div>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={handleBulkConvert} className={`${buttonBaseClasses} ${primaryButtonClasses}`}>Convert</button>
          <button onClick={handleBulkClear} className={`${buttonBaseClasses} ${secondaryButtonClasses}`}>Clear All</button>
        </div>
      </div>
      {/* --- Bulk Mode Results --- */}
      {bulkResults.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-bold text-green-300">Bulk Results ({bulkResults.length} rows)</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50 sticky top-0">
                <tr>{['L', 'W', 'H', 'Size Unit', 'Weight', 'Weight Unit'].map(h => <th key={h} scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {bulkResults.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{r.l}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{r.w}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{r.h}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{r.sizeUnit}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{r.weight}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{r.weightUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button onClick={copyBulkTable} className={`${buttonBaseClasses} ${secondaryButtonClasses}`}>Copy Table for Excel</button>
          </div>
        </div>
      )}
      
      {/* Offline Use Download Section / 離線版下載 */}
      <div className="mt-12 bg-gray-800/60 border border-gray-750 rounded-3xl p-6 text-center max-w-xl mx-auto shadow-inner">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-indigo-950 border border-indigo-800/50 rounded-2xl flex items-center justify-center text-xl shadow-lg">
            💾
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-200">取得「單位轉換工具」離線網頁檔案</h4>
            <p className="text-xs text-gray-500">
              下載後即可直接在電腦雙擊打開，不需網路即可進行公英制批量換算及 Excel 貼上功能。
            </p>
          </div>
          <button
            onClick={() => downloadOfflineTool('converter')}
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

export default UnitConverter;