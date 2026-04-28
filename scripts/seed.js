import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

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

// ═══════════════════════════════════════════
//  15 VOLUNTEERS
// ═══════════════════════════════════════════
const V = [
  { name:'Priya Sharma',        skills:['Nursing','First Aid','Elder Care'],              zone:'Hubli',    phone:'9876543210', tasksCompleted:5 },
  { name:'Rahul Verma',         skills:['Logistics','Driving','Inventory Management'],    zone:'Dharwad',  phone:'9845123456', tasksCompleted:8 },
  { name:'Dr. Ananya Kulkarni', skills:['Medicine','Surgery Assist','Pharmacy'],          zone:'Hubli',    phone:'9900112233', tasksCompleted:12 },
  { name:'Suresh Patil',        skills:['Construction','Plumbing','Electrical Work'],     zone:'Gadag',    phone:'9886654321', tasksCompleted:3 },
  { name:'Meena Joshi',         skills:['Cooking','Food Distribution','Outreach'],        zone:'Hubli',    phone:'8867543210', tasksCompleted:7 },
  { name:'Karthik Hegde',       skills:['Water Purification','Civil Engineering'],        zone:'Dharwad',  phone:'7795432100', tasksCompleted:2 },
  { name:'Fatima Begum',        skills:['Teaching','Counseling','Child Care'],             zone:'Hubli',    phone:'9743218765', tasksCompleted:6 },
  { name:'Vijay Naik',          skills:['Driving','Search & Rescue','First Aid'],         zone:'Belgaum',  phone:'8892345678', tasksCompleted:10 },
  { name:'Lakshmi Devi',        skills:['Midwifery','Nutrition','Health Education'],       zone:'Dharwad',  phone:'9632187450', tasksCompleted:4 },
  { name:'Arjun Deshmukh',      skills:['Animal Handling','Veterinary Aid'],              zone:'Gadag',    phone:'8801234567', tasksCompleted:1 },
  { name:'Deepa Rao',           skills:['Pharmacy','Blood Bank','Lab Technician'],        zone:'Hubli',    phone:'9901234567', tasksCompleted:9 },
  { name:'Mohammed Irfan',      skills:['Electrician','Generator Repair','Welding'],      zone:'Dharwad',  phone:'8845671234', tasksCompleted:5 },
  { name:'Sneha Kulkarni',      skills:['Social Work','Documentation','Translation'],    zone:'Belgaum',  phone:'7712345678', tasksCompleted:3 },
  { name:'Ravi Gowda',          skills:['Heavy Vehicle Driving','Loading','Warehousing'], zone:'Hubli',    phone:'9976543210', tasksCompleted:11 },
  { name:'Kavita Menon',        skills:['Psychiatry','Trauma Counseling','First Aid'],    zone:'Dharwad',  phone:'8834567890', tasksCompleted:7 },
].map((v,i) => ({ ...v, status:'free', assignedNeedIds:[], createdAt:minsAgo(14400-i*500), updatedAt:minsAgo(14400-i*500) }));

// ═══════════════════════════════════════════
//  30 DISTINCT NEEDS
// ═══════════════════════════════════════════
const base = { assignedVolunteers:[], assignedVolunteer:null, assignmentReason:null };
const N = [
  // HIGH (10)
  { ...base, source:'text', location:'Dharwad District Hospital',  description:'Oxygen supply critically low. 20 D-type cylinders needed. ICU patients at risk of respiratory failure.', affectedGroup:'ICU Patients', reporterName:'Dr. Rakesh', urgency:'HIGH', needType:'Medical', aiReason:'Life-threatening — ICU patients without oxygen face immediate mortality.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(15) },
  { ...base, source:'text', location:'Shirur Park, Hubli',        description:'2 units of O-negative blood needed for pregnant woman undergoing emergency cesarean at City Clinic.', affectedGroup:'Pregnant woman', reporterName:'City Clinic Blood Bank', urgency:'HIGH', needType:'Medical', aiReason:'Rare blood type needed for emergency surgery — immediate life threat.', aiConfidence:'high', volunteersNeeded:1, status:'open', createdAt:minsAgo(8) },
  { ...base, source:'ocr',  location:'Hubli South, Ward 12',     description:'Road collapsed after heavy rain. 50 families cut off from clean water, unable to evacuate flooded homes.', affectedGroup:'Residents (50 families)', reporterName:null, urgency:'HIGH', needType:'Safety', aiReason:'Critical flooding cutting water supply and trapping families.', aiConfidence:'high', volunteersNeeded:5, status:'open', createdAt:minsAgo(25) },
  { ...base, source:'text', location:'Keshwapur Care Home',       description:'Elderly care home out of insulin and BP meds. Supply truck delayed 3 days. 22 residents affected.', affectedGroup:'Elderly (22)', reporterName:'Matron Savitri', urgency:'HIGH', needType:'Medical', aiReason:'22 elderly without critical medications face serious health risk.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(40) },
  { ...base, source:'text', location:'Rayapur Slum, Dharwad',     description:'Fire in tin-sheet houses. 8 families displaced. Need emergency shelter, blankets, and first aid.', affectedGroup:'Displaced families (8)', reporterName:'Ward Councilor', urgency:'HIGH', needType:'Safety', aiReason:'Families displaced by fire need immediate shelter and medical aid.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(55) },
  { ...base, source:'text', location:'NH-48 Bypass, Hubli',       description:'Bus accident — 15 injured passengers stranded on highway. Need first responders and hospital transport.', affectedGroup:'Bus passengers (15)', reporterName:'Highway Patrol', urgency:'HIGH', needType:'Medical', aiReason:'Mass casualty — 15 injured need immediate medical response.', aiConfidence:'high', volunteersNeeded:5, status:'open', createdAt:minsAgo(5) },
  { ...base, source:'ocr',  location:'Tarihal Industrial Area',   description:'Chemical leak from factory. Workers reporting nausea and breathing difficulty. Evacuation needed.', affectedGroup:'Factory workers (30+)', reporterName:null, urgency:'HIGH', needType:'Safety', aiReason:'Hazardous chemical exposure — immediate evacuation required.', aiConfidence:'high', volunteersNeeded:6, status:'open', createdAt:minsAgo(10) },
  { ...base, source:'text', location:'Navalgund Town',             description:'Bridge showing cracks after flooding. 200 daily commuters at risk. Needs barricading and rerouting.', affectedGroup:'Commuters (200)', reporterName:'PWD Engineer', urgency:'HIGH', needType:'Infrastructure', aiReason:'Structurally compromised bridge — risk of collapse with daily traffic.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(70) },
  { ...base, source:'text', location:'Annigeri Village',           description:'Snakebite victim in remote village. No anti-venom available locally. Need emergency transport to Hubli hospital.', affectedGroup:'Snakebite patient', reporterName:'Village Health Worker', urgency:'HIGH', needType:'Medical', aiReason:'Life-threatening snakebite needing urgent transport for anti-venom.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(3) },
  { ...base, source:'text', location:'Kundgol, Dharwad Dist.',    description:'Landslide blocked the only access road to 3 villages. 500+ people stranded without supplies.', affectedGroup:'Villagers (500+)', reporterName:'Taluk Office', urgency:'HIGH', needType:'Safety', aiReason:'500+ people stranded with no road access — critical supply chain failure.', aiConfidence:'high', volunteersNeeded:8, status:'open', createdAt:minsAgo(30) },
  // MEDIUM (12)
  { ...base, source:'text', location:'Community Center, Navanagar', description:'500 dry ration kits need packaging and distribution for daily wage workers who lost income.', affectedGroup:'Daily wage workers', reporterName:'Amit Desai', urgency:'MEDIUM', needType:'Food', aiReason:'Large food distribution for vulnerable workers — not immediate life threat.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(180) },
  { ...base, source:'ocr',  location:'Vidya Nagar School',        description:'Medical camp tomorrow — 3 nurses needed for health checkups and vaccination of 200 children.', affectedGroup:'School children (200)', reporterName:null, urgency:'MEDIUM', needType:'Medical', aiReason:'Scheduled camp — important but planned in advance.', aiConfidence:'medium', volunteersNeeded:3, status:'open', createdAt:minsAgo(120) },
  { ...base, source:'text', location:'Unkal Lake Area',            description:'Stray dogs aggressive near park entrance. 3 bite incidents this week. Animal control needed.', affectedGroup:'Park visitors', reporterName:'Resident Association', urgency:'MEDIUM', needType:'Safety', aiReason:'Repeated animal attacks — ongoing safety risk to children.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(240) },
  { ...base, source:'text', location:'Deshpande Nagar, Hubli',    description:'Open manhole unreported 5 days. Two people fell in — one with minor injuries. Needs barricading.', affectedGroup:'Pedestrians', reporterName:'Auto Driver Union', urgency:'MEDIUM', needType:'Infrastructure', aiReason:'Dangerous open manhole with existing injury reports.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(300) },
  { ...base, source:'text', location:'Gadag Bus Stand',           description:'12 migrant families with children stranded overnight. Need temporary shelter and food.', affectedGroup:'Migrant families (12)', reporterName:'Bus Stand Manager', urgency:'MEDIUM', needType:'Food', aiReason:'Families stranded overnight — not life-threatening but urgent.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(90) },
  { ...base, source:'text', location:'BVB College Campus',        description:'Student fainted from heatstroke at outdoor event. First aid standby needed for 800 attendees over 2 days.', affectedGroup:'College students (800)', reporterName:'Event Coordinator', urgency:'MEDIUM', needType:'Medical', aiReason:'Heat incident at large event — proactive medical support needed.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(60) },
  { ...base, source:'text', location:'Belgaum Road, Dharwad',     description:'Contaminated water in 3 apartment complexes. 200+ residents affected. Water testing needed.', affectedGroup:'Residents (200+)', reporterName:'Complex Secretary', urgency:'MEDIUM', needType:'Infrastructure', aiReason:'Contaminated water — health risk growing daily.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(150) },
  { ...base, source:'text', location:'Saptapur, Dharwad',         description:'Post-flood mental health support. 15 displaced families showing trauma and anxiety. Counselors needed.', affectedGroup:'Displaced families (15)', reporterName:'NIMHANS Field Team', urgency:'MEDIUM', needType:'Medical', aiReason:'Mental health crisis — needs timely professional intervention.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(200) },
  { ...base, source:'text', location:'Laxmeshwar Town',           description:'Government school flooded — 400 textbooks damaged. Need volunteers to dry, sort, and redistribute.', affectedGroup:'Students (300)', reporterName:'Headmaster', urgency:'MEDIUM', needType:'Other', aiReason:'Educational disruption affecting 300 students after flooding.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(100) },
  { ...base, source:'text', location:'Hubli Railway Station',     description:'Stranded migrant workers need help registering for free train tickets. Language barrier — need translators.', affectedGroup:'Migrant workers (40)', reporterName:'Station Master', urgency:'MEDIUM', needType:'Other', aiReason:'Language barrier preventing migrants from accessing transport aid.', aiConfidence:'medium', volunteersNeeded:2, status:'open', createdAt:minsAgo(75) },
  { ...base, source:'text', location:'Moorusavir Math Area',      description:'Community kitchen running low on supplies. Feeding 300 flood-affected daily. Need rice, dal, cooking oil.', affectedGroup:'Flood-affected residents', reporterName:'Math Administration', urgency:'MEDIUM', needType:'Food', aiReason:'Ongoing feeding program at risk of stopping due to supply shortage.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(45) },
  { ...base, source:'text', location:'Toll Naka, Hubli',          description:'Illegal dumping site near residential area. Dengue cases rising. Need cleanup and fumigation volunteers.', affectedGroup:'Residents (100+)', reporterName:'PHC Doctor', urgency:'MEDIUM', needType:'Safety', aiReason:'Rising dengue cases linked to dumping — public health concern.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(160) },
  // LOW (8)
  { ...base, source:'text', location:'Old Hubli',                 description:'10 houses need tarpaulin roof covers before monsoon starts next week.', affectedGroup:'Slum residents', reporterName:'Sunita', urgency:'LOW', needType:'Infrastructure', aiReason:'Preventative monsoon prep — not an immediate crisis.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(1440) },
  { ...base, source:'text', location:'Gokul Road',                description:'Large tree fallen across service road. Local traffic congestion but highway clear.', affectedGroup:'Commuters', reporterName:'Traffic Police', urgency:'LOW', needType:'Other', aiReason:'Minor blockage — inconvenience, no danger.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(600) },
  { ...base, source:'text', location:'KIMS Hospital',             description:'Volunteers needed to manage queues for free eye checkup camp this Saturday.', affectedGroup:'Elderly patients', reporterName:'Hospital Admin', urgency:'LOW', needType:'Other', aiReason:'Scheduled event — volunteer coordination needed.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(480) },
  { ...base, source:'text', location:'Nrupathunga Betta',         description:'Hiking trail littered with plastic. Cleanup needed — trail becoming unsafe and unappealing.', affectedGroup:'Hikers', reporterName:'Eco Club Hubli', urgency:'LOW', needType:'Other', aiReason:'Environmental cleanup — quality of life improvement.', aiConfidence:'high', volunteersNeeded:5, status:'open', createdAt:minsAgo(2880) },
  { ...base, source:'text', location:'Kusugal Village',           description:'Village school needs 20 benches repaired and walls repainted before academic year in 3 weeks.', affectedGroup:'Students (120)', reporterName:'Panchayat Head', urgency:'LOW', needType:'Infrastructure', aiReason:'Pre-scheduled maintenance — no urgency.', aiConfidence:'high', volunteersNeeded:4, status:'open', createdAt:minsAgo(4320) },
  { ...base, source:'text', location:'Amargol, Hubli',            description:'Community garden fence broken. Cattle entering and destroying vegetable patches.', affectedGroup:'Urban farmers (20)', reporterName:'Garden Committee', urgency:'LOW', needType:'Infrastructure', aiReason:'Minor infrastructure repair — livelihood impact but not urgent.', aiConfidence:'high', volunteersNeeded:2, status:'open', createdAt:minsAgo(720) },
  { ...base, source:'text', location:'Jayanagar, Hubli',          description:'Street lights out in residential lane for 2 weeks. Safety concern for evening commuters.', affectedGroup:'Lane residents', reporterName:'Resident', urgency:'LOW', needType:'Infrastructure', aiReason:'Street lighting issue — safety concern but not critical.', aiConfidence:'high', volunteersNeeded:1, status:'open', createdAt:minsAgo(960) },
  { ...base, source:'text', location:'Sadashiv Nagar Park',       description:'Park benches broken and swings rusted. Children using unsafe play equipment.', affectedGroup:'Children and families', reporterName:'Park Assoc.', urgency:'LOW', needType:'Other', aiReason:'Park maintenance needed — gradual safety improvement.', aiConfidence:'high', volunteersNeeded:3, status:'open', createdAt:minsAgo(5000) },
];

// ═══════════════════════════════════════════
//  ASSIGNMENTS CONFIG
// ═══════════════════════════════════════════
const ASSIGNMENTS = [
  // ASSIGNED (3) — each volunteer on only 1 active task
  { needIdx:0,  status:'assigned',    volIdxs:[2,0] },     // Hospital → Dr. Ananya + Priya
  { needIdx:10, status:'assigned',    volIdxs:[4] },       // Navanagar Food → Meena
  { needIdx:12, status:'assigned',    volIdxs:[9] },       // Unkal Dogs → Arjun
  // IN PROGRESS (3)
  { needIdx:3,  status:'in_progress', volIdxs:[8,1] },     // Care Home → Lakshmi + Rahul
  { needIdx:5,  status:'in_progress', volIdxs:[7,10] },    // Bus Accident → Vijay + Deepa
  { needIdx:17, status:'in_progress', volIdxs:[14] },      // Mental Health → Kavita
  // RESOLVED (4) — volunteers who completed these are now free again
  { needIdx:22, status:'resolved',    volIdxs:[3,11] },    // Old Hubli tarpaulins → Suresh + Irfan
  { needIdx:23, status:'resolved',    volIdxs:[13] },      // Gokul Road tree → Ravi
  { needIdx:24, status:'resolved',    volIdxs:[6,12] },    // KIMS eye camp → Fatima + Sneha
  { needIdx:26, status:'resolved',    volIdxs:[5] },       // Kusugal school → Karthik
];

// ═══════════════════════════════════════════
async function clearCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  let count = 0;
  for (const d of snapshot.docs) { await deleteDoc(doc(db, name, d.id)); count++; }
  console.log(`  🗑️  Cleared ${count} from "${name}"`);
}

async function seedDatabase() {
  console.log('\n🔄 Clearing existing data...');
  await clearCollection('needs');
  await clearCollection('volunteers');
  await clearCollection('assignments');

  console.log('\n👥 Seeding volunteers...');
  const volIds = [];
  for (const v of V) {
    const ref = await addDoc(collection(db, 'volunteers'), v);
    volIds.push({ id: ref.id, name: v.name });
    console.log(`  ✅ ${v.name} (${v.zone})`);
  }

  console.log('\n📋 Seeding needs...');
  const needIds = [];
  for (const n of N) {
    const ref = await addDoc(collection(db, 'needs'), n);
    needIds.push({ id: ref.id, location: n.location });
    console.log(`  ✅ [${n.urgency}] ${n.needType} — ${n.location}`);
  }

  console.log('\n🔗 Creating assignments...');
  const volNeedMap = {};

  for (const a of ASSIGNMENTS) {
    const needInfo = needIds[a.needIdx];
    const assignedVols = a.volIdxs.map((vi) => volIds[vi]);

    const updateData = { status: a.status };
    if (assignedVols.length > 0) {
      updateData.assignedVolunteers = assignedVols.map((v) => ({ id: v.id, name: v.name }));
      updateData.assignedVolunteer = assignedVols.map((v) => v.name).join(', ');
    }
    await updateDoc(doc(db, 'needs', needInfo.id), updateData);

    for (const v of assignedVols) {
      if (!volNeedMap[v.id]) volNeedMap[v.id] = [];
      if (a.status !== 'resolved') volNeedMap[v.id].push(needInfo.id);
    }
    console.log(`  ${a.status === 'resolved' ? '✅' : '🔗'} ${needInfo.location} → ${a.status}${assignedVols.length ? ' → ' + assignedVols.map(v=>v.name).join(', ') : ''}`);
  }

  let busyCount = 0;
  for (const [volId, needIdsList] of Object.entries(volNeedMap)) {
    const name = volIds.find((v) => v.id === volId)?.name;
    if (needIdsList.length > 0) {
      await updateDoc(doc(db, 'volunteers', volId), { status: 'busy', assignedNeedIds: needIdsList });
      busyCount++;
      console.log(`  🔴 ${name} → busy (${needIdsList.length} task)`);
    } else {
      console.log(`  🟢 ${name} → free (completed resolved tasks)`);
    }
  }

  console.log(`\n✅ Database seeded!`);
  console.log(`   ${V.length} volunteers (${V.length - busyCount} free, ${busyCount} busy)`);
  console.log(`   ${N.length} needs (4 assigned, 4 in-progress, 4 resolved, ${N.length - 12} open)`);
  process.exit(0);
}

seedDatabase().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
