import { readSymbols } from "./shared.js";

function snapshotDictionary(dictionary) {
  return Array.from(dictionary, ([phrase, code]) => ({ phrase, code }));
}

export function encodeLzw(input) {
  const symbols = readSymbols(input);
  const dictionary = new Map();
  for (const symbol of symbols) {
    if (!dictionary.has(symbol)) dictionary.set(symbol, dictionary.size);
  }

  const steps = [{
    type: "start",
    title: "Vytvoříme počáteční slovník",
    description: "Do slovníku vložíme všechny různé jednotlivé znaky. Delší skupiny znaků do něj budeme přidávat, když je objevíme.",
    dictionary: snapshotDictionary(dictionary),
    output: [],
    examinedIndex: -1,
    currentPhrase: "",
  }];
  const output = [];
  let phrase = symbols[0];

  for (let index = 1; index < symbols.length; index += 1) {
    const symbol = symbols[index];
    const combined = phrase + symbol;
    if (dictionary.has(combined)) {
      phrase = combined;
      steps.push({
        type: "extend",
        title: `Rozšiřujeme skupinu na „${phrase}“`,
        description: `Spojení „${combined}“ už ve slovníku je, proto v něm pokračujeme bez přidání nové položky.`,
        dictionary: snapshotDictionary(dictionary),
        output: output.slice(),
        examinedIndex: index,
        currentPhrase: phrase,
      });
      continue;
    }

    const emittedCode = dictionary.get(phrase);
    output.push(emittedCode);
    const addedCode = dictionary.size;
    dictionary.set(combined, addedCode);
    steps.push({
      type: "add",
      title: `Přidáme „${combined}“ do slovníku`,
      description: `Vydáme kód ${emittedCode} pro známou skupinu „${phrase}“ a novou skupinu „${combined}“ uložíme pod kódem ${addedCode}.`,
      dictionary: snapshotDictionary(dictionary),
      output: output.slice(),
      emittedCode,
      addedPhrase: combined,
      addedCode,
      examinedIndex: index,
      currentPhrase: symbol,
    });
    phrase = symbol;
  }

  const finalCode = dictionary.get(phrase);
  output.push(finalCode);
  steps.push({
    type: "result",
    title: "Vydáme poslední kód",
    description: `Na konci vstupu vydáme kód ${finalCode} pro poslední skupinu „${phrase}“. Výsledkem je posloupnost číselných kódů.`,
    dictionary: snapshotDictionary(dictionary),
    output: output.slice(),
    emittedCode: finalCode,
    examinedIndex: symbols.length - 1,
    currentPhrase: phrase,
  });
  return steps;
}
