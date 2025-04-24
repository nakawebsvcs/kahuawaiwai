import { React, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Navbar, Container } from "react-bootstrap";
import TableOfContents from "./components/TableOfContents";
import Page from "./components/Page";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import Login from "./components/Login";
import SearchBar from "./components/SearchBar";
import { db } from "./firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";

function NavigationTracker({ chapters }) {
  const location = useLocation();
  const path = location.pathname.split("/");
  const chapterId = path[2]; // Using string ID
  const pageId = parseInt(path[3]);

  const currentChapter = chapters.find((chapter) => chapter.id === chapterId);
  const currentPage = currentChapter?.pages?.find((page) => page.id === pageId);

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        console.log("Starting to fetch chapters from Firestore");

        // Get the chapters collection
        const chaptersCollection = collection(db, "chapters");
        const chaptersSnapshot = await getDocs(chaptersCollection);

        console.log("Chapters found:", chaptersSnapshot.docs.length);

        // Array to store all chapters with their pages
        const chaptersWithPages = [];

        // Process each chapter document
        for (const chapterDoc of chaptersSnapshot.docs) {
          console.log(`Processing chapter document ID: "${chapterDoc.id}"`);
          const chapterData = chapterDoc.data();
          console.log(`Chapter data:`, chapterData);

          // Map of chapter IDs to their subcollection names
          const subcollectionMap = {
            "Introduction: Managing Resources Yesterday, Today, & Tomorrow":
              "introduction",
            "Lesson 1: Show Me the Money": "lesson-1",
          };

          // Get the subcollection name for this chapter
          const subcollectionName =
            subcollectionMap[chapterDoc.id] ||
            chapterDoc.id.toLowerCase().replace(/\s+/g, "-");
          console.log(
            `Using subcollection name: "${subcollectionName}" for chapter: "${chapterDoc.id}"`
          );

          // Get the subcollection for this chapter
          const pagesPath = `chapters/${chapterDoc.id}/${subcollectionName}`;
          console.log(`Fetching pages from path: ${pagesPath}`);

          try {
            const pagesCollection = collection(db, pagesPath);
            const pagesSnapshot = await getDocs(pagesCollection);

            console.log(
              `Found ${pagesSnapshot.docs.length} pages in ${subcollectionName} subcollection`
            );

            if (pagesSnapshot.docs.length === 0) {
              console.warn(`No documents found in subcollection: ${pagesPath}`);
              continue; // Skip to next chapter if no pages found
            }

            // Log all document IDs in this subcollection
            console.log(
              `Page document IDs in ${subcollectionName}:`,
              pagesSnapshot.docs.map((doc) => doc.id)
            );

            // Map the pages from the subcollection
            const pages = pagesSnapshot.docs.map((pageDoc) => {
              const pageData = pageDoc.data();

              // Debug logging
              console.log(`Page ${pageDoc.id} data:`, pageData);

              // Handle media (could be video or image)
              let media = null;
              if (pageData.video) {
                media = {
                  type: "video",
                  url: pageData.video,
                };
              } else if (pageData.image) {
                media = {
                  type: "image",
                  url: pageData.image,
                };
              } else if (pageData.media) {
                // If there's a generic media field, determine type based on extension
                const url = pageData.media;
                const isVideo =
                  url &&
                  (url.endsWith(".mp4") ||
                    url.endsWith(".webm") ||
                    url.endsWith(".ogg") ||
                    url.includes("youtube.com") ||
                    url.includes("vimeo.com"));

                media = {
                  type: isVideo ? "video" : "image",
                  url: url,
                };
              }

              return {
                id: parseInt(pageDoc.id),
                title: pageData.title || pageData.Title || `Page ${pageDoc.id}`,
                content: pageData.content || pageData.Content || "",
                media: media,
              };
            });

            // Sort pages by ID
            pages.sort((a, b) => a.id - b.id);

            // Add the chapter with its pages to our array
            chaptersWithPages.push({
              id: chapterDoc.id,
              title: chapterData.title || chapterDoc.id, // Use document ID as fallback without adding "Chapter"
              pages: pages,
            });
          } catch (error) {
            console.error(`Error fetching subcollection ${pagesPath}:`, error);
            continue; // Skip to next chapter if there's an error
          }
        }

        // Sort chapters (assuming Introduction should be first, then lessons by number)
        chaptersWithPages.sort((a, b) => {
          if (a.id.startsWith("Introduction")) return -1;
          if (b.id.startsWith("Introduction")) return 1;
          return a.id.localeCompare(b.id);
        });

        console.log("Final processed chapters data:", chaptersWithPages);

        setChapters(chaptersWithPages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chapters:", error);
        console.error("Error details:", error.message, error.code);
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return <div className="loading">Loading content...</div>;
  }

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar fixed="top" className="title-bar">
          <Container>
            <Navbar.Brand className="title-text">
              Kahua Waiwai: <br /> Building a Foundation of Wealth
            </Navbar.Brand>
          </Container>
          <SearchBar />
        </Navbar>

        <NavigationTracker chapters={chapters} />

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
