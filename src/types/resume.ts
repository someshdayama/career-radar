export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl?: string;
  };
  summary: string;
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string[];
  }[];

  education: {
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
  }[];
  skills: string[];
}
