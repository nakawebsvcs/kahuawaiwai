const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Create a new user (admin only)
exports.createUser = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Verify the caller is an admin by checking their role in Firestore
  const callerUid = context.auth.uid;
  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(callerUid)
    .get();

  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin privileges required"
    );
  }

  // Validate input
  if (!data.email || !data.password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and password are required"
    );
  }

  try {
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      emailVerified: false,
      disabled: false,
    });

    // Store additional user data in Firestore
    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email: data.email,
        role: data.role || "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerUid,
      });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Delete a user (admin only)
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Verify the caller is an admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(callerUid)
    .get();

  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin privileges required"
    );
  }

  // Validate input
  if (!data.uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID is required"
    );
  }

  try {
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(data.uid);

    // Delete the user document from Firestore
    await admin.firestore().collection("users").doc(data.uid).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get all users (admin only)
exports.getUsers = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Verify the caller is an admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(callerUid)
    .get();

  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin privileges required"
    );
  }

  try {
    // Get all users from Firestore
    const usersSnapshot = await admin.firestore().collection("users").get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { users };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
