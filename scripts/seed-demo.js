import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, updateDoc, Timestamp, query, where,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?s*$/);
      if (match) env[match[1]] = match[2].trim();
    });
    return env;
  } catch (e) { console.error('Could not load .env'); process.exit(1); }
}

const env = loadEnv();
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

function minsAgo(m) { const d = new Date(); d.setMinutes(d.getMinutes() - m); return Timestamp.fromDate(d); }

// ═══════════════════════════════════════════════════════════
//  3 ORGANIZATIONS — each a different real-world NGO scenario
// ═══════════════════════════════════════════════════════════

const ORGS = [
  {
    name: 'Dharwad Relief Network',
    slug: 'dharwad-relief-network',
    pin: '1234',
    // ── 8 volunteers ──
    volunteers: [
      { name:'Priya Sharma',        skills:['Nursing','First Aid','Elder Care'],              zone:'Hubli',    phone:'9876543210', tasksCompleted:5 },
      { name:'Rahul Verma',         skills:['Logistics','Driving','Inventory Management'],    zone:'Dharwad',  phone:'9845123456', tasksCompleted:8 },
      { name:'Dr. Ananya Kulkarni', skills:['Medicine','Surgery Assist','Pharmacy'],          zone:'Hubli',    phone:'9900112233', tasksCompleted:12 },
      { name:'Suresh Patil',        skills:['Construction','Plumbing','Electrical Work'],     zone:'Gadag',    phone:'9886654321', tasksCompleted:3 },
      { name:'Meena Joshi',         skills:['Cooking','Food Distribution','Outreach'],        zone:'Hubli',    phone:'8867543210', tasksCompleted:7 },
      { name:'Karthik Hegde',       skills:['Water Purification','Civil Engineering'],        zone:'Dharwad',  phone:'7795432100', tasksCompleted:2 },
      { name:'Vijay Naik',          skills:['Driving','Search & Rescue','First Aid'],         zone:'Belgaum',  phone:'8892345678', tasksCompleted:10 },
      { name:'Kavita Menon',        skills:['Psychiatry','Trauma Counseling','First Aid'],    zone:'Dharwad',  phone:'8834567890', tasksCompleted:7 },
    ],
    // ── 12 needs across all states ──
    needs: [
      // HIGH
      { source:'text', location:'Dharwad District Hospital',  description:'Oxygen supply critically low. 20 D-type cylinders needed. ICU patients at risk of respiratory failure.', affectedGroup:'ICU Patients', reporterName:'Dr. Rakesh', urgency:'HIGH', needType:'Medical', aiReason:'Life-threatening — ICU patients without oxygen face immediate mortality.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(15) },
      { source:'text', location:'Rayapur Slum, Dharwad',     description:'Fire in tin-sheet houses. 8 families displaced. Need emergency shelter, blankets, and first aid.', affectedGroup:'Displaced families (8)', reporterName:'Ward Councilor', urgency:'HIGH', needType:'Safety', aiReason:'Families displaced by fire need immediate shelter and medical aid.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(55) },
      { source:'ocr',  location:'Hubli South, Ward 12',      description:'Road collapsed after heavy rain. 50 families cut off from clean water.', affectedGroup:'Residents (50 families)', reporterName:null, urgency:'HIGH', needType:'Safety', aiReason:'Critical flooding cutting water supply and trapping families.', aiConfidence:'high', volunteersNeeded:5, status:'open', createdAt:minsAgo(25) },
      // MEDIUM
      { source:'text', location:'Navanagar Community Center', description:'500 dry ration kits need packaging and distribution for daily wage workers who lost income.', affectedGroup:'Daily wage workers', reporterName:'Amit Desai', urgency:'MEDIUM', needType:'Food', aiReason:'Large food distribution for vulnerable workers.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(180) },
      { source:'text', location:'Saptapur, Dharwad',         description:'Post-flood mental health support. 15 displaced families showing trauma and anxiety. Counselors needed.', affectedGroup:'Displaced families (15)', reporterName:'NIMHANS Field Team', urgency:'MEDIUM', needType:'Medical', aiReason:'Mental health crisis — needs timely professional intervention.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(200) },
      { source:'text', location:'Belgaum Road, Dharwad',     description:'Contaminated water in 3 apartment complexes. 200+ residents affected. Water testing needed.', affectedGroup:'Residents (200+)', reporterName:'Complex Secretary', urgency:'MEDIUM', needType:'Infrastructure', aiReason:'Contaminated water — health risk growing daily.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(150) },
      // LOW
      { source:'text', location:'Old Hubli',                 description:'10 houses need tarpaulin roof covers before monsoon starts next week.', affectedGroup:'Slum residents', reporterName:'Sunita', urgency:'LOW', needType:'Infrastructure', aiReason:'Preventative monsoon prep — not an immediate crisis.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(1440) },
      { source:'text', location:'Gokul Road',                description:'Large tree fallen across service road. Local traffic congestion but highway clear.', affectedGroup:'Commuters', reporterName:'Traffic Police', urgency:'LOW', needType:'Other', aiReason:'Minor blockage — inconvenience, no danger.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(600) },
      { source:'text', location:'Nrupathunga Betta',         description:'Hiking trail littered with plastic. Cleanup needed — trail becoming unsafe.', affectedGroup:'Hikers', reporterName:'Eco Club Hubli', urgency:'LOW', needType:'Other', aiReason:'Environmental cleanup — quality of life improvement.', aiConfidence:'high', volunteersNeeded:5, status:'open', createdAt:minsAgo(2880) },
      // ASSIGNED (2)
      { source:'text', location:'Keshwapur Care Home',       description:'Elderly care home out of insulin and BP meds. 22 residents affected.', affectedGroup:'Elderly (22)', reporterName:'Matron Savitri', urgency:'HIGH', needType:'Medical', aiReason:'22 elderly without critical medications face serious health risk.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(40) },
      { source:'text', location:'Unkal Lake Area',           description:'Stray dogs aggressive near park. 3 bite incidents this week. Animal control needed.', affectedGroup:'Park visitors', reporterName:'Resident Association', urgency:'MEDIUM', needType:'Safety', aiReason:'Repeated animal attacks — ongoing safety risk.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(240) },
      // RESOLVED (1)
      { source:'text', location:'KIMS Hospital',             description:'Volunteers needed for free eye checkup camp. Queue management done.', affectedGroup:'Elderly patients', reporterName:'Hospital Admin', urgency:'LOW', needType:'Other', aiReason:'Scheduled event — volunteer coordination needed.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(480) },
    ],
    // assignmentIdx → { needIdx, status, volIdxs }
    assignments: [
      { needIdx:9,  status:'assigned',    volIdxs:[2,0] },    // Care Home → Dr. Ananya + Priya
      { needIdx:10, status:'in_progress', volIdxs:[6] },      // Unkal Dogs → Vijay
      { needIdx:11, status:'resolved',    volIdxs:[4,5] },    // KIMS eye camp → Meena + Karthik
    ],
  },

  {
    name: 'Mumbai Health Initiative',
    slug: 'mumbai-health-initiative',
    pin: '5678',
    // ── 6 volunteers ──
    volunteers: [
      { name:'Dr. Sameer Kapoor',   skills:['Emergency Medicine','Triage','CPR'],             zone:'Andheri',  phone:'9820112233', tasksCompleted:15 },
      { name:'Nisha Agarwal',       skills:['Pediatrics','Vaccination','Child Nutrition'],     zone:'Bandra',   phone:'9821234567', tasksCompleted:9 },
      { name:'Arjun Patel',         skills:['Ambulance Driving','Paramedic','IV Setup'],       zone:'Dadar',    phone:'9822345678', tasksCompleted:20 },
      { name:'Sunita Desai',        skills:['Social Work','Counseling','Community Health'],    zone:'Andheri',  phone:'9823456789', tasksCompleted:6 },
      { name:'Rajesh Kumar',        skills:['Logistics','Warehouse','Supply Chain'],           zone:'Kurla',    phone:'9824567890', tasksCompleted:11 },
      { name:'Farah Sheikh',        skills:['Nursing','ICU Care','Dialysis Assist'],           zone:'Bandra',   phone:'9825678901', tasksCompleted:8 },
    ],
    // ── 10 needs ──
    needs: [
      // HIGH
      { source:'text', location:'Dharavi Health Post',        description:'Cholera outbreak suspected. 40 cases of acute diarrhea in 48 hours. ORS kits and IV fluids needed urgently.', affectedGroup:'Slum residents (Dharavi Sector 5)', reporterName:'Dr. Mehta', urgency:'HIGH', needType:'Medical', aiReason:'Potential cholera outbreak — 40 cases in 48h indicates epidemic spread.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(10) },
      { source:'text', location:'Andheri East Subway',        description:'Heavy waterlogging after overnight rain. Subway flooded 4ft deep. 12 stranded commuters on roof.', affectedGroup:'Stranded commuters (12)', reporterName:'BMC Control Room', urgency:'HIGH', needType:'Safety', aiReason:'People stranded in floodwater — immediate rescue needed.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(20) },
      { source:'text', location:'LTMG Sion Hospital',         description:'Blood bank critically low on A+ and O- types. 6 surgical patients scheduled tomorrow.', affectedGroup:'Surgery patients (6)', reporterName:'Blood Bank Head', urgency:'HIGH', needType:'Medical', aiReason:'Critical blood shortage for scheduled surgeries — life-threatening.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(30) },
      // MEDIUM
      { source:'text', location:'Bandra Slum Cluster',        description:'Vaccination drive needed for 200 children under 5. Measles cases rising in adjacent ward.', affectedGroup:'Children under 5 (200)', reporterName:'ASHA Worker', urgency:'MEDIUM', needType:'Medical', aiReason:'Preventive vaccination to stop measles spread — urgent but planned.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(120) },
      { source:'text', location:'Kurla Wholesale Market',     description:'Food spoilage after power outage. 500kg vegetables can be redistributed if picked up within 4 hours.', affectedGroup:'Food-insecure families', reporterName:'Market Association', urgency:'MEDIUM', needType:'Food', aiReason:'Time-sensitive food rescue — prevents waste and feeds families.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(90) },
      { source:'text', location:'Dadar Community Hall',       description:'Free diabetes screening camp on Saturday. Need volunteers for registration and crowd management.', affectedGroup:'Senior citizens (150+)', reporterName:'Rotary Club', urgency:'MEDIUM', needType:'Medical', aiReason:'Scheduled health camp — needs volunteer coordination.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(300) },
      // LOW
      { source:'text', location:'Santacruz Public Garden',    description:'Garden benches broken and footpaths cracked. Elderly visitors have difficulty walking.', affectedGroup:'Elderly visitors', reporterName:'Garden Committee', urgency:'LOW', needType:'Infrastructure', aiReason:'Maintenance needed — gradual safety improvement.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(2000) },
      // ASSIGNED
      { source:'text', location:'Malad West Housing',         description:'Building wall crack reported after tremor. Structural assessment and evacuation assistance needed.', affectedGroup:'Building residents (80)', reporterName:'Society Chairman', urgency:'HIGH', needType:'Safety', aiReason:'Structural damage after tremor — possible building collapse risk.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(45) },
      // IN PROGRESS
      { source:'text', location:'Borivali National Park Entry', description:'Leopard sighting near residential area. Awareness and patrol needed for 48 hours.', affectedGroup:'Nearby residents (500+)', reporterName:'Forest Officer', urgency:'MEDIUM', needType:'Safety', aiReason:'Wildlife-human conflict — ongoing monitoring required.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(60) },
      // RESOLVED
      { source:'text', location:'Juhu Beach Promenade',        description:'Post-monsoon beach cleanup completed. 2 tons of debris and plastic cleared in 3 hours.', affectedGroup:'Beach visitors', reporterName:'Clean Mumbai NGO', urgency:'LOW', needType:'Other', aiReason:'Cleanup drive — environmental quality improvement.', aiConfidence:'high', volunteersNeeded:5, status:'open', createdAt:minsAgo(4000) },
    ],
    assignments: [
      { needIdx:7,  status:'assigned',    volIdxs:[0,2] },    // Malad Wall → Dr. Sameer + Arjun
      { needIdx:8,  status:'in_progress', volIdxs:[4,3] },    // Leopard → Rajesh + Sunita
      { needIdx:9,  status:'resolved',    volIdxs:[1,5] },    // Juhu Cleanup → Nisha + Farah
    ],
  },

  {
    name: 'Bengaluru Community Aid',
    slug: 'bengaluru-community-aid',
    pin: '9012',
    // ── 5 volunteers ──
    volunteers: [
      { name:'Aarav Reddy',         skills:['Software Training','Data Entry','Translation'],   zone:'Whitefield',   phone:'9740112233', tasksCompleted:4 },
      { name:'Lakshmi Nair',        skills:['Nursing','First Aid','Blood Donation Drive'],     zone:'Jayanagar',    phone:'9741234567', tasksCompleted:13 },
      { name:'Deepak Gowda',        skills:['Heavy Vehicle Driving','Loading','Warehousing'],  zone:'Peenya',       phone:'9742345678', tasksCompleted:7 },
      { name:'Shalini Rao',         skills:['Teaching','Counseling','Women Empowerment'],      zone:'Koramangala',  phone:'9743456789', tasksCompleted:5 },
      { name:'Feroz Ahmed',         skills:['Electrician','Generator Repair','Plumbing'],      zone:'Majestic',     phone:'9744567890', tasksCompleted:9 },
    ],
    // ── 8 needs ──
    needs: [
      // HIGH
      { source:'text', location:'Whitefield IT Park Basement',  description:'Flash flooding in basement parking. 50 cars submerged, 3 people trapped in elevator.', affectedGroup:'Office workers (3 trapped)', reporterName:'Building Security', urgency:'HIGH', needType:'Safety', aiReason:'People trapped in flooded elevator — immediate life-threatening.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(5) },
      { source:'text', location:'Majestic Bus Stand',           description:'Stampede risk during Ganapati procession. 10,000+ crowd, 2 injuries already. Crowd control needed.', affectedGroup:'Festival attendees', reporterName:'Police Control Room', urgency:'HIGH', needType:'Safety', aiReason:'Mass gathering with injuries — stampede prevention critical.', aiConfidence:'high', volunteersNeeded:6, status:'open', createdAt:minsAgo(8) },
      // MEDIUM
      { source:'text', location:'Koramangala 6th Block',        description:'Construction debris blocking storm drain. Water rising in basement flats during every rain.', affectedGroup:'Apartment residents (60)', reporterName:'Resident Association', urgency:'MEDIUM', needType:'Infrastructure', aiReason:'Recurring flooding due to blocked drain — growing risk.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(360) },
      { source:'text', location:'Jayanagar 4th Block Park',     description:'Free blood donation camp this Sunday. Need volunteers for registration, refreshments, and first aid.', affectedGroup:'Donors (100+)', reporterName:'Red Cross Local', urgency:'MEDIUM', needType:'Medical', aiReason:'Scheduled health camp — volunteer support needed.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(200) },
      { source:'text', location:'Peenya Industrial Area',       description:'20 migrant worker families without ration cards. Need help with documentation and food kit distribution.', affectedGroup:'Migrant families (20)', reporterName:'Labour Union Rep', urgency:'MEDIUM', needType:'Food', aiReason:'Undocumented families unable to access PDS — food insecurity.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(150) },
      // LOW
      { source:'text', location:'Lalbagh Botanical Garden',     description:'Garden fence damaged in storm. Stray cattle entering and damaging flower beds.', affectedGroup:'Garden visitors', reporterName:'Garden Superintendent', urgency:'LOW', needType:'Infrastructure', aiReason:'Minor infrastructure repair — no immediate danger.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(1000) },
      // ASSIGNED + IN PROGRESS
      { source:'text', location:'Electronic City Phase 2',      description:'Power outage in 5 residential blocks for 18 hours. Generator fuel running low, elderly on oxygen concentrators.', affectedGroup:'Residents (200+)', reporterName:'Block Secretary', urgency:'HIGH', needType:'Infrastructure', aiReason:'Prolonged power outage endangering oxygen-dependent patients.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(35) },
      // RESOLVED
      { source:'text', location:'HSR Layout Community Center',  description:'Free computer literacy classes for senior citizens completed. 30 seniors trained over 2 weeks.', affectedGroup:'Senior citizens (30)', reporterName:'NSS Coordinator', urgency:'LOW', needType:'Other', aiReason:'Completed community education program.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(5000) },
    ],
    assignments: [
      { needIdx:6,  status:'in_progress', volIdxs:[4,2] },    // Power outage → Feroz + Deepak
      { needIdx:7,  status:'resolved',    volIdxs:[0,3] },    // Computer class → Aarav + Shalini
    ],
  },
];


// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

async function clearCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  let count = 0;
  for (const d of snapshot.docs) { await deleteDoc(doc(db, name, d.id)); count++; }
  if (count > 0) console.log(`  🗑️  Cleared ${count} from "${name}"`);
}

// A fake userId to be the "owner" — we'll use a consistent UID
const DEMO_USER_ID = 'demo-seed-user-001';
const DEMO_USER_EMAIL = 'demo@smartresource.app';

async function seedOrg(orgDef) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🏢 ${orgDef.name}`);
  console.log(`${'═'.repeat(60)}`);

  // 1. Create org document
  const orgRef = await addDoc(collection(db, 'organizations'), {
    name: orgDef.name,
    slug: orgDef.slug,
    pin: orgDef.pin,
    createdBy: DEMO_USER_ID,
    members: [DEMO_USER_ID],
    memberEmails: [DEMO_USER_EMAIL],
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  });
  const orgId = orgRef.id;
  console.log(`  ✅ Org created (${orgId}) — PIN: ${orgDef.pin}`);

  // 2. Seed volunteers
  console.log(`\n  👥 Seeding ${orgDef.volunteers.length} volunteers...`);
  const volIds = [];
  for (const v of orgDef.volunteers) {
    const ref = await addDoc(collection(db, 'volunteers'), {
      ...v,
      orgId,
      status: 'free',
      assignedNeedIds: [],
      createdAt: minsAgo(14400 - volIds.length * 500),
      updatedAt: minsAgo(14400 - volIds.length * 500),
    });
    volIds.push({ id: ref.id, name: v.name });
    console.log(`     ✅ ${v.name} (${v.zone})`);
  }

  // 3. Seed needs
  console.log(`\n  📋 Seeding ${orgDef.needs.length} needs...`);
  const needIds = [];
  const base = { assignedVolunteers: [], assignedVolunteer: null, assignmentReason: null };
  for (const n of orgDef.needs) {
    const ref = await addDoc(collection(db, 'needs'), {
      ...base,
      ...n,
      orgId,
    });
    needIds.push({ id: ref.id, location: n.location });
    console.log(`     ✅ [${n.urgency}] ${n.needType} — ${n.location}`);
  }

  // 4. Apply assignments
  if (orgDef.assignments && orgDef.assignments.length > 0) {
    console.log(`\n  🔗 Creating ${orgDef.assignments.length} assignments...`);
    const volNeedMap = {};

    for (const a of orgDef.assignments) {
      const needInfo = needIds[a.needIdx];
      const assignedVols = a.volIdxs.map((vi) => volIds[vi]);

      const updateData = { status: a.status };
      if (assignedVols.length > 0) {
        updateData.assignedVolunteers = assignedVols.map((v) => ({ id: v.id, name: v.name }));
        updateData.assignedVolunteer = assignedVols.map((v) => v.name).join(', ');
        updateData.assignmentReason = `AI-matched based on skill alignment, zone proximity, and availability.`;
      }
      if (a.status === 'resolved') {
        updateData.resolvedAt = Timestamp.fromDate(new Date());
        updateData.resolvedByVolunteers = assignedVols.map((v) => ({ id: v.id, name: v.name, status: 'done' }));
      }
      await updateDoc(doc(db, 'needs', needInfo.id), updateData);

      for (const v of assignedVols) {
        if (!volNeedMap[v.id]) volNeedMap[v.id] = [];
        if (a.status !== 'resolved') volNeedMap[v.id].push(needInfo.id);
      }
      const icon = a.status === 'resolved' ? '✅' : a.status === 'in_progress' ? '🔄' : '🔗';
      console.log(`     ${icon} ${needInfo.location} → ${a.status} → ${assignedVols.map(v=>v.name).join(', ')}`);
    }

    // Mark busy volunteers
    let busyCount = 0;
    for (const [volId, needIdsList] of Object.entries(volNeedMap)) {
      if (needIdsList.length > 0) {
        await updateDoc(doc(db, 'volunteers', volId), { status: 'busy', assignedNeedIds: needIdsList });
        busyCount++;
      }
    }

    const openCount = orgDef.needs.length - orgDef.assignments.length;
    const assignedCount = orgDef.assignments.filter(a => a.status === 'assigned').length;
    const progressCount = orgDef.assignments.filter(a => a.status === 'in_progress').length;
    const resolvedCount = orgDef.assignments.filter(a => a.status === 'resolved').length;

    console.log(`\n  📊 ${orgDef.name} Summary:`);
    console.log(`     ${orgDef.volunteers.length} volunteers (${orgDef.volunteers.length - busyCount} free, ${busyCount} busy)`);
    console.log(`     ${orgDef.needs.length} needs: ${openCount} open, ${assignedCount} assigned, ${progressCount} in-progress, ${resolvedCount} resolved`);
  }
}


// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

async function seedMultiOrgDemo() {
  console.log('\n🔄 Clearing ALL existing data...\n');
  await clearCollection('needs');
  await clearCollection('volunteers');
  await clearCollection('organizations');
  await clearCollection('assignments');

  for (const orgDef of ORGS) {
    await seedOrg(orgDef);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🎉 MULTI-ORG DEMO DATA SEEDED SUCCESSFULLY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n  📦 3 Organizations created:`);
  console.log(`     1. Dharwad Relief Network — PIN: 1234 — 8 volunteers, 12 needs`);
  console.log(`     2. Mumbai Health Initiative — PIN: 5678 — 6 volunteers, 10 needs`);
  console.log(`     3. Bengaluru Community Aid — PIN: 9012 — 5 volunteers, 8 needs`);
  console.log(`\n  ⚠️  IMPORTANT: After seeding, when you log in, you won't see data`);
  console.log(`     automatically because these orgs are owned by "${DEMO_USER_ID}".`);
  console.log(`     Use the "Join Existing" option in OrgPicker with one of these names:`);
  console.log(`       • "Dharwad Relief Network"`);
  console.log(`       • "Mumbai Health Initiative"`);
  console.log(`       • "Bengaluru Community Aid"\n`);
  process.exit(0);
}

seedMultiOrgDemo().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
