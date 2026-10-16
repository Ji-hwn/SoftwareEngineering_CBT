import {readFile,writeFile,mkdir} from 'node:fs/promises';
const d=JSON.parse(await readFile('src/data/course.json','utf8')),errors=[];
const facts=new Map(d.red_scope.evidence.map(e=>[e.evidence_id,e])),approved=new Set(d.red_scope.approved_question_ids),topics=new Map(d.red_scope.topics.map(t=>[t.topic_id,t]));
const statuses=['DIRECT_RED','RED_TOPIC_CONTENT','OUT_OF_SCOPE','NEEDS_REVIEW','EXPLICITLY_EXCLUDED','LEGACY_ONLY'];
const validSource=(s,general=false)=>{const l=[...d.lectures,...(general?[]:d.quiz_sources)].find(l=>l.lecture_id===s.lecture_id);return !!l&&l.file===s.source_pdf&&s.source_page>=1&&s.source_page<=l.page_count};
for(const t of topics.values()){
 if(!t.verified||!t.relation||!t.boundary||!t.anchor_sources.length||t.anchor_sources.some(s=>!validSource(s,true))||!t.content_pages.length)errors.push('invalid topic '+t.topic_id);
 if(t.content_pages.some(p=>!validSource({lecture_id:t.lecture_id,source_pdf:d.lectures.find(l=>l.lecture_id===t.lecture_id)?.file,source_page:p},true)))errors.push('invalid topic boundary '+t.topic_id);
}
for(const e of facts.values()){
 if(!validSource(e,true)||!['A','B'].includes(e.category)||!e.verified||!e.scope_limit)errors.push('invalid emphasis source '+e.evidence_id);
 for(const id of e.question_ids)if(!approved.has(id))errors.push('unapproved evidence link '+id);
}
for(const q of d.questions){
 if(!statuses.includes(q.red_scope_status)||!q.red_review_reason)errors.push('missing individual decision '+q.question_id);
 if(['DIRECT_RED','RED_TOPIC_CONTENT'].includes(q.red_scope_status)!==approved.has(q.question_id))errors.push('allowlist mismatch '+q.question_id);
 if(!approved.has(q.question_id))continue;
 if(q.retired||!q.verified||q.quality_status==='NEEDS_REVIEW'||q.midterm_excluded||d.exam_scope.xp_excluded_concept_ids.includes(q.concept_id)||d.exam_scope.xp_excluded_question_ids.includes(q.question_id)||q.scope_status!=='IN_SCOPE')errors.push('blocked candidate '+q.question_id);
 if(!validSource(q)||!q.red_answer_sources?.length||q.red_answer_sources.some(s=>!validSource(s)))errors.push('invalid answer source '+q.question_id);
 if(!q.red_evidence_ids?.length||q.red_evidence_ids.some(id=>!facts.has(id)))errors.push('missing emphasis proof '+q.question_id);
 if(q.red_scope_status==='DIRECT_RED'&&!q.red_evidence_ids.some(id=>facts.get(id)?.category==='A'))errors.push('direct without A proof '+q.question_id);
 if(!q.red_topic_ids?.length||q.red_topic_ids.some(id=>{const t=topics.get(id);return !t||!q.red_answer_sources.some(s=>validSource(s,true)&&s.lecture_id===t.lecture_id&&t.content_pages.includes(s.source_page))}))errors.push('missing topic-to-answer relation '+q.question_id);
 if(!q.red_topic_anchor_sources?.length||q.red_topic_anchor_sources.some(s=>!validSource(s,true)))errors.push('invalid anchor '+q.question_id);
 if(q.question_id.startsWith('q-red-')){
  if(q.options.length!==4||new Set(q.options).size!==4||!Number.isInteger(q.correct_answer)||q.correct_answer<0||q.correct_answer>3)errors.push('single answer '+q.question_id);
  for(let i=0;i<4;i++)if(!q.option_explanations?.[i]||(i!==q.correct_answer&&!q.wrong_option_explanations?.[i]))errors.push('rationale '+q.question_id);
 }
}
for(const c of d.memory_cards.filter(c=>c.red_scope_status==='RED_TOPIC_CONTENT')){
 if(!c.atomic_item_ids.length||c.atomic_item_ids.some(id=>d.atomic_items.find(a=>a.atomic_item_id===id)?.red_scope_status!=='RED_TOPIC_CONTENT'))errors.push('overbroad memory card '+c.card_id);
}
const counts=Object.fromEntries(statuses.map(s=>[s,d.questions.filter(q=>q.red_scope_status===s).length]));
if(JSON.stringify(counts)!==JSON.stringify(Object.fromEntries(statuses.map(s=>[s,d.red_scope.counts[s]??0]))))errors.push('classification counts mismatch');
const report={policy:d.red_scope.policy,counts,verified_topic_candidates:approved.size,independent_selection_families:new Set(d.questions.filter(q=>approved.has(q.question_id)).map(q=>q.red_selection_family??q.selection_family??q.question_id)).size,new_questions_this_revision:d.red_scope.new_questions,topics:topics.size,evidence:facts.size,errors,limitations:'구조 검사이며 의미 검증의 대체가 아님. 비공개 원본 대조·개별 판정과 함께 확인해야 함.'};
await mkdir('analysis/red-topics-2026-10-16',{recursive:true});await writeFile('analysis/red-topics-2026-10-16/content-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
