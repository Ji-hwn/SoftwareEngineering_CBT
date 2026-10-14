import type {Answer,Question,StudyState,ExamSettings,Exam} from './types';
import {isMidtermExcluded,isMidtermPriority,hintScore,getConceptHints} from './professorHints';
import {inMidtermScope,isProfessorStyle,isClassQuiz} from './examScope';
export const KEY='jihwanlee-se-cbt-v1';
export const emptyState=():StudyState=>({version:1,content_revision:2,completed:[],completedPages:[],bookmarks:[],reviews:{},cardReviews:{},memoryAttempts:[],attempts:[],wrong:{},notes:{},history:[],active:null,settings:{theme:'light',font:17,criticalRatio:70,profile:'jihwanlee'},exposure:{}});
export const normalize=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'').trim();
export function grade(q:Question,a:Answer|undefined|null){
  if(a===undefined||a===null||a==='')return false;
  if(q.answer_groups){
    if(typeof a!=='string')return false;
    const parts=a.split(/[;；\n]/).map(normalize);if(parts.length!==q.answer_groups.length)return false;
    if(q.answer_ordered)return q.answer_groups.every((g,i)=>g.some(v=>normalize(v)===parts[i]));
    const match=(i:number,available:string[]):boolean=>i===q.answer_groups!.length||available.some((part,j)=>q.answer_groups![i].some(v=>normalize(v)===part)&&match(i+1,available.filter((_,k)=>k!==j)));
    return match(0,parts);
  }
  if(q.question_type==='multi')return Array.isArray(a)&&Array.isArray(q.correct_answer)&&a.length===q.correct_answer.length&&[...a].sort((x,y)=>x-y).every((x,i)=>x===[...(q.correct_answer as number[])].sort((x,y)=>x-y)[i]);
  if(typeof q.correct_answer==='number')return typeof a==='number'&&q.correct_answer===a;
  if(q.question_type==='calculation'&&typeof a==='string'){
    const value=normalize(a);return /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value)&&Number.isFinite(Number(value))&&Math.abs(Number(value)-Number(q.correct_answer))<1e-9;
  }
  return typeof a==='string'&&(q.accepted_answers.length?q.accepted_answers:[String(q.correct_answer)]).some(x=>normalize(x)===normalize(a));
}
export function answered(a:Answer|undefined){return a!==undefined&&a!==''&&(!Array.isArray(a)||a.length>0)}
export function restore(raw:unknown):StudyState {
  if(!raw||typeof raw!=='object')throw Error('백업 형식이 올바르지 않습니다.');
  const d=raw as StudyState;
  const arrayStrings=(x:unknown)=>Array.isArray(x)&&x.every(v=>typeof v==='string');
  const record=(x:unknown)=>!!x&&typeof x==='object'&&!Array.isArray(x);
  if(d.version!==1||!arrayStrings(d.completed)||!arrayStrings(d.bookmarks)||!Array.isArray(d.attempts)||!Array.isArray(d.history)||!record(d.reviews)||!record(d.wrong)||!record(d.notes)||!record(d.exposure)||!record(d.settings)||!['light','dark'].includes(d.settings.theme)||!Number.isFinite(d.settings.font)||d.settings.font<14||d.settings.font>24||!Number.isFinite(d.settings.criticalRatio)||d.settings.criticalRatio<0||d.settings.criticalRatio>100||typeof d.settings.profile!=='string')throw Error('백업 스키마 또는 설정을 확인하세요.');
  if(!Object.values(d.notes).every(x=>typeof x==='string')||!Object.values(d.wrong).every(x=>record(x)&&Number.isFinite(x.count)&&x.count>=0&&Number.isFinite(x.last))||!Object.values(d.reviews).every(x=>record(x)&&Number.isFinite(x.due)&&Number.isInteger(x.step)&&typeof x.unknown==='boolean'&&Number.isFinite(x.reviews))||!Object.values(d.exposure).every(x=>Number.isFinite(x)&&x>=0)||!d.attempts.every(x=>record(x)&&typeof x.question_id==='string'&&typeof x.concept_id==='string'&&typeof x.correct==='boolean'&&Number.isFinite(x.at)))throw Error('백업 학습 기록이 손상되었습니다.');
  const validExam=(x:Exam)=>record(x)&&typeof x.id==='string'&&arrayStrings(x.question_ids)&&record(x.answers)&&arrayStrings(x.flags)&&Number.isFinite(x.started)&&Number.isFinite(x.deadline)&&record(x.settings)&&arrayStrings(x.settings.lectures)&&(x.settings.mode===undefined||['mixed','professor-style','hint-focus','class-quiz'].includes(x.settings.mode))&&(x.settings.varyWrong===undefined||typeof x.settings.varyWrong==='boolean')&&Number.isFinite(x.settings.count)&&Number.isFinite(x.settings.minutes);
  if(!d.history.every(x=>validExam(x)&&Number.isFinite(x.submitted))||(d.active!==null&&!validExam(d.active)))throw Error('백업 시험 기록이 손상되었습니다.');
  // Additive migration: keep the v1 storage key, IDs, answer indexes and absolute exam deadline.
  if(d.completedPages!==undefined&&!arrayStrings(d.completedPages))throw Error('페이지 진도 형식을 확인하세요.');
  if(d.cardReviews!==undefined&&(!record(d.cardReviews)||!Object.values(d.cardReviews).every(x=>record(x)&&Number.isFinite(x.due)&&Number.isInteger(x.step)&&typeof x.unknown==='boolean'&&Number.isFinite(x.reviews))))throw Error('암기 일정 형식을 확인하세요.');
  if(d.memoryAttempts!==undefined&&(!Array.isArray(d.memoryAttempts)||!d.memoryAttempts.every(x=>record(x)&&typeof x.card_id==='string'&&arrayStrings(x.answers)&&Array.isArray(x.correct)&&x.correct.every(v=>typeof v==='boolean')&&Number.isFinite(x.at))))throw Error('암기 답안 형식을 확인하세요.');
  for(const e of [...d.history,...(d.active?[d.active]:[])])if(e.snapshots!==undefined&&(!record(e.snapshots)||!e.question_ids.every(id=>{const q=e.snapshots?.[id];return q&&q.question_id===id&&typeof q.question_text==='string'&&Array.isArray(q.options)&&Array.isArray(q.accepted_answers)&&typeof q.explanation==='string'&&typeof q.question_type==='string'})))throw Error('시험 문항 보관본이 손상되었습니다.');
  return structuredClone({...d,content_revision:2,completedPages:d.completedPages??[],cardReviews:d.cardReviews??{},memoryAttempts:d.memoryAttempts??[]});
}
export function loadState(){try{const raw=localStorage.getItem(KEY);return raw?restore(JSON.parse(raw)):emptyState()}catch{return emptyState()}}
export function recordAnswer(state:StudyState,q:Question,answer:Answer|null,exam_id?:string,now=Date.now()):StudyState {
  const s=structuredClone(state);const correct=grade(q,answer);
  s.attempts.push({id:crypto.randomUUID(),question_id:q.question_id,concept_id:q.concept_id,correct,answer,at:now,exam_id});
  if(!correct){s.wrong[q.question_id]={count:(s.wrong[q.question_id]?.count??0)+1,last:now};s.reviews[q.concept_id]={due:now,step:0,unknown:true,reviews:s.reviews[q.concept_id]?.reviews??0};}
  else if(s.wrong[q.question_id])s.wrong[q.question_id].last=now;
  return s;
}
export function reviewConcept(state:StudyState,id:string,known:boolean,now=Date.now()){
  const s=structuredClone(state);const prev=s.reviews[id];const step=known?Math.min((prev?.unknown?-1:prev?.step??-1)+1,2):0;
  s.reviews[id]={due:now+(known?[1,3,7][step]*86400000:0),step,unknown:!known,reviews:(prev?.reviews??0)+1};return s;
}
export function remaining(exam:Exam,now=Date.now()){return Math.max(0,Math.ceil((exam.deadline-now)/1000))}
export function selectQuestions(all:Question[],settings:ExamSettings,state:StudyState,rng=Math.random){
  const weakConcepts=new Set(all.filter(q=>state.wrong[q.question_id]).map(q=>q.concept_id));
  const pool=all.filter(q=>q.verified&&!q.retired&&inMidtermScope(q)&&!isMidtermExcluded(q)&&(settings.mode!=='professor-style'||isProfessorStyle(q))&&(settings.mode!=='class-quiz'||isClassQuiz(q))&&(settings.mode!=='hint-focus'||getConceptHints(q.concept_id).some(h=>h.tier!=='excluded'))&&(!settings.lectures.length||settings.lectures.includes(q.lecture_id))&&settings.types.includes(q.question_type)&&(!settings.wrongOnly||(settings.varyWrong?weakConcepts.has(q.concept_id):!!state.wrong[q.question_id])));
  const groups=(qs:Question[])=>new Set(qs.map(q=>q.selection_family??q.question_id)).size;
  const count=Math.min(settings.count,groups(pool));const target=Math.round(count*settings.criticalRatio/100);
  const crit=pool.filter(isMidtermPriority);const normal=pool.filter(q=>!isMidtermPriority(q));
  const criticalTarget=Math.min(groups(crit),Math.max(target,count-groups(normal)));
  const sum=settings.difficulty.easy+settings.difficulty.medium+settings.difficulty.hard;
  const quotas={easy:count*(sum?settings.difficulty.easy/sum:.3),medium:count*(sum?settings.difficulty.medium/sum:.5),hard:count*(sum?settings.difficulty.hard/sum:.2)};
  const selected:Question[]=[];const used=new Set<string>();const usedFamilies=new Set<string>();const diffCount={easy:0,medium:0,hard:0};const lectureCount:Record<string,number>={};const conceptCount:Record<string,number>={};
  let cc=0;
  // The user's professor specifically said 3R would appear. For a normal
  // midterm mock exam, represent it at least once when eligible, without
  // bypassing explicit lecture/type/0%-priority/wrong-only filters.
  if(count>0 && settings.criticalRatio>0 && !settings.wrongOnly &&
     (!settings.lectures.length || settings.lectures.includes('L01'))){
    const threeR=pool.filter(q=>q.concept_id==='3r'&&isMidtermPriority(q))
      .sort((a,b)=>(state.exposure[a.question_id]??0)-(state.exposure[b.question_id]??0))[0];
    if(threeR){
      selected.push(threeR);used.add(threeR.question_id);usedFamilies.add(threeR.selection_family??threeR.question_id);cc++;
      diffCount[threeR.difficulty]++;lectureCount[threeR.lecture_id]=1;conceptCount[threeR.concept_id]=1;
    }
  }
  while(selected.length<count){
    const wantCrit=cc<criticalTarget&&(selected.length-cc>=count-criticalTarget||cc<(selected.length+1)*criticalTarget/count);
    const candidates=pool.filter(q=>!used.has(q.question_id)&&!usedFamilies.has(q.selection_family??q.question_id)&&isMidtermPriority(q)===wantCrit);
    let best:Question|undefined;let score=-Infinity;
    for(const q of candidates){
      const dscore=quotas[q.difficulty]-diffCount[q.difficulty];
      const value=(lectureCount[q.lecture_id]?0:60)+dscore*5-(conceptCount[q.concept_id]??0)*4-(state.exposure[q.question_id]??0)*3+hintScore(q)+(q.teacher_style?2:0)-(settings.varyWrong&&state.wrong[q.question_id]?5:0)+(q.concept_id==='3r'&&selected.length===0&&settings.criticalRatio>0?1000:0)+rng();
      if(value>score){best=q;score=value}
    }
    if(!best)break;
    selected.push(best);used.add(best.question_id);usedFamilies.add(best.selection_family??best.question_id);cc+=isMidtermPriority(best)?1:0;diffCount[best.difficulty]++;lectureCount[best.lecture_id]=(lectureCount[best.lecture_id]??0)+1;conceptCount[best.concept_id]=(conceptCount[best.concept_id]??0)+1;
  }
  const notices=[];
  if(count<settings.count)notices.push(`조건에 맞는 검증 문항이 ${count}개입니다. 중복 없이 ${count}문항으로 시작합니다.`);
  if(criticalTarget!==target)notices.push(`강조 ${groups(crit)}개·일반 ${groups(normal)}개 후보로 목표 강조 ${target}문항을 충족할 수 없어 ${criticalTarget}문항으로 조정했습니다.`);
  const goal={easy:Math.floor(quotas.easy),medium:Math.floor(quotas.medium),hard:Math.floor(quotas.hard)};
  let left=count-goal.easy-goal.medium-goal.hard;for(const k of [...(['easy','medium','hard'] as const)].sort((a,b)=>(quotas[b]-goal[b])-(quotas[a]-goal[a])))if(left-->0)goal[k]++;
  if((['easy','medium','hard'] as const).some(k=>diffCount[k]!==goal[k]))notices.push(`강조 비율·단원 균형·후보 난이도를 함께 적용한 실제 난이도는 쉬움 ${diffCount.easy}, 보통 ${diffCount.medium}, 어려움 ${diffCount.hard}문항입니다. 목표 ${goal.easy}/${goal.medium}/${goal.hard}와 차이가 있습니다.`);
  return {questions:selected,requested:settings.count,actualCritical:cc,notice:notices.join(' ')};
}
export function finishExam(state:StudyState,questions:Question[],now=Date.now()){
  if(!state.active)return state;const e=structuredClone(state.active);if(state.history.some(h=>h.id===e.id))return {...state,active:null};
  let s=structuredClone(state);let correct=0;let unanswered=0;
  for(const id of e.question_ids){const q=e.snapshots?.[id]??questions.find(q=>q.question_id===id);if(!q){unanswered++;continue}const a=e.answers[id];if(!answered(a))unanswered++;if(grade(q,a))correct++;s=recordAnswer(s,q,answered(a)?a:null,e.id,now)}
  e.submitted=Math.min(now,e.deadline);e.correct=correct;e.unanswered=unanswered;e.score=Math.round(correct/e.question_ids.length*100);s.history.unshift(e);s.active=null;return s;
}
export function gradeKeywords(groups:string[][],answers:string[]){return groups.map((aliases,i)=>aliases.some(term=>normalize(term)===normalize(answers[i]??'')))}
export function reviewCard(state:StudyState,id:string,known:boolean,now=Date.now()){
  const prev=state.cardReviews[id];const step=known?Math.min((prev?.unknown?-1:prev?.step??-1)+1,2):0;
  return {...state,cardReviews:{...state.cardReviews,[id]:{due:now+(known?[1,3,7][step]*86400000:0),step,unknown:!known,reviews:(prev?.reviews??0)+1}}};
}
