import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('src/data/course.json','utf8'));
const key='jihwanlee-se-cbt-v1';
test('default midterm is red-only, frozen at 100%, survives reload and grades on submission',async({page})=>{
 await page.goto('#/exam');await expect(page.getByRole('combobox',{name:'출제 범위 정책'})).toHaveValue('red-only');await expect(page.locator('input[type=range]')).toBeDisabled();await expect(page.locator('input[type=range]')).toHaveValue('100');
 await page.getByRole('button',{name:'시험 시작하기'}).click();const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active,key);
 expect(before.settings.criticalRatio).toBe(100);expect(before.question_ids).toHaveLength(20);expect(before.settings.scope_mode).toBe('red-only');expect(Object.values(before.snapshots).every((q:any)=>['DIRECT_RED','RED_TOPIC_CONTENT'].includes(q.red_scope_status)&&q.midterm_priority)).toBe(true);
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
  expect(qs.length).toBeGreaterThan(0);expect(qs.every(q=>['DIRECT_RED','RED_TOPIC_CONTENT'].includes(q.red_scope_status)&&data.red_scope.approved_question_ids.includes(q.question_id))).toBe(true);expect(e.question_ids).not.toContain('q-oct14-032');expect(qs.some(q=>q.concept_id==='xp-practices')).toBe(false);
  expect(new Set(qs.map(q=>q.red_selection_family??q.selection_family??q.question_id)).size).toBe(qs.length);if(mode==='class-quiz')expect(qs.length).toBeLessThan(50);
 }
});
test('zero eligible source/type intersection does not start an exam or bypass approved topics',async({page})=>{
 await page.goto('#/exam');await page.getByLabel(/Lecture 9 ·/).check();for(const cb of await page.getByRole('group',{name:'04 · 문제 유형'}).getByRole('checkbox').all())await cb.uncheck();await page.getByLabel('계산형',{exact:true}).check();await page.getByRole('button',{name:'시험 시작하기'}).click();await expect(page.getByRole('heading',{name:'나만의 모의고사'})).toBeVisible();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active,key)).toBeNull();await expect(page.getByRole('status')).toContainText('검증 문항이 없습니다');
});
test('topic classroom scope, related recall, classification and wrong-only filter preserve general study',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('#/classroom/L12/9');await expect(page.getByRole('region',{name:'실전 강조 범위'})).toContainText('구조적 분석 모델과 도구');await expect(page.locator('.atomic-list')).toContainText('자료 반복');
 await page.goto('#/classroom/L12/26');await expect(page.getByRole('region',{name:'실전 강조 범위'})).toContainText('승인된 강조 주제의 관련 본문이 아닙니다');await expect(page.locator('.atomic-list li').first()).toBeVisible();
 await page.goto('#/memory?set=verified-red-only&lecture=L12&page=22');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await expect(page.locator('.memory-answer')).toContainText('전반부');await expect(page.locator('.flashcard')).toContainText('검증된 같은 주제의 검은 본문');await page.getByRole('button',{name:'기억했어요'}).click();expect((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).cardReviews,key))['card-red-case-halves'].reviews).toBe(1);
 await page.goto('#/bank');await page.getByRole('combobox',{name:'출제 범위 분류'}).selectOption('APPROVED');await expect(page.getByText('검색된 학습 문항 317개 · 실전 후보 317개')).toBeVisible();
 await page.getByRole('combobox',{name:'출제 범위 분류'}).selectOption('EXPLICITLY_EXCLUDED');await expect(page.locator('.practice')).toHaveCount(5);
 await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)!);s.wrong={'q-se-2':{count:1,last:1},'q-generalization-2':{count:1,last:1},'q-oct14-027':{count:1,last:1}};localStorage.setItem(k,JSON.stringify(s))},key);await page.reload();await page.goto('#/wrong');await expect(page.locator('.question-stack > article')).toHaveCount(3);await page.getByLabel('실전 강조 주제 오답만').check();await expect(page.locator('.question-stack > article')).toHaveCount(2);expect(Object.keys(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).wrong,key))).toHaveLength(3);
 await page.goto('#/hints');await expect(page.getByRole('heading',{name:'최신 실전 범위 · 2026.10.16'})).toBeVisible();if(info.project.name==='mobile')expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`analysis/red-topics-2026-10-16/${info.project.name}-red-hints.png`,fullPage:true});expect(errors).toEqual([]);
});


test('UML source selections include related black content with answer proof and preserve filters',async({page})=>{
 await page.goto('#/exam');await page.getByLabel(/Lecture 9 ·/).check();await page.getByLabel('문제 수').selectOption('50');await page.getByRole('button',{name:'시험 시작하기'}).click();
 const exam=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active,key);const qs=Object.values(exam.snapshots) as any[];
 expect(qs.length).toBeGreaterThan(0);expect(qs.every(q=>q.lecture_id==='L09'&&q.red_scope_status==='RED_TOPIC_CONTENT')).toBe(true);expect(qs.some(q=>q.concept_id==='3r')).toBe(false);expect(qs.every(q=>q.red_answer_sources.length&&q.red_topic_anchor_sources.length)).toBe(true);
 await page.goto('#/memory?set=verified-red-only&lecture=L09-extra&page=36');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await expect(page.locator('.flashcard')).toContainText('강조 주제 관련 본문');await expect(page.locator('.memory-answer')).toContainText('동기');
 await page.goto('#/bank?concept=composition');const item=page.locator('.practice').filter({hasText:'전체와 부분의생명주기가 강하게'});await item.getByRole('button',{name:'Composition · 전체 쪽채운 마름모',exact:false}).click();await item.getByRole('button',{name:'답 확인하기'}).click();await item.getByText('강조 주제와 정답 근거 구분',{exact:true}).click();await expect(item).toContainText('문제의 원래 출처');await expect(item).toContainText('소프트웨어공학_Lecture_08.pdf · PDF 23p');await expect(item).toContainText('소프트웨어공학_Lecture_08.pdf · PDF 24p');
});


test('topic recall keeps verified siblings while withholding only ambiguous and excluded details',async({page})=>{
 await page.goto('#/memory?set=verified-red-only&lecture=L06&page=13');await page.getByRole('combobox',{name:'암기 필터'}).selectOption('topic');await expect(page.locator('.memory-progress')).toContainText('카드 1 / 6');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await expect(page.locator('.memory-answer')).toContainText('처리량');await page.getByRole('button',{name:'건너뛰기 →'}).click();await page.getByRole('button',{name:'정답 확인',exact:true}).click();await expect(page.locator('.memory-answer')).toContainText('응답 시간');
 await page.goto('');await page.goto('#/memory?set=verified-red-only&lecture=L09-extra&page=37');await page.getByRole('combobox',{name:'암기 필터'}).selectOption('topic');await expect(page.locator('.memory-progress')).toContainText('카드 1 / 5');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await expect(page.locator('.memory-answer')).toContainText('자신의 메서드');
 await page.goto('');await page.goto('#/memory?set=verified-red-only&lecture=L13&page=34');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await expect(page.locator('.memory-answer')).toContainText('중복');
});
