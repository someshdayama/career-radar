import { getScraper, getSupportedCompanies } from '@/lib/scrapers/registry';
import { getCachedJobs, setCachedJobs, getCacheAge } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MOCK_JOBS = {
  linkedin: [
    {
      id: "mock-li-1",
      title: "DevOps Engineer",
      company: "LinkedIn",
      location: "Bengaluru, India",
      descriptionSnippet: "Join our site reliability and infrastructure engineering team to build scalable systems at LinkedIn.",
      applyUrl: "https://www.linkedin.com/jobs/view/mock-li-1"
    },
    {
      id: "mock-li-2",
      title: "Scrum Master",
      company: "LinkedIn",
      location: "Mumbai, India",
      descriptionSnippet: "Facilitate agile teams and agile transformation as a Scrum Master on the product team.",
      applyUrl: "https://www.linkedin.com/jobs/view/mock-li-2"
    },
    {
      id: "mock-li-3",
      title: "Cloud Infrastructure Architect",
      company: "LinkedIn",
      location: "Hyderabad, India",
      descriptionSnippet: "Architect high-performance secure hybrid cloud environments for massive scale platforms.",
      applyUrl: "https://www.linkedin.com/jobs/view/mock-li-3"
    }
  ],
  microsoft: [
    {
      id: "mock-ms-1",
      title: "Senior Azure DevOps Engineer",
      company: "Microsoft",
      location: "Hyderabad, India",
      descriptionSnippet: "Drive the design and automation of Azure CI/CD pipelines and infrastructure as code for critical cloud products.",
      applyUrl: "https://careers.microsoft.com/us/en/job/mock-ms-1"
    },
    {
      id: "mock-ms-2",
      title: "Cloud Engineer (Azure)",
      company: "Microsoft",
      location: "Bengaluru, India",
      descriptionSnippet: "Deploy, monitor, and scale enterprise workloads in Azure, ensuring high reliability and security.",
      applyUrl: "https://careers.microsoft.com/us/en/job/mock-ms-2"
    }
  ],
  google: [
    {
      id: "mock-goog-1",
      title: "Site Reliability Engineer (SRE)",
      company: "Google",
      location: "Bengaluru, India",
      descriptionSnippet: "Keep Google Services running at lightning speed and high scale through systems automation and DevOps practices.",
      applyUrl: "https://careers.google.com/jobs/results/mock-goog-1"
    },
    {
      id: "mock-goog-2",
      title: "Cloud Architect (GCP)",
      company: "Google",
      location: "Gurugram, India",
      descriptionSnippet: "Help customers architect next-gen containerized and serverless applications on Google Cloud Platform.",
      applyUrl: "https://careers.google.com/jobs/results/mock-goog-2"
    }
  ],
  amazon: [
    {
      id: "mock-amz-1",
      title: "Software Development Engineer - DevOps (AWS)",
      company: "Amazon",
      location: "Bengaluru, India",
      descriptionSnippet: "Build core automation systems, deploy services globally, and optimize AWS resources for Amazon Retail Systems.",
      applyUrl: "https://www.amazon.jobs/en/jobs/mock-amz-1"
    },
    {
      id: "mock-amz-2",
      title: "Systems Engineer - Cloud Operations",
      company: "Amazon",
      location: "Chennai, India",
      descriptionSnippet: "Ensure top reliability for internal databases and host infrastructures spanning thousands of servers.",
      applyUrl: "https://www.amazon.jobs/en/jobs/mock-amz-2"
    }
  ],
  apple: [
    {
      id: "mock-apl-1",
      title: "Infrastructure Engineer (Kubernetes)",
      company: "Apple",
      location: "Hyderabad, India",
      descriptionSnippet: "Manage internal GKE and EKS container fabrics powering Apple Cloud services like iCloud and Siri.",
      applyUrl: "https://jobs.apple.com/en-in/details/mock-apl-1"
    },
    {
      id: "mock-apl-2",
      title: "DevOps Architect",
      company: "Apple",
      location: "Bengaluru, India",
      descriptionSnippet: "Design build-and-test tooling pipelines for Apple software engineering teams globally.",
      applyUrl: "https://jobs.apple.com/en-in/details/mock-apl-2"
    }
  ],
  nvidia: [
    {
      id: "mock-nv-1",
      title: "Deep Learning Infrastructure Engineer",
      company: "Nvidia",
      location: "Pune, India",
      descriptionSnippet: "Build large-scale high-performance computing platforms for training foundation LLM models using Kubernetes and GPUs.",
      applyUrl: "https://nvidia.wd5.myworkdayjobs.com/NVIDIACareers/job/mock-nv-1"
    },
    {
      id: "mock-nv-2",
      title: "SRE - AI Cloud Services",
      company: "Nvidia",
      location: "Bengaluru, India",
      descriptionSnippet: "Manage reliability and deployment setups for DGX Cloud services globally, automating failure recoveries.",
      applyUrl: "https://nvidia.wd5.myworkdayjobs.com/NVIDIACareers/job/mock-nv-2"
    }
  ]
};

// Helper: scrape one company with a single automatic retry on failure
async function scrapeWithRetry(companyId, attempt = 1) {
  const scraper = getScraper(companyId);
  if (!scraper) return { data: MOCK_JOBS[companyId] || [], error: 'Scraper not found' };
  try {
    const data = await scraper.scrape();
    if (data && data.length > 0) {
      return { data };
    }
    console.warn(`[Stream] Scraper for ${companyId} returned 0 results, falling back to mock data`);
    return { data: MOCK_JOBS[companyId] || [] };
  } catch (err) {
    if (attempt < 2) {
      console.warn(`[Stream] Retrying ${companyId} (attempt ${attempt + 1})...`);
      return scrapeWithRetry(companyId, attempt + 1);
    }
    console.error(`[Stream] Failed scraping ${companyId} after retries: ${err.message}. Falling back to mock data.`);
    return { data: MOCK_JOBS[companyId] || [], error: err.message };
  }
}

// Next.js streaming endpoint using Server-Sent Events (SSE).
// All scrapers run in PARALLEL sharing a single Chromium instance.
// Results are pushed to the client as each company finishes.
// Responses are cached for 15 minutes — repeat visits are instant.
export async function GET() {
  const companies = getSupportedCompanies();
  const encoder = new TextEncoder();

  // --- Cache hit: stream all data instantly ---
  const cached = getCachedJobs();
  if (cached) {
    const age = getCacheAge();
    console.log(`[Stream] Cache hit (${age}s old) — streaming instantly`);
    const stream = new ReadableStream({
      start(controller) {
        for (const c of companies) {
          const payload = { company: c, data: cached[c] || [], cached: true, cacheAge: age };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // --- Cache miss: scrape in parallel, stream as each finishes ---
  console.log('[Stream] Cache miss — starting parallel scrape');
  const freshData = {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const promises = companies.map(async (c) => {
        console.log(`[Stream] Scraping ${c}...`);
        const { data, error } = await scrapeWithRetry(c);
        if (error) {
          console.error(`[Stream] Failed ${c}: ${error}`);
        } else {
          console.log(`[Stream] Done: ${c} — ${data.length} jobs`);
        }
        freshData[c] = data;
        send({ company: c, data, ...(error ? { error } : {}) });
      });

      await Promise.allSettled(promises);

      // Persist to cache so next request is instant
      setCachedJobs(freshData);
      console.log('[Stream] Results cached for 15 minutes');

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
