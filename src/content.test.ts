import {describe,it,expect} from 'vitest';
import raw from './data/course.json';
import {optionOrder} from './Question';
import {grade} from './core';
import type {Course} from './types';
const data=raw as unknown as Course;
describe('source and content contract',()=>{
 it('only contains provided lectures and Lecture 10',()=>{expect(new Set(data.lectures.map(l=>l.lecture_number))).toEqual(new Set([1,3,6,8,9,10]));expect(data.lectures.reduce((a,l)=>a+l.page_count,0)).toBe(187)});
 it('all learning pages have linked concept content',()=>{const pages=data.pages.filter(p=>p.status!=='excluded-nonlearning');expect(pages).toHaveLength(173);for(const p of pages)expect(p.concept_ids.length,`${p.lecture_id}:${p.page}`).toBeGreaterThan(0)});
 it('all source links point to actual valid PDF pages',()=>{for(const c of data.concepts)for(const s of c.sources){const l=data.lectures.find(l=>l.file===s.source_pdf);expect(l,s.source_pdf).toBeDefined();expect(s.source_page).toBeGreaterThan(0);expect(s.source_page).toBeLessThanOrEqual(l!.page_count)}});
 it('each Critical has three distinct questions and no issue concepts enter questions',()=>{for(const c of data.concepts.filter(c=>c.importance==='Critical'))expect(c.question_ids.length,c.concept_id).toBeGreaterThanOrEqual(3);for(const id of ['latency','return-message','usecase-generalization'])expect(data.questions.some(q=>q.concept_id===id)).toBe(false)});
 it('IDs and normalized question text are unique',()=>{expect(new Set(data.questions.map(q=>q.question_id)).size).toBe(data.questions.length);expect(new Set(data.questions.map(q=>q.question_text.replace(/\s+/g,'').toLowerCase())).size).toBe(data.questions.length)});
 it('shuffling is deterministic per exam and does not change grading',()=>{for(const q of data.questions.filter(q=>q.options.length)){const order=optionOrder(q,'exam-1');expect(order).toEqual(optionOrder(q,'exam-1'));expect([...order].sort((a,b)=>a-b)).toEqual(q.options.map((_,i)=>i));expect(grade(q,q.correct_answer)).toBe(true)}expect(data.questions.filter(q=>q.options.length&&optionOrder(q,'exam-1')[0]!==0).length).toBeGreaterThan(30)});
});
