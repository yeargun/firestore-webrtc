import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import NotFound from "./components/NotFound/NotFound";
import RecievePage from "./components/RecievePage/RecievePage";
import SendPage from "./components/SendPage/SendPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SendPage />} />
        <Route path="/recieve/*" element={<RecievePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
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
