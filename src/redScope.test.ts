import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Diagram} from './Diagrams';
import {course,questionMap} from './store';
import {emptyState,selectQuestions,finishExam,restore,grade,KEY} from './core';
import {isRedEligible,isClassQuiz} from './examScope';
import type {ExamSettings,Question} from './types';
const settings:ExamSettings={lectures:[],count:20,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','ox','multi','short','fill','comparison','calculation','uml'],wrongOnly:false};
const modes=['mixed','professor-style','hint-focus','class-quiz'] as const;
describe('2026-10-16 verified emphasized-topic midterm policy',()=>{
 it('classifies every stored question without deleting legacy records',()=>{
  expect(course.questions).toHaveLength(470+15);expect(course.red_scope.new_questions).toBe(0);
  const counts=course.red_scope.counts;expect(Object.values(counts).reduce((a,b)=>a+b,0)).toBe(course.questions.length);
  expect(course.questions.filter(q=>['DIRECT_RED','RED_TOPIC_CONTENT'].includes(q.red_scope_status??''))).toHaveLength(317);
  expect(course.questions.filter(q=>q.red_scope_status==='EXPLICITLY_EXCLUDED')).toHaveLength(6);
  expect(course.questions.filter(q=>q.retired)).toHaveLength(135);expect(course.concepts).toHaveLength(166);
  expect(course.questions.filter(q=>q.question_id.startsWith('q-midterm-'))).toHaveLength(74);
  expect(course.questions.filter(q=>q.teacher_style&&!/^q-(midterm|oct14|notes|red)-/.test(q.question_id))).toHaveLength(18);
 });
 it('requires reviewed A/B evidence and general-lecture topic anchors, never Solution answers or importance alone',()=>{
  for(const e of course.red_scope.evidence){const l=course.lectures.find(l=>l.file===e.source_pdf)!;expect(l).toBeDefined();expect(['A','B']).toContain(e.category);expect(e.verified).toBe(true);expect(e.source_pdf).not.toMatch(/solution/);expect(e.source_page).toBeGreaterThan(0);expect(e.source_page).toBeLessThanOrEqual(l.page_count);expect(e.scope_limit.length).toBeGreaterThan(12);if(e.category==='A')expect(e.question_ids.length,e.evidence_id).toBeGreaterThan(0)}
  for(const id of ['q-v2-current-system-1','q-v2-recall-design','q-oct14-027','q-oct14-032'])expect(isRedEligible(questionMap[id]),id).toBe(false);
  expect(isRedEligible({...questionMap['q-generalization-2'],importance:'Critical',emphasis_related:true,red_scope_status:'IN_SCOPE_RED',red_evidence_ids:['red-z']})).toBe(false);
  expect(isRedEligible({...questionMap['q-se-2'],source_pdf:'소프트웨어공학_Lecture_14_solution.pdf'})).toBe(false);
  expect(isRedEligible({...questionMap['q-se-2'],red_evidence_ids:[]})).toBe(false);
 });
 it('all four modes and changed legacy ratios remain 100% red, including deep links and shortages',()=>{
  for(const mode of modes)for(const ratio of [0,30,70,100])for(let seed=1;seed<=5;seed++){
   let n=seed;const rng=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
   const r=selectQuestions(course.questions,{...settings,mode,criticalRatio:ratio,count:50},emptyState(),rng);
   expect(r.questions.length).toBeGreaterThan(0);expect(r.questions.every(isRedEligible)).toBe(true);expect(r.actualCritical).toBe(r.questions.length);
   expect(new Set(r.questions.map(q=>q.red_selection_family??q.selection_family??q.question_id)).size).toBe(r.questions.length);
   if(mode!=='class-quiz')expect(r.questions[0].concept_id).toBe('3r');else expect(r.questions.every(isClassQuiz)).toBe(true);
   expect(r.questions.some(q=>q.concept_id==='xp-practices'||q.question_id==='q-oct14-032')).toBe(false);
  }
 });
 it('approves repeated UML headings and black continuation while respecting zero-candidate filters',()=>{
  for(const config of [{lectures:['L09']},{lectures:['L09-extra']},{types:['uml'] as Question['question_type'][]}]){
   const r=selectQuestions(course.questions,{...settings,...config},emptyState());expect(r.questions.length).toBeGreaterThan(0);expect(r.questions.every(isRedEligible)).toBe(true);
  }
  for(const id of ['q-v2-actors-1','q-v2-sync-message-1','q-v2-state-diagram-1','q-generalization-2','q-oct14-006','q-oct14-007','q-oct14-038'])expect(isRedEligible(questionMap[id]),id).toBe(true);
  const r=selectQuestions(course.questions,{...settings,lectures:['L09'],types:['calculation']},emptyState());expect(r.questions).toEqual([]);expect(r.actualCritical).toBe(0);expect(r.notice).toContain('0');
 });
 it('preserves explicit general-study 70:30 and ten-source coverage',()=>{
  const r=selectQuestions(course.questions,{...settings,scope_mode:'general-study'},emptyState(),()=>.5);
  expect(r.questions).toHaveLength(20);expect(r.actualCritical).toBe(14);expect(new Set(r.questions.map(q=>q.lecture_id)).size).toBe(10);
 });
 it('wrong-only intersects red eligibility, without injecting 3R or other weaknesses',()=>{
  const st=emptyState();for(const id of ['q-se-2','q-generalization-2','q-oct14-027','q-oct14-032'])st.wrong[id]={count:2,last:1};
  expect(selectQuestions(course.questions,{...settings,wrongOnly:true},st).questions.map(q=>q.question_id).sort()).toEqual(['q-generalization-2','q-se-2']);
  const r=selectQuestions(course.questions,{...settings,wrongOnly:true,varyWrong:true},st);expect(r.questions.every(q=>['se','generalization'].includes(q.concept_id)&&isRedEligible(q))).toBe(true);
 });
 it('respects source and type restrictions, even for highly weighted oral hints',()=>{
  const r=selectQuestions(course.questions,{...settings,lectures:['L08'],types:['choice'],count:50},emptyState());
  expect(r.questions.length).toBeGreaterThan(0);expect(r.questions.every(q=>q.lecture_id==='L08'&&q.question_type==='choice'&&isRedEligible(q))).toBe(true);expect(r.questions.some(q=>q.concept_id==='3r')).toBe(false);
 });
 it('keeps all existing cards and includes reviewed black content without promoting ambiguous or excluded cards',()=>{
  expect(course.memory_cards.filter(c=>c.mode!=='red')).toHaveLength(1427);const cards=course.memory_cards.filter(c=>c.mode==='red');expect(cards).toHaveLength(52);
  for(const c of cards){const e=course.red_scope.evidence.find(e=>c.red_evidence_ids?.includes(e.evidence_id))!;expect(c.answer).toBe(e.summary);expect(c.scope_note).toBe(e.scope_note);expect(c.card_id).toBe('card-'+e.evidence_id)}
  expect(cards.some(c=>c.concept_id==='xp-practices')).toBe(false);
  const related=course.memory_cards.filter(c=>c.red_scope_status==='RED_TOPIC_CONTENT');expect(related.some(c=>c.lecture_id==='L09')).toBe(true);expect(related.some(c=>c.lecture_id==='L09-extra'&&c.source_page===36)).toBe(true);expect(related.some(c=>c.lecture_id==='L12'&&c.source_page===26||c.concept_id==='xp-practices'||c.verification_status==='needs-review')).toBe(false);
 });
 it('new gap questions have unique options, exactly one correct answer and four authored rationales',()=>{
  const qs=course.questions.filter(q=>q.question_id.startsWith('q-red-'));expect(qs).toHaveLength(15);
  for(const q of qs){expect(q.options).toHaveLength(4);expect(new Set(q.options).size).toBe(4);expect(q.options.map((_,i)=>grade(q,i)).filter(Boolean)).toHaveLength(1);expect(Object.keys(q.option_explanations!)).toHaveLength(4);expect(isRedEligible(q)).toBe(true);expect(q.explanation).toBe(q.option_explanations![String(q.correct_answer)])}
 });
 it('old backups and now-ineligible active snapshots still finish with identical answers and records',()=>{
  const st=emptyState();const q=questionMap['q-oct14-032'];st.notes[q.question_id]='기존 메모';st.completedPages=['L12:26','L12:27'];st.cardReviews['card-L12-p009']={due:999999,step:1,unknown:false,reviews:4};
  st.active={id:'before-red-policy',question_ids:[q.question_id],answers:{[q.question_id]:q.correct_answer},flags:[q.question_id],started:1,deadline:1000,settings,snapshots:{[q.question_id]:q}};
  const restored=restore(JSON.parse(JSON.stringify(st)));expect(restored).toEqual(st);expect(restored.active?.settings.scope_mode).toBeUndefined();
  const result=finishExam(restored,course.questions,500);expect(result.history[0].score).toBe(100);expect(result.notes).toEqual(st.notes);expect(result.completedPages).toEqual(st.completedPages);expect(result.cardReviews).toEqual(st.cardReviews);expect(KEY).toBe('jihwanlee-se-cbt-v1');
 });
 it('rejects invalid scope modes while accepting absent or valid new fields',()=>{
  const st=emptyState();st.active={id:'e',question_ids:[],answers:{},flags:[],started:1,deadline:1000,settings};
  expect(()=>restore({...st,active:{...st.active,settings:{...settings,scope_mode:'unverified'}}})).toThrow();
  expect(restore({...st,active:{...st.active,settings:{...settings,scope_mode:'red-only'}}}).active?.settings.scope_mode).toBe('red-only');
 });
 it('defensively grades an old zero-question snapshot without NaN',()=>{
  const st=emptyState();st.active={id:'empty-old-exam',question_ids:[],answers:{},flags:[],started:1,deadline:1000,settings};expect(finishExam(st,course.questions,500).history[0].score).toBe(0);
 });
 it('preserves the complete 485-question, 1479-card and 166-concept authoring contracts',()=>{
  const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
  expect(hash(course.questions.map(q=>[q.question_id,q.concept_id,q.lecture_id,q.source_pdf,q.source_page,q.question_text,q.options,q.correct_answer,q.accepted_answers,q.explanation,q.retired]))).toBe('2fff52c2787e304d358bf2be2b4aa83fd3c108693ecde5a9aa9371e31a83bc97');
  expect(hash(course.memory_cards.map(c=>[c.card_id,c.answer,c.answer_groups,c.prompt,c.explanation]))).toBe('898b482266b04d701e8e426b543cbbfd279ed92335c6a65197591ddacea5d690');
  expect(hash(course.concepts.map(c=>[c.concept_id,c.definition,c.details,c.memorize]))).toBe('4a6120dcd1af805c08ef156b5c51b8f1fa8d04e56b88cb725a0faf084fc09af1');
 });
 it('records topic termination and preserves original versus actual answer pages',()=>{
  expect(course.red_scope.topics.find(t=>t.topic_id==='hipo')!.content_pages).toEqual([23,24,25]);
  for(const n of [26,27])expect(course.pages.find(p=>p.lecture_id==='L12'&&p.page===n)!.red_topic_ids).toEqual([]);
  const q=questionMap['q-midterm-058'];expect(q.source_page).toBe(23);expect(q.red_answer_sources?.some(s=>s.lecture_id==='L08'&&s.source_page===24)).toBe(true);expect(q.red_topic_anchor_sources?.some(s=>s.lecture_id==='L08'&&s.source_page===12)).toBe(true);
  expect(questionMap['q-oct14-012'].red_scope_status).toBe('RED_TOPIC_CONTENT');expect(questionMap['q-oct14-012'].red_answer_sources?.some(s=>s.lecture_id==='L14'&&s.source_page===13)).toBe(true);
  for(const id of course.red_scope.approved_question_ids){const q=questionMap[id];expect(q.red_topic_ids?.length).toBeGreaterThan(0);expect(q.red_answer_sources?.length).toBeGreaterThan(0);expect(q.red_review_reason?.length).toBeGreaterThan(20)}
 });
 it('retains ambiguous original quiz holds while approving separately verified CASE, DD and Rumbaugh variants',()=>{
  expect(course.class_quiz_summary.pending_reference_ids).toEqual(['ref-14-008','ref-14-035']);
  for(const id of ['q-oct14-007','q-oct14-012','q-oct14-023','q-oct14-038','q-notes-003'])expect(isRedEligible(questionMap[id]),id).toBe(true);
  const fake={...questionMap['q-se-2'],question_id:'q-unreviewed',red_scope_status:'DIRECT_RED' as const};expect(isRedEligible(fake)).toBe(false);
  expect(isRedEligible({...questionMap['q-se-2'],red_topic_ids:['hipo']})).toBe(false);
  expect(isRedEligible({...questionMap['q-se-2'],question_text:'미검수 내용으로 바꾼 문항'})).toBe(false);
 });
 it('isolates performance and return-arrow holds to individual atoms, not every concept linked to the page',()=>{
  const atom=(id:string)=>course.atomic_items.find(a=>a.atomic_item_id===id)!;
  for(const n of ['01','02','04','05','06','07'])expect(atom('a-L06-p013-'+n).red_scope_status).toBe('RED_TOPIC_CONTENT');
  expect(atom('a-L06-p013-03').red_scope_status).toBe('NEEDS_REVIEW');
  for(const n of ['01','05','06','07','08'])expect(atom('a-L09-extra-p037-'+n).red_scope_status).toBe('RED_TOPIC_CONTENT');
  for(const n of ['02','03','04'])expect(atom('a-L09-extra-p037-'+n).red_scope_status).toBe('NEEDS_REVIEW');
  expect(atom('a-L10-p007-03').red_scope_status).toBe('EXPLICITLY_EXCLUDED');
  expect(course.memory_cards.find(c=>c.card_id==='a-L06-p013-01')!.red_scope_status).toBe('RED_TOPIC_CONTENT');
 });
 it('includes reference-only recall solely when its own answer has an independently anchored approved topic',()=>{
  for(const id of ['card-L13-p034','card-L13-p014','card-L14-p038','card-L14-p040'])expect(course.memory_cards.find(c=>c.card_id===id)!.red_scope_status,id).toBe('RED_TOPIC_CONTENT');
  for(const p of [14,15,68,69])expect(course.memory_cards.filter(c=>c.lecture_id==='L14'&&c.source_page===p).every(c=>c.red_scope_status!=='RED_TOPIC_CONTENT')).toBe(true);
 });
 it('reconstructs UML arrow and diamond meanings consistently with the reviewed diagrams',()=>{
  const svg=(kind:string)=>renderToStaticMarkup(createElement(Diagram,{kind}));
  const edge=(kind:string)=>svg(kind).match(/<line[^>]*marker-end[^>]*>/g)??[];
  expect(edge('generalization')[0]).toContain('h)');expect(edge('generalization')[0]).not.toContain('stroke-dasharray');
  expect(edge('realization')[0]).toContain('h)');expect(edge('realization')[0]).toContain('stroke-dasharray="6 4"');
  expect(edge('dependency')[0]).toContain('o)');expect(edge('dependency')[0]).toContain('stroke-dasharray="6 4"');
  expect(svg('aggregation')).toContain('points="160,127 174,117 188,127 174,137" fill="var(--card)"');
  expect(svg('composition')).toContain('points="160,127 174,117 188,127 174,137" fill="currentColor"');
  for(const kind of ['include','extend']){expect(edge(kind)[0]).toContain('x1="235"');expect(edge(kind)[0]).toContain('x2="365"');expect(edge(kind)[0]).toContain('stroke-dasharray="6 4"');expect(edge(kind)[0]).toContain('o)')}
  expect(svg('extend').indexOf('메일 확인')).toBeLessThan(svg('extend').indexOf('검색'));
 });

});
