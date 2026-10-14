import {describe,it,expect} from 'vitest';
import {course} from './store';
import {selectQuestions,emptyState,grade,restore,recordAnswer} from './core';
import {inMidtermScope,isClassQuiz,matchesSelectedSources} from './examScope';
import {isMidtermExcluded} from './professorHints';
import type {ExamSettings} from './types';
const config:ExamSettings={lectures:[],count:20,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','comparison','uml','calculation','multi','short','fill','ox'],wrongOnly:false};
describe('October 14 syllabus and classroom quiz integration',()=>{
 it('quiz-only selection includes mapped general-lecture variants and excludes unrelated topics',()=>{
  for(const id of ['L13','L14']){const r=selectQuestions(course.questions,{...config,mode:'class-quiz',lectures:[id]},emptyState());expect(r.questions.length).toBeGreaterThan(10);expect(r.questions.some(q=>q.lecture_id==='L12')).toBe(true);expect(r.questions.every(q=>matchesSelectedSources(q,[id]))).toBe(true)}
  expect(matchesSelectedSources(course.questions.find(q=>q.question_id==='q-se-2')!,['L13'])).toBe(false);
 });
 it('adds precisely 26 general learning pages without promoting quizzes to general lectures',()=>{
  expect(course.lectures).toHaveLength(8);expect(course.pages).toHaveLength(215);expect(course.pages.filter(p=>p.atomic_item_ids.length)).toHaveLength(199);
  expect(course.pages.filter(p=>p.lecture_id==='L12'&&p.atomic_item_ids.length).map(p=>p.page)).toEqual(Array.from({length:26},(_,i)=>i+2));
  expect(course.lectures.some(l=>/solution/.test(l.file))).toBe(false);expect(course.quiz_sources.map(q=>[q.lecture_id,q.page_count,q.unique_questions,q.class_date,q.cover_year])).toEqual([['L13',40,19,'2026-10-14',2025],['L14',74,36,'2026-10-14',2025]]);
 });
 it('preserves all 426 existing IDs and the 291 active pre-extension questions',()=>{
  expect(course.questions.filter(q=>!q.question_id.startsWith('q-oct14-')&&!q.question_id.startsWith('q-notes-'))).toHaveLength(426);expect(course.questions.filter(q=>!q.retired&&!q.question_id.startsWith('q-oct14-')&&!q.question_id.startsWith('q-notes-'))).toHaveLength(291);
  expect(course.concepts.filter(c=>!c.concept_id.startsWith('oct14-'))).toHaveLength(132);
 });
 it('all 34 new concepts have a valid learning route, source, card and question',()=>{
  const items=course.concepts.filter(c=>c.concept_id.startsWith('oct14-'));expect(items).toHaveLength(34);
  for(const c of items){expect([...course.pages,...course.quiz_pages].some(p=>p.lecture_id===c.lecture_id&&p.page===c.source_page&&p.concept_ids.includes(c.concept_id)),c.concept_id).toBe(true);expect(c.question_ids.length,c.concept_id).toBeGreaterThan(0);expect(course.memory_cards.some(m=>m.concept_id===c.concept_id)||c.memorize.length>0).toBe(true)}
 });
 it('checks 55 source answers but keeps ambiguous reference questions separate from authored variants',()=>{
  expect(course.class_quiz_summary.total).toBe(55);expect(course.class_quiz_summary.answers['source-checked']).toBe(53);expect(course.class_quiz_summary.answers.NEEDS_REVIEW).toBe(2);expect(course.class_quiz_summary.pending_reference_ids).toEqual(['ref-14-008','ref-14-035']);
  expect(course.questions.some(q=>q.question_id.startsWith('ref-'))).toBe(false);
 });
 it('41 independent additions have four unique choices and one accepted index with all rationales',()=>{
  const qs=course.questions.filter(q=>q.question_id.startsWith('q-oct14-'));expect(qs).toHaveLength(41);
  for(const q of qs){expect(q.options).toHaveLength(4);expect(new Set(q.options).size).toBe(4);expect(q.options.map((_,i)=>grade(q,i)).filter(Boolean)).toHaveLength(1);expect(Object.keys(q.option_explanations!)).toHaveLength(4);expect(inMidtermScope(q)).toBe(true);expect(q.class_quiz_reference_ids?.some(id=>course.class_quiz_summary.pending_reference_ids.includes(id))).toBe(false)}
 });
 it('class quiz mode only selects reviewed single-answer variants, with ratios and source coverage',()=>{
  const r=selectQuestions(course.questions,{...config,mode:'class-quiz'},emptyState());expect(r.questions).toHaveLength(20);expect(r.actualCritical).toBe(14);expect(r.questions.every(isClassQuiz)).toBe(true);expect(r.questions.some(q=>q.lecture_id==='L12')).toBe(true);expect(r.questions.some(q=>q.concept_id==='3r')).toBe(false);
  const exhausted=selectQuestions(course.questions,{...config,count:50,mode:'class-quiz'},emptyState());expect(exhausted.questions).toHaveLength(45);expect(exhausted.notice).toContain('45');expect(new Set(exhausted.questions.map(q=>q.question_id)).size).toBe(45);
 });
 it('new lecture and quiz sources enter ordinary and professor-style exams without overriding exclusions',()=>{
  for(const mode of ['mixed','professor-style'] as const){const r=selectQuestions(course.questions,{...config,mode},emptyState());expect(r.questions.some(q=>q.lecture_id==='L12')).toBe(true);expect(r.questions.some(q=>q.concept_id==='3r')).toBe(true);expect(r.questions.some(isMidtermExcluded)).toBe(false);expect(r.actualCritical).toBe(14)}
  const q=course.questions.find(q=>q.question_id==='q-oct14-032')!;for(const source_pdf of ['소프트웨어공학_Lecture_11_solution.pdf','missing.pdf'])expect(inMidtermScope({...q,source_pdf})).toBe(false);
 });
 it('new progress, quiz page completion, wrong notes and optional mode survive JSON restore with legacy fields',()=>{
  const st=emptyState();st.completed=['se','oct14-case'];st.completedPages=['L01:5','L12:8','L13:34'];st.bookmarks=['reengineering','oct14-dd-quality'];st.notes['q-se-2']='예전 메모';st.reviews.se={due:9999999999999,step:1,unknown:false,reviews:3};
  st.active={id:'classroom-exam',question_ids:[],answers:{},flags:[],started:1,deadline:9999999999999,settings:{...config,mode:'class-quiz'}};
  const q=course.questions.find(q=>q.question_id==='q-oct14-006')!;const next=recordAnswer(st,q,((q.correct_answer as number)+1)%4);const restored=restore(JSON.parse(JSON.stringify(next)));expect(restored).toEqual(next);expect(restored.notes['q-se-2']).toBe('예전 메모');expect(restored.reviews.se).toEqual(st.reviews.se);
 });
});
