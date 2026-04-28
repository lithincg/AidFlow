# Multi-NGO Testing Checklist

> Run through this before your presentation. Each section simulates a real-world scenario.
> Your dev server should be running (`npm run dev` → http://localhost:5173)

---

## 1. Unauthenticated User (No Login)

- [ ] Open http://localhost:5173 in an **incognito window**
- [ ] **Welcome landing page** should appear (NOT the board)
- [ ] Verify it says "AidFlow" with sign-in button
- [ ] Click **Priority Board** tab → still shows Welcome (no data leaks)
- [ ] Click **Submit Need** tab → still shows Welcome
- [ ] Click **Volunteers** tab → still shows Welcome
- [ ] ✅ **Pass criteria:** Zero needs/volunteers visible without login

---

## 2. First-Time Login → Org Creation

- [ ] Click **Sign in with Google** → complete login
- [ ] After login, **OrgPicker** should appear (not the board)
- [ ] Create a new org → name it **"Dharwad Relief Network"**
- [ ] After creation, you should land on the **Priority Board**
- [ ] Board should show **0 needs** (fresh org, no data)
- [ ] StatusBar should show **0 total needs, 0 volunteers**
- [ ] Header should show **org badge** with "Dharwad Relief Network"
- [ ] ✅ **Pass criteria:** Fresh org = empty dashboard

---

## 3. Submit a Need (Org-Scoped)

- [ ] Go to **Submit Need** tab
- [ ] Fill in a test need:
  - Location: `Ward 5, Dharwad`
  - Description: `Flooding has displaced 50 families, need emergency shelter kits`
  - Affected Group: `Displaced families`
  - Reporter: `Your name`
- [ ] Click **Submit** → wait for AI classification
- [ ] Go back to **Priority Board** → need should appear
- [ ] ✅ **Pass criteria:** Need shows up on the board with AI urgency + type

---

## 4. Add a Volunteer (Org-Scoped)

- [ ] Go to **Volunteers** tab
- [ ] Click **+ Register Volunteer**
- [ ] Fill in:
  - Name: `Ravi Kumar`
  - Skills: `first aid, logistics`
  - Zone: `Ward 5`
  - Phone: `9876543210`
- [ ] Submit → volunteer should appear in the roster
- [ ] ✅ **Pass criteria:** Volunteer shows as 🟢 Free

---

## 5. Assign Volunteer to Need

- [ ] Go to **Priority Board** → click on the need you created
- [ ] Click **👥 Assign Volunteers**
- [ ] Ravi Kumar should appear in the list
- [ ] Either manually select or use **🤖 AI Auto-Assign**
- [ ] After assignment, need status should change to **Assigned**
- [ ] Go to **Volunteers** tab → Ravi should show as 🔴 Busy
- [ ] ✅ **Pass criteria:** Assignment works, volunteer status updates

---

## 6. Resolve the Need

- [ ] Go to **Priority Board** → click the assigned need
- [ ] Click **✅ Resolve**
- [ ] Need should move to **Resolved** status
- [ ] Go to **Volunteers** → Ravi should be back to 🟢 Free
- [ ] Ravi's "tasks completed" count should increment
- [ ] ✅ **Pass criteria:** Resolve frees volunteers and tracks completion

---

## 7. Create a SECOND Org (Isolation Test) ⭐ KEY TEST

- [ ] Click the **org badge** in the header (shows org name)
- [ ] Click **Switch / Create** (or similar option)
- [ ] Create a new org → name it **"Mumbai Health Initiative"**
- [ ] After creation, **Priority Board should show 0 needs**
- [ ] **Volunteers tab should show 0 volunteers**
- [ ] StatusBar should show **0 total, 0 volunteers**
- [ ] ✅ **Pass criteria:** Second org is completely empty — no data from first org leaked

---

## 8. Submit in Second Org

- [ ] Submit a need in "Mumbai Health Initiative":
  - Location: `Andheri, Mumbai`
  - Description: `Vaccination drive needed for 200 children in slum area`
  - Affected Group: `Children under 5`
- [ ] Verify it appears on the board
- [ ] ✅ **Pass criteria:** Need is tagged to Mumbai org only

---

## 9. Switch Back to First Org (Data Persistence)

- [ ] Click org badge → switch back to **"Dharwad Relief Network"**
- [ ] Priority Board should show **only** Dharwad's need (the resolved one)
- [ ] Volunteers tab should show **only** Ravi Kumar
- [ ] The Mumbai vaccination need should **NOT** appear
- [ ] ✅ **Pass criteria:** Switching orgs shows only that org's data

---

## 10. Verify in Second Org Again

- [ ] Switch to **"Mumbai Health Initiative"**
- [ ] Board shows **only** the Mumbai vaccination need
- [ ] Volunteers tab shows **0 volunteers** (Ravi belongs to Dharwad)
- [ ] ✅ **Pass criteria:** Complete isolation confirmed both ways

---

## Summary Table for Quick Reference

| # | Test | What to Verify |
|---|------|---------------|
| 1 | No login | Welcome page, zero data |
| 2 | First login | OrgPicker appears, fresh empty org |
| 3 | Submit need | Need appears with AI classification |
| 4 | Add volunteer | Volunteer shows as Free |
| 5 | Assign | Volunteer → Busy, need → Assigned |
| 6 | Resolve | Volunteer freed, task count ++ |
| 7 | **Second org** | **0 needs, 0 volunteers (isolation!)** |
| 8 | Submit in org 2 | Need in org 2 only |
| 9 | Switch to org 1 | Only org 1 data visible |
| 10 | Switch to org 2 | Only org 2 data visible |

---

## 🎤 Presentation Talking Points

After completing the checklist, highlight these during your demo:

1. **"Each NGO is a completely isolated workspace"** — show the switch between orgs
2. **"No data leaks"** — unauthenticated users see nothing
3. **"AI-powered classification"** — show the urgency/type assigned by Gemini
4. **"AI volunteer matching"** — show the auto-assign reasoning
5. **"Real-time updates"** — data syncs instantly via Firestore
6. **"Reversible architecture"** — `git checkout master` reverts everything
