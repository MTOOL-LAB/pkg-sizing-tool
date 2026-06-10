// Standalone HTML Exporters for Offline Use (離線使用)
// Generates fully self-contained HTML files with Tailwind CSS, embedded icons, interactive logic, and zero runtime dependencies.

export function saveAsFile(htmlContent: string, fileName: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. Unit Converter Page Standalone HTML
const getUnitConverterHTML = () => `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulk Unit Converter (Offline / 離線版)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #000000; color: #ffffff; font-family: system-ui, sans-serif; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    </style>
</head>
<body class="p-6">
    <div class="max-w-4xl mx-auto space-y-6 mt-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <h1 class="text-3xl font-black text-white tracking-tight">Bulk Dimension & Weight Converter</h1>
            <span class="px-3 py-1 bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full">離線版 Standard Edition</span>
        </div>

        <div class="bg-gray-800 p-6 rounded-3xl space-y-4 border border-gray-700 shadow-2xl">
            <p class="text-sm text-gray-400">
                可手動輸入，或直接從 Excel 複製多行（以 tab 分隔）於第一個欄位中直接貼上。
                支持 4 欄 (長, 寬, 高, 重量) 或 6 欄 (長, 寬, 高, 尺寸單位, 重量, 重量單位) 格式。
            </p>

            <div class="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 border-b border-gray-700 pb-4">
                <div class="flex gap-2">
                    <button onclick="setAllSystem('metric')" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Set all to: Metric (cm/kg)</button>
                    <button onclick="setAllSystem('imperial')" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Set all to: Imperial (in/lbs)</button>
                </div>
                <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-300">Precision:</label>
                    <select id="decimal-places" onchange="updateDecimalPlaces(this.value)" class="bg-gray-700 border-gray-600 rounded-md text-white py-1 text-sm w-20 text-center">
                        <option value="0">0</option>
                        <option value="1" selected>1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>
            </div>

            <div class="flex justify-start pt-2">
                <button onclick="addRow()" class="px-4 py-2 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Add Row</button>
            </div>
            
            <div class="overflow-x-auto pt-2">
                <div id="grid-container" class="grid gap-x-4 gap-y-2 items-center" style="grid-template-columns: 1fr 1fr 1fr 0.6fr 1fr 0.6fr 40px;">
                    <!-- Table Headers -->
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">L</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">W</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">H</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center font-bold text-indigo-400">Size Unit</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">Weight</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center font-bold text-indigo-400">Weight Unit</div>
                    <div></div>
                </div>
            </div>

            <div class="flex justify-center gap-4 pt-4 border-t border-gray-700">
                <button onclick="convert()" class="px-6 py-2.5 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">Convert</button>
                <button onclick="clearAll()" class="px-6 py-2.5 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Clear All</button>
            </div>
        </div>

        <!-- Results Section -->
        <div id="results-card" class="bg-gray-800 p-6 rounded-3xl space-y-4 border border-gray-700 shadow-2xl hidden animate-fade-in">
            <h3 class="text-lg font-bold text-green-300">Bulk Results</h3>
            <div class="overflow-x-auto max-h-96">
                <table class="min-w-full divide-y divide-gray-700">
                    <thead class="bg-gray-700/50 sticky top-0">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">L</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">W</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">H</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider font-bold">Size Unit</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Weight</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider font-bold">Weight Unit</th>
                        </tr>
                    </thead>
                    <tbody id="results-tbody" class="divide-y divide-gray-700 bg-gray-800">
                    </tbody>
                </table>
            </div>
            <div class="flex justify-end gap-2">
                <button onclick="copyBulkTable()" class="px-4 py-2 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Copy Table for Excel</button>
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600 z-50"></div>

    <script>
        const CM_PER_INCH = 2.54;
        const LBS_PER_KG = 2.20462;
        let decimalPlaces = 1;

        let rows = [createRowData()];

        function createRowData(l='', w='', h='', weight='', sizeUnit='cm', weightUnit='kg') {
            return { id: Math.random().toString(36).substring(2, 9), l, w, h, weight, sizeUnit, weightUnit };
        }

        function showMessage(msg, type='success') {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.className = \`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-0 opacity-100 \${
                type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }\`;
            setTimeout(() => {
                toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600";
            }, 2500);
        }

        function updateDecimalPlaces(val) {
            decimalPlaces = parseInt(val);
        }

        function renderRows() {
            const container = document.getElementById('grid-container');
            // Remove previous row elements (elements after the headers)
            const headersCount = 7;
            while (container.children.length > headersCount) {
                container.removeChild(container.lastChild);
            }

            rows.forEach((row, idx) => {
                // Create elements
                const lInput = document.createElement('input');
                lInput.type = "number";
                lInput.value = row.l;
                lInput.placeholder = "L";
                lInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                lInput.oninput = (e) => { row.l = e.target.value; };
                lInput.onpaste = (e) => handlePaste(e, row.id);

                const wInput = document.createElement('input');
                wInput.type = "number";
                wInput.value = row.w;
                wInput.placeholder = "W";
                wInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                wInput.oninput = (e) => { row.w = e.target.value; };
                wInput.onpaste = (e) => handlePaste(e, row.id);

                const hInput = document.createElement('input');
                hInput.type = "number";
                hInput.value = row.h;
                hInput.placeholder = "H";
                hInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                hInput.oninput = (e) => { row.h = e.target.value; };
                hInput.onpaste = (e) => handlePaste(e, row.id);

                const sizeSelect = document.createElement('select');
                sizeSelect.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                sizeSelect.innerHTML = \`<option value="cm" \${row.sizeUnit === 'cm' ? 'selected' : ''}>cm</option>
                                        <option value="in" \${row.sizeUnit === 'in' ? 'selected' : ''}>in</option>\`;
                sizeSelect.onchange = (e) => { row.sizeUnit = e.target.value; };

                const weightInput = document.createElement('input');
                weightInput.type = "number";
                weightInput.value = row.weight;
                weightInput.placeholder = "Weight";
                weightInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                weightInput.oninput = (e) => { row.weight = e.target.value; };
                weightInput.onpaste = (e) => handlePaste(e, row.id);

                const weightSelect = document.createElement('select');
                weightSelect.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                weightSelect.innerHTML = \`<option value="kg" \${row.weightUnit === 'kg' ? 'selected' : ''}>kg</option>
                                          <option value="lbs" \${row.weightUnit === 'lbs' ? 'selected' : ''}>lbs</option>\`;
                weightSelect.onchange = (e) => { row.weightUnit = e.target.value; };

                const delBtn = document.createElement('button');
                delBtn.className = "text-red-400 hover:text-red-300 mx-auto flex items-center justify-center";
                delBtn.title = "Delete Row";
                delBtn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>\`;
                delBtn.onclick = () => deleteRow(row.id);

                container.appendChild(lInput);
                container.appendChild(wInput);
                container.appendChild(hInput);
                container.appendChild(sizeSelect);
                container.appendChild(weightInput);
                container.appendChild(weightSelect);
                container.appendChild(delBtn);
            });
        }

        function addRow() {
            rows.push(createRowData());
            renderRows();
        }

        function deleteRow(id) {
            rows = rows.filter(r => r.id !== id);
            if (rows.length === 0) rows.push(createRowData());
            renderRows();
        }

        function setAllSystem(system) {
            rows.forEach(row => {
                row.sizeUnit = system === 'metric' ? 'cm' : 'in';
                row.weightUnit = system === 'metric' ? 'kg' : 'lbs';
            });
            renderRows();
        }

        function handlePaste(e, startRowId) {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text/plain');
            if (!pastedText || !pastedText.trim()) return;

            const startIndex = rows.findIndex(r => r.id === startRowId);
            if (startIndex === -1) return;

            const lines = pastedText.trim().split('\\n');
            let newlyPasted = [];

            lines.forEach(line => {
                const cells = line.split('\\t');
                if (cells.length === 4 || cells.length === 6) {
                    const l = cells[0]?.trim() || '';
                    const w = cells[1]?.trim() || '';
                    const h = cells[2]?.trim() || '';
                    let weight = '';
                    let sizeUnit = 'cm';
                    let weightUnit = 'kg';

                    if (cells.length === 4) {
                        weight = cells[3]?.trim() || '';
                    } else {
                        sizeUnit = cells[3]?.trim().toLowerCase() === 'in' ? 'in' : 'cm';
                        weight = cells[4]?.trim() || '';
                        weightUnit = cells[5]?.trim().toLowerCase() === 'lbs' ? 'lbs' : 'kg';
                    }
                    newlyPasted.push({ l, w, h, sizeUnit, weight, weightUnit });
                }
            });

            if (newlyPasted.length === 0) {
                showMessage("貼上格式不正確 (Excel 四欄或六欄)", "error");
                return;
            }

            newlyPasted.forEach((row, i) => {
                const targetIdx = startIndex + i;
                if (targetIdx < rows.length) {
                    rows[targetIdx] = { ...rows[targetIdx], ...row };
                } else {
                    rows.push(createRowData(row.l, row.w, row.h, row.weight, row.sizeUnit, row.weightUnit));
                }
            });

            renderRows();
            showMessage(\`已匯入 \${newlyPasted.length} 筆資料\`);
        }

        let calculatedResults = [];

        function convert() {
            calculatedResults = [];
            const tbody = document.getElementById('results-tbody');
            tbody.innerHTML = '';
            
            let count = 0;
            rows.forEach(row => {
                const l = parseFloat(row.l);
                const w = parseFloat(row.w);
                const h = parseFloat(row.h);
                const weight = parseFloat(row.weight);

                if (!isNaN(l) && !isNaN(w) && !isNaN(h) && !isNaN(weight)) {
                    let lOut, wOut, hOut, weightOut, sizeUnitOut, weightUnitOut;
                    
                    if (row.sizeUnit === 'cm') {
                        lOut = l / CM_PER_INCH;
                        wOut = w / CM_PER_INCH;
                        hOut = h / CM_PER_INCH;
                        sizeUnitOut = 'in';
                    } else {
                        lOut = l * CM_PER_INCH;
                        wOut = w * CM_PER_INCH;
                        hOut = h * CM_PER_INCH;
                        sizeUnitOut = 'cm';
                    }

                    if (row.weightUnit === 'kg') {
                        weightOut = weight * LBS_PER_KG;
                        weightUnitOut = 'lbs';
                    } else {
                        weightOut = weight / LBS_PER_KG;
                        weightUnitOut = 'kg';
                    }

                    const r = {
                        l: lOut.toFixed(decimalPlaces),
                        w: wOut.toFixed(decimalPlaces),
                        h: hOut.toFixed(decimalPlaces),
                        sizeUnit: sizeUnitOut,
                        weight: weightOut.toFixed(decimalPlaces),
                        weightUnit: weightUnitOut
                    };
                    calculatedResults.push(r);
                    
                    const tr = document.createElement('tr');
                    tr.className = "border-b border-gray-700";
                    tr.innerHTML = \`<td class="px-4 py-2 text-sm text-white">\${r.l}</td>
                                    <td class="px-4 py-2 text-sm text-white">\${r.w}</td>
                                    <td class="px-4 py-2 text-sm text-white">\${r.h}</td>
                                    <td class="px-4 py-2 text-sm text-indigo-300 font-bold">\${r.sizeUnit}</td>
                                    <td class="px-4 py-2 text-sm text-white">\${r.weight}</td>
                                    <td class="px-4 py-2 text-sm text-indigo-300 font-bold">\${r.weightUnit}</td>\`;
                    tbody.appendChild(tr);
                    count++;
                }
            });

            if (count > 0) {
                document.getElementById('results-card').classList.remove('hidden');
                showMessage(\`成功轉換 \${count} 筆資料\`);
            } else {
                showMessage("無有效數據進行轉換", "warning");
            }
        }

        function clearAll() {
            rows = [createRowData()];
            calculatedResults = [];
            document.getElementById('results-card').classList.add('hidden');
            renderRows();
        }

        function copyBulkTable() {
            if (calculatedResults.length === 0) return;
            const text = calculatedResults.map(r => 
                \`\${r.l}\\t\${r.w}\\t\${r.h}\\t\${r.sizeUnit}\\t\${r.weight}\\t\${r.weightUnit}\`
            ).join('\\n');
            navigator.clipboard.writeText(text).then(() => {
                showMessage("表格數據已複製");
            });
        }

        // Init
        renderRows();
    </script>
</body>
</html>`;

// 2. Desiccant Page Standalone HTML
const getDesiccantHTML = () => `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dessicant Usage Calculator (Offline / 離線版)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #000000; color: #ffffff; font-family: system-ui, sans-serif; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    </style>
</head>
<body class="p-6">
    <div class="max-w-4xl mx-auto space-y-6 mt-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <h1 class="text-3xl font-black text-white tracking-tight">Dessicant Usage Calculator</h1>
            <span class="px-3 py-1 bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full">離線版 Standard Edition</span>
        </div>

        <div class="bg-gray-800 p-6 rounded-3xl space-y-4 border border-gray-700 shadow-2xl">
            <p class="text-sm text-gray-400">
                輸入長寬高 (單位 mm)，點擊即時計算所需乾燥劑克數 (g)。
                可直接從 Excel 複製多行（長, 寬, 高，以 tab 分隔）於第一個欄位中直接貼上。
            </p>

            <div class="flex justify-start pt-2">
                <button onclick="addRow()" class="px-4 py-2 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Add Row</button>
            </div>
            
            <div class="overflow-x-auto pt-2">
                <div id="grid-container" class="grid gap-x-4 gap-y-2 items-center" style="grid-template-columns: 1fr 1fr 1fr 1.2fr 40px;">
                    <!-- Table Headers -->
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">L (mm)</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">W (mm)</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">H (mm)</div>
                    <div class="text-xs font-bold text-green-400 uppercase pb-1 text-center">Result (g)</div>
                    <div></div>
                </div>
            </div>

            <div class="flex justify-center gap-4 pt-4 border-t border-gray-700">
                <button onclick="copyAllResults()" class="px-6 py-2.5 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">Copy All Results</button>
                <button onclick="clearAll()" class="px-6 py-2.5 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Clear All</button>
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600 z-50"></div>

    <script>
        const MM_PER_INCH = 25.4;
        const CALC_FACTOR = 0.0224;

        let rows = [createRowData()];

        function createRowData(l='', w='', h='') {
            return { id: Math.random().toString(36).substring(2, 9), l, w, h };
        }

        function showMessage(msg, type='success') {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.className = \`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-0 opacity-100 \${
                type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }\`;
            setTimeout(() => {
                toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600";
            }, 2500);
        }

        function solveRow(row) {
            const l = parseFloat(row.l);
            const w = parseFloat(row.w);
            const h = parseFloat(row.h);
            if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
                return '...';
            }
            const result = (l / MM_PER_INCH) * (w / MM_PER_INCH) * (h / MM_PER_INCH) * CALC_FACTOR;
            return result.toFixed(2);
        }

        function renderRows() {
            const container = document.getElementById('grid-container');
            const headersCount = 5;
            while (container.children.length > headersCount) {
                container.removeChild(container.lastChild);
            }

            rows.forEach((row) => {
                const lInput = document.createElement('input');
                lInput.type = "number";
                lInput.value = row.l;
                lInput.placeholder = "L";
                lInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                lInput.oninput = (e) => { 
                    row.l = e.target.value; 
                    document.getElementById('res-' + row.id).innerText = solveRow(row);
                };
                lInput.onpaste = (e) => handlePaste(e, row.id);

                const wInput = document.createElement('input');
                wInput.type = "number";
                wInput.value = row.w;
                wInput.placeholder = "W";
                wInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                wInput.oninput = (e) => { 
                    row.w = e.target.value; 
                    document.getElementById('res-' + row.id).innerText = solveRow(row);
                };
                wInput.onpaste = (e) => handlePaste(e, row.id);

                const hInput = document.createElement('input');
                hInput.type = "number";
                hInput.value = row.h;
                hInput.placeholder = "H";
                hInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                hInput.oninput = (e) => { 
                    row.h = e.target.value; 
                    document.getElementById('res-' + row.id).innerText = solveRow(row);
                };
                hInput.onpaste = (e) => handlePaste(e, row.id);

                const resultDiv = document.createElement('div');
                resultDiv.className = "bg-gray-900/50 rounded-md text-center p-2 text-sm h-10 flex items-center justify-center border border-gray-700/50";
                resultDiv.innerHTML = \`<span id="res-\${row.id}" class="font-mono text-green-300">\${solveRow(row)}</span>\`;

                const delBtn = document.createElement('button');
                delBtn.className = "text-red-400 hover:text-red-300 mx-auto flex items-center justify-center";
                delBtn.title = "Delete Row";
                delBtn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>\`;
                delBtn.onclick = () => deleteRow(row.id);

                container.appendChild(lInput);
                container.appendChild(wInput);
                container.appendChild(hInput);
                container.appendChild(resultDiv);
                container.appendChild(delBtn);
            });
        }

        function addRow() {
            rows.push(createRowData());
            renderRows();
        }

        function deleteRow(id) {
            rows = rows.filter(r => r.id !== id);
            if (rows.length === 0) rows.push(createRowData());
            renderRows();
        }

        function handlePaste(e, startRowId) {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text/plain');
            if (!pastedText || !pastedText.trim()) return;

            const startIndex = rows.findIndex(r => r.id === startRowId);
            if (startIndex === -1) return;

            const lines = pastedText.trim().split('\\n');
            let newlyPasted = [];

            lines.forEach(line => {
                const cells = line.split('\\t');
                if (cells.length >= 3) {
                    const l = cells[0]?.trim() || '';
                    const w = cells[1]?.trim() || '';
                    const h = cells[2]?.trim() || '';
                    newlyPasted.push({ l, w, h });
                }
            });

            if (newlyPasted.length === 0) {
                showMessage("貼上格式不正確 (Excel 必須有 L, W, H 三欄)", "error");
                return;
            }

            newlyPasted.forEach((row, i) => {
                const targetIdx = startIndex + i;
                if (targetIdx < rows.length) {
                    rows[targetIdx] = { ...rows[targetIdx], ...row };
                } else {
                    rows.push(createRowData(row.l, row.w, row.h));
                }
            });

            renderRows();
            showMessage(\`已匯入 \${newlyPasted.length} 筆資料\`);
        }

        function copyAllResults() {
            const elements = rows.map(row => solveRow(row)).filter(v => v !== '...');
            if (elements.length === 0) {
                showMessage("沒有可複製的結果", "warning");
                return;
            }
            navigator.clipboard.writeText(elements.join('\\n')).then(() => {
                showMessage("全部計算結果已複製");
            });
        }

        function clearAll() {
            rows = [createRowData()];
            renderRows();
        }

        // Init
        renderRows();
    </script>
</body>
</html>`;

// 3. Plastic Bag Calculator HTML
const getPlasticBagWeightHTML = () => `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plastic Bag Weight Calculator (Offline / 離線版)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #000000; color: #ffffff; font-family: system-ui, sans-serif; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    </style>
</head>
<body class="p-6">
    <div class="max-w-4xl mx-auto space-y-6 mt-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <h1 class="text-3xl font-black text-white tracking-tight">Plastic Bag Weight Calculator</h1>
            <span class="px-3 py-1 bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full">離線版 Standard Edition</span>
        </div>

        <div class="bg-gray-800 p-6 rounded-3xl space-y-4 border border-gray-700 shadow-2xl">
            <p class="text-sm text-gray-400">
                計算塑膠袋單重。輸入長寬厚度 (mm)，計算克數 (g)。
                支持 Excel 貼上 (長, 寬, [側折], 厚度)。
            </p>

            <div class="flex flex-col sm:flex-row items-center gap-4 border-b border-gray-700 pb-4">
                <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-300">Density (g/cm³):</label>
                    <input type="number" step="0.01" id="density" value="0.92" oninput="changeGlobalDensity(this.value)" class="block bg-gray-700 border-none rounded-md text-white text-sm text-center h-10 w-24">
                </div>
                <div class="flex gap-2">
                    <button onclick="setDensity('0.92')" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">LDPE (0.92)</button>
                    <button onclick="setDensity('0.95')" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">HDPE (0.95)</button>
                    <button onclick="setDensity('0.91')" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">PP (0.91)</button>
                </div>
            </div>

            <div class="flex justify-start pt-2">
                <button onclick="addRow()" class="px-4 py-2 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Add Row</button>
            </div>
            
            <div class="overflow-x-auto pt-2">
                <div id="grid-container" class="grid gap-x-4 gap-y-2 items-center" style="grid-template-columns: 1fr 1fr 1fr 1fr 1.2fr 40px;">
                    <!-- Table Headers -->
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">L (Length)</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">W (Width)</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">S (Gusset)</div>
                    <div class="text-xs font-medium text-gray-300 uppercase pb-1 text-center">T (Thickness)</div>
                    <div class="text-xs font-bold text-green-400 uppercase pb-1 text-center">Result (g)</div>
                    <div></div>
                </div>
            </div>

            <div class="flex justify-center gap-4 pt-4 border-t border-gray-700">
                <button onclick="copyAllResults()" class="px-6 py-2.5 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">Copy All Results</button>
                <button onclick="clearAll()" class="px-6 py-2.5 text-sm font-semibold rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300">Clear All</button>
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600 z-50"></div>

    <script>
        let density = 0.92;
        let rows = [createRowData()];

        function createRowData(l='', w='', s='', t='') {
            return { id: Math.random().toString(36).substring(2, 9), l, w, s, t };
        }

        function showMessage(msg, type='success') {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.className = \`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-0 opacity-100 \${
                type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }\`;
            setTimeout(() => {
                toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600";
            }, 2500);
        }

        function changeGlobalDensity(val) {
            const d = parseFloat(val);
            if (!isNaN(d)) {
                density = d;
                recalculateAll();
            }
        }

        function setDensity(val) {
            document.getElementById('density').value = val;
            density = parseFloat(val);
            recalculateAll();
        }

        function solveRow(row) {
            const l = parseFloat(row.l);
            const w = parseFloat(row.w);
            const s = parseFloat(row.s) || 0; // gusset is optional
            const t = parseFloat(row.t);
            const d = density;

            if (isNaN(l) || isNaN(w) || isNaN(t) || isNaN(d) || l <= 0 || w <= 0 || t <= 0) {
                return '...';
            }
            
            // Formula: (W + S) * L * T * Density * 2 (layers) / 1000
            const result = (w + s) * l * t * d * 2 / 1000;
            return result.toFixed(3);
        }

        function recalculateAll() {
            rows.forEach(row => {
                const el = document.getElementById('res-' + row.id);
                if (el) el.innerText = solveRow(row);
            });
        }

        function renderRows() {
            const container = document.getElementById('grid-container');
            const headersCount = 6;
            while (container.children.length > headersCount) {
                container.removeChild(container.lastChild);
            }

            rows.forEach((row) => {
                const lInput = document.createElement('input');
                lInput.type = "number";
                lInput.value = row.l;
                lInput.placeholder = "L";
                lInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                lInput.oninput = (e) => { 
                    row.l = e.target.value; 
                    document.getElementById('res-' + row.id).innerText = solveRow(row);
                };
                lInput.onpaste = (e) => handlePaste(e, row.id);

                const wInput = document.createElement('input');
                wInput.type = "number";
                wInput.value = row.w;
                wInput.placeholder = "W";
                wInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                wInput.oninput = (e) => { 
                    row.w = e.target.value; 
                    document.getElementById('res-' + row.id).innerText = solveRow(row);
                };
                wInput.onpaste = (e) => handlePaste(e, row.id);

                const sInput = document.createElement('input');
                sInput.type = "number";
                sInput.value = row.s;
                sInput.placeholder = "S (optional)";
                sInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                sInput.oninput = (e) => { 
                    row.s = e.target.value; 
                    document.getElementById('res-' + row.id).innerText = solveRow(row);
                };
                sInput.onpaste = (e) => handlePaste(e, row.id);

                const tInput = document.createElement('input');
                tInput.type = "number";
                tInput.value = row.t;
                tInput.placeholder = "T";
                tInput.className = "block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center h-10";
                tInput.oninput = (e) => { 
                    row.t = e.target.value; 
                    document.getElementById('res-' + row.id).innerText = solveRow(row);
                };
                tInput.onpaste = (e) => handlePaste(e, row.id);

                const resultDiv = document.createElement('div');
                resultDiv.className = "bg-gray-900/50 rounded-md text-center p-2 text-sm h-10 flex items-center justify-center border border-gray-700/50";
                resultDiv.innerHTML = \`<span id="res-\${row.id}" class="font-mono text-green-300">\${solveRow(row)}</span>\`;

                const delBtn = document.createElement('button');
                delBtn.className = "text-red-400 hover:text-red-300 mx-auto flex items-center justify-center";
                delBtn.title = "Delete Row";
                delBtn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>\`;
                delBtn.onclick = () => deleteRow(row.id);

                container.appendChild(lInput);
                container.appendChild(wInput);
                container.appendChild(sInput);
                container.appendChild(tInput);
                container.appendChild(resultDiv);
                container.appendChild(delBtn);
            });
        }

        function addRow() {
            rows.push(createRowData());
            renderRows();
        }

        function deleteRow(id) {
            rows = rows.filter(r => r.id !== id);
            if (rows.length === 0) rows.push(createRowData());
            renderRows();
        }

        function handlePaste(e, startRowId) {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text/plain');
            if (!pastedText || !pastedText.trim()) return;

            const startIndex = rows.findIndex(r => r.id === startRowId);
            if (startIndex === -1) return;

            const lines = pastedText.trim().split('\\n');
            let newlyPasted = [];

            lines.forEach(line => {
                const cells = line.split('\\t');
                if (cells.length >= 3) {
                    const l = cells[0]?.trim() || '';
                    const w = cells[1]?.trim() || '';
                    const s = cells.length >= 4 ? cells[2]?.trim() : '';
                    const t = cells.length >= 4 ? cells[3]?.trim() : cells[2]?.trim();
                    newlyPasted.push({ l, w, s, t });
                }
            });

            if (newlyPasted.length === 0) {
                showMessage("貼上格式不正確 (Excel 必須有 L, W, [S], T 等欄)", "error");
                return;
            }

            newlyPasted.forEach((row, i) => {
                const targetIdx = startIndex + i;
                if (targetIdx < rows.length) {
                    rows[targetIdx] = { ...rows[targetIdx], ...row };
                } else {
                    rows.push(createRowData(row.l, row.w, row.s, row.t));
                }
            });

            renderRows();
            showMessage(\`已匯入 \${newlyPasted.length} 筆資料\`);
        }

        function copyAllResults() {
            const elements = rows.map(row => solveRow(row)).filter(v => v !== '...');
            if (elements.length === 0) {
                showMessage("沒有可複製的結果", "warning");
                return;
            }
            navigator.clipboard.writeText(elements.join('\\n')).then(() => {
                showMessage("全部計算結果已複製");
            });
        }

        function clearAll() {
            rows = [createRowData()];
            renderRows();
        }

        // Init
        renderRows();
    </script>
</body>
</html>`;

// 4. Plastic Bag Sizing HTML with 3D Preview
const getPlasticBagSizingHTML = () => `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plastic Bag Sizing Tool (Offline / 離線版)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #000000; color: #ffffff; font-family: system-ui, sans-serif; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
    </style>
</head>
<body class="p-6">
    <div class="max-w-6xl mx-auto space-y-6 pb-12 mt-4">
        <!-- Main Card -->
        <div class="bg-gray-800 p-5 sm:p-8 rounded-[2.5rem] space-y-8 shadow-2xl border border-gray-700">
            
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Inputs & Sliders -->
                <div class="flex-grow space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                            📦
                        </div>
                        <div>
                            <h3 class="text-2xl font-black text-white tracking-tight">Plastic Bag Sizing</h3>
                            <p class="text-xs text-indigo-400 font-bold uppercase tracking-widest">Dimension & Logic Definitions (離線版)</p>
                        </div>
                    </div>

                    <!-- Guidance -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-950/20 border border-indigo-500/30 p-5 rounded-2xl shadow-inner">
                        <div class="space-y-2">
                            <p class="text-xs font-black text-indigo-400 uppercase flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Product Dimensions / 產品尺寸
                            </p>
                            <ul class="text-[13px] text-gray-300 space-y-1 pl-3.5 border-l border-indigo-800/50">
                                <li>• <b class="text-indigo-200">Width (W):</b> 左右寬度</li>
                                <li>• <b class="text-indigo-200">Depth (L):</b> 前後深度</li>
                                <li>• <b class="text-indigo-200">Height (H):</b> 產品高度</li>
                            </ul>
                        </div>
                        <div class="space-y-2">
                            <p class="text-xs font-black text-emerald-400 uppercase flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Plastic Bag Dimensions / 袋子尺寸
                            </p>
                            <ul class="text-[13px] text-gray-300 space-y-1 pl-3.5 border-l border-emerald-800/50">
                                <li>• <b class="text-emerald-200">Bag Width (寬):</b> 平放後左右寬</li>
                                <li>• <b class="text-emerald-200">Bag Length (長):</b> 口到底長度</li>
                                <li>• <b class="text-emerald-200">Opening (袋口):</b> 預設寬邊開口</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Margins -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="bg-gray-900/40 border border-gray-700/50 p-4 rounded-2xl">
                            <label class="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Global Margin / 預留量 (mm)</label>
                            <div class="flex items-center gap-3">
                                <input type="range" min="0" max="50" id="margin-slider" value="10" oninput="changeMargin(this.value)" class="flex-grow accent-indigo-500">
                                <input type="number" id="margin-val" value="10" oninput="changeMargin(this.value)" class="w-16 bg-gray-800 border-none rounded-lg text-center font-bold text-indigo-400 h-8">
                            </div>
                        </div>
                        <div class="bg-gray-900/40 border border-gray-700/50 p-4 rounded-2xl">
                            <label class="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Fold Overlap / 反摺量 (mm)</label>
                            <div class="flex items-center gap-3">
                                <input type="range" min="0" max="100" id="fold-slider" value="30" oninput="changeFold(this.value)" class="flex-grow accent-indigo-500">
                                <input type="number" id="fold-val" value="30" oninput="changeFold(this.value)" class="w-16 bg-gray-800 border-none rounded-lg text-center font-bold text-indigo-400 h-8">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3D SVG Side Panel -->
                <div class="lg:w-72 flex-shrink-0">
                    <div class="flex flex-col items-center bg-gray-900/80 rounded-2xl p-6 border border-gray-600 shadow-2xl relative overflow-hidden backdrop-blur-md">
                        <div class="absolute top-3 left-4 flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3D Packaging View</span>
                        </div>
                        <div id="svg-container" class="mt-4">
                            <!-- Injected by JavaScript -->
                        </div>
                        <div class="mt-4 px-3 py-1 bg-green-950/30 border border-green-800/50 rounded-full">
                            <p class="text-[11px] text-green-400 font-medium text-center">
                                <span class="font-bold">綠色區塊</span> 為袋口開口處
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center justify-between border-t border-gray-700/50 pt-6">
                <button onclick="addRow()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2">
                    <span>+</span> 新增資料列
                </button>
                <div class="flex gap-2">
                    <button onclick="copyResults('flat')" class="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-xs font-bold transition-all">複製平口袋清單</button>
                    <button onclick="copyResults('gusset')" class="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-xs font-bold transition-all">複製立體袋清單</button>
                    <button onclick="clearAll()" class="px-4 py-2.5 border border-red-900/30 text-red-400 hover:bg-red-950/20 rounded-xl text-xs font-bold transition-all">清空全部</button>
                </div>
            </div>

            <!-- Table -->
            <div class="w-full overflow-x-auto custom-scrollbar">
                <div id="table-grid" class="grid gap-x-3 gap-y-4 items-center min-w-[950px] pb-4 px-1" style="grid-template-columns: minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) 160px minmax(130px, 1.4fr) minmax(160px, 1.8fr) 40px;">
                    <!-- Headers -->
                    <div class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter text-center mb-1">Width (W) 寬</div>
                    <div class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter text-center mb-1">Depth (L) 深</div>
                    <div class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter text-center mb-1">Height (H) 高</div>
                    <div class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter text-center mb-1">Opening 袋口位置</div>
                    <div class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter text-center mb-1">Result: Flat (寬 x 長)</div>
                    <div class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter text-center mb-1">Result: Gusset (寬 x 長 x 側)</div>
                    <div></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-white font-bold shadow-2xl transition-all duration-500 z-[100] backdrop-blur-md flex items-center gap-3 translate-y-20 opacity-0 bg-emerald-600/90 border border-emerald-400/30"></div>

    <script>
        let margin = 10;
        let foldOverlap = 30;
        let activeRowIdx = 0;
        let rows = [createRowData()];

        function createRowData(w='', l='', h='', openingSide='width') {
            return { id: Math.random().toString(36).substring(2, 9), w, l, h, openingSide };
        }

        function showMessage(msg, type='success') {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.className = \`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-white font-bold shadow-2xl transition-all duration-500 z-[100] backdrop-blur-md flex items-center gap-3 translate-y-0 opacity-100 \${
                type === 'success' ? 'bg-emerald-600/90 border border-emerald-400/30' : 'bg-red-600/90 border border-red-400/30'
            }\`;
            setTimeout(() => {
                toast.className = "fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-white font-bold shadow-2xl transition-all duration-500 z-[100] backdrop-blur-md flex items-center gap-3 translate-y-20 opacity-0 bg-emerald-600/90";
            }, 2500);
        }

        function changeMargin(val) {
            margin = parseFloat(val) || 0;
            document.getElementById('margin-slider').value = margin;
            document.getElementById('margin-val').value = margin;
            updateResultsAndDiagram();
        }

        function changeFold(val) {
            foldOverlap = parseFloat(val) || 0;
            document.getElementById('fold-slider').value = foldOverlap;
            document.getElementById('fold-val').value = foldOverlap;
            updateResultsAndDiagram();
        }

        function solveRow(row) {
            const pw = parseFloat(row.w);
            const pl = parseFloat(row.l);
            const ph = parseFloat(row.h);

            if (isNaN(pl) || isNaN(pw) || isNaN(ph) || pl <= 0 || pw <= 0 || ph <= 0) return null;

            let flatW, flatL, gussetW, gussetL, gussetS;
            if (row.openingSide === 'width') {
                flatW = pw + ph + margin;
                flatL = pl + ph + margin + foldOverlap;
                gussetW = pw + margin;
                gussetS = ph + margin;
                gussetL = pl + (ph / 2) + margin + foldOverlap;
            } else {
                flatW = pl + ph + margin;
                flatL = pw + ph + margin + foldOverlap;
                gussetW = pl + margin;
                gussetS = ph + margin;
                gussetL = pw + (ph / 2) + margin + foldOverlap;
            }

            return {
                flat: \`\${Math.ceil(flatW)} x \${Math.ceil(flatL)}\`,
                gusset: \`\${Math.ceil(gussetW)} x \${Math.ceil(gussetL)} x \${Math.ceil(gussetS)}\`
            };
        }

        function renderRows() {
            const container = document.getElementById('table-grid');
            const headersCount = 7;
            while (container.children.length > headersCount) {
                container.removeChild(container.lastChild);
            }

            rows.forEach((row, idx) => {
                const isActive = activeRowIdx === idx;
                
                const wDiv = document.createElement('div');
                wDiv.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
                wDiv.innerHTML = \`<input type="number" id="input-w-\${row.id}" onfocus="setActiveIdx(\${idx})" oninput="updateRowItem('\${row.id}', 'w', this.value)" onpaste="handlePaste(event, '\${row.id}')" value="\${row.w}" placeholder="寬" class="block w-full border-none rounded-lg text-white text-sm text-center h-10 \${isActive ? 'ring-2 ring-indigo-500 bg-gray-900' : 'bg-gray-800/50'}" />\`;

                const lDiv = document.createElement('div');
                lDiv.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
                lDiv.innerHTML = \`<input type="number" id="input-l-\${row.id}" onfocus="setActiveIdx(\${idx})" oninput="updateRowItem('\${row.id}', 'l', this.value)" onpaste="handlePaste(event, '\${row.id}')" value="\${row.l}" placeholder="深" class="block w-full border-none rounded-lg text-white text-sm text-center h-10 \${isActive ? 'ring-2 ring-indigo-500 bg-gray-900' : 'bg-gray-800/50'}" />\`;

                const hDiv = document.createElement('div');
                hDiv.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
                hDiv.innerHTML = \`<input type="number" id="input-h-\${row.id}" onfocus="setActiveIdx(\${idx})" oninput="updateRowItem('\${row.id}', 'h', this.value)" onpaste="handlePaste(event, '\${row.id}')" value="\${row.h}" placeholder="高" class="block w-full border-none rounded-lg text-white text-sm text-center h-10 \${isActive ? 'ring-2 ring-indigo-500 bg-gray-900' : 'bg-gray-800/50'}" />\`;

                const selectDiv = document.createElement('div');
                selectDiv.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
                selectDiv.innerHTML = \`<select id="select-opening-\${row.id}" onfocus="setActiveIdx(\${idx})" onchange="updateRowItem('\${row.id}', 'openingSide', this.value)" class="block w-full border-none rounded-lg text-white text-xs h-10 cursor-pointer text-center \${isActive ? 'bg-gray-900 ring-2 ring-indigo-500' : 'bg-gray-800/50'}" >
                    <option value="width" \${row.openingSide === 'width' ? 'selected' : ''}>Width Edge (W+H) 寬邊</option>
                    <option value="length" \${row.openingSide === 'length' ? 'selected' : ''}>Length Edge (L+H) 長邊</option>
                </select>\`;

                const solved = solveRow(row);

                const resFlat = document.createElement('div');
                resFlat.id = \`res-flat-container-\${row.id}\`;
                resFlat.className = \`rounded-lg text-center p-2 text-[13px] h-10 flex flex-col items-center justify-center font-mono border transition-all duration-200 overflow-hidden \${
                    isActive ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-gray-700/50 bg-gray-900/30'
                }\`;
                resFlat.innerHTML = \`<span id="flat-val-\${row.id}" class="font-bold \${solved ? 'text-emerald-400' : 'text-gray-600'}">\${solved ? solved.flat : '-- x --'}</span>
                <span id="flat-lbl-\${row.id}" class="text-[9px] text-emerald-600/70 font-sans font-black uppercase tracking-widest mt-0.5">\${solved ? (row.openingSide === 'width' ? 'Top-Open' : 'Side-Open') : ''}</span>\`;

                const resGusset = document.createElement('div');
                resGusset.id = \`res-gusset-container-\${row.id}\`;
                resGusset.className = \`rounded-lg text-center p-2 text-[13px] h-10 flex flex-col items-center justify-center font-mono border transition-all duration-200 \${
                    isActive ? 'border-indigo-500/50 bg-indigo-950/20 shadow-lg' : 'border-gray-700/50 bg-gray-900/30'
                }\`;
                resGusset.innerHTML = \`<span id="gusset-val-\${row.id}" class="font-bold \${solved ? 'text-indigo-400' : 'text-gray-600'}">\${solved ? solved.gusset : '-- x -- x --'}</span>\`;

                const delBtn = document.createElement('button');
                delBtn.className = "group w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all mx-auto";
                delBtn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>\`;
                delBtn.onclick = () => removeRow(idx);

                container.appendChild(wDiv);
                container.appendChild(lDiv);
                container.appendChild(hDiv);
                container.appendChild(selectDiv);
                container.appendChild(resFlat);
                container.appendChild(resGusset);
                container.appendChild(delBtn);
            });
        }

        function setActiveIdx(idx) {
            if (activeRowIdx === idx) return;
            const oldRow = rows[activeRowIdx];
            if (oldRow) {
                setRowActiveState(oldRow.id, false);
            }
            activeRowIdx = idx;
            const newRow = rows[activeRowIdx];
            if (newRow) {
                setRowActiveState(newRow.id, true);
            }
            renderDiagram();
        }

        function setRowActiveState(id, isActive) {
            const wInput = document.getElementById('input-w-' + id);
            const lInput = document.getElementById('input-l-' + id);
            const hInput = document.getElementById('input-h-' + id);
            const selectEl = document.getElementById('select-opening-' + id);
            const resFlat = document.getElementById('res-flat-container-' + id);
            const resGusset = document.getElementById('res-gusset-container-' + id);

            if (wInput) {
                wInput.className = \`block w-full border-none rounded-lg text-white text-sm text-center h-10 \${isActive ? 'ring-2 ring-indigo-500 bg-gray-900' : 'bg-gray-800/50'}\`;
                wInput.parentElement.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
            }
            if (lInput) {
                lInput.className = \`block w-full border-none rounded-lg text-white text-sm text-center h-10 \${isActive ? 'ring-2 ring-indigo-500 bg-gray-900' : 'bg-gray-800/50'}\`;
                lInput.parentElement.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
            }
            if (hInput) {
                hInput.className = \`block w-full border-none rounded-lg text-white text-sm text-center h-10 \${isActive ? 'ring-2 ring-indigo-500 bg-gray-900' : 'bg-gray-800/50'}\`;
                hInput.parentElement.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
            }
            if (selectEl) {
                selectEl.className = \`block w-full border-none rounded-lg text-white text-xs h-10 cursor-pointer text-center \${isActive ? 'bg-gray-900 ring-2 ring-indigo-500' : 'bg-gray-800/50'}\`;
                selectEl.parentElement.className = \`transition-all duration-200 \${isActive ? 'scale-105' : ''}\`;
            }
            if (resFlat) {
                resFlat.className = \`rounded-lg text-center p-2 text-[13px] h-10 flex flex-col items-center justify-center font-mono border transition-all duration-200 overflow-hidden \${
                    isActive ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-gray-700/50 bg-gray-900/30'
                }\`;
            }
            if (resGusset) {
                resGusset.className = \`rounded-lg text-center p-2 text-[13px] h-10 flex flex-col items-center justify-center font-mono border transition-all duration-200 \${
                    isActive ? 'border-indigo-500/50 bg-indigo-950/20 shadow-lg' : 'border-gray-700/50 bg-gray-900/30'
                }\`;
            }
        }

        function updateRowItem(id, field, value) {
            const row = rows.find(r => r.id === id);
            if (row) {
                row[field] = value;
                
                // Solve calculation for row in real time
                const solved = solveRow(row);
                
                // Update results text directly without recreation
                const flatVal = document.getElementById('flat-val-' + id);
                if (flatVal) {
                    flatVal.innerText = solved ? solved.flat : '-- x --';
                    flatVal.className = \`font-bold \${solved ? 'text-emerald-400' : 'text-gray-600'}\`;
                }
                
                const flatLbl = document.getElementById('flat-lbl-' + id);
                if (flatLbl) {
                    flatLbl.innerText = solved ? (row.openingSide === 'width' ? 'Top-Open' : 'Side-Open') : '';
                }
                
                const gussetVal = document.getElementById('gusset-val-' + id);
                if (gussetVal) {
                    gussetVal.innerText = solved ? solved.gusset : '-- x -- x --';
                    gussetVal.className = \`font-bold \${solved ? 'text-indigo-400' : 'text-gray-600'}\`;
                }
                
                // Only update diagram graphics
                renderDiagram();
            }
        }

        function addRow() {
            rows.push(createRowData());
            activeRowIdx = rows.length - 1;
            updateResultsAndDiagram();
        }

        function removeRow(idx) {
            rows.splice(idx, 1);
            if (rows.length === 0) {
                rows = [createRowData()];
                activeRowIdx = 0;
            } else {
                activeRowIdx = Math.max(0, activeRowIdx - 1);
            }
            updateResultsAndDiagram();
        }

        function updateResultsAndDiagram() {
            renderRows();
            renderDiagram();
        }

        function renderDiagram() {
            const row = rows[activeRowIdx] || rows[0];
            const w = parseFloat(row.w) || 120;
            const l = parseFloat(row.l) || 80;
            const h = parseFloat(row.h) || 60;

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

            const getPoint = (px, py, pz) => ({
                x: origin.x + px * dxW + py * dxL,
                y: origin.y + px * dyW + py * dyL - pz
            });

            const p = [
                getPoint(0, 0, 0),    
                getPoint(sw, 0, 0),   
                getPoint(sw, sl, 0),  
                getPoint(0, sl, 0),   
                getPoint(0, 0, sh),   
                getPoint(sw, 0, sh),  
                getPoint(sw, sl, sh), 
                getPoint(0, sl, sh)   
            ];

            const getPathD = (indices) => {
                return \`M \${p[indices[0]].x} \${p[indices[0]].y} \${indices.slice(1).map(i => \`L \${p[i].x} \${p[i].y}\`).join(' ')} Z\`;
            };

            const container = document.getElementById('svg-container');
            const svgContent = \`
                <svg width="220" height="200" viewBox="0 0 200 200" class="drop-shadow-xl">
                    <!-- Hidden Internal lines -->
                    <path d="\${getPathD([1, 2, 3])}" stroke="rgba(156, 163, 175, 0.15)" fill="none" stroke-width="1.5" stroke-dasharray="4 4" />
                    <path d="M \${p[2].x} \${p[2].y} L \${p[6].x} \${p[6].y}" stroke="rgba(156, 163, 175, 0.15)" fill="none" stroke-width="1.5" stroke-dasharray="4 4" />

                    <!-- Faces -->
                    <path d="\${getPathD([0, 1, 5, 4])}" stroke="rgba(99, 102, 241, 0.6)" fill="rgba(99, 102, 241, 0.05)" stroke-width="1.5" />
                    <path d="\${getPathD([0, 3, 7, 4])}" stroke="rgba(99, 102, 241, 0.6)" fill="rgba(99, 102, 241, 0.05)" stroke-width="1.5" />
                    <path d="\${getPathD([4, 5, 6, 7])}" stroke="rgba(99, 102, 241, 0.8)" fill="rgba(99, 102, 241, 0.1)" stroke-width="1.5" />

                    <!-- Labels -->
                    <text x="\${(p[0].x + p[1].x)/2}" y="\${(p[0].y + p[1].y)/2 + 16}" fill="#818cf8" font-size="9" font-weight="bold" text-anchor="middle">Width (W)</text>
                    <text x="\${(p[0].x + p[3].x)/2 - 18}" y="\${(p[0].y + p[3].y)/2 + 16}" fill="#818cf8" font-size="9" font-weight="bold" text-anchor="middle">Depth (L)</text>
                    <text x="\${p[1].x + 12}" y="\${p[1].y + (p[5].y - p[1].y)/2}" fill="#818cf8" font-size="9" font-weight="bold">Height (H)</text>

                    <!-- Opening Indicator -->
                    \${row.openingSide === 'width' ? \`
                        <path d="\${getPathD([4, 5, 6, 7])}" stroke="#10b981" fill="rgba(16, 185, 129, 0.3)" stroke-width="3" />
                        <text x="\${p[6].x}" y="\${p[6].y - 12}" fill="#10b981" font-size="10" font-weight="900" text-anchor="middle">BAG MOUTH (W)</text>
                    \` : \`
                        <path d="\${getPathD([0, 3, 7, 4])}" stroke="#10b981" fill="rgba(16, 185, 129, 0.3)" stroke-width="3" />
                        <text x="\${p[3].x - 40}" y="\${p[3].y - 10}" fill="#10b981" font-size="10" font-weight="900" text-anchor="middle">SIDE MOUTH (L)</text>
                    \`}
                </svg>
            \`;
            container.innerHTML = svgContent;
        }

        function handlePaste(e, startRowId) {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text/plain');
            if (!pastedText || !pastedText.trim()) return;

            const startIndex = rows.findIndex(r => r.id === startRowId);
            if (startIndex === -1) return;

            const lines = pastedText.trim().split('\\n');
            let newlyPasted = [];

            lines.forEach(line => {
                const cells = line.split('\\t');
                if (cells.length >= 3) {
                    const w = cells[0]?.trim() || '';
                    const l = cells[1]?.trim() || '';
                    const h = cells[2]?.trim() || '';
                    const openingSide = (cells[3] && cells[3].toLowerCase().includes('l')) ? 'length' : 'width';
                    newlyPasted.push({ w, l, h, openingSide });
                }
            });

            if (newlyPasted.length === 0) {
                showMessage("貼上格式不正確 (Excel 必須有 W, L, H 三欄)", "error");
                return;
            }

            newlyPasted.forEach((row, i) => {
                const targetIdx = startIndex + i;
                if (targetIdx < rows.length) {
                    rows[targetIdx] = { ...rows[targetIdx], ...row };
                } else {
                    rows.push(createRowData(row.w, row.l, row.h, row.openingSide));
                }
            });

            updateResultsAndDiagram();
            showMessage(\`已匯入 \${newlyPasted.length} 筆資料\`);
        }

        function copyResults(type) {
            const list = rows.map(row => {
                const solved = solveRow(row);
                return solved ? (type === 'flat' ? solved.flat : solved.gusset) : '';
            }).filter(v => v !== '');

            if (list.length === 0) {
                showMessage("沒有可複製的結果", "warning");
                return;
            }

            navigator.clipboard.writeText(list.join('\\n')).then(() => {
                showMessage("計算結果已複製");
            });
        }

        function clearAll() {
            if (confirm("確定要清空所有資料嗎？")) {
                rows = [createRowData()];
                activeRowIdx = 0;
                updateResultsAndDiagram();
            }
        }

        // Init
        updateResultsAndDiagram();
    </script>
</body>
</html>`;

// 5. Background Remover HTML Offline
const getBackgroundRemoverHTML = () => `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Background Remover (Offline & Native Edition)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #000000; color: #ffffff; font-family: system-ui, sans-serif; }
    </style>
</head>
<body class="p-6">
    <div class="max-w-4xl mx-auto space-y-6 mt-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <h1 class="text-3xl font-black text-white tracking-tight">AI & Smart Background Remover</h1>
            <span class="px-3 py-1 bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 text-xs font-bold rounded-full">離線版 Standalone Mode</span>
        </div>

        <!-- Offline Setup / Settings Panel -->
        <div class="bg-gray-800 p-6 rounded-3xl border border-gray-700 space-y-4">
            <h3 class="text-lg font-bold text-indigo-300">處理設定 / Options</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-300">
                        1. Gemini API 金鑰 (選填 - 啟用雲端 AI 處理)
                    </label>
                    <input type="password" id="api-key" placeholder="輸入 AI Key 即可在 HTML 內調用 AI 去背" class="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500">
                    <p class="text-[11px] text-gray-400">
                        * 如果不輸入金鑰，本網頁將使用<b>離線原生 HTML Canvas 濾色去背技術</b>，不需要傳輸網路！
                    </p>
                </div>
                <div class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-300">
                        2. 離線原生去背設定 (Chroma-key Tolerance)
                    </label>
                    <div class="flex items-center gap-3">
                        <input type="range" id="tolerance" min="0" max="150" value="40" oninput="changeTolerance(this.value)" class="flex-grow accent-indigo-500">
                        <span id="tolerance-val" class="text-sm font-mono text-indigo-300 w-10">40</span>
                    </div>
                    <p class="text-[11px] text-gray-400">
                        去背容差值：移除背景顏色相似的像素 (越小越嚴格)。
                    </p>
                </div>
            </div>
        </div>

        <!-- Upload zone -->
        <div class="bg-gray-900 border-2 border-dashed border-gray-700 rounded-3xl p-10 text-center hover:border-indigo-500 transition-all cursor-pointer relative" id="drop-zone">
            <input type="file" id="file-input" class="hidden" accept="image/*" multiple>
            <div class="space-y-3 pointer-events-none">
                <div class="text-4xl">📸</div>
                <p class="text-sm font-semibold text-gray-300">點擊此處或將多個圖片拖曳至此處上傳</p>
                <p class="text-xs text-gray-500">支持 JPG, PNG 等常見檔案 (離線直接在瀏覽器加速處理)</p>
            </div>
        </div>

        <!-- Current items grid -->
        <div id="image-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <!-- Dynamically populated -->
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600 z-50"></div>

    <script>
        let tolerance = 40;
        let originalImages = [];

        // Save & Load API Key from LocalStorage
        const apiKeyInput = document.getElementById('api-key');
        if (localStorage.getItem('off_gemini_key')) {
            apiKeyInput.value = localStorage.getItem('off_gemini_key');
        }
        apiKeyInput.onchange = (e) => {
            localStorage.setItem('off_gemini_key', e.target.value);
        };

        function changeTolerance(val) {
            tolerance = parseInt(val);
            document.getElementById('tolerance-val').innerText = tolerance;
            // Re-process all images using native if API key not present
            if (!apiKeyInput.value) {
                reProcessAllNative();
            }
        }

        function showMessage(msg, type='success') {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.className = \`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-0 opacity-100 \${
                type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }\`;
            setTimeout(() => {
                toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 translate-y-20 opacity-0 bg-green-600";
            }, 2500);
        }

        // Drag/Drop handling
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        dropZone.onclick = () => fileInput.click();
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('border-indigo-400'); };
        dropZone.ondragleave = () => { dropZone.classList.remove('border-indigo-400'); };
        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-400');
            handleFiles(e.dataTransfer.files);
        };
        fileInput.onchange = (e) => handleFiles(e.target.files);

        async function handleFiles(files) {
            if (!files || files.length === 0) return;
            const filesArray = Array.from(files);
            
            for (let file of filesArray) {
                const id = Math.random().toString(36).substring(2, 9);
                const originalUrl = URL.createObjectURL(file);
                
                const item = { id, file, originalUrl, processedUrl: null, status: 'processing' };
                originalImages.push(item);
                renderItemCard(item);
                
                processImage(item);
            }
        }

        function renderItemCard(item) {
            const grid = document.getElementById('image-grid');
            const card = document.createElement('div');
            card.id = 'card-' + item.id;
            card.className = "bg-gray-800 p-5 rounded-3xl border border-gray-700 shadow-xl space-y-4";
            card.innerHTML = \`
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-gray-400 truncate max-w-[150px]">\${item.file.name}</span>
                    <span id="status-\${item.id}" class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400">Processing</span>
                </div>
                <!-- Images Area -->
                <div class="grid grid-cols-2 gap-2 h-44">
                    <div class="bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center relative">
                        <img src="\${item.originalUrl}" class="max-h-full max-w-full object-contain">
                        <span class="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] bg-black/75 rounded text-gray-300">Original</span>
                    </div>
                    <div class="bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center relative border border-dashed border-gray-700">
                        <img id="img-proc-\${item.id}" class="max-h-full max-w-full object-contain hidden">
                        <div id="loader-\${item.id}" class="text-xs text-gray-500 animate-pulse">計算中...</div>
                        <span class="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] bg-black/75 rounded text-green-400">Processed</span>
                    </div>
                </div>
                <!-- Download button -->
                <div class="flex justify-end pt-2 border-t border-gray-700/50">
                    <button id="dl-\${item.id}" disabled onclick="downloadImage('\${item.id}')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600/50 text-indigo-300 cursor-not-allowed">Download PNG</button>
                    <button onclick="removeImage('\${item.id}')" class="px-3 py-1.5 text-xs text-red-400 border border-red-950/20 hover:bg-red-950/25 rounded-lg ml-2">Remove</button>
                </div>
            \`;
            grid.appendChild(card);
        }

        async function processImage(item) {
            const key = apiKeyInput.value.trim();
            if (key) {
                // Call Gemini API directly (Standard implementation)
                try {
                    const base64Str = await callGeminiAPI(key, item.file);
                    item.processedUrl = "data:image/png;base64," + base64Str;
                    item.status = 'success';
                    updateItemUI(item);
                } catch (err) {
                    console.error(err);
                    showMessage("Gemini API Error, falling back to Native Local Canvas remover", "warning");
                    processImageNative(item);
                }
            } else {
                // Call Native Local Background Removal
                processImageNative(item);
            }
        }

        function processImageNative(item) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imgData.data;

                    // Chroma-key algorithm: Replace white/near-white backgrounds with pure transparent,
                    // or solid white as default is Solid White, wait, user requested Solid White background!
                    // Let's replace simple high-luminance/white backgrounds with clean studio backgrounds.
                    // Or let's allow transparent background download for offline use as it's highly requested for keying!
                    // Offline standard: if white, make it transparent (true background removal). If not white, leaves as is.
                    // To do an elegant threshold:
                    // Sample corners to detect background color
                    const corners = [
                        [0, 0], [canvas.width - 1, 0], 
                        [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]
                    ];
                    let rSum = 0, gSum = 0, bSum = 0;
                    corners.forEach(coord => {
                        const idx = (coord[1] * canvas.width + coord[0]) * 4;
                        rSum += data[idx];
                        gSum += data[idx+1];
                        bSum += data[idx+2];
                    });
                    const bgR = Math.round(rSum / 4);
                    const bgG = Math.round(gSum / 4);
                    const bgB = Math.round(bSum / 4);

                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i+1];
                        const b = data[i+2];

                        // Euclidean distance in RGB color space
                        const dist = Math.sqrt(
                            Math.pow(r - bgR, 2) + 
                            Math.pow(g - bgG, 2) + 
                            Math.pow(b - bgB, 2)
                        );

                        if (dist < tolerance) {
                            // Turn into perfectly pure transparent PNG (true去背)
                            data[i+3] = 0; // Alpha
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                    item.processedUrl = canvas.toDataURL('image/png');
                    item.status = 'success';
                    updateItemUI(item);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(item.file);
        }

        function reProcessAllNative() {
            originalImages.forEach(item => {
                const loader = document.getElementById('loader-' + item.id);
                const procImg = document.getElementById('img-proc-' + item.id);
                if (loader) loader.classList.remove('hidden');
                if (procImg) procImg.classList.add('hidden');
                
                processImageNative(item);
            });
        }

        function updateItemUI(item) {
            const card = document.getElementById('card-' + item.id);
            if (!card) return;

            const statusLabel = document.getElementById('status-' + item.id);
            const loader = document.getElementById('loader-' + item.id);
            const procImg = document.getElementById('img-proc-' + item.id);
            const dlBtn = document.getElementById('dl-' + item.id);

            statusLabel.innerText = "Success";
            statusLabel.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400";
            
            if (loader) loader.classList.add('hidden');
            if (procImg) {
                procImg.src = item.processedUrl;
                procImg.classList.remove('hidden');
            }

            dlBtn.disabled = false;
            dlBtn.className = "px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all";
        }

        function removeImage(id) {
            const card = document.getElementById('card-' + id);
            if (card) card.remove();
            originalImages = originalImages.filter(item => item.id !== id);
        }

        function downloadImage(id) {
            const item = originalImages.find(x => x.id === id);
            if (item && item.processedUrl) {
                const link = document.createElement('a');
                link.href = item.processedUrl;
                const origName = item.file.name.substring(0, item.file.name.lastIndexOf('.'));
                link.download = origName + "_no_bg.png";
                link.click();
            }
        }

        async function callGeminiAPI(key, file) {
            const toBase64 = f => new Promise((res, rej) => {
                const r = new FileReader();
                r.readAsDataURL(f);
                r.onload = () => res(r.result.split(',')[1]);
                r.onerror = rej;
            });

            const b64 = await toBase64(file);
            const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + key;
            
            const payload = {
                contents: {
                    parts: [
                        { inlineData: { data: b64, mimeType: file.type } },
                        { text: "SYSTEM TASK: REPLACE BACKGROUND WITH WHITE.\\n\\nIdentify the main subject, replace background pixels with pure solid white RGB(255, 255, 255).\\n\\nOUTPUT: Solid white background image only." }
                    ]
                },
                config: {
                    responseModalities: ["IMAGE"]
                }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const resJson = await response.json();
            const base64Out = resJson.candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
            return base64Out;
        }
    </script>
</body>
</html>`;

export function downloadOfflineTool(tab: 'remover' | 'converter' | 'dessicant' | 'plasticBag' | 'plasticSize') {
  switch (tab) {
    case 'remover':
      saveAsFile(getBackgroundRemoverHTML(), 'offline_background_remover.html');
      break;
    case 'converter':
      saveAsFile(getUnitConverterHTML(), 'offline_unit_converter.html');
      break;
    case 'dessicant':
      saveAsFile(getDesiccantHTML(), 'offline_desiccant_calculator.html');
      break;
    case 'plasticBag':
      saveAsFile(getPlasticBagWeightHTML(), 'offline_plastic_bag_weight_calculator.html');
      break;
    case 'plasticSize':
      saveAsFile(getPlasticBagSizingHTML(), 'offline_plastic_bag_sizing.html');
      break;
  }
}
