import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { auth, database } from '../firebase';

const UserContext = createContext();

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
            if (authUser) {
                // Fetch user details from Realtime Database
                const userRef = ref(database, `users/${authUser.uid}`);
                const snapshot = await get(userRef);
                const userData = snapshot.val();

                if (userData) {
                    // Combine auth details with database details
                    setUser({
                        ...authUser,
                        ...userData,
                    });
                } else {
                    // If no user data exists in the database, fallback to auth data
                    setUser({
                        ...authUser,
                        displayName: authUser.displayName || 'Anonymous',
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);  // Loading complete
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading }}>
            {!loading && children} {/* Ensure children render only after loading */}
        </UserContext.Provider>
    );
};
