import raw from './data/course.json';
import type {Question} from './types';

const lectures=new Map(raw.lectures.filter(l=>raw.exam_scope.lecture_ids.includes(l.lecture_id)).map(l=>[l.lecture_id,l]));
export function inMidtermScope(q:Question){
 const lecture=lectures.get(q.lecture_id);
 return q.scope_status==='IN_SCOPE'&&!!lecture&&lecture.file===q.source_pdf&&q.source_page>=1&&q.source_page<=lecture.page_count;
}
export const isProfessorStyle=(q:Question)=>q.teacher_style===true&&q.options.length===4&&typeof q.correct_answer==='number';
export const midtermExclusion=(q:Question)=>q.midterm_excluded===true||raw.exam_scope.xp_excluded_concept_ids.includes(q.concept_id)||raw.exam_scope.xp_excluded_question_ids.includes(q.question_id);
