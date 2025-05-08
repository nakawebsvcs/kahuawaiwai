const admin = require("firebase-admin");
const serviceAccount = require("./kahua-waiwai-firebase-adminsdk-fbsvc-a641f1a835.json");

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function syncAdminClaims() {
  try {
    console.log("Starting admin claims sync...");

    // Get all users with admin role from Firestore
    const adminUsersSnapshot = await admin
      .firestore()
      .collection("users")
      .where("role", "==", "admin")
      .get();

    console.log(`Found ${adminUsersSnapshot.size} admin users in Firestore`);

    if (adminUsersSnapshot.empty) {
      console.log("No admin users found in Firestore.");
      return;
    }

    // Process each admin user
    const updates = [];
    adminUsersSnapshot.forEach((doc) => {
      const userId = doc.id;
      const userData = doc.data();
      console.log(`Processing admin user: ${userData.email} (${userId})`);

      updates.push(
        admin
          .auth()
          .setCustomUserClaims(userId, { admin: true })
          .then(() => {
            console.log(
              `✅ Set admin claim for user ${userData.email} (${userId})`
            );
            return { userId, email: userData.email, success: true };
          })
          .catch((error) => {
            console.error(
              `❌ Failed to set admin claim for user ${userData.email} (${userId}):`,
              error
            );
            return {
              userId,
              email: userData.email,
              success: false,
              error: error.message,
            };
          })
      );
    });

    // Wait for all updates to complete
    const results = await Promise.all(updates);

    // Summarize results
    const successful = results.filter((r) => r.success).length;
    console.log(`\nAdmin claims sync complete.`);
    console.log(
      `✅ Successfully updated ${successful} out of ${results.length} admin users`
    );

    if (successful < results.length) {
      console.log(`❌ Failed to update ${results.length - successful} users`);
      const failures = results.filter((r) => !r.success);
      failures.forEach((f) => {
        console.log(`  - ${f.email}: ${f.error}`);
      });
    }
  } catch (error) {
    console.error("Error syncing admin claims:", error);
  } finally {
    // Exit the process when done
    process.exit(0);
  }
}

// Run the function
syncAdminClaims();
