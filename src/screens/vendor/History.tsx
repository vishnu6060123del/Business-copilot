import { useMemo } from "react";
import { Card, CardHeader, CardTitle, EmptyState, Table, Tbody, Td, Th, Thead } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getContractsByVendor, getPaymentsByVendor, getVendorById } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

export function VendorHistory() {
  const { user } = useAuth();
  const vendor = useMemo(() => getVendorById(user?.vendorId || "")!, [user]);
  const contracts = useMemo(() => getContractsByVendor(vendor.id), [vendor]);
  const payments = useMemo(() => getPaymentsByVendor(vendor.id), [vendor]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">History</h2>

      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        {contracts.length ? (
          <Table>
            <Thead>
              <tr>
                <Th>Title</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th className="text-right">Value</Th>
              </tr>
            </Thead>
            <Tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium">{c.title}</Td>
                  <Td>{formatDate(c.startDate)}</Td>
                  <Td>{formatDate(c.endDate)}</Td>
                  <Td className="text-right font-semibold">{formatCurrency(c.value)}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <EmptyState message="No contract history." />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        {payments.length ? (
          <Table>
            <Thead>
              <tr>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Method</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </Thead>
            <Tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <Td>{formatDate(p.date)}</Td>
                  <Td>{p.description}</Td>
                  <Td>{p.method}</Td>
                  <Td className="text-right font-semibold">{formatCurrency(p.amount)}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <EmptyState message="No payment history." />
        )}
      </Card>
    </div>
  );
}
