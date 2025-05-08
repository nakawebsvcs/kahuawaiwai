import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import chapter data
import chapter0 from "../data/chapters/chapter0.json";
import chapter1 from "../data/chapters/chapter1.json";
import chapter2 from "../data/chapters/chapter2.json";
import chapter3 from "../data/chapters/chapter3.json";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load chapters from JSON files when component mounts
  useEffect(() => {
    try {
      console.log("Loading chapters for search from JSON files");

      // Format the JSON data to match the structure expected by the search
      const chaptersData = [
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
      ];

      console.log("Chapters loaded for search:", chaptersData);
      setChapters(chaptersData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading chapters for search:", error);
      setLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length > 2 && chapters.length > 0) {
      // Create a more efficient search
      const results = [];

      chapters.forEach((chapter) => {
        if (!chapter.pages || !Array.isArray(chapter.pages)) {
          console.warn(
            `Chapter ${chapter.id} has no pages or pages is not an array`
          );
          return;
        }

        const termLower = term.toLowerCase();

        chapter.pages.forEach((page) => {
          const chapterTitle = chapter.title || "";
          const pageTitle = page.title || "";
          const pageContent = page.content || "";

          const searchText =
            `${chapterTitle} ${pageTitle} ${pageContent}`.toLowerCase();

          if (searchText.includes(termLower)) {
            results.push({
              chapter,
              page,
              match: true,
            });
          }
        });
      });

      console.log(`Found ${results.length} search results for "${term}"`);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleResultClick = (chapterId, pageId) => {
    console.log(
      `Navigating to chapter/${chapterId}/${pageId} with search term: ${searchTerm}`
    );
    // Pass the search term as a query parameter
    navigate(
      `/chapter/${chapterId}/${pageId}?highlight=${encodeURIComponent(
        searchTerm
      )}`
    );
    setSearchTerm("");
    setSearchResults([]);
  };


  return (
    <div className="search-container position-relative">
      <input
        type="search"
        value={searchTerm}
        onChange={handleSearch}
        placeholder={loading ? "Loading content..." : "Search content..."}
        className="form-control"
        disabled={loading}
      />

      {searchResults.length > 0 && (
        <div className="search-results position-absolute w-100 mt-1 shadow-sm">
          {searchResults.map(({ chapter, page }) => (
            <div
              key={`${chapter.id}-${page.id}`}
              className="search-result p-2 bg-white border"
              onClick={() => handleResultClick(chapter.id, page.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="fw-bold text-dark">{chapter.title}</div>
              <div className="text-secondary">{page.title}</div>
              <div className="small text-muted">
                {page.content?.substring(0, 100)}
                {page.content?.length > 100 ? "..." : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
