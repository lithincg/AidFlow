export const isDemoMode = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === '1';
};

const now = Math.floor(Date.now() / 1000);

export const demoOrg = {
  id: 'demo-aidflow-org',
  name: 'Dharwad Relief Network',
  slug: 'dharwad-relief-network',
  memberCount: 8,
};

export const demoUser = {
  uid: 'demo-coordinator',
  email: 'demo@aidflow.local',
  displayName: 'Demo Coordinator',
  photoURL: null,
};

export const demoNeeds = [
  {
    id: 'need-medicine-ward5',
    orgId: demoOrg.id,
    source: 'voice',
    location: 'Ward 5, Dharwad',
    description: 'Bridge approach is blocked after heavy rain. Elderly residents need urgent medicine delivery and safe access.',
    affectedGroup: 'Elderly residents and diabetic patients',
    reporterName: 'Anita',
    urgency: 'HIGH',
    needType: 'Medical',
    status: 'open',
    aiReason: 'Blocked access and medicine dependency create immediate health risk for vulnerable residents.',
    aiConfidence: 'high',
    volunteersNeeded: 3,
    assignedVolunteers: [],
    linkedNeedIds: ['need-bridge-duplicate'],
    voiceLanguage: 'Kannada',
    voiceTranscript: 'Ward five bridge bandh ide, old people ge medicine beku.',
    createdAt: { seconds: now - 210 },
    updatedAt: { seconds: now - 210 },
  },
  {
    id: 'need-school-food',
    orgId: demoOrg.id,
    source: 'ocr',
    location: 'Government School Shelter, Hubballi',
    description: 'Temporary shelter has 120 people and needs food packets, drinking water, and sanitary supplies by evening.',
    affectedGroup: 'Families displaced by flooding',
    reporterName: 'Ravi',
    urgency: 'MEDIUM',
    needType: 'Food',
    status: 'assigned',
    aiReason: 'Basic supplies are needed soon, but there is no immediate life-threatening condition in the report.',
    aiConfidence: 'medium',
    volunteersNeeded: 5,
    assignedVolunteers: [{ id: 'vol-priya', name: 'Priya Nair' }, { id: 'vol-omar', name: 'Omar Khan' }],
    createdAt: { seconds: now - 980 },
    updatedAt: { seconds: now - 430 },
  },
  {
    id: 'need-bridge-duplicate',
    orgId: demoOrg.id,
    source: 'text',
    location: 'Ward 5 bridge',
    description: 'Multiple residents reported that the road near the bridge is blocked and ambulances cannot enter.',
    affectedGroup: 'Residents near Ward 5 bridge',
    urgency: 'HIGH',
    needType: 'Safety',
    status: 'open',
    aiReason: 'Road blockage affecting emergency access is a high-priority safety issue.',
    aiConfidence: 'high',
    volunteersNeeded: 2,
    assignedVolunteers: [],
    linkedNeedIds: ['need-medicine-ward5'],
    createdAt: { seconds: now - 1550 },
    updatedAt: { seconds: now - 1550 },
  },
  {
    id: 'need-streetlight',
    orgId: demoOrg.id,
    source: 'text',
    location: 'Keshwapur Main Road',
    description: 'Streetlights are out near the relief pickup point, making evening movement difficult.',
    affectedGroup: 'Volunteers and families collecting supplies',
    urgency: 'LOW',
    needType: 'Infrastructure',
    status: 'resolved',
    aiReason: 'The issue affects safety and convenience, but no immediate emergency was reported.',
    aiConfidence: 'medium',
    volunteersNeeded: 1,
    assignedVolunteers: [{ id: 'vol-meera', name: 'Meera Joshi' }],
    createdAt: { seconds: now - 4500 },
    updatedAt: { seconds: now - 1200 },
  },
];

export const demoVolunteers = [
  { id: 'vol-arjun', orgId: demoOrg.id, name: 'Arjun Rao', skills: ['Medical', 'First Aid', 'Bike'], zone: 'Ward 5, Dharwad', status: 'free', assignedNeedIds: [], tasksCompleted: 12, createdAt: { seconds: now - 9000 } },
  { id: 'vol-fatima', orgId: demoOrg.id, name: 'Fatima Sheikh', skills: ['Medical', 'Elder Care'], zone: 'Dharwad North', status: 'free', assignedNeedIds: [], tasksCompleted: 7, createdAt: { seconds: now - 8800 } },
  { id: 'vol-kiran', orgId: demoOrg.id, name: 'Kiran Patil', skills: ['Transport', 'Rescue'], zone: 'Ward 5, Dharwad', status: 'free', assignedNeedIds: [], tasksCompleted: 15, createdAt: { seconds: now - 8600 } },
  { id: 'vol-priya', orgId: demoOrg.id, name: 'Priya Nair', skills: ['Food', 'Logistics'], zone: 'Hubballi', status: 'busy', assignedNeedIds: ['need-school-food'], tasksCompleted: 9, createdAt: { seconds: now - 8400 } },
  { id: 'vol-omar', orgId: demoOrg.id, name: 'Omar Khan', skills: ['Water', 'Distribution'], zone: 'Hubballi', status: 'busy', assignedNeedIds: ['need-school-food'], tasksCompleted: 5, createdAt: { seconds: now - 8200 } },
  { id: 'vol-meera', orgId: demoOrg.id, name: 'Meera Joshi', skills: ['Infrastructure'], zone: 'Keshwapur', status: 'free', assignedNeedIds: [], tasksCompleted: 4, createdAt: { seconds: now - 8000 } },
];
