import test from "node:test";
import assert from "node:assert/strict";
import { decodeRle, encodeRle } from "../src/algorithms/rle.js";
import { decodeHuffman, encodeHuffman } from "../src/algorithms/huffman.js";
import { decodeLzw, encodeLzw } from "../src/algorithms/lzw.js";

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

test("RLE decompression restores the source one run at a time", () => {
  const steps = decodeRle("AAABBC");
  assert.equal(steps[1].output, "AAA");
  assert.equal(steps.at(-1).output, "AAABBC");
});

test("Huffman decompression reads variable-length codes and handles one symbol", () => {
  for (const input of ["BANANA", "AAAA", "Z"]) {
    assert.equal(decodeHuffman(input).at(-1).output, input);
  }
});

test("LZW decompression restores text without exposing its work dictionary", () => {
  for (const input of ["ABABABA", "BANANA", "AAAA", "Z", "ABRACADABRA"]) {
    const steps = decodeLzw(input);
    assert.equal(steps.at(-1).output, input);
    assert.ok(steps.every((step) => !("dictionary" in step)));
  }
});
