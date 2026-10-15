import {readFile,writeFile,mkdir} from 'node:fs/promises';
const d=JSON.parse(await readFile('src/data/course.json','utf8')),errors=[];
const facts=new Map(d.red_scope.evidence.map(e=>[e.evidence_id,e])),approved=new Set(d.red_scope.approved_question_ids);
const statuses=['IN_SCOPE_RED','OUT_OF_SCOPE','NEEDS_REVIEW','EXPLICITLY_EXCLUDED','LEGACY_ONLY'];
for(const e of facts.values()){
 const l=d.lectures.find(l=>l.lecture_id===e.lecture_id);
 if(!l||l.file!==e.source_pdf||/solution/i.test(e.source_pdf)||e.source_page<1||e.source_page>l.page_count||e.category!=='A'||!e.verified||!e.scope_limit)errors.push('invalid direct red source '+e.evidence_id);
 for(const id of e.question_ids)if(!approved.has(id))errors.push('unapproved evidence link '+id);
}
for(const q of d.questions){
 if(!statuses.includes(q.red_scope_status)||!q.red_review_reason)errors.push('missing classification '+q.question_id);
 if((q.red_scope_status==='IN_SCOPE_RED')!==approved.has(q.question_id))errors.push('allowlist mismatch '+q.question_id);
 if(!approved.has(q.question_id))continue;
 if(q.retired||!q.verified||q.quality_status==='NEEDS_REVIEW'||q.midterm_excluded||d.exam_scope.xp_excluded_concept_ids.includes(q.concept_id)||d.exam_scope.xp_excluded_question_ids.includes(q.question_id)||q.scope_status!=='IN_SCOPE')errors.push('blocked candidate '+q.question_id);
 if(!q.red_evidence_ids.length||q.red_evidence_ids.some(id=>!facts.has(id)))errors.push('missing red proof '+q.question_id);
 if(q.question_id.startsWith('q-red-')){
  if(q.options.length!==4||new Set(q.options).size!==4||!Number.isInteger(q.correct_answer)||q.correct_answer<0||q.correct_answer>3)errors.push('new single answer '+q.question_id);
  for(let i=0;i<4;i++)if(!q.option_explanations?.[i]||(i!==q.correct_answer&&!q.wrong_option_explanations?.[i]))errors.push('new rationale '+q.question_id);
 }
}
const counts=Object.fromEntries(statuses.map(s=>[s,d.questions.filter(q=>q.red_scope_status===s).length]));
if(JSON.stringify(counts)!==JSON.stringify(Object.fromEntries(statuses.map(s=>[s,d.red_scope.counts[s]??0]))))errors.push('classification counts mismatch');
const report={policy:d.red_scope.policy,counts,verified_red_candidates:approved.size,independent_selection_families:new Set(d.questions.filter(q=>approved.has(q.question_id)).map(q=>q.red_selection_family??q.selection_family??q.question_id)).size,new_questions:d.questions.filter(q=>q.question_id.startsWith('q-red-')).length,evidence:facts.size,errors,limitations:'구조 검사'+'이며 의미 검증은 비공개 원본 대조 기록에 근거. 제목·정답 색의 하위 내용 확대를 허용하지 않음.'};
await mkdir('analysis/red-only-2026-10-15',{recursive:true});await writeFile('analysis/red-only-2026-10-15/content-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
