import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface ConversionResult {
  pantone: string;
  c: number;
  m: number;
  y: number;
  k: number;
  hex: string;
}

interface SnackbarState {
  show: boolean;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const PantoneConverter: React.FC = () => {
  const [pantoneInput, setPantoneInput] = useState<string>('');
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ show: false, message: '', type: 'success' });

  const showSnackbar = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const handleConvert = async () => {
    const lines = pantoneInput.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      setError('Please enter at least one Pantone color name.');
      return;
    }
     if (lines.length > 20) {
        showSnackbar('You can convert up to 20 colors at a time.', 'warning');
        return;
    }
    if (!process.env.API_KEY) {
      setError("API_KEY environment variable not set.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `For each Pantone color in the following list, provide the closest CMYK and HEX color values. Respond with an array of JSON objects. The list is: \n${lines.join('\n')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    pantone: { type: Type.STRING, description: 'The original Pantone color name from the input list.' },
                    c: { type: Type.NUMBER, description: 'Cyan value (0-100)' },
                    m: { type: Type.NUMBER, description: 'Magenta value (0-100)' },
                    y: { type: Type.NUMBER, description: 'Yellow value (0-100)' },
                    k: { type: Type.NUMBER, description: 'Key (black) value (0-100)' },
                    hex: { type: Type.STRING, description: 'The hex color code, e.g., #RRGGBB' },
                },
                required: ['pantone', 'c', 'm', 'y', 'k', 'hex'],
            }
          },
        },
      });

      const jsonResponse = JSON.parse(response.text);
      setResults(jsonResponse);
       if(jsonResponse.length > 0) {
        showSnackbar(`Successfully converted ${jsonResponse.length} colors.`, 'success');
      } else {
        showSnackbar('Could not find matches for the provided colors.', 'warning');
      }

    } catch (err) {
      console.error("Error converting Pantone color:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during conversion.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClear = () => {
    setPantoneInput('');
    setResults([]);
    setError(null);
  };

  const copyResultsTable = () => {
     if (results.length === 0) {
        showSnackbar('No results to copy.', 'warning');
        return;
    }
    const tableHeader = ['Pantone', 'C', 'M', 'Y', 'K', 'HEX'].join('\t');
    const tableContent = results.map(r => 
      [r.pantone, r.c, r.m, r.y, r.k, r.hex].join('\t')
    ).join('\n');
    
    const fullTable = `${tableHeader}\n${tableContent}`;
    
    navigator.clipboard.writeText(fullTable)
        .then(() => showSnackbar('Results copied to clipboard!'))
        .catch(() => showSnackbar('Failed to copy results.', 'error'));
  };

  const buttonBaseClasses = "px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryButtonClasses = "text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500";
  const secondaryButtonClasses = "text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-gray-500";
  const inputClasses = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  
  const numLines = pantoneInput.trim() ? pantoneInput.trim().split('\n').filter(l => l.trim()).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-bold text-indigo-300">Bulk Pantone to CMYK Converter</h3>
        <p className="text-sm text-gray-400">
          Enter one Pantone color name per line (up to 20) to get its equivalent CMYK and HEX values.
        </p>
        <div className="flex flex-col gap-3">
          <textarea
            value={pantoneInput}
            onChange={(e) => setPantoneInput(e.target.value)}
            placeholder="PANTONE 185 C&#10;11-0601 TCX&#10;Cool Gray 1 C"
            className={`${inputClasses} flex-grow p-2.5 min-h-[120px] font-mono`}
            disabled={isLoading}
            aria-label="Pantone color inputs, one per line"
            rows={5}
          />
          <div className="flex justify-center gap-4">
            <button onClick={handleConvert} className={`${buttonBaseClasses} ${primaryButtonClasses}`} disabled={isLoading || numLines === 0}>
              {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Converting...</span>
                  </div>
              ) : `Convert ${numLines > 0 ? numLines : ''} Colors`}
            </button>
            <button onClick={handleClear} className={`${buttonBaseClasses} ${secondaryButtonClasses}`} disabled={isLoading}>
                Clear
            </button>
          </div>
        </div>
        {error && !isLoading && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-md text-sm mt-4">
                <strong>Error:</strong> {error}
            </div>
        )}
      </div>
      
      {results.length > 0 && !isLoading && (
        <div className="bg-gray-800 p-6 rounded-lg animate-fade-in">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-green-300">Conversion Results ({results.length} colors)</h3>
             <button onClick={copyResultsTable} className={`${buttonBaseClasses} ${secondaryButtonClasses}`}>Copy Table</button>
          </div>
          <div className="mt-4 overflow-x-auto max-h-[40vh]">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50 sticky top-0 backdrop-blur-sm">
                    <tr>
                        <th scope="col" className="pl-4 pr-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Color</th>
                        <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pantone</th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">C</th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">M</th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Y</th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">K</th>
                        <th scope="col" className="pl-2 pr-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">HEX</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {results.map((r, i) => (
                        <tr key={i}>
                            <td className="pl-4 pr-2 py-2 whitespace-nowrap">
                                <div className="w-6 h-6 rounded border border-gray-600" style={{ backgroundColor: r.hex }}></div>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-white font-semibold">{r.pantone}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-cyan-300 font-mono text-center">{r.c}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-pink-300 font-mono text-center">{r.m}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-yellow-300 font-mono text-center">{r.y}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-300 font-mono text-center">{r.k}</td>
                            <td className="pl-2 pr-4 py-2 whitespace-nowrap text-sm text-gray-300 font-mono">{r.hex}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      <div 
        role="alert"
        aria-live="assertive"
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 z-50 ${snackbar.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'} ${
          snackbar.type === 'success' ? 'bg-green-600' : snackbar.type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
      }`}>
        {snackbar.message}
      </div>
    </div>
  );
};

export default PantoneConverter;
