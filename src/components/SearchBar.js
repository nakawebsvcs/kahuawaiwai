import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch chapters from Firestore when component mounts
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        console.log("Fetching chapters for search...");
        const chaptersCollection = collection(db, "chapters");
        const chaptersSnapshot = await getDocs(chaptersCollection);

        const chaptersData = [];

        // Process each chapter document
        for (const chapterDoc of chaptersSnapshot.docs) {
          const chapterData = chapterDoc.data();
          console.log(`Processing chapter: ${chapterDoc.id}`, chapterData);

          // Get pages subcollection
          const pagesCollection = collection(
            db,
            "chapters",
            chapterDoc.id,
            "pages"
          );
          const pagesSnapshot = await getDocs(pagesCollection);

          // Extract pages data
          const pages = pagesSnapshot.docs.map((pageDoc) => {
            const pageData = pageDoc.data();
            return {
              id: parseInt(pageDoc.id),
              title: pageData.title || "",
              content: pageData.content || "",
              // Include other page properties as needed
            };
          });

          console.log(
            `Found ${pages.length} pages for chapter ${chapterDoc.id}`
          );

          // Add chapter with its pages to the array
          chaptersData.push({
            id: chapterDoc.id,
            title: chapterData.title || "",
            pages: pages,
          });
        }

        console.log("Chapters loaded for search:", chaptersData);
        setChapters(chaptersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chapters for search:", error);
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    console.log("Search term:", term);
    console.log("Chapters available for search:", chapters);

    if (term.length > 2 && chapters.length > 0) {
      const results = chapters
        .flatMap((chapter) => {
          if (!chapter.pages || !Array.isArray(chapter.pages)) {
            console.warn(
              `Chapter ${chapter.id} has no pages or pages is not an array`
            );
            return [];
          }

          return chapter.pages.map((page) => {
            const chapterTitle = chapter.title || "";
            const pageTitle = page.title || "";
            const pageContent = page.content || "";

            const searchText =
              `${chapterTitle} ${pageTitle} ${pageContent}`.toLowerCase();
            const termLower = term.toLowerCase();

            const isMatch = searchText.includes(termLower);
            console.log(
              `Checking ${chapter.id}-${page.id}: ${
                isMatch ? "MATCH" : "no match"
              }`
            );

            return {
              chapter,
              page,
              match: isMatch,
            };
          });
        })
        .filter((result) => result.match);

      console.log("Search results:", results);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleResultClick = (chapterId, pageId) => {
    console.log(`Navigating to chapter/${chapterId}/${pageId}`);
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
        placeholder={loading ? "Loading content..." : "Search content..."}
        className="form-control"
        disabled={loading}
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
