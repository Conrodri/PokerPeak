interface PremiumGateProps {
  children: React.ReactNode;
  label?: string;
}

export function PremiumGate({ children }: PremiumGateProps) {
  return <>{children}</>;
}
