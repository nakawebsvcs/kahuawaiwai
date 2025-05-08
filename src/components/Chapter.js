import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Page from "./Page";

function Chapter({ getChapter, getPage }) {
  const { chapterId, pageId } = useParams();
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (chapterId && pageId) {
      const chapter = getChapter(chapterId);
      const page = getPage(chapterId, pageId);

      setCurrentChapter(chapter);
      setCurrentPage(page);
      setLoading(false);
    }
  }, [chapterId, pageId, getChapter, getPage]);

  const goToNextPage = () => {
    if (!currentChapter || !currentPage) return;

    const currentPageIndex = currentChapter.pages.findIndex(
      (p) => p.id === currentPage.id
    );

    if (currentPageIndex < currentChapter.pages.length - 1) {
      // Go to next page in current chapter
      const nextPage = currentChapter.pages[currentPageIndex + 1];
      navigate(`/chapter/${currentChapter.id}/${nextPage.id}`);
    } else {
      // Go to first page of next chapter
      const nextChapterId = currentChapter.id + 1;
      const nextChapter = getChapter(nextChapterId);

      if (nextChapter && nextChapter.pages && nextChapter.pages.length > 0) {
        navigate(`/chapter/${nextChapterId}/${nextChapter.pages[0].id}`);
      }
    }
  };

  const goToPreviousPage = () => {
    if (!currentChapter || !currentPage) return;

    const currentPageIndex = currentChapter.pages.findIndex(
      (p) => p.id === currentPage.id
    );

    if (currentPageIndex > 0) {
      // Go to previous page in current chapter
      const prevPage = currentChapter.pages[currentPageIndex - 1];
      navigate(`/chapter/${currentChapter.id}/${prevPage.id}`);
    } else {
      // Go to last page of previous chapter
      const prevChapterId = currentChapter.id - 1;
      const prevChapter = getChapter(prevChapterId);

      if (prevChapter && prevChapter.pages && prevChapter.pages.length > 0) {
        const lastPage = prevChapter.pages[prevChapter.pages.length - 1];
        navigate(`/chapter/${prevChapterId}/${lastPage.id}`);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading chapter content...</div>;
  }

  if (!currentChapter || !currentPage) {
    return <div className="error">Chapter or page not found</div>;
  }

  return (
    <div className="chapter-view">
      <div className="chapter-header">
        <h2>{currentChapter.title}</h2>
      </div>

      <Page chapter={currentChapter} page={currentPage} />

      <div className="navigation-buttons mt-4">
        <button
          className="btn btn-secondary"
          onClick={goToPreviousPage}
          disabled={currentChapter.id === 0 && currentPage.id === 1}
        >
          Previous
        </button>
        <button className="btn btn-primary ms-2" onClick={goToNextPage}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Chapter;
