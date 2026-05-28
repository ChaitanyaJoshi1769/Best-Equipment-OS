import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppStore } from '@stores/app.store';
import {
  LayoutDashboard,
  Truck,
  Briefcase,
  Wrench,
  Map,
  Settings,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [fleetOpen, setFleetOpen] = React.useState(true);
  const [operationsOpen, setOperationsOpen] = React.useState(true);

  const isActive = (href: string) => router.pathname === href;

  const fleetItems: NavItem[] = [
    { label: 'Vehicles', href: '/fleet/vehicles', icon: <Truck className="w-5 h-5" /> },
    { label: 'Fleet Map', href: '/fleet/map', icon: <Map className="w-5 h-5" /> },
    { label: 'Telemetry', href: '/fleet/telemetry', icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

  const operationsItems: NavItem[] = [
    { label: 'Dispatch Board', href: '/operations/dispatch', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Jobs', href: '/operations/jobs', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Maintenance', href: '/operations/maintenance', icon: <Wrench className="w-5 h-5" /> },
  ];

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        isActive(item.href)
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {item.icon}
      <span className={!sidebarOpen ? 'hidden' : ''}>{item.label}</span>
      {item.badge && <span className="ml-auto text-xs bg-red-500 text-white px-2 py-1 rounded">{item.badge}</span>}
    </Link>
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <nav className="h-screen flex flex-col overflow-y-auto pt-20 px-3 pb-6">
          {/* Dashboard */}
          <div className="mb-6">
            <NavLink item={{ label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> }} />
          </div>

          {/* Fleet Management */}
          <div className="mb-6">
            <button
              onClick={() => setFleetOpen(!fleetOpen)}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                !sidebarOpen ? 'justify-center' : ''
              }`}
            >
              <Truck className="w-5 h-5" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left font-medium">Fleet</span>
                  {fleetOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </>
              )}
            </button>
            {fleetOpen && sidebarOpen && (
              <div className="mt-2 space-y-1 ml-2">
                {fleetItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Operations */}
          <div className="mb-6">
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                !sidebarOpen ? 'justify-center' : ''
              }`}
            >
              <Briefcase className="w-5 h-5" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left font-medium">Operations</span>
                  {operationsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </>
              )}
            </button>
            {operationsOpen && sidebarOpen && (
              <div className="mt-2 space-y-1 ml-2">
                {operationsItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="mt-auto">
            <NavLink item={{ label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> }} />
          </div>
        </nav>
      </aside>
    </>
  );
};
