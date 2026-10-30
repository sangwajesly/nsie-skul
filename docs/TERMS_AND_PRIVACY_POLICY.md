# NSEI SUKUL MANAGEMENTS SYSTEM
## MASTER TERMS OF SERVICE & DATA PRIVACY POLICY
**Applicable across Web Cloud, Mobile Client, and School Hub On-Premises Nodes**  
**Jurisdiction: Republic of Cameroon**  
**Effective Date: October 2026**  
**Governing Authority: Agence Nationale des Technologies de l'Information et de la Communication (ANTIC) / MINPOSTEL / MINESEC**

---

### LEGAL NOTICE & REGULATORY COMPLIANCE PREAMBLE

This document constitutes the binding legal agreement and data privacy policy governing the access, deployment, and utilization of the **Nsei Sukul Managements System** (including cloud web interfaces, mobile teacher applications, and local on-premises School Hub offline nodes).

This platform operates strictly under the legal and regulatory framework of the **Republic of Cameroon**, specifically compliant with:
1. **Law No. 2024/017 of 23 December 2024** relating to the Protection of Personal Data in Cameroon (*Loi n° 2024/017 du 23 décembre 2024 portant protection des données à caractère personnel au Cameroun*);
2. **Law No. 2010/012 of 21 December 2010** on Cybersecurity and Cybercrime in Cameroon (*Loi n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité*);
3. **Law No. 2010/013 of 21 December 2010** governing Electronic Communications in Cameroon;
4. **Law No. 2010/021 of 21 December 2010** governing Electronic Commerce in Cameroon;
5. **Ministry of Secondary Education (MINESEC)** and **Ministry of Basic Education (MINEDUB)** statutory orders, circulars, and continuous assessment evaluation directives governing school registers, competency-based approach (CBA/APC) evaluation, and official examination record confidentiality;
6. Regulatory oversight protocols of the **National Agency for Information and Communication Technologies (ANTIC)**.

> [!IMPORTANT]
> By creating a school account, enrolling students, deploying a School Hub server, inputting continuous assessment marks, or utilizing any feature of Nsei Sukul Managements System, the subscribing Educational Institution, its authorized administrators, teaching personnel, and staff explicitly agree to be bound by these Terms of Service and Data Privacy Policy.

---

## PART 1: DEFINITIONS & INTERPRETATION

1. **"Platform" or "Service"** refers to the Nsei Sukul Managements System software ecosystem, including the cloud application, backend APIs, client-side progressive web applications, and local School Hub on-premises LAN software.
2. **"Institution" or "School"** refers to the government school (Lycée, GBHS, GHS, CES, ENIEG, ENIET), confessional/mission school, or private secular educational institution subscribing to or utilizing the Platform.
3. **"Data Controller"** (*Responsable du traitement*): The subscribing Institution. The School determines the purposes, categories, and lawful means of processing personal data relating to enrolled students, parents, legal guardians, and teaching personnel.
4. **"Data Processor"** (*Sous-traitant*): The operators and technical providers of Nsei Sukul Managements System, who host, maintain, store, and process electronic records strictly on behalf of and according to instructions given by the Data Controller.
5. **"School Hub"**: An on-premises hardware node (e.g., mini-PC, local school desktop, or LAN appliance) deployed within the school compound running local synchronization firmware, enabling zero-internet offline operations, marks entry, and local database syncing.
6. **"Cloud Node"**: The centralized high-availability database and web infrastructure hosted securely on enterprise cloud servers with encrypted replication.
7. **"Student Personal Data"**: Any information relating to an identified or identifiable natural person under the age of majority (minor) enrolled in the Institution, including full names, birth certificates, matricules, passport photographs, evaluation marks, attendance, and disciplinary notes.
8. **"Parent / Legal Guardian"**: The biological parent, court-appointed tutor, or recognized sponsor possessing legal custody and parental authority over an enrolled student.

---

## PART 2: TERMS OF SERVICE (CONDITIONS GÉNÉRALES D'UTILISATION)

### 1. Acceptance and Institutional Authority
1. Any person registering an institution or executing subscription contracts warrants that they possess legitimate legal authority to represent the School (such as the Principal, Headmaster, Proprietor, Manager, or authorized President of the Parent-Teacher Association / PTA).
2. Contracts entered into by unauthorized personnel shall remain the personal financial and legal liability of the individual attempting registration.

### 2. Software License & Scope of Use
1. **Grant of License**: Nsei Sukul grants the Institution a non-exclusive, non-transferable, revocable license to access and deploy the Platform strictly for internal academic administration, student enrolment, continuous assessment marks entry, ministerial report card generation, and tuition fee receipting.
2. **Prohibited Exploitation**:
   - The Institution shall not reverse engineer, decompile, redistribute, sublicense, or commercially resell access to the Platform or any of its proprietary modules.
   - The Institution shall not deploy scraping bots, automated crawlers, or malicious payloads against either the Cloud Node or local School Hub APIs.
   - The Institution shall not use the Platform for any purpose violating the laws of the Republic of Cameroon or MINESEC regulations.

### 3. School Hub Architecture & Local Physical Custody
1. **Local Custody**: The Institution is solely responsible for the physical security, electrical protection (UPS/surge protectors), and environmental maintenance of the computer hardware hosting the School Hub local node on its premises.
2. **Network Security**: The Institution must safeguard the local Wi-Fi router and LAN credentials used to connect teachers' devices to the School Hub. Default router passwords must be changed immediately upon installation.
3. **Data Loss Mitigation**: While Nsei Sukul provides automatic two-way differential synchronization and local automated SQLite/PostgreSQL snapshot backups, the Institution is contractually obligated to designate an IT Administrator or School Clerk to trigger routine external physical backups (e.g. encrypted USB drives kept in the Principal's safe).

### 4. Integrity of Academic Evaluation Marks & Anti-Falsification
1. In accordance with Cameroonian penal provisions and MINESEC disciplinary rules, all continuous assessment marks (Sequences 1 through 6, Trimestre 1 through 3) entered onto the Platform must strictly reflect the genuine, uncorrupted academic evaluations conducted by assigned teachers.
2. The Platform records non-repudiable audit trails (including timestamp, user ID, IP address, and old vs. new marks) for all mark modifications. Any deliberate falsification of grades, selling of marks, or unauthorized post-deadline grade adjustments constitutes academic fraud actionable under the Cameroonian Penal Code (*Faux et usage de faux*).
3. The Institution assumes full legal liability for any disciplinary or judicial consequences arising from staff members abusing their administrative credentials to alter student academic results.

### 5. Subscription Fees, Mobile Money Billing & Trial Terms
1. **Free Pilot Trial**:
   - New institutions may access a complimentary pilot evaluation mode.
   - The trial mode permits evaluation marks entry and system familiarization for up to three (3) class groups.
   - Full institution-wide bulk report card generation and official watermarked MINESEC exports require an active annual license.
2. **Annual / Termly Institutional License**:
   - Subscription fees are billed on an institutional tier based on total student enrolment and school cycle (First Cycle / Second Cycle / Both Cycles).
   - Official Cameroonian Mobile Money payment channels are integrated:
     - **MTN Mobile Money (MoMo)**: `+237 682 833 601` (Account Name: Mbongih Jesly Sangwa)
     - Reference Code: The school's unique official alphanumeric registration code.
   - Subscriptions are non-refundable once the academic term commences and report card generation has been utilized.
3. **Grace Period & Non-Interruption Policy**:
   - If an academic term ends and license renewal is pending, a mandatory **14-day administrative grace period** is automatically granted to ensure that student evaluations and report card printing for ongoing examinations are not abruptly disrupted.
   - Under no circumstances will student academic records be held hostage or deleted due to fee arrears; the School will always retain export access to existing student records in CSV/PDF format.

### 6. Intellectual Property Rights
1. **Platform IP**: Nsei Sukul Managements System, its source code, relational database architecture, user interface components, synchronization protocols, algorithmic CBA grading engines, and branding assets are the exclusive intellectual property of the platform developers.
2. **Institution Data Ownership**: The Institution retains **100% full, exclusive ownership** of all student names, birth registries, examination scores, disciplinary files, and guardian records uploaded to or generated within the system. Nsei Sukul claims zero ownership over educational data.

### 7. Limitation of Liability & Force Majeure
1. **Power & Telecommunications Failures**: In recognition of infrastructure realities in Cameroon (frequent power shedding by ENEO, fiber-optic cable cuts, or local telecommunications shutdowns), the Platform is architected for offline-first local LAN autonomy. Nsei Sukul shall not be held liable for delayed cloud synchronization resulting from nationwide telecommunications blackouts or localized electrical grid failures.
2. **Service Disclaimer**: Except as expressly provided herein, the software is provided on an "as is" and "as available" basis. Nsei Sukul disclaims all implied warranties of merchantability or fitness for a particular purpose outside standard MINESEC continuous assessment management.
3. **Cap on Liability**: To the maximum extent permitted under Cameroonian civil law, Nsei Sukul's aggregate contractual liability to any subscribing Institution for any proven damages shall not exceed the total subscription fees paid by that Institution during the preceding twelve (12) months.

---

## PART 3: DATA PRIVACY & PERSONAL DATA PROTECTION POLICY
*(Pursuant to Law No. 2024/017 of 23 December 2024)*

### 1. Data Controller and Data Processor Relationship
1. **The Institution as Data Controller**: Under Cameroonian Data Protection Law (Law No. 2024/017), the subscribing School is the legal **Data Controller**. The School:
   - Collects physical birth certificates, admission forms, and guardian contact sheets;
   - Determines which students are admitted and enrolled into class registers;
   - Directs the purpose and lawful basis for collecting minor student records.
2. **Nsei Sukul as Data Processor**: Nsei Sukul acts strictly as a **Data Processor**. We process, index, synchronize, and store educational records only under the direct instruction of the Institution and strictly for the operational fulfillment of school administration.

### 2. Legal Basis for Processing & Parental Consent for Minors
1. **Mandatory Parental/Guardian Consent (Article 8 & 9, Law No. 2024/017)**:
   - Because secondary and primary school students are minors under the laws of Cameroon, personal data concerning children cannot be lawfully processed without the explicit, informed consent of their parent or legal guardian.
   - **School's Statutory Warranty**: The Institution warrants that upon student admission, it has secured written or verbal parental/guardian consent allowing the school to digitize student records, generate report cards, and submit mandatory statistics to MINESEC/MINEDUB.
2. **Educational Mandate & Contractual Necessity**: Processing of marks, attendance, and disciplinary actions is strictly necessary for the performance of the educational contract between the parent/student and the Institution, and to satisfy statutory MINESEC academic directives.

### 3. Categories of Personal Data Processed
The Platform collects and processes only the minimum data necessary (*Principe de minimisation*) to satisfy Cameroonian educational requirements:

| Data Category | Specific Fields Collected | Lawful Purpose & Usage |
|---|---|---|
| **Student Biographical Data** | Surname, Given Names, Matricule/Admission Number, Date of Birth, Place of Birth, Gender, Residence Status (Day/Boarding), Repeating Status | Identification on official ministerial registers, age verification for GCE/OBC national exams, class demographic statistics. |
| **Student Photograph** *(Optional)* | Client-side compressed passport photograph (~20KB JPEG data URL) | Optional visual identification on MINESEC report cards, student ID cards, and attendance registers. Never mandatory for admission. |
| **Academic Performance Data** | Marks for Sequences 1–6, term averages, CBA/APC competencies evaluated, coefficients, class ranks, teacher appreciations | Mandatory MINESEC continuous assessment tracking, promotion/repetition council deliberations, official transcript generation. |
| **Disciplinary & Attendance Data** | Justified/unjustified missed hours, late arrivals, reprimands, suspensions, conduct council notes | Student welfare tracking, ministerial discipline reporting, report card discipline matrix. |
| **Parent & Guardian Data** | Full name, relationship to pupil, telephone number (MoMo/Orange/WhatsApp), physical residence/town | Emergency contact, attendance notifications, fee payment receipting, academic progress reports. |
| **Staff & Teacher Data** | Full name, email, phone number, employment role, assigned class subjects, login credentials, activity audit logs | Role-based system access, teacher attribution on student report cards, audit security trails. |

### 4. Client-Side Image Processing & Local Privacy Safeguard
1. **No External Image Scraping**: Student passport photographs uploaded to Nsei Sukul are downsampled and converted entirely within the local browser's memory using HTML5 Canvas (`maxDim = 320px`, JPEG quality 0.85).
2. **Zero Third-Party Image Cloud Dependency**: Photographs are stored directly in the database as standard compact Base64 strings. They are never uploaded to unencrypted third-party image hosting services, never processed by external facial recognition algorithms, and never indexed by commercial search engines.

### 5. Multi-Tenant Data Isolation & Storage Architecture
1. **Tenant Isolation**: Every database query is strictly partitioned by `school_id`. Staff and administrators of School A cannot view, query, search, or alter the records of School B under any circumstance.
2. **Row-Level Security (RLS)**: PostgreSQL Row-Level Security policies are strictly enforced at the database layer, guaranteeing cryptographic isolation between distinct educational establishments.
3. **In-Transit Encryption**: All communication between web browsers, mobile teacher phones, School Hub nodes, and cloud servers is secured using modern TLS 1.3 encryption (HTTPS / WSS).
4. **At-Rest Encryption**: Cloud database tables, automated storage snapshots, and audit log files are encrypted at rest using industry-standard AES-256 encryption.

### 6. Role-Based Access Control (RBAC)
Access to personal data within the Institution is segmented strictly by educational responsibility:
1. **Teachers**: Can only view student names and enter assessment marks for the specific class groups and subjects formally assigned to them by the administration. Teachers cannot view fee payment balances, unrelated class records, or student records of other classes.
2. **Class Masters (Professeurs Principaux)**: Can view full continuous assessment records, calculate ranks, and input conduct remarks for their supervised class group only.
3. **School Administrators / Principals**: Possess institution-wide administrative access to configure classes, allocate staff, approve report cards, and manage admissions.
4. **Audit Logging**: Every sensitive action (grade edit, student deletion, status change from active to dismissed) is permanently recorded in an unalterable audit log with timestamp, operator identity, and originating IP address.

### 7. Commercial Non-Exploitation Warranty
> [!IMPORTANT]
> **Strict Anti-Commercialization Guarantee:**
> - Nsei Sukul Managements System **NEVER sells, rents, leases, trades, or commercially shares** student, parent, or teacher personal data with any third-party marketing agency, advertiser, data broker, or commercial partner.
> - The Platform displays **zero third-party advertisements** and contains **zero tracking cookies** designed for behavioral advertising.
> - Student records are utilized solely for school management and academic report card production.

### 8. Lawful Third-Party Disclosures
Personal data may only be disclosed outside the Platform under the following narrow, lawful exceptions:
1. **Competent Educational Authorities**: Transmission of statutory statistical summaries (e.g. *Carte Scolaire*, candidate registration listings) to MINESEC, MINEDUB, the Cameroon GCE Board, or the *Office du Baccalauréat du Cameroun (OBC)* under official ministerial mandate.
2. **Judicial Orders**: In response to a formal, legally enforceable court order or subpoena issued by a competent Cameroonian Magistrate or the State Prosecutor (*Procureur de la République*), strictly in compliance with Law No. 2010/012 on Cybersecurity.

### 9. Data Retention, Archiving & Erasure
1. **Statutory Educational Retention**: In accordance with Cameroonian educational regulations, continuous assessment records and report cards must be preserved for historical academic verification (e.g. issuing replacement transcripts or verifying student credentials decades later).
2. **Academic Year Archiving**: At the conclusion of each academic year, completed records are marked as archived. Historical report cards remain permanently accessible to authorized school administrators.
3. **Right to Rectification**: Parents, legal guardians, and students possess an absolute right to request the immediate correction of misspelled names, erroneous dates of birth, or incorrect gender records in their administrative file.
4. **Right to Erasure / Account Termination**: Upon permanent withdrawal or graduation, student records are archived. Should an Institution terminate its subscription, it is granted a **30-day export window** to retrieve all data in open formats (CSV, PDF), after which cloud records are scheduled for cryptographic erasure from active instances.

### 10. Data Protection Officer (DPO) & Inquiries
In compliance with Law No. 2024/017, institutions, parents, or staff members wishing to exercise their privacy rights, report an anomaly, or submit a data protection inquiry may contact the Platform Data Protection Lead:

- **Entity**: Nsei Sukul Managements System
- **Lead Contact**: Data Protection & Compliance Officer
- **Direct Telephone / WhatsApp**: `+237 682 833 601`
- **Physical Regional Office**: Bamenda, North West Region, Republic of Cameroon
- **Regulatory Liaison**: National Agency for Information and Communication Technologies (ANTIC), Yaoundé

---

## PART 4: OPERATIONAL CODE OF CONDUCT FOR SCHOOL STAFF

To ensure comprehensive institutional compliance with Cameroonian data privacy laws, subscribing schools must enforce the following operational rules:

1. **Password Discipline**: School clerks, teachers, and administrators must never share their login credentials. Passwords must be at least 8 characters long and never written on chalkboards or sticky notes.
2. **School Hub Physical Access**: The physical computer functioning as the local School Hub must be located in a secure administrative office (e.g., Vice Principal's office, IT lab server room, or Principal's secretariat) and locked when unattended.
3. **Printed Report Card Handling**: Printed report cards contain sensitive psychological, behavioral, and academic performance data. They must be handed directly to parents/guardians during official PTA report-card distribution days, or delivered in sealed envelopes.
4. **Immediate Deactivation**: When a teacher or clerk leaves the employment of the Institution, the School Administrator must immediately revoke their role and deactivate their account in the Staff Management console.

---

### LEGAL DISCLAIMER
*This document has been drafted in alignment with the statutory provisions of Cameroon Law No. 2024/017 on Personal Data Protection, Law No. 2010/012 on Cybersecurity and Cybercrime, and applicable MINESEC administrative directives. While this policy provides extensive operational and technical compliance frameworks, subscribing educational establishments are encouraged to submit their localized internal school rules (Règlement Intérieur) to their divisional educational delegates or competent legal counsel.*
