import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Navbar, Container, Nav } from "react-bootstrap";
import Chapter from "./components/Chapter";
import TableOfContents from "./components/TableOfContents";
import Page from "./components/Page";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import { chapters } from "./components/chapters";

function NavigationTracker() {
  const location = useLocation();
  const path = location.pathname.split("/");
  const chapterId = parseInt(path[2]);
  const pageId = parseInt(path[3]);

  const currentChapter = chapters.find((chapter) => chapter.id === chapterId);
  const currentPage = currentChapter?.pages.find((page) => page.id === pageId);

  return (
    <div className="nav-tracker">
      <span className="text-body">
        {currentChapter
          ? `${currentChapter.title} - ${currentPage?.title || ""}`
          : "Welcome!"}
      </span>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar fixed="top" className="title-bar">
          <Container>
            <Navbar.Brand className="title-text">
              Kahua Waiwai: <br /> Building a Foundation of Wealth
            </Navbar.Brand>
          </Container>
        </Navbar>

        <NavigationTracker />

        <div className="d-flex flex-grow-1">
          <TableOfContents chapters={chapters} />

          <main className="content-area">
            <Container>
              <Routes>
                {chapters.map((chapter) =>
                  chapter.pages.map((page) => (
                    <Route
                      key={`${chapter.id}-${page.id}`}
                      path={`/chapter/${chapter.id}/${page.id}`}
                      element={<Page chapter={chapter} page={page} />}
                    />
                  ))
                )}
              </Routes>
            </Container>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
