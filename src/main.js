import { encodeRle } from "./algorithms/rle.js";
import { decodeRle } from "./algorithms/rle.js";
import { encodeHuffman } from "./algorithms/huffman.js";
import { decodeHuffman } from "./algorithms/huffman.js";
import { encodeLzw } from "./algorithms/lzw.js";
import { decodeLzw } from "./algorithms/lzw.js";
import { createInitialState, reduceState } from "./state.js";
import { bindUi, renderApp } from "./ui.js";

const algorithms = {
  compress: {
    rle: encodeRle,
    huffman: encodeHuffman,
    lzw: encodeLzw,
  },
  decompress: {
    rle: decodeRle,
    huffman: decodeHuffman,
    lzw: decodeLzw,
  },
};

let state = createInitialState();
let timer = null;

function render() {
  renderApp(state);
}

function dispatch(action) {
  state = reduceState(state, action);
  render();
  syncTimer();
}

function syncTimer() {
  if (!state.playing && timer !== null) {
    window.clearInterval(timer);
    timer = null;
  } else if (state.playing && timer === null) {
    timer = window.setInterval(() => dispatch({ type: "NEXT" }), state.speed);
  }
}

function load(method, direction, input) {
  let steps;
  try {
    steps = algorithms[direction][method](input);
  } catch (error) {
    dispatch({
      type: "ERROR",
      method,
      direction,
      input,
      message: error instanceof Error ? error.message : "Vstup se nepodařilo zpracovat.",
    });
    return;
  }
  dispatch({ type: "LOAD", method, direction, input, steps });
}

bindUi({
  load: (input) => load(state.method, state.direction, input),
  selectMethod: (method) => {
    const input = document.getElementById("text-input").value;
    load(algorithms.compress[method] ? method : state.method, state.direction, input);
  },
  selectDirection: (direction) => {
    const input = document.getElementById("text-input").value;
    load(state.method, direction, input);
  },
  previous: () => dispatch({ type: "PREVIOUS" }),
  next: () => dispatch({ type: "NEXT" }),
  togglePlay: () => dispatch({ type: "TOGGLE_PLAY" }),
  setSpeed: (speed) => {
    dispatch({ type: "SET_SPEED", speed });
    if (state.playing) {
      window.clearInterval(timer);
      timer = null;
      syncTimer();
    }
  },
});

load(state.method, state.direction, state.input);
