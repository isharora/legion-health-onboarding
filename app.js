import {createIntakeState,mountIntake,applyIntakeScenario} from './intake.js';
import { fitQuestions, conditionOptions, insurers, providers, getMatches, validSelection, canSelectAppointment, patientFeedback, canLookupInsurance, isAdult, coverageEstimate } from './data.js';

let scenario={texas:true,verified:'found',records:''};
const initial = () => ({phase:'conditions',intake:createIntakeState(),coverage:'manual',lookupStatus:'idle',locationConfirmed:false,fit:0,answers:[],texas:scenario.texas,eligible:true,conditions:['Anxiety'],insurance:'',needs:'',providerId:'',slotId:'',patient:{first:'Ishita',last:'Testing',email:'ish.g.arora@gmail.com',phone:'(408) 440-6539',dob:'1992-12-21',referral:'Google, Bing, or other search engine'},checks:{terms:true,treatment:true,recording:true},tasks:{},booked:false});
let state = initial();
let lookupTimer;
const flow = document.getElementById('flow');
const pane = document.getElementById('providers');
const dialog = document.getElementById('info-dialog');
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safety = `<div class="safety"><span class="info-icon" aria-hidden="true">ⓘ</span><div><h3>Your Safety &amp; Care Come First</h3><p>If any of the above don't apply to you, it doesn't mean you don't deserve care, it means you deserve the <strong>right</strong> kind of care. We'll provide you with resources better suited to your current needs.</p></div></div>`;
const privacy = `<p class="confidential">Your responses help us ensure you receive appropriate care. All information is confidential.</p>`;
const steps = ['Your care','Choose appointment','Your details','Confirm booking'];
const selectedProvider = () => providers.find(p=>p.id===state.providerId);
const selectedSlot = () => selectedProvider()?.slots.find(s=>s.id===state.slotId);

function openDialog(title,body) { document.getElementById('dialog-title').textContent=title; document.getElementById('dialog-body').innerHTML=body; dialog.showModal(); }
function progress() {
  const sequence=['conditions','needs',...(!scenario.texas?['location-check']:[]),'fit-1','fit-2','fit-4','identity',...(state.coverage==='manual'?['fit-0','insurance']:[])];
  const key=state.phase==='fit'?'fit-'+state.fit:state.phase;
  const question=sequence.includes(key)?sequence.indexOf(key)+1:0;
  const stage=question?0:{match:1,patient:2,payment:3}[state.phase];
  const percent=question?Math.round((question-1)/sequence.length*25):stage*25;
  return `<div class="journey-progress"><div class="progress-top"><span>Step ${stage+1} of ${steps.length}${question?` · Question ${question} of ${sequence.length}`:''}</span><button data-action="help">♧ &nbsp; Need help? Call us</button></div><div class="progress-track" role="progressbar" aria-label="Booking progress" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${percent}%"></div></div><div class="step-labels">${steps.map((s,i)=>`<span class="${i===stage?'current':''}" ${i===stage?'aria-current="step"':''}>${s}</span>`).join('')}</div></div>`;
}
function locationBanner() {return `<div class="location"><span aria-hidden="true">⌖</span><div class="location-text"><strong>${scenario.texas?"We've detected you're in Texas":"Your appointment will take place in Texas"}</strong></div><button data-action="location">Not in Texas? Click here</button></div>`;}
function go(phase) { state.phase=phase; render(); window.scrollTo({top:0,behavior:'instant'}); (phase==='match'?pane:flow).querySelector('h1,h2')?.focus({preventScroll:true}); }
function backButton() {return `<button class="back" data-action="back">← &nbsp; Go back</button>`;}
function heading(title,body) {return `<div class="form-heading"><h1 tabindex="-1">${title}</h1><p>${body}</p></div>`;}
function selectRecommendation() { const recommendation=getMatches(state)[0]; if(recommendation){ state.providerId=recommendation.id; state.slotId=recommendation.slots[0].id; } }

function portrait(p) {
  return p.avatar ? `<img class="portrait" src="${p.avatar}" alt="${esc(p.name)}">` : `<div class="portrait ${p.photo}" role="img" aria-label="${esc(p.name)}"></div>`;
}

function renderProviders() {
  const socialProof=['patient','payment'].includes(state.phase);
  pane.classList.toggle('social-proof',socialProof);
  document.getElementById('provider-pane').setAttribute('aria-label',socialProof?'Patient experiences':'Providers and availability');
  if(socialProof){renderSocialProof();return;}
  const matches=getMatches(state), selected=selectedProvider(), booked=state.booked;
  const choosing=canSelectAppointment(state);
  const preview=!choosing&&!booked;
  const show=booked&&selected?[selected]:matches;
  pane.classList.toggle('care-preview',preview);
  const context=!state.eligible?'Your answers suggest a different type of care may be a better fit.':
    booked?'Your selected provider and appointment details.':
    choosing?'We’ve recommended a provider and appointment. Choose any provider or time that works for you.':
    'Virtual care, with appointments to fit your schedule.';
  pane.innerHTML=`${state.phase==='match'?progress()+backButton():'<button class="text-button mobile-close" data-action="return-flow">↑ Back to your questions</button>'}
    <div class="eyebrow">${booked?'Your upcoming care':choosing?'Your recommended care':'Care is within reach'}</div>
    <div class="pane-heading"><h2 tabindex="-1">${booked?'Your appointment':choosing?'Choose your provider and time':'Mental health providers ready to help with availability as early as tomorrow.'}</h2><span class="count">${show.length} ${show.length===1?'provider':'providers'}</span></div>
    <p class="pane-description">${context}</p>
    ${!preview?`<div class="match-context"><span class="context-chip">⌖ Texas</span>${state.conditions.map(c=>`<span class="context-chip">${esc(c)}</span>`).join('')}${state.insurance?`<span class="context-chip ok">${esc(state.insurance==='No Insurance'?'Cash pay':state.insurance)}</span>`:''}</div>`:''}
    <p class="sr-only" role="status">${show.length} ${show.length===1?'provider available':'providers available'}</p>
    <div class="provider-grid ${preview?'preview-grid':''}">
      ${show.length?show.map((p,i)=>preview?previewCard(p):providerCard(p,i,booked)).join(''):`<div class="empty-state"><h3>${state.eligible?'No matching providers available':'Let’s find the right care for you'}</h3><p>${state.eligible?'Try another insurance option or review your selected concerns.':'Provider booking is paused based on your fit-check answers.'}</p>${state.eligible?'<button class="secondary" data-action="edit-insurance">Review insurance</button>':''}</div>`}
    </div>
    ${state.phase==='match'&&choosing&&selected?`<div class="selection-confirm"><div><strong>Your selected appointment</strong><p>${esc(selected.name)} · ${esc(selectedSlot()?.date)} at ${esc(selectedSlot()?.time)} CT</p></div><button class="primary" data-action="continue">Confirm selection &amp; continue</button></div>`:''}
    <p class="right-footer">Join thousands of patients who trust Legion Health</p>`;
  document.getElementById('mobile-preview').innerHTML=`<button class="mobile-preview" data-action="view-providers"><span>${booked?'View your appointment':`${matches.length} providers available`}<small>${preview?'See providers and upcoming availability':'See specialties and upcoming appointments'}</small></span><span aria-hidden="true">↓</span></button>`;
}

function renderSocialProof() {
  pane.classList.remove('care-preview');
  pane.innerHTML=`<button class="text-button mobile-close" data-action="return-flow">↑ Back to ${state.phase==='patient'?'your details':'booking'}</button>
    <div class="eyebrow">Patient experiences</div>
    <div class="pane-heading"><h2>Care that makes a difference</h2></div>
    <p class="pane-description">Hear from people who have found support with Legion Health.</p>
    <div class="feedback-cards">${patientFeedback.map(({title,quote})=>`<figure class="feedback-card">
      <div class="feedback-heading"><span class="feedback-mark" aria-hidden="true">“</span><h3>${esc(title)}</h3></div>
      <blockquote><p>${esc(quote)}</p></blockquote>
      <figcaption><span class="feedback-avatar" aria-hidden="true">♡</span>Legion Health Patient</figcaption>
    </figure>`).join('')}</div>
    <p class="right-footer">Join thousands of patients who trust Legion Health</p>`;
  document.getElementById('mobile-preview').innerHTML='';
}

function previewCard(p) {
  const tags=[...p.specialties.filter(s=>state.conditions.includes(s)),...p.specialties.filter(s=>!state.conditions.includes(s))].slice(0,3);
  return `<article class="provider-preview-card" data-provider="${p.id}">
    <div class="preview-identity">${portrait(p)}<div><h3>${esc(p.name)}</h3><p>Psychiatric NP</p></div></div>
    <div class="preview-specialties">${tags.map(s=>`<span class="${state.conditions.includes(s)?'matched':''}">${esc(s)}</span>`).join('')}</div>
    <p class="preview-availability"><span aria-hidden="true">◷</span> ${p.slots[0].date} · ${p.slots[0].time} CT</p>
  </article>`;
}

function providerCard(p,i,booked) {
  const active=p.id===state.providerId, choosing=canSelectAppointment(state);
  const tags=[...p.specialties.filter(s=>state.conditions.includes(s)),...p.specialties.filter(s=>!state.conditions.includes(s))].slice(0,4);
  return `<article class="provider-card ${active?'selected':''}" data-provider="${p.id}">
    ${i===0&&!booked?'<div class="recommendation-label">Recommended for you</div>':''}
    <div class="provider-top">${portrait(p)}<div><h3>${esc(p.name)}</h3><div class="provider-role">Psychiatric Mental Health Nurse Practitioner</div><div class="rating"><span class="star">★</span> ${p.rating} <span>(${p.reviews})</span> · Legion clinician</div></div></div>
    <div class="specialties">${tags.map(s=>`<span class="specialty ${state.conditions.includes(s)?'matched':''}">${esc(s)}</span>`).join('')}</div>
    ${state.insurance&&state.insurance!=='No Insurance'?`<div class="provider-reason">✓ ${esc(state.insurance)} accepted</div>`:''}
    <div class="availability"><span aria-hidden="true">◷</span><span>${booked?'Selected appointment':'Next available'}<br><strong>${booked?selectedSlot()?.date:p.slots[0].date} · ${booked?selectedSlot()?.time:p.slots[0].time} CT</strong></span></div>
    ${choosing?`<div class="slots">${p.slots.map(s=>`<button class="slot ${active&&state.slotId===s.id?'active':''}" data-action="slot" data-provider="${p.id}" data-slot="${s.id}" aria-pressed="${active&&state.slotId===s.id}" aria-label="${p.name}, ${s.date}, ${s.time} Central Time">${s.date.replace(',','')} · ${s.time}</button>`).join('')}</div>`:''}
    ${active?'<div class="selected-tag">✓ Selected appointment</div>':''}
    <details class="provider-details"><summary>About ${p.name.split(' ')[0]}</summary><p>${p.bio}</p><p>Areas of expertise: ${p.specialties.join(', ')}</p></details>
  </article>`;
}
function render() {
  flow.cleanupIntake?.();
  document.body.classList.toggle('post-booking',state.phase==='dashboard');
  flow.onclick=null;flow.oninput=null;flow.onsubmit=null;
  if(state.phase==='dashboard'){document.body.classList.remove('provider-fullscreen');mountIntake(flow,state.intake,{name:state.patient.first,patient:state.patient,appointment:appointmentSummary(),insuranceComplete:!!state.tasks.insurance,insurance:state.tasks.insurance?'Coverage details on file':'Verification still needed',reviewInsurance:()=>showTask('insurance')});return;}
  document.body.classList.toggle('provider-fullscreen', state.phase==='match');
  if(state.phase==='match'&&canSelectAppointment(state)&&!validSelection(state,state.providerId,state.slotId)) selectRecommendation();
  if(state.providerId&&!validSelection(state,state.providerId,state.slotId)){state.providerId='';state.slotId='';}
  renderProviders();
  let html='';
  if(state.phase==='identity'){
    html=identityScreen();
  } else if(state.phase==='location-check'){
    html=progress()+heading('Care for you, wherever you are', 'Legion Health currently offers virtual care to adults who will be physically in Texas for their appointment.')+`<div class="question-card"><h2>Will you be in Texas for your appointment?</h2><p>Your insurance address does not determine where you can receive virtual care.</p><div class="answers"><button class="answer" data-action="visit-texas">Yes</button><button class="answer" data-action="texas-no">No</button></div></div>${backButton()}`;
  } else if(state.phase==='fit'){
    const q=fitQuestions[state.fit];
    html=`${progress()}${locationBanner()}<div class="intro"><h1 tabindex="-1">Let's Make Sure We're the Right Fit</h1><p>We want to ensure that you get the best possible care for your current situation. Please read the following carefully and only proceed if you are a good fit for the care we provide.</p></div><div class="question-card"><h2>${q.title}</h2><p>${q.body}</p><div class="answers"><button class="answer" data-action="fit-answer" data-value="yes">Yes</button><button class="answer" data-action="fit-answer" data-value="no">No</button></div></div>${backButton()}${safety}${privacy}`;
  } else if(state.phase==='not-fit'){
    const q=fitQuestions[state.fit];
    const crisis=state.texas&&state.fit===1;
    html=`<div class="intro"><h1 tabindex="-1">Your Safety &amp; Care Come First</h1></div><div class="question-card"><h2>${!state.texas?'Are you based in Texas?':q.title}</h2><p>${!state.texas?"We're thrilled to support Texans right now. If you'd prefer care in another state, select 'No' and we'll point you to resources that can help you.":q.body}</p>${crisis?'<a class="fit-resource" href="tel:988"><strong>Call 988 for immediate crisis support</strong></a><p>If there is an immediate emergency, call 911.</p>':'<p>We want to help you find care better suited to your current needs.</p><button class="secondary" style="margin-top:18px" data-action="resources">View care resources</button>'}</div>${safety}<button class="back" data-action="correct-fit">← Change my answer</button>`;
  } else if(state.phase==='conditions'){
    html=`${progress()}<div class="form-card">${heading('What brings you here?','Understanding your needs helps us match you with the right care team')}<p class="hint">Select all that apply</p><div class="condition-grid">${conditionOptions.map(([name,icon,copy])=>{const on=state.conditions.includes(name);return `<button class="condition ${on?'selected':''} " data-action="condition" data-value="${esc(name)}" aria-pressed="${on}"><span class="condition-name"><span class="condition-icon" aria-hidden="true">${icon}</span>${esc(name)}</span>${on&&copy?`<span class="condition-copy">${copy}</span>`:''}<span class="condition-check" aria-hidden="true">${on?'✓':''}</span></button>`;}).join('')}</div><button class="primary" data-action="continue" ${state.conditions.length?'':'disabled'}>Continue</button></div>`;
  } else if(state.phase==='insurance'){
    html=`${progress()}<div class="form-card">${heading("Great news! We've got you covered",'We accept most major insurance plans. Select yours below.')}<h3 style="font-size:16px;margin-bottom:18px">Select your insurance provider</h3><div class="insurer-grid">${insurers.map((name,i)=>`<button class="insurer ${state.insurance===name?'selected':''}" data-action="insurance" data-value="${name}" aria-pressed="${state.insurance===name}"><span class="insurer-name ${['aetna','bluecross','cigna','united','oscar'][i]||''}">${['aetna','BlueCross<br>BlueShield','cigna','United<br>Healthcare','oscar','Other','None'][i]}</span><small>${name}</small></button>`).join('')}</div><button class="primary" data-action="continue" ${state.insurance?'':'disabled'}>Continue</button></div>${backButton()}`;
  } else if(state.phase==='needs'){
    html=`${progress()}<div class="form-card">${heading('How can we help you?',"Everyone's health journey is unique. We want to give you the best care we can.")}${[['existing','⚬','I already have a diagnosis and need medication support',"We'll connect you with a provider for ongoing management"],['new','♧',"I'm looking for a new diagnosis or medication",'Our providers will evaluate and create a treatment plan'],['unsure','♡',"I'm not sure, but I need help", "We'll guide you through the process step by step"]].map(([id,icon,title,body])=>`<button class="needs-option ${state.needs===id?'selected':''}" data-action="needs" data-value="${id}" aria-pressed="${state.needs===id}"><span class="needs-icon" aria-hidden="true">${icon}</span><span><strong>${title}</strong><p>${body}</p></span></button>`).join('')}<button class="primary" data-action="continue" ${state.needs?'':'disabled'}>Continue</button></div>${backButton()}`;
  } else if(state.phase==='match'){
    // The provider pane is the full-screen chooser at this step.
    html='';
  } else if(state.phase==='patient'){
    html=`${progress()}<form id="patient-form" class="form-card">${heading('Tell us about yourself','We need some basic information to create your account')}${appointmentSummary()}<div id="coverage-result" aria-live="polite">${patientCoverage()}</div><p class="identity-summary">${esc(state.patient.first)} ${esc(state.patient.last)} · Born ${esc(state.patient.dob)}</p><div class="field-grid">${[['email','Email','email'],['phone','Phone Number','tel']].map(([id,label,type])=>`<label class="field ${id==='email'?'full':''}">${label}<input name="${id}" type="${type}" value="${esc(state.patient[id])}" required ${id==='dob'?'max="2008-09-20"':''} autocomplete="off"></label>`).join('')}<label class="field full">How did you first hear about Legion Health?<select name="referral" required><option value="">Select an option</option>${['Google, Bing, or other search engine','Friend or family','Healthcare provider','Social media','Other'].map(o=>`<option ${state.patient.referral===o?'selected':''}>${o}</option>`).join('')}</select></label></div><div class="consents"><label class="check-label"><input id="visit-location" name="visit-location" type="checkbox" required ${state.locationConfirmed?'checked':''}><span>I'll be in Texas during the time of my appointment.</span></label>${[['terms','I agree to the Legion Health <button type="button" class="policy-link" data-action="policy" data-value="Terms of Service, Privacy Policy, and HIPAA Notice">Terms of Service, Privacy Policy, and HIPAA Notice</button>'],['treatment','I agree to the Legion Health <button type="button" class="policy-link" data-action="policy" data-value="Treatment Consent Policy and Controlled Substance Policy">Treatment Consent Policy, and Controlled Substance Policy</button>'],['recording','I agree to the <button type="button" class="policy-link" data-action="policy" data-value="Recording & AI Transcription Policy">Recording &amp; AI Transcription Policy</button>']].map(([id,label])=>`<label class="check-label"><input type="checkbox" name="${id}" ${state.checks[id]?'checked':''} required><span>${label}</span></label>`).join('')}</div><button class="primary" type="submit" id="save-patient" style="margin-top:20px" ${state.lookupStatus==='pending'?'disabled':''}>${state.lookupStatus==='pending'?'Checking coverage…':'Save my info &amp; Continue'}</button><div style="text-align:center;margin-top:24px"><h3 style="font-size:15px">Already started your journey?</h3><p class="fine-print">If you've already entered your email and started filling out forms, sign in to continue where you left off.</p><button class="secondary" style="margin-top:12px;width:100%" type="button" data-action="signin">⇥ &nbsp; Sign in to continue</button></div></form>${backButton()}`;
  } else if(state.phase==='payment'){
    html=`${progress()}<h1 tabindex="-1" style="font-size:28px">Complete Your Booking</h1><p style="margin-top:10px;color:#748091;font-size:15px">Review your appointment details and add payment information to confirm your booking.</p><div class="notice" style="background:#f0f5ff;border-color:#d6e5ff;color:#3d60bb">Time remaining to complete booking: 8:19<br>Please add your payment method to secure this appointment<div class="fine-print">Demo timer is paused. No appointment is being held.</div></div><div class="payment-section"><div class="appointment-head"><h3 style="margin:0;font-size:17px">Your Selected Appointment</h3><button class="secondary" data-action="change-appointment">Change Appointment</button></div>${appointmentSummary()}<span class="context-chip">Intake Appointment</span></div>${costCard()}<div class="payment-section"><h3>What to expect:</h3><ul><li><strong>When we charge:</strong> Claims are submitted to insurance about 5 days after your visit. Once insurance processes, we'll charge your card on file for any remaining balance and send a itemized invoice for the visit so you know exactly what you are paying for.</li><li><strong>Your estimated cost:</strong> ${coverageEstimate(state).description}</li><li><strong>Cancellation policy:</strong> Cancel or reschedule online at no charge up to 48 hours before your appointment. Late cancellations (within 48 hours) or no-shows (not arriving within 10 minutes) will incur a fee: $250 for initial visits, $100 for follow-ups.</li><li><strong>Insurance and Cash Pay:</strong> If you do not have eligible insurance coverage at the time of your visit, you will be responsible for the appointment cash pay rate of $250 for Intakes &amp; $150 for Followups.</li></ul><p class="fine-print">* You are responsible for any amount not covered by your insurance. If you have questions about coverage, please contact your insurance provider.</p><p class="fine-print" style="margin-top:10px">Review our <button class="policy-link" data-action="policy" data-value="Financial policy">financial policy</button></p></div><div class="payment-section"><h3>Payment Information</h3><p>Add Payment Method</p><div class="banner" style="margin-top:16px">Your payment information is encrypted and securely processed by Stripe.</div><label class="field">Credit or Debit Card *<input value="Demo Visa •••• 4242" readonly aria-label="Demo card, no real card entry"></label><p class="fine-print" style="margin-top:13px">We will try to authorize your card with a $1 transaction. Your statement description will be getHealthie.com - our payment provider.</p><p class="fine-print" style="margin-top:10px">By adding your payment method, you agree to our <button class="policy-link" data-action="policy" data-value="Financial policy">financial policy</button>.</p><div class="inline-actions"><button class="secondary" data-action="back">Cancel</button><button class="primary" data-action="book" ${state.locationConfirmed?'':'disabled'}>Complete Payment Setup</button></div><div class="safety" style="margin-top:18px"><div><h3 style="font-size:15px">How your payment info is protected</h3><p class="fine-print">We use industry-standard tokenization to protect your payment information. When you enter your card details, they're immediately converted into a secure token by our PCI-compliant payment processor.</p></div></div></div>`;
  } else if(state.phase==='dashboard'){
    html=`<div class="dashboard"><div class="dashboard-title"><h1 tabindex="-1">Hey ${esc(state.patient.first||'there')}! <span style="font-weight:400;font-size:18px;color:#758092">Here's your care summary.</span></h1></div><div class="notice">ⓘ &nbsp; Action needed: Must be completed 24 hours before your appointment</div><div class="form-card"><h2 style="font-size:21px">New Patient Checklist</h2>${[['insurance','Insurance',state.coverage!=='manual'?'Coverage confirmed · '+(state.coverage==='found'?'$25 estimated initial visit':'Cost estimate pending'):'Verify insurance or choose cash-pay'],['history','Medical History','Tell us about your medical history'],['assessment','Pre-Appointment Check-in','Do a pre-appointment check-in']].map(([id,title,body])=>`<div class="dashboard-item"><div><h3>${title}</h3><span class="badge ${state.tasks[id]?'complete':''}">${state.tasks[id]?'Complete':'Incomplete'}</span><p>${body}</p></div><button class="primary" data-action="task" data-value="${id}">${state.tasks[id]?'Review':'Start'}</button></div>`).join('')}</div><div class="form-card"><h2 style="font-size:21px">Next Appointment</h2>${appointmentSummary()}<div class="inline-actions"><button class="secondary" data-action="change-appointment">Reschedule</button><button class="secondary" data-action="cancel-appointment">Cancel</button></div></div><div class="form-card"><h2 style="font-size:21px">Post-Visit Summaries</h2><p class="hint" style="margin-top:20px;text-align:center">No post-visit summaries available at this time.</p></div>${state.conditions.includes('ADHD')?`<div class="form-card"><h2 style="font-size:21px">⚡ Accelerate your ADHD treatment</h2><p class="hint" style="margin-top:10px">To accelerate your treatment, your provider needs the following information. Please complete it as soon as possible ⏱</p>${['ADHD Health History','ADHD Diagnosis History (If Available)','Your Most Recent Vital Signs'].map(t=>`<div class="dashboard-item"><div><h3>${t}</h3><span class="badge">Not Started</span></div><button class="primary" data-action="intake-detail" data-value="${t}">Start</button></div>`).join('')}</div>`:''}<p class="fine-print">Demo booking only. No appointment, patient account or medical record has been created.</p></div>`;
  }
  flow.innerHTML=`<div class="step-enter">${html}</div>`;
}

function appointmentSummary(){const p=selectedProvider(),s=selectedSlot();if(!p||!s)return '';return `<div class="selected-summary"><strong>${s.date}</strong><div class="time">${s.time} CT</div><p>60 minute session</p><hr style="border:0;border-top:1px solid #d8e3f7;margin:14px 0"><strong>${p.name}</strong><p>Psychiatric Mental Health Nurse Practitioner</p></div>`;}
function startFit(){state.fit=1;go('fit');}
function manualInsurance(){clearTimeout(lookupTimer);state.lookupStatus='idle';state.coverage='manual';state.insurance='';state.tasks.insurance=false;state.answers[0]=undefined;state.fit=0;go('fit');}
function continueFlow(){
 if(state.phase==='conditions'){if(state.conditions.length)go('needs');return;}
 if(state.phase==='needs'){if(!state.needs)return;if(!state.texas)go('location-check');else startFit();return;}
 if(state.phase==='insurance'){if(state.insurance)go('match');return;}
 if(state.phase==='match'&&canSelectAppointment(state))go('patient');
}
function back(){
 if(state.phase==='needs')return go('conditions');
 if(state.phase==='location-check')return go('needs');
 if(state.phase==='fit'){const prior={0:'identity',1:scenario.texas?'needs':'location-check',2:1,4:2}[state.fit];if(typeof prior==='number'){state.fit=prior;return go('fit');}return go(prior);}
 if(state.phase==='identity'){state.fit=4;return go('fit');}
 if(state.phase==='insurance'){state.fit=0;return go('fit');}
 if(state.phase==='match')return go(state.coverage==='manual'?'insurance':'identity');
 if(state.phase==='patient')return go('match');
 if(state.phase==='payment')return go('patient');
}

document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-action]');if(!btn)return;
  const {action,value}=btn.dataset;
  if(action==='edit-identity')go('identity');
  if(action==='visit-texas'){state.texas=true;state.eligible=true;startFit();}

  if(action==='manual-coverage'){manualInsurance();}
  if(action==='skip-lookup'){submitIdentity(false);}
  if(action==='fit-answer'){const answer=value==='yes';state.answers[state.fit]=answer;state.eligible=answer===fitQuestions[state.fit].eligible;if(!state.eligible)return go('not-fit');if(state.fit===0)return go('insurance');const next={1:2,2:4}[state.fit];if(next!==undefined){state.fit=next;go('fit');}else go('identity');}
  if(action==='continue')continueFlow();
  if(action==='back')back();
  if(action==='condition'){state.conditions=state.conditions.includes(value)?state.conditions.filter(c=>c!==value):[...state.conditions,value];render();}
  if(action==='insurance'){state.insurance=value;render();}
  if(action==='needs'){state.needs=value;render();}
  if(action==='location')openDialog('Are you based in Texas?',`<p>We're thrilled to support Texans right now. If you'd prefer care in another state, select 'No' and we'll point you to resources that can help you.</p><div class="answers"><button class="answer" data-action="texas-yes">Yes</button><button class="answer" data-action="texas-no">No</button></div>`);
  if(action==='texas-yes'){state.texas=true;dialog.close();render();}
  if(action==='texas-no'){state.texas=false;state.eligible=false;dialog.close();go('not-fit');}
  if(action==='correct-fit'){if(!state.texas)return go('location-check');state.eligible=true;if(state.fit===3)return go('identity');go('fit');}
  if(action==='view-providers')document.getElementById('provider-pane').scrollIntoView({behavior:'smooth'});
  if(action==='return-flow')document.querySelector('.journey').scrollIntoView({behavior:'smooth'});
  if(action==='edit-insurance'){manualInsurance();}
  if(action==='slot'){
    if(!canSelectAppointment(state))return;
    if(validSelection(state,btn.dataset.provider,btn.dataset.slot)){state.providerId=btn.dataset.provider;state.slotId=btn.dataset.slot;render();}
  }
  if(action==='policy')openDialog(value,'<p>The linked policy text was not included in the supplied screenshots. This prototype preserves the original link and consent labels, but does not substitute a policy or collect legal consent.</p>');
  if(action==='help')openDialog('Need help? Call us','<p>This prototype is not connected to the Legion Health support line. No call will be placed.</p>');
  if(action==='signin')openDialog('Sign in to continue','<p>Your progress is available in this open demo tab. No real account is created and no authentication service is connected.</p>');
  if(action==='resources')openDialog('Find care that fits your needs','<p>You can explore mental health and substance-use treatment resources at <a href="https://findtreatment.gov/" target="_blank" rel="noreferrer">FindTreatment.gov</a>, or contact your insurance provider for covered care options.</p><p>In the U.S., call or text 988 for crisis support. For an immediate emergency, call 911.</p>');
  if(action==='change-appointment'){state.booked=false;go('match');}
  if(action==='book'&&state.locationConfirmed&&canSelectAppointment(state)&&validSelection(state,state.providerId,state.slotId)){state.booked=true;go('dashboard');}
  if(action==='dismiss')dialog.close();
  if(action==='cancel-appointment')openDialog('Cancel appointment?','<p>This will clear your demo appointment selection.</p><div class="inline-actions"><button class="secondary" data-action="dismiss">Keep appointment</button><button class="primary" data-action="confirm-cancel">Cancel demo appointment</button></div>');
  if(action==='confirm-cancel'){state.booked=false;state.providerId='';state.slotId='';dialog.close();go('match');}
  if(action==='task')showTask(value);
  if(action==='intake-detail')openDialog(value,'<p>The full questions for this form were not included in the supplied screenshots. This prototype retains the task without inventing clinical questions.</p>');
  if(action==='save-task'){state.tasks[value]=true;dialog.close();render();}
  if(action==='assessment-answer'){document.querySelectorAll('.assess-options button').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});btn.classList.add('active');btn.setAttribute('aria-pressed','true');document.getElementById('assessment-next').disabled=false;}
  if(action==='assessment-next')openDialog('Pre-Appointment Check-In','<p>The supplied screenshots show the first question only. This prototype does not invent the remaining assessment questions or mark an incomplete clinical assessment as complete.</p><button class="primary modal-footer" data-action="dismiss">Back to care summary</button>');
});

function showTask(task){
 if(task==='insurance'&&state.coverage!=='manual'){openDialog('Your insurance',coverageCard()+`<p>Your coverage details are already on file. We’ll recheck eligibility before your appointment and contact you if anything changes.</p><button class="text-button" data-action="dismiss">Close</button>`);return;}
 if(task==='insurance')openDialog('Health Insurance',`<form id="insurance-form" class="modal-fields"><label class="field">Insurance Provider<select required><option value="">Select your insurance provider</option>${insurers.map(i=>`<option ${i===state.insurance?'selected':''}>${i}</option>`).join('')}</select></label><fieldset style="border:0;padding:0;margin:0"><legend style="font-size:14px;margin-bottom:10px">Who is the policy holder?</legend><label class="check-label"><input type="radio" name="holder" checked> ${esc(state.patient.first)} ${esc(state.patient.last)} (Me)</label><label class="check-label"><input type="radio" name="holder"> Other (Someone else is the policy holder)</label></fieldset><label class="field">Member ID<input placeholder="Enter your Member ID" required></label><label class="field">Official Sex<span class="fine-print">We need to know the sex your insurance company has on file for you so your coverage comes through correctly.</span><select required><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label><label class="field">Address<input placeholder="Start typing your address..." required><span class="fine-print">Start typing to search for your address in Texas</span></label><h3>Insurance Card Photos</h3><p>Please upload your insurance card, this will help our billing team ensure that your insurance is billed correctly.</p><div class="field-grid"><label class="field">Front of Insurance Card (optional)<input type="file" accept="image/*,.pdf"></label><label class="field">Back of Insurance Card (optional)<input type="file" accept="image/*,.pdf"></label></div><p class="fine-print">Demo only. Use fictional information; files are not uploaded and insurance is not verified.</p><button class="primary" type="submit">Verify Insurance</button><div class="inline-actions"><button type="button" class="secondary" data-action="save-task" data-value="insurance">Cash Pay</button><button type="button" class="text-button" data-action="dismiss">Skip for Now</button></div></form>`);
 if(task==='history')openDialog('Health History',`<p>Complete these forms to provide your complete medical background</p><p class="fine-print">Mental Health History · ADHD Health History · ADHD Diagnosis History (If Available) · Release of Information · Primary Care Provider · Upload Your ID · Emergency Contact · Your Most Recent Vital Signs</p><p class="hint">0 of 8 forms completed</p><hr><h3>Mental Health History <small style="font-size:12px;font-weight:400">Section 1 of 11</small></h3><p>Your story, symptoms, and goals so we can personalize your care from visit #1.</p><label class="field" style="margin-top:20px">Current Issues<span style="font-weight:400">In a few sentences please describe the issues you have been experiencing</span><textarea placeholder="Use fictional information for this demo."></textarea></label><button class="primary modal-footer" data-action="intake-detail" data-value="Mental Health History — next section">Next</button>`);
 if(task==='assessment')openDialog('Pre-Appointment Check-In',`<p>Complete these mental health screening forms before your appointment</p><p class="fine-print">GAD-7 Anxiety Assessment · PHQ-9 Depression Assessment · Adult ADHD Self-Report Scale (ASRS-v1.1)</p><p class="hint">0 of 3 forms completed</p><hr><h3>GAD-7 Anxiety Assessment</h3><p class="fine-print">Section 1 of 2</p><p>Snapshot of anxiety symptoms that refines your care plan.</p><h3 style="margin-top:20px">Anxiety Symptoms</h3><p>Please answer all questions based on your experience over the last 2 weeks.</p><p class="hint">Question 1 of 7</p><p style="color:#1c2a3c">1. Feeling nervous, anxious, or on edge</p><div class="assess-options">${['Not at all','Several days','Over half the days','Nearly every day'].map(t=>`<button class="answer" data-action="assessment-answer" aria-pressed="false">${t}</button>`).join('')}</div><div class="inline-actions"><button class="secondary" data-action="dismiss">Skip This Form</button><button class="primary" id="assessment-next" data-action="assessment-next" disabled>Next</button></div>`);
}

document.addEventListener('input',e=>{if(e.target.form?.id==='patient-form'){const {name,value,checked,type}=e.target;if(type==='checkbox')state.checks[name]=checked;else state.patient[name]=value;}});
document.addEventListener('change',e=>{if(e.target.form?.id==='patient-form'){const {name,value,checked,type}=e.target;if(type==='checkbox')state.checks[name]=checked;else state.patient[name]=value;}});
document.addEventListener('submit',e=>{if(e.target.id==='identity-form'){e.preventDefault();submitIdentity(true);return;}if(e.target.id==='patient-form'){e.preventDefault();const fd=new FormData(e.target);state.patient={...state.patient,...Object.fromEntries(['email','phone','referral'].map(k=>[k,fd.get(k)]))};state.checks=Object.fromEntries(['terms','treatment','recording'].map(k=>[k,fd.has(k)]));state.locationConfirmed=fd.has('visit-location');if(!state.locationConfirmed)return;if(state.lookupStatus==='pending')return;if(state.lookupStatus==='not-found'){manualInsurance();return;}if(state.lookupStatus==='found'&&!state.tasks.insurance){state.insurance='Aetna';state.answers[0]=false;state.tasks.insurance=true;if(!validSelection(state,state.providerId,state.slotId)){go('match');pane.insertAdjacentHTML('afterbegin','<div class="notice" role="status">Your previous provider does not accept your Aetna plan. Please confirm an in-network provider below.</div>');return;}}go('payment');}if(e.target.id==='insurance-form'){e.preventDefault();openDialog('Insurance verification','<p>This demo does not connect to an insurer. No coverage has been verified.</p><button class="primary modal-footer" data-action="dismiss">Back to care summary</button>');}});
document.getElementById('restart').addEventListener('click',()=>openDialog('Start over?','<p>This will clear your answers and demo appointment in this tab.</p><div class="inline-actions"><button class="secondary" data-action="dismiss">Keep my progress</button><button class="primary" id="confirm-restart">Start over</button></div>'));
document.addEventListener('click',e=>{if(e.target.id==='confirm-restart'){clearTimeout(lookupTimer);state=initial();dialog.close();go(state.phase);}});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
render();

function identityScreen(){return progress()+locationBanner()+`<form id="identity-form" class="form-card">${heading('Let’s find your coverage','Enter a few details to find your insurance and providers who accept it.')}<div class="field-grid">${[['first','First Name','text'],['last','Last Name','text'],['dob','Date of Birth','date']].map(([id,label,type])=>`<label class="field">${label}<input name="${id}" type="${type}" value="${esc(state.patient[id])}" required ${type==='date'?'max="'+new Date().toISOString().slice(0,10)+'"':''}></label>`).join('')}</div><p class="fine-print">Our services are designed for adults 18 and older.</p><div class="lookup-consent"><label class="check-label"><input name="lookup-consent" type="checkbox" required checked><span>I authorize Verified to look up my health insurance and share my coverage and eligibility information with Legion Health.</span></label><p class="fine-print">Powered by Verified · 1-Click Health</p></div><button class="primary" type="submit">Find my insurance &amp; continue</button><button type="button" class="text-button" data-action="skip-lookup">Enter insurance myself</button></form>${backButton()}`;}
function submitIdentity(lookup){if(!canLookupInsurance(state))return;const form=document.getElementById('identity-form');const consent=form.elements['lookup-consent'];consent.required=lookup;if(!form.reportValidity()){consent.required=true;return;}const fd=new FormData(form);for(const key of ['first','last','dob'])state.patient[key]=fd.get(key).trim();if(!isAdult(state.patient.dob)){state.fit=3;state.eligible=false;go('not-fit');return;}state.eligible=true;state.coverage=lookup?scenario.verified:'manual';state.insurance='';state.tasks.insurance=false;state.answers[3]=true;state.providerId='';state.slotId='';if(state.coverage==='manual')manualInsurance();else beginLookup();}
function coverageCard(){return `<div class="coverage-card"><span class="context-chip ok">✓ Coverage found</span><h2>Aetna · Open Choice PPO</h2><p>${esc(state.patient.first)} ${esc(state.patient.last)} · Member ID •••• 4821</p><p>Active commercial coverage · No Medicare or Medicaid coverage returned</p><p class="fine-print">Tell us if you have additional coverage. We’re unable to serve patients with Medicaid or Medicare, even on a cash-pay basis.</p><p>${state.coverage==='found'?'Estimated initial-visit copay: <strong>$25</strong>':'Your plan was found. Your visit cost still needs confirmation.'}</p></div>`;}
function costCard(){const cost=coverageEstimate(state);return `<div class="cost-card"><div class="eyebrow">Your initial appointment</div><h2>${cost.title}</h2><p>${cost.description}</p>${state.coverage!=='manual'?`<p>✓ Aetna · Active coverage<br>✓ ${esc(selectedProvider()?.name)} · In network</p>`:''}<p class="fine-print">${cost.caveat}</p><h3>Why we need your card</h3><p>There is no visit charge today. We keep a card on file for your share after insurance processes the claim and for any applicable cancellation fees. A $1 authorization may appear temporarily.</p></div>`;}
document.addEventListener('change',e=>{if(e.target.id==='visit-location'){state.locationConfirmed=e.target.checked;}if(e.target.closest('#scenario-controls')){scenario={texas:document.getElementById('scenario-location').value==='texas',verified:document.getElementById('scenario-verified').value,records:document.getElementById('scenario-records').value};clearTimeout(lookupTimer);if(dialog.open)dialog.close();if(e.target.id==='scenario-records'){state.intake=createIntakeState();previewIntake('web');return;}state=initial();go(state.phase);}});

function patientCoverage(){
 if(state.lookupStatus==='idle')return '';
 if(state.lookupStatus==='pending')return '<div class="coverage-card" role="status"><h3>Finding your coverage…</h3><p>You can fill in your details while we check your insurance.</p><button type="button" class="text-button" data-action="manual-coverage">Enter insurance myself</button></div>';
 if(state.lookupStatus==='not-found')return '<div class="coverage-card"><h3>We couldn’t find your coverage</h3><p>This does not mean you’re uninsured. Continue with manual insurance entry.</p><button type="button" class="secondary" data-action="manual-coverage">Enter my insurance</button></div>';
 return '<h2 style="margin-top:24px">We found your coverage</h2>'+coverageCard()+`<label class="check-label"><input type="checkbox" required checked name="coverage-confirmation"><span>This is my coverage, and I have no additional Medicare or Medicaid coverage.</span></label><button type="button" class="text-button" data-action="manual-coverage">This isn’t correct / I have other coverage</button>`;
}
function beginLookup(){
 clearTimeout(lookupTimer);state.lookupStatus='pending';state.answers[0]=undefined;const current=state;
 go('match');
 lookupTimer=setTimeout(()=>{if(state!==current)return;state.lookupStatus=state.coverage==='not-found'?'not-found':'found';const result=document.getElementById('coverage-result');if(result)result.innerHTML=patientCoverage();const save=document.getElementById('save-patient');if(save){save.disabled=false;save.textContent='Save my info & Continue';}},3000);
}

function previewIntake(channel='web'){
  scenario.records=document.getElementById('scenario-records').value;
  clearTimeout(lookupTimer);state.texas=true;state.eligible=true;state.conditions=['Anxiety'];state.needs='existing';state.answers=fitQuestions.map(q=>q.eligible);state.insurance='Aetna';state.coverage='found';state.lookupStatus='found';state.tasks.insurance=true;state.locationConfirmed=true;state.booked=true;state.intake.tab=channel;state.intake.previewOnly=channel!=='web';state.intake.unread=channel==='text'?0:1;state.intake.recordStatus=scenario.records;state.intake.demoIndex=0;applyIntakeScenario(state.intake,scenario.records);if(['found','ready'].includes(scenario.records))state.intake.records='connected';selectRecommendation();go('dashboard');
}
document.querySelectorAll('[data-scenario-intake]').forEach(button=>button.addEventListener('click',()=>previewIntake(button.dataset.scenarioIntake)));
