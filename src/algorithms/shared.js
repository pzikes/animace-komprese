export const MAX_INPUT_LENGTH = 40;

export function readSymbols(input) {
  if (typeof input !== "string" || input.length === 0) {
    throw new Error("Zadej alespoň jeden znak.");
  }
  const symbols = Array.from(input);
  if (symbols.length > MAX_INPUT_LENGTH) {
    throw new Error(`Vstup může mít nejvýše ${MAX_INPUT_LENGTH} znaků.`);
  }
  if (symbols.some((symbol) => symbol === "\n" || symbol === "\r")) {
    throw new Error("Vstup musí být na jednom řádku.");
  }
  return symbols;
}

export function displaySymbol(symbol) {
  if (symbol === " ") return "mezera";
  if (symbol === "\t") return "tab";
  return symbol;
}
