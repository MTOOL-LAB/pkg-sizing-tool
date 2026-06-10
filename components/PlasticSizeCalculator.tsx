
import React, { useState, useMemo, useCallback } from 'react';
import { downloadOfflineTool } from '../services/offlineExporter';

// --- Types ---
interface ProductRow {
  id: string;
  l: string; // Product Depth/Length (Front-Back)
  w: string; // Product Width (Left-Right)
  h: string; // Product Height (Top-Bottom)
  openingSide: 'width' | 'length'; // Which dimension of the bag has the opening
}

interface SnackbarState {
  show: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

// --- 3D Visualization Helper ---
const ProductDiagram: React.FC<{ row: ProductRow }> = ({ row }) => {
  const l = parseFloat(row.l) || 80;  // Depth
  const w = parseFloat(row.w) || 120; // Width
  const h = parseFloat(row.h) || 60;  // Height

  // Normalize dimensions
  const maxDim = Math.max(l, w, h);
  const scale = 85 / maxDim;
  const sl = l * scale;
  const sw = w * scale;
  const sh = h * scale;

  const origin = { x: 100, y: 135 };
  const angle = Math.PI / 6;
  const dxW = Math.cos(angle);
  const dyW = Math.sin(angle);
  const dxL = -Math.cos(angle);
  const dyL = Math.sin(angle);

  const getPoint = (px: number, py: number, pz: number) => ({
    x: origin.x + px * dxW + py * dxL,
    y: origin.y + px * dyW + py * dyL - pz
  });

  const p = [
    getPoint(0, 0, 0),    // 0: Bottom Front
    getPoint(sw, 0, 0),   // 1: Bottom Right
    getPoint(sw, sl, 0),  // 2: Bottom Back
    getPoint(0, sl, 0),   // 3: Bottom Left
    getPoint(0, 0, sh),   // 4: Top Front
    getPoint(sw, 0, sh),  // 5: Top Right
    getPoint(sw, sl, sh), // 6: Top Back
    getPoint(0, sl, sh)   // 7: Top Left
  ];

  const renderPath = (indices: number[], color: string, fill = "none", dash = "", width = "1.5") => (
    <path
      key={indices.join('-')}
      d={`M ${p[indices[0]].x} ${p[indices[0]].y} ${indices.slice(1).map(i => `L ${p[i].x} ${p[i].y}`).join(' ')} Z`}
      stroke={color}
      fill={fill}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinejoin="round"
      className="transition-all duration-300"
    />
  );

  return (
    <div className="flex flex-col items-center bg-gray-900/80 rounded-2xl p-6 border border-gray-600 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3D Packaging View</span>
      </div>
      
      <svg width="220" height="200" viewBox="0 0 200 200" className="drop-shadow-xl">
        {/* Hidden internal lines */}
        {renderPath([1, 2, 3], "rgba(156, 163, 175, 0.15)", "none", "4 4")}
        {renderPath([2, 6], "rgba(156, 163, 175, 0.15)", "none", "4 4")}
        
        {/* Product Box Main Faces */}
        {renderPath([0, 1, 5, 4], "rgba(99, 102, 241, 0.6)", "rgba(99, 102, 241, 0.05)")} 
        {renderPath([0, 3, 7, 4], "rgba(99, 102, 241, 0.6)", "rgba(99, 102, 241, 0.05)")} 
        {renderPath([4, 5, 6, 7], "rgba(99, 102, 241, 0.8)", "rgba(99, 102, 241, 0.1)")}  

        {/* Labels */}
        <text x={(p[0].x + p[1].x)/2} y={(p[0].y + p[1].y)/2 + 16} fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">Width (W)</text>
        <text x={(p[0].x + p[3].x)/2 - 18} y={(p[0].y + p[3].y)/2 + 16} fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">Depth (L)</text>
        <text x={p[1].x + 12} y={p[1].y + (p[5].y - p[1].y)/2} fill="#818cf8" fontSize="9" fontWeight="bold">Height (H)</text>

        {/* Opening Indicators (Animation removed as requested) */}
        {row.openingSide === 'width' ? (
          <g>
            {renderPath([4, 5, 6, 7], "#10b981", "rgba(16, 185, 129, 0.3)", "", "3")}
            <text x={p[6].x} y={p[6].y - 12} fill="#10b981" fontSize="10" fontWeight="900" textAnchor="middle">BAG MOUTH (W)</text>
          </g>
        ) : (
          <g>
            {renderPath([0, 3, 7, 4], "#10b981", "rgba(16, 185, 129, 0.3)", "", "3")}
            <text x={p[3].x - 40} y={p[3].y - 10} fill="#10b981" fontSize="10" fontWeight="900" textAnchor="middle">SIDE MOUTH (L)</text>
          </g>
        )}
      </svg>
      
      <div className="mt-4 px-3 py-1 bg-green-950/30 border border-green-800/50 rounded-full">
        <p className="text-[11px] text-green-400 font-medium text-center">
          <span className="font-bold">綠色區塊</span> 為袋口開口處
        </p>
      </div>
    </div>
  );
};

const PlasticSizeCalculator: React.FC = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({ show: false, message: '', type: 'success' });
  const [margin, setMargin] = useState('10'); 
  const [foldOverlap, setFoldOverlap] = useState('30'); 
  const [activeRowIdx, setActiveRowIdx] = useState(0);
  
  const createNewRow = (): ProductRow => ({ 
    id: crypto.randomUUID(), 
    l: '', w: '', h: '', openingSide: 'width' 
  });
  
  const [rows, setRows] = useState<ProductRow[]>([createNewRow()]);

  const showSnackbar = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, show: false })), 3000);
  }, []);

  const results = useMemo(() => {
    const m = parseFloat(margin) || 0;
    const fold = parseFloat(foldOverlap) || 0;
    
    return rows.map(row => {
      const pl = parseFloat(row.l); 
      const pw = parseFloat(row.w); 
      const ph = parseFloat(row.h); 

      if (isNaN(pl) || isNaN(pw) || isNaN(ph) || pl <= 0 || pw <= 0 || ph <= 0) return null;

      let flatW, flatL, gussetW, gussetL, gussetS;
      if (row.openingSide === 'width') {
        flatW = pw + ph + m;
        flatL = pl + ph + m + fold;
        gussetW = pw + m;
        gussetS = ph + m;
        gussetL = pl + (ph / 2) + m + fold;
      } else {
        flatW = pl + ph + m;
        flatL = pw + ph + m + fold;
        gussetW = pl + m;
        gussetS = ph + m;
        gussetL = pw + (ph / 2) + m + fold;
      }

      return {
        flat: `${Math.ceil(flatW)} x ${Math.ceil(flatL)}`,
        gusset: `${Math.ceil(gussetW)} x ${Math.ceil(gussetL)} x ${Math.ceil(gussetS)}`
      };
    });
  }, [rows, margin, foldOverlap]);
  
  const handleAddRow = useCallback(() => {
    setRows(prev => [...prev, createNewRow()]);
    setTimeout(() => setActiveRowIdx(rows.length), 0);
  }, [rows.length]);
  
  const handleRowChange = useCallback((id: string, name: string, value: string, idx: number) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, [name]: value } : row)));
    setActiveRowIdx(idx);
  }, []);

  const handleRemoveRow = (id: string, idx: number) => {
    setRows(prev => {
      const newRows = prev.filter(row => row.id !== id);
      if (newRows.length === 0) {
        setActiveRowIdx(0);
        return [createNewRow()];
      }
      if (idx <= activeRowIdx) setActiveRowIdx(Math.max(0, activeRowIdx - 1));
      return newRows;
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowId: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText || !pastedText.trim()) return;

    const startRowIndex = rows.findIndex(row => row.id === startRowId);
    if (startRowIndex === -1) return;

    const newRowsData = pastedText.trim().split('\n')
      .map(line => {
        const cells = line.split('\t');
        if (cells.length < 3) return null;
        return {
          w: cells[0]?.trim() || '',
          l: cells[1]?.trim() || '',
          h: cells[2]?.trim() || '',
          openingSide: (cells[3]?.trim().toLowerCase().includes('l')) ? 'length' : 'width'
        } as ProductRow;
      })
      .filter((row): row is ProductRow => row !== null);

    if (newRowsData.length === 0) {
      showSnackbar('無效的貼上格式，請確保有 W, L, H 三欄。', 'error');
      return;
    }
    
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      newRowsData.forEach((pastedRow, i) => {
        const targetIndex = startRowIndex + i;
        if (targetIndex < updatedRows.length) {
          updatedRows[targetIndex] = { ...updatedRows[targetIndex], ...pastedRow, id: updatedRows[targetIndex].id };
        } else {
          updatedRows.push({ ...pastedRow, id: crypto.randomUUID() });
        }
      });
      return updatedRows;
    });
    showSnackbar(`已從剪貼簿匯入 ${newRowsData.length} 筆資料`);
  };

  const handleClearAll = () => {
    if (window.confirm("確定要清空所有資料嗎？")) {
      setRows([createNewRow()]);
      setActiveRowIdx(0);
    }
  };
  
  const handleCopyResults = (type: 'flat' | 'gusset') => {
    const text = results
      .map(res => res ? (type === 'flat' ? res.flat : res.gusset) : '')
      .filter(t => t !== '')
      .join('\n');
    
    if (text) {
      navigator.clipboard.writeText(text).then(() => showSnackbar('結果已複製至剪貼簿'));
    }
  };

  const inputBaseClasses = "block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-center h-10 transition-all";
  const headerClasses = "text-[11px] font-bold text-gray-500 uppercase tracking-tighter text-center mb-1";
  const resultContainerClasses = "rounded-lg text-center p-2 text-[13px] h-10 flex flex-col items-center justify-center font-mono border transition-all duration-200 overflow-hidden";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="bg-gray-800 p-5 sm:p-8 rounded-[2.5rem] space-y-8 shadow-2xl border border-gray-700">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Plastic Bag Sizing</h3>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Dimension & Logic Definitions</p>
              </div>
            </div>
            
            {/* Logic Definitions Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-950/20 border border-indigo-500/30 p-5 rounded-2xl shadow-inner">
                <div className="space-y-2">
                    <p className="text-xs font-black text-indigo-400 uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Product Dimensions / 產品尺寸 (輸入)
                    </p>
                    <ul className="text-[13px] text-gray-300 space-y-1 pl-3.5 border-l border-indigo-800/50">
                        <li>• <b className="text-indigo-200">Width (W):</b> Left-to-Right 左右寬度</li>
                        <li>• <b className="text-indigo-200">Depth (L):</b> Front-to-Back 前後深度</li>
                        <li>• <b className="text-indigo-200">Height (H):</b> Base-to-Top 產品高度</li>
                    </ul>
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-black text-emerald-400 uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Plastic Bag Dimensions / 袋子尺寸 (輸出)
                    </p>
                    <ul className="text-[13px] text-gray-300 space-y-1 pl-3.5 border-l border-emerald-800/50">
                        <li>• <b className="text-emerald-200">Bag Width (寬):</b> Flat width (usually the opening side) 袋子平放後的左右寬度</li>
                        <li>• <b className="text-emerald-200">Bag Length (長):</b> Flat length (from mouth to bottom) 袋子平放後的上下長度</li>
                        <li>• <b className="text-emerald-200">Opening (袋口):</b> Edge where the bag is open 預設為 Width 邊有開口</li>
                    </ul>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900/40 border border-gray-700/50 p-4 rounded-2xl">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Global Margin / 預留量 (mm)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="50" value={margin} onChange={(e) => setMargin(e.target.value)} className="flex-grow accent-indigo-500" />
                  <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="w-16 bg-gray-800 border-none rounded-lg text-center font-bold text-indigo-400 h-8" />
                </div>
              </div>
              <div className="bg-gray-900/40 border border-gray-700/50 p-4 rounded-2xl">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Fold Overlap / 反摺量 (mm)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={foldOverlap} onChange={(e) => setFoldOverlap(e.target.value)} className="flex-grow accent-indigo-500" />
                  <input type="number" value={foldOverlap} onChange={(e) => setFoldOverlap(e.target.value)} className="w-16 bg-gray-800 border-none rounded-lg text-center font-bold text-indigo-400 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky 3D Preview */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-4">
              <ProductDiagram row={rows[activeRowIdx]} />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-gray-700/50 pt-6">
          <button 
            onClick={handleAddRow} 
            className="group px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <span className="text-xl leading-none transition-transform">+</span>
            新增資料列
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleCopyResults('flat')} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-xs font-bold transition-all">複製平口袋清單</button>
            <button onClick={() => handleCopyResults('gusset')} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-xs font-bold transition-all">複製立體袋清單</button>
            <button onClick={handleClearAll} className="px-4 py-2.5 border border-red-900/30 text-red-400 hover:bg-red-950/20 rounded-xl text-xs font-bold transition-all">清空全部</button>
          </div>
        </div>

        {/* Calculation Table */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="grid gap-x-3 gap-y-4 items-center min-w-[950px] pb-4 px-1" style={{gridTemplateColumns: 'minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) 160px minmax(130px, 1.4fr) minmax(160px, 1.8fr) 40px'}}>
            
            {/* Headers */}
            <div className={headerClasses}>Width (W) 寬</div>
            <div className={headerClasses}>Depth (L) 深</div>
            <div className={headerClasses}>Height (H) 高</div>
            <div className={headerClasses}>Opening 袋口位置</div>
            <div className={headerClasses}>Result: Flat (寬 x 長)</div>
            <div className={headerClasses}>Result: Gusset (寬 x 長 x 側)</div>
            <div></div>

            {/* Rows */}
            {rows.map((row, index) => {
              const isActive = activeRowIdx === index;
              return (
                <React.Fragment key={row.id}>
                  <div className={`transition-all duration-200 ${isActive ? 'scale-105' : ''}`}>
                    <input type="number" name="w" value={row.w} onFocus={() => setActiveRowIdx(index)} onChange={(e) => handleRowChange(row.id, 'w', e.target.value, index)} onPaste={(e) => handlePaste(e, row.id)} className={`${inputBaseClasses} ${isActive ? 'ring-2 ring-indigo-500 border-indigo-500 bg-gray-900 shadow-xl' : 'bg-gray-800/50'}`} placeholder="寬" />
                  </div>
                  <div className={`transition-all duration-200 ${isActive ? 'scale-105' : ''}`}>
                    <input type="number" name="l" value={row.l} onFocus={() => setActiveRowIdx(index)} onChange={(e) => handleRowChange(row.id, 'l', e.target.value, index)} onPaste={(e) => handlePaste(e, row.id)} className={`${inputBaseClasses} ${isActive ? 'ring-2 ring-indigo-500 border-indigo-500 bg-gray-900 shadow-xl' : 'bg-gray-800/50'}`} placeholder="深" />
                  </div>
                  <div className={`transition-all duration-200 ${isActive ? 'scale-105' : ''}`}>
                    <input type="number" name="h" value={row.h} onFocus={() => setActiveRowIdx(index)} onChange={(e) => handleRowChange(row.id, 'h', e.target.value, index)} onPaste={(e) => handlePaste(e, row.id)} className={`${inputBaseClasses} ${isActive ? 'ring-2 ring-indigo-500 border-indigo-500 bg-gray-900 shadow-xl' : 'bg-gray-800/50'}`} placeholder="高" />
                  </div>
                  
                  <div className={`transition-all duration-200 ${isActive ? 'scale-105' : ''}`}>
                    <select 
                      value={row.openingSide} 
                      onFocus={() => setActiveRowIdx(index)}
                      onChange={(e) => handleRowChange(row.id, 'openingSide', e.target.value as any, index)} 
                      className={`block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm text-white focus:ring-2 focus:ring-indigo-500 text-xs text-center h-10 transition-all cursor-pointer ${isActive ? 'bg-gray-900 ring-2 ring-indigo-500' : 'bg-gray-800/50'}`}
                    >
                      <option value="width">Width Edge (W+H) 寬邊</option>
                      <option value="length">Length Edge (L+H) 長邊</option>
                    </select>
                  </div>

                  {/* Result Areas */}
                  <div className={`${resultContainerClasses} ${isActive ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-gray-700/50 bg-gray-900/30'}`}>
                    <span className={`font-bold ${results[index] ? 'text-emerald-400' : 'text-gray-600'}`}>
                      {results[index]?.flat || '-- x --'}
                    </span>
                    {results[index] && (
                        <span className="text-[9px] text-emerald-600/70 font-sans font-black uppercase tracking-widest mt-0.5">
                           {row.openingSide === 'width' ? 'Top-Open' : 'Side-Open'}
                        </span>
                    )}
                  </div>
                  
                  <div className={`${resultContainerClasses} ${isActive ? 'border-indigo-500/50 bg-indigo-950/20 shadow-lg' : 'border-gray-700/50 bg-gray-900/30'}`}>
                    <span className={`font-bold ${results[index] ? 'text-indigo-400' : 'text-gray-600'}`}>
                      {results[index]?.gusset || '-- x -- x --'}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleRemoveRow(row.id, index)} 
                    className="group w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}} />

      {/* Offline Use Download Section / 離線版下載 */}
      <div className="mt-12 bg-gray-800/60 border border-gray-750 rounded-[2rem] p-8 text-center max-w-xl mx-auto shadow-inner">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-indigo-950 border border-indigo-800/50 rounded-2xl flex items-center justify-center text-xl shadow-lg">
            💾
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-200">取得「塑膠袋打樣尺寸計算」離線網頁檔案</h4>
            <p className="text-xs text-gray-400">
              下載後即可直接在電腦雙擊打開，完全離線使用 3D 包裝動態預覽、平口/立體打樣尺寸批量計算、與 Excel 匯入。
            </p>
          </div>
          <button
            onClick={() => downloadOfflineTool('plasticSize')}
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
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-white font-bold shadow-2xl transition-all duration-500 z-[100] backdrop-blur-md flex items-center gap-3 ${snackbar.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'} ${snackbar.type === 'success' ? 'bg-emerald-600/90 border border-emerald-400/30' : 'bg-red-600/90 border border-red-400/30'}`}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${snackbar.type === 'success' ? 'bg-emerald-300' : 'bg-red-300'} animate-ping`}></div>
        {snackbar.message}
      </div>
    </div>
  );
};

export default PlasticSizeCalculator;
