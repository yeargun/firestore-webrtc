import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import RecievePage from "./pages/RecievePage";
import SendPage from "./pages/SendPage";

function App() {
  return (
    <Routes>
      <Route path="/about" element={<Home />} />
      <Route path="/" element={<SendPage />} />
      <Route path="/recieve/*" element={<RecievePage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function WrappedApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default WrappedApp;
