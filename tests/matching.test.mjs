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

import {fitSequence,isAdult,coverageEstimate} from '../data.js';
test('lookup scenarios remove only resolved questions and distinguish coverage from cost certainty',()=>{
  assert.deepEqual(fitSequence('manual'),[0,1,2,4]);
  assert.deepEqual(fitSequence('found'),[1,2,4]);
  assert.deepEqual(fitSequence('benefits-pending'),[1,2,4]);
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
