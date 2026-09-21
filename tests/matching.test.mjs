import test from 'node:test';
import assert from 'node:assert/strict';
import {getMatches, canSelectAppointment, validSelection, providers, fitQuestions} from '../data.js';

test('providers narrow by concerns, insurance, then care needs',()=>{
  const steps=[{}, {conditions:['ADHD']}, {conditions:['ADHD'],insurance:'Aetna'}, {conditions:['ADHD'],insurance:'Aetna',needs:'existing'}];
  const groups=steps.map(getMatches);
  assert.deepEqual(groups.map(g=>g.length),[12,8,6,5]);
  groups.slice(1).forEach((group,i)=>assert.ok(group.every(p=>groups[i].some(prior=>prior.id===p.id))));
  assert.equal(getMatches({conditions:['ADHD'],insurance:'Other Insurance'}).length,0);
  assert.equal(getMatches({eligible:false}).length,0);
});

test('changing answers restores matching providers and invalidates excluded appointments',()=>{
  const state={conditions:['ADHD'],insurance:'Aetna',needs:'new'};
  assert.ok(validSelection(state,'maya','maya-1'));
  assert.equal(validSelection({...state,needs:'existing'},'maya','maya-1'),false);
  assert.ok(getMatches({...state,needs:''}).some(p=>p.id==='sofia'));
});

test('selection is locked until matching questions are complete and the choice step opens',()=>{
  const complete={phase:'match',booked:false,texas:true,eligible:true,answers:fitQuestions.map(q=>q.eligible),conditions:['ADHD'],insurance:'Aetna',needs:'existing'};
  assert.equal(canSelectAppointment(complete),true);
  for(const phase of ['fit','conditions','insurance','needs','dashboard']) {
    assert.equal(canSelectAppointment({...complete,phase}),false);
  }
  for(const patch of [{answers:[]},{conditions:[]},{insurance:''},{needs:''},{texas:false},{eligible:false},{booked:true}]){
    assert.equal(canSelectAppointment({...complete,...patch}),false);
  }
  assert.equal(new Set(providers.map(p=>p.id)).size,providers.length);
});

import {canLookupInsurance,isAdult,coverageEstimate} from '../data.js';
import {intakeQuestions,createIntakeState,nextQuestion,normalizeReply} from '../intake.js';
test('lookup scenarios remove only resolved questions and distinguish coverage from cost certainty',()=>{

  assert.match(coverageEstimate({coverage:'found',insurance:'Aetna'}).title,/25/);
  assert.match(coverageEstimate({coverage:'benefits-pending',insurance:'Aetna'}).title,/pending/);
  assert.match(coverageEstimate({coverage:'manual',insurance:'Aetna'}).title,/pending/);
  assert.match(coverageEstimate({coverage:'manual',insurance:'No Insurance'}).title,/250/);
  assert.doesNotMatch(coverageEstimate({coverage:'found',insurance:'Cigna'}).title,/25/);
});
test('age eligibility is derived from DOB at the eighteenth birthday',()=>{
  const today=new Date('2026-09-21T12:00:00');
  assert.equal(isAdult('2008-09-21',today),true);
  assert.equal(isAdult('2008-09-22',today),false);
  assert.equal(isAdult('not-a-date',today),false);
});

test('insurance lookup requires care preferences and all early eligibility checks',()=>{
 const ready={texas:true,eligible:true,conditions:['ADHD'],needs:'existing',answers:[undefined,false,false,undefined,true]};
 assert.equal(canLookupInsurance(ready),true);
 for(const patch of [{texas:false},{eligible:false},{conditions:[]},{needs:''},{answers:[]},{answers:[undefined,true,false,undefined,true]},{answers:[undefined,false,true,undefined,true]},{answers:[undefined,false,false,undefined,false]}])assert.equal(canLookupInsurance({...ready,...patch}),false);
});

test('shared intake keeps web and SMS answers aligned',()=>{
  const intake=createIntakeState();
  assert.equal(nextQuestion(intake).id,'issues');
  assert.equal(normalizeReply(intakeQuestions[1],'No'),'No');
  assert.equal(normalizeReply(intakeQuestions[1],'2'),null);
  assert.equal(normalizeReply(intakeQuestions[1],'maybe'),null);
  intake.answers.issues='Trouble sleeping and persistent anxiety';
  assert.equal(nextQuestion(intake).id,'hospitalized');
});

test('background lookup permits choosing a provider but never bypasses booking eligibility',()=>{
 const pending={phase:'match',booked:false,texas:true,eligible:true,answers:[undefined,false,false,true,true],conditions:['ADHD'],insurance:'',needs:'existing',lookupStatus:'pending'};
 assert.equal(canSelectAppointment(pending),true);
 assert.equal(canSelectAppointment({...pending,phase:'payment'}),false);
 assert.equal(canSelectAppointment({...pending,lookupStatus:'idle'}),false);
 assert.equal(canSelectAppointment({...pending,answers:[]}),false);
});

import {applyIntakeScenario,saveIntakeEdit,canFinalizeIntake} from '../intake.js';
test('records never invent a patient narrative or recent GAD answers',()=>{
 const intake=createIntakeState();applyIntakeScenario(intake,'found');
 assert.equal(intake.answers.issues,undefined);
 assert.equal(intake.answers.gad1,undefined);
 assert.equal(intake.prefilled.pcp,'records');
 applyIntakeScenario(intake,'ready');
 assert.equal(intake.prefilled.issues,'text');
 assert.equal(intake.prefilled.gad1,'text');
 assert.equal(intakeQuestions.filter(q=>q.group==='gad').length,7);
 assert.equal(intakeQuestions.filter(q=>q.group==='gad'&&intake.answers[q.id]).length,3);
});
test('edits are saved explicitly and invalidate the signature without scenario overwrites',()=>{
 const intake=createIntakeState();applyIntakeScenario(intake,'ready');
 intake.signature={name:'Example Patient'};intake.editing.issues=true;intake.drafts.issues='Updated story';
 assert.notEqual(intake.answers.issues,'Updated story');
 saveIntakeEdit(intake,'issues');assert.equal(intake.answers.issues,'Updated story');assert.equal(intake.signature,null);
 applyIntakeScenario(intake,'ready');assert.equal(intake.answers.issues,'Updated story');
});
test('finalization requires all seven GAD answers and no unsaved edits',()=>{
 const intake=createIntakeState();applyIntakeScenario(intake,'ready');assert.equal(canFinalizeIntake(intake),false);
 intakeQuestions.forEach(q=>{intake.answers[q.id]=q.type==='choice'?q.options[0]:'Example';});
 assert.equal(canFinalizeIntake(intake),true);intake.editing.gad7=true;assert.equal(canFinalizeIntake(intake),false);
});
