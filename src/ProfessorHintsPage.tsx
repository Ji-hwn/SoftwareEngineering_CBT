import {Link} from 'react-router-dom';
import {BookOpen,ClipboardCheck,Info,ArrowRight} from 'lucide-react';
import {course,useStore} from './store';
import {professorHints,hintLabel,type HintTier} from './professorHints';

const groups:{tier:HintTier;heading:string}[]=[
 {tier:'certain-remark',heading:'교수님이 100% 출제를 언급한 항목'},
 {tier:'very-high',heading:'매우 중요'},
 {tier:'high',heading:'중요 · 집중 학습'},
 {tier:'excluded',heading:'이번 중간고사 출제 제외'},
];
export function ProfessorHints(){
 const {state}=useStore();
 return <div className="hints-page">
  <div className="page-heading"><div><div className="eyebrow">PROFESSOR'S CLASS HINTS / MIDTERM 2026</div><h1>교수님 시험 힌트</h1><p>수업 중 전달된 힌트를 강의·암기·CBT와 연결했습니다. 교수님 언급과 PDF의 빨간 글씨는 별도 기준입니다.</p></div></div>
  <div className="card hints-notice"><Info size={20}/><div><b>힌트의 출처와 범위</b><p>사용자가 기록한 교수님의 수업 중 발언입니다. PDF의 빨간 글씨 강조와 구분해 관리합니다. “100%”는 교수님 발언을 적은 것이며 실제 출제를 독립적으로 보장하는 의미는 아닙니다. 12가지 XP 실천사항은 강의에 남기되 중간고사 CBT에서는 제외합니다.</p></div></div>
  <div className="hint-summary card"><span>학습 힌트 <strong>{professorHints.filter(h=>h.tier!=='excluded').length}개</strong></span><span>제외 영역 <strong>1개</strong></span><span>강의 원문 <strong>유지</strong></span></div>
  {groups.map(({tier,heading})=><section key={tier} className="hint-section"><h2>{heading}</h2><div className="hint-grid">{professorHints.filter(h=>h.tier===tier).map(h=>{
    const all=h.conceptIds.flatMap(id=>course.questions.filter(q=>q.concept_id===id&&!q.retired));
    const available=all.filter(q=>q.verified&&!q.retired&&!professorHints.some(t=>t.tier==='excluded'&&t.conceptIds.includes(q.concept_id))).length;
    const completed=h.conceptIds.filter(id=>state.completed.includes(id)).length;
    const target=h.pages[0];
    return <article key={h.id} className={`card hint-card hint-${h.tier}`}><div className="tags"><span className="hint-tag">{hintLabel[h.tier]}</span><span>개념 {completed}/{h.conceptIds.length} 완료</span></div><h3>{h.title}</h3><p>{h.note}</p><div className="hint-meta">관련 페이지 {h.pages.length}곳 · {tier==='excluded'?'CBT 제외':`연결 문제 ${available}개`}</div><div className="hint-actions"><Link className="btn" to={`/classroom/${target.lectureId}/${target.page}`}><BookOpen size={16}/> 강의 보기</Link>{tier!=='excluded'&&<Link className="btn primary" to={`/bank?hint=${h.id}`}><ClipboardCheck size={16}/> 문제 연습 <ArrowRight size={15}/></Link>}</div></article>;
  })}</div></section>)}
  <div className="card hint-bottom"><h3>학습 방법</h3><p>우선 3R과 매우 중요한 개념을 정확히 암기한 뒤, 중요 개념의 비교·도식 문제로 확장하세요. 빨간색 이외의 일반 강의 내용도 원래 학습 범위에서 제거하지 않았습니다.</p><Link to="/exam?mode=hint-focus" className="btn primary">교수님 힌트 집중 CBT 시작 <ArrowRight size={16}/></Link></div>
 </div>
}
