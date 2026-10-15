import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('src/data/course.json','utf8'));
const key='jihwanlee-se-cbt-v1';
test('default midterm is red-only, frozen at 100%, survives reload and grades on submission',async({page})=>{
 await page.goto('#/exam');await expect(page.getByRole('combobox',{name:'출제 범위 정책'})).toHaveValue('red-only');await expect(page.locator('input[type=range]')).toBeDisabled();await expect(page.locator('input[type=range]')).toHaveValue('100');
 await page.getByRole('button',{name:'시험 시작하기'}).click();const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active,key);
 expect(before.settings.criticalRatio).toBe(100);expect(before.question_ids).toHaveLength(20);expect(before.settings.scope_mode).toBe('red-only');expect(Object.values(before.snapshots).every((q:any)=>q.red_scope_status==='IN_SCOPE_RED'&&q.midterm_priority)).toBe(true);
 const q=before.snapshots[before.question_ids[0]];expect(q.concept_id).toBe('3r');await expect(page.locator('.explanation')).toHaveCount(0);
 if(typeof q.correct_answer==='string')await page.getByRole('textbox',{name:'답안'}).fill(q.correct_answer);
 else for(const i of Array.isArray(q.correct_answer)?q.correct_answer:[q.correct_answer])await page.locator('.exam-question .option').filter({hasText:q.options[i]}).click();
 await page.reload();expect((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active,key)).answers).toEqual({[q.question_id]:q.correct_answer});
 await page.getByRole('button',{name:'답안 제출하기'}).click();await page.getByRole('button',{name:'제출 확정'}).click();await expect(page.getByText('실제 강조 출제 100% (목표 100%)')).toBeVisible();await expect(page.getByRole('heading',{name:'정답 1 · 오답 0 · 미응답 19'})).toBeVisible();
});
test('all four deep-link modes stay red-only and safely shorten the daily quiz',async({page})=>{
 for(const mode of ['mixed','professor-style','hint-focus','class-quiz']){
  await page.goto('');await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)!);s.active=null;localStorage.setItem(k,JSON.stringify(s))},key);await page.reload();await page.goto(`#/exam?mode=${mode}`);
  await page.getByLabel('문제 수').selectOption('50');await page.getByRole('button',{name:'시험 시작하기'}).click();const e=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active,key);const qs=Object.values(e.snapshots) as any[];
  expect(qs.length).toBeGreaterThan(0);expect(qs.every(q=>q.red_scope_status==='IN_SCOPE_RED'&&data.red_scope.approved_question_ids.includes(q.question_id))).toBe(true);expect(e.question_ids).not.toContain('q-oct14-032');expect(qs.some(q=>q.concept_id==='xp-practices')).toBe(false);
  expect(new Set(qs.map(q=>q.red_selection_family??q.selection_family??q.question_id)).size).toBe(qs.length);if(mode==='class-quiz')expect(qs.length).toBeLessThan(50);
 }
});
test('zero eligible source does not start an exam or include black UML material',async({page})=>{
 await page.goto('#/exam');await page.getByLabel(/Lecture 9 ·/).check();await page.getByRole('button',{name:'시험 시작하기'}).click();await expect(page.getByRole('heading',{name:'나만의 모의고사'})).toBeVisible();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active,key)).toBeNull();await expect(page.getByRole('status')).toContainText('검증 문항이 없습니다');
});
test('bounded classroom scope, red recall, classification and wrong-only filter preserve general study',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('#/classroom/L12/9');await expect(page.getByRole('region',{name:'실전 강조 범위'})).toContainText('기호 6개의 의미');await expect(page.locator('.atomic-list')).toContainText('자료 반복');
 await page.goto('#/classroom/L12/26');await expect(page.getByRole('region',{name:'실전 강조 범위'})).toContainText('승인된 직접 강조 판별 항목은 없습니다');await expect(page.locator('.atomic-list li').first()).toBeVisible();
 await page.goto('#/memory?set=verified-red-only&lecture=L12&page=22');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await expect(page.locator('.memory-answer')).toContainText('전반부');await expect(page.locator('.flashcard')).toContainText('검은 설명까지 확대하지');await page.getByRole('button',{name:'기억했어요'}).click();expect((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).cardReviews,key))['card-red-case-halves'].reviews).toBe(1);
 await page.goto('#/bank');await page.getByRole('combobox',{name:'출제 범위 분류'}).selectOption('IN_SCOPE_RED');await expect(page.getByText('검색된 학습 문항 70개 · 실전 후보 70개')).toBeVisible();
 await page.getByRole('combobox',{name:'출제 범위 분류'}).selectOption('EXPLICITLY_EXCLUDED');await expect(page.locator('.practice')).toHaveCount(5);
 await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)!);s.wrong={'q-se-2':{count:1,last:1},'q-generalization-2':{count:1,last:1}};localStorage.setItem(k,JSON.stringify(s))},key);await page.reload();await page.goto('#/wrong');await expect(page.locator('.question-stack > article')).toHaveCount(2);await page.getByLabel('실전 빨간 강조 오답만').check();await expect(page.locator('.question-stack > article')).toHaveCount(1);expect(Object.keys(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).wrong,key))).toHaveLength(2);
 await page.goto('#/hints');await expect(page.getByRole('heading',{name:'최신 실전 범위 · 2026.10.15'})).toBeVisible();if(info.project.name==='mobile')expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`analysis/red-only-2026-10-15/${info.project.name}-red-hints.png`,fullPage:true});expect(errors).toEqual([]);
});
