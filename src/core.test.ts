import {describe,it,expect} from 'vitest';
import {grade,emptyState,recordAnswer,restore,reviewConcept,remaining,selectQuestions,finishExam} from './core';
import raw from './data/course.json';
import type {Course,ExamSettings,Question,Exam} from './types';
const course=raw as unknown as Course;
const q=(type:string)=>course.questions.find(q=>q.question_type===type)!;
const settings:ExamSettings={lectures:[],count:20,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','ox','fill','short','multi','comparison','calculation','uml'],wrongOnly:false};
describe('grading and answer semantics',()=>{
 it('handles numeric choice index zero without treating it as unanswered',()=>expect(grade(q('choice'),0)).toBe(true));
 it('requires exactly the multiple choices without missing or additional values',()=>{const m=q('multi');expect(grade(m,m.correct_answer)).toBe(true);expect(grade(m,[])).toBe(false);expect(grade(m,[...(m.correct_answer as number[]),3])).toBe(false)});
 it('normalizes whitespace and case for allowed aliases only',()=>{const m=course.questions.find(q=>q.question_id==='q-putnam-2')!;expect(grade(m,' s L i M ')).toBe(true);expect(grade(m,'ESTIMACS')).toBe(false)});
 it('numeric calculation supports equivalent decimals but rejects text and malformed numbers',()=>{const c=q('calculation');expect(grade(c,c.correct_answer+'.0')).toBe(true);expect(grade(c,'900일')).toBe(false);expect(grade(c,'NaN')).toBe(false)});
 it('never accepts unanswered questions',()=>{for(const item of course.questions){expect(grade(item,undefined)).toBe(false);expect(grade(item,null)).toBe(false);expect(grade(item,'')).toBe(false)}});
 it('every published correct answer actually grades as correct',()=>{for(const item of course.questions)expect(grade(item,item.correct_answer),item.question_id).toBe(true)});
});
describe('question selection',()=>{
 it('20 unique questions at 70/30 with all available lecture groups represented',()=>{const selection=selectQuestions(course.questions,settings,emptyState(),()=>.5);expect(selection.questions.length).toBe(20);expect(new Set(selection.questions.map(q=>q.question_id)).size).toBe(20);expect(selection.actualCritical).toBe(14);expect(new Set(selection.questions.map(q=>q.lecture_id)).size).toBe(7)});
 it('50 questions have 35 emphasized questions',()=>{const s=selectQuestions(course.questions,{...settings,count:50},emptyState(),()=>.5);expect(s.questions).toHaveLength(50);expect(s.actualCritical).toBe(35)});
 it('filters scope and question type and handles pool exhaustion',()=>{const s=selectQuestions(course.questions,{...settings,lectures:['L10'],types:['calculation']},emptyState());expect(s.questions).toHaveLength(0)});
 it('wrong-only mode cannot inject unrelated questions',()=>{const state=recordAnswer(emptyState(),q('choice'),3);const s=selectQuestions(course.questions,{...settings,wrongOnly:true},state);expect(s.questions.map(q=>q.question_id)).toEqual([q('choice').question_id]);expect(s.notice).toContain('1')});
 it('exposure affects fairness across repeated tests',()=>{const st=emptyState();const first=selectQuestions(course.questions,settings,st,()=>.5).questions;first.forEach(q=>st.exposure[q.question_id]=100);const second=selectQuestions(course.questions,settings,st,()=>.5).questions;expect(second.filter(q=>first.some(f=>f.question_id===q.question_id)).length).toBeLessThan(10)});
});
describe('persistence and exam lifecycle',()=>{
 it('stores wrong answers and repeat counts and schedules concepts',()=>{let st=recordAnswer(emptyState(),q('choice'),3,undefined,1000);st=recordAnswer(st,q('choice'),3,undefined,2000);expect(st.wrong[q('choice').question_id].count).toBe(2);expect(st.reviews[q('choice').concept_id].unknown).toBe(true);expect(restore(JSON.parse(JSON.stringify(st)))).toEqual(st)});
 it('schedules today, 1, 3, 7 days',()=>{let s=reviewConcept(emptyState(),'se',false,0);expect(s.reviews.se.due).toBe(0);for(const days of [1,3,7]){s=reviewConcept(s,'se',true,0);expect(s.reviews.se.due).toBe(days*86400000)}});
 it('invalid backup leaves state untouched and rejects nested corruption',()=>{expect(()=>restore({version:1})).toThrow();expect(()=>restore({...emptyState(),wrong:{bad:'x'}})).toThrow();expect(()=>restore({...emptyState(),settings:{theme:'evil'}})).toThrow()});
 it('absolute deadline survives serialization',()=>{const e:Exam={id:'e',question_ids:[],answers:{},flags:[],started:0,deadline:60000,settings};expect(remaining(e,50000)).toBe(10);expect(remaining(e,65000)).toBe(0)});
 it('submission saves score, unanswered, history, and wrong records exactly once',()=>{const c=q('choice');const second=q('ox');const s=emptyState();s.active={id:'e',question_ids:[c.question_id,second.question_id],answers:{[c.question_id]:0},flags:[],started:0,deadline:1000,settings};const result=finishExam(s,course.questions,1500);expect(result.history[0].score).toBe(50);expect(result.history[0].unanswered).toBe(1);expect(result.history[0].submitted).toBe(1000);expect(result.active).toBeNull();expect(Object.keys(result.wrong)).toContain(second.question_id);expect(finishExam(result,course.questions)).toEqual(result)});
});


describe('user-recorded professor midterm hints',()=>{
 it('does not select the XP 12 practices in a midterm mock exam',()=>{
  const items=selectQuestions(course.questions,{...settings,lectures:['L10'],count:50},emptyState(),()=>.5).questions;
  expect(items.every(q=>q.concept_id!=='xp-practices')).toBe(true);
 });
 it('keeps XP practice material available for teaching and the question bank',()=>{
  expect(course.concepts.some(c=>c.concept_id==='xp-practices')).toBe(true);
  expect(course.questions.some(q=>q.concept_id==='xp-practices'&&!q.retired)).toBe(true);
 });
 it('prioritizes a 3R item in an ordinary all-syllabus emphasized mock exam',()=>{
  const items=selectQuestions(course.questions,settings,emptyState(),()=>.5).questions;
  expect(items.some(q=>q.concept_id==='3r')).toBe(true);
 });
 it('does not force 3R when Lecture 01 or emphasized questions are excluded by filters',()=>{
  const items=selectQuestions(course.questions,{...settings,lectures:['L03']},emptyState(),()=>.5).questions;
  expect(items.some(q=>q.concept_id==='3r')).toBe(false);
 });
});
