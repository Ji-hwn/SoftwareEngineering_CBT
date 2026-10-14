import {Link} from 'react-router-dom';
import {course} from './store';
import {SourceLink} from './Question';

const origins={'student-notion':'학생 노션 필기','personal-inference':'학생 개인 풀이 검산','professor-reported':'사용자가 전달한 교수님 힌트'};
export function NotionGoals({lecture,page}:{lecture:string;page:number}){
 const notes=course.learning_notes.filter(n=>n.sources.some(s=>s.lecture_id===lecture&&s.source_page===page));
 if(!notes.length)return null;
 return <section className="notion-goals" aria-label="노션 필기와 학습 목표"><h3>노션 필기 · 시험용 학습 목표</h3>
  {notes.map(note=><article key={note.note_id}><div className="tags"><span>{origins[note.origin]}</span><span>{note.verification==='source-checked'?'원본 대조':'원본 대조 · 보충/보류 구분'}</span></div>
   <h4>{note.title}</h4><ul>{note.goals.map(goal=><li key={goal}>{goal}</li>)}</ul>
   {note.review_note&&<p className="review-warning">검수 메모: {note.review_note}</p>}
   {note.supplement&&<details><summary>{note.supplement.label}</summary><p>{note.supplement.text}</p><a href={note.supplement.url} target="_blank" rel="noreferrer">{note.supplement.title} ↗</a></details>}
   <div className="actions"><Link className="btn" to={`/memory?lecture=${lecture}&page=${page}&mode=fill`}>이 페이지 암기</Link><Link className="btn primary" to={`/bank?style=professor&concept=${note.concept_ids[0]}`}>기출 스타일 연습</Link></div>
   <details><summary>대조한 원본 출처</summary>{note.sources.map(s=><SourceLink key={`${s.lecture_id}:${s.source_page}`} source={s}/>)}</details>
  </article>)}
  <p className="muted">학생 암기 표시와 개인 풀이를 PDF 빨간 강조·교수님 직접 언급과 같은 근거로 취급하지 않습니다.</p>
 </section>
}
