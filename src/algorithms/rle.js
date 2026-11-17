import { readSymbols } from "./shared.js";

export function encodeRle(input) {
  const symbols = readSymbols(input);
  const steps = [{
    type: "start",
    title: "Nejdřív se podíváme na text",
    description: "RLE hledá stejné znaky, které stojí hned za sebou. Každou takovou skupinu zapíše jako znak a počet opakování.",
    runs: [],
    activeStart: -1,
    activeEnd: -1,
  }];
  const runs = [];

  for (let start = 0; start < symbols.length;) {
    let end = start + 1;
    while (end < symbols.length && symbols[end] === symbols[start]) end += 1;
    const run = { symbol: symbols[start], count: end - start };
    runs.push(run);
    steps.push({
      type: "run",
      title: run.count > 1 ? `Našli jsme ${run.count} stejné znaky` : "Tento znak je v řadě sám",
      description: run.count > 1
        ? `Skupinu „${run.symbol.repeat(Math.min(run.count, 8))}${run.count > 8 ? "…" : ""}“ můžeme zapsat stručněji jako znak a počet ${run.count}.`
        : `Znak „${run.symbol}“ se neopakuje vedle sebe, proto ho zapíšeme jako skupinu o délce 1.`,
      runs: runs.map((item) => ({ ...item })),
      activeStart: start,
      activeEnd: end,
    });
    start = end;
  }

  steps.push({
    type: "result",
    title: "Hotový zápis RLE",
    description: "Každá skupina má svůj znak a délku. Při rozbalení zopakujeme každý znak tolikrát, kolik říká jeho počet.",
    runs: runs.map((item) => ({ ...item })),
    activeStart: -1,
    activeEnd: -1,
  });
  return steps;
}

export function decodeRle(input) {
  const runs = encodeRle(input).at(-1).runs;
  const steps = [{
    type: "decompress-start",
    title: "Začneme z komprimovaných skupin",
    description: "Každá skupina říká, který znak máme opakovat a kolikrát. Budeme je rozbalovat jednu po druhé.",
    runs,
    activeRun: -1,
    output: "",
  }];
  let output = "";

  runs.forEach((run, index) => {
    output += run.symbol.repeat(run.count);
    steps.push({
      type: "decompress-run",
      title: `Rozbalíme skupinu „${run.symbol} × ${run.count}“`,
      description: `Znak „${run.symbol}“ zapíšeme ${run.count}×. Obnovený text se tím prodlouží.`,
      runs,
      activeRun: index,
      output,
    });
  });

  steps.push({
    type: "decompress-result",
    title: "Původní text je obnovený",
    description: "Všechny skupiny jsme rozbalili. Výsledek odpovídá původnímu textu.",
    runs,
    activeRun: -1,
    output,
  });
  return steps;
}
