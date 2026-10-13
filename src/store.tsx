import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {Course,StudyState} from './types';
import raw from './data/course.json';
import {KEY,loadState,finishExam,remaining} from './core';
export const course=raw as unknown as Course;
export const conceptMap=Object.fromEntries(course.concepts.map(c=>[c.concept_id,c]));
export const questionMap=Object.fromEntries(course.questions.map(q=>[q.question_id,q]));
export type Setter=(fn:(s:StudyState)=>StudyState)=>void;
const Ctx=createContext<{state:StudyState;update:Setter;pdfs:Record<string,string>;setPdfs:(v:Record<string,string>)=>void;notice:string;setNotice:(v:string)=>void}|null>(null);
export function Store({children}:{children:ReactNode}){
 const [state,setState]=useState(loadState);const [pdfs,setPdfs]=useState<Record<string,string>>({});const [notice,setNotice]=useState('');
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{setNotice('브라우저 저장 공간이 부족합니다. 기록을 JSON으로 백업하세요.')}document.documentElement.dataset.theme=state.settings.theme;document.documentElement.style.setProperty('--reading-size',state.settings.font+'px')},[state]);
 useEffect(()=>{if(!state.active)return;const timer=setInterval(()=>setState(s=>s.active&&remaining(s.active)===0?finishExam(s,course.questions):s),500);return()=>clearInterval(timer)},[!!state.active]);
 return <Ctx.Provider value={{state,update:setState,pdfs,setPdfs,notice,setNotice}}>{children}{notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="알림 닫기">×</button></div>}</Ctx.Provider>
}
export const useStore=()=>{const v=useContext(Ctx);if(!v)throw Error('Store missing');return v};
