import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/backend/.env') });

async function run() {
  const { Worker, bundleWorkflowCode } = await import('@temporalio/worker');
  const activities = await import('./activities');

  const workflowBundle = await bundleWorkflowCode({
    workflowsPath: require.resolve('./workflows.ts'),
  });

  const worker = await Worker.create({
    workflowBundle,
    activities,
    taskQueue: 'bank-sync',
  });

  console.log('Temporal worker started on task queue: bank-sync');
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
