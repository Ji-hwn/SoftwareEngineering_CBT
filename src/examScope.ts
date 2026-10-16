import raw from './data/course.json';
import type {Question,Course,Source} from './types';
const data=raw as unknown as Course;

const allowed=[...raw.exam_scope.lecture_ids,...raw.exam_scope.quiz_source_ids];
const lectures=new Map([...raw.lectures,...raw.quiz_sources].filter(l=>allowed.includes(l.lecture_id)).map(l=>[l.lecture_id,l]));
export function inMidtermScope(q:Question){
 const lecture=lectures.get(q.lecture_id);
 return q.scope_status==='IN_SCOPE'&&!!lecture&&lecture.file===q.source_pdf&&q.source_page>=1&&q.source_page<=lecture.page_count;
}
export const isClassQuiz=(q:Question)=>q.class_quiz_date===raw.exam_scope.class_quiz_date&&isProfessorStyle(q);
export function matchesSelectedSources(q:Question,selected:string[]){
 return !selected.length||selected.some(id=>raw.exam_scope.quiz_source_ids.includes(id)
  ? q.class_quiz_reference_ids?.some(ref=>ref.startsWith(`ref-${id.slice(1)}-`))
  : q.lecture_id===id);
}
export const isProfessorStyle=(q:Question)=>q.teacher_style===true&&q.options.length===4&&typeof q.correct_answer==='number';
export const midtermExclusion=(q:Question)=>q.midterm_excluded===true||raw.exam_scope.xp_excluded_concept_ids.includes(q.concept_id)||raw.exam_scope.xp_excluded_question_ids.includes(q.question_id)||raw.exam_scope.question_exclusions.some(rule=>rule.question_ids.includes(q.question_id)||(q.source_pdf===rule.source_file&&q.source_question_number===rule.source_question_number));
export const hasReviewedAnswer=(q:Question)=>q.verified&&q.quality_status!=='NEEDS_REVIEW';
// An allowlist of individually reviewed decisions, never a concept/importance shortcut.
const approvedRedIds=new Set(data.red_scope.approved_question_ids);
const redEvidence=new Map(data.red_scope.evidence.map(e=>[e.evidence_id,e]));
const topics=new Map(data.red_scope.topics.map(t=>[t.topic_id,t]));
const reviewed=new Map(data.questions.map(q=>[q.question_id,q]));
const sourceKey=(s:Source)=>`${s.lecture_id}:${s.source_pdf}:${s.source_page}`;
const sameIds=(a:string[]|undefined,b:string[]|undefined)=>JSON.stringify(a)===JSON.stringify(b);
const validGeneralSource=(s:Source)=>{const l=data.lectures.find(l=>l.lecture_id===s.lecture_id);return !!l&&l.file===s.source_pdf&&s.source_page>=1&&s.source_page<=l.page_count};
export function isRedEligible(q:Question){
 const original=reviewed.get(q.question_id);
 return approvedRedIds.has(q.question_id)&&!!original&&q.red_scope_status===original.red_scope_status&&
  ['DIRECT_RED','RED_TOPIC_CONTENT'].includes(q.red_scope_status??'')&&sourceKey(q)===sourceKey(original)&&
  q.question_text===original.question_text&&sameIds(q.options,original.options)&&JSON.stringify(q.correct_answer)===JSON.stringify(original.correct_answer)&&
  sameIds(q.red_topic_ids,original.red_topic_ids)&&sameIds(q.red_evidence_ids,original.red_evidence_ids)&&
  JSON.stringify(q.red_answer_sources)===JSON.stringify(original.red_answer_sources)&&
  hasReviewedAnswer(q)&&!q.retired&&!midtermExclusion(q)&&inMidtermScope(q)&&
  !!q.red_topic_ids?.length&&q.red_topic_ids.every(id=>{
   const t=topics.get(id);
   return t?.verified&&t.anchor_sources.length>0&&t.anchor_sources.every(validGeneralSource)&&
    original.red_answer_sources?.some(s=>validGeneralSource(s)&&s.lecture_id===t.lecture_id&&t.content_pages.includes(s.source_page));
  })&&
  !!q.red_evidence_ids?.length&&q.red_evidence_ids.every(id=>{
   const e=redEvidence.get(id),l=e&&lectures.get(e.lecture_id);
   return e?.verified&&['A','B'].includes(e.category)&&l?.file===e.source_pdf&&!/solution/i.test(e.source_pdf)&&e.source_page>=1&&e.source_page<=l.page_count;
  });
}
export const redStatusLabels:Record<string,string>={IN_SCOPE_RED:'과거 직접 강조 판정',DIRECT_RED:'직접 빨간색 강조',RED_TOPIC_CONTENT:'강조 주제의 관련 본문',OUT_OF_SCOPE:'일반 학습 · 강조 범위 밖',NEEDS_REVIEW:'강조 근거 검수 보류',EXPLICITLY_EXCLUDED:'교수님 명시적 제외',LEGACY_ONLY:'과거 기록 보관'};
