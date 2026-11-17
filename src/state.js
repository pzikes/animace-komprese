export function createInitialState() {
  return {
    method: "rle",
    direction: "compress",
    input: "AAABBC",
    steps: [],
    stepIndex: 0,
    playing: false,
    speed: 900,
    error: null,
  };
}

export function reduceState(state, action) {
  switch (action.type) {
    case "LOAD":
      return {
        ...state,
        method: action.method,
        direction: action.direction,
        input: action.input,
        steps: action.steps,
        stepIndex: 0,
        playing: false,
        error: null,
      };
    case "ERROR":
      return {
        ...state,
        method: action.method,
        direction: action.direction,
        input: action.input,
        steps: [],
        stepIndex: 0,
        playing: false,
        error: action.message,
      };
    case "NEXT": {
      const stepIndex = Math.min(state.stepIndex + 1, state.steps.length - 1);
      return { ...state, stepIndex, playing: state.playing && stepIndex < state.steps.length - 1 };
    }
    case "PREVIOUS":
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1), playing: false };
    case "TOGGLE_PLAY":
      return {
        ...state,
        playing: state.steps.length > 1 && (state.stepIndex === state.steps.length - 1 ? false : !state.playing),
      };
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    default:
      return state;
  }
}
