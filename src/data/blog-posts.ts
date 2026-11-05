export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: "CBA Pedagogy" | "Marks & Report Cards" | "School Leadership" | "Teacher Tools";
  categorySlug: "cba-pedagogy" | "marks-report-cards" | "school-leadership" | "teacher-tools";
  publishDate: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  featured: boolean;
  tags: string[];
  imageUrl: string;
  imageAlt: string;
  whatsappShareText: string;
  coverGradient: string;
  visualType: "report-card" | "excel-error" | "logbook-inspection" | "fee-collection";
  toc: { id: string; text: string }[];
  contentHtml: string;
}

export const BLOG_CATEGORIES = [
  { name: "All Guides", slug: "all" },
  { name: "Teacher Tools", slug: "teacher-tools" },
  { name: "Marks & Report Cards", slug: "marks-report-cards" },
  { name: "CBA Pedagogy", slug: "cba-pedagogy" },
  { name: "School Leadership", slug: "school-leadership" },
] as const;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-cameroon-teachers-make-extra-income",
    title: "6 Practical Ways Cameroon Teachers Can Make Extra Income in 2026 (Without Burning Out)",
    subtitle: "From home lessons and past exam booklets to helping schools switch to modern report cards: realistic ways to put extra cash in your pocket.",
    excerpt: "Teaching is noble work, but classroom salaries alone are often tight. Here are 6 practical and honest ways Cameroon teachers make extra money without burning out or hurting their teaching.",
    category: "Teacher Tools",
    categorySlug: "teacher-tools",
    publishDate: "November 5, 2026",
    readTime: "7 min read",
    author: {
      name: "Sangwa Jesly",
      role: "Secondary School Educator",
    },
    featured: true,
    tags: ["Teachers", "Income", "Education in Cameroon", "Side Hustles", "School Agents", "MINESEC"],
    imageUrl: "/images/blog/teacher-extra-income.jpg",
    imageAlt: "6 Extra Income Streams for Teachers - Cameroon educator holding course materials in classroom",
    coverGradient: "from-[#1C3B14] to-[#366B24]",
    visualType: "fee-collection",
    whatsappShareText: "💡 *6 Practical Ways Cameroon Teachers Can Earn Extra Income in 2026:* Honest, realistic ways for secondary school educators to make extra money:\n",
    toc: [
      { id: "reality-of-salaries", text: "The Reality of Teacher Pay in Cameroon" },
      { id: "ethical-tutoring", text: "1. Weekend Home Lessons (With Fair Rules)" },
      { id: "exam-pamphlets", text: "2. GCE & Baccalauréat Past Question Booklets" },
      { id: "holiday-camps", text: "3. August Holiday Practical Classes" },
      { id: "mark-assistance", text: "4. Helping Colleagues with Marks Entry" },
      { id: "official-marking", text: "5. Official Exam Marking & Invigilation" },
      { id: "digital-school-agent", text: "6. Becoming a School Agent for Nsei Sukul" },
      { id: "how-to-start", text: "How to Start Without Losing Focus on Your Students" },
    ],
    contentHtml: `
      <p class="text-base sm:text-lg text-[#2A4315] font-medium leading-relaxed mb-6">
        Every teacher in Cameroon knows how it feels: you love teaching your students, but at the end of the month, the money does not match the rising cost of foodstuffs, taxi fare, and rent in towns like Yaounde, Douala, Bafoussam, or Bamenda.
      </p>

      <h2 id="reality-of-salaries" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        The Reality of Teacher Pay in Cameroon
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Whether you are a government teacher, a teacher in a mission school, or a contract teacher (vacataire) in a private college, base salaries are often tight. But trying to do exhausting side jobs that keep you up all night will only leave you tired and frustrated in class on Monday morning.
      </p>
      <p class="mb-6 text-sm text-[#444444] leading-relaxed">
        The best way to make extra money is by using what you already know: your subject knowledge, your understanding of exams, and the fact that you know how schools work. Here are 6 realistic ways teachers in Cameroon are doing it right now.
      </p>

      <h2 id="ethical-tutoring" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        1. Weekend Home Lessons (With Fair Rules)
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Home lessons remain the most common way teachers of subjects like Maths, Physics, Chemistry, French, and English make extra money. In neighborhoods like Bastos, Bonamoussadi, or Mendong, parents regularly pay 25,000 FCFA to 50,000 FCFA per month for weekend revision sessions.
      </p>
      <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] mb-4 text-xs text-[#333333]">
        <strong>One Important Rule:</strong> Never do paid home lessons for students who are in your own classroom at school. That easily brings trouble and suspicion during exam sequence marking. Teach students from other classes or neighboring schools instead. Keep your integrity clean.
      </div>

      <h2 id="exam-pamphlets" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        2. GCE & Baccalauréat Past Question Booklets
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Students preparing for national exams (GCE Ordinary and Advanced Level, Probatoire, or Baccalauréat) are always looking for worked solutions that show them exactly how marks are awarded.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        If you have experience with exams, compile 5 years of past questions with clear, step-by-step explanations. Printing and spiral binding costs about 800 to 1,200 FCFA per booklet. If you sell it for 2,500 FCFA, you make over 1,300 FCFA profit on every copy. Selling 100 copies across two schools puts 130,000 FCFA clean profit in your pocket before mock exams start.
      </p>

      <h2 id="holiday-camps" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        3. August Holiday Practical Classes
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        July and August are dry months for teacher pockets, especially in private schools. But parents in town are always looking for a safe, useful place for their children to learn while they are at work.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Team up with 1 or 2 colleagues to run a 3-week August workshop (teaching computer typing, basic science experiments, or reading skills). If each student pays 15,000 FCFA and you have 25 students, that is 375,000 FCFA to share during the hardest month of the year.
      </p>

      <h2 id="mark-assistance" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        4. Helping Colleagues with Marks Entry on Deadlines
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        During Sequence 2, Sequence 4, and Term exams, older teachers or staff members who are not fast on computers often get overwhelmed by typing marks and calculating averages before class councils.
      </p>
      <p class="mb-6 text-sm text-[#444444] leading-relaxed">
        If you are fast on a laptop, offering to enter and verify marks for 3 to 5 busy colleagues at 5,000 to 10,000 FCFA per class is a quick way to make money right in the staff room.
      </p>

      <h2 id="official-marking" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        5. Official Exam Marking & Invigilation
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Applying early for official invigilation and marking centers (GCE Board marking in Buea or Bamenda, and OBC marking in regional centers) provides guaranteed per diem allowances and script bonuses.
      </p>
      <p class="mb-6 text-sm text-[#444444] leading-relaxed">
        Even though the work is intense over 10 to 14 days, a marker usually goes home with 80,000 to 180,000 FCFA, plus you learn exactly how examiners grade scripts.
      </p>

      <h2 id="digital-school-agent" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        6. Becoming a School Agent for Nsei Sukul (Make Money Helping Schools)
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Let us be real: at the end of every term, teachers across Cameroon go through serious stress. You have teachers rushing to type marks on laptops, flash drives moving from one person to another, Excel formulas breaking, and Principals shouting because report cards are late.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        That is why we created <strong>Nsei Sukul</strong>. It is a simple school software built for Cameroon schools. It handles student lists, marks, report cards, and school fees. And the best part is that it works offline inside the school campus even when MTN or Orange internet has failed.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Instead of hiring outside sales people who know nothing about teaching, we work directly with teachers like you. You already know your Principal, and you have friends teaching in other schools nearby.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Here is how you make money: you talk to your Principal or a friend who runs a school. When that school signs up and pays for Nsei Sukul, we send you <strong>10% of that money straight to your MTN MoMo or Orange Money</strong>. For a normal school, that is 10,000 FCFA to 50,000 FCFA cash in your pocket right away.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        It does not end there. Every September when the school renews for the new academic year, you get another <strong>5% payment</strong> sent to your phone, as long as you are still there helping the school get started with their first term marks.
      </p>

      <div class="my-6 p-5 rounded-[10px] bg-[#FAF8F2] border-2 border-[#2A7C13] space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-[#2A7C13]">Simple Example</span>
          <span class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EAF7E4] text-[#166534]">If you bring 4 schools</span>
        </div>
        <p class="text-xs text-[#333333] leading-relaxed">
          Say you introduce your own school and 3 other schools you know:
        </p>
        <ul class="text-xs space-y-1.5 text-[#333333] list-disc list-inside">
          <li><strong>First Year:</strong> You receive about <strong>110,000 FCFA</strong> straight to your phone.</li>
          <li><strong>Every September After:</strong> You receive around <strong>55,000 FCFA</strong> every school reopening, right when you need money for your own family expenses.</li>
        </ul>
        <div class="pt-2">
          <a
            href="/agents"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#2A7C13] text-white text-xs font-bold hover:bg-[#1E5C0D] transition-colors"
          >
            <span>See the full payment table and details on our Agent Page</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>

      <h2 id="how-to-start" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        How to Start Without Losing Focus on Your Students
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Good teachers take pride in their work. Pick one or two simple ways to earn that fit your weekly schedule: maybe home lessons on Saturday morning, past questions in second term, and introducing Nsei Sukul to your school and friends.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        When your pockets have breathing room, you teach with peace of mind, your patience with your students improves, and you enjoy your profession much more.
      </p>
    `,
  },
  {
    slug: "minesec-inspection-cahier-de-texte-checklist",
    title: "What an Inspector Actually Checks in a Cameroon School: A Simple Teacher Checklist",
    subtitle: "A practical guide to keeping your Cahier de Texte, lesson plans, and mark sheets ready for any surprise visit.",
    excerpt: "No panic when inspectors arrive. Here are the 4 real things pedagogic inspectors look at in your logbook and classroom, and how to stay prepared.",
    category: "Teacher Tools",
    categorySlug: "teacher-tools",
    publishDate: "October 24, 2026",
    readTime: "5 min read",
    author: {
      name: "Sangwa Jesly",
      role: "Secondary School Educator",
    },
    featured: true,
    tags: ["MINESEC", "Inspection", "Cahier de Texte", "Scheme of Work", "Teachers"],
    imageUrl: "/images/blog/teacher-inspection.jpg",
    imageAlt: "Cameroon secondary school educator holding official lesson logbook and register before class",
    coverGradient: "from-[#2A4315] to-[#4E7D28]",
    visualType: "logbook-inspection",
    whatsappShareText: "📋 *What Inspectors Check in Cameroon Schools:* A clean, simple checklist for your Cahier de Texte and lesson notes:\n",
    toc: [
      { id: "what-inspectors-look-for", text: "What Inspectors Actually Look For" },
      { id: "cahier-de-texte", text: "1. The Logbook (Cahier de Texte)" },
      { id: "scheme-of-work", text: "2. Scheme of Work & Pacing" },
      { id: "student-scripts", text: "3. Marked Test Scripts & Books" },
      { id: "common-mistakes", text: "Top 3 Mistakes That Get Teachers In Trouble" },
      { id: "staying-ready", text: "How to Stay Ready Without Stress" },
    ],
    contentHtml: `
      <p class="lead text-base sm:text-lg text-[#333333] font-medium leading-relaxed mb-6">
        When a ministry vehicle pulls into the school courtyard at 9:00 AM, the word spreads fast across the staff room: <em>"Inspectors are here!"</em> For teachers who have let their records pile up, panic sets in. But an inspection does not have to be stressful if you know what they actually check.
      </p>

      <p class="mb-5 text-sm text-[#444444] leading-relaxed">
        Inspectors do not have time to read every page in your files. In most secondary schools across Cameroon (GBHS, bilingual colleges, and private schools), they look at four specific things.
      </p>

      <h2 id="what-inspectors-look-for" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        The 4 Things Inspectors Check First
      </h2>

      <h3 id="cahier-de-texte" class="text-base font-bold text-[#142010] mt-6 mb-2">
        1. The Class Logbook (Cahier de Texte)
      </h3>
      <p class="mb-3 text-sm text-[#444444] leading-relaxed">
        The logbook is the official evidence that lessons took place. Inspectors check:
      </p>
      <div class="space-y-2 mb-6 text-xs text-[#333333]">
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-start gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <div><strong>Date and Time:</strong> Does the entry match the official class timetable? If you have Math on Tuesday at 10:00 AM, is that what is written?</div>
        </div>
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-start gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <div><strong>Lesson Topic:</strong> Is the lesson clearly stated? (Not just <em>"Continuation of lesson"</em>, but the exact topic taught).</div>
        </div>
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-start gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <div><strong>Homework / Exercises:</strong> Did you assign practice exercises or an assignment?</div>
        </div>
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-start gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <div><strong>Signatures:</strong> Both the teacher and the class prefect must sign each lesson.</div>
        </div>
      </div>

      <h3 id="scheme-of-work" class="text-base font-bold text-[#142010] mt-6 mb-2">
        2. Scheme of Work & Pacing
      </h3>
      <p class="mb-3 text-sm text-[#444444] leading-relaxed">
        Inspectors place your Scheme of Work next to the Cahier de Texte to see if you are on schedule:
      </p>
      <ul class="text-xs space-y-1.5 text-[#444444] mb-6 list-disc list-inside">
        <li><strong>By end of Term 1 (December):</strong> You should have covered about 35% of the syllabus.</li>
        <li><strong>By end of Term 2 (March):</strong> Exam classes (Form 5 and Upper Sixth) should be near 75% or finishing the syllabus to allow time for revision drills.</li>
        <li><strong>By Term 3 (May):</strong> 100% completed with past questions and exam practice.</li>
      </ul>

      <h3 id="student-scripts" class="text-base font-bold text-[#142010] mt-6 mb-2">
        3. Marked Test Scripts & Student Notebooks
      </h3>
      <p class="mb-3 text-sm text-[#444444] leading-relaxed">
        Inspectors will often ask two students in the back row to see their exercise books:
      </p>
      <div class="space-y-2 mb-6 text-xs text-[#333333]">
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <strong>Did you return test papers?</strong> MINESEC guidelines state that Sequence test scripts must be returned to students with corrections. A teacher who keeps student scripts in their drawer for two months gets flagged immediately.
        </div>
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <strong>Did you mark notebooks?</strong> Inspectors look for teacher ticks and signatures in student exercise books to confirm student work is being checked.
        </div>
      </div>

      <h2 id="common-mistakes" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        Top 3 Mistakes That Get Teachers In Trouble
      </h2>
      <div class="space-y-2.5 my-4 text-xs text-[#333333]">
        <div class="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-900">
          <strong>1. Filling 3 weeks of work in one day:</strong> Writing weeks of entries with the exact same pen and ink is obvious. Inspectors spot backfilled logbooks in 10 seconds.
        </div>
        <div class="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-900">
          <strong>2. Different marks on report cards vs your mark sheet:</strong> If a student has 14 on their report card, but 11 on your personal mark sheet, this creates serious administrative issues.
        </div>
        <div class="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-900">
          <strong>3. Using an outdated textbook:</strong> Teaching from old syllabuses that were changed years ago.
        </div>
      </div>

      <h2 id="staying-ready" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        How to Stay Ready Without Stress
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        The simplest routine is to spend five minutes at the end of every Friday signing your logbook and checking your weekly scheme.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        For school heads, Vice-Principals, and HODs, keeping track of 40 teachers manually is tough. Platforms like <strong>Nsei Sukul</strong> help keep academic timetables, sequence marks, and student rosters stored safely on school computers, so when visitors arrive, reports are ready in seconds.
      </p>
    `,
  },
  {
    slug: "minesec-cba-competency-appreciations",
    title: "How to Write Report Card Appreciations Without Stress (Cameroon CBA Guide)",
    subtitle: "A practical guide with simple, copy-paste examples for Science, Arts, and Commercial subjects.",
    excerpt: "Stop staring at blank report card boxes. Here is how to write clear, helpful competency appreciations for your students in minutes.",
    category: "CBA Pedagogy",
    categorySlug: "cba-pedagogy",
    publishDate: "October 28, 2026",
    readTime: "6 min read",
    author: {
      name: "Sangwa Jesly",
      role: "Secondary School Educator",
    },
    featured: true,
    tags: ["MINESEC", "CBA", "Report Cards", "Class Master", "Cameroon"],
    imageUrl: "/images/blog/teacher-math-whiteboard.jpg",
    imageAlt: "Secondary teacher writing mathematical formulas and competency notes on classroom whiteboard",
    coverGradient: "from-[#142010] to-[#2A7C13]",
    visualType: "report-card",
    whatsappShareText: "📚 *Quick Guide for Cameroon Teachers:* Simple, practical report card appreciations for Science & Arts:\n",
    toc: [
      { id: "why-appreciations-matter", text: "Why Appreciations Give Teachers Headaches" },
      { id: "the-4-mark-bands", text: "The 4 Standard Mark Bands" },
      { id: "practical-examples", text: "Practical Examples by Subject" },
      { id: "phrases-to-avoid", text: "Phrases to Avoid" },
      { id: "class-master-tip", text: "A Quick Tip for Class Masters" },
    ],
    contentHtml: `
      <p class="lead text-base sm:text-lg text-[#333333] font-medium leading-relaxed mb-6">
        Every term in secondary schools across Cameroon, teachers face the same tiring task: filling in the <em>"Appreciation"</em> column for 70, 80, or 90 students in each stream. By student number 40, your brain is tired, and you end up writing <em>"Can do better"</em> on every line.
      </p>

      <p class="mb-5 text-sm text-[#444444] leading-relaxed">
        Under MINESEC rules, report cards require qualitative feedback: an appreciation that tells the parent and student what they actually understood, not just a bare number.
      </p>

      <h2 id="the-4-mark-bands" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        The 4 Practical Mark Bands
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Instead of guessing, use these 4 standard bands based on the student's score out of 20:
      </p>

      <div class="space-y-3 mb-6 text-xs text-[#333333]">
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <span class="font-bold text-[#B45309] block mb-1">0 to 9.5 / 20: Not Acquired (Non Acquis)</span>
          <p class="text-[#525E4B]">The student is struggling. Write one specific thing they need to practice. Example: <em>"Struggles with basic formulas; needs revision on fractions and geometry."</em></p>
        </div>
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <span class="font-bold text-[#525E4B] block mb-1">10 to 13.5 / 20: In Progress (En Cours d&apos;Acquisition)</span>
          <p class="text-[#525E4B]">Average performance. Acknowledge effort and encourage consistency. Example: <em>"Fair understanding of course material; regular homework will improve grades."</em></p>
        </div>
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <span class="font-bold text-[#166534] block mb-1">14 to 17.5 / 20: Acquired (Compétence Acquise)</span>
          <p class="text-[#525E4B]">Solid pass. Good grasp of topics. Example: <em>"Good mastery of course concepts. Expresses ideas clearly."</em></p>
        </div>
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <span class="font-bold text-[#2A7C13] block mb-1">18 to 20 / 20: Expert</span>
          <p class="text-[#525E4B]">Top of the class. Praise excellence. Example: <em>"Outstanding performance; demonstrates thorough understanding and problem-solving skills."</em></p>
        </div>
      </div>

      <h2 id="practical-examples" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        Quick Subject Examples You Can Use
      </h2>

      <h3 class="text-sm font-bold text-[#142010] mt-4 mb-2">Mathematics & Sciences:</h3>
      <ul class="text-xs space-y-1.5 text-[#444444] mb-4 list-disc list-inside">
        <li><strong>Below 10:</strong> Needs to memorize formulas and review calculations step by step.</li>
        <li><strong>10 - 13:</strong> Solves simple equations correctly; needs more practice with word problems.</li>
        <li><strong>14 - 17:</strong> Very good analytical skills and accurate calculations.</li>
        <li><strong>18 - 20:</strong> Exceptional reasoning; quick and accurate problem solver.</li>
      </ul>

      <h3 class="text-sm font-bold text-[#142010] mt-4 mb-2">English & Languages:</h3>
      <ul class="text-xs space-y-1.5 text-[#444444] mb-4 list-disc list-inside">
        <li><strong>Below 10:</strong> Needs daily reading practice to improve vocabulary and spelling.</li>
        <li><strong>10 - 13:</strong> Understands grammar rules; work on essay structure.</li>
        <li><strong>14 - 17:</strong> Fluent expression and good vocabulary in written work.</li>
        <li><strong>18 - 20:</strong> Excellent command of language and mature writing style.</li>
      </ul>

      <h2 id="phrases-to-avoid" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        3 Phrases to Never Write on a Report Card
      </h2>
      <div class="space-y-2 mb-6 text-xs text-[#333333]">
        <div class="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-900">
          <strong>1. &ldquo;Hopeless&rdquo; or &ldquo;Nul&rdquo;:</strong> Destroys student morale and creates conflict with parents.
        </div>
        <div class="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-900">
          <strong>2. Leaving it blank:</strong> An empty appreciation box looks unprofessional and can be flagged during inspection.
        </div>
        <div class="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-900">
          <strong>3. Just writing &ldquo;Good&rdquo; for everybody:</strong> Gives zero guidance to the student or parent.
        </div>
      </div>

      <h2 id="class-master-tip" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        A Quick Tip for Class Masters
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        If you are the Class Master compiling the final report card sheets, set a rule for subject teachers to submit appreciations alongside their marks. Modern school management systems like <strong>Nsei Sukul</strong> even generate standard appreciations automatically from the student's mark band, saving teachers hours of manual handwriting.
      </p>
    `,
  },
  {
    slug: "fix-excel-class-council-errors",
    title: "How to Run a Smooth Class Council (Without Excel Spreadsheet Errors)",
    subtitle: "The 4 most common spreadsheet mistakes that break report cards, and simple rules to avoid them.",
    excerpt: "Every term, teachers stay up until midnight fixing broken Excel formulas before deliberations. Here is how to keep your class marks accurate and error-free.",
    category: "Marks & Report Cards",
    categorySlug: "marks-report-cards",
    publishDate: "October 26, 2026",
    readTime: "6 min read",
    author: {
      name: "Sangwa Jesly",
      role: "Secondary School Educator",
    },
    featured: false,
    tags: ["Class Council", "Excel", "Report Cards", "Class Master", "Deliberations"],
    imageUrl: "/images/blog/students-class-council.jpg",
    imageAlt: "Classroom of secondary students listening attentively during sequence deliberation review",
    coverGradient: "from-[#0A1628] to-[#1C3660]",
    visualType: "excel-error",
    whatsappShareText: "📊 *Class Council Guide for Cameroon Teachers:* How to avoid Excel formula breaks and calculation errors:\n",
    toc: [
      { id: "excel-struggle", text: "Why Excel Struggles in School Deliberations" },
      { id: "common-spreadsheet-errors", text: "4 Common Mistakes in School Spreadsheets" },
      { id: "tie-breaks", text: "Handling Ties and Absent Students" },
      { id: "pre-deliberation-checklist", text: "The 5-Minute Class Master Checklist" },
    ],
    contentHtml: `
      <p class="lead text-base sm:text-lg text-[#333333] font-medium leading-relaxed mb-6">
        It is 7:00 PM on a Friday before end-of-term holidays. The Principal is waiting in the deliberation room for the Class Council results. The Class Master is sweating over a laptop because student ranks are completely mixed up, and cell <code>F42</code> says <code>#DIV/0!</code>.
      </p>

      <p class="mb-5 text-sm text-[#444444] leading-relaxed">
        Most secondary schools in Cameroon still calculate sequence averages and report cards using shared Excel files. Excel is a great tool, but when multiple teachers copy and paste marks into the same sheet, formulas break easily.
      </p>

      <h2 id="common-spreadsheet-errors" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        4 Common Mistakes in School Spreadsheets
      </h2>

      <div class="space-y-3 mb-6 text-xs text-[#333333]">
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <strong class="text-[#142010] block mb-1">1. Commas vs. Decimal Points (14,5 vs 14.5)</strong>
          <p class="text-[#525E4B]">Depending on Windows language settings, Excel treats <code>14,5</code> as text rather than a number. When you calculate the average, Excel ignores that student's mark completely, lowering their average without warning.</p>
        </div>
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <strong class="text-[#142010] block mb-1">2. Marking Absent Students with Zero (0) Instead of ABS</strong>
          <p class="text-[#525E4B]">If a sick student with medical permission missed an exam, putting <code>0</code> penalizes their term rank unfairly. If you leave it empty or write <code>ABS</code>, a generic <code>AVERAGE</code> formula often crashes with <code>#VALUE!</code> unless configured properly.</p>
        </div>
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <strong class="text-[#142010] block mb-1">3. Wrong Subject Coefficients</strong>
          <p class="text-[#525E4B]">Form 3 coefficients differ from Form 5. If one subject coefficient is entered as 2 instead of 4, the entire class ranking is invalid.</p>
        </div>
        <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9]">
          <strong class="text-[#142010] block mb-1">4. Copy-Pasting Over Formulas</strong>
          <p class="text-[#525E4B]">A teacher pasting a column of marks accidentally pastes over the total formula cell at the bottom of the column.</p>
        </div>
      </div>

      <h2 id="pre-deliberation-checklist" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        The 5-Minute Class Master Checklist
      </h2>
      <p class="mb-3 text-sm text-[#444444] leading-relaxed">
        Before you print report cards or present your broadsheet to the Principal, check these five points:
      </p>

      <div class="space-y-2 mb-6 text-xs text-[#333333]">
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-center gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <span>Check that total coefficients match the official class curriculum (e.g. 25, 28, or 32).</span>
        </div>
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-center gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <span>Scan for marks higher than 20 or negative numbers typed by mistake.</span>
        </div>
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-center gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <span>Ensure absent students are marked with clear administrative reason (ABS Med vs Unexcused).</span>
        </div>
        <div class="p-3 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-center gap-2">
          <span class="text-[#2A7C13] font-bold">✓</span>
          <span>Verify that student names and matricules match the official admission register.</span>
        </div>
      </div>

      <p class="text-sm text-[#444444] leading-relaxed mb-4">
        To avoid formula headaches entirely, consider a dedicated school platform like <strong>Nsei Sukul</strong>. It calculates coefficients, ranks students, and prints official report cards automatically, even when working completely offline during power cuts.
      </p>
    `,
  },
  {
    slug: "cameroon-school-fee-collection-guide",
    title: "School Fee Collection: How to Avoid Gate Drama and Cash Losses",
    subtitle: "A practical guide for school proprietors, principals, and bursars to collect tuition smoothly.",
    excerpt: "Practical steps to avoid end-of-term gate chasing, prevent unrecorded cash, and keep student fee accounts clear.",
    category: "School Leadership",
    categorySlug: "school-leadership",
    publishDate: "October 22, 2026",
    readTime: "5 min read",
    author: {
      name: "Sangwa Jesly",
      role: "School Administrator",
    },
    featured: false,
    tags: ["School Finance", "Bursary", "Fees", "Proprietors", "Cameroon Schools"],
    imageUrl: "/images/blog/classroom-lesson.jpg",
    imageAlt: "Secondary students in uniform seated at wooden desks with exercise books and textbooks",
    coverGradient: "from-[#2C1810] to-[#783D10]",
    visualType: "fee-collection",
    whatsappShareText: "💰 *School Fee Collection Guide for Principals & Bursars:* Practical tips to avoid cash leaks and gate drama:\n",
    toc: [
      { id: "the-fee-challenge", text: "The End-of-Term Fee Crisis" },
      { id: "clear-installments", text: "1. Structure 3 Clear Installments" },
      { id: "printed-receipts", text: "2. Instant Printed Receipts Only" },
      { id: "staff-boundaries", text: "3. Never Let Teachers Collect Cash" },
      { id: "tracking-tools", text: "4. Keeping Clear Digital Records" },
    ],
    contentHtml: `
      <p class="lead text-base sm:text-lg text-[#333333] font-medium leading-relaxed mb-6">
        Almost every private and confessional secondary school in Cameroon faces the same mid-term scene: students standing outside the gate during mock exams, angry parents demanding explanations at the bursary, and teachers waiting weeks for their monthly allowances.
      </p>

      <p class="mb-5 text-sm text-[#444444] leading-relaxed">
        Chasing students at the school gate disrupts learning and damages your school's reputation. Here are four simple rules that organized schools use to collect fees reliably without unnecessary drama.
      </p>

      <h2 id="clear-installments" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        1. Break Fees into 3 Fixed Deadlines
      </h2>
      <p class="mb-3 text-sm text-[#444444] leading-relaxed">
        Asking parents to pay the full annual fee at once causes defaults. Set three clear dates early in September:
      </p>
      <ul class="text-xs space-y-1.5 text-[#444444] mb-6 list-disc list-inside">
        <li><strong>Installment 1 (Registration, September):</strong> 50% of tuition to cover initial operational costs, books, and chalk.</li>
        <li><strong>Installment 2 (Late November):</strong> 30% before First Term report cards and Christmas holidays.</li>
        <li><strong>Installment 3 (Mid-January):</strong> Remaining 20% before Second Term mock exams.</li>
      </ul>

      <h2 id="printed-receipts" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        2. Issue Printed Receipts Immediately
      </h2>
      <p class="mb-3 text-sm text-[#444444] leading-relaxed">
        Handwritten carbon-copy receipt books cause endless arguments: receipts get lost, carbon copies fade, and students claim to have paid when the office has no record.
      </p>
      <div class="p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] mb-6 text-xs text-[#333333]">
        Every payment should generate an immediate printed receipt showing the student's matricule, the amount paid, and the outstanding balance. When parents know every transaction is logged, disputes disappear.
      </div>

      <h2 id="staff-boundaries" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        3. Never Let Classroom Teachers Collect Cash
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Allowing subject teachers or Class Masters to collect PTA levies, lab fees, or tuition inside classrooms leads to confusion, misplaced cash, and mistrust.
      </p>
      <p class="mb-6 text-sm text-[#444444] leading-relaxed">
        All financial payments must go strictly through the Bursar or direct bank / Mobile Money deposit. Teachers should focus entirely on pedagogy.
      </p>

      <h2 id="tracking-tools" class="text-lg sm:text-xl font-bold text-[#142010] mt-8 mb-3 pb-1 border-b border-[#E8DFC9]">
        4. Keep an Instant Daily Ledger
      </h2>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        At the end of every school day, the Bursar should know the exact cash collected and the list of students with balances in each class stream.
      </p>
      <p class="mb-4 text-sm text-[#444444] leading-relaxed">
        Systems like <strong>Nsei Sukul</strong> provide a built-in fee ledger that prints official payment receipts and tracks balances per student without requiring complicated accounting software.
      </p>
    `,
  },
];
