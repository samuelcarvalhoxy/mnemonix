import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMINIC, LEVELS, MAJOR, emptyProgress, initials, levelFor, makeRound, normalize, reviewResult, streak} from '../public/assets/training.js';
import {applyChange, fromLegacy} from '../public/assets/progress.js';
import {cleanChange} from '../api/data.js';

test('Sistema Maior preserves the original deck and user associations', () => {
  assert.equal(Object.keys(MAJOR).length, 110);
  assert.equal(MAJOR['12'], 'Tênis');
  const legacy = fromLegacy([{numberValue:'12',customWord:'Tina',imageHint:'atrás da porta',masteryLevel:3,
    lastReviewedAt:1700000000000,reviewCount:7}], {totalSessions:4});
  assert.deepEqual(legacy.library.major['12'], {word:'Tina',hint:'atrás da porta'});
  assert.equal(legacy.reviews['major:12'].count, 7);
  assert.equal(legacy.legacy.totalSessions, 4);
  const round = makeRound('major', 5, legacy.library, {}, {reverse:true}, () => .99);
  assert.ok(round.items.some(item => item.front === 'Tina' && item.back === '12'));
});

test('Dominic maps all 100 pairs to the canonical initials', () => {
  assert.equal(initials('00'), 'OO');
  assert.equal(initials('15'), 'AE');
  for (const [number, [person]] of Object.entries(DOMINIC)) {
    assert.equal(person.split(' ').map(word => word[0]).join(''), initials(number));
  }
  const round = makeRound('dominic', 5, {}, {}, {range:'initials'});
  assert.equal(round.items.length, 25);
  assert.ok(round.items.every(item => item.back === initials(item.front)));
});

test('Deck difficulty spans from four to 52 unique cards', () => {
  assert.equal(makeRound('cards', 1, {}, {}).items.length, 4);
  const deck = makeRound('cards', LEVELS.length, {}, {}).items;
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck).size, 52);
});

test('Loci, numbers, and study use personalized material', () => {
  const material = {places:['Porta','Tapete','Corredor'],study:[{id:'card',front:'Pista',back:'Resposta'}]};
  const palace = makeRound('loci',3,material,{});
  assert.deepEqual(palace.places, material.places);
  assert.equal(palace.items.length, 3);
  assert.deepEqual(makeRound('study',1,material,{},{range:'custom'}).items, material.study);
  const numbers = makeRound('numbers',1,material,{},{method:'dominic'},() => 0);
  assert.equal(numbers.items.join(''), '111111');
  assert.equal(normalize(' Âmpulheta '), 'ampulheta');
});

test('Progress requires two successful sessions at the current level', () => {
  const events = [
    {id:'1',mode:'major',level:1,correct:4,total:5},
    {id:'2',mode:'major',level:1,correct:3,total:5},
    {id:'3',mode:'cards',level:1,correct:4,total:4}
  ];
  assert.equal(levelFor(events,'major'),1);
  assert.equal(levelFor([...events,{id:'4',mode:'major',level:1,correct:5,total:5}],'major'),2);
  assert.equal(streak([{at:new Date(2026,10,21).getTime()},{at:new Date(2026,10,20).getTime()}],new Date(2026,10,22)),2);
});

test('Progress mutations deduplicate sessions and retain the latest review', () => {
  const data = emptyProgress();
  const review = reviewResult(undefined,true,1000);
  const change = {event:{id:'once'},reviews:{'major:00':review}};
  applyChange(data,change);
  applyChange(data,change);
  applyChange(data,{reviews:{'major:00':reviewResult(undefined,false,910)}});
  assert.equal(data.events.length,1);
  assert.deepEqual(data.reviews['major:00'],review);
  assert.equal(reviewResult(review,false,2000).due,602000);
});

test('API discards invalid event totals and accepts allowed preference and deck data', () => {
  assert.equal(cleanChange({event:{id:'00000000-0000-0000-0000-000000000000',mode:'cards',level:1,total:4,correct:5,at:Date.now(),seconds:1}}),null);
  const change = cleanChange({library:{dominic:{'02':[' Olívia Braga ',' Pulando '],'999':['A','B']}},preferences:{offers:false}});
  assert.deepEqual(change.library.dominic,{'02':['Olívia Braga','Pulando']});
  assert.equal(change.preferences.offers,false);
});
