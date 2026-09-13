
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRecord } from '../types';

// Helper to get or generate device ID
const getDeviceId = () => {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  return id;
};

// Helper to get client IP
const getClientIp = async () => {
  try {
    const res = await fetch('/api/ip', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        return data.ip || 'unknown';
      }
    }
    return 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

interface AuthContextType {
  currentUser: UserRecord | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        // Default user data from Auth
        const isAdmin = user.email === 'admin@demo.com' || user.email === 'aegy238@gmail.com';
        const deviceId = getDeviceId();
        const ip = await getClientIp();
        
        const basicUserData: UserRecord = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || 'User',
          role: isAdmin ? 'admin' : 'user',
          isApproved: true,
          isVIP: false,
          status: 'active',
          subscriptionType: 'none',
          freeAttempts: 5,
          coins: 0,
          subscriptionExpiry: new Date(),
          createdAt: new Date(),
          lastLogin: new Date(),
          deviceId,
          lastIp: ip
        };

        // Listen for real-time updates to the user document
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Update IP and Device ID if they changed or are missing
            if (data.deviceId !== deviceId || data.lastIp !== ip) {
              updateDoc(userDocRef, { deviceId, lastIp: ip, lastLogin: new Date() }).catch(e => console.warn("Failed to update user metadata:", e));
            }
            setCurrentUser({ id: user.uid, ...data } as UserRecord);
          } else {
            // If doc doesn't exist, try to create it once
            setDoc(userDocRef, basicUserData).then(() => {
              setCurrentUser(basicUserData);
            }).catch(err => {
              console.warn("Could not create user document:", err);
              setCurrentUser(basicUserData);
            });
          }
          setLoading(false);
        }, (err) => {
          console.warn("User document snapshot error:", err);
          setCurrentUser(basicUserData);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(user, { displayName: name });
    
    // Create user document in Firestore
    const isAdmin = email === 'admin@demo.com' || email === 'aegy238@gmail.com';
    const deviceId = getDeviceId();
    const ip = await getClientIp();
    
    let defaultFreeAttempts = 5;
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        defaultFreeAttempts = data.defaultFreeAttempts ?? 5;
      }
    } catch (e) {
      console.warn("Could not fetch settings for default attempts:", e);
    }

    const newUserData: Omit<UserRecord, 'id'> = {
      name,
      email,
      role: isAdmin ? 'admin' : 'user',
      isApproved: true,
      isVIP: false,
      status: 'active',
      subscriptionType: 'none',
      freeAttempts: defaultFreeAttempts,
      coins: 0,
      subscriptionExpiry: new Date(),
      createdAt: new Date(),
      lastLogin: new Date(),
      deviceId,
      lastIp: ip
    };
    
    try {
      await runTransaction(db, async (transaction) => {
        let numericId = 10000;
        if (isAdmin) {
          numericId = 1;
        } else {
          const counterRef = doc(db, 'settings', 'userCounter');
          const counterDoc = await transaction.get(counterRef);
          if (counterDoc.exists()) {
            numericId = (counterDoc.data().lastId || 10000) - 1;
            // Prevent clash with admin ID 1
            if (numericId <= 1) numericId = 10000; 
            transaction.update(counterRef, { lastId: numericId });
          } else {
            transaction.set(counterRef, { lastId: 10000 });
          }
        }
        newUserData.numericId = numericId;
        transaction.set(doc(db, 'users', user.uid), newUserData);
      });
      setCurrentUser({ id: user.uid, ...newUserData } as UserRecord);
    } catch (err) {
      console.error("Firestore Write Error:", err);
      setCurrentUser({ id: user.uid, ...newUserData } as UserRecord);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
