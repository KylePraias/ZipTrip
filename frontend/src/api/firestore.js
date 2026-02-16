import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';

export const addTrip = async (tripData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');

  const docRef = await addDoc(collection(db, 'trips'), {
    userId: user.uid,
    ...tripData,
    checklist: [],
    createdAt: new Date().toISOString(),
  });

  return docRef.id;
};

export const getUserTrips = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');

  const q = query(collection(db, 'trips'), where('userId', '==', user.uid));
  const querySnapshot = await getDocs(q);
  const trips = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
  // Sort by start date (extracted from dateRange)
  return trips.sort((a, b) => {
    const getStartDate = (dateRange) => {
      if (!dateRange) return new Date(0);
      const startStr = dateRange.split(' to ')[0];
      return new Date(startStr);
    };
    return getStartDate(a.dateRange) - getStartDate(b.dateRange);
  });
};

export const updateChecklist = async (tripId, checklist) => {
  const tripRef = doc(db, 'trips', tripId);
  await updateDoc(tripRef, { checklist });
};

export const getTripById = async (tripId) => {
  const ref = doc(db, 'trips', tripId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const deleteTrip = async (tripId) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const tripRef = doc(db, 'trips', tripId);
  await deleteDoc(tripRef);
};

