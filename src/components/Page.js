import React from "react";

function Page({ chapter, page }) {
  return (
    <div className="mt-4">
      <h2>{chapter.title}</h2>
      <h4>{page.title}</h4>
      <div>{page.content}</div>
    </div>
  );
}

export default Page;
