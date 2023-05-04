import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import NotFound from "./components/NotFound/NotFound";
import ReceivePage from "./components/ReceivePage/ReceivePage";
import SendPage from "./components/SendPage/SendPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SendPage />} />
        <Route path="/receive/:uuid" element={<ReceivePage />} />
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
