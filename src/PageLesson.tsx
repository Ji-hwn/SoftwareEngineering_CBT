import {useState} from 'react';
import {Link} from 'react-router-dom';
import {course,atomicMap,questionMap,useStore} from './store';
import type {PageContent} from './types';
import {Practice,SourceLink} from './Question';
import {Diagram} from './Diagrams';
import {getPageHints,hintLabel} from './professorHints';
import {NotionGoals,ClassGuidanceGoals} from './NotionGoals';

const pageDiagrams:Record<string,string[]>={
 'L01:13':['lifecycle'],'L01:38':['spiral'],'L01:41':['v-model'],
 'L03:23':['cpm'],'L03:24':['cpm'],'L03:25':['cpm'],'L03:27':['gantt'],
 'L08:16':['generalization'],'L08:17':['association'],'L08:19':['dependency'],
 'L08:21':['realization'],'L08:23':['aggregation'],'L08:24':['composition'],
 'L09:3':['class'],'L09:4':['object'],'L09:5':['component'],'L09:6':['deployment'],
 'L09:7':['composite'],'L09:8':['package'],'L09:10':['usecase'],'L09:11':['activity'],
 'L09:12':['sequence'],'L09:13':['communication'],'L09:14':['sequence','communication'],
 'L09:15':['state'],'L09:16':['timing'],'L09:17':['interaction-overview'],
 'L09-extra:20':['class'],'L09-extra:22':['class-source'],'L09-extra:28':['usecase'],
 'L09-extra:31':['include'],'L09-extra:32':['extend'],'L09-extra:35':['lifeline'],
 'L09-extra:36':['sequence'],'L09-extra:38':['sequence'],'L09-extra:40':['state']};

export function PageLesson({page}:{page:PageContent}){
 const {state,update}=useStore();const [showQuestions,setShowQuestions]=useState(false);
 const id=`${page.lecture_id}:${page.page}`;
 const atoms=page.atomic_item_ids.map(id=>atomicMap[id]);
 const hints=getPageHints(page.lecture_id,page.page);
 const diagrams=page.diagrams??pageDiagrams[id]??(page.duplicate_source?pageDiagrams[`${page.duplicate_source.lecture_id}:${page.duplicate_source.source_page}`]??[]:[]);
 if(!atoms.length)return null;
 return <article className="card concept page-lesson" aria-label="현재 페이지 고유 학습 내용">
  <div className="tags"><span>PDF {page.page}p</span><span>{atoms.length}개 세부 항목</span><span>원본 기반 재구성</span></div>
  <h2>{page.title}</h2><section className="red-scope-box" aria-label="실전 강조 범위"><strong>최신 실전 범위 · 강조 주제 100%</strong>{page.red_topic_ids?.length?<>{course.red_scope.topics.filter(t=>page.red_topic_ids?.includes(t.topic_id)).map(t=><div key={t.topic_id}><h3>{t.title}</h3><p>강조 주제의 관련 본문 · {t.relation}</p><p>강조 근거: {t.anchor_sources.map(s=>s.source_page+'p').join(', ')} / 현재 설명: {page.page}p</p><small className="muted">경계·보류: {t.boundary}</small></div>)}<ul>{course.red_scope.evidence.filter(e=>e.category==='A'&&page.red_evidence_ids?.includes(e.evidence_id)).map(e=><li key={e.evidence_id}><b>직접 강조 · {e.title}</b>: {e.summary}</li>)}</ul></>:<p>이 페이지는 승인된 강조 주제의 관련 본문이 아닙니다. 일반 학습은 그대로 보존하며, 검수 보류와 명시적 제외는 별도로 적용합니다.</p>}<Link to={`/memory?set=verified-red-only&lecture=${page.lecture_id}&page=${page.page}`}>이 페이지의 검증된 강조 주제 암기 →</Link></section>{hints.length>0&&<div className="page-hints">{hints.map(h=><Link key={h.id} className={`page-hint hint-${h.tier}`} to="/hints"><strong>{hintLabel[h.tier]}</strong> · {h.title}</Link>)}</div>}
  <p className="muted">현재 페이지의 내용을 먼저 학습하세요. 통합 개념 설명은 아래에서 펼칠 수 있습니다.</p>
  <section><span className="eyebrow">01 / 현재 페이지 핵심 내용</span><ol className="atomic-list">{atoms.map(a=><li id={a.atomic_item_id} key={a.atomic_item_id} className={a.emphasis_level.toLowerCase()}><span>{a.text}</span>{a.emphasis_level==='Critical'&&<small>직접 표시와 관련 본문 판정은 위의 주제 근거 참조</small>}{a.red_scope_status&&<small>{a.red_scope_status==='RED_TOPIC_CONTENT'?'강조 주제 관련 본문':a.red_scope_status==='NEEDS_REVIEW'?'검증 보류':a.red_scope_status==='EXPLICITLY_EXCLUDED'?'교수님 명시적 제외':'일반 학습'}</small>}{a.verification_status==='needs-review'&&<small className="review-warning">원본 검수 필요</small>}</li>)}</ol></section>
  {page.has_red_heading&&<p className="muted">반복 빨간 제목 아래 이어지는 설명·표·그림은 주제의 연속성을 검증해 포함했습니다. 새 독립 주제와 개별 품질 보류는 별도로 구분합니다.</p>}
  <section><span className="eyebrow">02 / 쉬운 설명 · 자체 제작 학습 보충</span><p>{page.easy}</p></section>
  {diagrams.map(d=><Diagram key={d} kind={d}/>)}
  <NotionGoals lecture={page.lecture_id} page={page.page}/>
  <ClassGuidanceGoals lecture={page.lecture_id} page={page.page}/>
  <details className="memorize-box"><summary>03 / 이 페이지의 암기 체크리스트</summary><ul>{atoms.map(a=><li key={a.atomic_item_id}>{a.text}</li>)}</ul><Link to={`/memory?lecture=${page.lecture_id}&page=${page.page}&mode=fill`}>핵심 키워드를 직접 입력하며 암기하기 →</Link></details>
  <section><span className="eyebrow">04 / 페이지별 확인</span>{page.question_ids.length?<><button className="btn" onClick={()=>setShowQuestions(v=>!v)}>{showQuestions?'문제 접기':`이 페이지의 확인 문제 ${page.question_ids.length}개`}</button>{showQuestions&&page.question_ids.map(id=><Practice key={id} q={questionMap[id]}/>)}</>:<p>이 페이지는 세부 항목 회상 카드로 확인합니다. 별도의 검증 문항이 아직 연결되지 않은 페이지입니다. <Link to={`/memory?lecture=${page.lecture_id}&page=${page.page}&mode=atomic`}>세부 항목 순환 복습 →</Link></p>}</section>
  <SourceLink source={{lecture_id:page.lecture_id,source_pdf:page.source_pdf,source_page:page.page}}/>
  <button className={`btn ${state.completedPages.includes(id)?'completed':'primary'}`} onClick={()=>update(s=>({...s,completedPages:s.completedPages.includes(id)?s.completedPages.filter(x=>x!==id):[...s.completedPages,id]}))}>{state.completedPages.includes(id)?'페이지 학습 완료 · 취소':'이 페이지 학습 완료'}</button>
  <p className="muted">페이지 진도와 기존 개념 진도는 별도로 보관합니다. 페이지를 열기만 하면 완료되지 않습니다.</p>
 </article>
}
export function PageSearchResults({query}:{query:string}){
 const term=query.trim().toLocaleLowerCase();if(!term)return null;
 const pages=course.pages.filter(p=>p.atomic_item_ids.length&&[p.title,p.easy,...p.atomic_item_ids.map(id=>atomicMap[id].text),...course.learning_notes.filter(n=>n.sources.some(s=>s.lecture_id===p.lecture_id&&s.source_page===p.page)).flatMap(n=>n.goals)].join(' ').toLocaleLowerCase().includes(term));
 return <section className="card lecture-section"><h2>페이지 내용 검색 · {pages.length}개</h2><div className="concept-list">{pages.map(p=><Link key={`${p.lecture_id}:${p.page}`} to={`/classroom/${p.lecture_id}/${p.page}`}><span>{p.title}<small>{p.lecture_id} · PDF {p.page}p</small></span><span>→</span></Link>)}</div>{!pages.length&&<p>세부 항목에 일치하는 페이지가 없습니다.</p>}</section>
}
