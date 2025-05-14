import { React, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Navbar, Container } from "react-bootstrap";
import TableOfContents from "./components/TableOfContents";
import Footer from "./components/Footer";
import Page from "./components/Page";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import Login from "./components/Login";
import SearchBar from "./components/SearchBar";
import { db, auth } from "./firebase";
import { getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AdminPanel from "./components/AdminPanel";

// Import chapter data
import { ChapterProvider, useChapters } from "./components/ChapterContext";

// Separate the NavigationTracker into its own component
function NavigationTracker() {
  const {chapters} = useChapters();
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

// Wrapper component for the main content
function MainContent({ isAdmin, handleLogout }) {
  const {chapters} = useChapters();
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
                <TableOfContents />
                <main className="content-area">
                  <Container>
                    <div className="welcome-page">
                      <h1 style={{ marginTop: "4rem" }}>
                        Welcome to Kahua Waiwai!
                      </h1>
                      <p style={{ marginTop: "2rem" }}>
                        Select a page from the table of contents to begin.
                      </p>
                      <div
                        className="video-container"
                        style={{ marginBottom: "2rem" }}
                      >
                        <video width="100%" autoPlay loop muted playsInline>
                          <source
                            src="/assets/kh_robot_animation.mp4"
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      </div>
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
                <div className="nav-tracker d-flex justify-content-between align-items-center admin-nav-tracker">
                  <span className="text-body">Admin Panel</span>
                  {/* Remove SearchBar component */}
                </div>
                <div className="d-flex flex-grow-1">
                  {/* Remove TableOfContents component */}
                  <main
                    className="content-area admin-content"
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
              <NavigationTracker />
              <div className="d-flex flex-grow-1">
                <TableOfContents chapters={chapters} />
                <main className="content-area">
                  <Container>
                    <PageContent />
                  </Container>
                </main>
              </div>
            </>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

// Component to render the page content based on URL parameters
function PageContent() {
  const {chapters} = useChapters();
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


function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate(); 
  const { loading: chaptersLoading } = useChapters();

  useEffect(() => {
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
            // Force token refresh before navigation
            await user.getIdToken(true);
            // Use React Router navigation instead of window.location
            if (window.location.pathname !== "/admin") {
              navigate("/admin");
            }
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }

      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

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
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center p-4 bg-white rounded shadow-sm">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-2">Checking authentication...</h5>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (chaptersLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center p-4 bg-white rounded shadow-sm">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-2">Loading content...</h5>
        </div>
      </div>
    );
  }

  return (
    <MainContent
      isAdmin={isAdmin}
      handleLogout={handleLogout}
    />
  );
}

// Main App component
function App() {
  return (
    <Router>
      <ChapterProvider>
        <AppContent />
      </ChapterProvider>
    </Router>
  );
}

export default App;
