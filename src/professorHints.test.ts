import {describe,it,expect} from 'vitest';
import {course} from './store';
import {emptyState,selectQuestions,grade,restore,finishExam} from './core';
import {professorHints,isMidtermPriority,recordedPriority} from './professorHints';
import type {ExamSettings} from './types';

const settings:ExamSettings={lectures:[],count:20,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','ox','fill','short','multi','comparison','calculation','uml'],wrongOnly:false};
describe('professor hint integration and preserved records',()=>{
 it('all hints resolve to existing concepts and real PDF pages',()=>{
  expect(professorHints).toHaveLength(14);
  for(const h of professorHints){
   for(const id of h.conceptIds)expect(course.concepts.some(c=>c.concept_id===id),id).toBe(true);
   for(const p of h.pages)expect(course.pages.some(x=>x.lecture_id===p.lectureId&&x.page===p.page),h.id).toBe(true);
  }
 });
 it('16 additive questions have PDF checked answers, explanations and valid evidence',()=>{
  const qs=course.questions.filter(q=>q.question_id.startsWith('q-prof-'));
  expect(qs.map(q=>q.question_id)).toEqual(Array.from({length:16},(_,i)=>`q-prof-${String(i+1).padStart(3,'0')}`));
  for(const q of qs){
   expect(q.verification_status).toBe('pdf-crosschecked');expect(grade(q,q.correct_answer)).toBe(true);
   expect(grade(q,'알 수 없는 답')).toBe(false);expect(q.explanation.length).toBeGreaterThan(30);
   for(const s of q.sources??[])expect(course.pages.some(p=>p.lecture_id===s.lecture_id&&p.page===s.source_page&&p.source_pdf===s.source_pdf)).toBe(true);
  }
  expect(grade(qs[0],' RE use ')).toBe(true);expect(grade(qs[0],'재공학')).toBe(false);
 });
 it('10/20/30/50 exams keep the ratio, 3R and every eligible lecture across random seeds',()=>{
  for(const count of [10,20,30,50])for(let seed=1;seed<=10;seed++){
   let n=seed;const rng=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
   const result=selectQuestions(course.questions,{...settings,count},emptyState(),rng);
   expect(result.questions).toHaveLength(count);expect(new Set(result.questions.map(q=>q.question_id)).size).toBe(count);
   expect(result.questions.filter(isMidtermPriority)).toHaveLength(Math.round(count*.7));
   expect(result.questions.some(q=>q.concept_id==='3r')).toBe(true);
   expect(result.questions.some(q=>q.concept_id==='xp-practices')).toBe(false);
   expect(new Set(result.questions.map(q=>q.lecture_id)).size).toBe(7);
  }
 });
 it('zero priority and incompatible types do not force 3R',()=>{
  expect(selectQuestions(course.questions,{...settings,criticalRatio:0},emptyState()).questions.some(q=>q.concept_id==='3r')).toBe(false);
  expect(selectQuestions(course.questions,{...settings,types:['calculation']},emptyState()).questions.some(q=>q.concept_id==='3r')).toBe(false);
 });
 it('wrong-only never injects 3R and excludes XP practices even if saved as wrong',()=>{
  const st=emptyState();const xp=course.questions.find(q=>q.concept_id==='xp-practices'&&!q.retired)!;
  st.wrong[xp.question_id]={count:2,last:100};st.wrong['q-se-2']={count:1,last:100};
  expect(selectQuestions(course.questions,{...settings,wrongOnly:true},st).questions.map(q=>q.question_id)).toEqual(['q-se-2']);
 });
 it('existing active XP exam still restores and grades, preserving history and notes',()=>{
  const xp=course.questions.find(q=>q.concept_id==='xp-practices'&&!q.retired)!;const st=emptyState();
  st.notes[xp.question_id]='예전 메모';st.active={id:'old-xp',question_ids:[xp.question_id],answers:{[xp.question_id]:xp.correct_answer},flags:[],started:0,deadline:1000,settings};
  const result=finishExam(restore(JSON.parse(JSON.stringify(st))),course.questions,500);
  expect(result.history[0].score).toBe(100);expect(result.notes).toEqual(st.notes);
 });
 it('historical priority uses stored classification rather than newly added hints',()=>{
  const q=course.questions.find(q=>!q.emphasis_related&&isMidtermPriority(q))!;
  expect(q).toBeTruthy();expect(recordedPriority(q)).toBe(false);
  expect(recordedPriority({...q,midterm_priority:true})).toBe(true);
  expect(recordedPriority({...q,midterm_priority:false})).toBe(false);
 });
});
