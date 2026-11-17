import { encodeRle } from "./algorithms/rle.js";
import { encodeHuffman } from "./algorithms/huffman.js";
import { encodeLzw } from "./algorithms/lzw.js";
import { createInitialState, reduceState } from "./state.js";
import { bindUi, renderApp } from "./ui.js";

const algorithms = {
  rle: encodeRle,
  huffman: encodeHuffman,
  lzw: encodeLzw,
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

function load(method, input) {
  let steps;
  try {
    steps = algorithms[method](input);
  } catch (error) {
    dispatch({
      type: "ERROR",
      method,
      input,
      message: error instanceof Error ? error.message : "Vstup se nepodařilo zpracovat.",
    });
    return;
  }
  dispatch({ type: "LOAD", method, input, steps });
}

bindUi({
  load: (input) => load(state.method, input),
  selectMethod: (method) => {
    const input = document.getElementById("text-input").value;
    load(algorithms[method] ? method : state.method, input);
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

load(state.method, state.input);
