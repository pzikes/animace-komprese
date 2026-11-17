import test from "node:test";
import assert from "node:assert/strict";
import { encodeRle } from "../src/algorithms/rle.js";
import { encodeHuffman } from "../src/algorithms/huffman.js";
import { encodeLzw } from "../src/algorithms/lzw.js";

test("RLE groups adjacent equal symbols and leaves singletons intact", () => {
  const steps = encodeRle("AAABBC");
  const result = steps.at(-1);
  assert.deepEqual(result.runs, [
    { symbol: "A", count: 3 },
    { symbol: "B", count: 2 },
    { symbol: "C", count: 1 },
  ]);
});

test("RLE treats Unicode code points as symbols", () => {
  assert.deepEqual(encodeRle("😀😀x").at(-1).runs, [
    { symbol: "😀", count: 2 },
    { symbol: "x", count: 1 },
  ]);
});

test("Huffman codes cover every symbol and are prefix-free", () => {
  const steps = encodeHuffman("BANANA");
  const codes = steps.at(-1).codes;
  assert.deepEqual(Object.keys(codes).sort(), ["A", "B", "N"]);
  for (const [symbol, code] of Object.entries(codes)) {
    for (const [otherSymbol, otherCode] of Object.entries(codes)) {
      if (symbol !== otherSymbol) assert.equal(otherCode.startsWith(code), false);
    }
  }
});

test("Huffman assigns a usable code when the input has one unique symbol", () => {
  assert.deepEqual(encodeHuffman("AAAA").at(-1).codes, { A: "0" });
});

test("LZW builds dictionary entries and emits the final phrase code", () => {
  const steps = encodeLzw("ABABABA");
  const result = steps.at(-1);
  assert.ok(result.dictionary.some((entry) => entry.phrase === "AB"));
  assert.ok(result.dictionary.some((entry) => entry.phrase === "ABA"));
  assert.deepEqual(result.output, [0, 1, 2, 4]);
});

test("all encoders reject empty input, line breaks, and inputs over the limit", () => {
  for (const encode of [encodeRle, encodeHuffman, encodeLzw]) {
    assert.throws(() => encode(""), /alespoň jeden znak/);
    assert.throws(() => encode("A\nB"), /jednom řádku/);
    assert.throws(() => encode("A".repeat(41)), /nejvýše 40/);
  }
});
