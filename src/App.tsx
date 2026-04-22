import './App.css';
import NewSynthesisInterface from './components/NewSynthesisInterface';
import SynthesisInterface from './components/SynthesisInterface';
import { BTreeInsts } from './model_instance/exploratory_examples/btree/insts';
import { BTreeModel } from './model_instance/exploratory_examples/btree/model';
import { RingInsts } from './model_instance/exploratory_examples/ring/insts';
import { RingModel } from './model_instance/exploratory_examples/ring/model';
import { RingANdLineInsts } from './model_instance/exploratory_examples/ring_and_line/insts';
import { RingAndLine } from './model_instance/exploratory_examples/ring_and_line/model';

function App() {
  return (
    <div className="App">
      <main>
        <NewSynthesisInterface
          initialMode="ClassificationMode"
          model={BTreeModel}
          instances={BTreeInsts}
        />
      </main>
    </div>
  );
}

export default App;
