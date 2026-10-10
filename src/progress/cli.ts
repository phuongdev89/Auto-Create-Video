import { startProgressServer } from './server.js';
import { updateProgress } from './state.js';
import { resolve, relative, isAbsolute } from 'node:path';
const [session,stage,...message]=process.argv.slice(2);
if(!session){console.error('Usage: npm run progress -- output/<session> [stage message]');process.exitCode=2}
else if(stage){const rel=relative(resolve('output'),resolve(session));if(!rel||rel.startsWith('..')||isAbsolute(rel))throw new Error('Progress requires output/<session>/.');await updateProgress(session,stage,message.join(' '),true)}
else {const task=await startProgressServer(session);console.log(`Progress riêng cho người tạo: ${task.url}\nGiữ lệnh này chạy xuyên suốt task; Ctrl+C để dừng.`);process.once('SIGINT',task.close);process.once('SIGTERM',task.close)}
