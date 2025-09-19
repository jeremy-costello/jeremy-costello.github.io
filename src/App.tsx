// App.tsx
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "./theme";

import Layout from "./components/layout/Layout";
import { NavigationRoutes } from "./components/navigation/Navigation";

function CrossOriginIsolation() {
  const location = useLocation();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const path = location.pathname;

      // Configure coi-serviceworker
      (window as any).coi = {
        shouldRegister: () =>
          (path.startsWith("/chat") || path.startsWith("/search")),
        // Deregister if not on chat/search
        shouldDeregister: () =>
          !(path.startsWith("/chat") || path.startsWith("/search")),
        coepCredentialless: () => true,
        coepDegrade: () => true,
        quiet: false,
      };

      // Dynamically load the script
      const scriptId = "coi-sw-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "/coi-serviceworker.js";
        document.head.appendChild(script);
      }
    }
  }, [location.pathname]);

  return null;
}

function App() {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("colorMode") as "light" | "dark") || "dark";
  });

  const [selectedBackground, setSelectedBackground] = useState<string>(() => {
    return (localStorage.getItem("backgroundImage") as string) || "bg1.jpg";
  });

  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(() => {
    const storedValue = localStorage.getItem("backgroundOpacity");
    const parsed = parseFloat(storedValue || "");
    return isNaN(parsed) ? 0.5 : parsed;
  });

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("colorMode", next);
      return next;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* Cross-origin isolation handler */}
        <CrossOriginIsolation />

        <Layout
          toggleTheme={toggleTheme}
          backgroundImage={selectedBackground}
          backgroundOpacity={backgroundOpacity}
        >
          <NavigationRoutes
            setSelectedBackground={setSelectedBackground}
            backgroundOpacity={backgroundOpacity}
            setBackgroundOpacity={setBackgroundOpacity}
          />
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
