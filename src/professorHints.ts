/**
 * User-provided professor's spoken midterm hints (2026-10-13).
 * IMPORTANT: This is a separate layer from PDF red-text emphasis.
 * No claim is made that the professor's prediction guarantees exam questions.
 * No hints from the user's other subjects are included in this course.
 */
import type {Question} from './types';

export type HintTier='certain-remark'|'very-high'|'high'|'excluded';
export interface ProfessorHint {
  id:string;
  title:string;
  tier:HintTier;
  note:string;
  conceptIds:string[];
  pages:{lectureId:string;page:number}[];
}
export const professorHints:ProfessorHint[]=[
 {id:'three-r',title:'소프트웨어공학의 3R',tier:'certain-remark',note:'교수님이 “100% 나온다”고 언급. 정의·3R 구성 요소·필요성을 모두 암기.',conceptIds:['3r','reverse','reengineering','reuse'],pages:[{lectureId:'L01',page:5},{lectureId:'L01',page:6}]},
 {id:'reengineering-process',title:'재공학 과정 4단계',tier:'high',note:'분석 → 재구성 → 역공학 → 이관. 자료에 제시된 순서 그대로 암기.',conceptIds:['reengineering'],pages:[{lectureId:'L01',page:9}]},
 {id:'maintenance-cost',title:'유지보수 단계의 비용',tier:'very-high',note:'소프트웨어 개발 단계 중 가장 많은 비용이 소요된다는 교수님 강조 문장.',conceptIds:['maintenance'],pages:[{lectureId:'L01',page:18}]},
 {id:'agile',title:'애자일 방법론',tier:'high',note:'변화 대응·반복 개발의 핵심 특징과 관련 모델을 구별.',conceptIds:['agile','manifesto','agile-background'],pages:[{lectureId:'L01',page:30},{lectureId:'L01',page:31},{lectureId:'L10',page:2},{lectureId:'L10',page:4},{lectureId:'L10',page:5},{lectureId:'L10',page:6}]},
 {id:'cocomo-modes',title:'COCOMO 개발 유형',tier:'high',note:'조직형·반분리형·내장형: 프로젝트 특성, 예, 규모를 비교. 경계 수치는 원본 모호함 주의.',conceptIds:['cocomo'],pages:[{lectureId:'L03',page:10}]},
 {id:'uml-structure',title:'UML의 구조 및 관계',tier:'high',note:'UML 구성 요소와 일반화·연관·의존·실체화·집약·합성을 구분.',conceptIds:['uml','uml-things','generalization','association','dependency','realization','aggregation','composition'],pages:[{lectureId:'L08',page:12},{lectureId:'L08',page:14},{lectureId:'L08',page:16},{lectureId:'L08',page:17},{lectureId:'L08',page:19},{lectureId:'L08',page:21},{lectureId:'L08',page:23},{lectureId:'L08',page:24}]},
 {id:'uml-static-dynamic',title:'UML 정적·동적 다이어그램',tier:'high',note:'구조 다이어그램(정적)과 행위 다이어그램(동적)의 종류와 목적 암기.',conceptIds:['diagram-types','class-diagram','object-diagram','component-diagram','deployment-diagram','composite-diagram','package-diagram','usecase-diagram','activity-diagram','sequence-diagram','communication-diagram','state-diagram','timing-diagram','interaction-overview'],pages:[{lectureId:'L09',page:2},{lectureId:'L09',page:9},{lectureId:'L09-extra',page:3},{lectureId:'L09-extra',page:10}]},
 {id:'state-diagram',title:'상태 다이어그램',tier:'high',note:'상태·전이·이벤트 및 시작/종료 표기를 그림으로 해석.',conceptIds:['state-diagram'],pages:[{lectureId:'L09',page:15},{lectureId:'L09-extra',page:39},{lectureId:'L09-extra',page:40}]},
 {id:'usecase-diagram',title:'유스케이스 다이어그램',tier:'high',note:'사용자 관점의 기능, 시스템 경계, 액터와의 관계를 이해.',conceptIds:['usecase-diagram'],pages:[{lectureId:'L09',page:10},{lectureId:'L09-extra',page:23},{lectureId:'L09-extra',page:28}]},
 {id:'actors',title:'액터의 종류',tier:'very-high',note:'사용자·시스템·주요·보조·프록시 액터의 역할과 구분 기준을 암기.',conceptIds:['actors'],pages:[{lectureId:'L09-extra',page:24},{lectureId:'L09-extra',page:25},{lectureId:'L09-extra',page:26},{lectureId:'L09-extra',page:27}]},
 {id:'include',title:'유스케이스 포함 관계 (include)',tier:'high',note:'반드시 실행되는 기능과 <<include>> 화살표 방향을 확인.',conceptIds:['include'],pages:[{lectureId:'L09-extra',page:31}]},
 {id:'xp-values',title:'XP의 5가지 핵심 가치',tier:'very-high',note:'용기·존중·의사소통·피드백·단순성 모두 암기. 각 가치의 의미도 구분.',conceptIds:['xp','xp-values'],pages:[{lectureId:'L10',page:7},{lectureId:'L10',page:8}]},
 {id:'scrum',title:'애자일 Scrum',tier:'high',note:'제품/스프린트 백로그, 스프린트, 일일 스크럼, 역할을 구분.',conceptIds:['scrum','product-backlog','sprint-planning','sprint-backlog','daily-scrum','scrum-roles'],pages:[{lectureId:'L10',page:10},{lectureId:'L10',page:11},{lectureId:'L10',page:12}]},
 {id:'xp-practices',title:'XP의 12가지 실천사항',tier:'excluded',note:'교수님이 중간고사에 출제하지 않는다고 언급. 강의·암기에는 남겨 두고 중간고사 모의고사에서만 제외.',conceptIds:['xp-practices'],pages:[{lectureId:'L10',page:9}]},
];
const tiers:HintTier[]=['certain-remark','very-high','high','excluded'];
export const hintLabel:Record<HintTier,string>={'certain-remark':'100% 출제 언급','very-high':'매우 중요','high':'중요','excluded':'중간고사 제외'};
export const getConceptHints=(conceptId:string)=>professorHints.filter(h=>h.conceptIds.includes(conceptId));
export const getPageHints=(lectureId:string,page:number)=>professorHints.filter(h=>h.pages.some(p=>p.lectureId===lectureId&&p.page===page));
export const getStrongestHint=(conceptId:string)=>getConceptHints(conceptId).sort((a,b)=>tiers.indexOf(a.tier)-tiers.indexOf(b.tier))[0];
export const isMidtermExcluded=(q:Question)=>q.concept_id==='xp-practices';
export const isMidtermPriority=(q:Question)=>q.emphasis_related || getConceptHints(q.concept_id).some(h=>h.tier!=='excluded');
// Old exams retain their PDF-only priority; new snapshots freeze the combined rule.
export const recordedPriority=(q:Question)=>q.midterm_priority??q.emphasis_related;
export const hintScore=(q:Question)=>getStrongestHint(q.concept_id)?.tier==='certain-remark'?40:getStrongestHint(q.concept_id)?.tier==='very-high'?24:getStrongestHint(q.concept_id)?.tier==='high'?11:0;
