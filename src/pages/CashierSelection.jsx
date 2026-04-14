import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/LanguageContext";
import { createPageUrl } from "../utils";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";

function CashierSelectionContent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('POS'), { replace: true });
  }, []);

  return null;
}

export default function CashierSelection() {
  return (
    <SubscriptionGuard>
      <CashierSelectionContent />
    </SubscriptionGuard>
  );
}