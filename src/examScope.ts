import raw from './data/course.json';
import type {Question} from './types';

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
