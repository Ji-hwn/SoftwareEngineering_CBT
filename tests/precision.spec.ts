import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {Course} from '../src/types';
const data=JSON.parse(readFileSync('src/data/course.json','utf8')) as Course;
test('page-specific 3R bodies, explicit page completion and darkness survive refresh',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('#/classroom/L01/5');await expect(page.locator('.page-lesson h2')).toHaveText('3R의 정의');
 const first=await page.locator('.atomic-list').innerText();await page.getByRole('button',{name:'다음',exact:true}).click();
 await expect(page.locator('.page-lesson h2')).toHaveText('3R의 필요성');expect(await page.locator('.atomic-list').innerText()).not.toBe(first);
 await expect(page.getByRole('button',{name:'이 페이지 학습 완료',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'이 페이지 학습 완료',exact:true}).click();await page.getByRole('button',{name:'테마 전환'}).click();await page.reload();
 await expect(page.getByRole('button',{name:'페이지 학습 완료 · 취소'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`analysis/${info.project.name}-precision-dark.png`,fullPage:true});expect(errors).toEqual([]);
});
test('real keyword inputs show incorrect word, persist attempts and card schedule',async({page})=>{
 const card=data.memory_cards.find(c=>c.card_id==='card-L01-p002')!;
 await page.goto('#/memory?lecture=L01&page=2&mode=fill');
 for(let i=0;i<card.answer_groups.length;i++)await page.getByRole('textbox',{name:`빈칸 ${i+1}`,exact:true}).fill(i===0?'틀린 개념':card.answer_groups[i][0]);
 await page.getByRole('button',{name:'입력 답안 채점'}).click();await expect(page.locator('.keyword-results .incorrect')).toContainText('틀린 개념');
 await expect(page.locator('.keyword-results')).toContainText(`${card.answer_groups.length-1}/${card.answer_groups.length}개 키워드 정답`);
 await page.reload();const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!));expect(state.memoryAttempts).toHaveLength(1);expect(state.cardReviews[card.card_id].unknown).toBe(true);
 for(let i=0;i<card.answer_groups.length;i++)await page.getByRole('textbox',{name:`빈칸 ${i+1}`,exact:true}).fill(card.answer_groups[i][0]);
 await page.getByRole('button',{name:'입력 답안 채점'}).click();await page.getByRole('button',{name:'기억했어요'}).click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!));expect(after.cardReviews[card.card_id].reviews).toBe(2);expect(after.cardReviews[card.card_id].step).toBe(0);
});
test('v1 active exam with retired question and past results restores without losing records',async({page})=>{
 await page.goto('');
 await page.evaluate(()=>{
  const settings={lectures:[],count:2,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['short','choice'],wrongOnly:false};
  const previous={id:'old-finished',question_ids:['q-se-2'],answers:{'q-se-2':0},flags:[],started:Date.now()-10000,deadline:Date.now(),submitted:Date.now()-5000,score:100,correct:1,unanswered:0,settings};
  const state={version:1,completed:['se'],bookmarks:['se'],reviews:{se:{due:Date.now()+86400000,step:1,unknown:false,reviews:3}},attempts:[],wrong:{'q-se-2':{count:2,last:Date.now()}},notes:{'q-se-2':'이전 메모'},history:[previous],active:{id:'old-running',question_ids:['q-se-1','q-se-2'],answers:{'q-se-1':'소프트웨어공학','q-se-2':0},flags:['q-se-1'],started:Date.now(),deadline:Date.now()+60000,settings},settings:{theme:'dark',font:19,criticalRatio:70,profile:'jihwanlee'},exposure:{}};
  localStorage.setItem('jihwanlee-se-cbt-v1',JSON.stringify(state));
 });
 await page.goto('#/exam');await page.reload();await expect(page.getByRole('heading',{name:'차분하게, 한 문제씩'})).toBeVisible();await expect(page.getByRole('textbox',{name:'답안'})).toHaveValue('소프트웨어공학');await expect(page.locator('.explanation')).toHaveCount(0);
 await page.getByRole('button',{name:'답안 제출하기'}).click();await page.getByRole('button',{name:'제출 확정'}).click();await expect(page.getByRole('heading',{name:'정답 2 · 오답 0 · 미응답 0'})).toBeVisible();
 await page.goto('#/results/old-finished');await expect(page.getByRole('heading',{name:'정답 1 · 오답 0 · 미응답 0'})).toBeVisible();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!));expect(state.notes['q-se-2']).toBe('이전 메모');expect(state.completed).toEqual(['se']);expect(state.reviews.se.reviews).toBe(3);expect(state.history).toHaveLength(2);expect(state.settings.theme).toBe('dark');
});
test('definition input hides the answer and uses the existing concept review schedule',async({page})=>{
 await page.goto('#/memory');await page.getByRole('combobox',{name:'암기 유형'}).selectOption('definition');
 await expect(page.getByRole('heading',{name:'정의에서 용어 찾기'})).toBeVisible();await expect(page.getByRole('heading',{name:'소프트웨어공학',exact:true})).toHaveCount(0);
 await page.getByRole('textbox',{name:'빈칸 1',exact:true}).fill('소프트웨어공학');await page.getByRole('button',{name:'입력 답안 채점'}).click();await page.getByRole('button',{name:'기억했어요'}).click();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!));expect(state.reviews.se.reviews).toBe(1);expect(state.reviews.se.step).toBe(0);expect(state.cardReviews.se).toBeUndefined();
});
