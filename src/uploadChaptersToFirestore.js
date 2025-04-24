import { collection, addDoc } from "firebase/firestore";
import { db } from "./config";
import { chapters } from "../components/chapters";

async function uploadChaptersToFirestore() {
  try {
    const chaptersCollection = collection(db, "chapters");

    for (const chapter of chapters) {
      await addDoc(chaptersCollection, chapter);
      console.log(`Chapter "${chapter.title}" uploaded successfully`);
    }

    console.log("All chapters uploaded to Firestore");
  } catch (error) {
    console.error("Error uploading chapters to Firestore:", error);
  }
}

// Run this function once to upload your data
uploadChaptersToFirestore();

// You can execute this file directly with Node.js:
// node -r esm src/firebase/uploadChaptersToFirestore.js