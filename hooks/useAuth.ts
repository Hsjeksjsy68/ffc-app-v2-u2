import { useState, useEffect, createContext, useContext } from 'react';
// Fix: Removed modular imports for Firebase v9.
// import { onAuthStateChanged } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import type { User as FirebaseUser } from 'firebase/auth';
import { auth, firestore } from '../services/firebase';

// Fix: Redefined the User interface to be a plain object to avoid issues with spreading a complex FirebaseUser object.
// The original FirebaseUser type includes methods that are lost during a spread, causing type incompatibilities.
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAdmin?: boolean;
    isCoach?: boolean;
}

export interface AuthState {
    user: User | null;
    isAdmin: boolean;
    isCoach: boolean;
}

export const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, isCoach: false });

export const useAuth = (): AuthState => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCoach, setIsCoach] = useState(false);

    useEffect(() => {
        // Fix: Use the namespaced onAuthStateChanged method for Firebase v8.
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                let hasAdminRole = false;
                let hasCoachRole = false;
                try {
                    const userDocRef = firestore.collection('users').doc(firebaseUser.uid);
                    const userDocSnap = await userDocRef.get();
                     if (userDocSnap.exists) {
                        const userData = userDocSnap.data() as { isAdmin?: boolean, isCoach?: boolean };
                        hasAdminRole = userData.isAdmin === true;
                        hasCoachRole = userData.isCoach === true;
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                    // If fetching the user document fails (e.g., permissions),
                    // proceed with login but treat the user as non-admin/non-coach.
                }

                setIsAdmin(hasAdminRole);
                setIsCoach(hasCoachRole);
                // Fix: Explicitly create a plain user object to match the updated User interface.
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    isAdmin: hasAdminRole,
                    isCoach: hasCoachRole,
                });
            } else {
                setUser(null);
                setIsAdmin(false);
                setIsCoach(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { user, isAdmin, isCoach };
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}