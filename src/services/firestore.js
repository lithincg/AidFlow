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
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { demoOrg, isDemoMode } from '../demo/demoMode';

// ═══════════════════════════════════════════════════════
//  ORGANIZATIONS
// ═══════════════════════════════════════════════════════

export async function createOrganization(name, userId, userEmail, pin) {
  if (isDemoMode()) return { id: demoOrg.id, name: demoOrg.name, slug: demoOrg.slug };
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const docRef = await addDoc(collection(db, 'organizations'), {
    name,
    slug,
    pin: pin || '0000',
    createdBy: userId,
    members: [userId],
    memberEmails: [userEmail].filter(Boolean),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, name, slug };
}

export async function getUserOrganizations(userId) {
  if (isDemoMode()) return [demoOrg];
  const q = query(
    collection(db, 'organizations'),
    where('members', 'array-contains', userId),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    memberCount: (d.data().members || []).length,
  }));
}

export async function joinOrganizationByName(name, userId) {
  // Find org by exact name
  const q = query(
    collection(db, 'organizations'),
    where('name', '==', name),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error(`No organization found with the name "${name}". Check the name and try again.`);
  }

  const orgDoc = snapshot.docs[0];
  const orgData = orgDoc.data();

  // Already a member?
  if ((orgData.members || []).includes(userId)) {
    return { id: orgDoc.id, ...orgData };
  }

  await updateDoc(doc(db, 'organizations', orgDoc.id), {
    members: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });

  return { id: orgDoc.id, ...orgData, memberCount: (orgData.members || []).length + 1 };
}

export async function getAllOrganizations() {
  if (isDemoMode()) return [demoOrg];
  const q = query(collection(db, 'organizations'), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    memberCount: (d.data().members || []).length,
  }));
}

export async function joinOrganizationById(orgId, userId) {
  if (isDemoMode()) return { id: demoOrg.id };
  const orgRef = doc(db, 'organizations', orgId);
  await updateDoc(orgRef, {
    members: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
  return { id: orgId };
}

// ═══════════════════════════════════════════════════════
//  NEEDS  (all queries scoped to orgId)
// ═══════════════════════════════════════════════════════

export async function addNeed(needData, orgId) {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 350));
    return `demo-need-${Date.now()}`;
  }
  if (!orgId) throw new Error('Organization required to submit a need.');

  // Duplicate check: same location + description on non-resolved needs in same org
  const dupQuery = query(
    collection(db, 'needs'),
    where('orgId', '==', orgId),
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
    orgId,
    status: 'open',
    assignedVolunteers: [],
    volunteersNeeded: needData.volunteersNeeded || 1,
    assignedVolunteer: null,
    assignmentReason: null,
    linkedNeedIds: needData.linkedNeedIds || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// ── Link related needs (deduplication) ─────────────────

export async function linkNeeds(needIds) {
  if (isDemoMode()) return;
  if (!needIds || needIds.length < 2) return;

  const batch = writeBatch(db);
  for (const id of needIds) {
    const ref = doc(db, 'needs', id);
    // Each need gets the OTHER ids as linked
    const otherIds = needIds.filter((nid) => nid !== id);
    batch.update(ref, {
      linkedNeedIds: arrayUnion(...otherIds),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

// Org-scoped: filtered by orgId (orgId is required for full isolation)
export function subscribeToNeeds(orgId, callback, onError) {
  if (!orgId) {
    // No org = no data — caller should handle this before subscribing
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'needs'),
    where('orgId', '==', orgId),
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
  if (isDemoMode()) return;
  const needRef = doc(db, 'needs', needId);
  await updateDoc(needRef, {
    status,
    ...extraData,
    updatedAt: serverTimestamp(),
  });
}

export async function getOpenHighPriorityNeeds(orgId) {
  const constraints = [
    where('urgency', '==', 'HIGH'),
    where('status', '==', 'open'),
    limit(50),
  ];
  if (orgId) constraints.unshift(where('orgId', '==', orgId));

  const q = query(collection(db, 'needs'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteNeed(needId) {
  if (isDemoMode()) return;
  
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    
    if (!needSnap.exists()) return;
    
    const data = needSnap.data();
    const assigned = data.assignedVolunteers || [];
    
    if (assigned.length > 0) {
      const volSnaps = [];
      for (const entry of assigned) {
        const volRef = doc(db, 'volunteers', entry.id);
        const volSnap = await transaction.get(volRef);
        if (volSnap.exists()) volSnaps.push({ ref: volRef, data: volSnap.data() });
      }
      
      for (const { ref, data: volData } of volSnaps) {
        const remainingNeeds = (volData.assignedNeedIds || []).filter((id) => id !== needId);
        transaction.update(ref, {
          assignedNeedIds: remainingNeeds,
          status: remainingNeeds.length > 0 ? 'busy' : 'free',
          updatedAt: serverTimestamp(),
        });
      }
    }
    
    transaction.delete(needRef);
  });
}

export async function updateNeedFields(needId, fields) {
  if (isDemoMode()) return;
  const needRef = doc(db, 'needs', needId);
  await updateDoc(needRef, {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deassignNeed(needId) {
  if (isDemoMode()) return;
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need not found');

    const data = needSnap.data();
    const assigned = data.assignedVolunteers || [];

    const volSnaps = [];
    for (const entry of assigned) {
      const volRef = doc(db, 'volunteers', entry.id);
      const volSnap = await transaction.get(volRef);
      if (volSnap.exists()) volSnaps.push({ ref: volRef, data: volSnap.data() });
    }

    for (const { ref, data: volData } of volSnaps) {
      const remainingNeeds = (volData.assignedNeedIds || []).filter((id) => id !== needId);
      transaction.update(ref, {
        assignedNeedIds: remainingNeeds,
        status: remainingNeeds.length > 0 ? 'busy' : 'free',
        updatedAt: serverTimestamp(),
      });
    }

    transaction.update(needRef, {
      status: 'open',
      assignedVolunteers: [],
      assignedVolunteer: deleteField(),
      assignmentReason: deleteField(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function unresolveNeed(needId) {
  if (isDemoMode()) return;
  const needRef = doc(db, 'needs', needId);
  await updateDoc(needRef, {
    status: 'open',
    updatedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════
//  VOLUNTEERS  (all queries scoped to orgId)
// ═══════════════════════════════════════════════════════

export async function addVolunteer(data, orgId) {
  if (isDemoMode()) return `demo-vol-${Date.now()}`;
  if (!orgId) throw new Error('Organization required to add a volunteer.');

  // Duplicate check: same name + zone within the same org
  const dupQuery = query(
    collection(db, 'volunteers'),
    where('orgId', '==', orgId),
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
    orgId,
    status: 'free',
    assignedNeedIds: [],
    tasksCompleted: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToVolunteers(orgId, callback, onError) {
  const constraints = [orderBy('createdAt', 'desc'), limit(200)];
  if (orgId) constraints.unshift(where('orgId', '==', orgId));

  const q = query(collection(db, 'volunteers'), ...constraints);
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
  if (isDemoMode()) return;
  const volRef = doc(db, 'volunteers', volId);
  await updateDoc(volRef, {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteVolunteer(volId) {
  if (isDemoMode()) return;
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

export async function getFreeVolunteers(orgId) {
  const constraints = [where('status', '==', 'free'), limit(100)];
  if (orgId) constraints.unshift(where('orgId', '==', orgId));

  const q = query(collection(db, 'volunteers'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Multi-volunteer assignment ─────────────────────────

export async function assignVolunteersToNeed(needId, volunteerEntries) {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 400));
    return;
  }
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need no longer exists');

    const needData = needSnap.data();
    const currentAssigned = needData.assignedVolunteers || [];

    const newEntries = volunteerEntries.filter(
      (v) => !currentAssigned.some((a) => a.id === v.id)
    );

    if (newEntries.length === 0) throw new Error('Selected volunteers are already assigned');

    const volRefs = [];
    for (const entry of newEntries) {
      const volRef = doc(db, 'volunteers', entry.id);
      const volSnap = await transaction.get(volRef);
      if (volSnap.exists()) volRefs.push(volRef);
    }

    for (const volRef of volRefs) {
      transaction.update(volRef, {
        status: 'busy',
        assignedNeedIds: arrayUnion(needId),
        updatedAt: serverTimestamp(),
      });
    }

    const mergedAssigned = [...currentAssigned, ...newEntries];
    const newStatus = needData.status === 'open' ? 'assigned' : needData.status;

    transaction.update(needRef, {
      assignedVolunteers: mergedAssigned,
      assignedVolunteer: mergedAssigned.map((v) => v.name).join(', '),
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deassignVolunteerFromNeed(needId, volunteerId) {
  if (isDemoMode()) return;
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need not found');

    const volRef = doc(db, 'volunteers', volunteerId);
    const volSnap = await transaction.get(volRef);

    const needData = needSnap.data();
    const updatedVols = (needData.assignedVolunteers || []).filter((v) => v.id !== volunteerId);

    transaction.update(needRef, {
      assignedVolunteers: updatedVols,
      assignedVolunteer: updatedVols.length > 0 ? updatedVols.map((v) => v.name).join(', ') : deleteField(),
      status: updatedVols.length === 0 ? 'open' : needData.status,
      updatedAt: serverTimestamp(),
    });

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
  if (isDemoMode()) return;
  return await runTransaction(db, async (transaction) => {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await transaction.get(needRef);
    if (!needSnap.exists()) throw new Error('Need not found');

    const data = needSnap.data();
    const assigned = data.assignedVolunteers || [];

    const volSnaps = [];
    for (const entry of assigned) {
      const volRef = doc(db, 'volunteers', entry.id);
      const snap = await transaction.get(volRef);
      if (snap.exists()) {
        volSnaps.push({ ref: volRef, data: snap.data() });
      }
    }

    for (const { ref, data: volData } of volSnaps) {
      const remaining = (volData.assignedNeedIds || []).filter((id) => id !== needId);
      transaction.update(ref, {
        assignedNeedIds: remaining,
        status: remaining.length > 0 ? 'busy' : 'free',
        tasksCompleted: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    transaction.update(needRef, {
      status: 'resolved',
      updatedAt: serverTimestamp(),
    });
  });
}
