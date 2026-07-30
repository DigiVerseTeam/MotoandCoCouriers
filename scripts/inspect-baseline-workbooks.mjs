import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const files = [
  "MotoCo_Unified_BOAS_Hierarchy_v1.9.xlsx",
  "SOP/SOP-BIL-01-MonthEndBillingReview-v1.2.xlsx",
  "SOP/SOP-BIL-04-CreateSendInvoice-v1.2.xlsx",
  "SOP/SOP-PUP-02-ConfirmCustomerPickup-v1.1.xlsx",
  "SOP/SOP-DEL-04-DeliverySignOffProof-v1.2.xlsx",
  "SOP/SOP-DEL-05-DeliveryCompletion-v1.1.xlsx",
  "SOP/SOP-RUN-04-BringForwardPickup-v1.1.xlsx",
  "SOP/SOP-MDM-01-SupplierMasterDataMaintenance-v1.1.xlsx",
  "SOP/SOP-MDM-02-CourierItemPricingMasterData-v1.1.xlsx",
];

for (const file of files) {
  const blob = await FileBlob.load(file);
  const workbook = await SpreadsheetFile.importXlsx(blob);
  const inspect = await workbook.inspect({
    kind: "workbook,sheet,table",
    maxChars: 6000,
    tableMaxRows: 3,
    tableMaxCols: 6,
    tableMaxCellChars: 80,
  });
  console.log(`--- ${file}`);
  console.log(inspect.ndjson);
}
