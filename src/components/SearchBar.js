import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { chapters } from "./chapters";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length > 2) {
      const results = chapters
        .flatMap((chapter) =>
          chapter.pages.map((page) => ({
            chapter,
            page,
            match: `${chapter.title} ${page.title} ${page.content}`
              .toLowerCase()
              .includes(term.toLowerCase()),
          }))
        )
        .filter((result) => result.match);

      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleResultClick = (chapterId, pageId) => {
    navigate(`/chapter/${chapterId}/${pageId}`);
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <div className="search-container position-relative">
      <input
        type="search"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search content..."
        className="form-control"
      />

      {searchResults.length > 0 && (
        <div className="search-results position-absolute w-100 mt-1">
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
                {page.content?.substring(0, 100)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
