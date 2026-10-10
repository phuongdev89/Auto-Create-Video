import { startProgressServer } from './server.js';
import { updateProgress } from './state.js';
import { resolve, relative, isAbsolute } from 'node:path';
const [session,stage,...message]=process.argv.slice(2);
if(!session){console.error('Usage: npm run progress -- output/<session> [stage message]');process.exitCode=2}
else if(stage){const rel=relative(resolve('output'),resolve(session));if(!rel||rel.startsWith('..')||isAbsolute(rel))throw new Error('Progress requires output/<session>/.');await updateProgress(session,stage,message.join(' '),true)}
else {const task=await startProgressServer(session);console.log(`\n=== MỞ TRANG PROGRESS NGAY ===\n${task.url}\n==============================\nProgress riêng cho người tạo; giữ lệnh này chạy xuyên suốt task.`);process.once('SIGINT',task.close);process.once('SIGTERM',task.close)}
