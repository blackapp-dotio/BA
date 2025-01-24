import { ref, get, set, remove, child } from 'firebase/database';
import { database } from '../firebase';

/**
 * Fetch all circles and members.
 */
 
export const fetchCircles = async () => {
  try {
    const circlesRef = ref(database, 'circles');
    const snapshot = await get(circlesRef);

    if (!snapshot.exists()) return [];

    const circles = await Promise.all(
      Object.entries(snapshot.val()).map(async ([circleName, circleData]) => {
        const members = circleData.members
          ? await Promise.all(
              Object.keys(circleData.members).map(async (uid) => {
                const userRef = ref(database, `users/${uid}`);
                const userSnapshot = await get(userRef);
                return userSnapshot.exists()
                  ? { uid, displayName: userSnapshot.val().displayName || 'Unknown' }
                  : { uid, displayName: 'Unknown' };
              })
            )
          : [];

        return { name: circleName, color: circleData.color || '#FFFFFF', members };
      })
    );

    return circles;
  } catch (error) {
    console.error('Error fetching circles:', error);
    throw error;
  }
};

export const getActivityLevels = async (circleName) => {
    const activityRef = ref(database, `circles/${circleName}/activity`);
    const snapshot = await get(activityRef);

    if (snapshot.exists()) {
        return snapshot.val(); // Return activity levels
    }
    return {};
};


/**
 * Add a member to a circle.
 */
export const addMemberToCircle = async (circleName, userId) => {
  try {
    const memberRef = ref(database, `circles/${circleName}/members/${userId}`);
    await set(memberRef, true);
    console.log(`User "${userId}" added to circle "${circleName}".`);
  } catch (error) {
    console.error(`Error adding member to circle "${circleName}":`, error);
    throw error;
  }
};

/**
 * Remove a member from a circle.
 */
export const removeMemberFromCircle = async (circleName, userId) => {
  try {
    const memberRef = ref(database, `circles/${circleName}/members/${userId}`);
    await remove(memberRef);
    console.log(`User "${userId}" removed from circle "${circleName}".`);
  } catch (error) {
    console.error(`Error removing member from circle "${circleName}":`, error);
    throw error;
  }
};
