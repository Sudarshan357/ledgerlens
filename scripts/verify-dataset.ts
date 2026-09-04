import { getDataset } from "../lib/data/generator";
import { CONFIRMED_DISCREPANCY, POTENTIAL_EXPOSURE, AFFECTED_TRANSACTIONS, CONFIRMED_TRANSACTIONS, REVIEW_TRANSACTIONS, AFFECTED_BATCHES, AFFECTED_MERCHANTS } from "../lib/data/constants";

const ds = getDataset();
const affected = ds.transactions.filter((t) => t.affected);
const confirmed = affected.filter((t) => t.confidence === "confirmed");
const review = affected.filter((t) => t.confidence === "review");

const confirmedSum = confirmed.reduce((a, t) => a + t.duplicateAdjustmentAmount, 0);
const totalSum = affected.reduce((a, t) => a + t.duplicateAdjustmentAmount, 0);
const batchIds = new Set(affected.map((t) => t.batchId));
const merchantIds = new Set(affected.map((t) => t.merchantId));

console.log("affected count:", affected.length, "expect", AFFECTED_TRANSACTIONS);
console.log("confirmed count:", confirmed.length, "expect", CONFIRMED_TRANSACTIONS);
console.log("review count:", review.length, "expect", REVIEW_TRANSACTIONS);
console.log("confirmed sum:", confirmedSum, "expect", CONFIRMED_DISCREPANCY);
console.log("total sum:", totalSum, "expect", POTENTIAL_EXPOSURE);
console.log("batches:", batchIds.size, "expect", AFFECTED_BATCHES);
console.log("merchants:", merchantIds.size, "expect", AFFECTED_MERCHANTS);

const featured = affected.find((t) => t.featured)!;
console.log("featured:", featured);

const anyNegative = ds.transactions.some((t) => t.paymentAmount <= 0 || t.expectedSettlement < 0 || t.actualSettlement < 0 || t.fee < 0 || t.tax < 0);
console.log("any negative/invalid amounts:", anyNegative);

const ok =
  affected.length === AFFECTED_TRANSACTIONS &&
  confirmed.length === CONFIRMED_TRANSACTIONS &&
  review.length === REVIEW_TRANSACTIONS &&
  confirmedSum === CONFIRMED_DISCREPANCY &&
  totalSum === POTENTIAL_EXPOSURE &&
  batchIds.size === AFFECTED_BATCHES &&
  merchantIds.size === AFFECTED_MERCHANTS &&
  !anyNegative;

console.log(ok ? "\nPASS" : "\nFAIL");
process.exit(ok ? 0 : 1);
