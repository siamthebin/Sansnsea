import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // Use onSnapshot to keep user data in sync
          const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data() as User;
              // Auto-upgrade sloudsan@gmail.com to admin if they are currently a user
              if (firebaseUser.email === 'sloudsan@gmail.com' && userData.role !== 'admin') {
                const updatedUser = { ...userData, role: 'admin' as const };
                setDoc(userDocRef, updatedUser).catch(error => {
                  console.error("Failed to upgrade admin role", error);
                });
                setUser(updatedUser);
              } else {
                setUser(userData);
              }
            } else {
              // User doc doesn't exist, create it
              const isAdmin = firebaseUser.email === 'sloudsan@gmail.com';
              const newUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: isAdmin ? 'admin' : 'user',
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL || '',
                createdAt: new Date().toISOString(),
              };
              
              setDoc(userDocRef, newUser).catch(error => {
                handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`);
              });
              setUser(newUser);
            }
            setLoading(false);
          }, (error) => {
             handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
             setLoading(false);
          });

          return () => unsubscribeUser();

        } catch (error) {
          console.error("Error fetching user data:", error);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
