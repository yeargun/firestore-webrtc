import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import RecievePage from "./pages/RecievePage";
import SendPage from "./pages/SendPage";

function App() {
  return (
    <Routes>
      <Route path="/about" element={<Home />} />
      <Route path="/revieve" element={<RecievePage />} />
      <Route path="/" element={<SendPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function WrappedApp() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}

export default WrappedApp;
