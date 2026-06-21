import Auth0ProviderWrapper from "@/components/Auth0ProviderWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Auth0ProviderWrapper>{children}</Auth0ProviderWrapper>;
}
