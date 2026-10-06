import { runPhase3And4Tests } from './phase3-phase4.test';
import { runPhase5And6Tests } from './phase5-phase6.test';
import { runYouTubeTests } from './youtube-provider.test';

async function runAll() {
  await runPhase3And4Tests();
  await runPhase5And6Tests();
  await runYouTubeTests();
}

runAll().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

