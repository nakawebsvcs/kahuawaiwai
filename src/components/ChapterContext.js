import React, { createContext, useContext, useState, useEffect } from "react";

// Import chapter data
import welcome from "../data/chapters/welcome.json";
import chapter0 from "../data/chapters/chapter0.json";
import chapter1 from "../data/chapters/chapter1.json";
import chapter2 from "../data/chapters/chapter2.json";
import chapter3 from "../data/chapters/chapter3.json";
import chapter4 from "../data/chapters/chapter4.json";
import chapter5 from "../data/chapters/chapter5.json";
import chapter6 from "../data/chapters/chapter6.json";
import chapter7 from "../data/chapters/chapter7.json";
import chapter8 from "../data/chapters/chapter8.json";

const ChapterContext = createContext();

export function useChapters() {
  return useContext(ChapterContext);
}

export function ChapterProvider({ children }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load chapters from JSON files
    try {
      console.log("Loading chapters from JSON files");

      // Format JSON data to match the structure expected by the app
      const chaptersWithPages = [
        {
          id: "Welcome to Kahua Waiwai",
          title: welcome.title,
          pages: welcome.pages,
        },
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
  }, []);

  // Helper functions for navigation
  const getChapterIndex = (chapterId) => {
    return chapters.findIndex((chapter) => chapter.id === chapterId);
  };

  const getNextChapter = (chapterId) => {
    const currentIndex = getChapterIndex(chapterId);
    if (currentIndex < chapters.length - 1) {
      return chapters[currentIndex + 1];
    }
    return null;
  };

  const getPreviousChapter = (chapterId) => {
    const currentIndex = getChapterIndex(chapterId);
    if (currentIndex > 0) {
      return chapters[currentIndex - 1];
    }
    return null;
  };

  const value = {
    chapters,
    loading,
    getChapterIndex,
    getNextChapter,
    getPreviousChapter,
  };

  return (
    <ChapterContext.Provider value={value}>{children}</ChapterContext.Provider>
  );
}
