import {execFileSync} from 'node:child_process';
import {readdir} from 'node:fs/promises';
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const blocked=tracked.filter(p=>/(^|\/)(source_pdfs|analysis|content|\.tools|\.deployment|reference-assets|output|node_modules|__pycache__)(\/|$)/i.test(p)||/\.(pdf|zip|pyc)$/i.test(p)||/(^|\/)\.env($|\.)/i.test(p)||/^(coverage-report\.md|red-emphasis-audit\.csv|question-audit\.json|unresolved-issues\.md|PROJECT_STATUS\.md|APPLY_PROFESSOR_HINTS\.md|PROFESSOR_MIDTERM_HINTS\.md)$/i.test(p));
const scan=async dir=>{for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())await scan(p);else if(/\.pdf$/i.test(p))blocked.push(p)}};
await scan('dist');
if(blocked.length){console.error('Private files found:',blocked);process.exit(1)}
console.log(`Public file guard passed: ${tracked.length} tracked files, no original PDFs or internal review files.`);
