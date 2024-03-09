import React from 'react';
import { ContextProvider } from './WagmiContextProvider';
import './App.css';

function ConnectButton() {
  return <w3m-button />
}

function App() {
    return (
        <ContextProvider>
            <div className="App">
                <header className="App-header">
                    <div>FootiuMM</div>
                    <ConnectButton />
                </header>
            </div>
        </ContextProvider>
    );
}

export default App;
