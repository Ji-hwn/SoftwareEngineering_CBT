export type Importance='Critical'|'Important'|'Standard';
export type QType='choice'|'ox'|'fill'|'short'|'multi'|'comparison'|'calculation'|'uml';
export type Difficulty='easy'|'medium'|'hard';
export type Answer=string|number|number[];
export interface Source {lecture_id:string;source_pdf:string;source_page:number}
export interface Concept extends Source {concept_id:string;sources:Source[];section:string;subsection:string;name:string;definition:string;details:string[];easy:string;background:string;example:string;comparison:string;memorize:string[];importance:Importance;verified:boolean;verification_status:string;question_ids:string[];diagrams:string[];formulas:string[];review_note:string}
export interface Question extends Source {question_id:string;concept_id:string;question_type:QType;difficulty:Difficulty;importance:Importance;emphasis_related:boolean;question_text:string;options:string[];correct_answer:Answer;accepted_answers:string[];explanation:string;wrong_option_explanations:Record<string,string>;verified:boolean;diagram:string}
export interface Lecture {lecture_id:string;lecture_number:number;file:string;title:string;page_count:number;learning_pages:number[];concept_ids:string[]}
export interface Course {lectures:Lecture[];concepts:Concept[];questions:Question[];pages:{lecture_id:string;page:number;concept_ids:string[];status:string}[]}
export interface Attempt {id:string;question_id:string;concept_id:string;correct:boolean;answer:Answer|null;at:number;exam_id?:string}
export interface Review {due:number;step:number;unknown:boolean;reviews:number}
export interface Exam {id:string;question_ids:string[];answers:Record<string,Answer>;flags:string[];started:number;deadline:number;submitted?:number;score?:number;correct?:number;unanswered?:number;settings:ExamSettings}
export interface ExamSettings {lectures:string[];count:number;minutes:number;criticalRatio:number;difficulty:{easy:number;medium:number;hard:number};types:QType[];wrongOnly:boolean}
export interface StudyState {version:1;completed:string[];bookmarks:string[];reviews:Record<string,Review>;attempts:Attempt[];wrong:Record<string,{count:number;last:number}>;notes:Record<string,string>;history:Exam[];active:Exam|null;settings:{theme:'light'|'dark';font:number;criticalRatio:number;profile:string};exposure:Record<string,number>}
