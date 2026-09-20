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
