import {describe,it,expect} from 'vitest';
import {course} from './store';
import {emptyState,selectQuestions,grade,restore,finishExam,KEY} from './core';
import {inMidtermScope,midtermExclusion} from './examScope';
import {getConceptHints,hintScore,isMidtermPriority} from './professorHints';
import type {ExamSettings} from './types';
// Preserve full-syllabus regression coverage separately from red-only midterm tests.
const config:ExamSettings={scope_mode:'general-study',lectures:[],count:50,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','comparison','uml','calculation','multi','short','fill','ox'],wrongOnly:false};
const blocked=course.questions.find(q=>q.question_id==='q-oct14-032')!;
describe('final professor guidance and exact exclusion',()=>{
 it('retains the whole L12 range, 20 grounded guidance pages and existing card IDs',()=>{
  expect(course.class_guidance.map(n=>n.source_page)).toEqual([4,5,6,7,8,9,10,11,13,15,16,17,18,19,21,22,23,25,26,27]);
  expect(course.pages.filter(p=>p.atomic_item_ids.length)).toHaveLength(199);
  for(const n of course.class_guidance){expect(course.pages.some(p=>p.lecture_id===n.lecture_id&&p.page===n.source_page&&p.source_pdf===n.source_pdf)).toBe(true);expect(n.question_ids.length).toBeGreaterThan(0);expect(n.goals.length).toBeGreaterThan(0)}
  for(const page of [8,9,16,22,25,26,27])expect(course.memory_cards.some(c=>c.card_id===`card-L12-p${String(page).padStart(3,'0')}`)).toBe(true);
  expect(course.memory_cards.filter(c=>c.mode!=='red')).toHaveLength(1427);expect(course.memory_cards.filter(c=>c.mode==='red')).toHaveLength(course.red_scope.evidence.filter(e=>e.category==='A').length);expect(course.concepts).toHaveLength(166);
 });
 it('the explicit rule identifies precisely L14 question 28, its direct variant and date',()=>{
  expect(course.exam_scope.question_exclusions).toHaveLength(1);const rule=course.exam_scope.question_exclusions[0];
  expect(rule.source_question_number).toBe(28);expect(rule.question_ids).toEqual(['q-oct14-032']);expect(rule.exclusion_date).toBe('2026-10-14');expect(rule.exclusion_reason).toBe('professor-explicit-exclusion');
  expect(blocked.retired).toBe(false);expect(inMidtermScope(blocked)).toBe(true);expect(midtermExclusion(blocked)).toBe(true);
  expect(midtermExclusion({...blocked,question_id:'same-original',midterm_excluded:false})).toBe(true);
  // A separate SADT target remains eligible. Matching a concept name must never block it.
  const independent={...blocked,question_id:'separate-sadt-target',source_question_number:undefined,midterm_excluded:false};
  expect(midtermExclusion(independent)).toBe(false);expect(selectQuestions([independent],config,emptyState()).questions).toEqual([independent]);
 });
 it('range, answer quality and explicit exclusion are independent statuses',()=>{
  for(const number of [8,35]){const r=course.class_quiz_summary.reference_statuses.find(r=>r.question_number===number&&r.reference_id.startsWith('ref-14-'))!;expect(r.scope_status).toBe('IN_SCOPE');expect(r.quality_status).toBe('NEEDS_REVIEW');expect(r.midterm_excluded).toBe(false)}
  const r=course.class_quiz_summary.reference_statuses.find(r=>r.reference_id==='ref-14-028')!;expect(r.scope_status).toBe('IN_SCOPE');expect(r.quality_status).toBe('AVAILABLE');expect(r.midterm_excluded).toBe(true);
  const pending={...course.questions.find(q=>q.question_id==='q-oct14-012')!,quality_status:'NEEDS_REVIEW' as const};expect(inMidtermScope(pending)).toBe(true);expect(selectQuestions([pending],config,emptyState()).questions).toHaveLength(0);
 });
 it('all four modes, wrong-only and narrow quiz14 scopes enforce only the intended exclusions',()=>{
  for(const mode of ['mixed','professor-style','hint-focus','class-quiz'] as const)for(let seed=1;seed<=12;seed++){
   let n=seed;const rng=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
   const r=selectQuestions(course.questions,{...config,count:20,mode},emptyState(),rng);
   expect(r.questions).toHaveLength(20);expect(r.questions.some(midtermExclusion)).toBe(false);expect(r.actualCritical).toBe(mode==='hint-focus'?20:14);
   if(mode==='hint-focus')expect(r.notice).toContain('조정');
   if(mode!=='class-quiz')expect(r.questions[0].concept_id).toBe('3r');
  }
  const st=emptyState();st.wrong[blocked.question_id]={count:4,last:1};expect(selectQuestions(course.questions,{...config,wrongOnly:true},st).questions).toHaveLength(0);
  const full=selectQuestions(course.questions,{...config,mode:'class-quiz'},emptyState()).questions;expect(full).toHaveLength(45);
  for(const cid of ['oct14-case','oct14-case-functions','oct14-case-technologies','oct14-case-levels','oct14-hipo','oct14-hipo-charts','oct14-requirements-tool','oct14-requirements-selection'])expect(full.some(q=>q.concept_id===cid),cid).toBe(true);
  for(const number of [26,27])expect(selectQuestions(course.questions,{...config,lectures:['L12']},emptyState()).questions.some(q=>q.sources?.some(s=>s.lecture_id==='L12'&&s.source_page===number))).toBe(true);
 });
 it('new oral priorities leave PDF colors unchanged and increase selection weights',()=>{
  for(const cid of course.focus_sets.find(s=>s.set_id==='professor-oct14-high')!.concept_ids){const q=course.questions.find(q=>q.concept_id===cid)!;expect(getConceptHints(cid).some(h=>h.id.startsWith('oct14-'))).toBe(true);expect(isMidtermPriority(q)).toBe(true);expect(hintScore(q)).toBe(24)}
  const black=course.concepts.find(c=>c.concept_id==='oct14-dfd-elements')!;expect(black.importance).toBe('Important');
  expect(course.class_guidance.find(n=>n.source_page===7)!.reported_kinds).toContain('engineer-exam-reference');
 });
 it('three distinct additions have four unique choices, one accepted index and complete rationales',()=>{
  const qs=course.questions.filter(q=>q.question_id.startsWith('q-notes-'));expect(qs).toHaveLength(3);for(const q of qs){expect(new Set(q.options).size).toBe(4);expect(q.options.map((_,i)=>grade(q,i)).filter(Boolean)).toHaveLength(1);expect(Object.values(q.option_explanations!).every(s=>s.length>35)).toBe(true);expect(q.quality_status).toBe('AVAILABLE');expect(inMidtermScope(q)).toBe(true)}
  expect(qs[1].explanation).toContain('16쪽');expect(qs[1].explanation).toContain('실제 반례');
 });
 it('previous answers, excluded active exam, progress, reviews and backup remain usable',()=>{
  const st=emptyState();st.completedPages=['L12:26','L12:27'];st.bookmarks=['oct14-sadt'];st.notes[blocked.question_id]='이전 메모';st.cardReviews['card-L12-p009']={due:10000000,step:1,unknown:false,reviews:3};st.active={id:'pre-exclusion',question_ids:[blocked.question_id],answers:{[blocked.question_id]:blocked.correct_answer},flags:[],started:1,deadline:1000,settings:config,snapshots:{[blocked.question_id]:{...blocked,midterm_excluded:false}}};
  expect(KEY).toBe('jihwanlee-se-cbt-v1');const restored=restore(JSON.parse(JSON.stringify(st)));expect(restored).toEqual(st);const result=finishExam(restored,course.questions,500);expect(result.history[0].score).toBe(100);expect(result.notes).toEqual(st.notes);expect(result.completedPages).toEqual(st.completedPages);expect(result.cardReviews).toEqual(st.cardReviews);
 });
});
