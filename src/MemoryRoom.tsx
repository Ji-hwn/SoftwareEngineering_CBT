import {useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {course,questionMap,useStore} from './store';
import {gradeKeywords,reviewCard,reviewConcept} from './core';
import {SourceLink} from './Question';
import type {MemoryCard} from './types';

export function MemoryRoom(){
 const {state,update}=useStore();const [params]=useSearchParams();
 const [mode,setMode]=useState(params.get('mode')??'term');const [lecture,setLecture]=useState(params.get('lecture')??'all');
 const [filter,setFilter]=useState('all');const [page,setPage]=useState(params.get('page')??'all');
 const [index,setIndex]=useState(0);const [shown,setShown]=useState(false);const [answers,setAnswers]=useState<string[]>([]);const [result,setResult]=useState<boolean[]|null>(null);
 const wrongConcepts=new Set(Object.keys(state.wrong).map(id=>questionMap[id]?.concept_id));
 const reset=()=>{setIndex(0);setShown(false);setAnswers([]);setResult(null)};
 const legacy:MemoryCard[]=course.concepts.map(c=>({card_id:c.concept_id,concept_id:c.concept_id,title:c.name,lecture_id:c.lecture_id,source_pdf:c.source_pdf,source_page:c.source_page,mode:'term',prompt:mode==='definition'?c.definition:c.name,answer:mode==='definition'?c.name:c.memorize.join('\n'),answer_groups:mode==='definition'?[[c.name,...(questionMap[`q-${c.concept_id}-1`]?.accepted_answers??[])]]:[],atomic_item_ids:[],importance:c.importance,explanation:c.easy}));
 const candidates=['term','definition'].includes(mode)?legacy:course.memory_cards.filter(c=>mode==='atomic'?c.mode==='atomic':mode==='fill'?c.mode!=='atomic':c.mode===mode);
 const cards=candidates.filter(c=>(lecture==='all'||c.lecture_id===lecture)&&(page==='all'||c.source_page===Number(page))&&(filter==='all'||filter==='Critical'&&c.importance==='Critical'||filter==='Standard'&&c.importance!=='Critical'||filter==='due'&&(state.cardReviews[c.card_id]?.due??state.reviews[c.concept_id]?.due??Infinity)<=Date.now()||filter==='unknown'&&(state.cardReviews[c.card_id]?.unknown??state.reviews[c.concept_id]?.unknown)||filter==='wrong'&&wrongConcepts.has(c.concept_id)||filter==='bookmarks'&&state.bookmarks.includes(c.concept_id)));
 const card=cards[index%Math.max(cards.length,1)];
 const next=(n=1)=>{setIndex(i=>Math.max(0,i+n));setShown(false);setAnswers([]);setResult(null)};
 const rate=(known:boolean)=>{if(!card)return;update(s=>['term','definition'].includes(mode)?reviewConcept(s,card.concept_id,known):reviewCard(s,card.card_id,known));next()};
 const check=()=>{const marks=gradeKeywords(card.answer_groups,answers);setResult(marks);setShown(true);update(s=>({...reviewCard(s,card.card_id,marks.every(Boolean)),memoryAttempts:[...s.memoryAttempts,{card_id:card.card_id,answers:[...answers],correct:marks,at:Date.now()}]}))};
 return <><div className="page-heading"><div><div className="eyebrow">MEMORY / ACTIVE RECALL</div><h1>기억하는 힘을 기르세요</h1><p>핵심 키워드 입력과 전체 세부 항목 순환. 기존 개념 복습 기록은 그대로 유지합니다.</p></div></div>
 <div className="filterbar"><select aria-label="암기 범위" value={lecture} onChange={e=>{setLecture(e.target.value);setPage('all');reset()}}><option value="all">전체 Lecture</option>{course.lectures.map(l=><option key={l.lecture_id} value={l.lecture_id}>{l.title}</option>)}</select>
 <select aria-label="암기 페이지" value={page} onChange={e=>{setPage(e.target.value);reset()}}><option value="all">전체 페이지</option>{course.pages.filter(p=>p.lecture_id===lecture&&p.atomic_item_ids.length).map(p=><option key={p.page} value={p.page}>{p.page}p · {p.title}</option>)}</select>
 <select aria-label="암기 필터" value={filter} onChange={e=>{setFilter(e.target.value);reset()}}>{[['all','전체 범위 균형 순환'],['Critical','직접 강조 집중'],['Standard','일반·중요 관련 집중'],['wrong','취약 개념 집중'],['due','오늘 복습 예정'],['unknown','모르는 항목'],['bookmarks','북마크']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
 <select aria-label="암기 유형" value={mode} onChange={e=>{setMode(e.target.value);reset()}}>{[['term','용어 → 정의'],['definition','정의 → 용어 입력'],['fill','핵심 빈칸 입력'],['categories','종류 암기 입력'],['order','순서 암기 입력'],['comparison','비교 암기 입력'],['formula','공식 암기 입력'],['uml','UML 관계 입력'],['atomic','전체 세부 항목 회상']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
 {card?<div className="memory-wrap"><div className="memory-progress"><span>카드 {index%cards.length+1} / {cards.length}</span><span>복습: 당일 → 1일 → 3일 → 7일</span></div><article className="flashcard card">
 <div className="tags"><span>{card.importance}</span><span>PDF {card.source_page}p</span></div><h2>{card.title}</h2>
 {card.verification_status==='needs-review'&&<p className="review-warning">원본 표현 검수 필요. 이 항목은 자동 정답 판별을 하지 않습니다.</p>}
 {!shown&&<p className="memory-prompt">{card.prompt}</p>}
 {!!card.answer_groups.length&&!shown&&<form onSubmit={e=>{e.preventDefault();check()}}><div className="keyword-inputs">{card.answer_groups.map((_,i)=><label key={i}>빈칸 {i+1}<input aria-label={`빈칸 ${i+1}`} autoComplete="off" value={answers[i]??''} onChange={e=>setAnswers(a=>{const copy=[...a];copy[i]=e.target.value;return copy})}/></label>)}</div><button className="btn primary" disabled={card.answer_groups.some((_,i)=>!answers[i]?.trim())}>입력 답안 채점</button></form>}
 {!shown&&<button className="btn" onClick={()=>setShown(true)}>정답 확인</button>}
 {shown&&<>{result&&<div className="keyword-results" role="status"><strong>{result.filter(Boolean).length}/{result.length}개 키워드 정답</strong>{result.map((ok,i)=><p key={i} className={ok?'correct':'incorrect'}>{ok?'✓':'✗'} 빈칸 {i+1}: {answers[i]||'미응답'}{!ok&&` → ${card.answer_groups[i].join(' / ')}`}</p>)}</div>}<p className="memory-answer">{card.answer}</p><p>자체 제작 학습 설명: {card.explanation}</p><SourceLink source={card}/><Link to={`/classroom/${card.lecture_id}/${card.source_page}`}>관련 강의 복습 →</Link><div className="actions"><button className="btn" onClick={()=>rate(false)}>아직 모르겠어요 · 오늘 다시</button><button className="btn primary" onClick={()=>rate(true)}>기억했어요</button><button className="btn" onClick={()=>{setShown(false);setResult(null);setAnswers([])}}>같은 카드 다시 입력</button></div></>}
 </article><div className="memory-navigation"><button className="btn" onClick={()=>next(-1)}>← 이전</button><span>{(()=>{const r=state.cardReviews[card.card_id]??state.reviews[card.concept_id];return r?`다음 복습: ${new Date(r.due).toLocaleDateString('ko-KR')}`:'새 복습 기록'})()}</span><button className="btn" onClick={()=>next()}>건너뛰기 →</button></div></div>:<div className="card empty"><p>선택 조건의 카드가 없습니다. 다른 유형이나 범위를 선택하세요.</p></div>}
 </>
}
