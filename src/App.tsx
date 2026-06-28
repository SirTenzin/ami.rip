import { useLocation } from "react-router-dom";

import { getRoute } from "./lib/content/pages";
import { usePagePresentation } from "./lib/theme/pagePresentation";

function App() {
  const { pathname } = useLocation();
  const { Component, frontmatter } = getRoute(pathname);

  usePagePresentation(frontmatter);

  return (
    <main className={`app-shell app-shell--${frontmatter.align}`}>
      <div className="page-wrap">
        <div className="page-content">
          <article className="markdown">
            <Component />
          </article>
        </div>
      </div>
    </main>
  );
}

export default App;
