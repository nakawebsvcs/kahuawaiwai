import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChapters } from "./ChapterContext";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const { chapters, loading } = useChapters();

  // Function to normalize text by removing diacritical marks and 'okina
  const normalizeText = (text) => {
    return text
      .normalize("NFD") // Decompose characters with diacriticals
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
      .replace(/[''`]/g, "") // Remove Hawaiian 'okina marks (various forms)
      .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
      .replace(/\s+/g, " ") // Collapse multiple spaces into single spaces
      .trim() // Remove leading/trailing spaces
      .toLowerCase();
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length > 2 && chapters.length > 0) {
      // Create a more efficient search with diacritical normalization
      const results = [];

      chapters.forEach((chapter) => {
        if (!chapter.pages || !Array.isArray(chapter.pages)) {
          console.warn(
            `Chapter ${chapter.id} has no pages or pages is not an array`
          );
          return;
        }

        // Normalize the search term
        const normalizedSearchTerm = normalizeText(term);

        chapter.pages.forEach((page) => {
          const chapterTitle = chapter.title || "";
          const pageTitle = page.title || "";
          const pageContent = page.content || "";

          // Create the search text and normalize it
          const searchText = `${chapterTitle} ${pageTitle} ${pageContent}`;
          const normalizedSearchText = normalizeText(searchText);

          // Check if the normalized search text contains the normalized search term
          if (normalizedSearchText.includes(normalizedSearchTerm)) {
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
