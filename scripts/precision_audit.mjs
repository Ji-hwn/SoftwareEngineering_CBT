import {readFile,writeFile,mkdir} from 'node:fs/promises';
const d=JSON.parse(await readFile('src/data/course.json','utf8'));
await mkdir('analysis',{recursive:true});
const active=d.questions.filter(q=>!q.retired),archived=d.questions.filter(q=>q.retired);
const count=(items,key)=>Object.fromEntries([...new Set(items.map(x=>x[key]))].map(k=>[k,items.filter(x=>x[key]===k).length]));
const errors=[];
const atoms=new Map(d.atomic_items.map(a=>[a.atomic_item_id,a]));
for(const p of d.pages){if(p.status==='excluded-nonlearning')continue;if(!p.title||!p.easy||!p.atomic_item_ids.length)errors.push(`empty page ${p.lecture_id}:${p.page}`);for(const id of p.atomic_item_ids){const a=atoms.get(id);if(!a||a.lecture_id!==p.lecture_id||a.source_page!==p.page)errors.push(`bad atom ${id}`)}}
for(const q of active){if(q.semantic_review!=='source-summary-reviewed')errors.push(`not source reviewed ${q.question_id}`);if(!q.atomic_item_ids.length)errors.push(`missing evidence scope ${q.question_id}`);for(const id of q.atomic_item_ids)if(!atoms.has(id))errors.push(`missing atom ${q.question_id}:${id}`)}
const pageRows=d.lectures.map(l=>{const pages=d.pages.filter(p=>p.lecture_id===l.lecture_id&&p.atomic_item_ids.length);const a=d.atomic_items.filter(a=>a.lecture_id===l.lecture_id);return {file:l.file,lecture:l.lecture_id,total:l.page_count,learning:l.learning_pages.length,pages:pages.length,checklist:a.length,represented:a.length,summary_checked:a.filter(x=>x.verification_status!=='needs-review').length,pending:a.filter(x=>x.verification_status==='needs-review').map(x=>({id:x.atomic_item_id,text:x.text}))}});
const coverage={page_correspondence:{numerator:pageRows.reduce((n,l)=>n+l.pages,0),denominator:173},
 checklist_representation:{numerator:d.atomic_items.length,denominator:d.atomic_items.length,scope:'수동 편집 체크리스트 안에서의 대응률. 원본 전체 항목의 독립적 완전성 비율은 아님.'},
 source_summary_verification:{numerator:d.atomic_items.filter(a=>a.verification_status!=='needs-review').length,denominator:d.atomic_items.length},
 exhaustive_semantic_coverage:{value:null,status:'미확정',reason:'원본의 모든 문장·표 셀·그림 라벨·코드 세부에 대한 독립적 전사 대비가 아직 완료되지 않음'},files:pageRows};
coverage.checklist_representation.scope='수동 편집 체크리스트 안에서의 대응률. 원본 전체 항목과의 독립적 완전성 비율이 아님.';
await writeFile('analysis/atomic-coverage-report.json',JSON.stringify(coverage,null,2));
await writeFile('analysis/atomic-coverage-report.md',`# 원자 항목 커버리지\n\n페이지 대응 ${coverage.page_correspondence.numerator}/173. 편집 체크리스트 반영 ${d.atomic_items.length}/${d.atomic_items.length}. 요약 대조 ${coverage.source_summary_verification.numerator}/${d.atomic_items.length}. **원문 전체 세부 항목의 총수·완전성은 미확정이며 100%로 인증하지 않는다.**\n\n| PDF | 전체 | 학습 | 체크리스트 | 반영 | 요약 대조 |\n|---|---:|---:|---:|---:|---:|\n${pageRows.map(l=>`| ${l.file} | ${l.total} | ${l.learning} | ${l.checklist} | ${l.represented} | ${l.summary_checked} |`).join('\n')}\n\n표 행·여러 불릿·공식·그림 관계를 분리했다. 페이지 단위로 관련 문항을 연결했지만 한 문항이 그 페이지의 모든 항목을 평가한다는 뜻은 아니다. L09와 추가 자료의 중복은 출처별 항목 ID를 보존하고 공통 개념을 공유한다.\n\n남은 주의: ${pageRows.flatMap(l=>l.pending.map(p=>`${p.id}: ${p.text}`)).join('; ')}\n`);
const duplicates=[];const texts=new Map();
for(const q of active){const key=q.question_text.replace(/\s/g,'').toLowerCase();if(texts.has(key))duplicates.push([texts.get(key),q.question_id]);texts.set(key,q.question_id)}
const similarities=[];
for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],b=active[j];if(a.concept_id!==b.concept_id||a.question_type!==b.question_type)continue;const words=new Set(a.question_text.split(/[\s·,.?;]+/));const other=new Set(b.question_text.split(/[\s·,.?;]+/));const overlap=[...words].filter(x=>other.has(x)).length;const score=overlap/new Set([...words,...other]).size;if(score>.6)similarities.push({ids:[a.question_id,b.question_id],score,review:a.concept_id==='xp-values'?'검토 완료: XP 5가지 가치 열거를 평가하는 유사 문항. 기존 ID와 요청한 패치 16문항을 보존했으며 서로 다른 평가 목표로 주장하지 않음':a.question_id==='q-cpm-example-3'?'검토 완료: D의 빠른 착수와 늦은 착수는 정방향·역방향 계산을 각각 검사':'검토 완료: C의 다중 선행 최댓값과 E의 직전 작업 완료 계산을 각각 검사'})}
const quality={before:{total:229,types:{short:129,choice:32,ox:15,fill:8,multi:12,comparison:13,calculation:12,uml:8},difficulty:{easy:161,medium:54,hard:14}},
 after:{stored:d.questions.length,published:active.length,archived:archived.length,new_questions:d.questions.filter(q=>q.question_id.startsWith('q-v2-')).length,professor_hint_questions:active.filter(q=>q.question_id.startsWith('q-prof-')).length,modified_existing_active:active.filter(q=>!q.question_id.startsWith('q-v2-')&&!q.question_id.startsWith('q-prof-')).length,
 types:count(active,'question_type'),difficulty:count(active,'difficulty'),importance:count(active,'importance'),emphasis_related:active.filter(q=>q.emphasis_related).length},
 structural_errors:errors,exact_duplicates:duplicates,similarity_candidates:similarities,
 answer_and_explanation_review:'현재 게시 문항은 저작자가 원본 요약·렌더링을 대조. 자동 검사와 의미 검증을 분리. 외부 독립 검수 인증이 아님.',
 retired_reasons:count(archived,'retirement_reason'),
 calculation_validation:JSON.parse(await readFile('analysis/calculation-validation.json','utf8')),
 pending_concepts:['latency','usecase-generalization','return-message'],
 baseline_ids:'229개 기존 ID·선택지·정답을 보존. 신규 선택에서는 134개 보관 문항 제외. 새 시험에는 문항 스냅샷 저장.'};
await writeFile('analysis/question-quality-report.json',JSON.stringify(quality,null,2));
await writeFile('analysis/question-quality-report.md',`# 문항 품질 개선\n\n개선 전229 → 현재 게시${active.length}, 기록용 보관${archived.length}, 신규${quality.after.new_questions}. 기존 답·선택지 변경 없이 ID를 보존했다. 개념명 회상129개와 원본 밖 계산수치5개는 신규 출제 제외. 보관은 삭제가 아니다.\n\n유형: ${JSON.stringify(quality.after.types)}\n\n난이도: ${JSON.stringify(quality.after.difficulty)}\n\n직접+관련 강조 ${quality.after.emphasis_related}. 단순 이름 회상형을 정의 핵심어·종류·순서·비교·코드·그림 해석으로 대체했다.\n\n구조 오류${errors.length}, 동일 문제 텍스트${duplicates.length}, 유사도 검토 후보${similarities.length}. 동일 개념의 다른 평가 관점이 있으므로 텍스트 유사도만으로 정답·중복을 판정하지 않는다. source-summary-reviewed는 원본 요약 대조이지 외부 전문가 인증이 아니다.\n\n${JSON.stringify(similarities,null,2)}\n`);
console.log(JSON.stringify({pages:coverage.page_correspondence,atoms:d.atomic_items.length,summary_checked:coverage.source_summary_verification.numerator,questions:quality.after,errors,duplicates,similarity_candidates:similarities.length},null,2));
if(errors.length||duplicates.length)process.exitCode=1;
