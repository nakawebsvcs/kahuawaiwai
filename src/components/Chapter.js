import React from "react";

function Chapter({ chapter }) {
  return (
    <div>
      <h3>{chapter.title}</h3>
      <p>{chapter.content}</p>
    </div>
  );
}

export default Chapter;
