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
// Patient feedback transcribed from the supplied onboarding screenshots.
export const patientFeedback = [
  {title:'Care that feels easier',quote:"This has been the easiest healthcare I've ever had and I've had therapists for 20+ years."},
  {title:'A provider who listens',quote:"My provider has been a godsend and changed my life for the better. She really listened to me and is consistently trying to understand more what’s going on and tries to help me through it."},
  {title:'Feeling heard, finding options',quote:"This is the first time where I feel like I was taken seriously by my provider and listened to. I was offered alternatives based on what can be done in my price range and cash pay services. I feel at ease here and I'm truly grateful."}
];
export const providers = [
  {id:'ifeoma',name:'Ifeoma Ochei',photo:'ifeoma',rating:'5.0',reviews:41,specialties:['Depression','Anxiety','Trauma','Mood Disorders','PTSD','ADHD'],insurance:['Aetna','Blue Cross Blue Shield','United Healthcare'],slots:[{id:'i1',date:'Wed, Sep 23',time:'8:00 AM',iso:'2026-09-23T08:00:00'},{id:'i2',date:'Wed, Sep 30',time:'12:00 PM',iso:'2026-09-30T12:00:00'}],bio:'I am a psychiatric nurse practitioner and former family nurse practitioner who now focuses on adult mental health, especially depression, anxiety, PTSD, trauma, ADHD, and mood changes.',needs:['existing','new','unsure']},
  {id:'cyndi',name:'Cyndi Truong',photo:'cyndi',rating:'4.8',reviews:37,specialties:['Anxiety','Bipolar Disorder','Depression','Medication Management','Mood Disorders','PTSD','ADHD'],insurance:['Aetna','Blue Cross Blue Shield','Cigna','Oscar Health'],slots:[{id:'c1',date:'Fri, Sep 25',time:'11:00 AM',iso:'2026-09-25T11:00:00'},{id:'c2',date:'Fri, Sep 25',time:'11:30 AM',iso:'2026-09-25T11:30:00'},{id:'c3',date:'Fri, Oct 2',time:'6:00 AM',iso:'2026-10-02T06:00:00'}],bio:"My approach to care is grounded in honest, nonjudgmental communication—because I know how vulnerable it can feel to talk about what's going on beneath the surface.",needs:['existing','new','unsure']},
  {id:'meshel',name:'Meshel Stewart',photo:'meshel',rating:'4.8',reviews:39,specialties:['Anxiety','Bipolar Disorder','Depression','Medication Management','Mood Disorders','OCD','PTSD','Trauma',"Women's Issues",'ADHD'],insurance:['Aetna','Cigna','United Healthcare'],slots:[{id:'m1',date:'Wed, Sep 23',time:'4:30 PM',iso:'2026-09-23T16:30:00'},{id:'m2',date:'Thu, Sep 24',time:'10:00 AM',iso:'2026-09-24T10:00:00'}],bio:'Meshel Stewart is a board-certified psychiatric mental health nurse practitioner who provides compassionate, patient-centered care for adults experiencing anxiety, depression, ADHD, trauma, insomnia, bipolar disorder.',needs:['existing','new','unsure']}
];
// Additional profiles make narrowing the available care visible throughout onboarding.
const additionalProfiles = [
  ['maya','Maya Chen',['Anxiety','Depression','ADHD'],['Aetna','Blue Cross Blue Shield'],['new','unsure']],
  ['jordan','Jordan Ellis',['Anxiety','Depression','PTSD'],['Cigna','United Healthcare'],['existing','unsure']],
  ['sofia','Sofia Ramirez',['ADHD','Anxiety','Bipolar Disorder'],['Aetna','Oscar Health'],['existing']],
  ['daniel','Daniel Brooks',['Depression','PTSD','Bipolar Disorder'],['Blue Cross Blue Shield','United Healthcare'],['new','unsure']],
  ['priya','Priya Shah',['ADHD','Depression','Anxiety'],['Cigna','Oscar Health'],['new']],
  ['olivia','Olivia Morgan',['Anxiety','PTSD'],['Aetna','Blue Cross Blue Shield','Oscar Health'],['existing','unsure']],
  ['marcus','Marcus Reed',['Depression','Bipolar Disorder','ADHD'],['United Healthcare','Cigna'],['existing','new']],
  ['emily','Emily Park',['Anxiety','Depression'],['Aetna','Cigna','Blue Cross Blue Shield'],['new','unsure']],
  ['alex','Alex Rivera',['ADHD','Anxiety','PTSD'],['Aetna','United Healthcare','Oscar Health'],['existing','new']]
];
providers.push(...additionalProfiles.map(([id,name,specialties,insurance,needs],i)=>({
  id,name,photo:id,avatar:`assets/provider-${id}.svg`,rating:'4.9',reviews:28+i*3,
  specialties,insurance,needs,
  slots:[
    {id:`${id}-1`,date:'Thu, Sep 24',time:`${9+i%3}:00 AM`,iso:`2026-09-24T${String(9+i%3).padStart(2,'0')}:00:00`},
    {id:`${id}-2`,date:'Fri, Sep 25',time:'2:00 PM',iso:'2026-09-25T14:00:00'}
  ],
  bio:`${name} offers a supportive, collaborative approach to care, with a focus on ${specialties.join(', ')}.`
})));

export function getMatches({conditions=[],insurance='',needs='',eligible=true}={}) {
  if (!eligible) return [];
  const selected = conditions.filter(c => !["I'm not sure",'Other'].includes(c));
  return providers.filter(p => (!insurance || insurance === 'No Insurance' || p.insurance.includes(insurance)) && selected.every(c=>p.specialties.includes(c)) && (!needs || p.needs.includes(needs)))
    .sort((a,b)=> needs === 'existing' ? Number(b.specialties.includes('Medication Management'))-Number(a.specialties.includes('Medication Management')) || a.slots[0].iso.localeCompare(b.slots[0].iso) : a.slots[0].iso.localeCompare(b.slots[0].iso));
}
export function validSelection(state, providerId, slotId) { return getMatches(state).some(p=>p.id===providerId && p.slots.some(s=>s.id===slotId)); }

export function canSelectAppointment(state) {
  return ['match','patient','payment'].includes(state.phase) && !state.booked && state.texas && state.eligible &&
    fitQuestions.every((q,i)=>(i===0 && state.phase==='match' && ['pending','found','not-found'].includes(state.lookupStatus)) || state.answers?.[i]===q.eligible) &&
    state.conditions.length>0 && (Boolean(state.insurance) || (state.phase==='match' && ['pending','found','not-found'].includes(state.lookupStatus))) && Boolean(state.needs);
}

// Deterministic local scenarios; no identity or insurance data leaves the browser.
export function canLookupInsurance(state){return state.texas && state.eligible && state.conditions.length>0 && Boolean(state.needs) && [1,2,4].every(i=>state.answers[i]===fitQuestions[i].eligible);}
export function isAdult(dob,today=new Date()){const date=new Date(dob+'T00:00:00');if(!Number.isFinite(date.getTime()))return false;const cutoff=new Date(today);cutoff.setFullYear(cutoff.getFullYear()-18);return date<=cutoff;}
export function coverageEstimate(state){
 if(state.coverage==='found'&&state.insurance==='Aetna')return {title:'$25 estimated copay',description:'Your estimated share for this 60-minute initial visit is $25.',caveat:'Based on your current benefits and selected in-network provider. This is an estimate, not a guarantee; final responsibility is determined when insurance processes your claim.'};
 if(state.insurance==='No Insurance')return {title:'$250 initial visit',description:'Cash pay: $250 for your initial visit and $150 for follow-ups.',caveat:'You have selected care without insurance.'};
 return {title:'Your cost estimate is pending',description:state.coverage==='benefits-pending'?'We found your insurance, but need to confirm the benefits for this visit.':'Verify your insurance after booking to receive a personalized estimate before your visit.',caveat:'Most insured patients pay $0–$40 per session, but this is not your personal estimate. Deductibles and coinsurance may apply. You are responsible for amounts not covered by insurance.'};
}
