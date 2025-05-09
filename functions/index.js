const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Create a new user (admin only)
exports.createUser = functions.https.onCall(async (request) => {
  console.log("createUser called");
  console.log("request auth:", request.auth); // Log the auth object

  // Check if the request is made by an authenticated user
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Check for admin claim in token first, then fall back to Firestore check
  if (!request.auth.token.admin) {
    // Verify the caller is an admin by checking their role in Firestore
    const callerUid = request.auth.uid;
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
  } else {
    console.log("User has admin claim in token");
  }

  // Validate input
  if (!request.data.email || !request.data.password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and password are required"
    );
  }

  try {
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: request.data.email,
      password: request.data.password,
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
        email: request.data.email,
        role: request.data.role || "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: request.auth.uid,
      });

    // Set custom claims for admin users
    if (request.auth.role === "admin") {
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
      console.log(`Set admin claim for user ${userRecord.uid}`);
    }

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Delete a user (admin only)
exports.deleteUser = functions.https.onCall(async (request) => {
  // Check if the request is made by an authenticated user
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Check for admin claim in token first, then fall back to Firestore check
  if (!request.auth.token.admin) {
    // Verify the caller is an admin
    const callerUid = request.auth.uid;
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
  } else {
    console.log("User has admin claim in token");
  }

  // Validate input
  if (!request.data.uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID is required"
    );
  }

  try {
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(request.data.uid);

    // Delete the user document from Firestore
    await admin.firestore().collection("users").doc(request.data.uid).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get all users (admin only)
exports.getUsers = functions.https.onCall(async (request) => {
  console.log("getUsers called");
  console.log("Context changed to request")
  console.log("Context auth:", request.auth); // Log the auth object 

  // Check if the request is made by an authenticated user
  if (!request.auth) {
    console.warn("Authentication required: request.auth is null"); // Add log here
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  console.log("User is authenticated. UID:", request.auth.uid); // Log if authenticated
  console.log("User token claims:", request.auth.token); // Log token claims for debugging

  // Check for admin claim in token first, then fall back to Firestore check
  if (!request.auth.token.admin) {
    console.log("No admin claim in token, checking Firestore...");
    // Verify the caller is an admin
    const callerUid = request.auth.uid;
    const callerDoc = await admin
      .firestore()
      .collection("users")
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || callerDoc.data().role !== "admin") {
      console.log("User is not admin in Firestore either");
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin privileges required"
      );
    }
    console.log("User is admin in Firestore");
  } else {
    console.log("User has admin claim in token");
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
