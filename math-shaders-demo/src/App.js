import React from 'react';
import MathShaders from './MathShaders'; // Keep only this one import
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Mathematical Shaders</h1>
      </header>
      <main>
        <MathShaders />
      </main>
    </div>
  );
}

export default App;
