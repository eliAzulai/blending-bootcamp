import type { BankWord } from "./types";

const w = (word: string, accept: string[] = []): BankWord => ({
  word,
  phonemes: word.split(""),
  accept,
});

/** Item bank: 4-6 decodable CVC words per family concept (spec C3). */
export const ITEM_BANK: Record<string, BankWord[]> = {
  at: [w("cat"), w("hat"), w("mat", ["matt"]), w("bat"), w("rat"), w("sat")],
  an: [w("man"), w("pan"), w("fan"), w("can"), w("van"), w("ran")],
  ap: [w("cap"), w("map"), w("nap"), w("tap"), w("lap")],
  ag: [w("bag"), w("tag"), w("rag"), w("wag"), w("sag")],
  it: [w("sit"), w("bit"), w("hit"), w("fit"), w("pit")],
  in: [w("pin"), w("win"), w("tin"), w("bin"), w("fin")],
  ig: [w("pig"), w("big"), w("dig"), w("wig"), w("fig")],
  ip: [w("lip"), w("hip"), w("dip"), w("rip"), w("sip"), w("zip")],
  op: [w("hop"), w("top"), w("mop"), w("pop"), w("cop")],
  ot: [w("hot"), w("pot"), w("dot"), w("not", ["knot"]), w("got")],
  og: [w("dog"), w("log"), w("fog"), w("hog"), w("jog")],
  ug: [w("bug"), w("hug"), w("rug"), w("mug"), w("jug"), w("tug")],
  un: [w("sun", ["son"]), w("run"), w("fun"), w("bun"), w("nun", ["none"])],
  ut: [w("cut"), w("nut"), w("hut"), w("but", ["butt"]), w("rut")],
  et: [w("pet"), w("wet"), w("net"), w("get"), w("jet"), w("vet")],
  en: [w("hen"), w("ten"), w("pen"), w("men"), w("den")],
  ed: [w("bed"), w("red", ["read"]), w("fed"), w("led", ["lead"]), w("wed")],
};
