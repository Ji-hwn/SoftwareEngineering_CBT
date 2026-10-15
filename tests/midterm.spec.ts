import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {Course} from '../src/types';
const data=JSON.parse(readFileSync('src/data/course.json','utf8')) as Course;
test('professor-style exam circles, hidden answers, 14/6, submit and option-specific rationale',async({page})=>{
 await page.goto('#/exam?scope=general-study');await page.getByRole('combobox',{name:'CBT 모드'}).selectOption('professor-style');await page.getByRole('button',{name:'시험 시작하기'}).click();
 await expect(page.locator('.exam-question .option')).toHaveCount(4);await expect(page.locator('.exam-question .option-index').first()).toHaveText('①');await expect(page.locator('.explanation')).toHaveCount(0);
 const exam=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!).active);const qs=Object.values(exam.snapshots) as any[];
 expect(qs).toHaveLength(20);expect(qs.filter(q=>q.midterm_priority)).toHaveLength(14);expect(qs.every(q=>q.teacher_style&&q.scope_status==='IN_SCOPE'&&q.options.length===4&&typeof q.correct_answer==='number')).toBe(true);expect(qs[0].concept_id).toBe('3r');
 const first=qs[0];const opts=page.locator('.exam-question .option');for(let i=0;i<await opts.count();i++)if(await opts.nth(i).locator('span').last().innerText()===first.options[first.correct_answer])await opts.nth(i).click();
 await page.reload();await page.getByRole('button',{name:'답안 제출하기'}).click();await page.getByRole('button',{name:'제출 확정'}).click();await expect(page.getByRole('heading',{name:'정답 1 · 오답 0 · 미응답 19'})).toBeVisible();await expect(page.getByText('실제 강조 출제 70% (목표 70%)')).toBeVisible();
 const details=page.locator('.option-rationales').first();await details.locator('summary').click();await expect(details.locator('li')).toHaveCount(4);
});
test('notion source goals and focused memory retain old progress and schedules',async({page})=>{
 await page.goto('#/classroom/L08/4');await expect(page.getByRole('region',{name:'노션 필기와 학습 목표'})).toContainText('Validation & Verification');
 await page.goto('#/classroom/L03/25');await expect(page.locator('.notion-goals')).toContainText('C·E의 총여유는 검산상0');await expect(page.locator('.notion-goals')).toContainText('중간고사 출제 근거 제외');
 await page.goto('#/memory');await page.getByRole('combobox',{name:'암기 집중 세트'}).selectOption('xp-values');await expect(page.locator('.flashcard h2')).toContainText('XP');
 await page.getByRole('button',{name:'정답 확인',exact:true}).click();await page.getByRole('button',{name:'기억했어요'}).click();await page.reload();
 const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!));expect(st.reviews['xp-values'].reviews).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('style bank grades a new calculation and shows four rationales without exposing original reference questions',async({page},info)=>{
 const q=data.questions.find(q=>q.question_id==='q-midterm-023')!;await page.goto('#/bank?style=professor&concept=loc-estimate');await page.getByRole('textbox',{name:'문제 검색'}).fill(q.question_text);
 const card=page.locator('.practice');await expect(card).toHaveCount(1);await card.locator('.option').nth(q.correct_answer as number).click();await card.getByRole('button',{name:'답 확인하기'}).click();await expect(card.getByText('정답입니다',{exact:true})).toBeVisible();
 await card.getByText('모든 선택지의 판별 근거').click();await expect(card.locator('.option-rationales li')).toHaveCount(4);await expect(card.locator('.explanation')).toContainText('1000');
 await page.goto('#/exam?scope=general-study');await page.getByRole('combobox',{name:'CBT 모드'}).selectOption('professor-style');await page.getByRole('button',{name:'테마 전환'}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`analysis/${info.project.name}-final-midterm.png`,fullPage:true});
});
test('narrow scope does not secretly add lectures or repeat questions',async({page})=>{
 await page.goto('#/exam?scope=general-study&mode=professor-style');await page.getByLabel(/Lecture 6 ·/).check();await page.getByLabel('문제 수').selectOption('50');await page.getByRole('button',{name:'시험 시작하기'}).click();
 const exam=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!).active);const qs=Object.values(exam.snapshots) as any[];expect(qs.length).toBeLessThan(50);expect(qs.length).toBeGreaterThan(0);expect(qs.every(q=>q.lecture_id==='L06')).toBe(true);expect(new Set(exam.question_ids).size).toBe(qs.length);
});
