import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  setLogLevel,
  runTransaction
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import type { UserProfile } from '../types/game';

try {
  setLogLevel('silent');
} catch {
  // ignore
}

const app = getApps().length > 0 ? getApp() : initializeApp(config);
export const db = (config as { firestoreDatabaseId?: string }).firestoreDatabaseId 
  ? getFirestore(app, (config as { firestoreDatabaseId?: string }).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Helper to generate unique VIP identifier using a transaction
export async function generateUniqueCustomId(isAdmin: boolean = false): Promise<string> {
  if (isAdmin) {
    return '1';
  }
  
  try {
    const counterRef = doc(db, 'settings', 'userCounter');
    const newId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let numericId = 10000;
      if (counterDoc.exists()) {
        numericId = (counterDoc.data().lastId || 10000) - 1;
        if (numericId <= 1) numericId = 10000;
      }
      transaction.set(counterRef, { lastId: numericId }, { merge: true });
      return numericId;
    });
    return String(newId);
  } catch (error) {
    console.error("Error generating custom ID:", error);
    // Fallback to random if transaction fails
    const randomNum = Math.floor(10000 + Math.random() * 9000);
    return String(randomNum);
  }
}

// Fetch user profile from Firestore
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return null;
  }
  const cleanId = userId.trim();
  try {
    const userRef = doc(db, 'users', cleanId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
  return null;
}

// Register with Email and Password
export async function registerWithEmail(
  email: string, 
  pass: string, 
  displayName: string
): Promise<{ user: User; profile: UserProfile }> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  if (!user || !user.uid || !user.uid.trim()) {
    throw new Error('User creation failed: missing valid UID');
  }

  const finalName = displayName.trim() || email.split('@')[0];
  try {
    await updateProfile(user, { displayName: finalName });
  } catch {
    // optional
  }

  // Any newly created account receives admin role and dashboard access as requested
  const isOwnerAdmin = (user.email || email).toLowerCase() === 'sdsdfdfddsfdd@gmail.com' || (user.email || email).toLowerCase().includes('admin');
  const customId = await generateUniqueCustomId(isOwnerAdmin);
  const role: 'admin' | 'player' | 'agency' = isOwnerAdmin ? 'admin' : 'player';

  const profile: UserProfile = {
    userId: user.uid.trim(),
    customId,
    email: user.email || email,
    displayName: finalName,
    role,
    balance: 0,
    totalWinnings: 0,
    totalBets: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to Firestore
  try {
    const userRef = doc(db, 'users', user.uid.trim());
    await setDoc(userRef, profile, { merge: true });
  } catch (err) {
    console.error('Firestore user save error:', err);
  }

  // Also notify server backend
  try {
    await fetch('/api/user/sync-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  } catch {
    // fallback
  }

  return { user, profile };
}

// Login with Email and Password
export async function loginWithEmail(email: string, pass: string): Promise<{ user: User; profile: UserProfile }> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  if (!user || !user.uid || !user.uid.trim()) {
    throw new Error('User sign-in failed: missing valid UID');
  }

  const cleanUid = user.uid.trim();
  let profile = await getUserProfileFromFirestore(cleanUid);
  if (!profile) {
    const isOwnerAdmin = (user.email || email).toLowerCase() === 'sdsdfdfddsfdd@gmail.com' || (user.email || email).toLowerCase().includes('admin');
    const customId = await generateUniqueCustomId(isOwnerAdmin);
    profile = {
      userId: cleanUid,
      customId,
      email: user.email || email,
      displayName: user.displayName || email.split('@')[0],
      role: isOwnerAdmin ? 'admin' : 'player',
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const userRef = doc(db, 'users', cleanUid);
      await setDoc(userRef, profile, { merge: true });
    } catch {
      // ignore
    }
  } else if (!profile.customId) {
    // Ensure unique custom ID is present
    profile.customId = await generateUniqueCustomId(profile.role === 'admin');
    try {
      const userRef = doc(db, 'users', cleanUid);
      await setDoc(userRef, { customId: profile.customId }, { merge: true });
    } catch {
      // ignore
    }
  }

  // Sync to server
  try {
    await fetch('/api/user/sync-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  } catch {
    // ignore
  }

  return { user, profile };
}

// Sign Out
export async function logoutUser() {
  await signOut(auth);
}

export { 
  config, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
};

