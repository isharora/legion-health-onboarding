export const fitQuestions = [
  {title:'Do you currently have Medicaid or Medicare as your insurance?', body:"We're unable to serve patients who have Medicaid or Medicare, even on a cash-pay basis. If you have either of these, select 'Yes' and we'll help you find providers who accept your coverage.", eligible:false},
  {title:'Are you currently at risk of harming yourself or others?', body:"If you're currently thinking about harming yourself or others, please select 'Yes' and we'll connect you immediately to crisis resources for urgent support.", eligible:false},
  {title:'Have you been hospitalized for mental health or substance use in the past year?', body:"If you've had an inpatient stay in the last year, we may not be the ideal intensity of care. Let's find a program better equipped to support you.", eligible:false},
  {title:'Are you 18 years or older?', body:"Our services are designed for adults 18 and older. If you're under 18 or seeking care for a minor, we'll point you to age-appropriate resources.", eligible:true},
  {title:'Are you looking for virtual care only?', body:"All sessions happen conveniently online—no travel required. We're here to make medication management accessible and comfortable for you.", eligible:true}
];
export const conditionOptions = [
  ['ADHD','◎','💊 We prescribe ADHD medications including adderall, with stringent clinical standards<br>✅ We offer free, FDA-approved online ADHD testing (QbCheck®)'],
  ['Depression','☁',"🤝 You're not alone, we've helped thousands of patients get relief"],
  ['Anxiety','!','💊 We do not prescribe benzodiazepines over 1mg a day'],
  ['Bipolar Disorder','ϟ',''],['PTSD','◇',''],["I'm not sure",'?',''],['Other','•••','']
];
export const insurers = ['Aetna','Blue Cross Blue Shield','Cigna','United Healthcare','Oscar Health','Other Insurance','No Insurance'];
export const providers = [
  {id:'ifeoma',name:'Ifeoma Ochei',photo:'ifeoma',rating:'5.0',reviews:41,specialties:['Depression','Anxiety','Trauma','Mood Disorders','PTSD','ADHD'],insurance:['Aetna','Blue Cross Blue Shield','United Healthcare'],slots:[{id:'i1',date:'Wed, Sep 23',time:'8:00 AM',iso:'2026-09-23T08:00:00'},{id:'i2',date:'Wed, Sep 30',time:'12:00 PM',iso:'2026-09-30T12:00:00'}],bio:'I am a psychiatric nurse practitioner and former family nurse practitioner who now focuses on adult mental health, especially depression, anxiety, PTSD, trauma, ADHD, and mood changes.',needs:['existing','new','unsure']},
  {id:'cyndi',name:'Cyndi Truong',photo:'cyndi',rating:'4.8',reviews:37,specialties:['Anxiety','Bipolar Disorder','Depression','Medication Management','Mood Disorders','PTSD','ADHD'],insurance:['Aetna','Blue Cross Blue Shield','Cigna','Oscar Health'],slots:[{id:'c1',date:'Fri, Sep 25',time:'11:00 AM',iso:'2026-09-25T11:00:00'},{id:'c2',date:'Fri, Sep 25',time:'11:30 AM',iso:'2026-09-25T11:30:00'},{id:'c3',date:'Fri, Oct 2',time:'6:00 AM',iso:'2026-10-02T06:00:00'}],bio:"My approach to care is grounded in honest, nonjudgmental communication—because I know how vulnerable it can feel to talk about what's going on beneath the surface.",needs:['existing','new','unsure']},
  {id:'meshel',name:'Meshel Stewart',photo:'meshel',rating:'4.8',reviews:39,specialties:['Anxiety','Bipolar Disorder','Depression','Medication Management','Mood Disorders','OCD','PTSD','Trauma',"Women's Issues",'ADHD'],insurance:['Aetna','Cigna','United Healthcare'],slots:[{id:'m1',date:'Wed, Sep 23',time:'4:30 PM',iso:'2026-09-23T16:30:00'},{id:'m2',date:'Thu, Sep 24',time:'10:00 AM',iso:'2026-09-24T10:00:00'}],bio:'Meshel Stewart is a board-certified psychiatric mental health nurse practitioner who provides compassionate, patient-centered care for adults experiencing anxiety, depression, ADHD, trauma, insomnia, bipolar disorder.',needs:['existing','new','unsure']}
];
export function getMatches({conditions=[],insurance='',needs='',eligible=true}={}) {
  if (!eligible) return [];
  const selected = conditions.filter(c => !["I'm not sure",'Other'].includes(c));
  return providers.filter(p => (!insurance || insurance === 'No Insurance' || p.insurance.includes(insurance)) && selected.every(c=>p.specialties.includes(c)))
    .sort((a,b)=> needs === 'existing' ? Number(b.specialties.includes('Medication Management'))-Number(a.specialties.includes('Medication Management')) || a.slots[0].iso.localeCompare(b.slots[0].iso) : a.slots[0].iso.localeCompare(b.slots[0].iso));
}
export function validSelection(state, providerId, slotId) { return getMatches(state).some(p=>p.id===providerId && p.slots.some(s=>s.id===slotId)); }
