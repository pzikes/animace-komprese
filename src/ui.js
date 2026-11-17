import { displaySymbol } from "./algorithms/shared.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function element(tag, attributes = {}, text = null) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "className") node.className = value;
    else if (key === "hidden") node.hidden = value;
    else node.setAttribute(key, value);
  }
  if (text !== null) node.textContent = text;
  return node;
}

function svgElement(tag, attributes = {}, text = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== null) node.textContent = text;
  return node;
}

function createSvg(width, height, label) {
  return svgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": label,
    width,
    height,
  });
}

function renderRle(input, step, direction) {
  if (direction === "decompress") {
    const runs = step.runs || [];
    const output = Array.from(step.output || "");
    const width = Math.max(340, runs.length * 92 + 32, output.length * 52 + 32);
    const svg = createSvg(width, 152, "RLE skupiny a postupně obnovený text");
    svg.append(svgElement("text", { x: 4, y: 17, class: "svg-label" }, "KOMPRIMOVANÝ ZÁPIS"));
    runs.forEach((run, index) => {
      const x = 4 + index * 92;
      const active = index === step.activeRun;
      svg.append(svgElement("rect", {
        x, y: 29, width: 82, height: 38, rx: 7,
        class: active ? "svg-token-active" : "svg-token",
      }));
      svg.append(svgElement("text", {
        x: x + 41, y: 53, "text-anchor": "middle",
        class: active ? "svg-output" : "svg-value",
      }, `${displaySymbol(run.symbol)} × ${run.count}`));
    });
    svg.append(svgElement("text", { x: 4, y: 91, class: "svg-label" }, "OBNOVENÝ TEXT"));
    output.forEach((symbol, index) => {
      const x = 4 + index * 52;
      svg.append(svgElement("rect", { x, y: 103, width: 44, height: 38, rx: 7, class: "svg-token" }));
      svg.append(svgElement("text", {
        x: x + 22, y: 127, "text-anchor": "middle", class: "svg-output",
      }, displaySymbol(symbol)));
    });
    if (!output.length) svg.append(svgElement("text", { x: 4, y: 126, class: "svg-small" }, "Zatím nic"));
    return svg;
  }

  const symbols = Array.from(input);
  const width = Math.max(340, symbols.length * 52 + 32);
  const svg = createSvg(width, 152, "Znaky vstupu a skupiny nalezené metodou RLE");
  svg.append(svgElement("text", { x: 4, y: 17, class: "svg-label" }, "VSTUP"));
  symbols.forEach((symbol, index) => {
    const x = 4 + index * 52;
    const active = index >= step.activeStart && index < step.activeEnd;
    svg.append(svgElement("rect", {
      x, y: 29, width: 44, height: 38, rx: 7,
      class: active ? "svg-token-active" : "svg-token",
    }));
    svg.append(svgElement("text", {
      x: x + 22, y: 53, "text-anchor": "middle",
      class: active ? "svg-output" : "svg-value",
    }, displaySymbol(symbol)));
  });
  svg.append(svgElement("text", { x: 4, y: 91, class: "svg-label" }, "ZAPSANÉ SKUPINY"));
  const runs = step.runs || [];
  let x = 4;
  for (const run of runs) {
    const text = `${displaySymbol(run.symbol)} × ${run.count}`;
    const tokenWidth = Math.max(64, text.length * 7 + 20);
    svg.append(svgElement("rect", { x, y: 103, width: tokenWidth, height: 31, rx: 7, class: "svg-token" }));
    svg.append(svgElement("text", {
      x: x + tokenWidth / 2, y: 123, "text-anchor": "middle", class: "svg-output",
    }, text));
    x += tokenWidth + 7;
  }
  if (!runs.length) {
    svg.append(svgElement("text", { x: 4, y: 122, class: "svg-small" }, "Zatím žádná skupina"));
  }
  return svg;
}

function layoutTree(root, xStart, yStart, gap, positions, edges, depth = 0) {
  const y = yStart + depth * 66;
  if (root.symbol !== null) {
    const position = { x: xStart, y, node: root };
    positions.push(position);
    return { x: xStart, y };
  }
  const leftLeaves = layoutTree(root.left, xStart, yStart, gap, positions, edges, depth + 1);
  const rightLeaves = layoutTree(root.right, xStart + gap * countLeafNodes(root.left), yStart, gap, positions, edges, depth + 1);
  const center = { x: (leftLeaves.x + rightLeaves.x) / 2, y, node: root };
  positions.push(center);
  edges.push({ from: center, to: leftLeaves, label: "0" }, { from: center, to: rightLeaves, label: "1" });
  return center;
}

function countLeafNodes(node) {
  return node.symbol === null ? countLeafNodes(node.left) + countLeafNodes(node.right) : 1;
}

function renderHuffman(step) {
  const roots = step.forest || [];
  const leafTotal = roots.reduce((total, root) => total + countLeafNodes(root), 0);
  const width = Math.max(340, leafTotal * 84 + 32);
  const positions = [];
  const edges = [];
  let x = 42;
  for (const root of roots) {
    const leaves = countLeafNodes(root);
    const treePositions = [];
    layoutTree(root, x + ((leaves - 1) * 84) / 2, 40, 84, treePositions, edges);
    positions.push(...treePositions);
    x += leaves * 84 + 10;
  }
  const deepest = positions.reduce((max, point) => Math.max(max, point.y), 40);
  const height = Math.max(140, deepest + 56);
  const svg = createSvg(width, height, "Huffmanův strom a četnosti znaků");

  for (const edge of edges) {
    svg.append(svgElement("line", {
      x1: edge.from.x, y1: edge.from.y + 21, x2: edge.to.x, y2: edge.to.y - 20, class: "svg-edge",
    }));
    svg.append(svgElement("text", {
      x: (edge.from.x + edge.to.x) / 2 + 5,
      y: (edge.from.y + edge.to.y) / 2,
      class: "svg-small",
    }, edge.label));
  }
  for (const point of positions) {
    const node = point.node;
    const active = step.mergedIds && step.mergedIds.includes(node.id);
    svg.append(svgElement("circle", {
      cx: point.x, cy: point.y, r: 21, class: active ? "svg-node-active" : "svg-node",
    }));
    if (node.symbol !== null) {
      svg.append(svgElement("text", {
        x: point.x, y: point.y - 2, "text-anchor": "middle", class: "svg-value",
      }, displaySymbol(node.symbol)));
      svg.append(svgElement("text", {
        x: point.x, y: point.y + 12, "text-anchor": "middle", class: "svg-label",
      }, String(node.frequency)));
    } else {
      svg.append(svgElement("text", {
        x: point.x, y: point.y + 4, "text-anchor": "middle", class: "svg-value",
      }, String(node.frequency)));
    }
  }
  return svg;
}

function renderLzw(input, step) {
  const direction = step.encodedCodes ? "decompress" : "compress";
  const symbols = Array.from(input);
  const codes = step.encodedCodes || [];
  const svgWidth = direction === "decompress"
    ? Math.max(340, codes.length * 52 + 24)
    : Math.max(340, symbols.length * 37 + 24);
  const dict = step.dictionary || [];
  const columns = Math.max(1, Math.min(5, Math.floor(svgWidth / 125)));
  const rows = Math.ceil(dict.length / columns);
  const height = direction === "decompress" ? 140 : Math.max(145, 130 + rows * 37);
  const svg = createSvg(svgWidth, height, direction === "decompress"
    ? "LZW kódy a obnovovaný text"
    : "LZW vstup, slovník a vytvořené kódy");
  if (direction === "decompress") {
    svg.append(svgElement("text", { x: 4, y: 15, class: "svg-label" }, "KÓDY KE ČTENÍ"));
    codes.forEach((code, index) => {
      const x = 4 + index * 52;
      const active = index === step.codeIndex;
      svg.append(svgElement("rect", {
        x, y: 24, width: 44, height: 30, rx: 6,
        class: active ? "svg-token-active" : "svg-token",
      }));
      svg.append(svgElement("text", {
        x: x + 22, y: 43, "text-anchor": "middle",
        class: active ? "svg-output" : "svg-value",
      }, String(code)));
    });
  } else {
    svg.append(svgElement("text", { x: 4, y: 15, class: "svg-label" }, "VSTUP"));
    symbols.forEach((symbol, index) => {
      const x = 4 + index * 37;
      svg.append(svgElement("rect", {
        x, y: 24, width: 31, height: 30, rx: 6,
        class: index === step.examinedIndex ? "svg-token-active" : "svg-token",
      }));
      svg.append(svgElement("text", {
        x: x + 15.5, y: 43, "text-anchor": "middle",
        class: index === step.examinedIndex ? "svg-output" : "svg-value",
      }, displaySymbol(symbol)));
    });
  }

  if (direction === "compress") {
    svg.append(svgElement("text", { x: 4, y: 76, class: "svg-label" }, "SLOVNÍK"));
    dict.forEach((entry, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = 4 + col * (svgWidth / columns);
      const y = 87 + row * 36;
      const isAdded = entry.phrase === step.addedPhrase;
      svg.append(svgElement("rect", {
        x, y, width: svgWidth / columns - 7, height: 29, rx: 6,
        class: isAdded ? "svg-token-active" : "svg-token",
      }));
      svg.append(svgElement("text", { x: x + 8, y: y + 19, class: "svg-value" }, `${entry.code}  ${entry.phrase}`));
    });
  }
  const outputY = direction === "decompress" ? 77 : 103 + rows * 36;
  svg.append(svgElement("text", {
    x: 4, y: outputY, class: "svg-label",
  }, direction === "decompress" ? "OBNOVENÝ TEXT" : "VYDANÉ KÓDY"));
  const output = step.output || [];
  svg.append(svgElement("text", { x: 4, y: outputY + 23, class: "svg-output" },
    direction === "decompress"
      ? (output || "Zatím nic")
      : (output.length ? output.join("  ·  ") : "Zatím žádný kód")));
  return svg;
}

function makeDetails(state, step) {
  const details = element("div", { className: "step-details" });
  if (state.method === "huffman" && step.codes) {
    const heading = element("p", { className: "svg-label" }, "VÝSLEDNÉ KÓDY");
    const list = element("div", { className: "code-list" });
    for (const [symbol, code] of Object.entries(step.codes)) {
      list.append(element("span", { className: "code-item" }, `${displaySymbol(symbol)} → ${code}`));
    }
    details.append(heading, list);
    if (state.direction === "decompress") {
      const bits = element("p", { className: "bit-stream" }, "Bitový zápis: ");
      Array.from(step.encodedBits || "").forEach((bit, index) => {
        const status = index >= (step.bitStart ?? step.bitEnd ?? 0) && index < (step.bitEnd || 0)
          ? "bit-active"
          : index < (step.bitEnd || 0) ? "bit-done" : "";
        bits.append(element("span", { className: status }, bit));
      });
      details.append(
        bits,
        element("p", { className: "decoded-text" }, `Obnovený text: ${step.output || "Zatím nic"}`),
      );
    }
  }
  if (state.method === "lzw" && state.direction === "compress" && step.addedPhrase) {
    details.append(element("p", { className: "lzw-note" },
      `Nová položka: „${step.addedPhrase}“ → kód ${step.addedCode}`));
  }
  return details;
}

export function renderApp(state) {
  document.querySelectorAll("[data-method]").forEach((button) => {
    const selected = button.dataset.method === state.method;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelectorAll("[data-direction]").forEach((button) => {
    const selected = button.dataset.direction === state.direction;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.getElementById("input-label").textContent = state.direction === "compress"
    ? "Text ke kompresi"
    : "Původní text pro ukázku dekomprese";
  document.getElementById("direction-help").textContent = state.direction === "compress"
    ? "Sleduj, jak se znaky z původního textu ukládají úsporněji."
    : "Aplikace text nejprve zakóduje a potom ukáže, jak se z uložených dat obnoví.";
  const input = document.getElementById("text-input");
  if (input.value !== state.input && document.activeElement !== input) input.value = state.input;
  document.getElementById("character-count").textContent = `${Array.from(input.value).length} / 40`;
  const error = document.getElementById("error-message");
  error.textContent = state.error || "";
  error.hidden = !state.error;

  const step = state.steps[state.stepIndex];
  if (!step) {
    document.getElementById("step-counter").textContent = "Bez kroků";
    document.getElementById("step-kicker").textContent = "ANIMACE POSTUPU";
    document.getElementById("step-title").textContent = "Uprav vstup a zkus to znovu";
    document.getElementById("step-description").textContent = "Po zadání platného textu se zde objeví kroky komprese.";
    document.getElementById("visualization").replaceChildren();
    document.getElementById("previous-button").disabled = true;
    document.getElementById("next-button").disabled = true;
    document.getElementById("play-button").disabled = true;
    return;
  }
  document.getElementById("step-counter").textContent = `Krok ${state.stepIndex + 1} z ${state.steps.length}`;
  document.getElementById("step-kicker").textContent = state.method === "rle" ? "RUN-LENGTH ENCODING"
    : state.method === "huffman" ? "HUFFMANOVO KÓDOVÁNÍ" : "LZW";
  document.getElementById("step-title").textContent = step.title;
  document.getElementById("step-description").textContent = step.description;
  const visualization = document.getElementById("visualization");
  visualization.replaceChildren(
    state.method === "rle" ? renderRle(state.input, step, state.direction)
      : state.method === "huffman" ? renderHuffman(step)
        : renderLzw(state.input, step),
    makeDetails(state, step),
  );

  const atStart = state.stepIndex === 0;
  const atEnd = state.stepIndex >= state.steps.length - 1;
  document.getElementById("previous-button").disabled = atStart || state.playing;
  document.getElementById("next-button").disabled = atEnd || state.playing;
  const play = document.getElementById("play-button");
  play.disabled = state.steps.length < 2 || (atEnd && !state.playing);
  play.innerHTML = state.playing ? '<span aria-hidden="true">Ⅱ</span> Pozastavit' : '<span aria-hidden="true">▶</span> Přehrát';
  document.getElementById("speed-select").value = String(state.speed);
}

export function bindUi(actions) {
  document.getElementById("text-input").addEventListener("input", (event) => {
    document.getElementById("character-count").textContent = `${Array.from(event.currentTarget.value).length} / 40`;
  });
  document.getElementById("input-form").addEventListener("submit", (event) => {
    event.preventDefault();
    actions.load(document.querySelector("#text-input").value);
  });
  document.querySelectorAll("[data-method]").forEach((button) => {
    button.addEventListener("click", () => actions.selectMethod(button.dataset.method));
  });
  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => actions.selectDirection(button.dataset.direction));
  });
  document.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => actions.load(button.dataset.example));
  });
  document.getElementById("previous-button").addEventListener("click", actions.previous);
  document.getElementById("next-button").addEventListener("click", actions.next);
  document.getElementById("play-button").addEventListener("click", actions.togglePlay);
  document.getElementById("speed-select").addEventListener("change", (event) => {
    actions.setSpeed(Number(event.currentTarget.value));
  });
}
