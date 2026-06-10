
import React, { useState } from 'react';
import BackgroundRemover from './components/BackgroundRemover';
import UnitConverter from './components/UnitConverter';
import DessicantCalculator from './components/DessicantCalculator';
import PlasticBagCalculator from './components/PlasticBagCalculator';
import PlasticSizeCalculator from './components/PlasticSizeCalculator';

type Tab = 'remover' | 'converter' | 'dessicant' | 'plasticBag' | 'plasticSize';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('remover');

  const getNavButtonClasses = (tabName: Tab) => 
    `flex flex-col items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-indigo-500 min-w-[110px] h-full ${
      activeTab === tabName
        ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
    }`;

  const Icons = {
    remover: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    converter: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    dessicant: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    plasticBag: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    plasticSize: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    )
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                AI Multi-Tool
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
                Your all-in-one solution for image processing and technical calculations.
            </p>
        </header>
        
        <nav className="flex flex-wrap justify-center mb-8 gap-4 items-stretch">
          <button 
            onClick={() => setActiveTab('remover')}
            className={getNavButtonClasses('remover')}
          >
            {Icons.remover}
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">Background<br/>Remover</span>
          </button>
          <button 
            onClick={() => setActiveTab('converter')}
            className={getNavButtonClasses('converter')}
          >
            {Icons.converter}
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">Unit<br/>Converter</span>
          </button>
          <button 
            onClick={() => setActiveTab('dessicant')}
            className={getNavButtonClasses('dessicant')}
          >
            {Icons.dessicant}
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">Desiccant<br/>Calculator</span>
          </button>
          <button 
            onClick={() => setActiveTab('plasticBag')}
            className={getNavButtonClasses('plasticBag')}
          >
            {Icons.plasticBag}
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">Plastic Bag<br/>Weight</span>
          </button>
          <button 
            onClick={() => setActiveTab('plasticSize')}
            className={getNavButtonClasses('plasticSize')}
          >
            {Icons.plasticSize}
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">Plastic Bag<br/>Sizing</span>
          </button>
        </nav>

        <div className="tab-content animate-fade-in">
          {activeTab === 'remover' && <BackgroundRemover />}
          {activeTab === 'converter' && <UnitConverter />}
          {activeTab === 'dessicant' && <DessicantCalculator />}
          {activeTab === 'plasticBag' && <PlasticBagCalculator />}
          {activeTab === 'plasticSize' && <PlasticSizeCalculator />}
        </div>

      </main>
    </div>
  );
}

export default App;
