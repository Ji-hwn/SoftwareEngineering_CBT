import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'src/data/course.json').read_text(encoding='utf-8'))
# Independently implemented forward/backward pass against original task table L03 p23.
tasks={'A':(15,[]),'B':(10,[]),'C':(10,['A','B']),'D':(25,['B']),'E':(15,['C'])}
es={};ef={}
for t,(duration,pre) in tasks.items():
    es[t]=max([ef[p] for p in pre],default=0);ef[t]=es[t]+duration
project=max(ef.values());ls={};lf={}
for t in reversed(list(tasks)):
    successors=[k for k,(_,p) in tasks.items() if t in p]
    lf[t]=min([ls[k] for k in successors],default=project);ls[t]=lf[t]-tasks[t][0]
expected={('loc-estimate',2):(600+4*900+1200)/6,('mm',2):5*12+7*5,('mm',3):12000/600,('development-cost',2):100*300,('duration',2):(50000/500)/10,('duration',3):24/6,('productivity',2):50000/100,('pert',2):(2+4*5+8)/6,('cpm-example',2):project,('cpm-example',3):es['D'],('cpm-example',4):ls['D'],('cpm-example',5):ls['D']-es['D']}
checks=[]
for q in data['questions']:
    if q['question_type']!='calculation':continue
    qid=q['question_id'];key=(q['concept_id'],int(qid.split('-')[-1]));result=expected[key];answer=float(q['correct_answer'])
    checks.append({'question_id':qid,'computed':result,'answer':answer,'passed':abs(result-answer)<1e-9})
report={'all_passed':all(c['passed'] for c in checks),'checks':checks,'CPM':{'project_duration':project,'ES':es,'EF':ef,'LS':ls,'LF':lf,'slack':{t:ls[t]-es[t] for t in tasks},'critical_path':[t for t in tasks if ls[t]==es[t]]}}
(ROOT/'analysis').mkdir(parents=True,exist_ok=True)
(ROOT/'analysis/calculation-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'calculations':len(checks),'passed':report['all_passed'],'CPM_days':project}))
if not report['all_passed']:raise SystemExit(1)
