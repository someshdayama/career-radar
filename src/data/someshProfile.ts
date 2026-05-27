import { ResumeData } from "@/types/resume";

export const SOMESH_PROFILE: ResumeData = {
  personalInfo: {
    fullName: "Somesh Dayama",
    email: "someshdayama2@gmail.com",
    phone: "7049614849",
    location: "Mumbai, India",
    linkedinUrl: "https://www.linkedin.com/in/somesh-dayama/",
  },
  summary:
    "Results-driven Software Engineer with over 3 years of experience specializing in cloud infrastructure, high-performance CI/CD automation, and site reliability engineering. Adept at optimizing system architecture across GCP, Azure, and AWS to drive down cloud expenditures and maximize deployment frequencies. Leverages automated tooling and agile practices as a force multiplier to streamline complex release management, eliminate technical debt, and ensure zero-drift infrastructure stability.",
  experience: [
    {
      company: "NCR Atleos Corporation",
      position: "Software Engineer",
      startDate: "Feb 2025",
      endDate: "Present",
      description: [
        "Release Train Engineer (RTE): Managed release lifecycles and cross-functional CI/CD coordination for the AMP Services Product on Azure, aligning delivery timelines and mitigating operational risks.",
        "Scrum Master: Facilitated agile ceremonies and cleared blockers for an 18-member engineering squad, driving sprint predictability and process optimization.",
        "Incident Response & Release Lead: Functioned as primary Incident Commander for mission-critical production outages, architecting coordination strategies between Dev and Ops teams to significantly reduce Mean Time to Resolution.",
        "DevOps Orchestration: Spearheaded infrastructure provisioning and environment setup using GCP (GKE, Compute Engine), utilizing Jenkins, Helm, and Ansible to maintain high availability and deployment velocity.",
        "Infrastructure Optimization: Conducted self-initiated legacy upgrades and continuous drift detection, successfully maintaining zero configuration drift across multi-cloud environments.",
      ],
    },
    {
      company: "Monocept Consulting Pvt. Ltd.",
      position: "Software Engineer",
      startDate: "May 2023",
      endDate: "Feb 2025",
      description: [
        "FinOps & Cost Optimization: Developed automated scripts and engineered resource allocation strategies on GCP, delivering a 34.56% reduction in cloud infrastructure costs via precision instance rightsizing and auto-scaling.",
        "Database Reliability: Architected automated database maintenance blueprints and failover strategies utilizing Terraform and Ansible, decreasing database-related production incidents by 24%.",
        "Infrastructure as Code (IaC): Orchestrated environment deployment for the Authentic Switch application across production and staging GCP environments using Terraform, establishing fully reproducible, scalable infrastructure.",
      ],
    },
    {
      company: "Monocept Consulting Pvt. Ltd.",
      position: "Trainee Software Engineer",
      startDate: "Jan 2023",
      endDate: "Apr 2023",
      description: [
        "CI/CD Automation: Automated Jenkins-based deployment pipelines for the flagship Domino’s App (Jubilant Foods), radically minimizing manual interventions and reducing deployment cycle times.",
        "Cloud Provisioning: Managed Linux virtual environments and leveraged AWS core services to dynamically provision scalable staging environments for cross-functional development teams.",
      ],
    },
  ],

  education: [
    { institution: "National Institute of Technology (NIT), Bhopal", degree: "Master of Computer Applications (MCA)", startDate: "", endDate: "2023" },
    { institution: "Prestige Institute of Management and Research, Indore", degree: "Bachelor of Computer Applications (BCA)", startDate: "", endDate: "2020" },
  ],
  skills: [
    "GCP",
    "AWS",
    "Azure",
    "Terraform",
    "Ansible",
    "Docker",
    "Kubernetes (GKE)",
    "Helm",
    "Jenkins",
    "GitHub Actions",
    "Java",
    "Python",
    "Groovy",
    "Bash",
    "Linux Shell",
    "SQL",
    "Prometheus",
    "Grafana",
    "System Design",
    "Agile/Scrum",
    "Git",
    "JIRA",
    "Maven",
    "English",
    "Hindi"
  ],
};
