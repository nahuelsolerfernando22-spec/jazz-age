import { pushMoment, isFirstMeeting, daysSinceLastMoment } from "@/lib/narrative-memory";

export interface OutcomeInput {
  hostessId: string;
  delta?: number;
  streak?: number;
  clutch?: boolean;
  bluffLanded?: boolean;
  bluffCaught?: boolean;
  note?: string;
}

export function recordGameOutcome(input: OutcomeInput): void {
  const { hostessId, delta = 0, streak = 0, clutch, bluffLanded, bluffCaught, note } = input;
  if (!hostessId) return;
  if (isFirstMeeting(hostessId)) pushMoment(hostessId, "first_meeting", note);
  const gap = daysSinceLastMoment(hostessId);
  if (gap !== null && gap >= 7) pushMoment(hostessId, "reunion");
  if (clutch) pushMoment(hostessId, "clutch", note);
  if (bluffLanded) pushMoment(hostessId, "bluff_landed", note);
  if (bluffCaught) pushMoment(hostessId, "bluff_caught", note);
  if (delta >= 500) pushMoment(hostessId, "big_win", note);
  else if (delta <= -500) pushMoment(hostessId, "big_loss", note);
  if (streak >= 3) pushMoment(hostessId, "streak");
}

export function recordGift(hostessId: string, note?: string): void {
  if (hostessId) pushMoment(hostessId, "gift", note);
}

export function recordInsult(hostessId: string, note?: string): void {
  if (hostessId) pushMoment(hostessId, "insult", note);
}
