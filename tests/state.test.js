import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, reduceState } from "../src/state.js";

test("loading a new animation resets playback and step position", () => {
  const state = {
    ...createInitialState(),
    stepIndex: 2,
    playing: true,
    error: "old error",
  };
  const next = reduceState(state, {
    type: "LOAD",
    method: "lzw",
    input: "AB",
    steps: [{}, {}],
  });
  assert.equal(next.method, "lzw");
  assert.equal(next.stepIndex, 0);
  assert.equal(next.playing, false);
  assert.equal(next.error, null);
});

test("playback stops on the final step", () => {
  const state = {
    ...createInitialState(),
    steps: [{}, {}],
    stepIndex: 0,
    playing: true,
  };
  const next = reduceState(state, { type: "NEXT" });
  assert.equal(next.stepIndex, 1);
  assert.equal(next.playing, false);
});

test("invalid input clears steps from the previous animation", () => {
  const state = {
    ...createInitialState(),
    steps: [{}, {}],
    stepIndex: 1,
  };
  const next = reduceState(state, {
    type: "ERROR",
    method: "lzw",
    input: "",
    message: "Zadej alespoň jeden znak.",
  });
  assert.equal(next.method, "lzw");
  assert.equal(next.input, "");
  assert.deepEqual(next.steps, []);
  assert.equal(next.error, "Zadej alespoň jeden znak.");
});
