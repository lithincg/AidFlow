import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════
//  NEEDS
// ═══════════════════════════════════════════════════════

export async function addNeed(needData) {
  // Duplicate check: same location + description on non-resolved needs
  const dupQuery = query(
    collection(db, 'needs'),
    where('location', '==', needData.location),
    where('description', '==', needData.description),
    limit(1)
  );
  const dupSnap = await getDocs(dupQuery);
  const activeDup = dupSnap.docs.find((d) => d.data().status !== 'resolved');
  if (activeDup) {
    throw new Error('A similar need already exists for this location. Check the Priority Board.');
  }

  const docRef = await addDoc(collection(db, 'needs'), {
    ...needData,
    status: 'open',
    assignedVolunteers: [],
    volunteersNeeded: needData.volunteersNeeded || 1,
    // Deprecated — kept for backward compat reads
    assignedVolunteer: null,
    assignmentReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToNeeds(callback, onError) {
  const q = query(
    collection(db, 'needs'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const needs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(needs);
    },
    (error) => {
      console.error('Firestore onSnapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function updateNeedStatus(needId, status, extraData = {}) {
  const needRef = doc(db, 'needs', needId);
  await updateDoc(needRef, {
    status,
    ...extraData,
    updatedAt: serverTimestamp(),
  });
}

export async function getOpenHighPriorityNeeds() {
  const q = query(
    collection(db, 'needs'),
    where('urgency', '==', 'HIGH'),
    where('status', '==', 'open'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteNeed(needId) {
  // First free any assigned volunteers
  const needRef = doc(db, 'needs', needId);
  const needSnap = await getDoc(needRef);
  if (needSnap.exists()) {
    const data = needSnap.data();
    const assigned = data.assignedVolunteers || [];
    if (assigned.length > 0) {
      const batch = writeBatch(db);
      for (const entry of assigned) {
        const volRef = doc(db, 'volunteers', entry.id);
        batch.update(volRef, {
          assignedNeedIds: arrayRemove(needId),
          status: 'free',
          updatedAt: serverTimestamp(),
        });
      }
      batch.delete(needRef);
      await batch.commit();
      return;
    }
  }
  await deleteDoc(needRef);
}

export async function updateNeedFields(needId, fields) {
  const needRef = doc(db, 'needs', needId);
  await updateDoc(needRef, {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deassignNeed(needId) {
  // Free ALL assigned volunteers and reset need
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need not found');

    const data = needSnap.data();
    const assigned = data.assignedVolunteers || [];

    for (const entry of assigned) {
      const volRef = doc(db, 'volunteers', entry.id);
      const volSnap = await transaction.get(volRef);
      if (volSnap.exists()) {
        const volData = volSnap.data();
        const remainingNeeds = (volData.assignedNeedIds || []).filter((id) => id !== needId);
        transaction.update(volRef, {
          assignedNeedIds: remainingNeeds,
          status: remainingNeeds.length > 0 ? 'busy' : 'free',
          updatedAt: serverTimestamp(),
        });
      }
    }

    transaction.update(needRef, {
      status: 'open',
      assignedVolunteers: [],
      assignedVolunteer: null,
      assignmentReason: null,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function unresolveNeed(needId) {
  const needRef = doc(db, 'needs', needId);
  await updateDoc(needRef, {
    status: 'open',
    updatedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════
//  VOLUNTEERS
// ═══════════════════════════════════════════════════════

export async function addVolunteer(data) {
  // Duplicate check: same name + zone
  const dupQuery = query(
    collection(db, 'volunteers'),
    where('name', '==', data.name),
    where('zone', '==', (data.zone || '')),
    limit(1)
  );
  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error('A volunteer with this name already exists in this zone.');
  }

  const docRef = await addDoc(collection(db, 'volunteers'), {
    name: data.name,
    skills: data.skills || [],
    zone: data.zone || '',
    phone: data.phone || null,
    status: 'free',
    assignedNeedIds: [],
    tasksCompleted: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToVolunteers(callback, onError) {
  const q = query(
    collection(db, 'volunteers'),
    orderBy('createdAt', 'desc'),
    limit(200)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const volunteers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(volunteers);
    },
    (error) => {
      console.error('Volunteers onSnapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function updateVolunteer(volId, fields) {
  const volRef = doc(db, 'volunteers', volId);
  await updateDoc(volRef, {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteVolunteer(volId) {
  // Remove volunteer from any assigned needs first
  const volRef = doc(db, 'volunteers', volId);
  const volSnap = await getDoc(volRef);

  if (volSnap.exists()) {
    const data = volSnap.data();
    const needIds = data.assignedNeedIds || [];

    if (needIds.length > 0) {
      const batch = writeBatch(db);
      for (const needId of needIds) {
        const needRef = doc(db, 'needs', needId);
        const needSnap = await getDoc(needRef);
        if (needSnap.exists()) {
          const needData = needSnap.data();
          const updatedVols = (needData.assignedVolunteers || []).filter((v) => v.id !== volId);
          batch.update(needRef, {
            assignedVolunteers: updatedVols,
            updatedAt: serverTimestamp(),
          });
        }
      }
      batch.delete(volRef);
      await batch.commit();
      return;
    }
  }
  await deleteDoc(volRef);
}

export async function getFreeVolunteers() {
  const q = query(
    collection(db, 'volunteers'),
    where('status', '==', 'free'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Multi-volunteer assignment ─────────────────────────

export async function assignVolunteersToNeed(needId, volunteerEntries) {
  // volunteerEntries: [{ id, name }, ...]
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need no longer exists');

    const needData = needSnap.data();
    const currentAssigned = needData.assignedVolunteers || [];

    // Check for duplicates
    const newEntries = volunteerEntries.filter(
      (v) => !currentAssigned.some((a) => a.id === v.id)
    );

    if (newEntries.length === 0) throw new Error('Selected volunteers are already assigned');

    // Update each volunteer
    for (const entry of newEntries) {
      const volRef = doc(db, 'volunteers', entry.id);
      const volSnap = await transaction.get(volRef);
      if (!volSnap.exists()) continue;

      transaction.update(volRef, {
        status: 'busy',
        assignedNeedIds: arrayUnion(needId),
        updatedAt: serverTimestamp(),
      });
    }

    // Update the need
    const mergedAssigned = [...currentAssigned, ...newEntries];
    const newStatus = needData.status === 'open' ? 'assigned' : needData.status;

    transaction.update(needRef, {
      assignedVolunteers: mergedAssigned,
      // Also set legacy field for backward compat
      assignedVolunteer: mergedAssigned.map((v) => v.name).join(', '),
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deassignVolunteerFromNeed(needId, volunteerId) {
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need not found');

    const needData = needSnap.data();
    const updatedVols = (needData.assignedVolunteers || []).filter((v) => v.id !== volunteerId);

    // Update need
    transaction.update(needRef, {
      assignedVolunteers: updatedVols,
      assignedVolunteer: updatedVols.length > 0 ? updatedVols.map((v) => v.name).join(', ') : null,
      status: updatedVols.length === 0 ? 'open' : needData.status,
      updatedAt: serverTimestamp(),
    });

    // Free the volunteer if they have no other assignments
    const volRef = doc(db, 'volunteers', volunteerId);
    const volSnap = await transaction.get(volRef);
    if (volSnap.exists()) {
      const volData = volSnap.data();
      const remaining = (volData.assignedNeedIds || []).filter((id) => id !== needId);
      transaction.update(volRef, {
        assignedNeedIds: remaining,
        status: remaining.length > 0 ? 'busy' : 'free',
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function resolveNeedAndFreeVolunteers(needId) {
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need not found');

    const data = needSnap.data();
    const assigned = data.assignedVolunteers || [];

    // Free every assigned volunteer and increment their completed count
    for (const entry of assigned) {
      const volRef = doc(db, 'volunteers', entry.id);
      const volSnap = await transaction.get(volRef);
      if (volSnap.exists()) {
        const volData = volSnap.data();
        const remaining = (volData.assignedNeedIds || []).filter((id) => id !== needId);
        transaction.update(volRef, {
          assignedNeedIds: remaining,
          status: remaining.length > 0 ? 'busy' : 'free',
          tasksCompleted: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Resolve the need
    transaction.update(needRef, {
      status: 'resolved',
      updatedAt: serverTimestamp(),
    });
  });
}

// Legacy transaction — kept for backward compatibility but no longer used in new flow
export async function assignVolunteerToNeedTransaction(volunteerData, assignmentData, needId, needUpdateData) {
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needDoc = await transaction.get(needRef);

    if (!needDoc.exists()) {
      throw new Error("This need does not exist anymore.");
    }

    if (needDoc.data().status !== 'open') {
      throw new Error("This need has already been assigned or resolved by someone else.");
    }

    const volRef = doc(collection(db, 'volunteers'));
    const assignmentRef = doc(collection(db, 'assignments'));

    transaction.set(volRef, {
      ...volunteerData,
      assignedNeedId: needId,
      createdAt: serverTimestamp(),
    });

    transaction.set(assignmentRef, {
      ...assignmentData,
      volunteerId: volRef.id,
      assignedAt: serverTimestamp(),
      status: 'active',
    });

    transaction.update(needRef, {
      status: 'assigned',
      ...needUpdateData,
      updatedAt: serverTimestamp(),
    });

    return volRef.id;
  });
}
