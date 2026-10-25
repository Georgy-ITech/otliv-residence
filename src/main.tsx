import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, Outlet, RouterProvider, useLocation } from "react-router-dom";
import "@fontsource/prata/cyrillic-400.css";
import "@fontsource/prata/latin-400.css";
import "@fontsource/golos-text/cyrillic-400.css";
import "@fontsource/golos-text/cyrillic-500.css";
import "@fontsource/golos-text/cyrillic-600.css";
import "@fontsource/golos-text/latin-400.css";
import "@fontsource/golos-text/latin-500.css";
import "@fontsource/golos-text/latin-600.css";
import "./styles/app.css";
import { Footer, Header } from "./components/Chrome";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ApartmentPage from "./pages/Apartment";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/") window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>К содержанию</a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

// Хеш-роутер: GitHub Pages не умеет отдавать index.html на любой путь.
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/kvartiry", element: <Catalog /> },
      { path: "/kvartira/:id", element: <ApartmentPage /> },
      { path: "/sravnenie", element: <Compare /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
