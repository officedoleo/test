import { useEffect, Component } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import { Toaster } from "@/components/ui/sonner";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-obsidian text-slate-200 flex items-center justify-center p-8">
          <p>Algo deu errado. Recarregue a página.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, anchors: true, autoRaf: true });
    window.__lenis = lenis;
    return () => {
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#121824",
              border: "1px solid rgba(0,229,255,0.25)",
              color: "#F1F5F9",
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
