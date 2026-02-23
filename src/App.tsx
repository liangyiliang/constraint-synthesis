import './App.css';
import { MultiInstanceSynthesis } from './components/MultiInstanceSynthesis';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Constraint Synthesis</h1>
      </header>
      <main>
        <MultiInstanceSynthesis />
      </main>
    </div>
  );
}

export default App;
