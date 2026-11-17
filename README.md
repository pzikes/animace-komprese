# Komprese dat – interaktivní průvodce

Malá výuková aplikace pro žáky 8. a 9. ročníku. Vysvětluje RLE, Huffmanovo kódování a LZW pomocí krokových animací v SVG, včetně opačného postupu dekomprese.

## Spuštění

Aplikace používá JavaScript ES Modules, proto ji otevřete přes lokální HTTP server (ne přímo přes `file://`). Například:

```powershell
python -m http.server 8000
```

Potom otevřete `http://localhost:8000`.

V režimu dekomprese slouží zadaný text jako výukový příklad: aplikace z něj nejprve vytvoří komprimovaný zápis a potom krok za krokem ukáže jeho rozbalení. U Huffmanova kódování zobrazuje strom a u LZW počáteční abecedu potřebnou k obnovení dat.

## Ověření algoritmů a stavu

Vyžaduje Node.js s podporou vestavěného test runneru:

```powershell
npm test
```

Vstup je omezen na 40 znaků na jednom řádku, aby zůstala animace čitelná.
