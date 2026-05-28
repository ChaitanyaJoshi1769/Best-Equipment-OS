import Link from 'next/link';
import { Truck, Briefcase, Wrench, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-700">
      <header className="bg-white/10 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold">BE</span>
            </div>
            <span className="text-white font-bold text-lg">Best Equipment OS</span>
          </div>
          <Link href="/login" className="btn bg-white text-primary-600 hover:bg-gray-100">
            Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 text-white">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Enterprise Fleet Management Made Simple
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Best Equipment OS is a comprehensive platform for managing vehicles, jobs, maintenance schedules, and real-time telemetry data.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8">
              Get Started
            </Link>
            <Link href="/register" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8">
              Create Account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
            <Truck className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Fleet Management</h3>
            <p className="text-white/80">Track and manage your entire vehicle fleet in real-time with GPS location tracking.</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
            <Briefcase className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Job Dispatch</h3>
            <p className="text-white/80">Efficiently assign and track service jobs with automated dispatch and SLA monitoring.</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
            <Wrench className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Maintenance Scheduling</h3>
            <p className="text-white/80">Never miss a maintenance deadline with intelligent scheduling and notifications.</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
            <BarChart3 className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Analytics & Insights</h3>
            <p className="text-white/80">Get real-time insights into fleet performance, costs, and operational efficiency.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
