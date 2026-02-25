import { Queue, Worker, Job } from "bullmq";
import type { BuildTarget, BuildOptions, BuildStatus } from "./buildTargets";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BuildJobData {
  buildId: string;
  projectId: string;
  userId: string;
  target: BuildTarget;
  options: BuildOptions;
  isEnterprise: boolean;
}

export interface BuildJobResult {
  status: BuildStatus;
  artifactUrl?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Redis connection config (from env)
// ---------------------------------------------------------------------------

function getRedisConnection() {
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = parseInt(process.env.REDIS_PORT ?? "6379", 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  return { host, port, password };
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

const QUEUE_NAME = "prestige-builds";
let buildJobQueue: Queue<BuildJobData, BuildJobResult> | null = null;

export function getBuildJobQueue(): Queue<BuildJobData, BuildJobResult> {
  if (!buildJobQueue) {
    buildJobQueue = new Queue<BuildJobData, BuildJobResult>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return buildJobQueue;
}

// ---------------------------------------------------------------------------
// Add a build job to the queue
// ---------------------------------------------------------------------------

export async function addBuildJob(data: BuildJobData): Promise<Job<BuildJobData, BuildJobResult>> {
  const queue = getBuildJobQueue();
  const priority = data.isEnterprise ? 1 : 5; // lower = higher priority in BullMQ
  return queue.add("build", data, {
    priority,
    jobId: data.buildId,
  });
}

// ---------------------------------------------------------------------------
// Worker (call startBuildWorker() once in your worker process)
// ---------------------------------------------------------------------------

type BuildProcessor = (data: BuildJobData) => Promise<BuildJobResult>;

export function startBuildWorker(
  processor: BuildProcessor,
  concurrency = 3,
): Worker<BuildJobData, BuildJobResult> {
  const worker = new Worker<BuildJobData, BuildJobResult>(
    QUEUE_NAME,
    async (job: Job<BuildJobData, BuildJobResult>) => {
      return processor(job.data);
    },
    {
      connection: getRedisConnection(),
      concurrency,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[BuildWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[BuildWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
