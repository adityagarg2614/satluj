import type { DaybookEntryDocument } from "@/models/daybook-entry";

export const WEIGHT_UNIT_LABEL = "MT";
export const RECOVERED_METAL_RETURN_RATE = 0.014;

const JINDAL_RECOVERY_MATERIALS = new Set([
  "slag lumps",
  "slag mix",
  "slag 200 mm",
]);

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getWeightValue(value: number | null | undefined) {
  return Number(value ?? 0);
}

export function isEligibleJindalRecoveryPurchase(entry: Pick<
  DaybookEntryDocument,
  "type" | "partyName" | "materialSource" | "materialName"
>) {
  if (entry.type !== "purchase") {
    return false;
  }

  const materialSource = normalizeText(entry.materialSource);
  const partyName = normalizeText(entry.partyName);
  const materialName = normalizeText(entry.materialName);

  const isJindalSource =
    materialSource === "jindal" || partyName === "jindal stainless steel";

  return isJindalSource && JINDAL_RECOVERY_MATERIALS.has(materialName);
}

export function isRecoveredMetalReturnSale(entry: Pick<
  DaybookEntryDocument,
  "type" | "materialName"
>) {
  return (
    entry.type === "sale" &&
    normalizeText(entry.materialName) === "revert scrap metal"
  );
}

export function calculateRecoveredMetalSnapshot(
  entries: Array<
    Pick<
      DaybookEntryDocument,
      "type" | "partyName" | "materialSource" | "materialName" | "weight"
    >
  >,
) {
  const eligiblePurchaseWeight = entries.reduce((sum, entry) => {
    return sum + (isEligibleJindalRecoveryPurchase(entry) ? getWeightValue(entry.weight) : 0);
  }, 0);

  const generatedRecoveredMetal = eligiblePurchaseWeight * RECOVERED_METAL_RETURN_RATE;

  const returnedRecoveredMetal = entries.reduce((sum, entry) => {
    return sum + (isRecoveredMetalReturnSale(entry) ? getWeightValue(entry.weight) : 0);
  }, 0);

  const outstandingRecoveredMetal = generatedRecoveredMetal - returnedRecoveredMetal;

  return {
    eligiblePurchaseWeight,
    generatedRecoveredMetal,
    returnedRecoveredMetal,
    outstandingRecoveredMetal,
  };
}
