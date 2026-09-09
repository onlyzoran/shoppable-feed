export type Platform = "shopify" | "tilda" | "html";

export type JobStatus = "pending" | "processing" | "done" | "failed";

export type JobStage = "detecting" | "fetching" | "normalizing";

export type CatalogProduct = {
  id: string;
  label: string;
  url: string;
  keywords: string[];
  priority?: number;
  imageUrl?: string;
  price?: string;
};

export type ParsedCatalog = {
  storeHostname: string;
  platform: Platform;
  products: CatalogProduct[];
};

export type ParseJob = {
  id: string;
  url: string;
  limit: number;
  status: JobStatus;
  stage?: JobStage;
  createdAt: number;
  updatedAt: number;
  catalog?: ParsedCatalog;
  error?: string;
};

export type CreateJobRequest = {
  url: string;
  limit?: number;
};

export type JobResponse = {
  jobId: string;
  status: JobStatus;
  stage?: JobStage;
  pollUrl: string;
  catalog?: ParsedCatalog;
  error?: string;
};
