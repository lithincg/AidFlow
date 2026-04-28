import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

function minsAgo(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return Timestamp.fromDate(d);
}

const mockNeeds = [
  {
    source: 'text',
    location: 'Dharwad District Hospital',
    description: 'Oxygen supply critically low. We need immediate delivery of 20 D-type cylinders. Several ICU patients are at risk.',
    affectedGroup: 'ICU Patients',
    reporterName: 'Dr. Rakesh',
    urgency: 'HIGH',
    needType: 'Medical',
    aiReason: 'Life-threatening medical emergency involving ICU patients and oxygen shortage.',
    aiConfidence: 'high',
    status: 'open',
    createdAt: minsAgo(12),
  },
  {
    source: 'ocr',
    location: 'Hubli South, Ward 12',
    description: 'Road collapsed near the main intersection. Area is flooded. Several homes are cut off from clean water.',
    affectedGroup: 'Local residents (approx 50 families)',
    reporterName: null,
    urgency: 'HIGH',
    needType: 'Safety',
    aiReason: 'Significant infrastructure failure causing flooding and cutting off essential water supply.',
    aiConfidence: 'high',
    status: 'assigned',
    assignedVolunteer: 'Priya Sharma',
    assignmentReason: 'Priya is an engineer located in Hubli South with experience in flood response.',
    createdAt: minsAgo(45),
  },
  {
    source: 'text',
    location: 'Community Center, Navanagar',
    description: 'We need volunteers to help package and distribute 500 dry ration kits for daily wage workers.',
    affectedGroup: 'Daily wage workers',
    reporterName: 'Amit Desai',
    urgency: 'MEDIUM',
    needType: 'Food',
    aiReason: 'Significant food requirement for a vulnerable group, but not an immediate life-or-death crisis.',
    aiConfidence: 'high',
    status: 'in_progress',
    assignedVolunteer: 'Rahul Verma',
    assignmentReason: 'Rahul is located in Navanagar and has logistics experience.',
    createdAt: minsAgo(120),
  },
  {
    source: 'ocr',
    location: 'Vidya Nagar School Camp',
    description: 'Medical camp requires 3 registered nurses for basic health checkups tomorrow morning.',
    affectedGroup: 'Camp attendees',
    reporterName: null,
    urgency: 'MEDIUM',
    needType: 'Medical',
    aiReason: 'Important medical requirement for a scheduled camp, but not an acute emergency.',
    aiConfidence: 'medium',
    aiUnreadParts: 'Date/time partially smudged',
    status: 'open',
    createdAt: minsAgo(5),
  },
  {
    source: 'text',
    location: 'Old Hubli',
    description: 'Requesting tarpaulins to cover the roofs of 10 houses before the monsoon rains start next week.',
    affectedGroup: 'Slum residents',
    reporterName: 'Sunita',
    urgency: 'LOW',
    needType: 'Infrastructure',
    aiReason: 'Preventative infrastructure measure needed before next week. Not an immediate crisis.',
    aiConfidence: 'high',
    status: 'resolved',
    createdAt: minsAgo(1440),
  },
  {
    source: 'text',
    location: 'Gokul Road',
    description: 'A large tree has fallen across the service road. It is not blocking the main highway, but causing local traffic jams.',
    affectedGroup: 'Commuters',
    reporterName: 'Traffic Police',
    urgency: 'LOW',
    needType: 'Other',
    aiReason: 'Non-critical infrastructure issue causing inconvenience but no immediate danger.',
    aiConfidence: 'high',
    status: 'open',
    createdAt: minsAgo(60),
  },
  {
    source: 'text',
    location: 'Shirur Park',
    description: 'Emergency blood requirement: 2 units of O-negative blood needed for a pregnant woman undergoing surgery at City Clinic.',
    affectedGroup: 'Pregnant woman',
    reporterName: 'City Clinic Blood Bank',
    urgency: 'HIGH',
    needType: 'Medical',
    aiReason: 'Immediate life-threatening medical situation requiring rare blood type for surgery.',
    aiConfidence: 'high',
    status: 'open',
    createdAt: minsAgo(2),
  },
  {
    source: 'ocr',
    location: 'Keshwapur',
    description: 'Elderly care home running out of essential medicines (insulin and BP meds) due to delayed supply truck.',
    affectedGroup: 'Elderly residents (20+)',
    reporterName: null,
    urgency: 'HIGH',
    needType: 'Medical',
    aiReason: 'Vulnerable elderly population at immediate risk due to lack of critical daily medications.',
    aiConfidence: 'high',
    status: 'assigned',
    assignedVolunteer: 'Dr. Ananya',
    assignmentReason: 'Dr. Ananya is a pharmacist in Keshwapur who can secure the medications.',
    createdAt: minsAgo(30),
  },
  {
    source: 'text',
    location: 'Unkal Lake Area',
    description: 'Stray dogs are getting aggressive near the park entrance. Need animal control or local NGO to safely relocate them.',
    affectedGroup: 'Park visitors',
    reporterName: 'Local Resident Assoc.',
    urgency: 'MEDIUM',
    needType: 'Safety',
    aiReason: 'Potential safety risk to residents, requiring professional handling.',
    aiConfidence: 'high',
    status: 'open',
    createdAt: minsAgo(180),
  },
  {
    source: 'text',
    location: 'KIMS Hospital',
    description: 'Need volunteers to manage the queue and help elderly patients register for the free eye checkup camp.',
    affectedGroup: 'Elderly patients',
    reporterName: 'Hospital Admin',
    urgency: 'LOW',
    needType: 'Other',
    aiReason: 'Administrative support needed for a scheduled event. Quality of life improvement.',
    aiConfidence: 'high',
    status: 'open',
    createdAt: minsAgo(300),
  }
];

export default function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Only render in development mode — never ship to production
  if (!import.meta.env.DEV) return null;

  const handleSeed = async () => {
    setLoading(true);
    try {
      const needsRef = collection(db, 'needs');
      for (const need of mockNeeds) {
        await addDoc(needsRef, need);
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (error) {
      console.error("Failed to seed:", error);
      alert("Failed to seed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSeed}
      disabled={loading || done}
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-black/50 transition-all ${
        done 
          ? 'bg-emerald-500 text-black' 
          : 'bg-accent text-surface-base hover:bg-emerald-400'
      }`}
    >
      {loading ? 'Seeding...' : done ? '✅ Seeded Successfully!' : '🌱 Seed Database (Dev)'}
    </button>
  );
}
