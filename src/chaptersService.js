import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./config";

export const fetchChapters = async () => {
  try {
    const chaptersCollection = collection(db, "chapters");
    const q = query(chaptersCollection, orderBy("id"));
    const querySnapshot = await getDocs(q);

    const chapters = [];
    querySnapshot.forEach((doc) => {
      chapters.push({
        ...doc.data(),
        firestoreId: doc.id, // Store the Firestore document ID for future reference
      });
    });

    return chapters;
  } catch (error) {
    console.error("Error fetching chapters from Firestore:", error);
    throw error;
  }
};
