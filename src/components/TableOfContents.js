import React, { useState } from "react";
import { Link } from "react-router-dom";

const TableOfContents = ({ chapters }) => {
  const [expandedChapters, setExpandedChapters] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
    setHasBeenClicked(true);
  };

  return (
    <>
      {/* Thin sidebar toggle button */}
      <button
        className={`drawer-toggle ${drawerOpen ? "open" : ""} ${
          hasBeenClicked ? "clicked" : ""
        }`}
        onClick={toggleDrawer}
        aria-label="Toggle table of contents"
      >
        <i className="bi bi-chevron-right"></i>
      </button>

      {/* Backdrop for mobile drawer */}
      <div
        className={`drawer-backdrop ${drawerOpen ? "visible" : ""}`}
        onClick={toggleDrawer}
      ></div>

      <div className={`drawer-container ${drawerOpen ? "open" : ""}`}>
        <div>
          <h3
            className="table-of-contents-heading mb-4"
            style={{ marginTop: "3rem" }}
          >
            Table of Contents
          </h3>
        </div>

        {chapters.map((chapter) => (
          <div key={chapter.id} className="mb-3">
            <div
              className="chapter-link"
              onClick={() => toggleChapter(chapter.id)}
            >
              <i
                className={`bi ${
                  expandedChapters[chapter.id]
                    ? "bi-chevron-down"
                    : "bi-chevron-right"
                }`}
              ></i>
              <span className="ms-2">{chapter.title}</span>
            </div>
            <div
              className={`chapter-content ${
                expandedChapters[chapter.id] ? "expanded" : "collapsed"
              }`}
            >
              {chapter.pages.map((page) => (
                <Link
                  key={page.id}
                  to={`/chapter/${chapter.id}/${page.id}`}
                  className="page-link"
                  onClick={() => {
                    // Close drawer on mobile when a page is selected
                    if (window.innerWidth <= 768) {
                      setDrawerOpen(false);
                    }
                  }}
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TableOfContents;
