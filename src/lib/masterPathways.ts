import type { Programme } from "../types/jupas";
import type { Lang } from "./i18n";

export type LocalizedText = Record<Lang, string>;

export type SalaryBenchmark = {
  id: string;
  role: LocalizedText;
  monthly: string;
  basis: LocalizedText;
  sourceLabel: string;
  sourceUrl: string;
};

export type MasterPathway = {
  id: string;
  institution: "HKU" | "HKUST";
  name: LocalizedText;
  entryBackground: LocalizedText;
  gpa: LocalizedText;
  curriculum: LocalizedText;
  jobs: LocalizedText[];
  salaryKeys: string[];
  sourceCycle: string;
  sourceLabel: string;
  sourceUrl: string;
  checkedOn: string;
  caution?: LocalizedText;
};

const salaryBenchmarks: Record<string, SalaryBenchmark> = {
  data: {
    id: "data",
    role: { en: "Data analyst", zh: "數據分析師" },
    monthly: "HK$30,000–56,700",
    basis: {
      en: "2026 permanent-market range for 3–5 years' experience; annual figures divided by 12.",
      zh: "2026 永久職位市場、3–5 年經驗；年薪除以 12。",
    },
    sourceLabel: "Robert Walters 2026",
    sourceUrl: "https://www.robertwalters.com.hk/our-services/salary-survey/data-analyst-salaries.html",
  },
  software: {
    id: "software",
    role: { en: "Software / front-end developer", zh: "軟件／前端開發員" },
    monthly: "HK$35,000–75,000",
    basis: {
      en: "2026 Hong Kong 25th–75th percentile starting salary; annual figures divided by 12.",
      zh: "2026 香港新入職薪酬第 25–75 百分位；年薪除以 12。",
    },
    sourceLabel: "Robert Half 2026",
    sourceUrl: "https://www.roberthalf.com/hk/en/insights/salary-guide/technology",
  },
  quant: {
    id: "quant",
    role: { en: "Quant developer", zh: "量化開發員" },
    monthly: "HK$80,000–166,700",
    basis: {
      en: "2026 Hong Kong 25th–75th percentile starting salary; a specialist role, not a graduate guarantee.",
      zh: "2026 香港新入職薪酬第 25–75 百分位；屬專門職位，不代表畢業起薪保證。",
    },
    sourceLabel: "Robert Half 2026",
    sourceUrl: "https://www.roberthalf.com/hk/en/insights/salary-guide/technology",
  },
  finance: {
    id: "finance",
    role: { en: "Financial analyst (small / midsize firm)", zh: "財務分析師（中小型公司）" },
    monthly: "HK$26,700–33,300",
    basis: {
      en: "2026 Hong Kong 25th–75th percentile starting salary; annual figures divided by 12.",
      zh: "2026 香港新入職薪酬第 25–75 百分位；年薪除以 12。",
    },
    sourceLabel: "Robert Half 2026",
    sourceUrl: "https://www.roberthalf.com/hk/en/job-details/financial-analyst-s-m",
  },
  accountant: {
    id: "accountant",
    role: { en: "Financial accountant (small / midsize firm)", zh: "財務會計師（中小型公司）" },
    monthly: "HK$26,700–30,800",
    basis: {
      en: "2026 Hong Kong 25th–75th percentile starting salary; annual figures divided by 12.",
      zh: "2026 香港新入職薪酬第 25–75 百分位；年薪除以 12。",
    },
    sourceLabel: "Robert Half 2026",
    sourceUrl: "https://www.roberthalf.com/hk/en/job-details/financial-accountant-s-m",
  },
  marketing: {
    id: "marketing",
    role: { en: "Marketing manager", zh: "市場推廣經理" },
    monthly: "HK$40,000–65,000",
    basis: {
      en: "2026 Hong Kong permanent-market range for manager-level hires; not a fresh-graduate range.",
      zh: "2026 香港永久職位經理級市場區間；並非應屆畢業生起薪。",
    },
    sourceLabel: "Morgan McKinley 2026",
    sourceUrl: "https://www.morganmckinley.com/hk/salary-guide/sales-marketing/permanent-salaries",
  },
  operations: {
    id: "operations",
    role: { en: "Supply-chain analyst", zh: "供應鏈分析師" },
    monthly: "HK$15,600–33,800",
    basis: {
      en: "Hong Kong job-posting range, updated May 2026; small sample, so treat it as directional only.",
      zh: "香港招聘廣告區間，2026 年 5 月更新；樣本較小，只宜作方向參考。",
    },
    sourceLabel: "Indeed Hong Kong 2026",
    sourceUrl: "https://hk.indeed.com/career/supply-chain-analyst/salaries",
  },
  environment: {
    id: "environment",
    role: { en: "Environmental engineer", zh: "環境工程師" },
    monthly: "HK$14,900–50,400",
    basis: {
      en: "Hong Kong job-posting range, updated January 2026; small sample, so treat it as directional only.",
      zh: "香港招聘廣告區間，2026 年 1 月更新；樣本較小，只宜作方向參考。",
    },
    sourceLabel: "Indeed Hong Kong 2026",
    sourceUrl: "https://hk.indeed.com/career/environmental-engineer/salaries",
  },
  socialWork: {
    id: "socialWork",
    role: { en: "Assistant Social Work Officer (civil-service reference)", zh: "助理社會工作主任（公務員參考）" },
    monthly: "HK$37,585–83,140",
    basis: {
      en: "2026 Master Pay Scale points 16–33. NGO and private-sector pay can differ.",
      zh: "2026 總薪級表第 16–33 點；非政府機構及私營市場薪酬可不同。",
    },
    sourceLabel: "Hong Kong Civil Service Bureau 2026",
    sourceUrl: "https://www.csb.gov.hk/tc_chi/admin/pay/42.html",
  },
  clinicalPsych: {
    id: "clinicalPsych",
    role: { en: "Clinical psychologist (civil-service reference)", zh: "臨床心理學家（公務員參考）" },
    monthly: "HK$63,100–122,045",
    basis: {
      en: "2026 MPS 27–44; requires a recognised Master in Clinical Psychology, not a general psychology master's alone.",
      zh: "2026 總薪級表第 27–44 點；須具認可臨床心理學碩士，一般心理學碩士本身並不足夠。",
    },
    sourceLabel: "Hong Kong Correctional Services Department 2026",
    sourceUrl: "https://www.csd.gov.hk/english/recruit/postdetails/postdetails.html",
  },
};

const CHECKED = "2026-09-21";

const pathways: Record<string, MasterPathway> = {
  ai: {
    id: "ai", institution: "HKUST",
    name: { en: "MSc in Artificial Intelligence", zh: "人工智能理學碩士" },
    entryBackground: {
      en: "Recognised bachelor's degree; a quantitative / computing foundation is the natural preparation and programme-specific conditions should be checked on the live catalog.",
      zh: "認可學士學位；量化／電腦基礎是最自然的準備，並應在申請時重查官方課程頁的專屬條件。",
    },
    gpa: { en: "No fixed numeric GPA is published for general admission.", zh: "一般招生未公布固定最低 GPA 數字。" },
    curriculum: { en: "AI foundations, machine learning, data-driven systems and applied AI projects.", zh: "人工智能基礎、機器學習、數據驅動系統及應用項目。" },
    jobs: [{ en: "AI / machine-learning engineer", zh: "AI／機器學習工程師" }, { en: "Software developer", zh: "軟件開發員" }, { en: "Data analyst", zh: "數據分析師" }],
    salaryKeys: ["software", "data"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-ai/", checkedOn: CHECKED,
  },
  bigData: {
    id: "bigData", institution: "HKUST",
    name: { en: "MSc in Big Data Technology", zh: "大數據科技理學碩士" },
    entryBackground: { en: "Bachelor's in computer engineering, computer science, mathematics or a related field; other disciplines need relevant IT and mathematics experience.", zh: "電腦工程、電腦科學、數學或相關學士；其他學科須具相關 IT 及數學經驗。" },
    gpa: { en: "No fixed numeric GPA is published.", zh: "官方未公布固定最低 GPA 數字。" },
    curriculum: { en: "30 credits: big-data infrastructure, integration, storage, modelling, mining and security.", zh: "30 學分：大數據基建、整合、儲存、建模、挖掘及保安。" },
    jobs: [{ en: "Data engineer", zh: "數據工程師" }, { en: "Data analyst", zh: "數據分析師" }, { en: "Machine-learning engineer", zh: "機器學習工程師" }],
    salaryKeys: ["data", "software"],
    sourceCycle: "Current official page", sourceLabel: "HKUST School of Engineering", sourceUrl: "https://seng.hkust.edu.hk/academics/taught-postgraduate/msc-bdt", checkedOn: CHECKED,
  },
  businessAnalytics: {
    id: "businessAnalytics", institution: "HKUST",
    name: { en: "MSc in Business Analytics", zh: "商業分析理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree; information systems, operations management, statistics or related backgrounds are preferred. GMAT / GRE is recommended, not compulsory.", zh: "認可學士學位；資訊系統、營運管理、統計或相關背景較優先。GMAT／GRE 建議提交，但非必須。" },
    gpa: { en: "No fixed numeric GPA is published; admission is competitive.", zh: "官方未公布固定最低 GPA；採競爭性審核。" },
    curriculum: { en: "30 credits spanning applied statistics, modelling, optimisation and information management.", zh: "30 學分，涵蓋應用統計、建模、最佳化及資訊管理。" },
    jobs: [{ en: "Business / data analyst", zh: "商業／數據分析師" }, { en: "Analytics consultant", zh: "分析顧問" }, { en: "Product analyst", zh: "產品分析師" }],
    salaryKeys: ["data", "finance"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-ba/", checkedOn: CHECKED,
  },
  financialMath: {
    id: "financialMath", institution: "HKUST",
    name: { en: "MSc in Financial Mathematics", zh: "金融數學理學碩士" },
    entryBackground: { en: "Bachelor's in mathematics, engineering or physical sciences; strong mathematics, statistics, finance and computing preparation is expected.", zh: "數學、工程或物理科學學士；預期具良好數學、統計、金融及計算基礎。" },
    gpa: { en: "No fixed GPA for general admission. The 3.5/4.0 rule shown on the catalog applies only to HKUST's integrated pathway.", zh: "一般招生沒有固定 GPA；課程頁所列 3.5/4.0 只適用於科大銜接 pathway。" },
    curriculum: { en: "36 credits including stochastic calculus, probability and statistics, quantitative finance, numerical methods and an optional project.", zh: "36 學分，包括隨機微積分、概率與統計、量化金融、數值方法及可選項目。" },
    jobs: [{ en: "Quant developer / analyst", zh: "量化開發員／分析師" }, { en: "Risk analyst", zh: "風險分析師" }, { en: "Financial analyst", zh: "財務分析師" }],
    salaryKeys: ["quant", "finance"],
    sourceCycle: "HKUST 2026/27 · updated 13 Jul 2026", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-mafm/", checkedOn: CHECKED,
  },
  fintech: {
    id: "fintech", institution: "HKUST",
    name: { en: "MSc in Financial Technology", zh: "金融科技理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree; programming and mathematics are preferred. GMAT / GRE is recommended but not compulsory.", zh: "認可學士學位；較偏好程式及數學背景。GMAT／GRE 建議提交但非必須。" },
    gpa: { en: "No fixed numeric GPA is published for general admission.", zh: "一般招生未公布固定最低 GPA 數字。" },
    curriculum: { en: "30 credits with at least 16 core credits, covering fintech, blockchain, data, machine learning and decision analytics.", zh: "30 學分、至少 16 核心學分，涵蓋金融科技、區塊鏈、數據、機器學習及決策分析。" },
    jobs: [{ en: "FinTech product / data analyst", zh: "金融科技產品／數據分析師" }, { en: "Software developer", zh: "軟件開發員" }, { en: "Risk analyst", zh: "風險分析師" }],
    salaryKeys: ["software", "data", "finance"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-fintech/", checkedOn: CHECKED,
  },
  finance: {
    id: "finance", institution: "HKUST",
    name: { en: "MSc in Finance", zh: "金融學理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree; the published general requirement does not restrict applicants to a finance major.", zh: "認可學士學位；已公布的一般條件沒有把申請者限制於金融主修。" },
    gpa: { en: "No fixed numeric GPA is published; admission is selective.", zh: "官方未公布固定最低 GPA；採選拔式招生。" },
    curriculum: { en: "Corporate finance, quantitative and computing skills, investment analysis, valuation and derivatives; aligned with CFA, CAIA and FRM topic areas.", zh: "公司金融、量化與計算、投資分析、估值及衍生工具；內容對應 CFA、CAIA、FRM 部分範疇。" },
    jobs: [{ en: "Financial / investment analyst", zh: "財務／投資分析師" }, { en: "Risk analyst", zh: "風險分析師" }, { en: "Asset-management analyst", zh: "資產管理分析師" }],
    salaryKeys: ["finance", "quant"],
    sourceCycle: "HKUST 2026/27 · updated 21 May 2026", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-fina/", checkedOn: CHECKED,
  },
  economics: {
    id: "economics", institution: "HKUST",
    name: { en: "MSc in Economics", zh: "經濟學理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree. Quantitative preparation helps with mathematical economics and econometrics.", zh: "認可學士學位；量化基礎有助修讀數理經濟及計量經濟。" },
    gpa: { en: "No fixed numeric GPA is published; admission is selective.", zh: "官方未公布固定最低 GPA；採選拔式招生。" },
    curriculum: { en: "30 credits: microeconomics, macroeconomics, mathematical economics, econometrics and applied electives; optional research-preparation concentration.", zh: "30 學分：微觀、宏觀、數理經濟、計量經濟及應用選修；可選研究準備專修。" },
    jobs: [{ en: "Economic / policy analyst", zh: "經濟／政策分析師" }, { en: "Data analyst", zh: "數據分析師" }, { en: "Financial analyst", zh: "財務分析師" }],
    salaryKeys: ["data", "finance"],
    sourceCycle: "HKUST 2026/27 · updated 21 May 2026", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-econ/", checkedOn: CHECKED,
  },
  ism: {
    id: "ism", institution: "HKUST",
    name: { en: "MSc in Information Systems Management", zh: "資訊系統管理理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree. Applicants without enough IS, computer-science or engineering background may be assigned up to three foundation courses.", zh: "認可學士學位；資訊系統、電腦科學或工程基礎不足者，或須加修最多三門基礎課。" },
    gpa: { en: "No fixed GPA for general admission. The 3.3/4.0 rule applies only to the named HKUST integrated pathway.", zh: "一般招生沒有固定 GPA；3.3/4.0 只適用於指定科大銜接 pathway。" },
    curriculum: { en: "30 credits combining databases, systems, cyber security, IT strategy and project management, with FinTech, entrepreneurship and AI concentrations.", zh: "30 學分，結合數據庫、系統、網絡安全、IT 策略及項目管理，另設 FinTech、創業及 AI 專修。" },
    jobs: [{ en: "Business systems analyst", zh: "商業系統分析師" }, { en: "Technology consultant", zh: "科技顧問" }, { en: "IT project analyst", zh: "IT 項目分析師" }],
    salaryKeys: ["data", "software"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-ism", checkedOn: CHECKED,
  },
  marketing: {
    id: "marketing", institution: "HKUST",
    name: { en: "MSc in Marketing", zh: "市場學理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree with satisfactory academic performance; GMAT / GRE is highly recommended but no minimum score is published.", zh: "認可學士學位及良好學業表現；高度建議 GMAT／GRE，但沒有公布最低分。" },
    gpa: { en: "No fixed numeric GPA is published.", zh: "官方未公布固定最低 GPA 數字。" },
    curriculum: { en: "Marketing strategy, consumer insights, data-driven decisions, digital marketing, brand management and AI-enabled marketing.", zh: "市場策略、消費者洞察、數據決策、數碼營銷、品牌管理及 AI 營銷。" },
    jobs: [{ en: "Marketing / brand manager", zh: "市場／品牌經理" }, { en: "Consumer-insights analyst", zh: "消費者洞察分析師" }, { en: "Growth / CRM analyst", zh: "增長／CRM 分析師" }],
    salaryKeys: ["marketing", "data"],
    sourceCycle: "2027/28 applications opened Jul 2026", sourceLabel: "Official programme website", sourceUrl: "https://mscmark.hkust.edu.hk/", checkedOn: CHECKED,
  },
  globalOperations: {
    id: "globalOperations", institution: "HKUST",
    name: { en: "MSc in Global Operations", zh: "環球營運理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree; intended for applicants interested in managing business operations globally.", zh: "認可學士學位；適合有意管理環球商業營運的申請者。" },
    gpa: { en: "No fixed numeric GPA is published.", zh: "官方未公布固定最低 GPA 數字。" },
    curriculum: { en: "30 credits in operations and supply-chain decision making, with an optional Operations Analytics concentration.", zh: "30 學分，聚焦營運及供應鏈決策，可選 Operations Analytics 專修。" },
    jobs: [{ en: "Supply-chain analyst", zh: "供應鏈分析師" }, { en: "Operations analyst", zh: "營運分析師" }, { en: "Management consultant", zh: "管理顧問" }],
    salaryKeys: ["operations", "data"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-go/", checkedOn: CHECKED,
  },
  accounting: {
    id: "accounting", institution: "HKUST",
    name: { en: "MSc in Accounting", zh: "會計學理學碩士" },
    entryBackground: { en: "Business bachelor's in good standing; non-business applicants need relevant accounting, economics and statistics study, a specified CPA paper, or two years' accounting experience.", zh: "良好商科學士；非商科申請者須曾修會計、經濟、統計，或通過指定 CPA 試卷，或具兩年會計經驗。" },
    gpa: { en: "No fixed numeric GPA is published; GMAT / GRE is recommended.", zh: "官方未公布固定最低 GPA；建議提交 GMAT／GRE。" },
    curriculum: { en: "Professional accounting, reporting, analytics, assurance and business decision support.", zh: "專業會計、財務報告、分析、審計及商業決策支援。" },
    jobs: [{ en: "Financial accountant", zh: "財務會計師" }, { en: "Audit / assurance associate", zh: "審計／鑒證人員" }, { en: "Accounting-data analyst", zh: "會計數據分析師" }],
    salaryKeys: ["accountant", "finance", "data"],
    sourceCycle: "Current official page", sourceLabel: "Official admission requirements", sourceUrl: "https://msac.hkust.edu.hk/admission/admission-requirements", checkedOn: CHECKED,
  },
  internationalManagement: {
    id: "internationalManagement", institution: "HKUST",
    name: { en: "MSc in International Management", zh: "國際管理理學碩士" },
    entryBackground: { en: "A pre-experience programme for business graduates; the live programme should be checked for current experience limits and language requirements.", zh: "面向商科畢業生的 pre-experience 課程；申請時須重查最新工作年資及語言條件。" },
    gpa: { en: "No fixed numeric GPA is published.", zh: "官方未公布固定最低 GPA 數字。" },
    curriculum: { en: "34 credits in cross-cultural management, leadership, market research, responsible decision making and international exposure.", zh: "34 學分，涵蓋跨文化管理、領導、市場研究、負責任決策及國際體驗。" },
    jobs: [{ en: "Management consultant", zh: "管理顧問" }, { en: "Regional business analyst", zh: "區域商業分析師" }, { en: "International marketing manager", zh: "國際市場經理" }],
    salaryKeys: ["marketing", "data"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-imt", checkedOn: CHECKED,
  },
  globalChina: {
    id: "globalChina", institution: "HKUST",
    name: { en: "MSc in Global China Studies", zh: "環球中國研究理學碩士" },
    entryBackground: { en: "Recognised bachelor's degree and the programme's higher English requirement.", zh: "認可學士學位，並須符合課程較高的英語要求。" },
    gpa: { en: "Published minimum grade average: 3.0/4.0.", zh: "已公布最低平均成績：3.0/4.0。" },
    curriculum: { en: "Global and local perspectives on China, communication and research; optional two-year Academic Research concentration.", zh: "以全球與本地角度研究中國、訓練溝通與研究；可選兩年 Academic Research 專修。" },
    jobs: [{ en: "Research / policy analyst", zh: "研究／政策分析師" }, { en: "Regional business analyst", zh: "區域商業分析師" }, { en: "Communications specialist", zh: "傳訊專員" }],
    salaryKeys: ["data", "marketing"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-gcs/", checkedOn: CHECKED,
  },
  environment: {
    id: "environment", institution: "HKUST",
    name: { en: "MSc in Environmental Science, Management and Sustainability", zh: "環境科學、管理及可持續發展理學碩士" },
    entryBackground: { en: "Bachelor's with second-class honours or above in a relevant discipline, or an approved equivalent qualification.", zh: "相關學科二級榮譽或以上學士，或獲認可同等資格。" },
    gpa: { en: "Second-class honours or above; no universal 4.0-scale conversion is published.", zh: "二級榮譽或以上；官方沒有公布統一的 4.0 GPA 換算。" },
    curriculum: { en: "Environmental science and health, risk and impact assessment, ESG, climate change, sustainability policy and management.", zh: "環境科學與健康、風險與影響評估、ESG、氣候變化、可持續政策及管理。" },
    jobs: [{ en: "Environmental / sustainability consultant", zh: "環境／可持續發展顧問" }, { en: "Environmental engineer", zh: "環境工程師" }, { en: "ESG analyst", zh: "ESG 分析師" }],
    salaryKeys: ["environment", "data"],
    sourceCycle: "Current official page", sourceLabel: "Official programme website", sourceUrl: "https://www.envr.ust.hk/programs/taught-postgraduate-program/msc-gd-in-evsm/admission.html", checkedOn: CHECKED,
  },
  environmentalHealth: {
    id: "environmentalHealth", institution: "HKUST",
    name: { en: "MSc in Environmental Health and Safety", zh: "環境健康與安全理學碩士" },
    entryBackground: { en: "Bachelor's in life science, chemistry, environmental science or a related field.", zh: "生命科學、化學、環境科學或相關學士。" },
    gpa: { en: "Second-class honours or overall GPA of at least 70%.", zh: "二級榮譽或總 GPA／平均分不少於 70%。" },
    curriculum: { en: "Environmental health, occupational exposure, safety, risk assessment, regulation and management.", zh: "環境健康、職業暴露、安全、風險評估、規管及管理。" },
    jobs: [{ en: "Environmental health officer", zh: "環境衛生主任" }, { en: "EHS specialist", zh: "環境健康安全專員" }, { en: "Risk / compliance consultant", zh: "風險／合規顧問" }],
    salaryKeys: ["environment"],
    sourceCycle: "Current official page", sourceLabel: "Official admission requirements", sourceUrl: "https://ehs.hkust.edu.hk/admission-requirements", checkedOn: CHECKED,
  },
  publicPolicy: {
    id: "publicPolicy", institution: "HKUST",
    name: { en: "Master of Public Policy", zh: "公共政策碩士" },
    entryBackground: { en: "Recognised bachelor's degree; suitable preparation includes social science, economics, data, environment or public affairs.", zh: "認可學士學位；社會科學、經濟、數據、環境或公共事務均是相關準備。" },
    gpa: { en: "No fixed numeric GPA is published for general admission.", zh: "一般招生未公布固定最低 GPA 數字。" },
    curriculum: { en: "Policy analysis, economics, quantitative methods, governance and concentrations including environmental and sustainability policy.", zh: "政策分析、經濟、量化方法、管治，並設環境與可持續政策等專修。" },
    jobs: [{ en: "Policy / research analyst", zh: "政策／研究分析師" }, { en: "Public-sector project officer", zh: "公共部門項目主任" }, { en: "ESG / public-affairs analyst", zh: "ESG／公共事務分析師" }],
    salaryKeys: ["data", "socialWork"],
    sourceCycle: "HKUST 2026/27", sourceLabel: "Official programme catalog", sourceUrl: "https://prog-crs.hkust.edu.hk/pgprog/2026-27/mpp", checkedOn: CHECKED,
  },
  psychology: {
    id: "psychology", institution: "HKU",
    name: { en: "Master of Social Sciences in Psychology", zh: "心理學社會科學碩士" },
    entryBackground: { en: "Recognised bachelor's degree; more than one year of work experience is preferred but need not be psychology-related. For the September 2026 intake, no qualifying examination is required and interviews are arranged only if necessary.", zh: "認可學士學位；較偏好一年以上工作經驗，但不必與心理學相關。2026 年 9 月入學不設入學試，只在有需要時安排個別面試。" },
    gpa: { en: "No fixed numeric GPA is published on the official 2026 admissions page.", zh: "官方 2026 招生頁未公布固定最低 GPA 數字。" },
    curriculum: { en: "Psychology foundations and research training across quantitative methods, biological, cognitive, developmental, personality, social psychology and psychopathology, followed by a dissertation or capstone route. The displayed syllabus is the 2025/26 reference while 2026/27 remains subject to approval.", zh: "以心理學基礎與研究訓練為主，涵蓋量化方法、生物、認知、發展、人格、社會心理學及精神病理學，並以論文或總結項目完成。官方目前展示 2025/26 課程作參考，2026/27 尚待審批。" },
    jobs: [{ en: "Behavioural / consumer researcher", zh: "行為／消費者研究員" }, { en: "Research assistant", zh: "研究助理" }, { en: "Further clinical / educational psychology training", zh: "再進修臨床／教育心理學" }],
    salaryKeys: ["data", "clinicalPsych"],
    sourceCycle: "HKU September 2026 intake", sourceLabel: "HKU Department of Psychology", sourceUrl: "https://psychology.hku.hk/admission-master-of-social-sciences-in-the-field-of-psychology/", checkedOn: CHECKED,
    caution: { en: "The clinical-psychologist salary benchmark applies only after completing a recognised clinical psychology qualification.", zh: "臨床心理學家薪酬參考只適用於另行完成獲認可臨床心理學資格後。" },
  },
  appliedPsychology: {
    id: "appliedPsychology", institution: "HKU",
    name: { en: "Master of Social Sciences in Applied Psychology", zh: "應用心理學社會科學碩士" },
    entryBackground: { en: "Bachelor's degree with a major in Psychology, or a recognised equivalent qualification. The first intake commences in September 2026; interviews are arranged only if necessary.", zh: "須持心理學主修學士學位或獲認可同等資格。首屆於 2026 年 9 月開課，只在有需要時安排個別面試。" },
    gpa: { en: "No fixed numeric GPA is published on the official 2026/27 admissions page.", zh: "官方 2026/27 招生頁未公布固定最低 GPA 數字。" },
    curriculum: { en: "60 credits: six compulsory courses in psychological practice, psychotherapy, assessment, research, health psychology and ethics; three electives; and a capstone project. Electives include ageing, forensic psychology, experiential learning, developmental psychology and educational psychology.", zh: "60 學分：六門必修涵蓋心理實務、心理治療、評估、研究、健康心理及專業倫理，另修三門選修及總結項目；選修包括老齡、法證心理、體驗學習、發展及教育心理學。" },
    jobs: [{ en: "Mental-health programme / case-support officer", zh: "精神健康項目／個案支援主任" }, { en: "Workplace wellbeing / HR project officer", zh: "職場身心健康／人力資源項目主任" }, { en: "Policy, advocacy or research assistant", zh: "政策、倡議或研究助理" }],
    salaryKeys: ["socialWork", "data"],
    sourceCycle: "HKU 2026/27 first intake", sourceLabel: "HKU Department of Psychology", sourceUrl: "https://psychology.hku.hk/admission-master-of-social-sciences-in-the-field-of-appliedpsychology/", checkedOn: CHECKED,
    caution: { en: "HKU states that this programme does not confer professional licensure; the salary cards are role-level market references, not a qualification or starting-salary guarantee.", zh: "港大明確說明本課程不授予專業執業資格；薪酬卡只是相關職位的市場參考，並非資格或起薪保證。" },
  },
};

const programmePathways: Record<string, string[]> = {
  JS5102: ["ai", "bigData", "financialMath"],
  JS5103: ["environment", "environmentalHealth", "ai"],
  JS5181: ["ai", "bigData", "businessAnalytics"],
  JS5300: ["businessAnalytics", "internationalManagement", "finance"],
  JS5311: ["economics", "businessAnalytics", "finance"],
  JS5312: ["finance", "fintech", "financialMath"],
  JS5313: ["internationalManagement", "globalChina", "marketing"],
  JS5314: ["ism", "businessAnalytics", "fintech"],
  JS5315: ["internationalManagement", "businessAnalytics", "ism"],
  JS5316: ["marketing", "businessAnalytics", "ism"],
  JS5317: ["globalOperations", "businessAnalytics", "ism"],
  JS5318: ["accounting", "businessAnalytics", "finance"],
  JS5331: ["economics", "finance", "financialMath"],
  JS5332: ["financialMath", "finance", "fintech"],
  JS5411: ["globalChina", "internationalManagement", "economics"],
  JS5412: ["businessAnalytics", "globalChina", "publicPolicy"],
  JS5813: ["economics", "financialMath", "businessAnalytics"],
  JS5814: ["businessAnalytics", "fintech", "financialMath"],
  JS5822: ["environment", "finance", "businessAnalytics"],
  JS6200: ["bigData", "ai", "businessAnalytics"],
  JS6224: ["ai", "bigData", "businessAnalytics"],
  JS6248: ["fintech", "finance", "ism"],
  JS6705: ["appliedPsychology", "psychology", "publicPolicy"],
  JS6717: ["globalChina", "publicPolicy", "psychology", "appliedPsychology"],
  JS6729: ["financialMath", "finance", "businessAnalytics"],
  JS6731: ["publicPolicy", "psychology", "globalChina"],
  JS6755: ["internationalManagement", "businessAnalytics", "marketing"],
  JS6767: ["economics", "finance", "businessAnalytics"],
  JS6779: ["businessAnalytics", "financialMath", "bigData"],
  JS6781: ["accounting", "businessAnalytics", "finance"],
  JS6793: ["businessAnalytics", "ism", "globalOperations"],
  JS6846: ["marketing", "businessAnalytics", "ism"],
  JS6860: ["finance", "fintech", "internationalManagement"],
  JS6884: ["financialMath", "finance", "fintech"],
  JS6896: ["internationalManagement", "marketing", "globalChina"],
  JS6999: ["bigData", "ai", "ism"],
};

export function masterPathwaysFor(programme: Programme): MasterPathway[] {
  const ids = programmePathways[programme.jupas_code] ?? ["businessAnalytics", "internationalManagement"];
  return ids.map((id) => pathways[id]).filter((item): item is MasterPathway => Boolean(item));
}

export function salariesFor(pathway: MasterPathway): SalaryBenchmark[] {
  return pathway.salaryKeys.map((key) => salaryBenchmarks[key]).filter((item): item is SalaryBenchmark => Boolean(item));
}

export function localized(text: LocalizedText, lang: Lang): string {
  return text[lang];
}

export const MASTER_DATA_SCOPE: LocalizedText = {
  en: "Curated relevant HKU / HKUST taught master's routes, not an exhaustive worldwide list. Requirements can change before you apply.",
  zh: "這是與該 major 相關的港大／科大授課式碩士策展清單，並非全球完整名錄；正式申請前要求仍可能改動。",
};
