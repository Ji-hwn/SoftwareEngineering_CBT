import {test,expect} from '@playwright/test';

test('hint menu, 14 cards, filtered practice and source page connect on desktop and mobile',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('');
 if(info.project.name==='mobile')await page.getByRole('button',{name:'메뉴 열기'}).click();
 await page.getByRole('link',{name:'교수님 시험 힌트',exact:true}).click();
 await expect(page.getByRole('heading',{name:'교수님 시험 힌트',exact:true})).toBeVisible();
 await expect(page.locator('.hint-card')).toHaveCount(14);
 await expect(page.locator('.hints-notice')).toContainText('PDF');
 const actors=page.locator('.hint-card').filter({has:page.getByRole('heading',{name:'액터의 종류',exact:true})});
 await actors.getByRole('link',{name:/문제 연습/}).click();await expect(page).toHaveURL(/hint=actors/);
 await expect(page.locator('.practice')).toHaveCount(5);
 const proxy=page.locator('.practice').filter({has:page.getByRole('heading',{name:'교수님이 예로 든 조교의 프록시 액터 조건은?'})});
 await proxy.getByRole('button',{name:/조교 본인 계정/}).click();await proxy.getByRole('button',{name:'답 확인하기'}).click();
 await expect(proxy.getByText('정답입니다',{exact:true})).toBeVisible();
 await proxy.getByRole('link',{name:'관련 강의 복습 →'}).click();await expect(page).toHaveURL(/classroom\/L09-extra\/27/);
 await expect(page.locator('.page-hints')).toContainText('액터의 종류');
 await page.goto('#/hints');await page.getByRole('button',{name:'테마 전환'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`analysis/${info.project.name}-professor-hints.png`,fullPage:true});expect(errors).toEqual([]);
});

test('new midterm includes 3R, preserves 70 percent and excludes XP; grading persists',async({page})=>{
 await page.goto('#/exam');await expect(page.getByText(/XP의 12가지 실천사항\(L10 9p\)/)).toBeVisible();
 await page.getByRole('button',{name:'시험 시작하기'}).click();await expect(page.locator('.explanation')).toHaveCount(0);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!).active);
 expect(before.question_ids).toHaveLength(20);
 const qs=Object.values(before.snapshots) as {concept_id:string;midterm_priority:boolean;correct_answer:string|number|number[];options:string[]}[];
 expect(qs.filter(q=>q.midterm_priority)).toHaveLength(14);expect(qs[0].concept_id).toBe('3r');expect(qs.some(q=>q.concept_id==='xp-practices')).toBe(false);
 const first=qs[0];
 if(typeof first.correct_answer==='string')await page.getByRole('textbox',{name:'답안'}).fill(first.correct_answer);
 else for(const i of Array.isArray(first.correct_answer)?first.correct_answer:[first.correct_answer])await page.locator('.exam-question .option').filter({hasText:first.options[i]}).click();
 await page.reload();const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!).active);expect(restored.answers[before.question_ids[0]]).toEqual(first.correct_answer);
 await page.getByRole('button',{name:'답안 제출하기'}).click();await page.getByRole('button',{name:'제출 확정'}).click();
 await expect(page.getByRole('heading',{name:'정답 1 · 오답 0 · 미응답 19'})).toBeVisible();
 await expect(page.getByText('실제 강조 출제 70% (목표 70%)')).toBeVisible();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('jihwanlee-se-cbt-v1')!));expect(state.history).toHaveLength(1);expect(state.active).toBeNull();expect(Object.keys(state.wrong)).toHaveLength(19);
});

test('XP practices remain learnable in classroom, memory and bank',async({page})=>{
 await page.goto('#/classroom/L10/9');await expect(page.locator('.page-lesson')).toContainText('짝 프로그래밍');
 await expect(page.locator('.page-hints')).toContainText('중간고사 제외');
 await page.goto('#/memory?lecture=L10&page=9&mode=fill');await expect(page.locator('.flashcard')).toContainText('실천');
 await page.goto('#/bank?concept=xp-practices');await expect(page.locator('.practice').first()).toBeVisible();
});
