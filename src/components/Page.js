import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChapters } from "./ChapterContext";
import ReactMarkdown from "react-markdown";

function Page({ chapter, page }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getNextChapter, getPreviousChapter } = useChapters();
  const [highlightedContent, setHighlightedContent] = useState(page.content);

  // Extract search term from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const highlightTerm = queryParams.get("highlight");

    if (page.content) {
      let processedContent = page.content;

      // Apply search highlighting if term exists
      if (highlightTerm) {
        // Create a case-insensitive regular expression for the search term
        const regex = new RegExp(
          `(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          "gi"
        );

        // Replace occurrences with highlighted version
        processedContent = processedContent.replace(
          regex,
          '<mark class="search-highlight">$1</mark>'
        );
      }

      setHighlightedContent(processedContent);
    } else {
      setHighlightedContent("");
    }
  }, [location.search, page.content]);

  // Custom Markdown components for styling
  const markdownComponents = {
    p: ({ children }) => <p className="mb-4">{children}</p>,
    strong: ({ children }) => <strong className="fw-bold text-primary">{children}</strong>,
    em: ({ children }) => <em className="fst-italic text-muted">{children}</em>,
    h1: ({ children }) => <h1 className="display-4 fw-bold mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="h3 fw-semibold mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="h4 fw-medium mb-2">{children}</h3>,
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page.id]);

  // Function to navigate to the next page
  const goToNextPage = () => {
    if (!chapter || !page) return;

    const currentPageIndex = chapter.pages.findIndex((p) => p.id === page.id);

    if (currentPageIndex < chapter.pages.length - 1) {
      // Go to next page in current chapter
      const nextPage = chapter.pages[currentPageIndex + 1];
      navigate(`/chapter/${chapter.id}/${nextPage.id}`);
    } else {
      // Go to first page of next chapter
      const nextChapter = getNextChapter(chapter.id);
      if (nextChapter && nextChapter.pages && nextChapter.pages.length > 0) {
        navigate(`/chapter/${nextChapter.id}/${nextChapter.pages[0].id}`);
      } else {
        console.log("At the last page of the last chapter");
      }
    }
  };

  // Function to navigate to the previous page
  const goToPreviousPage = () => {
    if (!chapter || !page) return;

    const currentPageIndex = chapter.pages.findIndex((p) => p.id === page.id);

    if (currentPageIndex > 0) {
      // Go to previous page in current chapter
      const prevPage = chapter.pages[currentPageIndex - 1];
      navigate(`/chapter/${chapter.id}/${prevPage.id}`);
    } else {
      // Go to last page of previous chapter
      const prevChapter = getPreviousChapter(chapter.id);
      if (prevChapter && prevChapter.pages && prevChapter.pages.length > 0) {
        const lastPage = prevChapter.pages[prevChapter.pages.length - 1];
        navigate(`/chapter/${prevChapter.id}/${lastPage.id}`);
      } else {
        console.log("At the first page of the first chapter");
      }
    }
  };

  // Function to resolve the media URL
  const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return null;

    // Special case for the robot animation in public/assets
    if (mediaPath === "../assets/kh_robot_animation.mp4") {
      return "/assets/kh_robot_animation.mp4";
    }

    // Handle other relative paths that might start with ../assets/
    if (mediaPath.startsWith("../assets/")) {
      const fileName = mediaPath.split("/").pop();
      return `/assets/${fileName}`; // Convert to absolute path
    }

    // Return the original path for all other cases
    return mediaPath;
  };

  // Function to render the appropriate media component
  const renderMedia = () => {
    if (!page.media) return null;

    const { type, url } = page.media;
    const resolvedUrl = getMediaUrl(url);

    console.log(`Rendering media of type ${type}`);
    console.log(`Original URL: ${url}`);
    console.log(`Resolved URL: ${resolvedUrl}`);

    if (type === "video") {
      // Special case for the robot animation
      if (url.includes("kh_robot_animation.mp4")) {
        return (
          <div className="video-container">
            <video width="100%" autoPlay loop muted playsInline>
              <source src={resolvedUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }

      // Handle YouTube videos
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // YouTube handling code...
        return null;
      }

      // Handle Vimeo videos
      if (url.includes("vimeo.com")) {
        // Vimeo handling code...
        return null;
      }

      // Handle direct video files
      return (
        <div className="video-container">
          <video width="100%" controls>
            <source src={resolvedUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <p>
            <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
              Open video directly
            </a>
          </p>
        </div>
      );
    }

    if (type === "image") {
      return (
        <div className="image-container">
          <img
            src={resolvedUrl}
            alt={page.title || "Page image"}
            className="img-fluid mb-3"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ marginTop: "4rem" }}>
      <h2>{chapter.title}</h2>
      <h4 style={{ padding: "1rem 0", color: "#03aa22" }}>{page.title}</h4>
      {renderMedia()}
      <div className="mt-3">
        <ReactMarkdown components={markdownComponents}>
          {highlightedContent}
        </ReactMarkdown>
      </div>
      {/* Navigation links */}
      <div className="navigation-links mt-4 d-flex justify-content-between">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goToPreviousPage();
          }}
          className="nav-link text-decoration-none"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Previous
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goToNextPage();
          }}
          className="nav-link text-decoration-none"
        >
          Next
          <i className="bi bi-arrow-right ms-2"></i>
        </a>
      </div>
    </div>
  );
}

export default Page;
