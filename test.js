'use strict';

const { loadFaq, findBestAnswer, FAQ_PATH } = require('./bot');

const faq = loadFaq(FAQ_PATH);

const cases = [
  { q: 'Когда начинается репетиция?', expect: 'время', mustContain: '18:00' },
  { q: 'сколько длится репетиция', expect: 'время', mustContain: 'часа' },
  { q: 'Сколько человек в команде?', expect: 'команда', mustContain: '2 до 5' },
  { q: 'как собрать команду', expect: 'команда', mustContain: 'капитан' },
  { q: 'Какой трек выбрать?', expect: 'трек', mustContain: 'FAQ-бот' },
  { q: 'что за трек на репетиции', expect: 'трек', mustContain: 'терминале' },
  { q: 'Как сдавать решение?', expect: 'сдача', mustContain: 'репозиторий' },
  { q: 'куда пушить код', expect: 'сдача', mustContain: 'GitHub' },
  { q: 'Какие призы?', expect: 'призы', mustContain: 'мерч' },
  { q: 'за что дают призы на репетиции', expect: 'призы', mustContain: 'README' },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  const match = findBestAnswer(c.q, faq);
  let ok = false;

  if (c.expect === null) {
    ok = match === null;
  } else {
    ok =
      match !== null &&
      typeof c.mustContain === 'string' &&
      match.answer.toLowerCase().includes(c.mustContain.toLowerCase());
  }

  if (ok) {
    passed += 1;
    console.log(`OK  | ${c.q}`);
    console.log(`     → ${match ? match.answer.slice(0, 80) + '…' : 'не знаю'}`);
  } else {
    failed += 1;
    console.log(`FAIL| ${c.q}`);
    console.log(
      `     got: ${match ? match.answer : 'не знаю'}`,
    );
  }
}

console.log('');
console.log(`Итого: ${passed}/${cases.length} пройдено, ошибок: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
