import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  setDoc, 
  addDoc,
  Timestamp,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  getDocFromServer
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  ownerId: string;
  members: string[];
  createdAt: any;
}

interface Member {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  joinedAt: any;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: any;
  completedAt?: any;
  dueTime?: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  payerId: string;
  payerName: string;
  participants: string[];
  splitType: 'equal' | 'exact' | 'percentage';
  date: string;
  createdAt: any;
  createdByName: string;
  receiptUrl?: string;
  time?: string;
}

interface TripContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  expenses: Expense[];
  checklist: ChecklistItem[];
  members: Member[];
  loading: boolean;
  indexErrorUrl: string | null;
  isIndexBuilding: boolean;
  setActiveTripId: (id: string | null) => void;
  createTrip: (data: Partial<Trip>) => Promise<void>;
  joinTrip: (tripId: string) => Promise<void>;
  addExpense: (tripId: string, data: Partial<Expense>) => Promise<void>;
  addChecklistItem: (tripId: string, text: string, dueTime?: string) => Promise<void>;
  toggleChecklistItem: (tripId: string, itemId: string, completed: boolean) => Promise<void>;
  removeMember: (tripId: string, memberId: string) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexErrorUrl, setIndexErrorUrl] = useState<string | null>(null);
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);

  const activeTrip = useMemo(() => trips.find(t => t.id === activeTripId) || null, [trips, activeTripId]);

  // Sync trips
  useEffect(() => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'trips'),
      where('members', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        setTrips(tripsData);
        setLoading(false);
        setIndexErrorUrl(null);
        setIsIndexBuilding(false);
      },
      (error) => {
        if (error.message.includes('requires an index') || error.message.includes('index-needed')) {
          const match = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]+/);
          if (match) {
            setIndexErrorUrl(match[0]);
          }
          if (error.message.includes('currently building')) {
            setIsIndexBuilding(true);
          }
        }
        handleFirestoreError(error, OperationType.LIST, 'trips');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sync expenses and checklist for active trip
  useEffect(() => {
    if (!activeTripId || !user) {
      setExpenses([]);
      setChecklist([]);
      setMembers([]);
      return;
    }

    const expensesUnsub = onSnapshot(
      query(collection(db, 'trips', activeTripId, 'expenses'), orderBy('createdAt', 'desc')),
      (snapshot) => setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense))),
      (error) => handleFirestoreError(error, OperationType.LIST, `trips/${activeTripId}/expenses`)
    );

    const checklistUnsub = onSnapshot(
      query(collection(db, 'trips', activeTripId, 'checklist'), orderBy('createdAt', 'asc')),
      (snapshot) => setChecklist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistItem))),
      (error) => handleFirestoreError(error, OperationType.LIST, `trips/${activeTripId}/checklist`)
    );

    const membersUnsub = onSnapshot(
      collection(db, 'trips', activeTripId, 'members'),
      (snapshot) => setMembers(snapshot.docs.map(doc => ({ ...doc.data() } as Member))),
      (error) => handleFirestoreError(error, OperationType.LIST, `trips/${activeTripId}/members`)
    );

    return () => {
      expensesUnsub();
      checklistUnsub();
      membersUnsub();
    };
  }, [activeTripId, user]);

  const createTrip = async (data: Partial<Trip>) => {
    if (!user) return;
    try {
      const tripId = doc(collection(db, 'trips')).id;
      const tripData = {
        ...data,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'trips', tripId), tripData);

      await setDoc(doc(db, 'trips', tripId, 'members', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'owner',
        joinedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'trips');
    }
  };

  const joinTrip = async (tripId: string) => {
    if (!user) return;
    try {
      const tripRef = doc(db, 'trips', tripId);
      const tripSnap = await getDocFromServer(tripRef);
      if (!tripSnap.exists()) throw new Error('Trip not found');

      const tripData = tripSnap.data() as Trip;
      if (!tripData.members.includes(user.uid)) {
        await updateDoc(tripRef, {
          members: arrayUnion(user.uid),
          updatedAt: serverTimestamp()
        });

        await setDoc(doc(db, 'trips', tripId, 'members', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'editor',
          joinedAt: serverTimestamp()
        });
      }
      setActiveTripId(tripId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/join`);
    }
  };

  const addExpense = async (tripId: string, data: Partial<Expense>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'trips', tripId, 'expenses'), {
        ...data,
        payerId: data.payerId || user.uid,
        payerName: data.payerName || user.displayName,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        time: data.time || null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/expenses`);
    }
  };

  const addChecklistItem = async (tripId: string, text: string, dueTime?: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'trips', tripId, 'checklist'), {
        text,
        completed: false,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        dueTime: dueTime || null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/checklist`);
    }
  };

  const toggleChecklistItem = async (tripId: string, itemId: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'trips', tripId, 'checklist', itemId), {
        completed,
        completedAt: completed ? serverTimestamp() : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}/checklist/${itemId}`);
    }
  };

  const removeMember = async (tripId: string, memberId: string) => {
    if (!user || !activeTrip || user.uid === memberId) return;
    try {
      if (activeTrip.ownerId !== user.uid) throw new Error('Only owners can remove members');

      const tripRef = doc(db, 'trips', tripId);
      const updatedMembers = activeTrip.members.filter(m => m !== memberId);
      
      await updateDoc(tripRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, 'trips', tripId, 'members', memberId));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/members/${memberId}`);
    }
  };

  return (
    <TripContext.Provider value={{ 
      trips, 
      activeTrip, 
      expenses, 
      checklist,
      members,
      loading,
      indexErrorUrl,
      isIndexBuilding,
      setActiveTripId, 
      createTrip, 
      joinTrip,
      addExpense,
      addChecklistItem,
      toggleChecklistItem,
      removeMember
    }}>
      {children}
    </TripContext.Provider>
  );
}

export const useTrip = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
