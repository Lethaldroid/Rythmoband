import { cleanWords, collapseRepeats, wordsToLines } from "./segment";

const w = (text, start, end) => ({ text, start, end });

describe("wordsToLines", () => {
  it("splits on long pauses", () => {
    const lines = wordsToLines([
      w(" Hello", 0, 0.4),
      w(" there", 0.4, 0.8),
      w(" General", 2.0, 2.5),
      w(" Kenobi", 2.5, 3.0),
    ]);
    expect(lines).toEqual([
      { start: 0, end: 0.8, text: "Hello there" },
      { start: 2.0, end: 3.0, text: "General Kenobi" },
    ]);
  });

  it("splits after a finished sentence", () => {
    const lines = wordsToLines([
      w(" I", 0, 0.3),
      w(" am", 0.3, 0.6),
      w(" here.", 0.6, 1.2),
      w(" You", 1.25, 1.5),
      w(" too", 1.5, 1.9),
    ]);
    expect(lines.map((l) => l.text)).toEqual(["I am here.", "You too"]);
  });

  it("keeps a short exclamation attached instead of making a tiny line", () => {
    const lines = wordsToLines([w(" Oh!", 0, 0.3), w(" Look", 0.35, 0.7), w(" out", 0.7, 1.0)]);
    expect(lines.map((l) => l.text)).toEqual(["Oh! Look out"]);
  });

  it("never exceeds the maximum duration", () => {
    const words = Array.from({ length: 40 }, (_, i) => w(` w${i}`, i * 0.3, i * 0.3 + 0.28));
    const lines = wordsToLines(words, { maxDuration: 3 });
    expect(lines.length).toBeGreaterThan(3);
    lines.forEach((l) => expect(l.end - l.start).toBeLessThanOrEqual(3.01));
  });

  it("breaks at a comma once the line is well filled", () => {
    const lines = wordsToLines(
      [
        w(" One", 0, 1),
        w(" two", 1, 2),
        w(" three,", 2, 4),
        w(" four", 4, 5),
      ],
      { maxDuration: 6 }
    );
    expect(lines.map((l) => l.text)).toEqual(["One two three,", "four"]);
  });

  it("joins scripts without spaces and limits them by character width", () => {
    const words = "星星降落的日子我们一起去看吧".split("").map((c, i) => w(c, i * 0.2, i * 0.2 + 0.2));
    const lines = wordsToLines(words, { maxChars: 16 });
    expect(lines[0].text).toBe("星星降落的日子我");
    expect(lines.map((l) => l.text).join("")).toBe("星星降落的日子我们一起去看吧");
  });

  it("drops punctuation left at the start of a line", () => {
    const lines = wordsToLines([w("人生やだ", 0, 1), w("、来世は", 2, 3), w("東京", 3, 3.5)]);
    expect(lines.map((l) => l.text)).toEqual(["人生やだ", "来世は東京"]);
  });

  it("stretches very short lines without overlapping the next", () => {
    const lines = wordsToLines([w(" Hi", 0, 0.1), w(" Bye", 0.7, 1.5)]);
    expect(lines[0]).toEqual({ start: 0, end: 0.6, text: "Hi" });
    const tight = wordsToLines([w(" Hi", 0, 0.1), w(" Bye", 0.6, 1.5)], { pauseGap: 0.4 });
    expect(tight[0].end).toBeCloseTo(0.6);
  });
});

describe("cleanWords", () => {
  it("drops sound tags, empty and untimed words", () => {
    expect(
      cleanWords([
        w(" [Music]", 0, 1),
        w(" (laughs)", 1, 2),
        w(" ", 2, 3),
        w(" what", null, 3),
        w(" yes", 4, 4.5),
      ])
    ).toEqual([w(" yes", 4, 4.5)]);
  });

  it("keeps a final word whose end time is missing", () => {
    expect(cleanWords([w(" end", 5, null)])).toEqual([w(" end", 5, 5.3)]);
  });
});

describe("collapseRepeats", () => {
  const seq = (texts) => texts.map((t, i) => w(t, i, i + 1));
  const text = (words) => words.map((x) => x.text).join("");

  it("collapses a looping phrase to one occurrence", () => {
    const loop = seq(["那些", "人", "都", "不在乎", "那些", "人", "都", "不在乎", "那些", "人", "都", "不在乎", "。", "好"]);
    expect(text(collapseRepeats(loop))).toBe("那些人都不在乎。好");
  });

  it("ignores punctuation and case when comparing", () => {
    const loop = seq([" Go", " home.", " go", " home,", " Go", " home!", " now"]);
    expect(text(collapseRepeats(loop))).toBe(" Go home. now");
  });

  it("keeps short real repetition", () => {
    const words = seq([" no,", " no,", " no!", " stop", " it", " stop", " it"]);
    expect(collapseRepeats(words)).toHaveLength(7);
  });

  it("collapses a single word repeated many times", () => {
    expect(text(collapseRepeats(seq(["啊", "啊", "啊", "啊", "啊", "啊", "你"])))).toBe("啊你");
  });
});
