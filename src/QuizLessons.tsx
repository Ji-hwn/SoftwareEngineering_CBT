import {Link} from 'react-router-dom';
import {course,conceptMap,questionMap,useStore} from './store';
import {PageLesson} from './PageLesson';
import {SourceLink,Practice} from './Question';

export function QuizSources({query=''}:{query?:string}){
 return <section className="card lecture-section"><h2>2026.10.14 수업 퀴즈</h2><p>Lecture 13·14는 일반 강의와 구분한 당일 풀이 자료입니다. 표지의 2025년과 실제 수업일은 별도로 관리하며, 문제·정답 원문은 공개하지 않습니다.</p>
  <div className="actions"><Link className="btn primary" to="/exam?mode=class-quiz">2026.10.14 수업 퀴즈 집중</Link><Link className="btn" to="/memory?set=class-2026-10-14">오늘의 개념 암기</Link><Link className="btn" to="/bank?class=2026-10-14">오늘의 검증 문제</Link></div>
  {course.quiz_sources.map(s=><details key={s.lecture_id}><summary>{s.title} · {s.unique_questions}개 원본 문항 분석</summary><div className="concept-list">{s.concept_ids.filter(id=>conceptMap[id]&&(!query||[conceptMap[id].name,conceptMap[id].definition].join(' ').includes(query))).map(id=>{const c=conceptMap[id];return <Link key={id} to={`/classroom/${c.lecture_id}/${c.source_page}?concept=${id}`}><span>{c.name}<small>{c.origin==='classroom-quiz'?'당일 풀이에서 추가된 개념':'일반 강의와 연결된 개념'}</small></span><span>→</span></Link>})}</div></details>)}
  <p className="muted">고유 55문항은 시험 범위 안입니다. Lecture 14의 28번은 교수님 직접 안내(2026.10.14)로 중간고사 출제를 제외합니다. 8번·35번은 범위 안이지만 정답 품질 검수를 보류합니다. 나머지 학습 개념과 검증 변형 문항은 유지합니다.</p>
 </section>;
}
export function QuizLesson({lecture,page}:{lecture:string;page:number}){
 const {state,update}=useStore();const source=course.quiz_sources.find(s=>s.lecture_id===lecture);const lesson=course.quiz_pages.find(p=>p.lecture_id===lecture&&p.page===page);
 if(!source||!lesson)return <div className="card"><p>이 출처는 당일 퀴즈 자료입니다. 관련 학습 개념 목록에서 이동하세요.</p><Link to="/lectures">강의·수업 퀴즈 목록</Link></div>;
 return <><div className="page-heading"><div><div className="eyebrow">CLASS QUIZ / 2026.10.14</div><h1>{lesson.title}</h1><p>{source.file} · PDF {page}p. 당일 풀이 개념을 재구성한 학습 내용입니다.</p></div></div><PageLesson page={lesson}/>{lesson.concept_ids.map(id=>{const c=conceptMap[id];return <article className="card concept" key={id}><h2>{c.name}</h2><section className="definition"><p>{c.definition}</p><ul>{c.details.map(t=><li key={t}>{t}</li>)}</ul></section><p>쉬운 설명 · 자체 제작: {c.easy}</p><p>{c.example}</p><p>비교: {c.comparison}</p>{c.sources.map(s=><SourceLink key={`${s.lecture_id}:${s.source_page}`} source={s}/>)}<div className="actions"><button className="btn" aria-pressed={state.bookmarks.includes(id)} onClick={()=>update(s=>({...s,bookmarks:s.bookmarks.includes(id)?s.bookmarks.filter(x=>x!==id):[...s.bookmarks,id]}))}>개념 북마크</button><button className="btn primary" onClick={()=>update(s=>({...s,completed:s.completed.includes(id)?s.completed.filter(x=>x!==id):[...s.completed,id]}))}>{state.completed.includes(id)?'개념 학습 완료 · 취소':'이 개념 학습 완료'}</button><Link className="btn" to={`/bank?concept=${id}&style=professor`}>검증 문제 연습</Link></div><details><summary>확인 문제</summary>{c.active_question_ids?.map(qid=><Practice key={qid} q={questionMap[qid]}/>)}</details></article>})}</>;
}
