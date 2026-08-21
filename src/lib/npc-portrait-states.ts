import { portraitFor, PLACEHOLDER_PORTRAIT } from "./npc-portraits";
import { getMood, type Mood } from "./hostess-mood";

import bettiePortrait from "@/assets/bettie-portrait.webp";
import bettieWin from "@/assets/bettie-win.webp";
import bettieLose from "@/assets/bettie-lose.webp";
import bettieAngry from "@/assets/bettie-angry.webp";
import bettieThinking from "@/assets/bettie-thinking.webp";
const bettieSmile = bettiePortrait;
const bettieSad = bettieLose;

import claraPortrait from "@/assets/clara-portrait.webp";
import claraWin from "@/assets/clara-win.webp";
import claraLose from "@/assets/clara-lose.webp";
import claraAngry from "@/assets/clara-angry.webp";
import claraThinking from "@/assets/clara-thinking.webp";
const claraSmile = claraPortrait;
const claraHappy = claraPortrait;
const claraSad = claraLose;

import eulaliaPortrait from "@/assets/eulalia-portrait.webp";
import eulaliaWin from "@/assets/eulalia-win.webp";
import eulaliaLose from "@/assets/eulalia-lose.webp";
import eulaliaAngry from "@/assets/eulalia-angry.webp";
import eulaliaThinking from "@/assets/eulalia-thinking.webp";
const eulaliaSmile = eulaliaPortrait;
const eulaliaSad = eulaliaLose;

import jadePortrait from "@/assets/jade-portrait.webp";
import jadeWin from "@/assets/jade-win.webp";
import jadeLose from "@/assets/jade-lose.webp";
import jadeAngry from "@/assets/jade-angry.webp";
import jadeThinking from "@/assets/jade-thinking.webp";
const jadeHappy = jadePortrait;
const jadeSmile = jadePortrait;
const jadeSad = jadeLose;

import linPortrait from "@/assets/lin-portrait.webp";
import linWin from "@/assets/lin-win.webp";
import linLose from "@/assets/lin-lose.webp";
import linAngry from "@/assets/lin-angry.webp";
import linThinking from "@/assets/lin-thinking.webp";
const linSmile = linPortrait;
const linSad = linLose;

import lolaPortrait from "@/assets/lola-portrait.webp";
import lolaWin from "@/assets/lola-win.webp";
import lolaLose from "@/assets/lola-lose.webp";
import lolaAngry from "@/assets/lola-angry.webp";
import lolaThinking from "@/assets/lola-thinking.webp";
const lolaSmile = lolaPortrait;
const lolaSad = lolaLose;

import luisaPortrait from "@/assets/luisa-portrait.webp";
import luisaWin from "@/assets/luisa-win.webp";
import luisaLose from "@/assets/luisa-lose.webp";
import luisaAngry from "@/assets/luisa-angry.webp";
import luisaThinking from "@/assets/luisa-thinking.webp";
const luisaSmile = luisaPortrait;
const luisaSad = luisaLose;
const luisaShocked = luisaLose;

import opalPortrait from "@/assets/opal-portrait.webp";
import opalWin from "@/assets/opal-win.webp";
import opalLose from "@/assets/opal-lose.webp";
import opalAngry from "@/assets/opal-angry.webp";
import opalThinking from "@/assets/opal-thinking.webp";
const opalHappy = opalPortrait;
const opalSmile = opalPortrait;
const opalSad = opalLose;

import salomePortrait from "@/assets/salome-portrait.webp";
import salomeWin from "@/assets/salome-win.webp";
import salomeLose from "@/assets/salome-lose.webp";
import salomeAngry from "@/assets/salome-angry.webp";
import salomeThinking from "@/assets/salome-thinking.webp";
const salomeSmile = salomePortrait;
const salomeSad = salomeLose;

import shaunaPortrait from "@/assets/shauna-portrait.webp";
import shaunaWin from "@/assets/shauna-win.webp";
import shaunaLose from "@/assets/shauna-lose.webp";
import shaunaAngry from "@/assets/shauna-angry.webp";
import shaunaThinking from "@/assets/shauna-thinking.webp";
const shaunaSmile = shaunaPortrait;
const shaunaSad = shaunaLose;

import vitaPortrait from "@/assets/vita-portrait.webp";
import vitaWin from "@/assets/vita-win.webp";
import vitaLose from "@/assets/vita-lose.webp";
import vitaAngry from "@/assets/vita-angry.webp";
import vitaThinking from "@/assets/vita-thinking.webp";
const vitaSmile = vitaPortrait;
const vitaSad = vitaLose;

import zeldaPortrait from "@/assets/zelda-portrait.webp";
import zeldaWin from "@/assets/zelda-win.webp";
import zeldaLose from "@/assets/zelda-lose.webp";
import zeldaAngry from "@/assets/zelda-angry.webp";
import zeldaThinking from "@/assets/zelda-thinking.webp";
const zeldaSmile = zeldaPortrait;
const zeldaSad = zeldaLose;

export type PortraitState =
  "idle" | "happy" | "smile" | "win" | "lose" | "sad" | "angry" | "shocked" | "thinking";

type PortraitSlot = Partial<Record<PortraitState, string>>;

const SLOTS: Record<string, PortraitSlot> = {
  bettie: {
    angry: bettieAngry,
    sad: bettieSad,
    smile: bettieSmile,
    happy: bettieSmile,
    win: bettieWin,
    lose: bettieLose,
    thinking: bettieThinking,
  },
  clara: {
    sad: claraSad,
    smile: claraSmile,
    happy: claraHappy,
    win: claraWin,
    lose: claraLose,
    angry: claraAngry,
    thinking: claraThinking,
  },
  eulalia: {
    angry: eulaliaAngry,
    sad: eulaliaSad,
    smile: eulaliaSmile,
    happy: eulaliaSmile,
    win: eulaliaWin,
    lose: eulaliaLose,
    thinking: eulaliaThinking,
  },
  jade: {
    angry: jadeAngry,
    sad: jadeSad,
    smile: jadeSmile,
    happy: jadeHappy,
    win: jadeWin,
    lose: jadeLose,
    thinking: jadeThinking,
  },
  lin: {
    angry: linAngry,
    sad: linSad,
    smile: linSmile,
    happy: linSmile,
    win: linWin,
    lose: linLose,
    thinking: linThinking,
  },
  lola: {
    angry: lolaAngry,
    sad: lolaSad,
    smile: lolaSmile,
    happy: lolaSmile,
    win: lolaWin,
    lose: lolaLose,
    thinking: lolaThinking,
  },
  luisa: {
    angry: luisaAngry,
    sad: luisaSad,
    smile: luisaSmile,
    happy: luisaSmile,
    win: luisaWin,
    lose: luisaLose,
    shocked: luisaShocked,
    thinking: luisaThinking,
  },
  opal: {
    angry: opalAngry,
    sad: opalSad,
    smile: opalSmile,
    happy: opalHappy,
    lose: opalLose,
    thinking: opalThinking,
    win: opalWin,
  },
  salome: {
    angry: salomeAngry,
    sad: salomeSad,
    smile: salomeSmile,
    happy: salomeSmile,
    win: salomeWin,
    lose: salomeLose,
    thinking: salomeThinking,
  },
  shauna: {
    angry: shaunaAngry,
    sad: shaunaSad,
    smile: shaunaSmile,
    happy: shaunaSmile,
    win: shaunaWin,
    lose: shaunaLose,
    thinking: shaunaThinking,
  },
  vita: {
    angry: vitaAngry,
    sad: vitaSad,
    smile: vitaSmile,
    happy: vitaSmile,
    win: vitaWin,
    lose: vitaLose,
    thinking: vitaThinking,
  },
  zelda: {
    angry: zeldaAngry,
    sad: zeldaSad,
    smile: zeldaSmile,
    happy: zeldaSmile,
    win: zeldaWin,
    lose: zeldaLose,
    thinking: zeldaThinking,
  },
};

const FALLBACK: Record<PortraitState, PortraitState[]> = {
  idle: ["idle", "happy", "smile"],
  happy: ["happy", "smile", "win", "idle"],
  smile: ["smile", "happy", "idle"],
  win: ["win", "happy", "smile", "idle"],
  lose: ["lose", "sad", "shocked", "idle"],
  sad: ["sad", "lose", "idle"],
  angry: ["angry", "shocked", "idle"],
  shocked: ["shocked", "angry", "lose", "idle"],
  thinking: ["thinking", "idle", "smile", "happy"],
};

export function portraitStateFor(npcId: string, state: PortraitState = "idle"): string {
  const slot = SLOTS[npcId] ?? {};
  for (const key of FALLBACK[state]) {
    if (key === "idle") continue;
    const hit = slot[key];
    if (hit) return hit;
  }
  return portraitFor(npcId) ?? PLACEHOLDER_PORTRAIT;
}

export function portraitStateForMood(mood: Mood): PortraitState {
  switch (mood) {
    case "confiada":
      return "smile";
    case "nerviosa":
      return "thinking";
    case "furiosa":
      return "angry";
    case "aburrida":
      return "thinking";
    default:
      return "idle";
  }
}

export function portraitForMood(npcId: string): string {
  return portraitStateFor(npcId, portraitStateForMood(getMood(npcId)));
}

export function availablePortraitStates(npcId: string): PortraitState[] {
  const slot = SLOTS[npcId] ?? {};
  return (Object.keys(slot) as PortraitState[]).sort();
}
