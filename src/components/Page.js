import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function Page({ chapter, page }) {
  const location = useLocation();
  const [highlightedContent, setHighlightedContent] = useState(page.content);

  // Extract search term from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const highlightTerm = queryParams.get("highlight");

    if (page.content) {
      // First replace newlines with <br> tags
      let processedContent = page.content.replace(/\n/g, "<br>");

      // Then highlight the search term if it exists
      if (highlightTerm) {
        // Create a case-insensitive regular expression for the search term
        const regex = new RegExp(
          `(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          "gi"
        );

        // Replace occurrences with highlighted version
        processedContent = processedContent.replace(
          regex,
          '<span class="search-highlight">$1</span>'
        );
      }

      setHighlightedContent(processedContent);
    } else {
      setHighlightedContent("");
    }
  }, [location.search, page.content]);

  // Function to resolve the media URL
  const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return null;

    // Special case for the robot animation that's now in public/assets
    if (mediaPath === "../assets/kh_robot_animation.mp4") {
      return "/assets/kh_robot_animation.mp4"; // Note the leading slash
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
      <h4 style={{ padding: "1rem 0" }}>{page.title}</h4>
      {renderMedia()}
      <div
        className="mt-3"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
    </div>
  );
}

export default Page;
