import { readSymbols } from "./shared.js";

function compareNodes(a, b) {
  return a.frequency - b.frequency || a.order - b.order;
}

function makeSnapshot(nodes) {
  return nodes.slice().sort(compareNodes);
}

export function encodeHuffman(input) {
  const symbols = readSymbols(input);
  const counts = new Map();
  for (const symbol of symbols) counts.set(symbol, (counts.get(symbol) || 0) + 1);

  let order = 0;
  let forest = Array.from(counts, ([symbol, frequency]) => ({
    id: `node-${order}`,
    symbol,
    frequency,
    order: order++,
    left: null,
    right: null,
  })).sort(compareNodes);

  const steps = [{
    type: "frequencies",
    title: "Spočítáme výskyt znaků",
    description: "Častější znaky dostanou v Huffmanově stromu kratší kód. Každý lístek stromu zatím představuje jeden znak.",
    forest: makeSnapshot(forest),
    codes: null,
  }];

  while (forest.length > 1) {
    forest.sort(compareNodes);
    const left = forest.shift();
    const right = forest.shift();
    const parent = {
      id: `node-${order}`,
      symbol: null,
      frequency: left.frequency + right.frequency,
      order: order++,
      left,
      right,
    };
    forest.push(parent);
    steps.push({
      type: "merge",
      title: `Spojíme nejméně časté uzly (${left.frequency} + ${right.frequency})`,
      description: "Dva uzly s nejmenším počtem výskytů spojíme do společného rodiče. Jejich četnosti se sečtou.",
      forest: makeSnapshot(forest),
      mergedIds: [left.id, right.id],
      codes: null,
    });
  }

  const root = forest[0];
  const codes = {};
  function assignCodes(node, prefix) {
    if (node.symbol !== null) {
      codes[node.symbol] = prefix || "0";
      return;
    }
    assignCodes(node.left, `${prefix}0`);
    assignCodes(node.right, `${prefix}1`);
  }
  assignCodes(root, "");
  steps.push({
    type: "codes",
    title: "Ze stromu přečteme kódy",
    description: "Při cestě doleva zapisujeme 0 a při cestě doprava 1. Každý znak má vlastní jednoznačnou cestu od kořene k lístku.",
    forest: [root],
    codes,
    tree: root,
  });
  return steps;
}

export function decodeHuffman(input) {
  const symbols = readSymbols(input);
  const encoded = encodeHuffman(input).at(-1);
  const { codes, tree } = encoded;
  const encodedBits = symbols.map((symbol) => codes[symbol]).join("");
  const steps = [{
    type: "decompress-start",
    title: "Začneme číst bitový zápis",
    description: "Huffmanův strom a tabulka kódů nám pomohou poznat, kde jednotlivé znaky v posloupnosti bitů končí.",
    forest: [tree],
    codes,
    encodedBits,
    bitEnd: 0,
    output: "",
  }];
  let output = "";
  let node = tree;
  let bitStart = 0;
  let prefix = "";

  for (let index = 0; index < encodedBits.length; index += 1) {
    const bit = encodedBits[index];
    if (tree.symbol === null) {
      node = bit === "0" ? node.left : node.right;
    }
    prefix += bit;
    if (node.symbol === null) continue;

    output += node.symbol;
    steps.push({
      type: "decode-symbol",
      title: `Našli jsme znak „${node.symbol}“`,
      description: `Kód ${prefix} vede ve stromu k znaku „${node.symbol}“. Přidáme ho do obnoveného textu.`,
      forest: [tree],
      codes,
      encodedBits,
      bitStart,
      bitEnd: index + 1,
      decodedCode: prefix,
      decodedSymbol: node.symbol,
      output,
    });
    node = tree;
    bitStart = index + 1;
    prefix = "";
  }

  steps.push({
    type: "decompress-result",
    title: "Původní text je obnovený",
    description: "Přečetli jsme všechny bity a z každého kódu obnovili příslušný znak.",
    forest: [tree],
    codes,
    encodedBits,
    bitEnd: encodedBits.length,
    output,
  });
  return steps;
}
