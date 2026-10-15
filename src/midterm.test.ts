import {describe,it,expect} from 'vitest';
import {course} from './store';
import {selectQuestions,emptyState,grade,restore,recordAnswer} from './core';
import {isMidtermPriority,isMidtermExcluded,getConceptHints} from './professorHints';
import {inMidtermScope,isProfessorStyle} from './examScope';
import {optionOrder} from './Question';
import type {ExamSettings} from './types';
// Historical 70:30 expectations remain in the explicit general-study option.
const settings:ExamSettings={scope_mode:'general-study',lectures:[],count:20,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','comparison','uml','multi','ox','short','fill','calculation'],wrongOnly:false};
describe('strict midterm syllabus and professor-style modes',()=>{
 it('keeps eight general lectures and separately authorized classroom quizzes and rejects unreviewed or solution-only sources',()=>{
  expect(course.lectures.map(l=>l.lecture_id).sort()).toEqual(['L01','L03','L06','L08','L09','L09-extra','L10','L12']);
  const q=course.questions.find(q=>isProfessorStyle(q))!;
  for(const fake of [{...q,lecture_id:'L11'},{...q,source_pdf:'소프트웨어공학_Lecture_11_solution.pdf'},{...q,scope_status:'NEEDS_REVIEW' as const},{...q,scope_status:'OUT_OF_SCOPE' as const},{...q,scope_status:undefined},{...q,source_page:999}]){
   expect(inMidtermScope(fake)).toBe(false);expect(selectQuestions([fake],settings,emptyState()).questions).toHaveLength(0);
  }
 });
 it('only four-choice single-answer reviewed items enter the style mode, with ratios and 3R',()=>{
  for(const count of [10,20,30,50]){
   const result=selectQuestions(course.questions,{...settings,count,mode:'professor-style'},emptyState(),()=>.5);
   expect(result.questions).toHaveLength(count);expect(result.actualCritical).toBe(Math.round(count*.7));
   expect(result.questions.every(q=>isProfessorStyle(q)&&inMidtermScope(q)&&!isMidtermExcluded(q))).toBe(true);
   expect(result.questions.some(q=>q.concept_id==='3r')).toBe(true);expect(new Set(result.questions.map(q=>q.lecture_id)).size).toBeGreaterThanOrEqual(count===10?8:10);
  }
 });
 it('respects narrow lecture/type filters and returns available count without duplicates',()=>{
  const result=selectQuestions(course.questions,{...settings,mode:'professor-style',lectures:['L06'],count:50},emptyState());
  expect(result.questions.length).toBeGreaterThan(0);expect(result.questions.length).toBeLessThan(50);
  expect(result.questions.every(q=>q.lecture_id==='L06')).toBe(true);expect(result.questions.some(q=>q.concept_id==='3r')).toBe(false);
  expect(result.notice).toContain('조건에 맞는');expect(new Set(result.questions.map(q=>q.question_id)).size).toBe(result.questions.length);
 });
 it('hint focus contains hinted concepts and excludes mixed XP practice question too',()=>{
  const result=selectQuestions(course.questions,{...settings,mode:'hint-focus',count:50},emptyState());
  expect(result.questions.every(q=>getConceptHints(q.concept_id).some(h=>h.tier!=='excluded'))).toBe(true);
  expect(result.questions.some(q=>q.question_id==='q-xp-3'||q.concept_id==='xp-practices')).toBe(false);
 });
 it('wrong concept variations stay inside the selected weakness and lecture',()=>{
  const first=course.questions.find(q=>q.question_id==='q-se-2')!;const st=recordAnswer(emptyState(),first,1);
  const result=selectQuestions(course.questions,{...settings,wrongOnly:true,varyWrong:true},st);
  expect(result.questions.length).toBeGreaterThan(1);expect(result.questions.every(q=>q.concept_id==='se')).toBe(true);
  expect(selectQuestions(course.questions,{...settings,wrongOnly:true,varyWrong:true,lectures:['L03']},st).questions).toHaveLength(0);
 });
 it('never repeats a semantic family in one new exam',()=>{
  const result=selectQuestions(course.questions,{...settings,count:50},emptyState());
  const groups=result.questions.map(q=>q.selection_family??q.question_id);expect(new Set(groups).size).toBe(groups.length);
 });
 it('74 independent variants have all four rationale slots and exactly one gradable option',()=>{
  const items=course.questions.filter(q=>q.question_id.startsWith('q-midterm-'));expect(items).toHaveLength(74);
  expect(new Set(items.map(q=>q.style_tag)).size).toBe(10);
  for(const q of items){expect(q.options).toHaveLength(4);expect(q.scope_status).toBe('IN_SCOPE');expect(q.semantic_review).toBe('source-summary-reviewed');expect(q.option_explanations&&Object.keys(q.option_explanations)).toHaveLength(4);expect(q.options.map((_,i)=>grade(q,i)).filter(Boolean)).toHaveLength(1)}
 });
 it('new stored answers and displayed shuffle positions are balanced and retain the answer text',()=>{
  const items=course.questions.filter(q=>q.question_id.startsWith('q-midterm-'));const stored=[0,1,2,3].map(i=>items.filter(q=>q.correct_answer===i).length);expect(Math.max(...stored)-Math.min(...stored)).toBeLessThanOrEqual(1);
  const counts=[0,0,0,0];for(let seed=0;seed<80;seed++)for(const q of items){const order=optionOrder(q,`exam-${seed}`);const pos=order.indexOf(q.correct_answer as number);expect(q.options[order[pos]]).toBe(q.options[q.correct_answer as number]);counts[pos]++}
  expect(Math.max(...counts)/counts.reduce((a,b)=>a+b,0)).toBeLessThan(.4);
 });
 it('notebook mapping, focused memory and pending source content remain separate from scope',()=>{
  expect(course.learning_notes).toHaveLength(29);expect(course.focus_sets.filter(s=>s.set_id!=='verified-red-only')).toHaveLength(15);
  expect(course.learning_notes.find(n=>n.note_id==='note-req-process')!.sources.some(s=>s.lecture_id==='L08'&&s.source_page===4)).toBe(true);
  expect(course.learning_notes.find(n=>n.note_id==='note-cpm-calculation')!.supplement?.label).toContain('출제 근거 제외');
  expect(course.questions.find(q=>q.question_id==='q-v2-recall-resource-utilization')!.retired).toBe(true);
  expect(course.concepts.some(c=>c.concept_id==='resource-utilization')).toBe(true);
 });
 it('old settings without modes restore and malformed new mode backups are rejected',()=>{
  const st=emptyState();st.active={id:'old',question_ids:[],answers:{},flags:[],started:1,deadline:9999999999999,settings};expect(restore(JSON.parse(JSON.stringify(st))).active?.settings).toEqual(settings);
  expect(()=>restore({...st,active:{...st.active,settings:{...settings,mode:'out-of-syllabus'}}})).toThrow();
 });
});
