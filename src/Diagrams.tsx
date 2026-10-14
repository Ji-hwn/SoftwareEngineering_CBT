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
 }else if(kind==='dfd-symbols'){
 content=<><text x="300" y="22" textAnchor="middle">DFD · 자체 제작 기호표</text>{text(70,70,'A')}<circle cx="175" cy="65" r="25"/>{text(370,70,'B')}{line(430,65,550,65)}{text(70,170,'C')}{line(120,148,240,148,false,'')}{line(120,185,240,185,false,'')}{text(370,170,'D')}<rect x="430" y="140" width="125" height="50"/></>;
 }else if(kind==='erd-symbols'){
 content=<>{text(300,25,'ERD · 자체 제작 기호표')}{text(90,100,'A')}<rect x="30" y="130" width="120" height="55"/>{text(300,100,'B')}<circle cx="300" cy="157" r="35"/>{text(510,100,'C')}<polygon points="510,120 565,157 510,195 455,157"/></>;
 }else if(kind==='hipo-charts'){
 content=<>{text(95,25,'A')}{box(35,50,'전체 기능',120)}{box(10,140,'모듈 1',80)}{box(110,140,'모듈 2',80)}{line(95,95,50,140,false,'')}{line(95,95,150,140,false,'')}{text(300,25,'B')}{box(210,50,'입력',170)}{box(210,115,'처리 개요',170)}{box(210,180,'출력',170)}{line(295,95,295,115)}{line(295,160,295,180)}{text(505,25,'C')}{box(415,50,'입력 항목 상세',170)}{box(415,115,'기본 요소 상세',170)}{box(415,180,'출력 항목 상세',170)}{line(500,95,500,115)}{line(500,160,500,180)}</>;
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
 }else if(kind==='object'){
 content=<><rect x="20" y="65" width="210" height="90"/><text x="125" y="93" textAnchor="middle" textDecoration="underline">홍길동:고객</text>{text(125,135,'회원번호 = 1001')}<rect x="360" y="65" width="210" height="90"/><text x="465" y="93" textAnchor="middle" textDecoration="underline">주문001:주문</text>{line(230,110,360,110,false,'')}{text(300,205,'특정 시점의 객체·값·연결')}</>;
 }else if(kind==='component'){
 content=<>{box(30,95,'«component» 주문관리',240)}{box(340,95,'«component» 결제',230)}{line(270,117,340,117,true,open)}{text(300,195,'기능 부품 사이의 사용 연결')}</>;
 }else if(kind==='deployment'){
 content=<>{['PC','웹 서버','DB 서버'].map((t,i)=><g key={t}><path d={`M${20+i*195} 70l20 -20h130v100l-20 20H${20+i*195}Z`}/>{text(95+i*195,105,'«node» '+t)}</g>)}{line(170,110,215,110,false,'')}{line(365,110,410,110,false,'')}{text(300,220,'물리 노드와 실행 위치')}</>;
 }else if(kind==='package'){
 content=<>{[30,350].map((x,i)=><g key={x}><rect x={x} y="60" width="80" height="25"/><rect x={x} y="85" width="210" height="115"/>{text(x+105,145,i?'결제 관리':'주문 관리')}</g>)}{line(240,145,350,145,true,open)}</>;
 }else if(kind==='composite'){
 content=<><rect x="30" y="25" width="540" height="220"/>{text(300,55,'자동차 내부 구조')}{box(55,100,'엔진')}{box(235,100,'변속기')}{box(415,100,'브레이크')}{line(185,122,235,122,false,'')}{line(365,122,415,122,false,'')}</>;
 }else if(kind==='activity'){
 content=<><circle cx="20" cy="125" r="8" fill="currentColor"/>{box(55,102,'결제',100)}{line(30,125,55,125)}<polygon points="230,90 265,125 230,160 195,125"/>{line(155,125,195,125)}{box(355,40,'배송 요청',170)}{box(355,180,'결제 재시도',170)}{line(265,125,355,65)}{line(230,160,355,202)}{text(300,65,'[성공]')}{text(300,190,'[실패]')}</>;
 }else if(kind==='communication'){
 content=<>{box(25,20,'고객')}{box(350,20,'주문시스템',180)}{box(25,190,'DB')}{box(350,190,'결제시스템',180)}{line(155,42,350,42,false,open)}{text(250,25,'1: 주문 요청')}{line(440,65,440,190,false,open)}{text(505,135,'2: 결제 요청')}{line(350,212,155,212,false,open)}{text(245,195,'3: 정보 저장')}</>;
 }else if(kind==='timing'){
 content=<><path d="M90 30v205h455"/>{text(50,195,'대기')}{text(50,130,'처리')}{text(50,65,'완료')}<path d="M90 195h150v-65h150v-65h150" strokeWidth="3"/>{[0,2,4].map((t,i)=><g key={t}>{text(90+i*150,260,t+'초')}</g>)}{text(480,260,'이후')}{text(305,20,'원본 예시의 상태 유지 구간')}</>;
 }else if(kind==='interaction-overview'){
 content=<>{box(25,35,'로그인 상호작용',235)}{box(340,35,'주문 작성 상호작용',235)}{box(340,185,'결제 상호작용',235)}{box(25,185,'배송 상호작용',235)}{line(260,57,340,57)}{line(455,80,455,185)}{line(340,207,260,207)}</>;
 }else if(kind==='visibility'){
 content=<><rect x="160" y="25" width="280" height="210"/>{text(300,55,'접근 범위 예시')}{line(160,70,440,70,false,'')}{text(300,100,'- 속성: String')}{line(160,120,440,120,false,'')}{text(300,155,'# 내부지원(): void')}{text(300,195,'+ 공개기능(): void')}</>;
 }else if(kind==='lifeline'){
 content=<>{box(210,10,'객체명:클래스명',180)}<line x1="300" y1="55" x2="300" y2="235" strokeDasharray="5 5"/><rect x="292" y="85" width="16" height="65"/>{text(430,125,'활성 구간 (생략 가능)')}<path d="M290 225l20 20m0 -20l-20 20"/>{text(440,240,'X: 소멸')}</>;
 }else if(kind==='class-source'){
 content=<>{box(10,20,'«Interface» ToDo',180)}{box(360,20,'Person',180)}{box(360,190,'Student',180)}{box(10,190,'Car',180)}{line(360,42,190,42,true,hollow)}{line(450,190,450,65,false,hollow)}{line(360,60,190,205,true,open)}{text(250,250,'관계 일부를 설명용으로 재구성')}</>;
 }else if(kind==='gantt'){
 content=<>{[0,1,2,3,4,5].map(i=><g key={i}><text x="10" y={40+i*34}>{['학적부','학적 변동','교과','수업','수강','성적'][i]}</text><rect className="bar" x={100+[0,0,2,5,6,9][i]*36} y={23+i*34} width={[2,1,3,2,3,3][i]*36} height="18"/></g>)}</>;
 }else if(kind==='v-model'){
 content=<>{box(15,15,'요구분석')}{box(75,90,'아키텍처 설계')}{box(140,165,'모듈 설계')}{box(430,15,'시스템 테스트')}{box(370,90,'통합 테스트')}{box(310,165,'단위 테스트')}{line(145,37,430,37,true,open)}{line(205,112,370,112,true,open)}{line(270,187,310,187,true,open)}{text(300,247,'구현 → 테스트 → 인수 테스트')}</>;
 }else if(kind==='spiral'){
 content=<>{box(30,30,'계획·요구분석',180)}{box(380,30,'위험 분석',180)}{box(380,185,'개발',180)}{box(30,185,'사용자 평가',180)}{line(210,52,380,52)}{line(470,75,470,185)}{line(380,207,210,207)}{line(120,185,120,75)}</>;
 }else if(kind==='lifecycle'){
 const labels=['계획','요구사항 분석','설계','구현','테스트','유지보수'];
 content=<>{labels.map((t,i)=><g key={t}>{box(15+(i<3?i:5-i)*195,i<3?50:175,t,170)}</g>)}{line(185,72,210,72)}{line(380,72,405,72)}{line(490,95,490,175)}{line(405,197,380,197)}{line(210,197,185,197)}</>;
 }
 return <figure className="diagram"><svg viewBox="0 0 600 270" role="img" aria-label="원본 개념을 바탕으로 자체 제작한 도식"><defs><marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker><marker id={hollow} viewBox="0 0 14 14" refX="13" refY="7" markerWidth="13" markerHeight="13" orient="auto"><path d="M1 1L13 7L1 13Z" fill="var(--card)" stroke="currentColor"/></marker><marker id={open} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L10 5L0 10" fill="none" stroke="currentColor"/></marker></defs>{content}</svg><figcaption>자체 제작 도식 · 원본의 의미와 표기를 재구성</figcaption></figure>
}
