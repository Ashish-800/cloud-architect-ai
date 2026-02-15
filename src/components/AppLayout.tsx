import AppSidebar from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showSearch?: boolean;
}

const AppLayout = ({ children, searchQuery, onSearchChange, showSearch }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        showSearch={showSearch}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AppLayout;
