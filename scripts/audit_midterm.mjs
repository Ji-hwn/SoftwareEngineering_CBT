import {readFile,writeFile} from 'node:fs/promises';
const d=JSON.parse(await readFile('src/data/course.json','utf8'));
const errors=[],allowed=new Set(d.exam_scope.lecture_ids),lectureMap=new Map(d.lectures.map(l=>[l.lecture_id,l]));
if(d.lectures.length!==7||d.pages.length!==187||d.pages.filter(p=>p.atomic_item_ids.length).length!==173)errors.push('syllabus changed');
for(const l of d.lectures)if(!allowed.has(l.lecture_id)||/solution/i.test(l.file))errors.push(`reference became syllabus ${l.lecture_id}`);
const active=d.questions.filter(q=>!q.retired),style=active.filter(q=>q.teacher_style),newQuestions=d.questions.filter(q=>q.question_id.startsWith('q-midterm-'));
for(const q of active){
 if(q.scope_status!=='IN_SCOPE')errors.push(`unapproved scope ${q.question_id}`);
 for(const s of q.sources??[q]){const l=lectureMap.get(s.lecture_id);if(!l||!allowed.has(s.lecture_id)||s.source_pdf!==l.file||s.source_page<1||s.source_page>l.page_count)errors.push(`source ${q.question_id}`)}
}
for(const q of style){
 if(q.options.length!==4||typeof q.correct_answer!=='number'||!Number.isInteger(q.correct_answer)||q.correct_answer<0||q.correct_answer>3)errors.push(`single-choice structure ${q.question_id}`);
 if(new Set(q.options).size!==4)errors.push(`duplicate options ${q.question_id}`);
 for(let i=0;i<4;i++)if(!q.option_explanations?.[i])errors.push(`option rationale ${q.question_id}:${i}`);
 if(!q.style_tag||!q.scope_evidence)errors.push(`missing review ${q.question_id}`);
}
for(const n of d.learning_notes)for(const s of n.sources){const l=lectureMap.get(s.lecture_id);if(!l||s.source_pdf!==l.file||s.source_page<1||s.source_page>l.page_count)errors.push(`note source ${n.note_id}`)}
for(const s of d.focus_sets)if(!s.concept_ids.every(id=>d.concepts.some(c=>c.concept_id===id)))errors.push(`memory set ${s.set_id}`);
const count=(items,key)=>Object.fromEntries([...new Set(items.map(q=>q[key]))].map(k=>[k,items.filter(q=>q[key]===k).length]));
const before={stored:352,active:218,choice:47,notion_notes:0,teacher_style_mode:0};
const report={before,after:{stored:d.questions.length,active:active.length,archived:d.questions.filter(q=>q.retired).length,choice:active.filter(q=>q.question_type==='choice').length,teacher_style:style.length,new_questions:newQuestions.length,upgraded_existing_style:style.length-newQuestions.length,notes:d.learning_notes.length,focus_sets:d.focus_sets.length},
 new_question_styles:count(newQuestions,'style_tag'),new_question_difficulty:count(newQuestions,'difficulty'),
 stored_correct_position:count(newQuestions,'correct_answer'),active_type_distribution:count(active,'question_type'),
 references:d.reference_scope_summary,scope_errors:errors,source_answer_review:'기존·신규 문항의 범위는 원본·학습 항목과 대조. 자동 구조 검사만으로 정답 의미가 증명되지는 않음.',
 semantic_review:'신규 74개와 보강 18개는 정답·각 보기의 근거를 저작 과정에서 대조했다. 자동 검사만으로 의미적 정답 유일성을 증명하거나 외부 독립 인증·전체 PDF 100% 완전성으로 주장하지 않는다.'};
await writeFile('analysis/final-midterm-question-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({after:report.after,styles:report.new_question_styles,errors},null,2));
if(errors.length)process.exitCode=1;
