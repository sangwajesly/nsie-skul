# Nsei Sukul Managements System: Sukul Hub System Manual & Field Operations Guide
**On-Premise LAN Architecture, School Deployment, Staff Training & Disaster Recovery**

*Document Version:* 2.0  
*Target Audience:* School Proprietors, Principals, IT Technicians, Field Deployment Engineers, Bursars & Academic Staff  
*System URL (Cloud):* `https://nsei-skul.klarifypath.com`  
*Local Hub Default Address:* `http://192.168.1.100:3000` or `http://school.local:3000`

---

## 1. Executive Summary & Architectural Overview

### 1.1 The Operational Challenge in Schools
Educational institutions across Africa face three critical infrastructure bottlenecks:
1. **Unreliable & Expensive Internet**: Schools frequently lose connectivity during critical administrative periods (sequence exams, deadline for report card generation, peak fee collection weeks).
2. **Frequent Power Outages (Load Shedding)**: Grid power fluctuations interrupt transactions and risk database corruption.
3. **High-Stakes Deadlines**: Bursars must issue official receipts instantly to queuing parents, and hundreds of teachers must input tens of thousands of student scores simultaneously.

### 1.2 The Nsei Sukul Managements System Solution: Tri-Hybrid Architecture
Nsei Sukul Managements System solves this with a **Tri-Hybrid Architecture** that seamlessly unifies Cloud, Local Edge Server (School Hub), and Client Device Offline Storage:

```
                          ┌─────────────────────────────────────┐
                          │     CENTRAL CLOUD PLATFORM          │
                          │   (nsei-skul.klarifypath.com)       │
                          │     • Supabase Multi-Tenant         │
                          │     • Global Student Database       │
                          │     • Subscription & Cryptographic  │
                          │       Lease Authority               │
                          └──────────────────┬──────────────────┘
                                             │
                       Bi-directional Sync   │  (Whenever internet
                       via Secure API        │   is available)
                                             ▼
                          ┌─────────────────────────────────────┐
                          │      ON-PREMISE SCHOOL HUB          │
                          │    (Local Mini-PC or Server)        │
                          │     • Local PostgreSQL 16           │
                          │     • Local Next.js Engine          │
                          │     • Runs 100% OFFLINE on LAN      │
                          │     • 30-Day Cryptographic Lease    │
                          └──────────────────┬──────────────────┘
                                             │
                                Local School Wi-Fi (LAN)
                             (Zero Internet Data Required)
                     ┌───────────────────────┴───────────────────────┐
                     ▼                                               ▼
         ┌───────────────────────┐                       ┌───────────────────────┐
         │  BURSAR & CASHIER     │                       │  TEACHER SMARTPHONES  │
         │  • Offline Receipts   │                       │  • Remote Mark Entry  │
         │  • Device Code (D1)   │                       │  • Local IndexedDB    │
         │  • Printable Vouchers │                       │  • Peer-to-LAN Sync   │
         └───────────────────────┘                       └───────────────────────┘
```

#### The Four Operational Tiers:
- **Tier 1 (Central Cloud)**: Authoritative cloud platform for multi-school management, remote teacher access from home, online fee verification, and cryptographic license validation.
- **Tier 2 (School Hub Edge Server)**: A dedicated low-power computer installed on the school's local premises. It runs a local database and serves the entire school staff over local Wi-Fi without needing external internet.
- **Tier 3 (Device Local-First Outbox)**: Every phone or laptop retains its own client-side IndexedDB database. If even the local router turns off, the user can continue typing without data loss.
- **Tier 4 (Peer-to-LAN Direct Wi-Fi Sync)**: When a teacher enters marks at home via mobile phone (online), the marks are automatically cached in their phone. When they arrive on campus, their phone detects the School Hub over the local school Wi-Fi and transfers the marks directly into the school server without touching the internet.

---

## 2. Hardware & Infrastructure Requirements

### 2.1 School Hub Server Options
The School Hub is lightweight and engineered to run on affordable hardware:

| Component | Minimum Specification | Recommended Specification |
|---|---|---|
| **Form Factor** | Refurbished Core i3 Laptop (built-in battery) | Intel N100 or Core i5 Mini-PC |
| **Processor** | 2 Cores, 2.0 GHz | 4 Cores or 8 Cores (Intel 12th/13th Gen) |
| **RAM** | 4 GB DDR4 | 8 GB or 16 GB DDR4/DDR5 |
| **Storage** | 128 GB SATA SSD | 256 GB or 512 GB NVMe SSD |
| **Operating System**| Windows 10/11 Pro (64-bit) or Ubuntu Linux 22.04 LTS | Ubuntu Server 24.04 LTS or Windows 11 Pro |
| **Network Interface**| Fast Ethernet (100 Mbps) + 2.4 GHz Wi-Fi | Gigabit Ethernet (1000 Mbps) RJ45 port |

> [!TIP]
> **Why an Intel N100 Mini-PC is the Preferred Choice:**
> Mini-PCs draw only 15–25 watts of electricity (less than a single light bulb). A small 650VA UPS or a 12V DC battery pack can power the entire server for 4 to 8 hours during blackouts.

### 2.2 Network Equipment
1. **Wi-Fi Router / Access Point**:
   - Any standard router (e.g., TP-Link Archer C6/C80, Mercusys, Tenda AC10, or a Huawei 4G LTE router).
   - **Crucial Note**: The router **does not need an active internet SIM card** for staff to communicate with the School Hub. The router merely establishes a Local Area Network (LAN).
   - For multi-story or large campuses: 1 or 2 Ethernet-connected ceiling Access Points (e.g., TP-Link Omada or Ubiquiti UniFi).
2. **Cabling**:
   - Cat6 Ethernet cable connecting the School Hub PC directly into one of the LAN ports (LAN1/LAN2) of the router.

### 2.3 Power Backup (Uninterruptible Power Supply)
To protect against sudden power surges and unexpected shutdowns:
- **Server PC**: 650VA–1000VA Line-Interactive UPS (e.g., APC or Mercury).
- **Wi-Fi Router**: 12V DC Mini-UPS (lasts 6–10 hours on internal lithium cells during load shedding).

### 2.4 Bursar Printing Hardware
- **Thermal Receipt Printer**: 58mm or 80mm USB / Ethernet Thermal Printer (ESC/POS compatible, e.g., Xprinter, Epson, POS-58).
- **Standard Office Printer**: Network Laser / InkTank printer (e.g., HP LaserJet Pro, Epson EcoTank L3250) for batch end-of-term student report card printouts.

---

## 3. Step-by-Step Installation & Commissioning Guide

### 3.1 Pre-Installation Checklist
Before heading to the school premises, ensure you have:
- [ ] School Hub PC with power adapter.
- [ ] Cat6 LAN patch cord.
- [ ] Wi-Fi router configured with School SSID (e.g., `GBHS_Staff_Network`) and password.
- [ ] USB flash drive with installer files.
- [ ] School Administrator credentials for `https://nsei-skul.klarifypath.com`.

---

### 3.2 Step 1: Register the School Hub in the Central Portal
Every physical School Hub must be authenticated by the school's central administrator:
1. Log in to `https://nsei-skul.klarifypath.com` as School Administrator.
2. Navigate to **Dashboard → Settings**.
3. Scroll down to the **School Hub Infrastructure** card.
4. Click **"Register New School Hub Node"**:
   - **Hub Name**: e.g., `GBHS Primary Server (Admin Block)`.
   - **Target Hardware**: e.g., `Intel N100 Mini-PC (Serial: 8493021)`.
5. The portal will generate an authorized **Hub Node Key** (e.g., `HUB-N100-GBHS-9872ABC`).
6. Copy this key. It grants the physical computer a **30-day cryptographic lease**.

---

### 3.3 Step 2: Configure the Local Wi-Fi Router
1. Plug the Hub PC into the router via Ethernet cable.
2. Log in to the router admin page (typically `192.168.1.1` or `192.168.0.1`).
3. Set a **Static DHCP Reservation** for the Hub PC's MAC address:
   - Assign IP: `192.168.1.100` (Subnet: `255.255.255.0`, Gateway: `192.168.1.1`).
   - This ensures the School Hub IP **never changes**, even when the router restarts.
4. Configure the Wi-Fi Network:
   - SSID: `NSEI_SCHOOL_HUB` (or the school's official staff Wi-Fi name).
   - Security: WPA2-PSK with a secure passphrase shared with teachers and staff.

---

### 3.4 Step 3: Install & Configure the Hub Software
On the School Hub PC:

1. Clone or copy the Nsei Sukul deployment bundle to `C:\nsei-skul\` (Windows) or `/opt/nsei-skul/` (Linux).
2. Create the configuration file `.env.local` by copying `.env.hub`:
   ```bash
   cp .env.hub .env.local
   ```
3. Edit `.env.local` with the school's credentials:
   ```env
   # Enable School Hub Mode
   NEXT_PUBLIC_HUB_MODE=true
   HUB_MODE=true

   # Registered Node Key from Step 1
   HUB_NODE_KEY=HUB-N100-GBHS-9872ABC

   # Central Sync Endpoint
   CLOUD_SYNC_URL=https://nsei-skul.klarifypath.com/api/v1/hub/sync

   # Local Database Credentials
   HUB_DB_USER=nsei_admin
   HUB_DB_PASSWORD=SecureSchoolPassword2026!
   HUB_DB_NAME=nsei_skul_hub

   # Network Port
   PORT=3000
   ```

---

### 3.5 Step 4: Launch the Local Server
Nsei Sukul Managements System provides a 1-click startup script that checks dependencies, starts PostgreSQL, and launches the application engine:

#### On Windows:
Double-click `start-school-hub.bat`.
```bat
start-school-hub.bat
```

#### On Linux:
Run the startup script:
```bash
chmod +x start-school-hub.sh
./start-school-hub.sh
```

The script automatically:
- Checks if Docker is installed. If available, it spins up `docker-compose.hub.yml`.
- If Docker is not installed, it executes the native Node.js and local PostgreSQL service.
- Prints the verified local URL: `http://192.168.1.100:3000`.

---

### 3.6 Step 5: Configure Automatic Boot on Power Recovery
During load shedding, the server must restart automatically when power returns without human intervention:

1. **BIOS / UEFI Settings**:
   - Power on the PC and press `DEL` or `F2` to enter BIOS.
   - Go to **Power Management** / **Advanced**.
   - Find **"Restore on AC Power Loss"** (or **"After Power Failure"**).
   - Set it to **"Power On"** (Always turn on when electricity is restored).
   - Save and exit (`F10`).
2. **Windows Startup**:
   - Press `Win + R`, type `shell:startup`, and press Enter.
   - Create a shortcut to `start-school-hub.bat` in this folder.
   - Now, whenever Windows boots, the School Hub server starts in the background automatically.

---

### 3.7 Step 6: Initial Cloud Sync (Data Ingestion)
Connect the School Hub temporarily to internet (via phone tethering or modem) for 2 minutes to perform the initial baseline pull:
1. Open `http://localhost:3000/dashboard/settings` on the Hub PC.
2. In the School Hub card, click **"Sync with Cloud Now"**.
3. The Hub downloads:
   - All classes and streams.
   - Full student enrolment rosters with matricule numbers.
   - Subject allocations and academic sequence structures.
   - Fee schedules and expected tuition installments.
   - Cryptographic lease valid for the next 30 days.

---

## 4. Subscription & Cryptographic Lease Model

To protect your business and ensure schools maintain active subscription payments while still working 100% offline, Nsei Sukul Managements System uses a **Cryptographic Rolling Lease**:

### How the 30-Day Lease Works:
1. **Initial Lease**: When the Hub syncs with `nsei-skul.klarifypath.com`, the cloud validates that the school has an active subscription.
2. **Cryptographic Token**: The cloud issues a signed lease payload containing:
   - `school_id`
   - `hub_node_key`
   - `lease_expires_at` (Current Date + 30 Days)
   - `signature` (HMAC-SHA256 signature generated with the cloud master key)
3. **Offline Operation**: The School Hub runs in total isolation for 30 consecutive days without ever touching the internet.
4. **Renewal via Tethering**: Once a month, the school administrator turns on their smartphone's mobile hotspot for **60 seconds**, clicks "Sync Now", and the lease extends for another 30 days.

### Grace Period & Expiry Handling:
- **Days 1–25**: Normal operation. No warnings.
- **Days 26–30**: Gentle notification in the top bar: *"School Hub lease expires in X days. Connect to internet briefly to renew."*
- **Days 31–37 (7-Day Grace Period)**: Amber banner. All core features still work, but administrators are alerted that offline sync will lock soon.
- **Day 38+ (Expired)**: The Hub switches to **Safe Read-Only Mode**. Staff can search student records, view past marks, and reprint receipts, but cannot commit new payments or modify grades until renewed. **No data is ever lost or deleted.**

---

## 5. Daily Operational Workflows

### 5.1 Workflow A: Bursar Fee Collection & Receipts (100% Offline)

#### Device Code Assignment:
To ensure two cashiers collecting fees offline simultaneously never produce duplicate receipt numbers, each device is registered with a unique code:
- Cashier 1 Laptop = `D1`
- Cashier 2 Tablet = `D2`

#### Receipt Numbering Formula:
$$\text{Receipt Number} = \text{SCHOOL\_CODE} - \text{ACADEMIC\_YEAR} - \text{DEVICE\_CODE} - \text{SEQUENTIAL\_COUNTER}$$
*Example:* `GBHS-2026-D1-0042`

#### Daily Cashier Procedure:
1. Open the browser and go to `http://192.168.1.100:3000/dashboard/finance`.
2. Notice the sync badge in the top right:
   - Green: **Online**
   - Amber: **Offline Mode (Device D1 • 0 queued)**
3. Search for the student by matricule or name.
4. Click **"Collect Payment"**, enter the amount (e.g., `25,000 FCFA`), select fee type (Tuition, Registration, PTA), and submit.
5. An **Official Printable Receipt** immediately opens with:
   - Secure Verification Hash (generated offline).
   - Remaining balance calculated locally.
   - Watermark: *"OFFICIAL PROVISIONAL RECEIPT — Offline Recorded"*.
6. Press `Ctrl + P` to print on the connected thermal printer or desktop printer.
7. Hand the receipt to the parent. The transaction is safely persisted in the device's IndexedDB and the Hub's PostgreSQL.

---

### 5.2 Workflow B: Teacher Marks Entry & Peer-to-LAN Transfer

Teachers have three flexible methods to input marks:

#### Method 1: Entering Marks at Home (Remote Cloud Entry)
1. At home, open `https://nsei-skul.klarifypath.com` on phone or laptop.
2. Select Class and Subject (e.g., *Form 3A — Mathematics*).
3. Type student scores. Scores are saved to the cloud AND cached locally in the phone's browser storage.

#### Method 2: Peer-to-LAN Direct Wi-Fi Transfer (Zero Internet at School)
If the teacher inputted marks at home, and arrives at school where the router has **no internet**:
1. Connect phone to the school Wi-Fi router.
2. Open the marksheet in the browser.
3. The badge in the top bar automatically detects the Hub and pulses: **"Hub on Wi-Fi"**.
4. Tap **"Transfer to School Hub"** (or open the Hub modal and tap **"Transfer ALL Marksheets Cached on Device"**).
5. The marks transfer directly into the School Hub PC in under 2 seconds.

#### Method 3: Entering Marks Directly on Campus (On-Premise LAN)
1. Connect phone or laptop to the school Wi-Fi.
2. Open `http://192.168.1.100:3000`.
3. Enter scores directly into the local server with zero lag.

---

### 5.3 Workflow C: End-of-Term Report Card Generation

Generating report cards offline is one of the School Hub's biggest advantages:
1. Navigate to **Dashboard → Academics → Report Cards**.
2. Select Class (e.g., *Form 5 Science*) and Sequence/Term (e.g., *Term 1 Summary*).
3. Click **"Compute Statistics & Class Rankings"**:
   - The Hub calculates total marks, coefficients, subject averages, and positions instantly using local PostgreSQL queries.
4. Click **"Generate Batch PDFs"**:
   - The system generates clean, formatted, printable report cards for all 80 students in the stream in less than 10 seconds.
5. Send directly to the office printer or save as a single consolidated PDF file for bulk printing.

---

## 6. Staff Training Curriculum

Conduct these hands-on training sessions during school deployment:

### Module 1: School IT Technician / Lead Administrator (2 Hours)
- [ ] How to start and stop the School Hub using `start-school-hub.bat`.
- [ ] How to check the Hub PC's IP address (`ipconfig` in Command Prompt).
- [ ] How to verify router static DHCP reservations.
- [ ] How to initiate bi-directional cloud sync when internet is connected.
- [ ] How to run automated daily backups to a USB drive.

### Module 2: Bursars & Cashiers (1.5 Hours)
- [ ] Understanding the **Offline Finance Sync Badge** (Online vs. Queued).
- [ ] Collecting payments without internet.
- [ ] Explaining the Provisional Receipt to parents.
- [ ] Handling receipt re-prints from local history.
- [ ] End-of-day cash reconciliation report.

### Module 3: Teachers & Subject Masters (1 Hour)
- [ ] Connecting smartphone to `NSEI_SCHOOL_HUB` Wi-Fi.
- [ ] Bookmarking the local URL `http://192.168.1.100:3000` on phone home screen (PWA).
- [ ] Rapid score entry using the **Touch Cards View** on smartphones.
- [ ] Using the **"Transfer to School Hub"** button.
- [ ] Importing scores from Excel/CSV templates.

### Module 4: Heads of Department & Academic Deans (1 Hour)
- [ ] Tracking teacher submission deadlines from the Marks Grid.
- [ ] Reviewing mark distributions, class averages, and competencies.
- [ ] Submitting marks for departmental approval.
- [ ] Reopening locked mark sheets with audit justification logs.

---

## 7. Disaster Recovery, Backups & Maintenance

### 7.1 Automated Nightly Backup Script
Set up an automated Windows Task or Linux Cron Job to dump the PostgreSQL database every evening at 18:00 to an external USB flash drive:

#### Windows Batch Script (`backup-hub-db.bat`):
```bat
@echo off
set BACKUP_DIR=D:\NSEI_Backups
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Backing up School Hub Database to %BACKUP_DIR%...
docker exec nsei-hub-db pg_dump -U nsei_admin nsei_skul_hub > "%BACKUP_DIR%\hub_backup_%TIMESTAMP%.sql"
echo Backup completed successfully at %TIMESTAMP%!
```

### 7.2 Database Restoration Procedure (Hardware Replacement)
If the School Hub PC suffers hardware failure:
1. Bring any replacement PC/laptop and install Docker Desktop.
2. Copy the `nsei-skul` folder and plug in the backup USB drive.
3. Start the database:
   ```bash
   docker compose -f docker-compose.hub.yml up -d hub-db
   ```
4. Restore the latest backup SQL file:
   ```bash
   docker exec -i nsei-hub-db psql -U nsei_admin -d nsei_skul_hub < D:\NSEI_Backups\latest_backup.sql
   ```
5. Start the application:
   ```bash
   docker compose -f docker-compose.hub.yml up -d hub-app
   ```
   **Total recovery time: Under 10 minutes.**

---

## 8. Troubleshooting & Field FAQ

### FAQ 1: "Teachers' phones cannot find or open `http://192.168.1.100:3000`."
1. **Check Wi-Fi Connection**: Verify the teacher's phone is connected to the school router's Wi-Fi, not mobile data (4G).
2. **Check Server Firewall**: Windows Defender Firewall may block incoming port 3000 requests. Run this command on the Hub PC as Administrator:
   ```powershell
   netsh advfirewall firewall add rule name="NSEI School Hub" dir=in action=allow protocol=TCP localport=3000
   ```
3. **Verify Hub IP Address**: Open Command Prompt on the Hub PC, type `ipconfig`, and confirm the IPv4 address is still `192.168.1.100`.

### FAQ 2: "The top bar says 'Lease Expired (Safe Read-Only Mode)'."
1. Connect the Hub PC to the internet for 1 minute (e.g., turn on a phone's mobile hotspot and connect the Hub PC to it).
2. Navigate to **Dashboard → Settings → School Hub Infrastructure**.
3. Click **"Sync with Cloud Now"**.
4. The cloud validates the school's active subscription and automatically renews the lease for another 30 days.

### FAQ 3: "A teacher entered marks at home, but they aren't appearing on the School Hub PC."
1. Ask the teacher to open the marksheet on their phone while connected to the school Wi-Fi.
2. Look for the blue **"Hub on Wi-Fi"** badge.
3. Tap **"Transfer to School Hub"**. The phone transfers the local marks directly into the Hub database via LAN.

### FAQ 4: "Power went out suddenly while the bursar was recording a payment."
- Nsei Sukul Managements System uses PostgreSQL Write-Ahead Logging (WAL) and browser IndexedDB transactions.
- Zero transactions are corrupted. When power returns, any unsaved browser state is automatically restored from the device's local outbox.

---

## 9. Quick Technical Reference Cheat Sheet

| Service | Port / Protocol | URL / Command |
|---|---|---|
| **School Hub Web App** | TCP 3000 | `http://192.168.1.100:3000` |
| **Local PostgreSQL 16** | TCP 5432 | `localhost:5432` (DB: `nsei_skul_hub`) |
| **LAN Ping Handshake** | HTTP GET | `/api/v1/hub/lan-ping` |
| **Direct Wi-Fi Sync** | HTTP POST | `/api/v1/hub/lan-sync` |
| **Cloud Bi-Directional Sync** | HTTPS POST | `https://nsei-skul.klarifypath.com/api/v1/hub/sync` |
| **Windows Start Script** | Batch | `start-school-hub.bat` |
| **Linux Start Script** | Shell | `./start-school-hub.sh` |
| **Docker Compose Config** | Docker | `docker-compose.hub.yml` |

---
*Authored by the Nsei Sukul Engineering Team.*  
*For emergency deployment support & license activation: WhatsApp +237 682 833 601 (https://wa.me/237682833601)*
