import './App.css';
import { InstanceVisualizer } from './components/InstanceVisualizer';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Constraint Synthesis</h1>
      </header>
      <main>
        <InstanceVisualizer />
      </main>
    </div>
  );
}

export default App;
