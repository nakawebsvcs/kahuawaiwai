import { React, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { Navbar, Container } from "react-bootstrap";
import TableOfContents from "./components/TableOfContents";
import Page from "./components/Page";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import Login from "./components/Login";
import SearchBar from "./components/SearchBar";
import { db, auth } from "./firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AdminPanel from "./components/AdminPanel";

// Separate the NavigationTracker into its own component outside of App
function NavigationTracker({ chapters }) {
  // Use useParams to get route parameters directly
  const params = useParams();
  const location = useLocation();

  console.log("Current location:", location);
  console.log("Route params:", params);
  console.log("Available chapters:", chapters);

  const chapterId = params.chapterId;
  const pageId = params.pageId ? parseInt(params.pageId) : null;

  console.log("Looking for chapter ID:", chapterId);
  console.log("Looking for page ID:", pageId);

  const currentChapter = chapters.find((chapter) => chapter.id === chapterId);
  const currentPage = currentChapter?.pages?.find((page) => page.id === pageId);

  console.log("Found chapter:", currentChapter);
  console.log("Found page:", currentPage);

  return (
    <div className="nav-tracker d-flex justify-content-between align-items-center">
      <span className="text-body">
        {currentChapter
          ? `${currentChapter.title} - ${currentPage?.title || ""}`
          : "Welcome!"}
      </span>
      <SearchBar />
    </div>
  );
}

// Create a wrapper component for the main content
function MainContent({ chapters, isAdmin, handleLogout }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar fixed="top" className="title-bar">
        <Container>
          <Navbar.Brand className="title-text">
            Kahua Waiwai: <br /> Building a Foundation of Wealth
          </Navbar.Brand>
        </Container>
        <button onClick={handleLogout} className="logout-btn">
          <i className="bi bi-box-arrow-right me-1"></i>
          Logout
        </button>
      </Navbar>

      <Routes>
        <Route
          path="/"
          element={
            <>
              <div className="nav-tracker d-flex justify-content-between align-items-center">
                <span className="text-body">Welcome!</span>
                <SearchBar />
              </div>
              <div className="d-flex flex-grow-1">
                <TableOfContents chapters={chapters} />
                <main className="content-area">
                  <Container>
                    <div className="welcome-page">
                      <h1 style={{ marginTop: "4rem" }}>
                        Welcome to Kahua Waiwai
                      </h1>
                      <p style={{ marginTop: "2rem" }}>
                        Select a chapter from the table of contents to begin.
                      </p>
                    </div>
                  </Container>
                </main>
              </div>
            </>
          }
        />

        <Route
          path="/admin"
          element={
            isAdmin ? (
              <>
                <div className="nav-tracker d-flex justify-content-between align-items-center">
                  <span className="text-body">Admin Panel</span>
                  {/* Remove SearchBar component */}
                </div>
                <div className="d-flex flex-grow-1">
                  {/* Remove TableOfContents component */}
                  <main
                    className="content-area"
                    style={{ marginLeft: 0, width: "100%" }}
                  >
                    <Container>
                      <AdminPanel />
                    </Container>
                  </main>
                </div>
              </>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/chapter/:chapterId/:pageId"
          element={
            <>
              <NavigationTracker chapters={chapters} />
              <div className="d-flex flex-grow-1">
                <TableOfContents chapters={chapters} />
                <main className="content-area">
                  <Container>
                    <PageContent chapters={chapters} />
                  </Container>
                </main>
              </div>
            </>
          }
        />
      </Routes>
    </div>
  );
}

// Create a component to render the page content based on URL parameters
function PageContent({ chapters }) {
  const { chapterId, pageId } = useParams();
  const parsedPageId = parseInt(pageId);

  const currentChapter = chapters.find((chapter) => chapter.id === chapterId);
  const currentPage = currentChapter?.pages?.find(
    (page) => page.id === parsedPageId
  );

  if (!currentChapter || !currentPage) {
    return <div>Page not found</div>;
  }

  return <Page chapter={currentChapter} page={currentPage} />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // const isDevelopment = process.env.NODE_ENV === "development";
    //const urlParams = new URLSearchParams(window.location.search);
    // const shouldBypass = urlParams.get("bypass") === "true";

    // For development only: bypass authentication if requested via URL parameter
    // if (isDevelopment && shouldBypass) {
      //console.log(
    //    "Development mode: Bypassing authentication via URL parameter"
      //);
   //   setIsAuthenticated(true);
   //   setIsAdmin(true); // Set to true if you want admin access
   //   setAuthLoading(false);
  //    fetchChapters();
   //   return () => {}; // Empty cleanup function
 //   }

    // Normal authentication flow
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUser(user);

        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
            // Redirect admin users to the admin panel
            // Check if we're not already on the admin page to avoid redirect loops
            if (window.location.pathname !== "/admin") {
              window.location.href = "/admin";
              return; // Exit early since we're redirecting
            }
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }

        // Fetch chapters after authentication
        fetchChapters();
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
        setLoading(false); // Make sure to set loading to false when not authenticated
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleLogin = () => {
    // The onAuthStateChanged listener will handle setting isAuthenticated to true
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle setting isAuthenticated to false
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return <div className="loading">Loading content...</div>;
  }

  return (
    <Router>
      <MainContent
        chapters={chapters}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
      />
    </Router>
  );
}

export default App;
