import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import AdminCashierGate from "@/components/auth/AdminCashierGate";

function CashierSelectionContent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('POS'), { replace: true });
  }, []);

  return null;
}

export default function CashierSelection() {
  return (
    <AdminCashierGate>
      <SubscriptionGuard>
        <CashierSelectionContent />
      </SubscriptionGuard>
    </AdminCashierGate>
  );
}