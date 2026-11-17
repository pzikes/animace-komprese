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

export function decodeLzw(input) {
  const symbols = readSymbols(input);
  const encoded = encodeLzw(input).at(-1);
  const encodedCodes = encoded.output;
  const dictionary = new Map();
  const initialSymbols = new Set();
  for (const symbol of symbols) {
    if (!initialSymbols.has(symbol)) {
      dictionary.set(dictionary.size, symbol);
      initialSymbols.add(symbol);
    }
  }
  const initialDictionary = Array.from(dictionary, ([code, phrase]) => ({ code, phrase }));
  const steps = [{
    type: "decompress-start",
    title: "Začneme z číselných kódů",
    description: "Pro ukázku známe počáteční abecedu znaků. Slovník delších skupin budeme znovu skládat při čtení kódů.",
    dictionary: snapshotDictionary(new Map(Array.from(dictionary, ([code, phrase]) => [phrase, code]))),
    initialDictionary,
    encodedCodes,
    codeIndex: -1,
    output: "",
  }];
  let output = "";
  let previous = "";

  for (let index = 0; index < encodedCodes.length; index += 1) {
    const code = encodedCodes[index];
    let phrase;
    if (dictionary.has(code)) {
      phrase = dictionary.get(code);
    } else if (code === dictionary.size && previous) {
      phrase = previous + Array.from(previous)[0];
    } else {
      throw new Error(`Kód ${code} není možné rozbalit.`);
    }

    output += phrase;
    let addedPhrase = "";
    let addedCode = null;
    if (previous) {
      addedPhrase = previous + Array.from(phrase)[0];
      addedCode = dictionary.size;
      dictionary.set(addedCode, addedPhrase);
    }
    steps.push({
      type: "decode-code",
      title: `Kód ${code} znamená „${phrase}“`,
      description: previous
        ? `Z kódu ${code} získáme „${phrase}“. Spojením předchozího zápisu a prvního znaku nové skupiny doplníme slovník.`
        : `První kód ${code} najdeme v počáteční abecedě. Odpovídá skupině „${phrase}“.`,
      dictionary: snapshotDictionary(new Map(Array.from(dictionary, ([entry, value]) => [value, entry]))),
      initialDictionary,
      encodedCodes,
      codeIndex: index,
      addedPhrase,
      addedCode,
      output,
    });
    previous = phrase;
  }

  steps.push({
    type: "decompress-result",
    title: "Původní text je obnovený",
    description: "Všechny kódy jsme převedli zpět na skupiny znaků a složili z nich původní text.",
    dictionary: snapshotDictionary(new Map(Array.from(dictionary, ([entry, value]) => [value, entry]))),
    initialDictionary,
    encodedCodes,
    codeIndex: encodedCodes.length - 1,
    output,
  });
  return steps;
}
