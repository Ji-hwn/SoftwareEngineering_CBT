import {describe,it,expect} from 'vitest';
import {course,questionMap} from './store';
import {emptyState,restore,grade,gradeKeywords,reviewCard,finishExam,selectQuestions} from './core';
import type {ExamSettings} from './types';
const settings:ExamSettings={lectures:[],count:20,minutes:30,criticalRatio:70,difficulty:{easy:30,medium:50,hard:20},types:['choice','short','fill','multi','ox','comparison','calculation','uml'],wrongOnly:false};
describe('precision content contract',()=>{
 it('all 173 learning pages contain their own authored atoms and teaching text',()=>{
  const pages=course.pages.filter(p=>p.status!=='excluded-nonlearning');expect(pages).toHaveLength(173);
  for(const p of pages){expect(p.title).toBeTruthy();expect(p.easy.length).toBeGreaterThan(30);expect(p.atomic_item_ids.length).toBeGreaterThan(0);for(const id of p.atomic_item_ids){const a=course.atomic_items.find(a=>a.atomic_item_id===id)!;expect(a.lecture_id).toBe(p.lecture_id);expect(a.source_page).toBe(p.page);expect(a.content_reference).toContain(id)}}
 });
 it('3R definition and necessity and relationship code pages do not repeat the same body',()=>{
  const page=(l:string,p:number)=>course.pages.find(x=>x.lecture_id===l&&x.page===p)!;
  expect(page('L01',5).title).toContain('정의');expect(page('L01',6).title).toContain('필요성');expect(page('L01',5).easy).not.toBe(page('L01',6).easy);
  expect(page('L08',18).title).toContain('코드');expect(page('L08',18).easy).not.toBe(page('L08',17).easy);
  const causes=page('L01',3).atomic_item_ids.map(id=>course.atomic_items.find(a=>a.atomic_item_id===id)!.text);expect(causes).toHaveLength(5);expect(causes[2]).toContain('설계');
 });
 it('atoms, cards and questions have stable unique IDs and valid sources',()=>{
  for(const [key,items] of [['atomic_item_id',course.atomic_items],['card_id',course.memory_cards]] as const)expect(new Set(items.map(x=>(x as unknown as Record<string,string>)[key])).size).toBe(items.length);
  for(const card of course.memory_cards){expect(card.atomic_item_ids.length).toBeGreaterThan(0);if(card.answer_groups.length){expect(card.prompt).toContain('【1】');expect(gradeKeywords(card.answer_groups,card.answer_groups.map(a=>a[0])).every(Boolean)).toBe(true)}}
 });
 it('retired questions stay readable but never enter newly generated exams',()=>{
  expect(questionMap['q-se-1'].retired).toBe(true);expect(grade(questionMap['q-se-1'],'소프트웨어공학')).toBe(true);
  for(let i=0;i<30;i++){const s=selectQuestions(course.questions,settings,emptyState());expect(s.actualCritical).toBe(14);expect(s.questions.some(q=>q.retired)).toBe(false)}
  for(const q of course.questions.filter(q=>!q.retired)){expect(q.semantic_review).toBe('source-summary-reviewed');expect(q.atomic_item_ids?.length).toBeGreaterThan(0)}
 });
 it('black supporting diagram labels and repeated term prefixes do not inherit direct red emphasis',()=>{
  const atoms=course.atomic_items.filter(a=>a.lecture_id==='L01'&&a.source_page===41);expect(atoms[0].emphasis_level).toBe('Critical');expect(atoms.slice(1).some(a=>a.emphasis_level==='Critical')).toBe(false);
  const manifesto=course.atomic_items.filter(a=>a.lecture_id==='L01'&&a.source_page===31);expect(manifesto.slice(0,4).every(a=>a.emphasis_level==='Critical')).toBe(true);expect(manifesto[4].emphasis_level).toBe('Important');
 });
 it('structured recall accepts only full exact terms, preserves order when needed',()=>{
  const v=questionMap['q-v2-recall-verification'];expect(grade(v,'명확성; 완전성; 검증가능성; 일관성')).toBe(true);expect(grade(v,'완전성;일관성;명확성')).toBe(false);expect(grade(v,'완전성 아님;일관성;명확성;검증가능성')).toBe(false);
  const order=questionMap['q-v2-recall-lifecycle-steps'];expect(grade(order,'계획; 분석; 설계; 구현; 테스트; 유지보수')).toBe(true);expect(grade(order,'분석; 계획; 설계; 구현; 테스트; 유지보수')).toBe(false);
 });
});
describe('v1 records survive additive migration',()=>{
 const old=()=>({version:1,completed:['se'],bookmarks:['reengineering'],reviews:{se:{due:9999999999999,step:1,unknown:false,reviews:3}},attempts:[{id:'a',question_id:'q-se-2',concept_id:'se',correct:false,answer:1,at:100}],wrong:{'q-se-2':{count:2,last:100}},notes:{'q-se-2':'기존 메모'},history:[{id:'old-history',question_ids:['q-se-2'],answers:{'q-se-2':0},flags:[],started:1,deadline:1000,submitted:100,score:100,correct:1,unanswered:0,settings}],active:{id:'old-active',question_ids:['q-se-1','q-se-2'],answers:{'q-se-1':'소프트웨어공학','q-se-2':0},flags:['q-se-1'],started:1,deadline:9999999999999,settings},settings:{theme:'dark',font:19,criticalRatio:70,profile:'jihwanlee'},exposure:{'q-se-2':5}});
 it('keeps every old record including active exam and review deadline',()=>{
  const before=old();const s=restore(before);for(const key of Object.keys(before))expect(s[key as keyof typeof s]).toEqual(before[key as keyof typeof before]);expect(s.content_revision).toBe(2);expect(s.completedPages).toEqual([]);
  const result=finishExam(s,course.questions,200);expect(result.history[0].score).toBe(100);expect(result.history[1]).toEqual(before.history[0]);expect(result.notes).toEqual(before.notes);expect(result.bookmarks).toEqual(before.bookmarks);
 });
 it('future course changes cannot alter snapshot grading',()=>{
  const s=restore(old());s.active!.question_ids=['q-se-2'];s.active!.snapshots={'q-se-2':structuredClone(questionMap['q-se-2'])};const changed=course.questions.map(q=>q.question_id==='q-se-2'?{...q,correct_answer:3}:q);expect(finishExam(s,changed,200).history[0].score).toBe(100);
 });
 it('new card schedule does not overwrite previous concept reviews',()=>{const s=restore(old());const next=reviewCard(s,'card-L01-p002',true,0);expect(next.reviews).toEqual(s.reviews);expect(next.cardReviews['card-L01-p002'].due).toBe(86400000);expect(restore(JSON.parse(JSON.stringify(next)))).toEqual(next)});
 it('rejects corrupted new fields rather than replacing legacy records silently',()=>{expect(()=>restore({...old(),completedPages:'bad'})).toThrow();expect(()=>restore({...old(),cardReviews:{bad:{due:'x'}}})).toThrow();expect(()=>restore({...old(),memoryAttempts:[{card_id:'x',correct:['yes']}]})).toThrow()});
 it('keyword grading allows whitespace and case but no unrelated terms',()=>{expect(gradeKeywords([['Software Engineering'],['위기']],[' softwareENGINEERING ','위 기'])).toEqual([true,true]);expect(gradeKeywords([['합성']],['집약'])).toEqual([false])});
});
