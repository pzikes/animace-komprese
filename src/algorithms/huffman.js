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
  });
  return steps;
}
