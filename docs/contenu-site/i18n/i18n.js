/* ====================================================
   Inovexa ERP — i18n Engine v3 (embedded translations)
   Works on file://, localhost, and production (no fetch)
   ==================================================== */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'fr', 'es'];
  var DEFAULT = 'en';
  var STORAGE_KEY = 'inovexa-lang';

  /* Embedded translations (no fetch needed) */
  var TRANSLATIONS = {
  "en": {
    "nav": {
      "home": "Home",
      "products": "Products",
      "pricing": "Pricing",
      "blog": "Blog",
      "about": "About",
      "contact": "Contact",
      "requestDemo": "Request Demo",
      "language": "Language"
    },
    "cta": {
      "getStartedFree": "Get Started Free",
      "bookDemo": "Book Demo",
      "requestDemo": "Request a Free Demo",
      "bookFreeDemo": "Book Your Free Demo",
      "requestFreeConsultation": "Request a Free Consultation",
      "requestPricingInquiry": "Request a Pricing Inquiry",
      "contactSales": "Contact Sales",
      "contactSalesTeam": "Contact Sales Team",
      "contactEnterprise": "Contact Enterprise",
      "viewPricing": "View Pricing",
      "learnMore": "Learn more",
      "read": "Read",
      "readArticle": "Read article",
      "backToBlog": "Back to Blog",
      "backToTop": "Back to top",
      "requestQuote": "Request a Quote",
      "talkToTeam": "Talk to Our Team",
      "exploreIndustrySolutions": "Explore industry solutions",
      "emailEnterprise": "Email Enterprise Team",
      "noCreditCard": "No credit card required - free 30-day trial"
    },
    "footer": {
      "tagline": "Cloud ERP built in Tunisia, used by growing businesses worldwide.",
      "company": "Company",
      "industries": "Industries",
      "getInTouch": "Get in Touch",
      "home": "Home",
      "products": "Products",
      "pricing": "Pricing",
      "blog": "Blog",
      "contact": "Contact",
      "manufacturing": "Manufacturing",
      "retail": "Retail",
      "distribution": "Distribution",
      "healthcare": "Healthcare",
      "professionalServices": "Professional Services",
      "agribusiness": "Agribusiness",
      "privacyPolicy": "Privacy Policy",
      "termsOfService": "Terms of Service",
      "cookiePolicy": "Cookie Policy",
      "rights": "Inovexa ERP. All rights reserved. · Part of"
    },
    "theme": {
      "switchToLight": "Switch to Light Mode",
      "switchToDark": "Switch to Dark Mode"
    },
    "a11y": {
      "skipToContent": "Skip to main content"
    },
    "index": {
      "heroTitle1": "The Future of",
      "heroDescription": "Inovexa ERP unifies HR, Finance, Supply Chain, Sales, and AI Analytics into one cloud platform.",
      "whyLabel": "Why Inovexa",
      "whyTitle": "One system instead of five",
      "whySubtitle": "Finance, HR, stock and sales share the same data, so nobody re-types numbers from one tool into another.",
      "whyCard1Title": "Fast on any connection",
      "whyCard1Desc": "Screens open in under a second across all 11 modules, and the app stays usable on slower mobile connections.",
      "whyCard2Title": "Security you can check",
      "whyCard2Desc": "Data is encrypted at rest and in transit. Role-based permissions control who sees what, and the audit log records every change.",
      "whyCard3Title": "Start small, add modules later",
      "whyCard3Desc": "Start with the modules you need today and switch on more as you grow, from a 10-person team to a company of thousands, without migrating.",
      "modulesLabel": "Modules",
      "modulesTitle": "11 modules that work as one",
      "modulesSubtitle": "Every module reads and writes the same records, so a sales order updates stock, invoicing and reporting on its own.",
      "modDashboard": "Dashboard",
      "modDashboardDesc": "Key figures for the whole business on one screen",
      "modHR": "Human Resources",
      "modHRDesc": "Full HR lifecycle management",
      "modFinance": "Finance",
      "modFinanceDesc": "Accounting, invoicing & financial control",
      "modSupply": "Supply Chain",
      "modSupplyDesc": "Stock levels, transfers and supplier lead times",
      "modProd": "Production",
      "modProdDesc": "Manufacturing & production planning",
      "modPurch": "Purchases",
      "modPurchDesc": "Procurement & vendor management",
      "modSales": "Sales",
      "modSalesDesc": "CRM, orders & revenue tracking",
      "modLog": "Logistics",
      "modLogDesc": "Fleet, delivery & warehouse ops",
      "modAI": "AI Engine",
      "modAIDesc": "Demand forecasts, anomaly alerts and suggested next steps based on your own data",
      "modReports": "Reports",
      "modReportsDesc": "Automated compliance & custom reports",
      "modAnalytics": "Analytics",
      "modAnalyticsDesc": "Charts and KPIs you can filter and drill into",
      "statsTitle": "Running in real companies, every day",
      "statsSubtitle": "From small distributors to multi-site manufacturers, teams in many countries run their daily operations on Inovexa.",
      "statsModules": "Companies",
      "statsModulesCap": "using Inovexa today",
      "statsGoLive": "Go-live",
      "statsGoLiveCap": "typical setup for a standard rollout",
      "statsLanguages": "Countries",
      "statsLanguagesCap": "with active customers",
      "ctaTitle": "See how Inovexa would run your business",
      "ctaSubtitle": "A 30-minute walkthrough with our team, set up around your industry and company size, in English or French. No commitment.",
      "heroRotate": "Finance|HR|Supply Chain|Sales|Manufacturing",
      "heroTitleSr": "The Future of Finance, HR, Supply Chain, Sales and Manufacturing",
      "heroSecondaryCta": "See the modules",
      "statsLabel": "Inovexa in numbers",
      "statsMods": "Modules",
      "statsModsCap": "on one shared database"
    },
    "products": {
      "heroDescription": "Inovexa ERP adapts to your industry with tailored workflows, local compliance, and modular deployment.",
      "industriesLabel": "Industries We Serve",
      "industriesTitle": "Workflows built for your sector",
      "industriesSubtitle": "Whatever your sector, Inovexa adapts to your operational reality.",
      "indManuTitle": "Manufacturing",
      "indRetailTitle": "Retail",
      "indDistTitle": "Distribution",
      "indHealthTitle": "Healthcare",
      "indProfTitle": "Professional Services",
      "indAgriTitle": "Agribusiness",
      "compTitle": "Why Inovexa vs. Traditional ERP",
      "compLabel": "The Inovexa Difference",
      "compInovexa": "Inovexa ERP",
      "compTraditional": "Traditional ERP",
      "globalLabel": "Worldwide Ready",
      "globalTitle": "Tax rules and currencies for every country you sell in",
      "globalSubtitle": "Inovexa ERP supports custom tax rules and currencies for virtually every country.",
      "ctaTitle": "Find Your Industry Solution",
      "ctaSubtitle": "Talk to one of our industry specialists - we'll map Inovexa's capabilities to your exact operational challenges, free of charge.",
      "entBadge": "Enterprise",
      "entTitle": "Need a custom ERP solution?",
      "entDesc": "Every business has unique workflows, compliance needs, and integration requirements. Inovexa works with mid-size and enterprise clients worldwide to build tailored ERP deployments that fit your exact operational reality.",
      "entDetails": "Multi-entity setups, custom modules, on-premise hosting, dedicated account management, SLA guarantees, and white-glove migration are all part of our enterprise offering.",
      "entResponse": "Response within 24 hours · Free consultation",
      "heroEyebrow": "Platform",
      "heroModules": "11 Modules · 6 Industries",
      "heroH1a": "Tailored for",
      "heroH1b": "Every Industry",
      "heroMore": "+2 more industries",
      "industriesDesc": "Each vertical comes with pre-configured workflows, compliance templates, and KPI dashboards built for how your industry actually works.",
      "indManuDesc": "End-to-end factory management from raw materials to finished goods - with real-time production tracking and quality control.",
      "indManuB1": "Predictive maintenance alerts before a breakdown stops the line",
      "indManuB2": "Plan raw material purchases from real production orders and forecasts",
      "indManuB3": "Full traceability from BOM to delivery with quality checkpoints",
      "indRetailDesc": "Run your physical stores and e-commerce operations with synchronized inventory, customer data, and omni-channel reporting.",
      "indRetailB1": "Prevent stockouts and overstock with AI demand forecasting",
      "indRetailB2": "Centralize pricing, promotions and loyalty programs",
      "indRetailB3": "Real-time sales dashboards across all stores and channels",
      "indDistDesc": "Run multi-depot distribution with route planning, warehouse automation, and stock levels by location.",
      "indDistB1": "Plan delivery routes automatically to cut last-mile costs",
      "indDistB2": "Track every pallet, SKU, and vehicle in real time",
      "indDistB3": "Automate cross-docking and inter-depot transfers",
      "indHealthDesc": "Streamline clinic and hospital operations with HIPAA-compliant patient data management, medical inventory, and billing workflows.",
      "indHealthB1": "Manage medical supplies with expiry tracking and auto-reorder",
      "indHealthB2": "Automate staff scheduling across departments and shifts",
      "indHealthB3": "Simplify insurance claims and patient billing reconciliation",
      "indProfDesc": "Track billable hours and project margins with built-in project management, resource planning, and client invoicing.",
      "indProfB1": "Track project time, expenses, and margins in real time",
      "indProfB2": "Automate recurring invoices and contract renewals",
      "indProfB3": "360° client CRM with full interaction history",
      "indAgriDesc": "From farm to export - manage crop cycles, input costs, storage, and international trade compliance in a single platform.",
      "indAgriB1": "Track seasonal costs, yields, and profitability by plot",
      "indAgriB2": "Manage export documentation and trade certificates",
      "indAgriB3": "Multi-currency invoicing for international buyers",
      "getDemo": "Get a demo",
      "compDesc": "Legacy ERP projects take months and usually need extra work for local tax rules, several languages, and several currencies. Inovexa includes all three from day one.",
      "compFeature": "Feature",
      "compRowTime": "Implementation Time",
      "compRowLang": "Multilingual Support (EN / FR / ES)",
      "compRowTax": "Country-Specific Tax & Compliance",
      "compRowLicense": "Upfront License Cost",
      "compRowSupport": "Local Support Team",
      "compRowAi": "AI & Predictive Analytics",
      "compRowOffline": "Offline-Capable Mobile Access",
      "compRowOfflineShort": "Offline Mobile Access",
      "compTimeInovexa": "2–4 weeks",
      "compTimeTrad": "6–18 months",
      "compLicenseInovexa": "No upfront license fee",
      "compLicenseInovexaShort": "None",
      "compLicenseTrad": "Often six figures upfront",
      "compAiTrad": "Add-on extra cost",
      "compAiTradShort": "Add-on cost",
      "compTraditionalShort": "Traditional",
      "taxTitle": "Custom Tax Engine",
      "taxDesc": "Configure any tax rule: Tunisian TVA, European VAT, UK VAT, US sales tax, withholding taxes, excise duties, and country-specific exemptions. Update rates without code changes.",
      "currencyTitle": "180+ Currencies",
      "currencyDesc": "Multi-currency invoicing, real-time exchange rates, and consolidated reporting in any currency. Invoice in TND, EUR, USD, GBP, SAR, AED, and any other currency your customers require.",
      "complianceTitle": "Country-Specific Compliance",
      "complianceDesc": "Pre-configured for local fiscal rules, e-invoicing mandates, and statutory reporting formats in dozens of countries. New jurisdictions added continuously based on customer demand.",
      "missingCountryQ": "Don't see your country?",
      "missingCountryLink": "Talk to our team",
      "missingCountryRest": ". We add new jurisdictions based on customer demand."
    },
    "pricing": {
      "heroTitle1": "Flexible Plans for",
      "heroTitle2": "Every Business Size",
      "heroDescription": "Every business is unique. Contact us for a personalized pricing quote tailored to your size, selected modules, and specific requirements.",
      "cardsSubtitle": "Choose the plan that fits your team - then contact us for your custom quote.",
      "starter": "Starter",
      "business": "Business",
      "enterprise": "Enterprise",
      "mostPopular": "Most Popular",
      "contactForPricing": "Contact for Pricing",
      "customPricing": "Custom Pricing",
      "starterDesc": "Perfect for small businesses ready to modernize their operations and leave spreadsheets behind.",
      "businessDesc": "For growing businesses that need the full power of an integrated ERP across all operational departments.",
      "enterpriseDesc": "For large enterprises, government bodies, and organizations with complex, multi-entity requirements.",
      "whatIncluded": "What's included",
      "everythingInStarter": "Everything in Starter, plus",
      "everythingInBusiness": "Everything in Business, plus",
      "comparisonTitle": "Full Feature Comparison",
      "comparisonSubtitle": "See exactly what's included in each plan",
      "faqLabel": "FAQ",
      "faqTitle": "Frequently Asked Questions",
      "faqSubtitle": "Everything you need to know before getting started.",
      "stillQuestions": "Still have questions? We're happy to help.",
      "allPlansInclude": "All plans include full data migration support and a dedicated onboarding specialist.",
      "talkToSalesTeam": "Talk to our sales team for a personalized quote",
      "exploreModules": "Explore Modules",
      "plansLabel": "Plans:",
      "f": {
        "users25": "Up to 25 users",
        "coreModules": "Finance, HR & Sales modules",
        "storage50": "50 GB cloud storage",
        "reports50": "Standard reports (50+)",
        "emailChat": "Email & chat support",
        "mobile": "Mobile app access",
        "aiEngine": "AI Engine",
        "customIntegrations": "Custom integrations",
        "users150": "Up to 150 users",
        "allModules": "All 11 modules included",
        "storage500": "500 GB cloud storage",
        "aiFull": "AI Engine (full access)",
        "reports200": "200+ report templates",
        "phone": "Priority phone support",
        "integrations50": "50 standard integrations",
        "usersUnlimited": "Unlimited users",
        "storageUnlimited": "Unlimited storage",
        "multiEntity": "Multi-entity / multi-country",
        "onPremise": "On-premise deployment option",
        "accountManager": "Dedicated account manager",
        "sla": "Custom SLA (99.99% uptime)",
        "integrationsApi": "Custom integrations & API"
      },
      "cmp": {
        "gCore": "Core Modules",
        "gIntel": "Intelligence & Analytics",
        "gSupport": "Support & Infrastructure",
        "finance": "Finance & Accounting",
        "hr": "Human Resources",
        "sales": "Sales & CRM",
        "supply": "Supply Chain & Inventory",
        "production": "Production & Manufacturing",
        "logistics": "Logistics & Fleet",
        "reports": "Standard Reports (50+)",
        "analytics": "Advanced Analytics",
        "aiForecast": "AI Demand Forecasting",
        "emailChat": "Email & Chat Support",
        "phone": "Priority Phone Support",
        "accountManager": "Dedicated Account Manager",
        "onPremise": "On-Premise Deployment"
      },
      "faq": {
        "q1": "Can I see a demo before committing?",
        "a1": "Yes. Every prospective customer gets a personalized live demo with our team, tailored to your industry and use case. No credit card required, no commitment - just a conversation about whether Inovexa fits your needs.",
        "q2": "Can I switch plans at any time?",
        "a2": "Yes. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately; downgrades take effect at the end of your current billing cycle. Your dedicated account manager handles the transition.",
        "q3": "How does data migration work?",
        "a3": "Our implementation team handles your full data migration from your current system - whether it's spreadsheets, another ERP, or a legacy accounting system. We've migrated from SAP, Sage, QuickBooks, and dozens of custom systems. Migration is included in all plans.",
        "q4": "Does Inovexa handle local tax rules in my country?",
        "a4": "Yes. The tax engine is configurable per country. We support Tunisian TVA, Moroccan VAT, Egyptian e-invoicing, and European VAT, and add new jurisdictions based on customer demand. Rates are updated as regulations change.",
        "q5": "What languages does Inovexa support?",
        "a5": "Inovexa supports French and English across all modules and system-generated documents (invoices, reports, contracts). Language can be set per user.",
        "q6": "What happens to my data if I cancel?",
        "a6": "You own your data 100%. Upon cancellation, you'll receive a full export of all your data in standard formats (CSV, Excel, JSON, PDF). We retain data for 90 days after cancellation before permanent deletion.",
        "q7": "Do you offer on-premise deployment?",
        "a7": "Yes - on-premise deployment is available on the Enterprise plan for organizations with data sovereignty requirements or limited internet connectivity. Contact our sales team for specifications and pricing.",
        "q8": "Is there a minimum contract period?",
        "a8": "Contract terms are flexible and discussed during your custom quote. Annual subscriptions typically include preferred pricing; month-to-month options are also available. Contact our team for details specific to your plan."
      }
    },
    "contact": {
      "heroTitle1": "Let's Talk About Your",
      "heroTitle2": "Business",
      "heroDescription": "Fill out the form and one of our ERP specialists will get back to you within 24 hours.",
      "badge1": "We reply within 24 hours",
      "badge2": "No commitment required",
      "badge3": "French · English",
      "formTitle": "Request a Free Demo",
      "formSubtitle": "Tell us about your business and we'll prepare a demo tailored to your needs.",
      "labelFirstName": "First Name",
      "labelLastName": "Last Name",
      "labelCompany": "Company Name",
      "labelEmail": "Work Email",
      "labelPhone": "Phone Number",
      "labelSize": "Company Size",
      "labelSelectSize": "Select company size",
      "labelModules": "Modules You're Interested In",
      "labelMessage": "Tell Us About Your Needs",
      "placeholderFirstName": "First name",
      "placeholderLastName": "Last name",
      "placeholderEmail": "you@company.com",
      "placeholderCompany": "Company name",
      "placeholderPhone": "+216 XX XXX XXX",
      "placeholderMessage": "What are you looking to solve?",
      "submit": "Request a demo",
      "sending": "Sending...",
      "successTitle": "Request Received!",
      "successMessage": "One of our specialists will contact you within 24 hours to schedule your personalized Inovexa demo.",
      "exploreProducts": "Explore Products",
      "sidebarResponseTitle": "We Reply Within 24 Hours",
      "sidebarResponseSubtitle": "Guaranteed response time",
      "sidebarResponseDesc": "Every demo request is reviewed personally by one of our industry specialists - never by a bot.",
      "officeTitle": "Our Office",
      "officeHeadquarters": "Headquarters",
      "officeEmail": "Email",
      "officePhone": "Phone",
      "officeWhatsapp": "WhatsApp",
      "hoursTitle": "Office Hours",
      "weekdays": "Monday - Friday",
      "weekdaysTime": "8:00 AM - 6:00 PM",
      "saturday": "Saturday",
      "saturdayTime": "9:00 AM - 1:00 PM",
      "sunday": "Sunday",
      "sundayTime": "Closed",
      "expectTitle": "What to Expect From Your Demo",
      "expectSubtitle": "A personalized 45-minute session - no generic slides, no sales pressure.",
      "expect1Title": "Tailored to Your Industry",
      "expect1Desc": "We research your sector before the call. Your demo shows Inovexa solving your specific operational challenges.",
      "expect2Title": "Live System - No Mockups",
      "expect2Desc": "You'll see the real platform - not a presentation deck. Ask questions, request specific screens, and interact directly.",
      "expect3Title": "Expert in Your Language",
      "expect3Desc": "Your specialist speaks French or English - whatever you're most comfortable with. No language barriers.",
      "expect4Title": "ROI Estimate Included",
      "expect4Desc": "We'll show you a cost-benefit analysis based on companies your size - so you can take a business case back to your team.",
      "heroReply24h": "Reply within 24h",
      "size1": "1–10 employees (Micro)",
      "size2": "11–50 employees (Small)",
      "size3": "51–200 employees (Medium)",
      "size4": "201–500 employees (Mid-Market)",
      "size5": "500+ employees (Enterprise)",
      "privacyA": "By submitting this form, you agree to our",
      "privacyB": ". We'll never share your information with third parties.",
      "afterHoursNote": "Outside office hours, email contact@inovexa-erp.com and we will reply on the next working day.",
      "modSalesCrm": "Sales & CRM",
      "errRequired": "Please fill in your first name, last name, company, and email address.",
      "errEmail": "Please enter a valid email address.",
      "errNetwork": "Unable to reach the server. Please check your connection or email us at contact@inovexa-erp.com",
      "errServer": "Server configuration error. Please contact us directly at contact@inovexa-erp.com",
      "errGeneric": "Something went wrong. Please try again.",
      "successThanks": "Thank you, {name}.",
      "successDetail": "One of our specialists will contact you at {email} within {time} to schedule your personalized Inovexa demo.",
      "success24h": "24 hours"
    },
    "blog": {
      "heroTitle1": "Insights on ERP,",
      "heroTitle2": "AI & Digital Transformation",
      "heroSubtitle": "Buying guides, implementation advice, AI in ERP and market analysis for growing businesses.",
      "latest": "Latest Articles",
      "featured": "Featured Article",
      "relatedArticles": "Related Articles",
      "newsletterTitle": "Get new articles by email",
      "newsletterDesc": "One short email when we publish something new. No spam.",
      "newsletterCta": "Contact Us to Subscribe",
      "ctaTitle": "Want to see Inovexa with your own processes?",
      "ctaSubtitle": "Book a personalized demo and see how Inovexa fits the way your team already works.",
      "minRead": "min read",
      "hub": "Knowledge Hub",
      "heroTags": "ERP · AI · Business",
      "pill": {
        "trends": "ERP Trends",
        "aiFinance": "AI & Finance",
        "implementation": "Implementation",
        "cloud": "Cloud ERP"
      },
      "filter": {
        "all": "All",
        "news": "ERP News",
        "ai": "AI & Automation",
        "saas": "SaaS",
        "startup": "Startups",
        "africa": "Global Markets",
        "supply": "Supply Chain",
        "finance": "Finance",
        "hr": "HR Tech",
        "manufacturing": "Manufacturing",
        "regional": "Regional",
        "erp": "ERP Basics"
      }
    },
    "blogPost": {
      "backToBlog": "Back to Blog",
      "relatedArticles": "Related Articles",
      "ctaTitle": "Want to see Inovexa in practice?",
      "ctaDesc": "Book a personalized demo with our team. No commitment required.",
      "author": "Inovexa Team",
      "authorRole": "ERP & AI Research, Inovexa - Tunis, Tunisia",
      "calloutInovexaTitle": "How Inovexa ERP Can Help Your Business"
    },
    "blogCards": {
      "aiErp": {
        "title": "How AI Is Transforming Modern ERP Systems in 2026"
      },
      "mlSupply": {
        "title": "5 Ways Machine Learning Is Changing Supply Chain Management in 2026"
      },
      "aiFinance": {
        "title": "The Future of Financial Automation: AI-Powered Accounting in ERP"
      },
      "aiHr": {
        "title": "AI-Driven HR: How Smart ERP Is Transforming Workforce Management"
      },
      "cloudAdoption": {
        "title": "Why Businesses Are Moving to Cloud ERP in 2026"
      },
      "manufacturing": {
        "title": "ERP for Manufacturing: Streamlining Production, Quality, and Compliance"
      },
      "digitalTransform": {
        "title": "Digital Transformation for SMEs: A Practical ERP Roadmap"
      },
      "multiCurrency": {
        "title": "Multi-Currency ERP: Managing Cross-Border Trade Across Markets"
      },
      "inventory": {
        "title": "Inventory Management Best Practices: How ERP Eliminates Stockouts and Overstock"
      },
      "whatIsErp": {
        "title": "What Is ERP? A Complete Guide for Business Owners in 2026"
      },
      "erpVsSheets": {
        "title": "ERP vs Spreadsheets: When Should Your Business Make the Switch?"
      },
      "howToChoose": {
        "title": "How to Choose the Right ERP for Your Business: A Step-by-Step Guide"
      },
      "erpRoi": {
        "title": "What's the ROI of ERP? Real Benefits Beyond the Sales Pitch"
      },
      "implementation": {
        "title": "ERP Implementation: A Realistic Timeline and What to Expect"
      },
      "cloudSecurity": {
        "title": "Is Cloud ERP Safe? Security, Data Privacy, and What to Look For"
      },
      "smallBusiness": {
        "title": "Do Small Businesses Need ERP? When It Makes Sense (and When It Doesn't)"
      },
      "agentic": {
        "title": "Agentic ERP in 2026: AI Agents Become Your Newest Employees",
        "desc": "What AI agents inside an ERP actually do today, where they help, and where a person still needs to decide."
      },
      "composable": {
        "title": "Composable ERP in 2026: Why Modular Architecture Beats Monolithic Suites",
        "descShort": "Why mid-market and SME businesses are dropping monolithic suites."
      },
      "medSme": {
        "title": "Growing SMEs and ERP: A Cross-Border Playbook",
        "descShort": "How growing SMEs in Europe and Africa are closing the ERP gap."
      },
      "tunisiaTextile": {
        "title": "ERP in Tunisia's Textile Industry: Inside the Industry 4.0 Shift",
        "descShort": "A 16-week rollout playbook for Tunisian textile factories."
      },
      "badgeMediterranean": "Global Markets",
      "badgeManufacturing": "Manufacturing",
      "badgeCornerstone": "Cornerstone",
      "badgeStartups": "Startups",
      "badgeSaaS": "SaaS",
      "erpTrends2026": {
        "title": "Top 10 ERP Trends Defining 2026: Agentic AI, Composable Architecture & Industry Clouds",
        "descShort": "Agentic AI, composable architecture and industry clouds: what changed and what it means for buyers."
      },
      "erpStartups": {
        "title": "ERP for Startups in 2026: A Founder's Complete Guide",
        "descShort": "When to buy, what to skip, and how to pick without burning runway."
      },
      "erpForSaas": {
        "title": "Best ERP for SaaS Companies in 2026: A Practical Comparison",
        "descShort": "NetSuite, Sage Intacct, Certinia and Inovexa compared on pricing, revenue recognition and fit."
      },
      "financeAgents": {
        "title": "AI Finance Agents Move to General Availability",
        "descShort": "Automated reconciliation agents are now generally available. What this changes for SME finance teams."
      },
      "badgeStrategy": "ERP Strategy",
      "badgeTunisiaIndustry": "Tunisia · Industry 4.0",
      "badgeMultiCurrency": "Multi-Currency",
      "badgeRoi": "ROI",
      "bestErp": {
        "title": "The 20 Best ERP Software Systems in 2026, Compared",
        "descShort": "SAP, Oracle, NetSuite, Business Central, Odoo and 15 more, grouped by company size with pricing models."
      },
      "netsuiteAlt": {
        "title": "10 Best NetSuite Alternatives in 2026",
        "descShort": "Who should switch, who should stay, and a step-by-step checklist for moving off NetSuite."
      },
      "openSourceErp": {
        "title": "12 Best Open-Source ERP Systems in 2026",
        "descShort": "Odoo, ERPNext, Dolibarr and more compared on license, stack and the real cost of \"free\"."
      },
      "erpIntegrations": {
        "title": "20 Apps Worth Connecting to Your ERP",
        "descShort": "Stripe, Shopify, HubSpot, DocuSign and more: what data should flow, and how to connect it."
      }
    },
    "fromBlog": {
      "label": "From the Blog",
      "title": "Practical guides on ERP and AI",
      "subtitle": "Buying guides, implementation advice and industry analysis from the Inovexa team.",
      "browseAll": "Browse all articles"
    },
    "resources": {
      "productsTitle": "Further Reading",
      "pricingTitle": "Before You Decide",
      "contactTitle": "While You Wait for Our Reply",
      "allArticles": "All articles"
    },
    "blogPosts": {
      "aiErp": {
        "title": "How AI Is Transforming Modern ERP Systems in 2026"
      },
      "mlSupply": {
        "title": "5 Ways Machine Learning Is Changing Supply Chain Management in 2026"
      },
      "aiFinance": {
        "title": "The Future of Financial Automation: AI-Powered Accounting in ERP"
      },
      "aiHr": {
        "title": "AI-Driven HR: How Smart ERP Is Transforming Workforce Management"
      },
      "cloudAdoption": {
        "title": "Why Businesses Are Moving to Cloud ERP in 2026"
      },
      "manufacturing": {
        "title": "ERP for Manufacturing: Streamlining Production, Quality, and Compliance"
      },
      "digitalTransform": {
        "title": "Digital Transformation for SMEs: A Practical ERP Roadmap"
      },
      "multiCurrency": {
        "title": "Multi-Currency ERP: Managing Cross-Border Trade Across Markets"
      },
      "inventory": {
        "title": "Inventory Management Best Practices: How ERP Eliminates Stockouts and Overstock"
      },
      "whatIsErp": {
        "title": "What Is ERP? A Complete Guide for Business Owners in 2026"
      },
      "erpVsSheets": {
        "title": "ERP vs Spreadsheets: When Should Your Business Make the Switch?"
      },
      "howToChoose": {
        "title": "How to Choose the Right ERP for Your Business: A Step-by-Step Guide"
      },
      "erpRoi": {
        "title": "What's the ROI of ERP? Real Benefits Beyond the Sales Pitch"
      },
      "implementation": {
        "title": "ERP Implementation: A Realistic Timeline and What to Expect"
      },
      "cloudSecurity": {
        "title": "Is Cloud ERP Safe? Security, Data Privacy, and What to Look For"
      },
      "smallBusiness": {
        "title": "Do Small Businesses Need ERP? When It Makes Sense (and When It Doesn't)"
      }
    },
    "about": {
      "ourStory": "Our Story",
      "heroTitle1": "Business software built in Tunis",
      "heroTitle2": "for companies everywhere",
      "heroDesc": "Inovexa was founded in Tunis in 2024 to give growing businesses the kind of ERP that used to be reserved for large corporations: finance, HR, supply chain, sales, and analytics in one cloud platform, at a price a small or mid-sized company can justify.",
      "badgeFounded": "Founded in Tunis, 2024",
      "badgeCountries": "Serving 12+ countries",
      "badgeMsai": "Part of MSAI Systems",
      "missionLabel": "Our Mission",
      "missionTitle": "Serious ERP at a price growing businesses can afford",
      "missionDesc": "Growing companies need what large ones need: accurate books, payroll that runs on time, stock figures they can trust, and reports they can act on. We build those tools as modules, so a business can start with what it needs today and add more as it grows, wherever it operates.",
      "visionLabel": "Our Vision",
      "visionTitle": "One ERP that works in any country",
      "visionDesc": "A company in Tunis, Toronto, or Nairobi should be able to run the same platform with its own tax rules, currency, and language. That is why every module we ship supports multiple countries, currencies, and languages from the start instead of having them added later.",
      "valuesLabel": "What We Stand For",
      "valuesTitle": "Our Core Values",
      "valuesSubtitle": "The principles we use when we decide what to build, how to price it, and how to support customers.",
      "value1Title": "Useful AI",
      "value1Desc": "We add AI where it saves measurable time, such as demand forecasting and spotting unusual transactions, and leave it out where it does not.",
      "value2Title": "Clear Pricing and Terms",
      "value2Desc": "No hidden fees and no surprise contracts. You know what you are getting, what it costs, and what is on our roadmap.",
      "value3Title": "Built for Real Teams",
      "value3Desc": "Teams work in French, Spanish, or English, and screens are designed for warehouse and shop-floor staff as well as accountants.",
      "value4Title": "Less Hardware",
      "value4Desc": "Cloud deployment replaces on-premise servers that run around the clock, so there is less hardware to buy, power, and maintain.",
      "statsLabel": "By the Numbers",
      "statsTitle": "Inovexa at a Glance",
      "statModules": "Integrated ERP Modules",
      "statCountries": "Countries Served",
      "statLanguages": "Languages (EN · FR · ES)",
      "statFounded": "Founded in Tunis",
      "storyTitle": "From Tunisia to the World",
      "story1": "Inovexa was born in 2024 in Tunis. Our founders had spent years watching Tunisian manufacturers, distributors, and growing companies struggle with fragmented tools: Excel spreadsheets, disconnected billing software, and manual HR processes. The problem wasn't a lack of ambition. It was a lack of the right tools.",
      "story2": "We asked a simple question: why does a factory in Sfax have to use 1990s-era software while a startup in San Francisco gets AI-native ERP on day one? The answer was always cost and complexity. So we decided to solve both.",
      "story3a": "Today, Inovexa is part of",
      "story3b": "and serves businesses in more than 12 countries from its base in Tunis. The goal has not changed: the depth of a large ERP, with the setup time and price of a modern SaaS product.",
      "tl1Label": "2024 · Launch",
      "tl1Title": "Inovexa founded in Tunis",
      "tl1Desc": "First modules launched: Finance, HR, and Sales CRM. First 10 clients onboarded within 6 months.",
      "tl2Label": "2025 · Expansion",
      "tl2Title": "First markets outside Tunisia",
      "tl2Desc": "Expanded to Morocco, France, Spain, and Italy. Added Supply Chain, Production, and AI Engine modules.",
      "tl3Label": "2026 · Today",
      "tl3Title": "11 modules in production",
      "tl3Desc": "All 11 modules live, with AI features across finance, supply chain, and analytics. Customers in 12+ countries, interface in 3 languages.",
      "ctaTitle": "Want to Work With Us?",
      "ctaDesc": "Customers, resellers, technology partners, and engineers: tell us what you are working on and we will get back to you within 24 hours.",
      "ctaPartner": "Partner With Us",
      "partOf": "Part of",
      "location": "· Tunis, Tunisia"
    },
    "notFound": {
      "title": "Page not found",
      "description": "The page you are looking for does not exist or has been moved. You will be redirected to the homepage in a few seconds.",
      "goHome": "Go to Homepage",
      "browseBlog": "Browse Blog",
      "contactUs": "Contact Us",
      "redirecting": "Redirecting to homepage…",
      "or": "or",
      "goNow": "go now",
      "cancelRedirect": "Cancel redirect"
    },
    "legal": {
      "privacyTitle1": "Privacy",
      "privacyTitle2": "Policy",
      "privacySubtitle": "How Inovexa ERP collects, uses, stores, and protects your personal information.",
      "lastUpdated": "Last updated: April 10, 2026",
      "termsTitle1": "Terms of",
      "termsTitle2": "Service",
      "termsSubtitle": "The legal agreement governing your access to and use of Inovexa ERP."
    }
  },
  "fr": {
    "nav": {
      "home": "Accueil",
      "products": "Produits",
      "pricing": "Tarifs",
      "blog": "Blog",
      "about": "À propos",
      "contact": "Contact",
      "requestDemo": "Demander une démo",
      "language": "Langue"
    },
    "cta": {
      "getStartedFree": "Commencer gratuitement",
      "bookDemo": "Réserver une démo",
      "requestDemo": "Demander une démo gratuite",
      "bookFreeDemo": "Réservez votre démo gratuite",
      "requestFreeConsultation": "Demander une consultation gratuite",
      "requestPricingInquiry": "Demander un devis",
      "contactSales": "Contacter les ventes",
      "contactSalesTeam": "Contacter l'équipe commerciale",
      "contactEnterprise": "Contacter Enterprise",
      "viewPricing": "Voir les tarifs",
      "learnMore": "En savoir plus",
      "read": "Lire",
      "readArticle": "Lire l'article",
      "backToBlog": "Retour au blog",
      "backToTop": "Retour en haut",
      "requestQuote": "Demander un devis",
      "talkToTeam": "Parler à notre équipe",
      "exploreIndustrySolutions": "Explorer les solutions sectorielles",
      "emailEnterprise": "Email Équipe Enterprise",
      "noCreditCard": "Aucune carte de crédit requise - essai gratuit de 30 jours"
    },
    "footer": {
      "tagline": "ERP cloud conçu en Tunisie, utilisé par des entreprises en croissance dans le monde entier.",
      "company": "Entreprise",
      "industries": "Industries",
      "getInTouch": "Nous contacter",
      "home": "Accueil",
      "products": "Produits",
      "pricing": "Tarifs",
      "blog": "Blog",
      "contact": "Contact",
      "manufacturing": "Industrie manufacturière",
      "retail": "Commerce de détail",
      "distribution": "Distribution",
      "healthcare": "Santé",
      "professionalServices": "Services professionnels",
      "agribusiness": "Agroalimentaire",
      "privacyPolicy": "Politique de confidentialité",
      "termsOfService": "Conditions d'utilisation",
      "cookiePolicy": "Politique de cookies",
      "rights": "Inovexa ERP. Tous droits réservés. · Fait partie de"
    },
    "theme": {
      "switchToLight": "Passer au mode clair",
      "switchToDark": "Passer au mode sombre"
    },
    "a11y": {
      "skipToContent": "Aller au contenu principal"
    },
    "index": {
      "heroTitle1": "L'avenir de",
      "heroDescription": "Inovexa ERP unifie RH, Finance, Supply Chain, Ventes et Analytique IA dans une seule plateforme cloud.",
      "whyLabel": "Pourquoi Inovexa",
      "whyTitle": "Un seul système au lieu de cinq",
      "whySubtitle": "Finance, RH, stocks et ventes partagent les mêmes données : plus personne ne ressaisit les chiffres d'un outil à l'autre.",
      "whyCard1Title": "Rapide sur toute connexion",
      "whyCard1Desc": "Les écrans s'ouvrent en moins d'une seconde dans les 11 modules, et l'application reste utilisable sur une connexion mobile lente.",
      "whyCard2Title": "Une sécurité vérifiable",
      "whyCard2Desc": "Les données sont chiffrées au repos et en transit. Les droits par rôle définissent qui voit quoi, et le journal d'audit enregistre chaque modification.",
      "whyCard3Title": "Commencez petit, ajoutez des modules ensuite",
      "whyCard3Desc": "Démarrez avec les modules utiles aujourd'hui et activez-en d'autres en grandissant, d'une équipe de 10 personnes à plusieurs milliers, sans migration.",
      "modulesLabel": "Modules",
      "modulesTitle": "11 modules qui fonctionnent ensemble",
      "modulesSubtitle": "Tous les modules lisent et écrivent les mêmes données : une commande client met à jour le stock, la facturation et les rapports automatiquement.",
      "modDashboard": "Tableau de bord",
      "modDashboardDesc": "Les chiffres clés de l'entreprise sur un seul écran",
      "modHR": "Ressources humaines",
      "modHRDesc": "Gestion complète du cycle de vie RH",
      "modFinance": "Finance",
      "modFinanceDesc": "Comptabilité, facturation et contrôle financier",
      "modSupply": "Supply Chain",
      "modSupplyDesc": "Niveaux de stock, transferts et délais fournisseurs",
      "modProd": "Production",
      "modProdDesc": "Planification de production et fabrication",
      "modPurch": "Achats",
      "modPurchDesc": "Achats & gestion fournisseurs",
      "modSales": "Ventes",
      "modSalesDesc": "CRM, commandes et suivi des revenus",
      "modLog": "Logistique",
      "modLogDesc": "Flotte, livraison et opérations d'entrepôt",
      "modAI": "Moteur IA",
      "modAIDesc": "Prévisions de la demande, alertes d'anomalies et actions suggérées à partir de vos propres données",
      "modReports": "Rapports",
      "modReportsDesc": "Conformité automatisée et rapports personnalisés",
      "modAnalytics": "Analytique",
      "modAnalyticsDesc": "Graphiques et KPI à filtrer et explorer en détail",
      "statsTitle": "Utilisé au quotidien par de vraies entreprises",
      "statsSubtitle": "Des petits distributeurs aux industriels multisites, des équipes dans de nombreux pays gèrent leurs opérations quotidiennes avec Inovexa.",
      "statsModules": "Entreprises",
      "statsModulesCap": "utilisent Inovexa aujourd'hui",
      "statsGoLive": "Mise en service",
      "statsGoLiveCap": "délai habituel pour un déploiement standard",
      "statsLanguages": "Pays",
      "statsLanguagesCap": "avec des clients actifs",
      "ctaTitle": "Découvrez comment Inovexa gérerait votre entreprise",
      "ctaSubtitle": "Une présentation de 30 minutes avec notre équipe, adaptée à votre secteur et à la taille de votre entreprise, en français ou en anglais. Sans engagement.",
      "heroRotate": "votre finance|vos RH|vos stocks|vos ventes|votre production",
      "heroTitleSr": "L'avenir de votre finance, de vos RH, de vos stocks, de vos ventes et de votre production",
      "heroSecondaryCta": "Voir les modules",
      "statsLabel": "Inovexa en chiffres",
      "statsMods": "Modules",
      "statsModsCap": "sur une base de données unique"
    },
    "products": {
      "heroDescription": "Inovexa ERP s'adapte à votre secteur avec des flux de travail sur mesure, une conformité locale et un déploiement modulaire.",
      "industriesLabel": "Industries que nous servons",
      "industriesTitle": "Des processus adaptés à votre secteur",
      "industriesSubtitle": "Quel que soit votre secteur, Inovexa s'adapte à votre réalité opérationnelle.",
      "indManuTitle": "Industrie manufacturière",
      "indRetailTitle": "Commerce de détail",
      "indDistTitle": "Distribution",
      "indHealthTitle": "Santé",
      "indProfTitle": "Services professionnels",
      "indAgriTitle": "Agroalimentaire",
      "compTitle": "Pourquoi Inovexa vs. un ERP traditionnel",
      "compLabel": "La différence Inovexa",
      "compInovexa": "Inovexa ERP",
      "compTraditional": "ERP traditionnel",
      "globalLabel": "Prêt pour le monde entier",
      "globalTitle": "Règles fiscales et devises pour chaque pays où vous vendez",
      "globalSubtitle": "Inovexa ERP prend en charge des règles fiscales et devises personnalisées pour pratiquement tous les pays.",
      "ctaTitle": "Trouvez votre solution sectorielle",
      "ctaSubtitle": "Parlez à l'un de nos spécialistes sectoriels - nous cartographierons les capacités d'Inovexa en fonction de vos défis opérationnels, gratuitement.",
      "entBadge": "Entreprise",
      "entTitle": "Besoin d'une solution ERP personnalisée ?",
      "entDesc": "Chaque entreprise a des flux de travail, des besoins de conformité et des exigences d'intégration uniques. Inovexa travaille avec des clients mid-market et grands comptes pour construire des déploiements ERP sur mesure.",
      "entDetails": "Configurations multi-entités, modules personnalisés, hébergement sur site, gestion de compte dédiée, garanties SLA et migration clé en main font partie de notre offre entreprise.",
      "entResponse": "Réponse sous 24 heures · Consultation gratuite",
      "heroEyebrow": "Plateforme",
      "heroModules": "11 modules · 6 secteurs",
      "heroH1a": "Adapté à",
      "heroH1b": "chaque secteur",
      "heroMore": "+2 autres secteurs",
      "industriesDesc": "Chaque secteur dispose de workflows préconfigurés, de modèles de conformité et de tableaux de bord KPI conçus selon le fonctionnement réel de votre activité.",
      "indManuDesc": "Gestion complète de l'usine, des matières premières aux produits finis, avec suivi de la production et contrôle qualité en temps réel.",
      "indManuB1": "Alertes de maintenance prédictive avant qu'une panne n'arrête la ligne",
      "indManuB2": "Planifiez vos achats de matières premières à partir des ordres de fabrication réels et des prévisions",
      "indManuB3": "Traçabilité complète, de la nomenclature à la livraison, avec points de contrôle qualité",
      "indRetailDesc": "Pilotez vos magasins physiques et votre e-commerce avec des stocks synchronisés, des données clients unifiées et un reporting omnicanal.",
      "indRetailB1": "Évitez ruptures et surstocks grâce à la prévision de la demande par l'IA",
      "indRetailB2": "Centralisez prix, promotions et programmes de fidélité",
      "indRetailB3": "Tableaux de bord des ventes en temps réel pour tous les magasins et canaux",
      "indDistDesc": "Gérez une distribution multi-dépôts avec planification des tournées, automatisation des entrepôts et niveaux de stock par site.",
      "indDistB1": "Planifiez automatiquement les tournées pour réduire les coûts du dernier kilomètre",
      "indDistB2": "Suivez chaque palette, référence et véhicule en temps réel",
      "indDistB3": "Automatisez le cross-docking et les transferts entre dépôts",
      "indHealthDesc": "Simplifiez la gestion des cliniques et hôpitaux : données patients conformes HIPAA, stocks médicaux et processus de facturation.",
      "indHealthB1": "Gérez les fournitures médicales avec suivi des dates de péremption et réapprovisionnement automatique",
      "indHealthB2": "Automatisez les plannings du personnel entre services et équipes",
      "indHealthB3": "Simplifiez les remboursements des assurances et le rapprochement de la facturation patients",
      "indProfDesc": "Suivez les heures facturables et les marges par projet grâce à la gestion de projet, la planification des ressources et la facturation clients intégrées.",
      "indProfB1": "Suivez temps, dépenses et marges des projets en temps réel",
      "indProfB2": "Automatisez les factures récurrentes et les renouvellements de contrats",
      "indProfB3": "CRM client à 360° avec l'historique complet des échanges",
      "indAgriDesc": "De l'exploitation à l'export : gérez cycles de culture, coûts des intrants, stockage et conformité du commerce international sur une seule plateforme.",
      "indAgriB1": "Suivez coûts saisonniers, rendements et rentabilité par parcelle",
      "indAgriB2": "Gérez les documents d'exportation et les certificats commerciaux",
      "indAgriB3": "Facturation multidevise pour les acheteurs internationaux",
      "getDemo": "Obtenir une démo",
      "compDesc": "Les projets ERP traditionnels prennent des mois et exigent souvent des développements supplémentaires pour la fiscalité locale, le multilingue et le multidevise. Inovexa intègre les trois dès le premier jour.",
      "compFeature": "Fonctionnalité",
      "compRowTime": "Délai de mise en œuvre",
      "compRowLang": "Support multilingue (EN / FR / ES)",
      "compRowTax": "Fiscalité et conformité propres à chaque pays",
      "compRowLicense": "Coût de licence initial",
      "compRowSupport": "Équipe de support locale",
      "compRowAi": "IA et analyse prédictive",
      "compRowOffline": "Accès mobile utilisable hors ligne",
      "compRowOfflineShort": "Accès mobile hors ligne",
      "compTimeInovexa": "2 à 4 semaines",
      "compTimeTrad": "6 à 18 mois",
      "compLicenseInovexa": "Aucune licence à payer d'avance",
      "compLicenseInovexaShort": "Aucun",
      "compLicenseTrad": "Souvent six chiffres d'avance",
      "compAiTrad": "Module payant en supplément",
      "compAiTradShort": "En option payante",
      "compTraditionalShort": "Traditionnel",
      "taxTitle": "Moteur fiscal personnalisable",
      "taxDesc": "Configurez toute règle fiscale : TVA tunisienne, TVA européenne, VAT britannique, sales tax américaine, retenues à la source, droits d’accise et exonérations propres à chaque pays. Mettez à jour les taux sans toucher au code.",
      "currencyTitle": "Plus de 180 devises",
      "currencyDesc": "Facturation multidevise, taux de change en temps réel et reporting consolidé dans la devise de votre choix. Facturez en TND, EUR, USD, GBP, SAR, AED ou toute autre devise demandée par vos clients.",
      "complianceTitle": "Conformité propre à chaque pays",
      "complianceDesc": "Préconfiguré pour les règles fiscales locales, les obligations de facturation électronique et les formats de déclaration légale de dizaines de pays. De nouvelles juridictions sont ajoutées en continu selon la demande des clients.",
      "missingCountryQ": "Votre pays n'apparaît pas ?",
      "missingCountryLink": "Parlez à notre équipe",
      "missingCountryRest": ". Nous ajoutons de nouvelles juridictions selon la demande."
    },
    "pricing": {
      "heroTitle1": "Des plans flexibles pour",
      "heroTitle2": "Toute taille d'entreprise",
      "heroDescription": "Chaque entreprise est unique. Contactez-nous pour un devis personnalisé adapté à votre taille, aux modules choisis et à vos exigences spécifiques.",
      "cardsSubtitle": "Choisissez le plan qui convient à votre équipe, puis contactez-nous pour votre devis personnalisé.",
      "starter": "Starter",
      "business": "Business",
      "enterprise": "Enterprise",
      "mostPopular": "Le plus populaire",
      "contactForPricing": "Contactez-nous pour les tarifs",
      "customPricing": "Tarifs personnalisés",
      "starterDesc": "Parfait pour les petites entreprises prêtes à moderniser leurs opérations et à abandonner les tableurs.",
      "businessDesc": "Pour les entreprises en croissance qui ont besoin de toute la puissance d'un ERP intégré dans tous les départements opérationnels.",
      "enterpriseDesc": "Pour les grandes entreprises, organismes publics et organisations avec des exigences complexes et multi-entités.",
      "whatIncluded": "Ce qui est inclus",
      "everythingInStarter": "Tout dans Starter, plus",
      "everythingInBusiness": "Tout dans Business, plus",
      "comparisonTitle": "Comparaison complète des fonctionnalités",
      "comparisonSubtitle": "Voyez exactement ce qui est inclus dans chaque plan",
      "faqLabel": "FAQ",
      "faqTitle": "Questions fréquentes",
      "faqSubtitle": "Tout ce que vous devez savoir avant de commencer.",
      "stillQuestions": "Vous avez encore des questions ? Nous sommes heureux de vous aider.",
      "allPlansInclude": "Tous les plans incluent un support complet de migration de données et un spécialiste d'intégration dédié.",
      "talkToSalesTeam": "Parlez à notre équipe commerciale pour un devis personnalisé",
      "exploreModules": "Découvrir les modules",
      "plansLabel": "Formules :",
      "f": {
        "users25": "Jusqu'à 25 utilisateurs",
        "coreModules": "Modules Finance, RH et Ventes",
        "storage50": "50 Go de stockage cloud",
        "reports50": "Rapports standard (plus de 50)",
        "emailChat": "Support par e-mail et chat",
        "mobile": "Accès à l'application mobile",
        "aiEngine": "Moteur IA",
        "customIntegrations": "Intégrations sur mesure",
        "users150": "Jusqu'à 150 utilisateurs",
        "allModules": "Les 11 modules inclus",
        "storage500": "500 Go de stockage cloud",
        "aiFull": "Moteur IA (accès complet)",
        "reports200": "Plus de 200 modèles de rapports",
        "phone": "Support téléphonique prioritaire",
        "integrations50": "50 intégrations standard",
        "usersUnlimited": "Utilisateurs illimités",
        "storageUnlimited": "Stockage illimité",
        "multiEntity": "Multi-entités / multi-pays",
        "onPremise": "Option de déploiement sur site",
        "accountManager": "Gestionnaire de compte dédié",
        "sla": "SLA personnalisé (99,99 % de disponibilité)",
        "integrationsApi": "Intégrations sur mesure et API"
      },
      "cmp": {
        "gCore": "Modules principaux",
        "gIntel": "Intelligence et analytique",
        "gSupport": "Support et infrastructure",
        "finance": "Finance et comptabilité",
        "hr": "Ressources humaines",
        "sales": "Ventes et CRM",
        "supply": "Chaîne d'approvisionnement et stocks",
        "production": "Production et fabrication",
        "logistics": "Logistique et flotte",
        "reports": "Rapports standard (plus de 50)",
        "analytics": "Analytique avancée",
        "aiForecast": "Prévision de la demande par IA",
        "emailChat": "Support par e-mail et chat",
        "phone": "Support téléphonique prioritaire",
        "accountManager": "Gestionnaire de compte dédié",
        "onPremise": "Déploiement sur site"
      },
      "faq": {
        "q1": "Puis-je voir une démo avant de m'engager ?",
        "a1": "Oui. Chaque prospect bénéficie d'une démo en direct personnalisée avec notre équipe, adaptée à votre secteur et à vos cas d'usage. Sans carte bancaire ni engagement : juste un échange pour vérifier qu'Inovexa répond à vos besoins.",
        "q2": "Puis-je changer de formule à tout moment ?",
        "a2": "Oui. Vous pouvez passer à une formule supérieure ou inférieure à tout moment. Une montée en gamme prend effet immédiatement ; un passage à une formule inférieure prend effet à la fin du cycle de facturation en cours. Votre gestionnaire de compte dédié s'occupe de la transition.",
        "q3": "Comment se déroule la migration des données ?",
        "a3": "Notre équipe de déploiement prend en charge toute la migration de vos données depuis votre système actuel, qu'il s'agisse de tableurs, d'un autre ERP ou d'un ancien logiciel comptable. Nous avons déjà migré des données depuis SAP, Sage, QuickBooks et des dizaines de systèmes sur mesure. La migration est incluse dans toutes les formules.",
        "q4": "Inovexa gère-t-il la fiscalité locale de mon pays ?",
        "a4": "Oui. Le moteur fiscal se configure pays par pays. Nous prenons en charge la TVA tunisienne, la TVA marocaine, la facturation électronique égyptienne et la TVA européenne, et ajoutons de nouvelles juridictions selon la demande des clients. Les taux sont mis à jour au fil des évolutions réglementaires.",
        "q5": "Quelles langues Inovexa prend-il en charge ?",
        "a5": "Inovexa est disponible en français et en anglais dans tous les modules et pour tous les documents générés par le système (factures, rapports, contrats). La langue se définit pour chaque utilisateur.",
        "q6": "Que deviennent mes données si je résilie ?",
        "a6": "Vos données vous appartiennent à 100 %. En cas de résiliation, vous recevez un export complet de toutes vos données dans des formats standard (CSV, Excel, JSON, PDF). Nous les conservons 90 jours après la résiliation avant leur suppression définitive.",
        "q7": "Proposez-vous un déploiement sur site ?",
        "a7": "Oui, le déploiement sur site est disponible avec la formule Enterprise pour les organisations soumises à des exigences de souveraineté des données ou disposant d'une connexion internet limitée. Contactez notre équipe commerciale pour connaître les prérequis et les tarifs.",
        "q8": "Y a-t-il une durée minimale d'engagement ?",
        "a8": "Les conditions contractuelles sont flexibles et définies lors de l'établissement de votre devis. Les abonnements annuels bénéficient généralement de tarifs préférentiels ; des formules mensuelles sont également disponibles. Contactez notre équipe pour les détails propres à votre formule."
      }
    },
    "contact": {
      "heroTitle1": "Parlons de votre",
      "heroTitle2": "Entreprise",
      "heroDescription": "Remplissez le formulaire et l'un de nos spécialistes ERP vous recontactera sous 24 heures.",
      "badge1": "Réponse sous 24 heures",
      "badge2": "Sans engagement",
      "badge3": "Français · Anglais",
      "formTitle": "Demander une démo gratuite",
      "formSubtitle": "Parlez-nous de votre entreprise et nous préparerons une démo adaptée à vos besoins.",
      "labelFirstName": "Prénom",
      "labelLastName": "Nom",
      "labelCompany": "Nom de l'entreprise",
      "labelEmail": "Email professionnel",
      "labelPhone": "Numéro de téléphone",
      "labelSize": "Taille de l'entreprise",
      "labelSelectSize": "Sélectionnez la taille",
      "labelModules": "Modules qui vous intéressent",
      "labelMessage": "Parlez-nous de vos besoins",
      "placeholderFirstName": "Prénom",
      "placeholderLastName": "Nom de famille",
      "placeholderEmail": "vous@entreprise.com",
      "placeholderCompany": "Nom de l'entreprise",
      "placeholderPhone": "+216 XX XXX XXX",
      "placeholderMessage": "Quelle problématique cherchez-vous à résoudre ?",
      "submit": "Demander une démo",
      "sending": "Envoi en cours...",
      "successTitle": "Demande reçue !",
      "successMessage": "L'un de nos spécialistes vous contactera sous 24 heures pour planifier votre démo Inovexa personnalisée.",
      "exploreProducts": "Découvrir les produits",
      "sidebarResponseTitle": "Réponse sous 24 heures",
      "sidebarResponseSubtitle": "Temps de réponse garanti",
      "sidebarResponseDesc": "Chaque demande de démo est examinée personnellement par l'un de nos spécialistes sectoriels, jamais par un bot.",
      "officeTitle": "Notre bureau",
      "officeHeadquarters": "Siège social",
      "officeEmail": "Email",
      "officePhone": "Téléphone",
      "officeWhatsapp": "WhatsApp",
      "hoursTitle": "Heures d'ouverture",
      "weekdays": "Lundi - Vendredi",
      "weekdaysTime": "8h00 - 18h00",
      "saturday": "Samedi",
      "saturdayTime": "9h00 - 13h00",
      "sunday": "Dimanche",
      "sundayTime": "Fermé",
      "expectTitle": "Ce que votre démo vous apportera",
      "expectSubtitle": "Une session personnalisée de 45 minutes - pas de diaporamas génériques, pas de pression commerciale.",
      "expect1Title": "Adapté à votre secteur",
      "expect1Desc": "Nous étudions votre secteur avant l'appel. Votre démo montre comment Inovexa résout vos défis opérationnels spécifiques.",
      "expect2Title": "Système réel - pas de maquettes",
      "expect2Desc": "Vous verrez la vraie plateforme, pas un jeu de diapositives. Posez des questions, demandez des écrans spécifiques et interagissez directement.",
      "expect3Title": "Un expert dans votre langue",
      "expect3Desc": "Votre spécialiste parle français ou anglais, selon votre préférence. Pas de barrière linguistique.",
      "expect4Title": "Estimation de ROI incluse",
      "expect4Desc": "Nous vous montrerons une analyse coûts-bénéfices basée sur des entreprises de votre taille.",
      "heroReply24h": "Réponse sous 24 h",
      "size1": "Micro (1 à 10 salariés)",
      "size2": "Petite (11 à 50 salariés)",
      "size3": "Moyenne (51 à 200 salariés)",
      "size4": "ETI (201 à 500 salariés)",
      "size5": "Grande entreprise (plus de 500 salariés)",
      "privacyA": "En envoyant ce formulaire, vous acceptez notre",
      "privacyB": ". Nous ne partagerons jamais vos informations avec des tiers.",
      "afterHoursNote": "En dehors des heures d'ouverture, écrivez à contact@inovexa-erp.com ; nous répondrons le jour ouvré suivant.",
      "modSalesCrm": "Ventes et CRM",
      "errRequired": "Veuillez indiquer votre prénom, votre nom, votre entreprise et votre adresse e-mail.",
      "errEmail": "Veuillez saisir une adresse e-mail valide.",
      "errNetwork": "Impossible de joindre le serveur. Vérifiez votre connexion ou écrivez-nous à contact@inovexa-erp.com",
      "errServer": "Erreur de configuration du serveur. Contactez-nous directement à contact@inovexa-erp.com",
      "errGeneric": "Une erreur s'est produite. Veuillez réessayer.",
      "successThanks": "Merci, {name}.",
      "successDetail": "L'un de nos spécialistes vous contactera à l'adresse {email} sous {time} pour planifier votre démo Inovexa personnalisée.",
      "success24h": "24 heures"
    },
    "blog": {
      "heroTitle1": "Perspectives sur l'ERP,",
      "heroTitle2": "l'IA et la transformation numérique",
      "heroSubtitle": "Guides d'achat, conseils de mise en œuvre, IA dans l'ERP et analyses de marché pour les entreprises en croissance.",
      "latest": "Derniers articles",
      "featured": "Article en vedette",
      "relatedArticles": "Articles connexes",
      "newsletterTitle": "Recevez les nouveaux articles par e-mail",
      "newsletterDesc": "Un court e-mail à chaque nouvelle publication. Pas de spam.",
      "newsletterCta": "Contactez-nous pour vous abonner",
      "ctaTitle": "Voir Inovexa appliqué à vos processus ?",
      "ctaSubtitle": "Réservez une démo personnalisée et voyez comment Inovexa s'adapte à la façon dont votre équipe travaille déjà.",
      "minRead": "min de lecture",
      "hub": "Centre de ressources",
      "heroTags": "ERP · IA · Entreprise",
      "pill": {
        "trends": "Tendances ERP",
        "aiFinance": "IA et finance",
        "implementation": "Mise en œuvre",
        "cloud": "ERP cloud"
      },
      "filter": {
        "all": "Tous",
        "news": "Actualités ERP",
        "ai": "IA et automatisation",
        "saas": "SaaS",
        "startup": "Startups",
        "africa": "Marchés internationaux",
        "supply": "Chaîne d'approvisionnement",
        "finance": "Finance",
        "hr": "Tech RH",
        "manufacturing": "Industrie",
        "regional": "Guides par pays",
        "erp": "Bases de l'ERP"
      }
    },
    "blogPost": {
      "backToBlog": "Retour au blog",
      "relatedArticles": "Articles connexes",
      "ctaTitle": "Voir Inovexa en pratique ?",
      "ctaDesc": "Réservez une démo personnalisée avec notre équipe. Sans engagement.",
      "author": "Inovexa Team",
      "authorRole": "Recherche ERP & IA, Inovexa - Tunis, Tunisie",
      "calloutInovexaTitle": "Comment Inovexa ERP peut aider votre entreprise"
    },
    "blogCards": {
      "aiErp": {
        "title": "Comment l'IA transforme les systèmes ERP modernes en 2026"
      },
      "mlSupply": {
        "title": "5 façons dont le machine learning change la gestion de la Supply Chain en 2026"
      },
      "aiFinance": {
        "title": "L'avenir de l'automatisation financière : la comptabilité pilotée par l'IA dans l'ERP"
      },
      "aiHr": {
        "title": "RH pilotées par l'IA : comment l'ERP intelligent transforme la gestion des effectifs"
      },
      "cloudAdoption": {
        "title": "Pourquoi les entreprises migrent vers l'ERP cloud en 2026"
      },
      "manufacturing": {
        "title": "ERP pour l'industrie : rationaliser production, qualité et conformité"
      },
      "digitalTransform": {
        "title": "Transformation numérique pour PME : une feuille de route ERP pratique"
      },
      "multiCurrency": {
        "title": "ERP multi-devises : gérer le commerce transfrontalier sur tous les marchés"
      },
      "inventory": {
        "title": "Bonnes pratiques de gestion des stocks : comment l'ERP élimine ruptures et surstocks"
      },
      "whatIsErp": {
        "title": "Qu'est-ce qu'un ERP ? Guide complet pour dirigeants d'entreprise en 2026"
      },
      "erpVsSheets": {
        "title": "ERP vs tableurs : quand votre entreprise doit-elle faire la transition ?"
      },
      "howToChoose": {
        "title": "Comment choisir le bon ERP pour votre entreprise : guide étape par étape"
      },
      "erpRoi": {
        "title": "Quel est le ROI d'un ERP ? Les vrais bénéfices au-delà du discours commercial"
      },
      "implementation": {
        "title": "Mise en œuvre d'un ERP : calendrier réaliste et ce à quoi s'attendre"
      },
      "cloudSecurity": {
        "title": "L'ERP cloud est-il sûr ? Sécurité, confidentialité et ce qu'il faut rechercher"
      },
      "smallBusiness": {
        "title": "Les petites entreprises ont-elles besoin d'un ERP ? Quand cela a du sens (et quand non)"
      },
      "agentic": {
        "title": "ERP agentique en 2026 : les agents IA deviennent vos nouveaux collaborateurs",
        "desc": "Ce que les agents IA d'un ERP font réellement aujourd'hui, où ils aident, et où une personne doit encore décider."
      },
      "composable": {
        "title": "ERP composable en 2026 : pourquoi l'architecture modulaire l'emporte sur les suites monolithiques",
        "descShort": "Pourquoi les PME et le mid-market abandonnent les suites monolithiques."
      },
      "medSme": {
        "title": "PME en croissance et ERP : guide pour les entreprises transfrontalières",
        "descShort": "Comment les PME en croissance d'Europe et d'Afrique comblent leur retard en matière d'ERP."
      },
      "tunisiaTextile": {
        "title": "L'ERP dans l'industrie textile tunisienne : au cœur de la transition Industrie 4.0",
        "descShort": "Un plan de déploiement de 16 semaines pour les usines textiles tunisiennes."
      },
      "badgeMediterranean": "Marchés internationaux",
      "badgeManufacturing": "Industrie",
      "badgeCornerstone": "Article de fond",
      "badgeStartups": "Startups",
      "badgeSaaS": "SaaS",
      "erpTrends2026": {
        "title": "Top 10 des tendances ERP en 2026 : IA agentique, architecture composable et nuages sectoriels",
        "descShort": "IA agentique, architecture composable et clouds sectoriels : ce qui a changé et ce que cela implique pour les acheteurs."
      },
      "erpStartups": {
        "title": "ERP pour les startups en 2026 : le guide complet du fondateur",
        "descShort": "Quand acheter, quoi ignorer, et comment choisir sans brûler de trésorerie."
      },
      "erpForSaas": {
        "title": "Meilleur ERP pour les entreprises SaaS en 2026 : une comparaison pratique",
        "descShort": "NetSuite, Sage Intacct, Certinia et Inovexa comparés sur le prix, la reconnaissance du revenu et l'adéquation."
      },
      "financeAgents": {
        "title": "Les agents IA pour la finance passent en disponibilité générale",
        "descShort": "Les agents de rapprochement automatisé sont désormais disponibles. Ce que cela change pour les équipes financières des PME."
      },
      "badgeStrategy": "Stratégie ERP",
      "badgeTunisiaIndustry": "Tunisie · Industrie 4.0",
      "badgeMultiCurrency": "Multidevise",
      "badgeRoi": "ROI",
      "bestErp": {
        "title": "Les 20 meilleurs logiciels ERP en 2026 : comparatif",
        "descShort": "SAP, Oracle, NetSuite, Business Central, Odoo et 15 autres, classés par taille d'entreprise avec leur modèle de prix."
      },
      "netsuiteAlt": {
        "title": "Les 10 meilleures alternatives à NetSuite en 2026",
        "descShort": "Qui devrait changer, qui devrait rester, et une checklist étape par étape pour quitter NetSuite."
      },
      "openSourceErp": {
        "title": "Les 12 meilleurs ERP open source en 2026",
        "descShort": "Odoo, ERPNext, Dolibarr et d'autres comparés sur la licence, la technologie et le vrai coût du « gratuit »."
      },
      "erpIntegrations": {
        "title": "20 applications à connecter à votre ERP",
        "descShort": "Stripe, Shopify, HubSpot, DocuSign et d'autres : quelles données synchroniser, et comment les connecter."
      }
    },
    "fromBlog": {
      "label": "Depuis le blog",
      "title": "Guides pratiques sur l'ERP et l'IA",
      "subtitle": "Guides d'achat, conseils de mise en œuvre et analyses sectorielles par l'équipe Inovexa.",
      "browseAll": "Parcourir tous les articles"
    },
    "resources": {
      "productsTitle": "Pour aller plus loin",
      "pricingTitle": "Avant de décider",
      "contactTitle": "En attendant notre réponse",
      "allArticles": "Tous les articles"
    },
    "blogPosts": {
      "aiErp": {
        "title": "Comment l'IA transforme les systèmes ERP modernes en 2026"
      },
      "mlSupply": {
        "title": "5 façons dont le machine learning transforme la gestion de la chaîne d'approvisionnement en 2026"
      },
      "aiFinance": {
        "title": "L'avenir de l'automatisation financière : la comptabilité pilotée par l'IA dans l'ERP"
      },
      "aiHr": {
        "title": "RH pilotées par l'IA : comment l'ERP intelligent transforme la gestion des effectifs"
      },
      "cloudAdoption": {
        "title": "Pourquoi les entreprises migrent vers l'ERP cloud en 2026"
      },
      "manufacturing": {
        "title": "ERP pour l'industrie : rationaliser production, qualité et conformité"
      },
      "digitalTransform": {
        "title": "Transformation numérique pour PME : une feuille de route ERP pratique"
      },
      "multiCurrency": {
        "title": "ERP multi-devises : gérer le commerce transfrontalier sur tous les marchés"
      },
      "inventory": {
        "title": "Bonnes pratiques de gestion des stocks : comment l'ERP élimine ruptures et surstocks"
      },
      "whatIsErp": {
        "title": "Qu'est-ce qu'un ERP ? Guide complet pour dirigeants d'entreprise en 2026"
      },
      "erpVsSheets": {
        "title": "ERP vs tableurs : quand votre entreprise doit-elle faire la transition ?"
      },
      "howToChoose": {
        "title": "Comment choisir le bon ERP pour votre entreprise : guide étape par étape"
      },
      "erpRoi": {
        "title": "Quel est le ROI d'un ERP ? Les vrais bénéfices au-delà du discours commercial"
      },
      "implementation": {
        "title": "Mise en œuvre d'un ERP : calendrier réaliste et ce à quoi s'attendre"
      },
      "cloudSecurity": {
        "title": "L'ERP cloud est-il sûr ? Sécurité, confidentialité et ce qu'il faut rechercher"
      },
      "smallBusiness": {
        "title": "Les petites entreprises ont-elles besoin d'un ERP ? Quand cela a du sens (et quand non)"
      }
    },
    "about": {
      "ourStory": "Notre histoire",
      "heroTitle1": "Un logiciel de gestion conçu à Tunis",
      "heroTitle2": "pour les entreprises du monde entier",
      "heroDesc": "Inovexa a été fondée à Tunis en 2024 pour offrir aux entreprises en croissance un ERP jusque-là réservé aux grands groupes : finance, RH, chaîne d'approvisionnement, ventes et analytique réunies dans une seule plateforme cloud, à un prix qu'une PME peut justifier.",
      "badgeFounded": "Fondée à Tunis en 2024",
      "badgeCountries": "Présente dans plus de 12 pays",
      "badgeMsai": "Fait partie de MSAI Systems",
      "missionLabel": "Notre mission",
      "missionTitle": "Un ERP sérieux, à un prix accessible aux entreprises en croissance",
      "missionDesc": "Les entreprises en croissance ont les mêmes besoins que les grandes : une comptabilité exacte, une paie versée à temps, des stocks fiables et des rapports exploitables. Nous concevons ces outils sous forme de modules : chaque entreprise démarre avec ce dont elle a besoin aujourd'hui et en ajoute à mesure qu'elle se développe, où qu'elle opère.",
      "visionLabel": "Notre vision",
      "visionTitle": "Un seul ERP, utilisable dans tous les pays",
      "visionDesc": "Une entreprise à Tunis, Toronto ou Nairobi doit pouvoir utiliser la même plateforme avec ses propres règles fiscales, sa devise et sa langue. C'est pourquoi chaque module que nous livrons prend en charge plusieurs pays, devises et langues dès le départ, au lieu de les ajouter après coup.",
      "valuesLabel": "Ce qui nous guide",
      "valuesTitle": "Nos valeurs",
      "valuesSubtitle": "Les principes qui guident nos choix : ce que nous développons, à quel prix, et comment nous accompagnons nos clients.",
      "value1Title": "Une IA utile",
      "value1Desc": "Nous intégrons l'IA là où elle fait gagner un temps mesurable, comme la prévision de la demande ou la détection de transactions inhabituelles, et nous nous en passons ailleurs.",
      "value2Title": "Des prix et des conditions clairs",
      "value2Desc": "Pas de frais cachés ni de contrats surprises. Vous savez ce que vous obtenez, ce que cela coûte et ce que prévoit notre feuille de route.",
      "value3Title": "Pensé pour les équipes de terrain",
      "value3Desc": "Les équipes travaillent en français, en espagnol ou en anglais, et les écrans sont conçus pour le personnel d'entrepôt et d'atelier comme pour les comptables.",
      "value4Title": "Moins de matériel",
      "value4Desc": "Le déploiement cloud remplace les serveurs sur site qui tournent jour et nuit : moins de matériel à acheter, à alimenter et à entretenir.",
      "statsLabel": "En chiffres",
      "statsTitle": "Inovexa en un coup d'œil",
      "statModules": "Modules ERP intégrés",
      "statCountries": "Pays desservis",
      "statLanguages": "Langues (EN · FR · ES)",
      "statFounded": "Fondée à Tunis",
      "storyTitle": "De la Tunisie au reste du monde",
      "story1": "Inovexa est née en 2024 à Tunis. Pendant des années, nos fondateurs avaient vu des industriels, des distributeurs et des entreprises tunisiennes en croissance se débattre avec des outils éparpillés : tableurs Excel, logiciels de facturation isolés et processus RH manuels. Le problème n'était pas le manque d'ambition, mais le manque d'outils adaptés.",
      "story2": "Nous nous sommes posé une question simple : pourquoi une usine de Sfax doit-elle se contenter d'un logiciel des années 1990, alors qu'une startup de San Francisco dispose dès le premier jour d'un ERP doté nativement d'IA ? La réponse était toujours la même : le coût et la complexité. Nous avons donc décidé de résoudre les deux.",
      "story3a": "Aujourd'hui, Inovexa fait partie de",
      "story3b": "et accompagne des entreprises dans plus de 12 pays depuis son siège de Tunis. L'objectif n'a pas changé : la richesse fonctionnelle d'un grand ERP, avec le délai de mise en place et le prix d'un SaaS moderne.",
      "tl1Label": "2024 · Lancement",
      "tl1Title": "Création d'Inovexa à Tunis",
      "tl1Desc": "Lancement des premiers modules : Finance, RH et CRM commercial. Les 10 premiers clients intégrés en 6 mois.",
      "tl2Label": "2025 · Expansion",
      "tl2Title": "Premiers marchés hors de Tunisie",
      "tl2Desc": "Arrivée au Maroc, en France, en Espagne et en Italie. Ajout des modules Chaîne d'approvisionnement, Production et Moteur IA.",
      "tl3Label": "2026 · Aujourd'hui",
      "tl3Title": "11 modules en production",
      "tl3Desc": "Les 11 modules sont en service, avec des fonctions d'IA en finance, en chaîne d'approvisionnement et en analytique. Des clients dans plus de 12 pays, une interface en 3 langues.",
      "ctaTitle": "Envie de travailler avec nous ?",
      "ctaDesc": "Clients, revendeurs, partenaires technologiques ou ingénieurs : parlez-nous de votre projet et nous vous répondrons sous 24 heures.",
      "ctaPartner": "Devenir partenaire",
      "partOf": "Fait partie de",
      "location": "· Tunis, Tunisie"
    },
    "notFound": {
      "title": "Page introuvable",
      "description": "La page que vous recherchez n'existe pas ou a été déplacée. Vous allez être redirigé vers la page d'accueil dans quelques secondes.",
      "goHome": "Retour à l'accueil",
      "browseBlog": "Parcourir le blog",
      "contactUs": "Nous contacter",
      "redirecting": "Redirection vers l'accueil…",
      "or": "ou",
      "goNow": "y aller maintenant",
      "cancelRedirect": "Annuler la redirection"
    },
    "legal": {
      "privacyTitle1": "Politique de",
      "privacyTitle2": "confidentialité",
      "privacySubtitle": "Comment Inovexa ERP collecte, utilise, conserve et protège vos données personnelles.",
      "lastUpdated": "Dernière mise à jour : 10 avril 2026",
      "termsTitle1": "Conditions",
      "termsTitle2": "d'utilisation",
      "termsSubtitle": "L'accord juridique qui régit votre accès à Inovexa ERP et son utilisation."
    }
  },
  "es": {
    "nav": {
      "home": "Inicio",
      "products": "Productos",
      "pricing": "Precios",
      "blog": "Blog",
      "about": "Nosotros",
      "contact": "Contacto",
      "requestDemo": "Solicitar demo",
      "language": "Idioma"
    },
    "cta": {
      "getStartedFree": "Comenzar gratis",
      "bookDemo": "Reservar demo",
      "requestDemo": "Solicitar demo gratuita",
      "bookFreeDemo": "Reserva tu demo gratuita",
      "requestFreeConsultation": "Solicitar consulta gratuita",
      "requestPricingInquiry": "Solicitar cotización",
      "contactSales": "Contactar ventas",
      "contactSalesTeam": "Contactar equipo de ventas",
      "contactEnterprise": "Contactar Enterprise",
      "viewPricing": "Ver precios",
      "learnMore": "Más información",
      "read": "Leer",
      "readArticle": "Leer artículo",
      "backToBlog": "Volver al blog",
      "backToTop": "Volver arriba",
      "requestQuote": "Solicitar cotización",
      "talkToTeam": "Habla con nuestro equipo",
      "exploreIndustrySolutions": "Explorar soluciones por industria",
      "emailEnterprise": "Email Equipo Enterprise",
      "noCreditCard": "No se requiere tarjeta de crédito - prueba gratis de 30 días"
    },
    "footer": {
      "tagline": "ERP en la nube creado en Túnez, utilizado por empresas en crecimiento de todo el mundo.",
      "company": "Empresa",
      "industries": "Industrias",
      "getInTouch": "Contacto",
      "home": "Inicio",
      "products": "Productos",
      "pricing": "Precios",
      "blog": "Blog",
      "contact": "Contact",
      "manufacturing": "Manufactura",
      "retail": "Comercio minorista",
      "distribution": "Distribution",
      "healthcare": "Salud",
      "professionalServices": "Servicios profesionales",
      "agribusiness": "Agroindustria",
      "privacyPolicy": "Política de privacidad",
      "termsOfService": "Términos de servicio",
      "cookiePolicy": "Política de cookies",
      "rights": "Inovexa ERP. Todos los derechos reservados. · Forma parte de"
    },
    "theme": {
      "switchToLight": "Cambiar a modo claro",
      "switchToDark": "Cambiar a modo oscuro"
    },
    "a11y": {
      "skipToContent": "Ir al contenido principal"
    },
    "index": {
      "heroTitle1": "El futuro de",
      "heroDescription": "Inovexa ERP unifica RR. HH., Finanzas, Supply Chain, Ventas y Analítica de IA en una sola plataforma en la nube.",
      "whyLabel": "Por qué Inovexa",
      "whyTitle": "Un solo sistema en lugar de cinco",
      "whySubtitle": "Finanzas, RR. HH., inventario y ventas comparten los mismos datos, así que nadie vuelve a teclear cifras de una herramienta a otra.",
      "whyCard1Title": "Rápido con cualquier conexión",
      "whyCard1Desc": "Las pantallas se abren en menos de un segundo en los 11 módulos, y la aplicación sigue siendo usable con conexiones móviles lentas.",
      "whyCard2Title": "Seguridad que puedes comprobar",
      "whyCard2Desc": "Los datos se cifran en reposo y en tránsito. Los permisos por rol controlan quién ve qué, y el registro de auditoría guarda cada cambio.",
      "whyCard3Title": "Empieza pequeño, añade módulos después",
      "whyCard3Desc": "Empieza con los módulos que necesitas hoy y activa más a medida que creces, de un equipo de 10 personas a miles de empleados, sin migrar.",
      "modulesLabel": "Módulos",
      "modulesTitle": "11 módulos que funcionan como uno",
      "modulesSubtitle": "Todos los módulos leen y escriben los mismos registros: un pedido de venta actualiza el inventario, la facturación y los informes por sí solo.",
      "modDashboard": "Panel",
      "modDashboardDesc": "Las cifras clave de todo el negocio en una pantalla",
      "modHR": "Recursos humanos",
      "modHRDesc": "Gestión completa del ciclo de vida de RR. HH.",
      "modFinance": "Finanzas",
      "modFinanceDesc": "Contabilidad, facturación y control financiero",
      "modSupply": "Supply Chain",
      "modSupplyDesc": "Niveles de stock, traslados y plazos de proveedores",
      "modProd": "Producción",
      "modProdDesc": "Manufactura y planificación de producción",
      "modPurch": "Compras",
      "modPurchDesc": "Aprovisionamiento y gestión de proveedores",
      "modSales": "Ventas",
      "modSalesDesc": "CRM, pedidos y seguimiento de ingresos",
      "modLog": "Logística",
      "modLogDesc": "Flota, entrega y operaciones de almacén",
      "modAI": "Motor IA",
      "modAIDesc": "Previsiones de demanda, alertas de anomalías y próximos pasos sugeridos a partir de tus propios datos",
      "modReports": "Informes",
      "modReportsDesc": "Cumplimiento automatizado e informes personalizados",
      "modAnalytics": "Analítica",
      "modAnalyticsDesc": "Gráficos y KPI que puedes filtrar y analizar en detalle",
      "statsTitle": "En uso cada día en empresas reales",
      "statsSubtitle": "Desde pequeños distribuidores hasta fabricantes con varias plantas, equipos de muchos países gestionan su día a día con Inovexa.",
      "statsModules": "Empresas",
      "statsModulesCap": "usan Inovexa hoy",
      "statsGoLive": "Puesta en marcha",
      "statsGoLiveCap": "plazo habitual de una implantación estándar",
      "statsLanguages": "Países",
      "statsLanguagesCap": "con clientes activos",
      "ctaTitle": "Descubre cómo Inovexa gestionaría tu empresa",
      "ctaSubtitle": "Una demostración de 30 minutos con nuestro equipo, adaptada a tu sector y al tamaño de tu empresa, en inglés o francés. Sin compromiso.",
      "heroRotate": "tus finanzas|tus RR. HH.|tu inventario|tus ventas|tu producción",
      "heroTitleSr": "El futuro de tus finanzas, tus RR. HH., tu inventario, tus ventas y tu producción",
      "heroSecondaryCta": "Ver los módulos",
      "statsLabel": "Inovexa en cifras",
      "statsMods": "Módulos",
      "statsModsCap": "sobre una única base de datos"
    },
    "products": {
      "heroDescription": "Inovexa ERP se adapta a tu industria con flujos de trabajo a medida, cumplimiento local y despliegue modular.",
      "industriesLabel": "Industrias que atendemos",
      "industriesTitle": "Procesos adaptados a tu sector",
      "industriesSubtitle": "Sea cual sea tu sector, Inovexa se adapta a tu realidad operativa.",
      "indManuTitle": "Manufactura",
      "indRetailTitle": "Comercio minorista",
      "indDistTitle": "Distribución",
      "indHealthTitle": "Salud",
      "indProfTitle": "Servicios profesionales",
      "indAgriTitle": "Agroindustria",
      "compTitle": "Por qué Inovexa vs. un ERP tradicional",
      "compLabel": "La diferencia Inovexa",
      "compInovexa": "Inovexa ERP",
      "compTraditional": "ERP tradicional",
      "globalLabel": "Preparado para el mundo",
      "globalTitle": "Reglas fiscales y divisas para cada país en el que vendes",
      "globalSubtitle": "Inovexa ERP admite reglas fiscales y divisas personalizadas para prácticamente todos los países.",
      "ctaTitle": "Encuentra tu solución por industria",
      "ctaSubtitle": "Habla con uno de nuestros especialistas sectoriales - mapearemos las capacidades de Inovexa a tus desafíos operativos específicos, sin costo.",
      "entBadge": "Enterprise",
      "entTitle": "¿Necesitas una solución ERP personalizada?",
      "entDesc": "Cada empresa tiene flujos de trabajo, necesidades de cumplimiento y requisitos de integración únicos. Inovexa trabaja con clientes medianos y grandes en todo el mundo para construir despliegues ERP a medida.",
      "entDetails": "Configuraciones multi-entidad, módulos personalizados, alojamiento on-premise, gestión de cuenta dedicada, garantías SLA y migración asistida son parte de nuestra oferta empresarial.",
      "entResponse": "Respuesta en 24 horas · Consulta gratuita",
      "heroEyebrow": "Plataforma",
      "heroModules": "11 módulos · 6 sectores",
      "heroH1a": "Adaptado a",
      "heroH1b": "cada sector",
      "heroMore": "+2 sectores más",
      "industriesDesc": "Cada sector incluye flujos de trabajo preconfigurados, plantillas de cumplimiento y paneles de KPI diseñados según cómo funciona realmente tu industria.",
      "indManuDesc": "Gestión integral de la fábrica, desde las materias primas hasta el producto terminado, con seguimiento de la producción y control de calidad en tiempo real.",
      "indManuB1": "Alertas de mantenimiento predictivo antes de que una avería detenga la línea",
      "indManuB2": "Planifica las compras de materias primas a partir de órdenes de producción reales y previsiones",
      "indManuB3": "Trazabilidad completa desde la lista de materiales hasta la entrega, con puntos de control de calidad",
      "indRetailDesc": "Gestiona tus tiendas físicas y tu comercio electrónico con inventario sincronizado, datos de clientes unificados e informes omnicanal.",
      "indRetailB1": "Evita roturas de stock y excesos de inventario con la previsión de demanda por IA",
      "indRetailB2": "Centraliza precios, promociones y programas de fidelización",
      "indRetailB3": "Paneles de ventas en tiempo real para todas las tiendas y canales",
      "indDistDesc": "Gestiona la distribución multialmacén con planificación de rutas, automatización de almacenes y niveles de stock por ubicación.",
      "indDistB1": "Planifica rutas de entrega automáticamente para reducir los costes de última milla",
      "indDistB2": "Sigue cada palé, referencia y vehículo en tiempo real",
      "indDistB3": "Automatiza el cross-docking y las transferencias entre almacenes",
      "indHealthDesc": "Optimiza la gestión de clínicas y hospitales con datos de pacientes conformes con HIPAA, inventario médico y flujos de facturación.",
      "indHealthB1": "Gestiona los suministros médicos con control de caducidad y reposición automática",
      "indHealthB2": "Automatiza la planificación del personal entre departamentos y turnos",
      "indHealthB3": "Simplifica las reclamaciones a aseguradoras y la conciliación de la facturación a pacientes",
      "indProfDesc": "Controla las horas facturables y los márgenes de cada proyecto con gestión de proyectos, planificación de recursos y facturación a clientes integradas.",
      "indProfB1": "Controla tiempos, gastos y márgenes de proyecto en tiempo real",
      "indProfB2": "Automatiza las facturas recurrentes y las renovaciones de contratos",
      "indProfB3": "CRM de clientes 360° con historial completo de interacciones",
      "indAgriDesc": "Del campo a la exportación: gestiona ciclos de cultivo, costes de insumos, almacenamiento y cumplimiento del comercio internacional en una sola plataforma.",
      "indAgriB1": "Controla costes de temporada, rendimientos y rentabilidad por parcela",
      "indAgriB2": "Gestiona la documentación de exportación y los certificados comerciales",
      "indAgriB3": "Facturación multidivisa para compradores internacionales",
      "getDemo": "Solicitar una demo",
      "compDesc": "Los proyectos ERP tradicionales tardan meses y suelen requerir trabajo adicional para la fiscalidad local, varios idiomas y varias monedas. Inovexa incluye las tres cosas desde el primer día.",
      "compFeature": "Funcionalidad",
      "compRowTime": "Tiempo de implantación",
      "compRowLang": "Soporte multilingüe (EN / FR / ES)",
      "compRowTax": "Fiscalidad y cumplimiento por país",
      "compRowLicense": "Coste inicial de licencia",
      "compRowSupport": "Equipo de soporte local",
      "compRowAi": "IA y analítica predictiva",
      "compRowOffline": "Acceso móvil con modo sin conexión",
      "compRowOfflineShort": "Acceso móvil sin conexión",
      "compTimeInovexa": "2–4 semanas",
      "compTimeTrad": "6–18 meses",
      "compLicenseInovexa": "Sin licencia por adelantado",
      "compLicenseInovexaShort": "Ninguno",
      "compLicenseTrad": "A menudo seis cifras por adelantado",
      "compAiTrad": "Complemento con coste adicional",
      "compAiTradShort": "Coste adicional",
      "compTraditionalShort": "Tradicional",
      "taxTitle": "Motor fiscal personalizable",
      "taxDesc": "Configura cualquier norma fiscal: TVA tunecino, IVA europeo, VAT británico, sales tax estadounidense, retenciones, impuestos especiales y exenciones propias de cada país. Actualiza los tipos sin cambiar código.",
      "currencyTitle": "Más de 180 monedas",
      "currencyDesc": "Facturación multidivisa, tipos de cambio en tiempo real e informes consolidados en cualquier moneda. Factura en TND, EUR, USD, GBP, SAR, AED o cualquier otra moneda que pidan tus clientes.",
      "complianceTitle": "Cumplimiento normativo por país",
      "complianceDesc": "Preconfigurado para las normas fiscales locales, las obligaciones de facturación electrónica y los formatos de informes legales de decenas de países. Añadimos nuevas jurisdicciones de forma continua según la demanda de los clientes.",
      "missingCountryQ": "¿No ves tu país?",
      "missingCountryLink": "Habla con nuestro equipo",
      "missingCountryRest": ". Añadimos nuevas jurisdicciones según la demanda."
    },
    "pricing": {
      "heroTitle1": "Planes flexibles para",
      "heroTitle2": "Todo tamaño de empresa",
      "heroDescription": "Cada empresa es única. Contáctanos para una cotización personalizada adaptada a tu tamaño, módulos elegidos y requisitos específicos.",
      "cardsSubtitle": "Elige el plan que encaje con tu equipo, luego contáctanos para tu cotización personalizada.",
      "starter": "Starter",
      "business": "Business",
      "enterprise": "Enterprise",
      "mostPopular": "Más popular",
      "contactForPricing": "Contactar para precios",
      "customPricing": "Precios personalizados",
      "starterDesc": "Perfecto para pequeñas empresas listas para modernizar sus operaciones y dejar atrás las hojas de cálculo.",
      "businessDesc": "Para empresas en crecimiento que necesitan toda la potencia de un ERP integrado en todos los departamentos operativos.",
      "enterpriseDesc": "Para grandes empresas, organismos gubernamentales y organizaciones con requisitos complejos y multi-entidad.",
      "whatIncluded": "Qué se incluye",
      "everythingInStarter": "Todo en Starter, más",
      "everythingInBusiness": "Todo en Business, más",
      "comparisonTitle": "Comparación completa de funciones",
      "comparisonSubtitle": "Ve exactamente qué se incluye en cada plan",
      "faqLabel": "FAQ",
      "faqTitle": "Preguntas frecuentes",
      "faqSubtitle": "Todo lo que necesitas saber antes de comenzar.",
      "stillQuestions": "¿Aún tienes preguntas? Estamos encantados de ayudar.",
      "allPlansInclude": "Todos los planes incluyen soporte completo de migración de datos y un especialista de incorporación dedicado.",
      "talkToSalesTeam": "Habla con nuestro equipo de ventas para una cotización personalizada",
      "exploreModules": "Explorar módulos",
      "plansLabel": "Planes:",
      "f": {
        "users25": "Hasta 25 usuarios",
        "coreModules": "Módulos de Finanzas, RR. HH. y Ventas",
        "storage50": "50 GB de almacenamiento en la nube",
        "reports50": "Informes estándar (más de 50)",
        "emailChat": "Soporte por email y chat",
        "mobile": "Acceso a la app móvil",
        "aiEngine": "Motor de IA",
        "customIntegrations": "Integraciones a medida",
        "users150": "Hasta 150 usuarios",
        "allModules": "Los 11 módulos incluidos",
        "storage500": "500 GB de almacenamiento en la nube",
        "aiFull": "Motor de IA (acceso completo)",
        "reports200": "Más de 200 plantillas de informes",
        "phone": "Soporte telefónico prioritario",
        "integrations50": "50 integraciones estándar",
        "usersUnlimited": "Usuarios ilimitados",
        "storageUnlimited": "Almacenamiento ilimitado",
        "multiEntity": "Multientidad / multipaís",
        "onPremise": "Opción de implantación local (on-premise)",
        "accountManager": "Gestor de cuenta dedicado",
        "sla": "SLA personalizado (99,99 % de disponibilidad)",
        "integrationsApi": "Integraciones a medida y API"
      },
      "cmp": {
        "gCore": "Módulos principales",
        "gIntel": "Inteligencia y analítica",
        "gSupport": "Soporte e infraestructura",
        "finance": "Finanzas y contabilidad",
        "hr": "Recursos humanos",
        "sales": "Ventas y CRM",
        "supply": "Cadena de suministro e inventario",
        "production": "Producción y fabricación",
        "logistics": "Logística y flota",
        "reports": "Informes estándar (más de 50)",
        "analytics": "Analítica avanzada",
        "aiForecast": "Previsión de demanda con IA",
        "emailChat": "Soporte por email y chat",
        "phone": "Soporte telefónico prioritario",
        "accountManager": "Gestor de cuenta dedicado",
        "onPremise": "Implantación local (on-premise)"
      },
      "faq": {
        "q1": "¿Puedo ver una demo antes de comprometerme?",
        "a1": "Sí. Cada cliente potencial recibe una demo en directo personalizada con nuestro equipo, adaptada a tu sector y a tus casos de uso. Sin tarjeta de crédito ni compromiso: solo una conversación para ver si Inovexa encaja con lo que necesitas.",
        "q2": "¿Puedo cambiar de plan en cualquier momento?",
        "a2": "Sí. Puedes subir o bajar de plan en cualquier momento. Las mejoras se aplican de inmediato y los cambios a un plan inferior, al final del ciclo de facturación en curso. Tu gestor de cuenta dedicado se encarga de la transición.",
        "q3": "¿Cómo funciona la migración de datos?",
        "a3": "Nuestro equipo de implantación se encarga de toda la migración de datos desde tu sistema actual, ya sean hojas de cálculo, otro ERP o un programa de contabilidad antiguo. Hemos migrado desde SAP, Sage, QuickBooks y decenas de sistemas a medida. La migración está incluida en todos los planes.",
        "q4": "¿Inovexa gestiona la normativa fiscal de mi país?",
        "a4": "Sí. El motor fiscal se configura por país. Admitimos el TVA tunecino, el IVA marroquí, la facturación electrónica egipcia y el IVA europeo, y añadimos nuevas jurisdicciones según la demanda de los clientes. Los tipos se actualizan a medida que cambia la normativa.",
        "q5": "¿Qué idiomas admite Inovexa?",
        "a5": "Inovexa está disponible en francés e inglés en todos los módulos y en los documentos generados por el sistema (facturas, informes, contratos). El idioma se configura por usuario.",
        "q6": "¿Qué pasa con mis datos si cancelo?",
        "a6": "Tus datos son 100 % tuyos. Si cancelas, recibirás una exportación completa de todos tus datos en formatos estándar (CSV, Excel, JSON, PDF). Los conservamos durante 90 días tras la cancelación antes de eliminarlos definitivamente.",
        "q7": "¿Ofrecéis implantación local (on-premise)?",
        "a7": "Sí, la implantación local está disponible en el plan Enterprise para organizaciones con requisitos de soberanía de datos o conectividad a internet limitada. Contacta con nuestro equipo de ventas para conocer las especificaciones y los precios.",
        "q8": "¿Hay un periodo mínimo de contrato?",
        "a8": "Las condiciones del contrato son flexibles y se acuerdan al preparar tu presupuesto. Las suscripciones anuales suelen incluir precios preferentes, aunque también hay opciones mensuales. Contacta con nuestro equipo para conocer los detalles de tu plan."
      }
    },
    "contact": {
      "heroTitle1": "Hablemos de tu",
      "heroTitle2": "Empresa",
      "heroDescription": "Rellena el formulario y uno de nuestros especialistas ERP te responderá en 24 horas.",
      "badge1": "Respondemos en 24 horas",
      "badge2": "Sin compromiso",
      "badge3": "Francés · Inglés",
      "formTitle": "Solicitar una demo gratuita",
      "formSubtitle": "Cuéntanos sobre tu empresa y prepararemos una demo adaptada a tus necesidades.",
      "labelFirstName": "Nombre",
      "labelLastName": "Apellido",
      "labelCompany": "Nombre de la empresa",
      "labelEmail": "Email de trabajo",
      "labelPhone": "Número de teléfono",
      "labelSize": "Tamaño de empresa",
      "labelSelectSize": "Selecciona el tamaño",
      "labelModules": "Módulos de interés",
      "labelMessage": "Cuéntanos sobre tus necesidades",
      "placeholderFirstName": "Nombre",
      "placeholderLastName": "Apellido",
      "placeholderEmail": "tu@empresa.com",
      "placeholderCompany": "Nombre de la empresa",
      "placeholderPhone": "+216 XX XXX XXX",
      "placeholderMessage": "¿Qué buscas resolver?",
      "submit": "Solicitar una demo",
      "sending": "Enviando...",
      "successTitle": "¡Solicitud recibida!",
      "successMessage": "Uno de nuestros especialistas te contactará en 24 horas para programar tu demo personalizada de Inovexa.",
      "exploreProducts": "Explorar productos",
      "sidebarResponseTitle": "Respondemos en 24 horas",
      "sidebarResponseSubtitle": "Tiempo de respuesta garantizado",
      "sidebarResponseDesc": "Cada solicitud de demo es revisada personalmente por uno de nuestros especialistas sectoriales, nunca por un bot.",
      "officeTitle": "Nuestra oficina",
      "officeHeadquarters": "Sede",
      "officeEmail": "Email",
      "officePhone": "Teléfono",
      "officeWhatsapp": "WhatsApp",
      "hoursTitle": "Horario de oficina",
      "weekdays": "Lunes - Viernes",
      "weekdaysTime": "8:00 - 18:00",
      "saturday": "Sábado",
      "saturdayTime": "9:00 - 13:00",
      "sunday": "Domingo",
      "sundayTime": "Cerrado",
      "expectTitle": "Qué esperar de tu demo",
      "expectSubtitle": "Una sesión personalizada de 45 minutos - sin presentaciones genéricas ni presión comercial.",
      "expect1Title": "Adaptado a tu industria",
      "expect1Desc": "Estudiamos tu sector antes de la llamada. Tu demo muestra cómo Inovexa resuelve tus desafíos operativos específicos.",
      "expect2Title": "Sistema real, sin maquetas",
      "expect2Desc": "Verás la plataforma real, no una presentación. Haz preguntas, solicita pantallas específicas e interactúa directamente.",
      "expect3Title": "Experto en tu idioma",
      "expect3Desc": "Tu especialista habla francés o inglés, el que prefieras. Sin barreras idiomáticas.",
      "expect4Title": "Estimación de ROI incluida",
      "expect4Desc": "Te mostraremos un análisis de costo-beneficio basado en empresas de tu tamaño.",
      "heroReply24h": "Respuesta en 24 h",
      "size1": "Micro (1–10 empleados)",
      "size2": "Pequeña (11–50 empleados)",
      "size3": "Mediana (51–200 empleados)",
      "size4": "Mediana-grande (201–500 empleados)",
      "size5": "Gran empresa (más de 500 empleados)",
      "privacyA": "Al enviar este formulario, aceptas nuestra",
      "privacyB": ". Nunca compartiremos tu información con terceros.",
      "afterHoursNote": "Fuera del horario de oficina, escribe a contact@inovexa-erp.com y responderemos el siguiente día laborable.",
      "modSalesCrm": "Ventas y CRM",
      "errRequired": "Indica tu nombre, tus apellidos, tu empresa y tu dirección de email.",
      "errEmail": "Introduce una dirección de email válida.",
      "errNetwork": "No se puede conectar con el servidor. Comprueba tu conexión o escríbenos a contact@inovexa-erp.com",
      "errServer": "Error de configuración del servidor. Contáctanos directamente en contact@inovexa-erp.com",
      "errGeneric": "Algo ha salido mal. Inténtalo de nuevo.",
      "successThanks": "Gracias, {name}.",
      "successDetail": "Uno de nuestros especialistas te escribirá a {email} en un plazo de {time} para programar tu demo personalizada de Inovexa.",
      "success24h": "24 horas"
    },
    "blog": {
      "heroTitle1": "Perspectivas sobre ERP,",
      "heroTitle2": "IA y transformación digital",
      "heroSubtitle": "Guías de compra, consejos de implantación, IA en el ERP y análisis de mercado para empresas en crecimiento.",
      "latest": "Últimos artículos",
      "featured": "Artículo destacado",
      "relatedArticles": "Artículos relacionados",
      "newsletterTitle": "Recibe los nuevos artículos por correo",
      "newsletterDesc": "Un correo breve cada vez que publicamos algo nuevo. Sin spam.",
      "newsletterCta": "Contáctanos para suscribirte",
      "ctaTitle": "¿Quieres ver Inovexa con tus propios procesos?",
      "ctaSubtitle": "Reserva una demo personalizada y comprueba cómo Inovexa se adapta a la forma en que tu equipo ya trabaja.",
      "minRead": "min de lectura",
      "hub": "Centro de recursos",
      "heroTags": "ERP · IA · Negocio",
      "pill": {
        "trends": "Tendencias ERP",
        "aiFinance": "IA y finanzas",
        "implementation": "Implantación",
        "cloud": "ERP en la nube"
      },
      "filter": {
        "all": "Todos",
        "news": "Noticias ERP",
        "ai": "IA y automatización",
        "saas": "SaaS",
        "startup": "Startups",
        "africa": "Mercados globales",
        "supply": "Cadena de suministro",
        "finance": "Finanzas",
        "hr": "Tecnología de RR. HH.",
        "manufacturing": "Fabricación",
        "regional": "Guías por país",
        "erp": "Fundamentos de ERP"
      }
    },
    "blogPost": {
      "backToBlog": "Volver al blog",
      "relatedArticles": "Artículos relacionados",
      "ctaTitle": "¿Quieres ver Inovexa en la práctica?",
      "ctaDesc": "Reserva una demo personalizada con nuestro equipo. Sin compromiso.",
      "author": "Inovexa Team",
      "authorRole": "Investigación ERP e IA, Inovexa - Túnez",
      "calloutInovexaTitle": "Cómo Inovexa ERP puede ayudar a tu empresa"
    },
    "blogCards": {
      "aiErp": {
        "title": "Cómo la IA está transformando los sistemas ERP modernos en 2026"
      },
      "mlSupply": {
        "title": "5 formas en que el machine learning está cambiando la gestión de la Supply Chain en 2026"
      },
      "aiFinance": {
        "title": "El futuro de la automatización financiera: contabilidad impulsada por IA en ERP"
      },
      "aiHr": {
        "title": "RR. HH. con IA: cómo el ERP inteligente transforma la gestión del personal"
      },
      "cloudAdoption": {
        "title": "Por qué las empresas están migrando al ERP en la nube en 2026"
      },
      "manufacturing": {
        "title": "ERP para manufactura: optimizando producción, calidad y cumplimiento"
      },
      "digitalTransform": {
        "title": "Transformación digital para PYMES: una hoja de ruta ERP práctica"
      },
      "multiCurrency": {
        "title": "ERP multidivisa: gestionando el comercio transfronterizo entre mercados"
      },
      "inventory": {
        "title": "Mejores prácticas de gestión de inventario: cómo el ERP elimina rupturas y excesos"
      },
      "whatIsErp": {
        "title": "¿Qué es un ERP? Guía completa para dueños de empresa en 2026"
      },
      "erpVsSheets": {
        "title": "ERP vs hojas de cálculo: ¿cuándo debe tu empresa hacer la transición?"
      },
      "howToChoose": {
        "title": "Cómo elegir el ERP adecuado para tu empresa: guía paso a paso"
      },
      "erpRoi": {
        "title": "¿Cuál es el ROI de un ERP? Beneficios reales más allá del discurso de ventas"
      },
      "implementation": {
        "title": "Implementación de ERP: cronograma realista y qué esperar"
      },
      "cloudSecurity": {
        "title": "¿Es seguro el ERP en la nube? Seguridad, privacidad y qué buscar"
      },
      "smallBusiness": {
        "title": "¿Las pequeñas empresas necesitan ERP? Cuándo tiene sentido (y cuándo no)"
      },
      "agentic": {
        "title": "ERP agéntico en 2026: los agentes de IA se convierten en tus nuevos empleados",
        "desc": "Qué hacen hoy realmente los agentes de IA dentro de un ERP, dónde ayudan y dónde todavía debe decidir una persona."
      },
      "composable": {
        "title": "ERP componible en 2026: por qué la arquitectura modular supera a las suites monolíticas",
        "descShort": "Por qué las pymes y el mid-market están abandonando las suites monolíticas."
      },
      "medSme": {
        "title": "Pymes en crecimiento y ERP: guía para empresas transfronterizas",
        "descShort": "Cómo las pymes en crecimiento de Europa y África están cerrando la brecha del ERP."
      },
      "tunisiaTextile": {
        "title": "El ERP en la industria textil tunecina: dentro del cambio hacia la Industria 4.0",
        "descShort": "Un plan de despliegue de 16 semanas para las fábricas textiles tunecinas."
      },
      "badgeMediterranean": "Mercados globales",
      "badgeManufacturing": "Manufactura",
      "badgeCornerstone": "Artículo base",
      "badgeStartups": "Startups",
      "badgeSaaS": "SaaS",
      "erpTrends2026": {
        "title": "Top 10 de tendencias ERP en 2026: IA agéntica, arquitectura componible y nubes sectoriales",
        "descShort": "IA agéntica, arquitectura componible y nubes sectoriales: qué ha cambiado y qué implica para quien compra un ERP."
      },
      "erpStartups": {
        "title": "ERP para startups en 2026: la guía completa del fundador",
        "descShort": "Cuándo comprar, qué ignorar y cómo elegir sin quemar capital."
      },
      "erpForSaas": {
        "title": "Mejor ERP para empresas SaaS en 2026: una comparación práctica",
        "descShort": "NetSuite, Sage Intacct, Certinia e Inovexa comparados en precio, reconocimiento de ingresos y encaje."
      },
      "financeAgents": {
        "title": "Los agentes de IA para finanzas llegan a disponibilidad general",
        "descShort": "Los agentes de conciliación automatizada ya están disponibles. Qué cambia para los equipos financieros de las pymes."
      },
      "badgeStrategy": "Estrategia ERP",
      "badgeTunisiaIndustry": "Túnez · Industria 4.0",
      "badgeMultiCurrency": "Multidivisa",
      "badgeRoi": "ROI",
      "bestErp": {
        "title": "Los 20 mejores software ERP en 2026: comparativa",
        "descShort": "SAP, Oracle, NetSuite, Business Central, Odoo y 15 más, agrupados por tamaño de empresa y modelo de precios."
      },
      "netsuiteAlt": {
        "title": "Las 10 mejores alternativas a NetSuite en 2026",
        "descShort": "Quién debería cambiar, quién debería quedarse y una lista paso a paso para salir de NetSuite."
      },
      "openSourceErp": {
        "title": "Los 12 mejores ERP de código abierto en 2026",
        "descShort": "Odoo, ERPNext, Dolibarr y más comparados por licencia, tecnología y el coste real de lo \"gratis\"."
      },
      "erpIntegrations": {
        "title": "20 aplicaciones que vale la pena conectar a tu ERP",
        "descShort": "Stripe, Shopify, HubSpot, DocuSign y más: qué datos sincronizar y cómo conectarlos."
      }
    },
    "fromBlog": {
      "label": "Desde el blog",
      "title": "Guías prácticas sobre ERP e IA",
      "subtitle": "Guías de compra, consejos de implantación y análisis sectoriales del equipo de Inovexa.",
      "browseAll": "Ver todos los artículos"
    },
    "resources": {
      "productsTitle": "Lecturas adicionales",
      "pricingTitle": "Antes de decidir",
      "contactTitle": "Mientras esperas nuestra respuesta",
      "allArticles": "Todos los artículos"
    },
    "blogPosts": {
      "aiErp": {
        "title": "Cómo la IA está transformando los sistemas ERP modernos en 2026"
      },
      "mlSupply": {
        "title": "5 formas en que el machine learning está cambiando la gestión de la cadena de suministro en 2026"
      },
      "aiFinance": {
        "title": "El futuro de la automatización financiera: contabilidad impulsada por IA en ERP"
      },
      "aiHr": {
        "title": "RR. HH. con IA: cómo el ERP inteligente transforma la gestión del personal"
      },
      "cloudAdoption": {
        "title": "Por qué las empresas están migrando al ERP en la nube en 2026"
      },
      "manufacturing": {
        "title": "ERP para manufactura: optimizando producción, calidad y cumplimiento"
      },
      "digitalTransform": {
        "title": "Transformación digital para PYMES: una hoja de ruta ERP práctica"
      },
      "multiCurrency": {
        "title": "ERP multidivisa: gestionando el comercio transfronterizo entre mercados"
      },
      "inventory": {
        "title": "Mejores prácticas de gestión de inventario: cómo el ERP elimina rupturas y excesos"
      },
      "whatIsErp": {
        "title": "¿Qué es un ERP? Guía completa para dueños de empresa en 2026"
      },
      "erpVsSheets": {
        "title": "ERP vs hojas de cálculo: ¿cuándo debe tu empresa hacer la transición?"
      },
      "howToChoose": {
        "title": "Cómo elegir el ERP adecuado para tu empresa: guía paso a paso"
      },
      "erpRoi": {
        "title": "¿Cuál es el ROI de un ERP? Beneficios reales más allá del discurso de ventas"
      },
      "implementation": {
        "title": "Implementación de ERP: cronograma realista y qué esperar"
      },
      "cloudSecurity": {
        "title": "¿Es seguro el ERP en la nube? Seguridad, privacidad y qué buscar"
      },
      "smallBusiness": {
        "title": "¿Las pequeñas empresas necesitan ERP? Cuándo tiene sentido (y cuándo no)"
      }
    },
    "about": {
      "ourStory": "Nuestra historia",
      "heroTitle1": "Software de gestión creado en Túnez",
      "heroTitle2": "para empresas de todo el mundo",
      "heroDesc": "Inovexa nació en Túnez en 2024 para ofrecer a las empresas en crecimiento el tipo de ERP que antes estaba reservado a las grandes corporaciones: finanzas, RR. HH., cadena de suministro, ventas y analítica en una sola plataforma en la nube, a un precio que una pequeña o mediana empresa puede justificar.",
      "badgeFounded": "Fundada en Túnez en 2024",
      "badgeCountries": "Presente en más de 12 países",
      "badgeMsai": "Forma parte de MSAI Systems",
      "missionLabel": "Nuestra misión",
      "missionTitle": "Un ERP serio a un precio que las empresas en crecimiento pueden pagar",
      "missionDesc": "Las empresas en crecimiento necesitan lo mismo que las grandes: una contabilidad precisa, nóminas que se pagan a tiempo, cifras de inventario fiables e informes útiles para decidir. Creamos esas herramientas como módulos, para que cada empresa empiece con lo que necesita hoy y añada más a medida que crece, opere donde opere.",
      "visionLabel": "Nuestra visión",
      "visionTitle": "Un ERP que funciona en cualquier país",
      "visionDesc": "Una empresa en Túnez, Toronto o Nairobi debería poder usar la misma plataforma con sus propias normas fiscales, su moneda y su idioma. Por eso cada módulo que lanzamos admite varios países, monedas e idiomas desde el principio, en lugar de añadirlos más tarde.",
      "valuesLabel": "Lo que defendemos",
      "valuesTitle": "Nuestros valores",
      "valuesSubtitle": "Los principios que aplicamos al decidir qué construir, cómo fijar el precio y cómo dar soporte a nuestros clientes.",
      "value1Title": "IA útil",
      "value1Desc": "Añadimos IA donde ahorra un tiempo medible, como la previsión de la demanda o la detección de transacciones inusuales, y la dejamos fuera donde no aporta.",
      "value2Title": "Precios y condiciones claros",
      "value2Desc": "Sin costes ocultos ni contratos sorpresa. Sabes lo que obtienes, cuánto cuesta y qué incluye nuestra hoja de ruta.",
      "value3Title": "Pensado para equipos reales",
      "value3Desc": "Los equipos trabajan en francés, árabe, español o inglés, y las pantallas están diseñadas tanto para el personal de almacén y de planta como para los contables.",
      "value4Title": "Menos hardware",
      "value4Desc": "El despliegue en la nube sustituye a los servidores locales que funcionan día y noche, así que hay menos hardware que comprar, alimentar y mantener.",
      "statsLabel": "En cifras",
      "statsTitle": "Inovexa de un vistazo",
      "statModules": "Módulos ERP integrados",
      "statCountries": "Países atendidos",
      "statLanguages": "Idiomas (EN · FR · ES)",
      "statFounded": "Fundada en Túnez",
      "storyTitle": "De Túnez al mundo",
      "story1": "Inovexa nació en 2024 en Túnez. Durante años, nuestros fundadores vieron cómo fabricantes, distribuidores y empresas tunecinas en crecimiento luchaban con herramientas dispersas: hojas de cálculo de Excel, software de facturación desconectado y procesos de RR. HH. manuales. El problema no era la falta de ambición, sino la falta de las herramientas adecuadas.",
      "story2": "Nos hicimos una pregunta sencilla: ¿por qué una fábrica en Sfax tiene que usar software de los años noventa mientras una startup de San Francisco dispone de un ERP con IA nativa desde el primer día? La respuesta siempre era el coste y la complejidad. Así que decidimos resolver ambos.",
      "story3a": "Hoy, Inovexa forma parte de",
      "story3b": "y atiende a empresas de más de 12 países desde su sede en Túnez. El objetivo no ha cambiado: la profundidad de un gran ERP, con el tiempo de implantación y el precio de un producto SaaS moderno.",
      "tl1Label": "2024 · Lanzamiento",
      "tl1Title": "Fundación de Inovexa en Túnez",
      "tl1Desc": "Primeros módulos lanzados: Finanzas, RR. HH. y CRM de ventas. Los 10 primeros clientes incorporados en 6 meses.",
      "tl2Label": "2025 · Expansión",
      "tl2Title": "Primeros mercados fuera de Túnez",
      "tl2Desc": "Expansión a Marruecos, Francia, España e Italia. Se añadieron los módulos de Cadena de suministro, Producción y Motor de IA.",
      "tl3Label": "2026 · Hoy",
      "tl3Title": "11 módulos en producción",
      "tl3Desc": "Los 11 módulos están operativos, con funciones de IA en finanzas, cadena de suministro y analítica. Clientes en más de 12 países e interfaz en 3 idiomas.",
      "ctaTitle": "¿Quieres trabajar con nosotros?",
      "ctaDesc": "Clientes, distribuidores, socios tecnológicos e ingenieros: cuéntanos en qué estás trabajando y te responderemos en 24 horas.",
      "ctaPartner": "Hazte partner",
      "partOf": "Forma parte de",
      "location": "· Túnez (Túnez)"
    },
    "notFound": {
      "title": "Página no encontrada",
      "description": "La página que buscas no existe o se ha movido. Te redirigiremos a la página de inicio en unos segundos.",
      "goHome": "Ir al inicio",
      "browseBlog": "Ver el blog",
      "contactUs": "Contáctanos",
      "redirecting": "Redirigiendo al inicio…",
      "or": "o",
      "goNow": "ir ahora",
      "cancelRedirect": "Cancelar la redirección"
    },
    "legal": {
      "privacyTitle1": "Política de",
      "privacyTitle2": "privacidad",
      "privacySubtitle": "Cómo Inovexa ERP recopila, usa, almacena y protege tu información personal.",
      "lastUpdated": "Última actualización: 10 de abril de 2026",
      "termsTitle1": "Términos",
      "termsTitle2": "del servicio",
      "termsSubtitle": "El acuerdo legal que regula tu acceso a Inovexa ERP y su uso."
    }
  }
};

  var current = DEFAULT;

  function detectLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var candidates = [];
    if (navigator.languages && navigator.languages.length) {
      for (var i = 0; i < navigator.languages.length; i++) candidates.push(navigator.languages[i]);
    }
    if (navigator.language) candidates.push(navigator.language);
    if (navigator.userLanguage) candidates.push(navigator.userLanguage);
    for (var j = 0; j < candidates.length; j++) {
      var lang = (candidates[j] || '').toLowerCase().split('-')[0];
      if (SUPPORTED.indexOf(lang) !== -1) return lang;
    }
    return DEFAULT;
  }

  function resolve(obj, key) {
    if (!obj || !key) return undefined;
    var parts = key.split('.');
    var val = obj;
    for (var i = 0; i < parts.length; i++) {
      val = val && val[parts[i]];
      if (val === undefined || val === null) return undefined;
    }
    return typeof val === 'string' ? val : undefined;
  }

  function t(key) {
    var val = resolve(TRANSLATIONS[current], key);
    if (val !== undefined) return val;
    if (current !== DEFAULT) val = resolve(TRANSLATIONS[DEFAULT], key);
    return val;
  }

  function translateElement(el) {
    var key = el.getAttribute('data-i18n');
    if (key) {
      var val = t(key);
      if (val !== undefined) {
        if (el.querySelector('[data-i18n]')) {
          for (var i = 0; i < el.childNodes.length; i++) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && n.textContent.trim()) {
              n.textContent = val;
              break;
            }
          }
        } else {
          el.textContent = val;
        }
      }
    }
    var phKey = el.getAttribute('data-i18n-placeholder');
    if (phKey) { var pv = t(phKey); if (pv !== undefined) el.placeholder = pv; }
    var aKey = el.getAttribute('data-i18n-aria');
    if (aKey) { var av = t(aKey); if (av !== undefined) el.setAttribute('aria-label', av); }
    var tKey = el.getAttribute('data-i18n-title');
    if (tKey) { var tv = t(tKey); if (tv !== undefined) el.title = tv; }
  }

  function translateAll(root) {
    if (!root) return;
    var sel = '[data-i18n],[data-i18n-placeholder],[data-i18n-aria],[data-i18n-title]';
    if (root.matches && root.matches(sel)) translateElement(root);
    var nodes = root.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) translateElement(nodes[i]);
  }

  function syncUI() {
    document.documentElement.lang = current;
    var labels = document.querySelectorAll('.i18n-current');
    for (var i = 0; i < labels.length; i++) labels[i].textContent = current.toUpperCase();
    var btns = document.querySelectorAll('[data-lang]');
    for (var j = 0; j < btns.length; j++) {
      var active = btns[j].getAttribute('data-lang') === current;
      btns[j].classList.toggle('text-electric', active);
      btns[j].classList.toggle('font-bold', active);
    }
  }

  function observe() {
    if (typeof MutationObserver === 'undefined') return;
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) translateAll(added[j]);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* Blog pages that have translated variants (slug without extension) */
  var BLOG_VARIANTS = [
    'blog-erp-hidden-costs',
    'blog-erp-implementation-failures',
    'blog-erp-news-ai-finance-agents-2026',
    'blog-erp-news-composable-api-2026',
    'blog-erp-news-mediterranean-cloud-2026',
    'blog-top-erp-france',
    'blog-top-erp-spain',
    'blog-top-erp-tunisia',
    'blog-top-erp-uk'
  ];

  function getLocalizedUrl(lang) {
    var file = (window.location.pathname.split('/').pop() || 'index.html');
    /* Strip any existing language suffix */
    var base = file.replace(/-(fr|es)\.html$/, '.html');
    var slug = base.replace('.html', '');
    if (BLOG_VARIANTS.indexOf(slug) === -1) return null;
    if (lang === 'en') return base;
    return slug + '-' + lang + '.html';
  }

  function changeLanguage(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    /* Redirect to translated page when a variant exists */
    var url = getLocalizedUrl(lang);
    if (url && url !== (window.location.pathname.split('/').pop() || 'index.html')) {
      window.location.href = url;
      return;
    }
    translateAll(document.body);
    syncUI();
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
  }

  function init() {
    current = detectLang();
    translateAll(document.body);
    syncUI();
    observe();
    document.documentElement.classList.remove('i18n-loading');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.changeLanguage = changeLanguage;
  window.I18n = {
    changeLanguage: changeLanguage,
    getLanguage: function () { return current; },
    supported: SUPPORTED,
    translate: t
  };
})();
