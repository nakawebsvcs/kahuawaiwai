import React from "react";

function Page({ chapter, page }) {
  return (
    <div className="mt-4">
      <h2>{chapter.title}</h2>
      <h4>{page.title}</h4>
      {page.video && (
        <video width="100%" autoPlay loop muted>
          <source src={page.video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      <div>{page.content}</div>
    </div>
  );
}

export default Page;
