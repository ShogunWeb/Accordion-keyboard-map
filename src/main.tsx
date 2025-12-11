import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { registerServiceWorker } from "./serviceWorker";

/**
 * Mount the React application into the root container.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();
