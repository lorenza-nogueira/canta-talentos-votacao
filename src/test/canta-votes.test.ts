import { describe, expect, it } from "vitest";
import { toggleVoteSelection, voterSchema, isVotingOpen } from "@/lib/voting-rules";

describe("CANTA voting rules", () => {
  it("allows any number of distinct talents, including the sixth", () => {
    let votes: Record<number, boolean> = {};
    for (const id of [1, 2, 3, 4, 5, 6]) votes = toggleVoteSelection(votes, id);
    expect(Object.values(votes).filter(Boolean)).toHaveLength(6);
    expect(votes[6]).toBe(true);
  });

  it("does not count a second vote for the same talent", () => {
    const selected = toggleVoteSelection({}, 1);
    expect(toggleVoteSelection(selected, 1)).toEqual({ 1: true });
  });
  it("accepts canta.ag email addresses", () => {
    expect(voterSchema.parse({ name: 'Pessoa CANTA', email: 'pessoa@canta.ag' }).email).toBe('pessoa@canta.ag');
  });
  it("accepts cantacom.com.br email addresses", () => {
    expect(voterSchema.parse({ name: 'Pessoa CANTA', email: 'pessoa@cantacom.com.br' }).email).toBe('pessoa@cantacom.com.br');
  });
  it("rejects non-CANTA email domains and suffix lookalikes", () => {
    for (const email of ['pessoa@gmail.com', 'pessoa@canta.ag.example.com', 'pessoa@fakecanta.ag']) {
      expect(voterSchema.safeParse({ name: 'Pessoa CANTA', email }).success).toBe(false);
    }
  });
  it("requires the voter's name", () => {
    expect(voterSchema.safeParse({ name: '', email: 'pessoa@canta.ag' }).success).toBe(false);
  });
  it("keeps voting open throughout 09/12 São Paulo time", () => {
    expect(isVotingOpen(new Date('2026-12-10T02:59:59.999Z'))).toBe(true);
    expect(isVotingOpen(new Date('2026-12-10T03:00:00.000Z'))).toBe(false);
  });
});