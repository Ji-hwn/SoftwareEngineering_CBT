import {describe,it,expect} from 'vitest';
import {course,questionMap} from './store';
import {emptyState,selectQuestions,finishExam,restore,grade,KEY} from './core';
import {isRedEligible,isClassQuiz} from './examScope';
import type {ExamSettings,Question} from './types';
const settings:ExamSettings={lectures:[],count:20,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','ox','multi','short','fill','comparison','calculation','uml'],wrongOnly:false};
const modes=['mixed','professor-style','hint-focus','class-quiz'] as const;
describe('2026-10-15 verified direct-red midterm policy',()=>{
 it('classifies every stored question without deleting legacy records',()=>{
  expect(course.questions).toHaveLength(470+15);expect(course.red_scope.new_questions).toBe(15);
  const counts=course.red_scope.counts;expect(Object.values(counts).reduce((a,b)=>a+b,0)).toBe(course.questions.length);
  expect(course.questions.filter(q=>q.red_scope_status==='IN_SCOPE_RED')).toHaveLength(70);
  expect(course.questions.filter(q=>q.red_scope_status==='EXPLICITLY_EXCLUDED')).toHaveLength(6);
  expect(course.questions.filter(q=>q.retired)).toHaveLength(135);expect(course.concepts).toHaveLength(166);
  expect(course.questions.filter(q=>q.question_id.startsWith('q-midterm-'))).toHaveLength(74);
  expect(course.questions.filter(q=>q.teacher_style&&!/^q-(midterm|oct14|notes|red)-/.test(q.question_id))).toHaveLength(18);
 });
 it('uses bounded A evidence from real general lectures, never Solution answers or importance alone',()=>{
  for(const e of course.red_scope.evidence){const l=course.lectures.find(l=>l.file===e.source_pdf)!;expect(l).toBeDefined();expect(e.category).toBe('A');expect(e.verified).toBe(true);expect(e.source_pdf).not.toMatch(/solution/);expect(e.source_page).toBeGreaterThan(0);expect(e.source_page).toBeLessThanOrEqual(l.page_count);expect(e.scope_limit.length).toBeGreaterThan(12);expect(e.question_ids.length,e.evidence_id).toBeGreaterThan(0)}
  for(const id of ['q-development-cost-3','q-cpm-example-3','q-generalization-2','q-midterm-063','q-oct14-006','q-oct14-007','q-oct14-012','q-oct14-022','q-oct14-027','q-oct14-032'])expect(isRedEligible(questionMap[id]),id).toBe(false);
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
 it('has no fallback to black material for an empty UML or source pool',()=>{
  for(const config of [{lectures:['L09']},{lectures:['L09-extra']},{types:['uml'] as Question['question_type'][]}]){
   const r=selectQuestions(course.questions,{...settings,...config},emptyState());expect(r.questions).toEqual([]);expect(r.actualCritical).toBe(0);expect(r.notice).toContain('0');
  }
 });
 it('preserves explicit general-study 70:30 and ten-source coverage',()=>{
  const r=selectQuestions(course.questions,{...settings,scope_mode:'general-study'},emptyState(),()=>.5);
  expect(r.questions).toHaveLength(20);expect(r.actualCritical).toBe(14);expect(new Set(r.questions.map(q=>q.lecture_id)).size).toBe(10);
 });
 it('wrong-only intersects red eligibility, without injecting 3R or other weaknesses',()=>{
  const st=emptyState();for(const id of ['q-se-2','q-generalization-2','q-oct14-032'])st.wrong[id]={count:2,last:1};
  expect(selectQuestions(course.questions,{...settings,wrongOnly:true},st).questions.map(q=>q.question_id)).toEqual(['q-se-2']);
  const r=selectQuestions(course.questions,{...settings,wrongOnly:true,varyWrong:true},st);expect(r.questions.every(q=>q.concept_id==='se'&&isRedEligible(q))).toBe(true);
 });
 it('respects source and type restrictions, even for highly weighted oral hints',()=>{
  const r=selectQuestions(course.questions,{...settings,lectures:['L08'],types:['choice'],count:50},emptyState());
  expect(r.questions.length).toBeGreaterThan(0);expect(r.questions.every(q=>q.lecture_id==='L08'&&q.question_type==='choice'&&isRedEligible(q))).toBe(true);expect(r.questions.some(q=>q.concept_id==='3r')).toBe(false);
 });
 it('keeps 1427 existing cards and uses bounded red cards instead of whole black definitions',()=>{
  expect(course.memory_cards.filter(c=>c.mode!=='red')).toHaveLength(1427);const cards=course.memory_cards.filter(c=>c.mode==='red');expect(cards).toHaveLength(52);
  for(const c of cards){const e=course.red_scope.evidence.find(e=>c.red_evidence_ids?.includes(e.evidence_id))!;expect(c.answer).toBe(e.summary);expect(c.explanation).toBe(e.scope_limit);expect(c.card_id).toBe('card-'+e.evidence_id)}
  expect(cards.some(c=>c.concept_id==='xp-practices'||c.lecture_id==='L09'||c.lecture_id==='L09-extra')).toBe(false);
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
});
