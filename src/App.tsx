import { Button } from "./components/button";


function App() {
  return (
    <>
      <p className="text-center text-xl mb-4">Welcome Home</p>

      <div className="flex justify-center gap-4">
        <Button variant="primary" size="md" onClick={() => alert("Clicked!")}>
          Click Me
        </Button>

        <Button variant="secondary" size="md">
          Secondary
        </Button>

        <Button variant="danger" disabled>
          Disabled
        </Button>
      </div>
    </>
  );
}

export default App;