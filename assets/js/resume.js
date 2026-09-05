/* =========================================================
   Résumé data + region-aware rendering.

   A CV is not one document. Germany expects a Lebenslauf with a
   personal-details block; the UK expects a two-page CV with a personal
   statement and no photo; the US expects a one-page resume with no
   personal data at all (anti-discrimination convention). Same facts,
   different shape — so the content lives here once, and each region
   decides what is shown, what it is called, and how dates are written.
   ========================================================= */
(function (global) {
  'use strict';

  var CV = {
    name: 'Badathala Jaisurya',
    tagline: {
      en: 'AI Security · DevSecOps · MLOps · Cloud Security',
      de: 'KI-Sicherheit · DevSecOps · MLOps · Cloud-Sicherheit'
    },
    contact: {
      location: { en: 'Chennai, India', de: 'Chennai, Indien' },
      phone: '+91 8143516981',
      email: 'jaisurya524126@gmail.com',
      linkedin: 'linkedin.com/in/badathala-jaisurya-7b985a224',
      github: 'github.com/jaisurya93945',
      site: 'jaisurya93945.github.io/portfolio'
    },
    personal: [
      { label: { en: 'Place of residence', de: 'Wohnort' },
        value: { en: 'Chennai, India', de: 'Chennai, Indien' } },
      { label: { en: 'Languages', de: 'Sprachen' },
        value: { en: 'English (fluent), Telugu, Tamil, Hindi',
                 de: 'Englisch (fließend), Telugu, Tamil, Hindi' } },
      { label: { en: 'Mobility', de: 'Mobilität' },
        value: { en: 'Open to relocation and remote work',
                 de: 'Umzugsbereit, auch remote' } },
      { label: { en: 'Availability', de: 'Verfügbarkeit' },
        value: { en: 'By arrangement', de: 'Nach Vereinbarung' } }
    ],

    summary: {
      en: 'DevOps and cybersecurity engineer bridging security operations, cloud infrastructure and applied AI. Certified Ethical Hacker with hands-on experience in SIEM monitoring, vulnerability assessment and incident response, now applying that foundation to DevSecOps and cloud infrastructure as a DevOps Engineer at Stackly. Founder of CipherAI, a production AI SaaS platform serving a live paying client, and author of SentinelCore and AegisAI — open-source AI threat gateways for prompt-injection defence.',
      de: 'DevOps- und Cybersecurity-Engineer an der Schnittstelle von Security Operations, Cloud-Infrastruktur und angewandter KI. Certified Ethical Hacker mit praktischer Erfahrung in SIEM-Monitoring, Schwachstellenanalyse und Incident Response; dieses Fundament wende ich heute als DevOps Engineer bei Stackly auf DevSecOps und Cloud-Infrastruktur an. Gründer von CipherAI, einer produktiven KI-SaaS-Plattform mit zahlendem Kunden, sowie Autor von SentinelCore und AegisAI — quelloffenen KI-Bedrohungs-Gateways zur Abwehr von Prompt Injection.'
    },
    objective: {
      en: 'Targeting AI Security Engineer, DevSecOps, MLOps and Cloud Security roles.',
      de: 'Ziel: Positionen als AI Security Engineer, DevSecOps-, MLOps- oder Cloud-Security-Engineer.'
    },

    skills: [
      { label: { en: 'AI & LLM Security', de: 'KI- & LLM-Sicherheit' },
        value: { en: 'Prompt-injection and jailbreak detection, LLM guardrails, MCP tool-poisoning checks, AI red teaming (garak, PyRIT), OWASP LLM Top 10, MITRE ATLAS, NIST AI RMF, detection engineering, evaluation harnesses.',
                 de: 'Erkennung von Prompt Injection und Jailbreaks, LLM-Guardrails, Prüfung auf MCP-Tool-Vergiftung, KI-Red-Teaming (garak, PyRIT), OWASP LLM Top 10, MITRE ATLAS, NIST AI RMF, Detection Engineering, Evaluations-Harnische.' } },
      { label: { en: 'Cloud, DevSecOps & MLOps', de: 'Cloud, DevSecOps & MLOps' },
        value: { en: 'AWS, GCP, Docker, CI/CD pipelines, Kubernetes (in progress), Linux administration and hardening, Git/GitHub, dependency and secret scanning, pip-audit, dataset validation, regression testing.',
                 de: 'AWS, GCP, Docker, CI/CD-Pipelines, Kubernetes (in Arbeit), Linux-Administration und -Härtung, Git/GitHub, Abhängigkeits- und Secret-Scanning, pip-audit, Datensatzvalidierung, Regressionstests.' } },
      { label: { en: 'Security Operations', de: 'Security Operations' },
        value: { en: 'SIEM monitoring, incident response, vulnerability assessment (VAPT), penetration testing, malware analysis, endpoint security, TCP/IP, DNS, firewalls, Splunk, ELK, Wireshark, Nmap, Metasploit, Burp Suite.',
                 de: 'SIEM-Monitoring, Incident Response, Schwachstellenbewertung (VAPT), Penetrationstests, Malware-Analyse, Endpoint Security, TCP/IP, DNS, Firewalls, Splunk, ELK, Wireshark, Nmap, Metasploit, Burp Suite.' } },
      { label: { en: 'Development', de: 'Entwicklung' },
        value: { en: 'Python, Bash, JavaScript/TypeScript, React, FastAPI, PyTorch, scikit-learn, Firebase, Supabase, LLM API integration (OpenAI, OpenRouter).',
                 de: 'Python, Bash, JavaScript/TypeScript, React, FastAPI, PyTorch, scikit-learn, Firebase, Supabase, LLM-API-Integration (OpenAI, OpenRouter).' } }
    ],

    experience: [
      { role: { en: 'DevOps Engineer', de: 'DevOps Engineer' },
        org: 'Stackly', from: '2026-03', to: null,
        bullets: {
          en: ['Manage cloud infrastructure and CI/CD pipelines supporting scalable backend deployment.',
               'Operate containerised applications with Docker, improving system reliability and deployment consistency.',
               'Drive DevOps and DevSecOps practice across build, release and deployment workflows.'],
          de: ['Verantwortung für Cloud-Infrastruktur und CI/CD-Pipelines zur skalierbaren Backend-Bereitstellung.',
               'Betrieb containerisierter Anwendungen mit Docker; höhere Systemzuverlässigkeit und konsistentere Deployments.',
               'Etablierung von DevOps- und DevSecOps-Praktiken über Build-, Release- und Deployment-Workflows hinweg.']
        } },
      { role: { en: 'Founder & Engineer', de: 'Gründer & Engineer' },
        org: 'CipherAI — cipherai.in', from: '2025-01', to: null,
        bullets: {
          en: ['Architected and built a multi-product AI SaaS platform spanning LLM chat, image and video generation, cybersecurity education, a job portal, hackathons and certification.',
               'Integrated LLM APIs (OpenAI, OpenRouter) with Clerk authentication, Firebase Firestore and Supabase storage to power 50+ AI tools on a credit-based usage system.',
               'Implemented Razorpay payment processing and an admin dashboard; delivered the platform to a real paying client, generating revenue from a live production SaaS product.'],
          de: ['Architektur und Aufbau einer Multi-Produkt-KI-SaaS-Plattform: LLM-Chat, Bild- und Videogenerierung, Security-Schulung, Jobportal, Hackathons und Zertifizierung.',
               'Integration von LLM-APIs (OpenAI, OpenRouter) mit Clerk-Authentifizierung, Firebase Firestore und Supabase-Storage für über 50 KI-Tools auf Credit-Basis.',
               'Implementierung der Razorpay-Zahlungsabwicklung und eines Admin-Dashboards; Auslieferung an einen zahlenden Kunden und Umsatz aus einem produktiven SaaS-Produkt.']
        } },
      { role: { en: 'Cybersecurity Intern', de: 'Praktikant Cybersicherheit' },
        org: 'Tata Consultancy Services', from: '2024-01', to: '2024-12',
        bullets: {
          en: ['Conducted vulnerability assessments and risk analysis for enterprise systems, identifying security gaps across infrastructure.',
               'Monitored security alerts using SIEM tooling, supported incident triage and response, and prepared technical remediation reports.'],
          de: ['Durchführung von Schwachstellenbewertungen und Risikoanalysen für Unternehmenssysteme; Identifikation von Sicherheitslücken in der Infrastruktur.',
               'Überwachung von Sicherheitsmeldungen mit SIEM-Werkzeugen, Unterstützung bei Incident-Triage und -Response sowie Erstellung technischer Remediation-Berichte.']
        } },
      { role: { en: 'Cybersecurity Intern', de: 'Praktikant Cybersicherheit' },
        org: 'CFSS Pvt Ltd', from: '2024-01', to: '2024-06',
        bullets: {
          en: ['Assisted penetration testing and ethical hacking exercises across web and network applications.',
               'Performed Linux system hardening and configuration security reviews; documented secure operating procedures.'],
          de: ['Mitarbeit bei Penetrationstests und Ethical-Hacking-Übungen für Web- und Netzwerkanwendungen.',
               'Linux-Systemhärtung und Prüfung von Sicherheitskonfigurationen; Dokumentation sicherer Betriebsverfahren.']
        } }
    ],

    projects: [
      { name: 'SentinelCore', stack: 'Python 3.11, FastAPI, SQLite, Docker, pytest',
        bullets: {
          en: ['Model-agnostic security layer between AI applications and their models, tools and data sources; inspects prompts, documents, tool calls and model output.',
               'Detects prompt injection, obfuscation (zero-width, bidirectional text, homoglyphs, encoding), PII and secrets, and MCP tool-poisoning; enforces allow / warn / sanitise / approve / block policy.',
               '96.8% detector precision across 744 labelled examples, with an attack-replay lab tracking improvements across versions; OpenAI-compatible reverse proxy with queryable audit trails.'],
          de: ['Modellunabhängige Sicherheitsschicht zwischen KI-Anwendungen und ihren Modellen, Tools und Datenquellen; prüft Prompts, Dokumente, Tool-Aufrufe und Modellausgaben.',
               'Erkennt Prompt Injection, Verschleierung (Zero-Width, Bidi, Homoglyphen, Kodierung), PII und Secrets sowie MCP-Tool-Vergiftung; erzwingt Allow / Warn / Bereinigen / Freigabe / Block.',
               '96,8 % Detektor-Präzision über 744 markierte Beispiele, mit Attack-Replay-Labor zur Versionsverfolgung; OpenAI-kompatibler Reverse Proxy mit abfragbaren Audit-Trails.']
        } },
      { name: 'AegisAI', stack: 'Python, FastAPI, scikit-learn, joblib',
        bullets: {
          en: ['Layered detection architecture where deterministic rules retain authority over bounded ML evidence, producing transparent 0–100 risk scores with explainable findings.',
               'Classifies nine threat intents and separates malicious intent from legitimate defensive security education; trained across roughly 399K labelled examples with leakage detection and cross-dataset evaluation.',
               '112 passing tests with automated regression testing and dataset validation tooling.'],
          de: ['Mehrschichtige Erkennungsarchitektur, in der deterministische Regeln Vorrang vor begrenzten ML-Belegen behalten; transparente Risikowerte von 0–100 mit erklärbaren Befunden.',
               'Klassifiziert neun Bedrohungsabsichten und trennt böswillige Absicht von legitimer defensiver Security-Ausbildung; trainiert auf rund 399.000 markierten Beispielen mit Leckage-Erkennung und datensatzübergreifender Auswertung.',
               '112 bestandene Tests mit automatisierten Regressionstests und Werkzeugen zur Datensatzvalidierung.']
        } },
      { name: 'NeuroGenesis', stack: 'Python, PyTorch, symbolic methods',
        bullets: {
          en: ['Verification framework converting LLM reasoning into structured representations and independently checking logic, factual and constraint violations before an answer is accepted.',
               'Implements a reasoning-shortcut oracle that enumerates shortcut spaces before training, testing whether identifiability predicts correct concept learning.'],
          de: ['Verifikations-Framework, das LLM-Schlussfolgerungen in strukturierte Repräsentationen überführt und Logik-, Fakten- sowie Constraint-Verletzungen unabhängig prüft, bevor eine Antwort akzeptiert wird.',
               'Implementiert ein Oracle für Reasoning-Shortcuts, das Shortcut-Räume vor dem Training aufzählt und prüft, ob Identifizierbarkeit korrektes Konzeptlernen vorhersagt.']
        } },
      { name: { en: 'SOC Detection Lab', de: 'SOC-Erkennungslabor' }, stack: 'ELK, Splunk, detection engineering',
        bullets: {
          en: ['Deployed ELK and Splunk SIEM stacks in an isolated lab; wrote detection rules, simulated real-world attacks and documented end-to-end incident-response workflows.'],
          de: ['Aufbau von ELK- und Splunk-SIEM-Stacks in einer isolierten Laborumgebung; eigene Erkennungsregeln, Simulation realer Angriffe und Dokumentation durchgängiger Incident-Response-Abläufe.']
        } },
      { name: { en: 'Endpoint Monitoring & Malware Lab', de: 'Endpoint-Überwachung & Malware-Labor' },
        stack: 'Python, sandboxing, automation',
        bullets: {
          en: ['Built an isolated sandbox to safely analyse malware behaviour and evaluate defensive countermeasures.',
               'Built a USB/device monitor that flags unauthorised activity to prevent data exfiltration, plus scripts automating log analysis and network scanning.'],
          de: ['Aufbau einer isolierten Sandbox zur sicheren Analyse von Malware-Verhalten und zur Bewertung von Gegenmaßnahmen.',
               'Entwicklung eines USB-/Geräte-Monitors, der unbefugte Aktivität meldet und Datenabfluss verhindert, sowie Skripte zur Automatisierung von Log-Analyse und Netzwerk-Scans.']
        } }
    ],

    certs: {
      en: ['Certified Ethical Hacker (CEH) — EC-Council',
           'DevSecOps — Linux Foundation',
           'Linux Essentials — Linux Foundation',
           'Cloud Computing Foundations — Google Cloud',
           'Python and AI certifications',
           'CompTIA Security+ and Network+ (in progress)'],
      de: ['Certified Ethical Hacker (CEH) — EC-Council',
           'DevSecOps — Linux Foundation',
           'Linux Essentials — Linux Foundation',
           'Grundlagen des Cloud Computing — Google Cloud',
           'Python- und KI-Zertifikate',
           'CompTIA Security+ und Network+ (in Arbeit)']
    },

    education: [
      { degree: { en: 'B.Tech, Computer Science and Business Systems',
                  de: 'B.Tech, Informatik und Business Systems' },
        org: { en: 'Rajalakshmi Institute of Technology, Chennai',
               de: 'Rajalakshmi Institute of Technology, Chennai' },
        from: '2021-08', to: '2025-05' }
    ],

    achievements: {
      en: ['Solved 100+ Capture the Flag (CTF) challenges across multiple platforms.',
           'Runner-up, National Cybersecurity Hackathon.',
           'Ranked in the top 3% globally in security competitions and on TryHackMe.',
           'Generated revenue from a live production AI SaaS product delivered to a paying client.'],
      de: ['Über 100 Capture-the-Flag-Aufgaben auf verschiedenen Plattformen gelöst.',
           'Zweiter Platz beim nationalen Cybersecurity-Hackathon.',
           'Weltweit unter den besten 3 % in Security-Wettbewerben und auf TryHackMe.',
           'Umsatz aus einem produktiven KI-SaaS-Produkt für einen zahlenden Kunden erwirtschaftet.']
    }
  };

  /* ---- region rules -------------------------------------------------- */

  var MONTHS = {
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    de: ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.']
  };

  var REGIONS = {
    int: {
      flagLabel: 'Europe / International',
      docTitle: { en: 'Curriculum Vitae', de: 'Lebenslauf' },
      lang: 'en', personal: false, photo: false, dateStyle: 'monthYear',
      sections: ['summary','skills','experience','projects','certs','education','achievements'],
      note: 'Two pages, no photo, no date of birth. Neutral formatting that reads correctly across most European markets.'
    },
    de: {
      flagLabel: 'Deutschland · Österreich · Schweiz',
      docTitle: { en: 'Curriculum Vitae', de: 'Lebenslauf' },
      lang: 'de', personal: true, photo: true, dateStyle: 'numeric',
      sections: ['personal','summary','skills','experience','projects','certs','education','achievements'],
      note: 'Lebenslauf: tabellarisch, mit Block „Persönliche Daten". Foto und Geburtsdatum sind seit dem AGG freiwillig — hier optional zuschaltbar. Datumsangaben als MM/JJJJ.'
    },
    uk: {
      flagLabel: 'United Kingdom & Ireland',
      docTitle: { en: 'Curriculum Vitae', de: 'Lebenslauf' },
      lang: 'en', personal: false, photo: false, dateStyle: 'monthYear',
      sections: ['summary','skills','experience','projects','certs','education','achievements','references'],
      note: 'UK/Irish CV: personal statement first, two pages, no photo, no date of birth or marital status. References available on request.'
    },
    us: {
      flagLabel: 'United States',
      docTitle: { en: 'Resume', de: 'Resume' },
      lang: 'en', personal: false, photo: false, dateStyle: 'numeric',
      sections: ['summary','skills','experience','projects','education','certs'],
      note: 'US resume: one page where possible, achievements forward, no photo and no personal details — US hiring convention treats them as discrimination risk.'
    },
    in: {
      flagLabel: 'India',
      docTitle: { en: 'Resume', de: 'Resume' },
      lang: 'en', personal: true, photo: false, dateStyle: 'monthYear',
      sections: ['personal','summary','skills','experience','projects','certs','education','achievements'],
      note: 'Indian resume: fuller detail is expected, with location and languages listed. Certifications are given prominence.'
    }
  };

  function pick(v, lang) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    return v[lang] !== undefined ? v[lang] : v.en;
  }

  function fmtDate(iso, region, lang) {
    if (!iso) return lang === 'de' ? 'heute' : 'Present';
    var parts = iso.split('-'), y = parts[0], m = parseInt(parts[1], 10);
    if (REGIONS[region].dateStyle === 'numeric') {
      return (m < 10 ? '0' + m : m) + '/' + y;
    }
    return MONTHS[lang][m - 1] + ' ' + y;
  }

  global.RESUME = { CV: CV, REGIONS: REGIONS, pick: pick, fmtDate: fmtDate };
})(window);
