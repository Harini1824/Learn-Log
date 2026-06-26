import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function init(): Firestore {
  if (getApps().length === 0) {
    const raw = process.env["FIREBASE_SERVICE_ACCOUNT"];
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var missing");
    initializeApp({ credential: cert(JSON.parse(raw) as object) });
  }
  return getFirestore();
}

const db = init();

async function clearAll() {
  const collections = [
    "users", "zones", "coordinators", "trainers", "students",
    "locations", "courses", "units", "chapters", "modules",
    "progress", "progressHistory", "auditLogs", "_sequences",
  ];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    if (snap.size === 0) { console.log(`  ${col}: empty`); continue; }
    // Delete in batches of 400
    const chunks: typeof snap.docs[] = [];
    for (let i = 0; i < snap.docs.length; i += 400) chunks.push(snap.docs.slice(i, i + 400));
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    console.log(`  Cleared ${col} (${snap.size} docs)`);
  }
}

async function setSeq(col: string, next: number) {
  await db.collection("_sequences").doc(col).set({ next });
}

// ── Course structure ────────────────────────────────────────────────────────
const COURSE_STRUCTURE = [
  {
    name: "Unit 1: Introduction to Accessibility",
    orderIndex: 1,
    estimatedHours: 8,
    chapters: [
      {
        name: "Chapter 1: Understanding Digital Accessibility",
        orderIndex: 1,
        modules: [
          "Overview of Digital Accessibility",
          "Types of Disabilities",
          "Importance of Accessible Digital Content",
        ],
      },
      {
        name: "Chapter 2: Accessibility Standards and Guidelines",
        orderIndex: 2,
        modules: [
          "Overview of WCAG",
          "WCAG Principles (POUR)",
          "Section 508 and ADA Standards",
        ],
      },
    ],
  },
  {
    name: "Unit 2: Basic Skills",
    orderIndex: 2,
    estimatedHours: 10,
    chapters: [
      {
        name: "Chapter 1: Introduction to Assistive Technologies",
        orderIndex: 1,
        modules: [
          "Introduction to Screen Readers (JAWS, NVDA)",
          "Magnifiers and Assistive Tools",
          "Navigation Using Assistive Technologies",
        ],
      },
      {
        name: "Chapter 2: Basic Computer and Internet Skills",
        orderIndex: 2,
        modules: [
          "Computer Operations and Keyboard Shortcuts",
          "Internet Browsing Techniques",
          "MS Office Applications",
        ],
      },
    ],
  },
  {
    name: "Unit 3: Intermediate Accessibility Testing",
    orderIndex: 3,
    estimatedHours: 12,
    chapters: [
      {
        name: "Chapter 1: Understanding HTML and ARIA",
        orderIndex: 1,
        modules: [
          "Introduction to HTML",
          "ARIA Roles",
          "ARIA Properties and Accessibility Enhancement",
        ],
      },
      {
        name: "Chapter 2: Testing with Screen Readers",
        orderIndex: 2,
        modules: [
          "JAWS Training",
          "NVDA Training",
          "Reporting Accessibility Issues",
        ],
      },
    ],
  },
  {
    name: "Unit 4: Advanced Accessibility Testing",
    orderIndex: 4,
    estimatedHours: 12,
    chapters: [
      {
        name: "Chapter 1: Automated Accessibility Testing Tools",
        orderIndex: 1,
        modules: [
          "Axe",
          "WAVE",
          "Lighthouse",
        ],
      },
      {
        name: "Chapter 2: Manual Accessibility Testing Techniques",
        orderIndex: 2,
        modules: [
          "Manual Testing Techniques",
          "Creating Accessibility Test Cases",
          "Manual Testing Practice",
        ],
      },
    ],
  },
  {
    name: "Unit 5: Reporting and Compliance",
    orderIndex: 5,
    estimatedHours: 10,
    chapters: [
      {
        name: "Chapter 1: Creating Accessibility Reports",
        orderIndex: 1,
        modules: [
          "Accessibility Reporting Techniques",
          "Documenting Issues and Recommendations",
          "Accessibility Report Management Tools",
        ],
      },
      {
        name: "Chapter 2: Ensuring Compliance with Accessibility Standards",
        orderIndex: 2,
        modules: [
          "WCAG Compliance Checklists",
          "Section 508 and ADA Compliance",
          "Continuous Compliance Monitoring",
        ],
      },
    ],
  },
  {
    name: "Unit 6: Life Skills and Final Assessments",
    orderIndex: 6,
    estimatedHours: 8,
    chapters: [
      {
        name: "Chapter 1: Life Skills Development",
        orderIndex: 1,
        modules: [
          "Creative Thinking and Problem Solving",
          "Decision Making and Self Awareness",
          "Interpersonal Skills and Stress Management",
        ],
      },
      {
        name: "Chapter 2: Final Assessments and Role Simulations",
        orderIndex: 2,
        modules: [
          "Theory Assessments",
          "Practical Assessments",
          "Role Simulations",
        ],
      },
    ],
  },
];

async function seed() {
  console.log("\nClearing existing data...");
  await clearAll();

  // ── Zones ──────────────────────────────────────────────────────────────────
  const zoneNames = [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli",
    "Salem", "Tirunelveli", "Vellore", "Erode",
  ];
  const zones: { id: string; numericId: number; name: string }[] = [];
  for (let i = 0; i < zoneNames.length; i++) {
    const numericId = i + 1;
    const ref = await db.collection("zones").add({ name: zoneNames[i], description: `${zoneNames[i]} zone`, numericId });
    zones.push({ id: ref.id, numericId, name: zoneNames[i] });
  }
  await setSeq("zones", zones.length + 1);
  console.log(`✓ Seeded ${zones.length} zones`);

  // ── Coordinators ───────────────────────────────────────────────────────────
  const coordNames = [
    "Mr. Bhuvaneshan", "Ms. Kavitha", "Mr. Sundaram", "Ms. Preethi",
    "Mr. Arumugam", "Ms. Selvi", "Mr. Rajan", "Ms. Meena",
  ];
  const coordinators: { id: string; numericId: number; name: string; zoneId: number }[] = [];
  for (let i = 0; i < coordNames.length; i++) {
    const numericId = i + 1;
    const zoneId = zones[i].numericId;
    const ref = await db.collection("coordinators").add({ name: coordNames[i], phone: `922222${String(i).padStart(4, "0")}`, zoneId, numericId });
    coordinators.push({ id: ref.id, numericId, name: coordNames[i], zoneId });
  }
  await setSeq("coordinators", coordinators.length + 1);
  console.log(`✓ Seeded ${coordinators.length} coordinators`);

  // ── Locations (14 centres) ─────────────────────────────────────────────────
  const centreData = [
    { name: "Chennai North Centre", zoneIdx: 0 },
    { name: "Chennai South Centre", zoneIdx: 0 },
    { name: "Coimbatore Main Centre", zoneIdx: 1 },
    { name: "Coimbatore West Centre", zoneIdx: 1 },
    { name: "Madurai Central Centre", zoneIdx: 2 },
    { name: "Madurai East Centre", zoneIdx: 2 },
    { name: "Trichy Centre", zoneIdx: 3 },
    { name: "Trichy South Centre", zoneIdx: 3 },
    { name: "Salem Centre", zoneIdx: 4 },
    { name: "Tirunelveli Centre", zoneIdx: 5 },
    { name: "Vellore Centre", zoneIdx: 6 },
    { name: "Erode Centre", zoneIdx: 7 },
    { name: "Erode East Centre", zoneIdx: 7 },
    { name: "Salem West Centre", zoneIdx: 4 },
  ];
  for (let i = 0; i < centreData.length; i++) {
    const { name: centreName, zoneIdx } = centreData[i];
    const zoneId = zones[zoneIdx].numericId;
    const coordinatorId = coordinators[zoneIdx].numericId;
    await db.collection("locations").add({ centreName, zoneId, coordinatorId, numericId: i + 1 });
  }
  await setSeq("locations", centreData.length + 1);
  console.log(`✓ Seeded ${centreData.length} locations`);

  // ── Trainers (32, 4 per zone) ──────────────────────────────────────────────
  const trainerNames = [
    "Mr. Ramkumar", "Ms. Anitha", "Mr. Selvam", "Ms. Deepa",
    "Mr. Krishnan", "Ms. Vimala", "Mr. Babu", "Ms. Radha",
    "Mr. Murugan", "Ms. Saranya", "Mr. Suresh", "Ms. Nithya",
    "Mr. Pandian", "Ms. Parvathi", "Mr. Senthil", "Ms. Suganya",
    "Mr. Durai", "Ms. Gomathi", "Mr. Karthik", "Ms. Hema",
    "Mr. Balaji", "Ms. Jaya", "Mr. Velan", "Ms. Kaveri",
    "Mr. Arjun", "Ms. Lakshmi", "Mr. Ravi", "Ms. Malathi",
    "Mr. Ganesan", "Ms. Sumathi", "Mr. Vijay", "Ms. Thilaga",
  ];
  const centrePairs = [
    "Chennai North Centre", "Chennai South Centre",
    "Coimbatore Main Centre", "Coimbatore West Centre",
    "Madurai Central Centre", "Madurai East Centre",
    "Trichy Centre", "Trichy South Centre",
    "Salem Centre", "Salem West Centre",
    "Tirunelveli Centre", "Erode Centre",
    "Vellore Centre", "Erode East Centre",
    "Erode Centre", "Salem Centre",
  ];
  const trainers: { id: string; numericId: number; name: string; zoneId: number }[] = [];
  for (let i = 0; i < trainerNames.length; i++) {
    const numericId = i + 1;
    const zoneIdx = Math.floor(i / 4);
    const zoneId = zones[zoneIdx].numericId;
    const centreName = centrePairs[i % centrePairs.length] ?? "Centre";
    await db.collection("trainers").add({ name: trainerNames[i], phone: `911111${String(i).padStart(4, "0")}`, zoneId, centreName, numericId });
    trainers.push({ id: "", numericId, name: trainerNames[i], zoneId });
  }
  await setSeq("trainers", trainers.length + 1);
  console.log(`✓ Seeded ${trainers.length} trainers`);

  // ── Course ─────────────────────────────────────────────────────────────────
  await db.collection("courses").add({
    numericId: 1,
    name: "Web Accessibility Testing",
    syllabus: "A comprehensive course on web accessibility testing for assistive technology professionals. Covers accessibility standards, assistive technologies, testing tools, reporting, and life skills.",
  });
  await setSeq("courses", 2);

  // ── Units → Chapters → Modules ─────────────────────────────────────────────
  let unitId = 1;
  let chapterId = 1;
  let moduleId = 1;

  for (const unitDef of COURSE_STRUCTURE) {
    await db.collection("units").add({
      numericId: unitId,
      courseId: 1,
      name: unitDef.name,
      orderIndex: unitDef.orderIndex,
      estimatedHours: unitDef.estimatedHours,
    });

    for (const chapterDef of unitDef.chapters) {
      await db.collection("chapters").add({
        numericId: chapterId,
        unitId,
        name: chapterDef.name,
        orderIndex: chapterDef.orderIndex,
      });

      for (let mIdx = 0; mIdx < chapterDef.modules.length; mIdx++) {
        await db.collection("modules").add({
          numericId: moduleId,
          chapterId,
          name: chapterDef.modules[mIdx],
          orderIndex: mIdx + 1,
        });
        moduleId++;
      }
      chapterId++;
    }
    unitId++;
  }

  const totalUnits = unitId - 1;
  const totalChapters = chapterId - 1;
  const totalModules = moduleId - 1;

  await setSeq("units", unitId);
  await setSeq("chapters", chapterId);
  await setSeq("modules", moduleId);

  console.log(`✓ Seeded 1 course, ${totalUnits} units, ${totalChapters} chapters, ${totalModules} modules`);

  // ── Students (8) ───────────────────────────────────────────────────────────
  const studentData = [
    { name: "Priya Lakshmi", phone: "9876543210", trainerId: 1 },
    { name: "Arun Kumar", phone: "9876543211", trainerId: 1 },
    { name: "Kavitha Devi", phone: "9876543212", trainerId: 2 },
    { name: "Senthil Nathan", phone: "9876543213", trainerId: 2 },
    { name: "Meena Sundaram", phone: "9876543214", trainerId: 3 },
    { name: "Rajesh Pandi", phone: "9876543215", trainerId: 5 },
    { name: "Anbu Selvi", phone: "9876543216", trainerId: 9 },
    { name: "Vimal Raj", phone: "9876543217", trainerId: 13 },
  ];
  const students: { numericId: number; name: string }[] = [];
  for (let i = 0; i < studentData.length; i++) {
    const numericId = i + 1;
    const { name, phone, trainerId } = studentData[i];
    await db.collection("students").add({
      numericId, name, email: null, phone,
      courseId: 1, timing: "Morning",
      centreName: "Chennai North Centre",
      trainerId,
    });
    students.push({ numericId, name });
  }
  await setSeq("students", students.length + 1);
  console.log(`✓ Seeded ${students.length} students`);

  // ── Progress records — spread across multiple units ────────────────────────
  // Module IDs 1–36 (3 per chapter, 2 chapters per unit, 6 units)
  // Unit 1 Ch1: 1-3 | Unit 1 Ch2: 4-6 | Unit 2 Ch1: 7-9 | Unit 2 Ch2: 10-12
  // Unit 3 Ch1: 13-15 | Unit 3 Ch2: 16-18 | Unit 4 Ch1: 19-21 | Unit 4 Ch2: 22-24
  // Unit 5 Ch1: 25-27 | Unit 5 Ch2: 28-30 | Unit 6 Ch1: 31-33 | Unit 6 Ch2: 34-36
  const progressData: { studentId: number; moduleId: number; trainerId: number; rating: string }[] = [
    // Priya (student 1) — Unit 1 complete, Unit 2 partial
    { studentId: 1, moduleId: 1, trainerId: 1, rating: "independent" },
    { studentId: 1, moduleId: 2, trainerId: 1, rating: "independent" },
    { studentId: 1, moduleId: 3, trainerId: 1, rating: "clueing" },
    { studentId: 1, moduleId: 4, trainerId: 1, rating: "verbal_prompting" },
    { studentId: 1, moduleId: 7, trainerId: 1, rating: "physical_prompting" },
    { studentId: 1, moduleId: 8, trainerId: 1, rating: "totally_dependent" },
    // Arun (student 2) — Unit 1 partial
    { studentId: 2, moduleId: 1, trainerId: 1, rating: "physical_prompting" },
    { studentId: 2, moduleId: 2, trainerId: 1, rating: "totally_dependent" },
    { studentId: 2, moduleId: 4, trainerId: 1, rating: "clueing" },
    // Kavitha (student 3) — Unit 1 Ch1 done, Ch2 partial
    { studentId: 3, moduleId: 1, trainerId: 2, rating: "independent" },
    { studentId: 3, moduleId: 2, trainerId: 2, rating: "independent" },
    { studentId: 3, moduleId: 3, trainerId: 2, rating: "independent" },
    { studentId: 3, moduleId: 4, trainerId: 2, rating: "clueing" },
    { studentId: 3, moduleId: 5, trainerId: 2, rating: "verbal_prompting" },
    // Senthil (student 4)
    { studentId: 4, moduleId: 1, trainerId: 2, rating: "verbal_prompting" },
    { studentId: 4, moduleId: 13, trainerId: 2, rating: "totally_dependent" },
    // Meena (student 5)
    { studentId: 5, moduleId: 1, trainerId: 3, rating: "clueing" },
    { studentId: 5, moduleId: 2, trainerId: 3, rating: "physical_prompting" },
    { studentId: 5, moduleId: 7, trainerId: 3, rating: "verbal_prompting" },
    // Rajesh (student 6)
    { studentId: 6, moduleId: 1, trainerId: 5, rating: "independent" },
    { studentId: 6, moduleId: 4, trainerId: 5, rating: "clueing" },
    // Anbu (student 7)
    { studentId: 7, moduleId: 1, trainerId: 9, rating: "totally_dependent" },
    { studentId: 7, moduleId: 7, trainerId: 9, rating: "totally_dependent" },
    // Vimal (student 8)
    { studentId: 8, moduleId: 1, trainerId: 13, rating: "physical_prompting" },
    { studentId: 8, moduleId: 2, trainerId: 13, rating: "totally_dependent" },
  ];

  const now = new Date().toISOString();
  for (let i = 0; i < progressData.length; i++) {
    const { studentId, moduleId: mId, trainerId, rating } = progressData[i];
    await db.collection("progress").add({
      numericId: i + 1, studentId, moduleId: mId, trainerId,
      rating, comments: null,
      submittedAt: now, updatedAt: now, updatedBy: trainerId,
    });
  }
  await setSeq("progress", progressData.length + 1);
  console.log(`✓ Seeded ${progressData.length} progress records`);

  // ── Users (login accounts) ─────────────────────────────────────────────────
  const usersData = [
    { phone: "9000000000", pin: "1234", role: "management", entityId: null, name: "Admin" },
    { phone: "9111111111", pin: "1234", role: "trainer", entityId: 1, name: "Mr. Ramkumar" },
    { phone: "9222222222", pin: "1234", role: "coordinator", entityId: 1, name: "Mr. Bhuvaneshan" },
    { phone: "9876543210", pin: "1234", role: "student", entityId: 1, name: "Priya Lakshmi" },
  ];
  for (let i = 0; i < usersData.length; i++) {
    await db.collection("users").add({ ...usersData[i], numericId: i + 1, status: "active", isFirstLogin: false });
  }
  await setSeq("users", usersData.length + 1);
  console.log(`✓ Seeded ${usersData.length} users`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const [cCount, uCount, chCount, mCount] = await Promise.all([
    db.collection("courses").count().get(),
    db.collection("units").count().get(),
    db.collection("chapters").count().get(),
    db.collection("modules").count().get(),
  ]);

  console.log("\n──────────────────────────────────────────────");
  console.log("✅ Firestore seeding complete!");
  console.log("──────────────────────────────────────────────");
  console.log(`  Courses:  ${cCount.data().count}`);
  console.log(`  Units:    ${uCount.data().count}`);
  console.log(`  Chapters: ${chCount.data().count}`);
  console.log(`  Modules:  ${mCount.data().count}`);
  console.log("──────────────────────────────────────────────");
  console.log("Login accounts (PIN: 1234):");
  console.log("  Management:  9000000000");
  console.log("  Trainer:     9111111111  (Mr. Ramkumar, Zone 1)");
  console.log("  Coordinator: 9222222222  (Mr. Bhuvaneshan, Zone 1)");
  console.log("  Student:     9876543210  (Priya Lakshmi)");
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
