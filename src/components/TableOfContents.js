import React, { useState } from "react";
import { Link } from "react-router-dom";

const TableOfContents = ({ chapters }) => {
  const [expandedChapters, setExpandedChapters] = useState({});

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  return (
    <div className="drawer-container">
      <div>
        <h3 className="table-of-contents-heading mb-4">Table of Contents</h3>
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
              >
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableOfContents;
