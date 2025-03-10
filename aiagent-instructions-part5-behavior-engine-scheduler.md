# Behavior Engine - Scheduler Implementation

The Scheduler manages temporal triggers and scheduled tasks, enabling the agent to perform actions at specific times or intervals.

## Implementation Steps

### 1. Create Scheduler Types

Create `src/agent/scheduler.ts` with the following type definitions:

```typescript
import { Database } from '../database/connection';

export interface ScheduledJob {
  id: string;
  cronExpression: string;
  jobType: string;
  metadata: any;
  nextRunTime: Date;
  lastRunTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobDefinition {
  cronExpression: string;
  jobType: string;
  metadata?: any;
}
```

### 2. Implement Scheduler Class

Add the following implementation to the same file:

```typescript
export class Scheduler {
  private db: Database;
  private activeJobs: Map<string, NodeJS.Timeout> = new Map();
  private jobHandlers: Map<string, (metadata: any) => Promise<void>> = new Map();
  
  constructor(db: Database) {
    this.db = db;
  }
  
  async initialize(): Promise<void> {
    // Load persistent jobs from database
    const persistentJobs = await this.db.scheduledJobs.find({}).toArray();
    
    // Schedule all jobs
    for (const job of persistentJobs) {
      this.scheduleJobExecution(job);
    }
    
    console.log(`Initialized scheduler with ${persistentJobs.length} jobs`);
  }
  
  registerJobHandler(jobType: string, handler: (metadata: any) => Promise<void>): void {
    this.jobHandlers.set(jobType, handler);
    console.log(`Registered job handler for ${jobType}`);
  }
  
  async scheduleJob(definition: JobDefinition): Promise<string> {
    // Ensure we have a handler for this job type
    if (!this.jobHandlers.has(definition.jobType)) {
      throw new Error(`No handler registered for job type: ${definition.jobType}`);
    }
    
    const job: ScheduledJob = {
      id: this.generateId(),
      cronExpression: definition.cronExpression,
      jobType: definition.jobType,
      metadata: definition.metadata || {},
      nextRunTime: this.calculateNextRunTime(definition.cronExpression),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in database
    await this.db.scheduledJobs.insertOne(job);
    
    // Schedule job execution
    this.scheduleJobExecution(job);
    
    console.log(`Scheduled new job: ${job.id} (${job.jobType})`);
    
    return job.id;
  }
  
  async cancelJob(jobId: string): Promise<boolean> {
    // Clear timeout
    const timeout = this.activeJobs.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeJobs.delete(jobId);
    }
    
    // Remove from database
    const result = await this.db.scheduledJobs.deleteOne({ id: jobId });
    
    console.log(`Cancelled job: ${jobId} (success: ${result.deletedCount === 1})`);
    
    return result.deletedCount === 1;
  }
  
  private scheduleJobExecution(job: ScheduledJob): void {
    const now = new Date();
    const nextRunTime = new Date(job.nextRunTime);
    
    // Calculate delay in milliseconds
    const delay = Math.max(0, nextRunTime.getTime() - now.getTime());
    
    // Get handler for this job type
    const handler = this.jobHandlers.get(job.jobType);
    
    if (!handler) {
      console.warn(`No handler registered for job type: ${job.jobType}`);
      return;
    }
    
    // Schedule execution
    const timeout = setTimeout(async () => {
      try {
        // Execute handler
        await handler(job.metadata);
        console.log(`Executed job: ${job.id} (${job.jobType})`);
      } catch (error) {
        console.error(`Error executing job ${job.id}: ${error.message}`);
      }
      
      // Update job status
      const lastRunTime = new Date();
      const nextRunTime = this.calculateNextRunTime(job.cronExpression);
      
      // Update in database
      await this.db.scheduledJobs.updateOne(
        { id: job.id },
        { 
          $set: { 
            lastRunTime,
            nextRunTime,
            updatedAt: new Date()
          } 
        }
      );
      
      // Reschedule
      this.scheduleJobExecution({
        ...job,
        lastRunTime,
        nextRunTime
      });
    }, delay);
    
    // Store timeout reference
    this.activeJobs.set(job.id, timeout);
  }
  
  private calculateNextRunTime(cronExpression: string): Date {
    // For simplicity, we'll implement a basic version that supports:
    // - Daily jobs at specific time: "HH:MM"
    // - Interval jobs: "every Xh" or "every Xm"
    
    const now = new Date();
    let nextRun = new Date(now);
    
    if (cronExpression.startsWith("every ")) {
      const intervalPart = cronExpression.substring(6);
      const value = parseInt(intervalPart);
      
      if (intervalPart.endsWith("h")) {
        // Hours
        nextRun.setHours(now.getHours() + value);
      } else if (intervalPart.endsWith("m")) {
        // Minutes
        nextRun.setMinutes(now.getMinutes() + value);
      } else if (intervalPart.endsWith("d")) {
        // Days
        nextRun.setDate(now.getDate() + value);
      }
    } else if (cronExpression.match(/^\d{2}:\d{2}$/)) {
      // Daily at specific time (HH:MM)
      const [hours, minutes] = cronExpression.split(":").map(Number);
      
      nextRun.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    }
    
    return nextRun;
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

### 3. Create Database Indexes

Add the following to `src/database/setup.ts` to create indexes for efficient scheduler operations:

```typescript
// Create indexes for scheduled jobs
await db.scheduledJobs.createIndex({ jobType: 1 });
await db.scheduledJobs.createIndex({ nextRunTime: 1 });
```

### 4. Example Usage

Here's an example of how to use the Scheduler:

```typescript
// Initialize scheduler
const scheduler = new Scheduler(db);

// Register job handlers
scheduler.registerJobHandler('DAILY_REGULATORY_CHECK', async (metadata) => {
  // Check for regulatory changes
  await regulatoryMonitor.checkForRegulatoryChanges();
});

scheduler.registerJobHandler('CERTIFICATION_EXPIRATION_CHECK', async (metadata) => {
  // Check for expiring certifications
  await certificationMonitor.checkExpiringCertifications();
});

// Schedule jobs
await scheduler.scheduleJob({
  cronExpression: '03:00', // 3 AM daily
  jobType: 'DAILY_REGULATORY_CHECK'
});

await scheduler.scheduleJob({
  cronExpression: 'every 24h',
  jobType: 'CERTIFICATION_EXPIRATION_CHECK'
});

// Initialize scheduler (load existing jobs)
await scheduler.initialize();
``` 