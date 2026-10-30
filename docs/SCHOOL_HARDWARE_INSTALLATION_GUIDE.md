# Nsei Sukul Hub: Self-Hosted & Bring-Your-Own-Device (BYOD) Setup Guide

**How to Install the Sukul Hub on an Existing School Computer or on Hardware Purchased by the School**

---

## Overview

You do **not** have to purchase dedicated server hardware from us to run the **Nsei Sukul Hub**. Any school can:
1. **Use an existing computer** already in the school office (desktop or laptop running Windows, Linux, or macOS).
2. **Buy equipment themselves** from local computer markets in Cameroon (Douala, Yaoundé, Bamenda, Bafoussam) or online.

Once installed, the computer becomes the local school server. Teachers connect their phones or laptops to the school Wi-Fi and input marks or generate report cards with **zero internet connection and zero mobile data costs**.

---

## PART 1: Using an Existing School Computer (Desktop or Laptop)

If your school already has a computer in the Principal's office, Vice-Principal's office, Bursary, or computer lab, you can use it immediately.

### 1.1 Minimum Computer Requirements
Before you begin, verify that the computer meets these modest requirements:
- **Operating System:** Windows 10, Windows 11, or Linux (Ubuntu 20.04/22.04/24.04).
- **Processor (CPU):** Intel Core i3, Core i5, or AMD equivalent (at least 2.0 GHz).
- **Memory (RAM):** Minimum 4 GB (8 GB recommended so the computer stays fast while you do other work).
- **Storage:** At least 20 GB of free space (SSD preferred for faster report card generation).
- **Network:** Wi-Fi card or an Ethernet (LAN) cable port.

> [!TIP]
> **Can the computer still be used for normal daily work?**  
> **Yes.** The School Hub runs silently in the background on port `3000`. You can still type Word documents, use Excel, or print other documents while teachers connect to the Hub over Wi-Fi.

---

### 1.2 Step-by-Step Installation on an Existing Windows PC

#### Step 1: Install Node.js (One-time setup, takes 2 minutes)
1. If the computer does not already have Node.js installed, download the official **Node.js LTS** installer from [nodejs.org](https://nodejs.org/) (version 20 or 22).
2. Double-click the downloaded `.msi` file and click **Next → Next → Install**. Keep the default settings.

#### Step 2: Download or Copy the Nsei Sukul Package
1. Download the school package or copy it from a USB flash drive into a simple directory on your computer, for example:
   `C:\NseiSukul\`
2. Open the folder. You will see the launch script:
   `start-school-hub.bat`

#### Step 3: Configure Your School Identity (`.env.local`)
1. In the `C:\NseiSukul\` folder, open the `.env.local` file with Notepad (or copy `.env.hub.example` to `.env.local`).
2. Verify or update your school details:
   ```env
   NEXT_PUBLIC_HUB_MODE=true
   PORT=3000
   ```
3. Save and close the file.

#### Step 4: Start the Local School Server
1. Double-click **`start-school-hub.bat`**.
2. A black command window will open and display:
   ```text
   =====================================================================
      NSEI SUKUL MANAGEMENTS SYSTEM — SCHOOL HUB (LAN EDGE SERVER)
   =====================================================================
   Starting local school server...
   Staff can connect to this computer over the local school Wi-Fi.
   Zero internet connection required.

   [SUCCESS] School Hub is running!
   Open http://localhost:3000 on this PC.
   ```
3. Open your browser (Google Chrome, Edge, or Firefox) and visit:
   `http://localhost:3000`
4. The Nsei Sukul login page will appear. Log in with your school administrator account.

---

### 1.3 How to Make Other Teachers & Staff Connect Over Wi-Fi

To let teachers access the system from their smartphones or laptops anywhere in the staff room:

#### Step 1: Connect the Computer to the School Wi-Fi Router
- Connect your computer to the school's Wi-Fi router (either wirelessly or using an Ethernet cable).
- *Note:* The Wi-Fi router **does not need internet**. It only creates a local wireless bridge.

#### Step 2: Find Your Computer's Local IP Address
1. On the host computer, press the **Windows Key + R**, type `cmd`, and press **Enter**.
2. Type `ipconfig` and press **Enter**.
3. Look for the line that says **IPv4 Address**. It will look like this:
   `IPv4 Address. . . . . . . . . . . : 192.168.1.105`
4. Your school's local address is that number followed by `:3000`:
   `http://192.168.1.105:3000`

#### Step 3: Tell Teachers to Connect
1. Ask teachers to connect their phone or laptop to the school's Wi-Fi network (e.g., `GBHS_Staff_WiFi`).
2. Have them open their phone browser (Chrome, Safari, or Opera) and type:
   `http://192.168.1.105:3000`
3. The Nsei Sukul login portal will immediately appear on their phone!
4. Teachers log in with their teacher accounts, select their assigned class, and enter marks.
5. All marks entered go directly into your host computer without consuming a single franc of MTN/Orange airtime.

---

### 1.4 Setting the School Hub to Start Automatically on Windows Startup
To make sure the School Hub starts automatically whenever the computer is turned on in the morning (so no one has to remember to double-click anything):

1. Press **Windows Key + R**, type `shell:startup`, and press **Enter**. A folder window will open.
2. Right-click on `start-school-hub.bat` in `C:\NseiSukul\` and select **Create Shortcut**.
3. Drag or paste this shortcut into the `Startup` folder you opened in Step 1.
4. **Done!** Whenever the computer boots up, the School Hub will automatically start serving marks to teachers.

---

## PART 2: Buying Your Own Physical Equipment (Procurement Guide)

If your school prefers to buy dedicated, brand-new hardware on the open market, use this recommended shopping list.

### 2.1 Recommended Equipment Shopping List

| Item | What to Ask For at the Computer Shop | Estimated Price in Cameroon (FCFA) | Why It Matters |
|---|---|---|---|
| **Primary Hub Computer** *(Option A: Best Choice)* | **Intel N100 Mini-PC** (8GB or 16GB RAM, 256GB or 512GB SSD, Windows 11 Pro). Brands: Beelink, GMKtec, Geekom, or HP ProDesk Mini. | 110,000 – 160,000 FCFA | Consumes only 15W of electricity. Silent, small, and can run for 8 hours on a small inverter. |
| **Primary Hub Computer** *(Option B: Laptop Alternative)* | **Refurbished Laptop** (Core i3 or i5, 8GB RAM, 256GB SSD) with a good working battery. Brands: HP EliteBook, Dell Latitude, Lenovo ThinkPad. | 95,000 – 140,000 FCFA | The built-in laptop battery acts as an automatic UPS during power outages. |
| **Wi-Fi Router (Access Point)** | **Dual-Band Gigabit Wi-Fi Router** (TP-Link Archer C6/C80, Tenda AC10, or Mercusys AC1200). | 18,000 – 28,000 FCFA | Handles 60–80 teachers connected simultaneously without dropping connections. |
| **Power Backup (UPS)** | **650VA or 1000VA Line-Interactive UPS** (Mercury, APC, or Kstar). | 25,000 – 40,000 FCFA | Protects the computer from power surges and keeps it running during load shedding. |
| **Router Mini-UPS (Optional)** | **12V DC Mini-UPS for Router** (e.g. SKE or WGP mini-UPS). | 12,000 – 18,000 FCFA | Keeps the Wi-Fi router broadcasting for 6 to 10 hours even when NEPA/ENEO is off. |
| **LAN Cable** | **Cat6 Ethernet Patch Cord (2 meters to 5 meters)** | 1,500 – 3,000 FCFA | Direct high-speed connection between the computer and the router. |

**Total Estimated Setup Cost:** ~**160,000 to 230,000 FCFA** (One-time investment that serves the school for 5+ years).

---

### 2.2 Where to Purchase in Cameroon
- **Douala:** Rue du Commerce (Akwa), Boulevard de la Liberté, or computer malls near Ancien Dalip.
- **Yaoundé:** Avenue Kennedy, Bastos, or shopping centers around Poste Centrale.
- **Bamenda:** Commercial Avenue, City Chemist roundabout, or Food Market computer vendors.
- **Online:** Jumia Cameroon or imported via freight forwarders.

---

### 2.3 Setting Up Your Brand-New Hardware

#### Step 1: Physical Placement
1. Place the Mini-PC or laptop in a secure, well-ventilated office (e.g. Principal's office, Academic Dean's office, or Bursary).
2. Connect the computer and the Wi-Fi router into the battery backup (UPS).
3. Connect the computer to one of the **LAN ports (yellow ports)** on the Wi-Fi router using the Cat6 Ethernet cable.

#### Step 2: Set a Fixed IP on Your Router (Static Lease)
To prevent the computer's address from changing when the router restarts:
1. Open your browser and go to the router setup page (usually `192.168.1.1` or `192.168.0.1` printed under the router).
2. Enter the router admin password.
3. Go to **Network / DHCP / Address Reservation**.
4. Select the School Hub computer and click **Reserve / Bind**. Set its fixed address to:
   `192.168.1.100`
5. Now, teachers can always bookmark the same address on their phones:
   `http://192.168.1.100:3000`

#### Step 3: Install the Nsei Sukul Software
Follow the same 4 steps outlined in **Part 1.2** above:
1. Install Node.js LTS.
2. Paste the `NseiSukul` folder onto the computer.
3. Double-click `start-school-hub.bat`.
4. Add the shortcut to `shell:startup`.

---

## PART 3: Daily Campus Routine for Staff & Bursars

### Morning Routine:
1. Turn on the UPS and the School Hub computer (or leave it on 24/7).
2. The School Hub launches automatically.
3. Teachers arrive on campus, connect to the school Wi-Fi on their phones, and enter continuous assessment marks.
4. The Bursar records fee payments and prints official FCFA receipts instantly.

### When Internet Is Available (Syncing to the Cloud):
1. Whenever the school connects to internet (even if the Principal turns on an MTN/Orange 4G MiFi or mobile hotspot for just 5 minutes), the Hub automatically pushes all new marks and receipts to the central cloud.
2. If internet is down for 3 weeks, **nothing stops**. All operations proceed normally on campus.

---

## PART 4: Troubleshooting Common Questions

| Problem | Cause | Solution |
|---|---|---|
| **Teacher phone says "Site can't be reached"** | The phone is connected to mobile data instead of the school Wi-Fi. | In phone settings, turn on Wi-Fi and connect to the school's staff Wi-Fi network. Turn off mobile data temporarily if phone tries to use 4G. |
| **The computer's IP address changed** | The router was restarted without DHCP reservation. | Check `ipconfig` in Command Prompt to see the new IP address, or configure **Address Reservation** on the router as shown in Section 2.3. |
| **Windows Firewall blocks incoming teacher connections** | Windows Defender asks whether to allow Node.js on private networks. | Click **"Allow Access"** on Private Networks when prompted, or go to Windows Firewall → Allow an app → Check **Node.js** for Private Networks. |
| **Sudden electricity blackout** | Normal power cut in Cameroon. | With a small UPS or laptop battery, the Hub keeps running uninterrupted. When electricity returns, everything continues seamlessly. |

---

## Technical Support & Hotline
For assistance configuring your router, setting static IPs, or obtaining pre-packaged installation files:
- **WhatsApp Support:** `+237 682 833 601`
- **Email:** `contact@nseisukul.com`
- **On-Site Installation Support:** Available in Northwest, Southwest, Littoral, and Centre regions.
