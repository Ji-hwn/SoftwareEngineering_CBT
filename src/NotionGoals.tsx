import {Link} from 'react-router-dom';
import {course} from './store';
import {SourceLink} from './Question';

const origins={'student-notion':'학생 노션 필기','personal-inference':'학생 개인 풀이 검산','professor-reported':'사용자가 전달한 교수님 힌트'};
const guidanceLabels:Record<string,string>={'professor-emphasis':'교수님 중요 언급','memorize-instruction':'교수님 암기·표시 안내','engineer-exam-reference':'정보처리기사 기출 언급','incorrect-example':'잘못된 설명 예시','explicit-exclusion':'교수님 출제 제외 안내','student-summary':'학생 학습 정리','personal-inference':'학생 개인 추론'};
export function ClassGuidanceGoals({lecture,page}:{lecture:string;page:number}){
 const notes=course.class_guidance.filter(n=>n.lecture_id===lecture&&n.source_page===page);
 if(!notes.length)return null;
 return <section className="class-guidance notion-goals" aria-label="10월 14일 필기와 원본 대조"><h3>10월 14일 수업 필기 · 원본 대조</h3>
  {notes.map(n=><article key={n.note_id}><div className="tags">{n.reported_kinds.map(kind=><span key={kind}>{guidanceLabels[kind]}</span>)}{n.priority&&<span>반복 학습 우선</span>}</div><h4>{n.title}</h4><p>{n.reported_summary}</p>
   <strong>핵심 회상 · 자체 정리</strong><ul>{n.goals.map(g=><li key={g}>{g}</li>)}</ul><strong>원본에 근거한 쉬운 설명</strong><p>{n.explanation}</p>
   {n.confusion&&<p className="notice">헷갈리기 쉬운 설명: {n.confusion}</p>}{n.review_note&&<p className="review-warning">해석 보류·표기 메모: {n.review_note}</p>}
   <div className="actions"><Link className="btn" to={`/memory?lecture=${lecture}&page=${page}&mode=fill`}>이 페이지 암기</Link><Link className="btn primary" to={`/bank?style=professor&concept=${n.concept_ids[0]}`}>연결 객관식 연습</Link></div><SourceLink source={n}/>
  </article>)}<p className="muted">발언은 사용자가 전달한 필기에 근거합니다. 학습 내용은 PDF와 대조했습니다. 정보처리기사 기출 언급은 대학 중간고사 출제 확정이나 객관적인 출제 확률이 아닙니다.</p>
 </section>;
}
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
