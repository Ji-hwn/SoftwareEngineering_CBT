import {Link} from 'react-router-dom';
import {BookOpen,ClipboardCheck,Info,ArrowRight} from 'lucide-react';
import {isRedEligible} from './examScope';
import {course,useStore} from './store';
import {professorHints,hintLabel,isMidtermExcluded,type HintTier} from './professorHints';

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
  <div className="hint-summary card"><span>학습 힌트 <strong>{professorHints.filter(h=>h.tier!=='excluded').length}개</strong></span><span>출제 제외 <strong>XP 실천사항 · 퀴즈 14의 28번</strong></span><span>실전 기준 <strong>직접 강조 100%</strong></span></div>
  <section className="card"><h2>최신 실전 범위 · 2026.10.15</h2><p><strong>검증된 직접 빨간 강조 100%</strong>만 실전에 출제합니다. 현재 {course.red_scope.evidence.length}개 한정 강조 항목 · 후보 {course.red_scope.approved_question_ids.length}문항입니다.</p><Link className="btn primary" to="/memory?set=verified-red-only">검증된 빨간 강조만 암기</Link><p>10월 14일의 전체 페이지 안내는 학습 이력으로 보존합니다. 최신 실전 규칙은 이보다 좁으며 Lecture 12 26~27쪽의 검은 내용은 일반 학습용입니다. Lecture 13·14의 빨간 정답 표시는 강조 범위의 근거가 아닙니다. 정보처리기사 기출에 등장했다는 수업 언급은 대학 중간고사 출제를 보장하지 않습니다.</p>
   {course.exam_scope.question_exclusions.map(rule=><p key={rule.reference_id}><strong>Lecture 14 원본 {rule.source_question_number}번 · 중간고사 제외</strong><br/>{rule.reason_label}. 직접 대응 문항 {rule.question_ids.join(', ')}만 CBT에서 차단하고 강의·암기·과거 기록은 보존합니다. CASE나 SADT 전체를 제외하지 않습니다.</p>)}
   <p>Lecture 14의 8번·35번은 <strong>시험 범위 안 · 정답 품질 검수 보류</strong>입니다. 원문 출제를 보류하고 명확한 근거의 별도 변형 문항은 유지합니다.</p><Link className="btn" to="/memory?set=professor-oct14-high">10월 14일 강조 개념 암기</Link>
  </section>
  {groups.map(({tier,heading})=><section key={tier} className="hint-section"><h2>{heading}</h2><div className="hint-grid">{professorHints.filter(h=>h.tier===tier).map(h=>{
    const all=h.conceptIds.flatMap(id=>course.questions.filter(q=>q.concept_id===id&&!q.retired));
    const available=all.filter(q=>q.verified&&q.quality_status!=='NEEDS_REVIEW'&&!isMidtermExcluded(q)).length;
    const redAvailable=all.filter(isRedEligible).length;
    const completed=h.conceptIds.filter(id=>state.completed.includes(id)).length;
    const target=h.pages[0];
    return <article key={h.id} className={`card hint-card hint-${h.tier}`}><div className="tags"><span className="hint-tag">{hintLabel[h.tier]}</span><span>개념 {completed}/{h.conceptIds.length} 완료</span></div><h3>{h.title}</h3><p>{h.note}</p><div className="hint-meta">관련 페이지 {h.pages.length}곳 · {tier==='excluded'?'CBT 제외':`일반 학습 ${available}개 · 실전 검증 ${redAvailable}개`}</div><div className="hint-actions"><Link className="btn" to={`/classroom/${target.lectureId}/${target.page}`}><BookOpen size={16}/> 강의 보기</Link>{tier!=='excluded'&&<Link className="btn primary" to={`/bank?hint=${h.id}`}><ClipboardCheck size={16}/> 문제 연습 <ArrowRight size={15}/></Link>}</div></article>;
  })}</div></section>)}
  <div className="card hint-bottom"><h3>학습 방법</h3><p>우선 3R과 매우 중요한 개념을 정확히 암기한 뒤, 중요 개념의 비교·도식 문제로 확장하세요. 빨간색 이외의 일반 강의 내용도 원래 학습 범위에서 제거하지 않았습니다.</p><Link to="/exam?mode=hint-focus" className="btn primary">교수님 힌트 집중 CBT 시작 <ArrowRight size={16}/></Link></div>
 </div>
}
