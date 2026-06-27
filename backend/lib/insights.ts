import { asNumber, query } from "./db";
import { getAverageSpendForVendor, recommendLowerCostVendor } from "./contracts";

function daysUntil(date: Date | string) {
  const end = new Date(date).getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end - now.getTime()) / 86_400_000);
}

export async function getContractInsights() {
  const contracts = await query<{
    id: string;
    vendor_id: string;
    vendor_name: string;
    value: string;
    end_date: string;
    category: string;
  }>(
    `SELECT c.id, c.vendor_id, v.name AS vendor_name, c.value, c.end_date, c.category
     FROM contracts c
     JOIN vendors v ON v.id = c.vendor_id
     ORDER BY c.end_date ASC`
  );

  return Promise.all(
    contracts.map(async (contract) => {
      const averageSpend = await getAverageSpendForVendor(contract.vendor_id);
      const value = asNumber(contract.value);
      const expiringSoon = daysUntil(contract.end_date) <= 30;
      const overpaying = averageSpend > 0 && value > averageSpend;
      const alternative = await recommendLowerCostVendor(contract.category, contract.vendor_id);

      let recommendation = "Contract looks healthy based on current rules.";
      if (expiringSoon && overpaying) {
        recommendation = `Renewal is urgent and ${contract.vendor_name} is above historical average spend. Start renegotiation and benchmark alternatives.`;
      } else if (expiringSoon) {
        recommendation = `Contract expires within 30 days. Start renewal workflow or sourcing event.`;
      } else if (overpaying) {
        recommendation = `${contract.vendor_name} is above historical average spend. Negotiate price or volume discount.`;
      }

      if (alternative) {
        recommendation += ` Lower-cost vendor to evaluate: ${alternative.name}.`;
      }

      return {
        contractId: contract.id,
        vendorId: contract.vendor_id,
        vendorName: contract.vendor_name,
        category: contract.category,
        value,
        averageSpend,
        daysUntilEndDate: daysUntil(contract.end_date),
        expiringSoon,
        overpaying,
        recommendation,
      };
    })
  );
}