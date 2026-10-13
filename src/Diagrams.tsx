import {useId} from 'react';
export function Diagram({kind}:{kind:string}){
 const uid=useId().replace(/:/g,'');const arrow=uid+'a',hollow=uid+'h',open=uid+'o';
 const text=(x:number,y:number,t:string)=> <text x={x} y={y} textAnchor="middle" key={t+x+y}>{t}</text>;
 const box=(x:number,y:number,t:string,w=130)=> <g key={t+x}><rect x={x} y={y} width={w} height={45} rx={5}/>{text(x+w/2,y+28,t)}</g>;
 const line=(x1:number,y1:number,x2:number,y2:number,dashed=false,marker=arrow)=> <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dashed?'6 4':undefined} markerEnd={marker?`url(#${marker})`:undefined}/>;
 let content;
 if(['generalization','realization','dependency','association','aggregation','composition'].includes(kind)){
 const diamond=kind==='aggregation'||kind==='composition';const triangle=kind==='generalization'||kind==='realization';
 content=<>{box(30,105,diamond?'전체':triangle?'구체적 클래스':'객체 A')}{box(420,105,diamond?'부분':kind==='realization'?'인터페이스':kind==='generalization'?'일반 클래스':'객체 B')}{diamond?<><polygon points="160,127 174,117 188,127 174,137" fill={kind==='composition'?'currentColor':'var(--card)'}/>{line(188,127,420,127,false,'')}</>:line(160,127,420,127,['realization','dependency'].includes(kind),triangle?hollow:kind==='dependency'?open:'')}</>;
 }else if(kind==='include'||kind==='extend'){
 content=<><ellipse cx="140" cy="127" rx="95" ry="40"/><ellipse cx="460" cy="127" rx="95" ry="40"/>{text(140,133,kind==='include'?'등록 기능':'메일 확인')}{text(460,133,kind==='include'?'성적 조회':'검색')}{line(235,127,365,127,true,open)}{text(300,110,kind==='include'?'«include»':'«extend»')}</>;
 }else if(kind==='cpm'){
 content=<>{box(10,25,'A · 15일',105)}{box(10,175,'B · 10일',105)}{box(200,25,'C · 10일',105)}{box(200,175,'D · 25일',105)}{box(370,25,'E · 15일',105)}{box(490,120,'완료',90)}{line(115,47,200,47)}{line(115,197,200,60)}{line(115,197,200,197)}{line(305,47,370,47)}{line(475,47,535,120)}{line(305,197,490,150)}</>;
 }else if(kind==='class'){
 content=<><rect x="195" y="25" width="210" height="205" rx="4"/>{text(300,55,'회원')}{line(195,70,405,70,false,'')}{text(300,105,'- 회원번호: String')}{text(300,135,'- 이름: String')}{line(195,155,405,155,false,'')}{text(300,190,'+ 주문하기(): void')}</>;
 }else if(kind==='sequence'){
 content=<>{box(45,10,'고객')}{box(235,10,'주문시스템')}{box(425,10,'결제시스템')}{[110,300,490].map(x=><line key={x} x1={x} y1="55" x2={x} y2="245" strokeDasharray="5 5"/>)}{line(110,90,300,90)}{text(205,80,'1. 주문 요청')}{line(300,140,490,140)}{text(395,130,'2. 결제 요청')}{line(490,205,300,205,true,open)}{text(395,195,'3. 결과 반환')}</>;
 }else if(kind==='usecase'){
 content=<><rect x="200" y="10" width="350" height="230" rx="4"/>{text(375,38,'쇼핑몰 시스템')}<circle cx="75" cy="95" r="15"/><path d="M75 110v45 M40 130h70 M75 155l-30 40 M75 155l30 40"/>{text(75,220,'고객')}<ellipse cx="370" cy="105" rx="100" ry="35"/><ellipse cx="370" cy="195" rx="100" ry="30"/>{text(370,111,'상품 검색')}{text(370,201,'주문하기')}{line(110,130,270,105,false,'')}{line(110,130,270,195,false,'')}</>;
 }else if(kind==='state'){
 content=<><circle cx="25" cy="125" r="9" fill="currentColor"/>{box(70,100,'신청 가능')}{box(260,100,'신청 중')}{box(450,100,'신청 확인')}{line(35,125,70,125)}{line(200,125,260,125)}{line(390,125,450,125)}{text(230,85,'과목 선택')}{text(420,85,'화면 출력')}</>;
 }else if(kind==='gantt'){
 content=<>{[0,1,2,3,4,5].map(i=><g key={i}><text x="10" y={40+i*34}>{['학적부','학적 변동','교과','수업','수강','성적'][i]}</text><rect className="bar" x={100+[0,0,2,5,6,9][i]*36} y={23+i*34} width={[2,1,3,2,3,3][i]*36} height="18"/></g>)}</>;
 }else if(kind==='v-model'){
 content=<>{box(15,15,'요구분석')}{box(75,90,'아키텍처 설계')}{box(140,165,'모듈 설계')}{box(430,15,'시스템 테스트')}{box(370,90,'통합 테스트')}{box(310,165,'단위 테스트')}{line(145,37,430,37,true,open)}{line(205,112,370,112,true,open)}{line(270,187,310,187,true,open)}{text(300,247,'구현 → 테스트 → 인수 테스트')}</>;
 }else if(kind==='spiral'){
 content=<>{box(30,30,'계획·요구분석',180)}{box(380,30,'위험 분석',180)}{box(380,185,'개발',180)}{box(30,185,'사용자 평가',180)}{line(210,52,380,52)}{line(470,75,470,185)}{line(380,207,210,207)}{line(120,185,120,75)}</>;
 }else{
 const labels=['계획','요구사항 분석','설계','구현','테스트','유지보수'];
 content=<>{labels.map((t,i)=><g key={t}>{box(15+(i<3?i:5-i)*195,i<3?50:175,t,170)}</g>)}{line(185,72,210,72)}{line(380,72,405,72)}{line(490,95,490,175)}{line(405,197,380,197)}{line(210,197,185,197)}</>;
 }
 return <figure className="diagram"><svg viewBox="0 0 600 270" role="img" aria-label="원본 개념을 바탕으로 자체 제작한 도식"><defs><marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker><marker id={hollow} viewBox="0 0 14 14" refX="13" refY="7" markerWidth="13" markerHeight="13" orient="auto"><path d="M1 1L13 7L1 13Z" fill="var(--card)" stroke="currentColor"/></marker><marker id={open} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L10 5L0 10" fill="none" stroke="currentColor"/></marker></defs>{content}</svg><figcaption>자체 제작 도식 · 원본의 의미와 표기를 재구성</figcaption></figure>
}
