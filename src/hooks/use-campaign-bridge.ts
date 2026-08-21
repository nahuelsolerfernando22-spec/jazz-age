import { useEffect, useRef } from "react";
import { useCasino } from "@/store/casino";
import { CAMPAIGN_STORES, type CampaignGameId } from "@/lib/campaign-themes";

export function useCampaignBridge(gameId: CampaignGameId): void {
  const chips = useCasino((s) => s.chips);
  const lastChips = useRef<number>(chips);

  useEffect(() => {
    lastChips.current = chips;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const store = CAMPAIGN_STORES[gameId];
    const active = store.getState().activeLevel;
    const delta = chips - lastChips.current;
    lastChips.current = chips;
    if (active && delta !== 0) {
      store.getState().bumpChips(delta);
    }
  }, [chips, gameId]);

  useEffect(() => {
    const store = CAMPAIGN_STORES[gameId];
    const id = window.setInterval(() => {
      if (store.getState().activeLevel) store.getState().tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameId]);
}

export function bumpCampaignEvent(gameId: CampaignGameId, amount = 1): void {
  try {
    CAMPAIGN_STORES[gameId].getState().bumpEvents(amount);
  } catch {}
}
