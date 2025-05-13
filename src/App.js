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
import chapter0 from "./data/chapters/chapter0.json";
import chapter1 from "./data/chapters/chapter1.json";
import chapter2 from "./data/chapters/chapter2.json";
import chapter3 from "./data/chapters/chapter3.json";
import chapter4 from "./data/chapters/chapter4.json";
import chapter5 from "./data/chapters/chapter5.json";
import chapter6 from "./data/chapters/chapter6.json";
import chapter7 from "./data/chapters/chapter7.json";
import chapter8 from "./data/chapters/chapter8.json";

// Separate the NavigationTracker into its own component
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

// Wrapper component for the main content
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
      <Footer />
    </div>
  );
}

// Component to render the page content based on URL parameters
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

// Create an AppContent component that can use hooks
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate(); // Use the useNavigate hook

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

        // CHANGED: Load chapters from JSON instead of fetching from Firestore
        loadChaptersFromJson();
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
        setLoading(false); // Make sure to set loading to false when not authenticated
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]); // Add navigate to dependencies

  // CHANGED: New function to load chapters from JSON files
  const loadChaptersFromJson = () => {
    try {
      console.log("Loading chapters from JSON files");

      // Format the JSON data to match the structure expected by the app
      const chaptersWithPages = [
        {
          id: "Introduction: Managing Resources Yesterday, Today, & Tomorrow",
          title: chapter0.title,
          pages: chapter0.pages,
        },
        {
          id: "Lesson 1: Show Me the Money",
          title: chapter1.title,
          pages: chapter1.pages,
        },
        {
          id: "Lesson 2: Savin' Up",
          title: chapter2.title,
          pages: chapter2.pages,
        },
        {
          id: "Lesson 3: Dat's My Bank",
          title: chapter3.title,
          pages: chapter3.pages,
        },
        {
          id: "Lesson 4: Building Credit",
          title: chapter4.title,
          pages: chapter4.pages,
        },
        {
          id: "Lesson 5: Credit Cards & Cars",
          title: chapter5.title,
          pages: chapter5.pages,
        },
        {
          id: "Lesson 6: Surviving a Financial Emergency",
          title: chapter6.title,
          pages: chapter6.pages,
        },
        {
          id: "Lesson 7: Building a Career, Improving Your Community",
          title: chapter7.title,
          pages: chapter7.pages,
        },
        {
          id: "Lesson 8: Planning for Our Future",
          title: chapter8.title,
          pages: chapter8.pages,
        },
      ];

      console.log("Chapters loaded from JSON files:", chaptersWithPages);
      setChapters(chaptersWithPages);
      setLoading(false);
    } catch (error) {
      console.error("Error loading chapters from JSON:", error);
      setLoading(false);
    }
  };

  // REMOVED: fetchChapters function that used Firestore

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

  if (loading) {
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
      chapters={chapters}
      isAdmin={isAdmin}
      handleLogout={handleLogout}
    />
  );
}

// Main App component
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
