#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FAQ_PATH = path.join(__dirname, 'faq.txt');
const MIN_SCORE = 0.25;

const STOP_WORDS = new Set([
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то',
  'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за',
  'бы', 'по', 'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще',
  'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли',
  'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибуд',
  'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей',
  'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя',
  'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже',
  'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'того', 'потому',
  'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом', 'один', 'почти',
  'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем', 'сказать',
  'ведь', 'про', 'это', 'эта', 'эти', 'этих', 'the', 'a', 'an', 'is', 'are',
  'to', 'of', 'and', 'in', 'on', 'for', 'with', 'can', 'do', 'how', 'what',
  'when', 'where', 'why', 'which', 'who',
]);

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function loadFaq(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const entries = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    let question = '';
    let answer = '';

    for (const line of lines) {
      if (/^Q:/i.test(line)) {
        question = line.replace(/^Q:\s*/i, '');
      } else if (/^A:/i.test(line)) {
        answer = line.replace(/^A:\s*/i, '');
      }
    }

    if (question && answer) {
      entries.push({
        question,
        answer,
        tokens: tokenize(`${question} ${answer}`),
      });
    }
  }

  if (entries.length === 0) {
    throw new Error('В faq.txt не найдено ни одной пары Q/A');
  }

  return entries;
}

function scoreMatch(queryTokens, faqTokens) {
  if (queryTokens.length === 0 || faqTokens.length === 0) return 0;

  const faqSet = new Set(faqTokens);
  let hits = 0;

  for (const token of queryTokens) {
    if (faqSet.has(token)) {
      hits += 1;
      continue;
    }
    // частичное совпадение: "репетиции" ~ "репетиция"
    for (const faqToken of faqSet) {
      if (
        token.length >= 4 &&
        faqToken.length >= 4 &&
        (token.startsWith(faqToken.slice(0, 4)) ||
          faqToken.startsWith(token.slice(0, 4)))
      ) {
        hits += 0.7;
        break;
      }
    }
  }

  return hits / Math.max(queryTokens.length, 1);
}

function findBestAnswer(query, faq) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return null;
  }

  let best = null;
  let bestScore = 0;

  for (const entry of faq) {
    const score = scoreMatch(queryTokens, entry.tokens);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore < MIN_SCORE) {
    return null;
  }

  return best;
}

function printHelp() {
  console.log('Команды: /help — справка, /list — список вопросов, /exit — выход');
}

function main() {
  const faq = loadFaq(FAQ_PATH);

  console.log('FAQ-бот репетиции (команда Aviola)');
  console.log(`Загружено вопросов: ${faq.length}`);
  printHelp();
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () => {
    rl.question('Вы: ', (line) => {
      const input = line.trim();

      if (!input) {
        ask();
        return;
      }

      const cmd = input.toLowerCase();
      if (cmd === '/exit' || cmd === 'exit' || cmd === 'quit' || cmd === 'выход') {
        console.log('Пока!');
        rl.close();
        return;
      }

      if (cmd === '/help' || cmd === 'help') {
        printHelp();
        console.log('');
        ask();
        return;
      }

      if (cmd === '/list' || cmd === 'list') {
        console.log('Известные вопросы:');
        faq.forEach((e, i) => console.log(`  ${i + 1}. ${e.question}`));
        console.log('');
        ask();
        return;
      }

      const match = findBestAnswer(input, faq);
      if (match) {
        console.log(`Бот: ${match.answer}`);
      } else {
        console.log('Бот: не знаю');
      }
      console.log('');
      ask();
    });
  };

  ask();
}

module.exports = { loadFaq, findBestAnswer, FAQ_PATH };

if (require.main === module) {
  main();
}
