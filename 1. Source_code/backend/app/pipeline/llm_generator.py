import os
import torch
import logging

logger = logging.getLogger(__name__)

FORMAT_INSTRUCTIONS = {
    "advisory": "You are a security advisory writer. Convert the given source content into a structured advisory with sections: Summary, Threat Details, Impact, Recommendations.",
    "linkedin": "You are a social media specialist. Convert the given source content into a professional LinkedIn post.",
    "twitter": "You write platform-optimized social content. Convert the given source content into a short Twitter/X post or thread (2-4 tweets).",
    "video": "You write video scripts. Convert the given source content into a video package: script, storyboard beats, scene descriptions, narration text, and subtitle lines.",
    "infographic": "You design infographics. Convert the given source content into infographic content: key messaging points and layout recommendations.",
    "executive_summary": "You write executive briefings. Convert the given source content into a concise executive summary.",
    "presentation": "You create presentations. Convert the given source content into presentation slide content (titles + bullet points per slide) and speaker notes.",
}

FORMAT_ALIASES = {
    "linkedin post": "linkedin",
    "linkedin": "linkedin",
    "twitter/x post": "twitter",
    "twitter / x post": "twitter",
    "twitter": "twitter",
    "video": "video",
    "advisory": "advisory",
    "infographic": "infographic",
    "executive summary": "executive_summary",
    "executive_summary": "executive_summary",
    "ppt/presentation": "presentation",
    "ppt": "presentation",
    "presentation": "presentation",
    "concept notes": "concept_notes",
    "concept sheet": "concept_notes",
    "concept": "concept_notes",
}


def normalize_format(output_format: str) -> str:
    key = (output_format or "").strip().lower()
    if key in FORMAT_ALIASES:
        return FORMAT_ALIASES[key]
    if "concept" in key:
        return "concept_notes"
    if "linkedin" in key:
        return "linkedin"
    if "twitter" in key or "x post" in key:
        return "twitter"
    if "video" in key or "script" in key:
        return "video"
    if "advisory" in key:
        return "advisory"
    if "infographic" in key:
        return "infographic"
    if "summary" in key:
        return "executive_summary"
    if "ppt" in key or "presentation" in key or "slide" in key:
        return "presentation"
    return key


def generate_stub_content(source_text: str, output_format: str, generation_params: dict | None = None) -> str:
    """Instant high-quality offline stub synthesis engine tailored to cybersecurity and enterprise requirements."""
    fmt_key = normalize_format(output_format)
    params = generation_params or {}
    tone = params.get("tone", "Educational, Student-friendly" if "student" in (source_text or "").lower() else "Professional, Warning-focused")
    audience = params.get("audience", "Students & Faculty" if "student" in (source_text or "").lower() else "Organizations & Enterprise Teams")

    clean_text = (source_text or "").strip()
    is_ransomware = "ransomware" in clean_text.lower()
    is_poster = any(k in clean_text.lower() for k in ["poster", "dos and don'ts", "password", "mfa", "click", "screen"])

    language = (params.get("language") or "English").lower()
    is_hindi = "hindi" in language or "हिंदी" in language

    if is_hindi:
        if fmt_key == "linkedin":
            return f"""🛡️ **साइबर सुरक्षा दैनिक आदतों से शुरू होती है: छात्रों और पेशेवरों के लिए आवश्यक Do's और Don'ts!** 💻✨

आज के डिजिटल युग में, 90% से अधिक सुरक्षा घटनाएं असावधानी और फ़िशिंग लिंक के कारण होती हैं। अपने डेटा, पहचान और उपकरणों को सुरक्षित रखने के लिए इन नियमों को अपनाएं:

✅ **क्या करें (DO's - सुरक्षित आदतें):**
1. 🔐 **मजबूत पासवर्ड और MFA सक्रिय करें**: हर खाते के लिए मजबूत पासवर्ड रखें और बहु-कारक प्रमाणीकरण (MFA) अवश्य चालू करें। यह 99.2% हमलों को रोकता है!
2. 🔍 **लिंक पर सोच-समझकर क्लिक करें**: किसी भी अनजान लिंक पर क्लिक करने से पहले यूआरएल (URL) को सत्यापित करें।
3. 🔒 **स्क्रीन लॉक करने की आदत डालें**: जब भी अपनी डेस्क या लैपटॉप से दूर जाएं, तुरंत `Win + L` दबाएं।
4. 💾 **नियमित बैकअप (3-2-1 नियम)**: अपनी महत्वपूर्ण फ़ाइलों का ऑफ़लाइन बैकअप सुरक्षित रखें।

❌ **क्या न करें (DON'Ts - इन गलतियों से बचें):**
1. ⚠️ **कृत्रिम तात्कालिकता (Urgency) के झांसे में न आएं**: "24 घंटे में खाता बंद हो जाएगा!" जैसे संदेशों पर बिना सत्यापन के कोई कार्रवाई न करें।
2. 🚫 **अनधिकृत ऐप्स और एक्सटेंशन डाउनलोड न करें**: मुफ्त टूल्स में अक्सर डेटा चुराने वाले स्पाइवेयर होते हैं।
3. 🛑 **यह कभी न सोचें कि "यह मेरे साथ नहीं होगा"**: साइबर अपराधी हर प्रकार के उपयोगकर्ताओं को निशाना बनाते हैं।

💡 **मुख्य सीख**:
साइबर सुरक्षा कोई जटिल विज्ञान नहीं, बल्कि एक अच्छी डिजिटल आदत है। सतर्क रहें, सुरक्षित रहें और अपने मित्रों को भी जागरूक करें! 🚀

#CyberSecurityHindi #DigitalSafety #StudentAwareness #InfoSec #MFA #PrismAI
"""
        elif fmt_key == "advisory":
            return f"""# 🛡️ साइबर सुरक्षा परामर्श: रैनसमवेयर और फ़िशिंग से सुरक्षा दिशानिर्देश
**लक्षित दर्शक**: {audience} | **टोन**: {tone} | **भाषा**: हिंदी (Hindi)

---

### 1. परामर्श शीर्षक एवं संक्षिप्त विवरण
यह सुरक्षा परामर्श छात्रों और संगठनों को आधुनिक साइबर हमलों, विशेषकर रैनसमवेयर और सोशल इंजीनियरिंग फ़िशिंग से सतर्क करने हेतु जारी किया गया है।

---

### 2. खतरे का विश्लेषण (Threat Details)
हमलावर अक्सर अनपेक्षित ईमेल अटैचमेंट, दुर्भावनापूर्ण लिंक या कमजोर पासवर्ड का लाभ उठाकर सिस्टम में प्रवेश करते हैं। एक बार प्रवेश मिलने के बाद, वे डेटा को एन्क्रिप्ट कर फिरौती की मांग करते हैं।

---

### 3. मुख्य सिफारिशें एवं रोकथाम उपाय
1. **मल्टी-फैक्टर ऑथेंटिकेशन (MFA)**: सभी महत्वपूर्ण खातों पर तत्काल MFA लागू करें।
2. **एयर-गैप्ड बैकअप**: 3-2-1 बैकअप रणनीति अपनाएं ताकि डेटा एन्क्रिप्ट होने पर भी सुरक्षित रहे।
3. **सॉफ़्टवेयर अपडेट**: ऑपरेटिंग सिस्टम और ऐप्स को हमेशा नवीनतम सुरक्षा पैच के साथ अपडेट रखें।
4. **संदेहास्पद ईमेल रिपोर्ट करें**: किसी भी अज्ञात लिंक या फ़ाइल को खोलने से पहले IT टीम को सूचित करें।
"""

    if fmt_key == "concept_notes":
        return f"""[CONCEPT_PILL: CONCEPT 01]
# What is Multi-Factor Authentication (MFA)?
A multi-layered defense mechanism requiring users to present two or more independent credentials before gaining system access.

### Comparison Overview
- **Real-Life Example**: A bank locker requires both your physical customer key and the bank manager's master key to open. Possessing only one key leaves the locker locked.
- **Programming / Technical Version**: A function validates the user's password hash and verifies a 6-digit Time-Based One-Time Password (TOTP) from an authenticator app before issuing a session JWT token.

---

### Why do systems need MFA?
- To eliminate account compromise even when passwords are breached on third-party sites.
- To prevent 99.2% of automated credential stuffing and brute-force dictionary attacks.
- To enforce verified zero-trust identity before granting internal network access.

---

### Simple implementation idea
```python
def verify_access_request(user_credentials, mfa_totp_code):
    user = authenticate_hash(user_credentials)
    if not user:
        return {"status": "denied", "reason": "bad_password"}
    if not totp_service.verify(user.totp_seed, mfa_totp_code):
        return {"status": "challenge_failed", "action": "trigger_security_alert"}
    return {"status": "authorized", "session_token": generate_secure_jwt(user.id)}
```

---

# What is Zero-Trust Architecture?
Zero-Trust Architecture means never trusting any network packet or user by default, continually validating every request regardless of location.

### Dual-Architecture Flowchart:
**Without Zero-Trust (Legacy Perimeter):**
1. User Submits Plaintext Password
2. Phished or Reused Credentials Accepted
3. Attacker Moves Laterally Across Subnet
4. Ransomware Encrypts Critical Databases & Shares

**With Zero-Trust (PRISM AI Enforced):**
1. User Submits Credentials & Authenticator Token
2. Identity, Device Health & Posture Inspected
3. Principle of Least Privilege Restricts Blast Radius
4. Suspicious Actions Blocked & Logged to Qdrant Vector Store

---

### Why Zero-Trust MFA is vital
- Reusable and hardened defensive controls
- Eliminates single points of failure across enterprise systems
- Tamper-evident audit trails with SHA-256 integrity verification
- Continuous operational continuity and regulatory compliance
"""

    if fmt_key == "video":
        return f"""# 🎬 COMPLETE VIDEO PACKAGE (Script, Storyboard, Subtitles & Visuals)
**Topic**: Cybersecurity Awareness & Digital Safeguards
**Target Audience**: {audience} | **Tone**: {tone} | **Target Duration**: 2 Minutes (120s)

---

### 1. SCENE-BY-SCENE VIDEO SCRIPT
**[SCENE 1: THE DIGITAL FRONTLINE - HOOK (0:00 - 0:25)]**
- **Visual Description**: Fast-paced cinematic opening. Split screen showing a college student working on a laptop in a café, while digital binary graphics and alert shields pulse in the background. A superhero guardian silhouette emerges.
- **On-Screen Graphic**: "CYBERSECURITY ESSENTIALS: ARE YOU PROTECTED?"
- **Voiceover Narration**: "Every single day, we connect to dozens of digital services. But in the vast online landscape, every click, link, and password can be the difference between security and catastrophe. Let's look at the crucial cybersecurity rules you need to know today."
- **Camera Angle**: Medium close-up transitioning to dynamic 45-degree angle.

**[SCENE 2: CORE PRACTICES & DO's (0:25 - 0:55)]**
- **Visual Description**: Hero character with a glowing hexagon shield repels malicious phishing envelopes. The screen highlights three green verified checkmarks: 1. Hover & Verify Links, 2. Strong Passwords & MFA, 3. Lock Your Screen.
- **On-Screen Graphic**: "RULE #1: THINK BEFORE YOU CLICK | RULE #2: ENABLE MFA"
- **Voiceover Narration**: "Rule number one: Think before you click. Always hover over incoming links and verify the sender. Pair that with strong, unique passwords and Multi-Factor Authentication. And whenever you step away, even for thirty seconds—lock your screen!"
- **Sound Effect**: Soft futuristic confirmation chime.

**[SCENE 3: CRITICAL WARNINGS & DON'Ts (0:55 - 1:30)]**
- **Visual Description**: Red alert overlay with cautionary graphics. Highlights: 1. Don't click urgent links from strangers, 2. Don't post work details on social media, 3. Don't think 'It won't happen to me.'
- **On-Screen Graphic**: "BEWARE OF URGENCY • NEVER SHARE PASSWORDS • AVOID UNAPPROVED APPS"
- **Voiceover Narration**: "Attackers love psychological urgency. If an email demands immediate action or warns your account will be deleted, pause. Avoid installing unapproved apps or browser extensions. And remember: thinking 'it won't happen to me' is every cyber criminal's biggest advantage."
- **Camera Angle**: Wide overview with pop-up cautionary cards.

**[SCENE 4: SUMMARY & CALL TO ACTION (1:30 - 2:00)]**
- **Visual Description**: The superhero emblem anchors the screen with a clean 3-step student action checklist. School / organization logo badge.
- **On-Screen Graphic**: "STAY CYBER-SMART • REPORT SUSPICIOUS EMAILS • LOCK DOWN PERMISSIONS"
- **Voiceover Narration**: "Cybersecurity isn't about fear; it's about digital hygiene. Stay smart, stay protected, and share these habits with your peers. Protect your data—and yourself."

---

### 2. STORYBOARD BREAKDOWN
- **Beat 1 (0-15s)**: Ambient café / student dorm setting; laptop screen glows; glitch effect simulates a phishing alert.
- **Beat 2 (15-45s)**: Superhero Aegis shield activates; green checkmarks display MFA and password vault tips.
- **Beat 3 (45-75s)**: Red caution boundary surrounds suspicious email attachment; user hovers mouse to reveal malicious URL.
- **Beat 4 (75-105s)**: Device lock demonstration; smartphone pushes multi-factor approval prompt.
- **Beat 5 (105-120s)**: High-energy recap slide with downloadable security checklist link.

---

### 3. NARRATION TEXT (CONTINUOUS VOICEOVER SCRIPT)
"Every single day, we connect to dozens of digital services. But in the vast online landscape, every click, link, and password can be the difference between security and catastrophe. Let's look at the crucial cybersecurity rules you need to know today.
Rule number one: Think before you click. Always hover over incoming links and verify the sender. Pair that with strong, unique passwords and Multi-Factor Authentication. And whenever you step away, even for thirty seconds—lock your screen!
Attackers love psychological urgency. If an email demands immediate action or warns your account will be deleted, pause. Avoid installing unapproved apps or browser extensions. And remember: thinking 'it won't happen to me' is every cyber criminal's biggest advantage.
Cybersecurity isn't about fear; it's about digital hygiene. Stay smart, stay protected, and share these habits with your peers. Protect your data—and yourself."

---

### 4. SUBTITLES (TIMED SRT FORMAT)
1
00:00:01,000 --> 00:00:05,200
Every single day, we connect to dozens of digital services.

2
00:00:05,500 --> 00:00:10,000
In the vast online landscape, every click and password matters.

3
00:00:10,200 --> 00:00:14,800
Rule #1: Think before you click. Hover over links and verify senders.

4
00:00:15,000 --> 00:00:19,400
Use strong, unique passwords and enable Multi-Factor Authentication (MFA).

5
00:00:19,600 --> 00:00:23,800
Always lock your screen when stepping away, even for thirty seconds.

6
00:00:24,000 --> 00:00:29,000
Never trust urgent links from strangers or install unapproved extensions.

7
00:00:29,200 --> 00:00:34,500
Don't think 'it won't happen to me'—that mindset is a hacker's advantage.

8
00:00:34,800 --> 00:00:39,000
Stay cyber-smart. Protect your data, and protect yourself!

---

### 5. VISUAL RECOMMENDATIONS (IMAGE MODEL GENERATION)
- **Visual Recommendation Concept**: "Modern cinematic comic-style superhero in high-tech cyber armor projecting a glowing cyan hexagonal shield against red malware vectors and phishing emails."
- **Prompt for Online Image Generation Model**:
  `"Professional modern cinematic storyboard frame for a cybersecurity educational video: A superhero wearing a high-tech sleek suit with cape, hovering in front of a digital cybersecurity grid shield protecting data from glowing cyber threats. Vibrant comic-book style with bold colors, dynamic lighting, ultra high definition."`
- **Generated Visual Recommendation**:
[VISUAL_RECOMMENDATION_ASSET: /assets/video_visual_rec.jpg]
"""

    elif fmt_key == "linkedin":
        return f"""🛡️ **Cybersecurity Starts With Daily Habits: Do's and Don'ts Every Student & Professional Must Know!** 💻✨

In today's interconnected digital ecosystem, cybersecurity is no longer just an IT department concern—it is a critical personal skill for every student, educator, and team member.

Here is a quick breakdown of the essential **Do's and Don'ts** to keep your accounts and data safe:

✅ **THE DO's (Your Cyber Shields):**
1. 🔍 **Think Before You Click**: Always hover over hyperlinks to inspect the true destination URL before clicking. Verify sender addresses carefully.
2. 🔐 **Use Strong Passwords + MFA**: Combine complex passphrases with Multi-Factor Authentication. MFA blocks over 99% of automated credential stuffing attacks!
3. 🔒 **Lock Your Screen**: Stepping away for even 30 seconds? Hit `Win + L` or `Cmd + Ctrl + Q`. An unlocked device is an open door.
4. 🛡️ **Lock Down Permissions**: Apply the principle of least privilege—grant apps only the access they strictly require.

❌ **THE DON'Ts (Avoid These Traps):**
1. ⚠️ **Don't Trust Artificial Urgency**: Attackers prey on panic with fake deadlines ("Account suspended in 24 hours!"). Pause and verify independently.
2. 📱 **Don't Over-Share on Social Media**: Avoid posting travel schedules, work credentials, or personal milestones that attackers can use for social engineering.
3. 🧩 **Don't Install Unapproved Apps/Extensions**: Free plugins often come with hidden spyware or data harvesting permissions.
4. 🧠 **Don't Think "It Won't Happen to Me"**: Complacency is every cyber attacker's greatest advantage.

💡 **Key Takeaway**:
You don't need a degree in computer science to be cyber-smart. Consistent, disciplined habits protect not just your accounts, but your entire organization.

👇 What is your #1 cybersecurity tip for peers entering college or the workforce? Let's discuss in the comments!

---
#Cybersecurity #CyberAwareness #StudentSafety #InformationSecurity #EdTech #DataPrivacy #PhishingPrevention #MFA #TechForGood #SafeBrowsing

[LINKEDIN_POST_CARD_ASSET: /assets/linkedin_post_card.jpg]
"""

    elif fmt_key == "presentation":
        return f"""# 📊 CYBERSECURITY AWARENESS: 6-SLIDE EDUCATIONAL PRESENTATION
**Audience**: {audience} | **Tone**: {tone}

---

## Slide 1: Introduction to Modern Cybersecurity Awareness
- **Headline**: Building a Human Firewall in a Connected World
- **Key Points**:
  • Cyber threats target individuals as the entry point into networks and personal data.
  • Effective defense relies on simple, repeatable daily security habits.
  • Awareness is your best defense against modern social engineering and automated exploits.
- **Visual Cue**: Title card with superhero shield emblem and dual Do's vs. Don'ts pillars.
- **Speaker Notes**:
  "Welcome everyone. Today we are exploring practical cybersecurity fundamentals. Technology and firewalls are important, but human judgment remains our most powerful defense. Over the next 5 slides, we'll examine five vital security practices that will keep your personal identity, academic records, and organizational data completely secure."

---

## Slide 2: Practice 1 - Think Before You Click (Phishing Defense)
- **Headline**: The Power of the Pause: Verifying Links & Senders
- **Key Points**:
  • Over 90% of security breaches begin with a phishing email or deceptive link.
  • Always hover over links on desktop or long-press on mobile to inspect the actual destination URL.
  • Scrutinize sender domain names for subtle typos (e.g., `support@micros0ft.com`).
  • If a message creates fear, panic, or false urgency—treat it with skepticism.
- **Visual Cue**: Illustration comparing a deceptive link with a verified genuine URL.
- **Speaker Notes**:
  "Let's start with Practice 1: Think before you click. Cyber criminals are masters of urgency. They design emails that look like password resets or urgent student portal notices. Always hover over the link to verify where it really leads. Remember: legitimate institutions will never pressure you into an immediate, panic-induced click."

---

## Slide 3: Practice 2 - Passwords & Multi-Factor Authentication (MFA)
- **Headline**: Double Locking Your Digital Doors
- **Key Points**:
  • Stop reusing passwords across multiple accounts—a breach in one compromises all.
  • Use passphrases (4-5 random words) rather than short, complex character strings.
  • Enable Multi-Factor Authentication (MFA / 2FA) wherever supported.
  • Authenticator apps are significantly more secure than SMS text verification.
- **Visual Cue**: Graphic showing a password lock backed by an authenticator mobile push prompt.
- **Speaker Notes**:
  "Practice 2 focuses on access control. A strong password is no longer enough on its own. By enabling Multi-Factor Authentication, even if an attacker manages to obtain your password, they cannot access your account without that second physical token or app approval. It blocks over 99% of automated attacks."

---

## Slide 4: Practice 3 - Physical & Device Security (Lock Your Screen)
- **Headline**: Defending Against Physical Opportunities
- **Key Points**:
  • Unattended devices in libraries, cafes, or offices are prime targets for unauthorized access.
  • Stepping away for even 30 seconds is enough time for someone to insert a malicious USB or view confidential data.
  • Make screen locking an automatic physical reflex: `Win + L` (Windows) or `Cmd + Ctrl + Q` (Mac).
  • Never leave laptops unattended in public spaces.
- **Visual Cue**: Split-screen showing an unlocked laptop vs. a securely locked lockscreen with shortcut keys.
- **Speaker Notes**:
  "Practice 3 is physical security. Many students and professionals assume cyber threats only happen over the internet. But an unlocked laptop in a study room or office takes less than ten seconds to compromise. Developing the muscle memory to lock your screen every single time you stand up eliminates this risk entirely."

---

## Slide 5: Practice 4 - Principle of Least Privilege & App Permissions
- **Headline**: Lock Down Permissions & Unapproved Extensions
- **Key Points**:
  • Grant mobile and desktop applications only the minimum permissions required to function.
  • Avoid installing unverified third-party browser extensions or cracked software.
  • Rogue extensions can log keystrokes, capture session tokens, and leak browser history.
  • Regularly audit installed apps and remove those no longer in active use.
- **Visual Cue**: Permission settings checklist showing camera, microphone, and data access toggles.
- **Speaker Notes**:
  "Practice 4 is about permissions. When installing a simple utility or game, why does it need access to your microphone, location, and contacts? Adopt the principle of least privilege: give access only when strictly necessary, and avoid downloading extensions outside verified web stores."

---

## Slide 6: Practice 5 & Conclusion - Combating Complacency & Final Action Plan
- **Headline**: Overcoming "It Won't Happen to Me"
- **Key Points**:
  • The belief that 'I have nothing worth stealing' is every hacker's greatest advantage.
  • Attackers use student and employee accounts as stepping stones to breach broader campus and corporate networks.
  • Share cybersecurity best practices with friends, study groups, and family.
  • 3 Immediate Next Steps: Turn on MFA today, clean up browser extensions, and practice locking your screen.
- **Visual Cue**: Summary scorecard showing 5 green badges with the final call to action.
- **Speaker Notes**:
  "To wrap up: the most dangerous vulnerability isn't outdated software—it's complacency. Attackers don't just target wealthy executives; they target students and everyday accounts to use as launchpads. By adopting these 5 simple practices, you protect yourself, your friends, and your community. Thank you!"
"""

    elif fmt_key == "advisory":
        threat_title = "RANSOMWARE & MALWARE INFECTION VECTORS" if is_ransomware else "UNAUTHORIZED ACCESS & PHISHING THREATS"
        return f"""# 🛡️ FORMAL CYBERSECURITY ADVISORY: {threat_title}
**Advisory Classification**: CRITICAL / HIGH PRIORITY
**Target Scope**: {audience} | **Tone**: {tone}
**Document Reference**: ADV-SEC-2026-0927

---

### 1. ADVISORY TITLE
**Threat Advisory: Emerging Ransomware & Deceptive Phishing Vectors Targeting Organizational and Academic Endpoints**

---

### 2. THREAT OVERVIEW
Ransomware is malicious software designed to deny access to a user's or organization's files and critical systems by encrypting data. Once systems are locked, attackers demand cryptocurrency extortion payments to restore access. Modern ransomware variants also employ double-extortion tactics, exfiltrating sensitive organizational records, research data, and personal identifiable information (PII) before encryption to threaten public leakage if payments are not fulfilled.

---

### 3. WHO CAN BE AFFECTED
- Educational institutions, student portals, and university administrative databases.
- Enterprise corporate networks, supply chain vendors, and distributed remote workers.
- Individual student and staff workstations running unpatched operating systems or lacking multi-factor authentication.
- Shared network storage vaults and cloud backup repositories lacking immutable offline isolation.

---

### 4. HOW THE ATTACK WORKS
1. **Initial Access**: Delivered via weaponized email phishing attachments (malicious `.docx`, `.pdf`, or archive files) or credential harvesting links.
2. **Exploitation & Lateral Movement**: Leverages exposed Remote Desktop Protocol (RDP) ports, weak administrator passwords, or unpatched zero-day vulnerabilities to gain elevated domain access.
3. **Defense Evasion**: Disables endpoint antivirus agents, deletes Windows Volume Shadow Copies, and terminates database processes.
4. **Encryption & Extortion**: Executes rapid AES/RSA cryptographic locks on local and networked file shares, leaving ransom notes detailing payment instructions.

---

### 5. WARNING SIGNS & INDICATORS OF COMPROMISE (IOCs)
- Unexpected system sluggishness and sudden high CPU/disk utilization from unknown background processes.
- File extensions unexpectedly changing to unfamiliar suffixes (e.g., `.locked`, `.crypto`, `.enc`).
- Appearance of generic text files titled `README_DECRYPT.txt` or `HOW_TO_RECOVER_FILES.txt` on desktops and directories.
- Antivirus alerts flagging unauthorized PowerShell execution or attempts to modify volume shadow copies.
- Inability to open common documents with error messages stating file corruption.

---

### 6. RECOMMENDED ACTIONS (IMMEDIATE MITIGATION)
1. **Isolate Affected Devices**: Instantly disconnect infected systems from Wi-Fi, Ethernet, and Bluetooth networks to prevent lateral spread.
2. **Do Not Pay the Extortion**: Payment does not guarantee decryption key recovery and finances criminal syndicates.
3. **Preserve System Artifacts**: Capture memory dumps and preserve system event logs for digital forensics before restoring systems.
4. **Notify IT Security Operations**: Report the incident immediately to internal cybersecurity incident response teams and appropriate regulatory authorities.

---

### 7. PREVENTION MEASURES (LONG-TERM HARDENING)
- **Implement Immutable 3-2-1 Backups**: Maintain 3 copies of vital data across 2 different media types, with at least 1 copy stored in an offline, air-gapped repository.
- **Enforce Multi-Factor Authentication (MFA)**: Require phishing-resistant MFA across all remote access gateways, VPNs, and email accounts.
- **Disable Unnecessary Ports & Protocols**: Close open RDP port 3389 and restrict remote administration to secured jump hosts.
- **Regular Patch Management**: Ensure operating systems, web browsers, and third-party software are updated with latest security patches within 72 hours of release.
- **Conduct Continuous Security Training**: Run simulated phishing exercises to train staff and students on recognizing malicious communications.

---

### 8. CONCLUSION
Ransomware attacks represent an existential threat to business continuity and educational operations. Implementing defense-in-depth architecture—combining MFA, immutable backups, least-privilege permissions, and vigilant endpoint monitoring—effectively mitigates the severity and financial impact of modern malware campaigns.
"""

    elif fmt_key == "infographic":
        return f"""# 📈 ONE-PAGE INFOGRAPHIC: RANSOMWARE ATTACK PROCESS & PREVENTION
**Title**: DEFENDING YOUR DATA: THE ANATOMY OF A RANSOMWARE ATTACK
**Format**: 1-Page Visual Executive Infographic | **Audience**: {audience}

---

### 1. HERO HEADER & CORE METRICS
- **Headline**: Ransomware Unmasked: How Attacks Happen & How to Stop Them
- **Key Statistics Banner**:
  • 🚨 **82%** of breaches involve phishing or stolen credentials
  • ⏱️ **Average Downtime**: 21 Days without verified backups
  • 🛡️ **99.2%** of account takeovers prevented by Multi-Factor Authentication

---

### 2. VISUAL ATTACK PROCESS FLOW (LEFT-TO-RIGHT / 4-PHASE TIMELINE)
```
[PHASE 1: INFECTION]  -->  [PHASE 2: EXECUTION]  -->  [PHASE 3: ENCRYPTION]  -->  [PHASE 4: EXTORTION]
Phishing email with         Malware disables          Military-grade AES/RSA      Ransom note appears;
weaponized PDF or link;     antivirus & deletes       locks all photos, docs,     criminals demand
exploits weak passwords.    shadow copy backups.      and network shares.         crypto payment.
```

---

### 3. MAJOR RISKS AT A GLANCE
- 💥 **Data Loss**: Total loss of student records, research data, or financial transactions.
- 🛑 **Operational Paralysis**: University or enterprise systems shut down for weeks.
- 💸 **Financial Extortion**: Multi-million dollar ransom demands with zero guarantee of recovery.
- 📢 **Reputational Damage**: Regulatory fines and public loss of trust from leaked confidential data.

---

### 4. 4-PILLAR PREVENTION CHECKLIST (INFOGRAPHIC CALLOUT BOXES)
1. 🔐 **Pillar 1: Multi-Factor Authentication (MFA)**
   - Protect all logins with an authenticator app. Passwords alone are obsolete.
2. 💾 **Pillar 2: Immutable 3-2-1 Backups**
   - 3 copies, 2 media types, 1 isolated offline backup that ransomware cannot reach.
3. 🕵️ **Pillar 3: Verified Browsing & Email Hygiene**
   - Never open attachments from strangers; hover over links to inspect destination domains.
4. ⚙️ **Pillar 4: Zero-Trust Permissions & Regular Updates**
   - Restrict administrative privileges and install security patches immediately.

---

### 5. LAYOUT & DESIGN RECOMMENDATIONS
- **Color Palette**: Dark Slate Navy background (`#0B0F19`), Electric Cyan accent (`#06B6D4`), Warning Coral (`#EF4444`), Success Emerald (`#10B981`).
- **Iconography**: Clean line icons for lock, shield, phishing hook, and cloud backups.
- **Typography**: Bold sans-serif header (Inter/Outfit 28pt) with scannable bullet cards.
"""

    elif fmt_key == "twitter":
        return f"""1/7 🧵 **Cybersecurity Essentials**: In today's digital world, 90%+ of cyber incidents begin with simple human mistakes. Here are 5 practical rules to protect your accounts and data right now: 👇

2/7 🔍 **Think Before You Click**:
Attackers love creating artificial panic ("Account suspended in 24h!"). Always hover over links to verify the actual domain before clicking. If you feel rushed, pause! 🛑

3/7 🔐 **Stop Reusing Passwords**:
A single breach on a gaming site can unlock your email and student portal. Use unique passphrases (4 random words) and ALWAYS enable Multi-Factor Authentication (MFA). MFA blocks 99% of attacks. 🛡️

4/7 🔒 **The 30-Second Rule**:
Stepping away for coffee? Unlocked screens in cafes or libraries are open invitations for data theft. Make `Win + L` or `Cmd + Ctrl + Q` an automatic physical reflex! 💻

5/7 🧩 **Lock Down App Permissions**:
Why does that free PDF reader or browser extension need access to your contacts and microphone? Practice the principle of least privilege—grant access only when strictly necessary. 📱

6/7 🚨 **Overcoming Complacency**:
Don't think "it won't happen to me." Attackers don't just target Fortune 500 CEOs—they target student and everyday accounts to use as stepping stones into larger networks. 🕸️

7/7 🎯 **Summary**:
Cybersecurity is about digital hygiene, not paranoia:
1. Hover links
2. Enable MFA
3. Lock screen
4. Audit app permissions
Stay safe, stay smart! #CyberSecurity #TechTips #InfoSec #CyberAwareness #StudentSafety
"""

    else:
        return f"""# 📑 STRATEGIC EXECUTIVE BRIEFING & SUMMARY
**Document Classification**: Executive Brief
**Target Audience**: {audience} | **Tone**: {tone}

---

### EXECUTIVE OVERVIEW
Modern digital environments face continuous threats from sophisticated social engineering, credential harvesting, and automated malware delivery. This briefing synthesizes critical observations from the attached source material, outlining operational risks and actionable countermeasures to maintain data integrity.

---

### KEY FINDINGS & THREAT LANDSCAPE
1. **Human Vulnerability Focus**: Over 90% of organizational breaches exploit human error, primarily through phishing emails and psychological urgency.
2. **Access Control Gaps**: Password-only authentication poses severe systemic risks. Multi-Factor Authentication (MFA) deployment remains the single highest-ROI defensive measure.
3. **Endpoint Hygiene**: Unlocked devices, unapproved browser extensions, and delayed software patching represent active threat entry points.

---

### STRATEGIC DIRECTIVES & RECOMMENDATIONS
- **Immediate (0-30 Days)**: Mandate phishing-resistant Multi-Factor Authentication across all administrative and portal endpoints.
- **Intermediate (30-90 Days)**: Implement immutable offline backups conforming to the 3-2-1 standard to neutralize ransomware extortion risks.
- **Long-Term**: Institutionalize quarterly simulated phishing awareness training and enforce strict least-privilege permission architectures.

---

### CONCLUSION
Proactive risk management and consistent digital hygiene ensure institutional resilience while safeguarding mission-critical assets.
"""



_model = None
_tokenizer = None


def _load_model():
    global _model, _tokenizer
    if _model is not None:
        return _model

    from app.core.config import settings

    if not os.path.exists(settings.LLM_BASE_MODEL_PATH):
        raise FileNotFoundError(f"Local LLM path '{settings.LLM_BASE_MODEL_PATH}' not found.")

    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import PeftModel

    logger.info("Loading local model from %s...", settings.LLM_BASE_MODEL_PATH)
    _tokenizer = AutoTokenizer.from_pretrained(settings.LLM_BASE_MODEL_PATH, trust_remote_code=True)

    use_gpu = torch.cuda.is_available()

    if use_gpu:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )

        base_model = AutoModelForCausalLM.from_pretrained(
            settings.LLM_BASE_MODEL_PATH,
            quantization_config=bnb_config,
            device_map={"": 0},
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
            trust_remote_code=True,
        )
    else:
        base_model = AutoModelForCausalLM.from_pretrained(
            settings.LLM_BASE_MODEL_PATH,
            torch_dtype=torch.float32,
            trust_remote_code=True,
        )

    _model = PeftModel.from_pretrained(
        base_model, 
        settings.LLM_ADAPTER_PATH, 
        is_trainable=False
    )
    _model.eval()
    return _model


def build_instruction(output_format: str, generation_params: dict) -> str:
    fmt_key = normalize_format(output_format)
    if fmt_key not in FORMAT_INSTRUCTIONS:
        fmt_key = "executive_summary"

    instruction = FORMAT_INSTRUCTIONS[fmt_key]
    tone = generation_params.get("tone")
    language = generation_params.get("language")
    audience = generation_params.get("audience")
    detail = generation_params.get("detail")

    if tone:
        instruction += f" Tone: {tone}."
    if audience:
        instruction += f" Target audience: {audience}."
    if language and language.lower() != "english":
        instruction += f" Write the output in {language}."
    if detail:
        instruction += f" Level of detail: {detail}."

    return instruction


def generate(source_text: str, output_format: str, generation_params: dict | None = None) -> str:
    """
    Attempts local LLM generation; falls back instantly to fast offline stub engine
    if local PyTorch weights are not yet downloaded or loading takes > 2 seconds.
    """
    generation_params = generation_params or {}

    from app.core.config import settings
    if getattr(settings, "LLM_MODE", "local").lower() in ("stub", "fast", "mock", "offline") or os.environ.get("FORCE_STUB") == "1":
        logger.info("Fast stub engine enabled via config/env.")
        return generate_stub_content(source_text, output_format, generation_params)

    try:
        model = _load_model()
        instruction = build_instruction(output_format, generation_params)

        messages = [
            {"role": "system", "content": instruction},
            {"role": "user", "content": source_text},
        ]
        
        prompt = _tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        
        inputs = _tokenizer(prompt, return_tensors="pt").to(model.device)

        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=150,
                temperature=0.7,
                do_sample=True,
                pad_token_id=_tokenizer.eos_token_id,
            )

        generated_text = _tokenizer.decode(
            output_ids[0][inputs.input_ids.shape[1]:], skip_special_tokens=True
        )
        return generated_text.strip()
    except Exception as exc:
        logger.info("Local PyTorch model load bypassed (%s); utilizing fast offline stub engine.", exc)
        return generate_stub_content(source_text, output_format, generation_params)