import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@stores/auth.store';
import { vehiclesService, Vehicle } from '@api/services';
import { Truck, MapPin, Zap, AlertTriangle } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-success-100 text-success-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-warning-100 text-warning-800',
  retired: 'bg-error-100 text-error-800',
};

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user?.organization?.id) return;

      try {
        const response = await vehiclesService.list(user.organization.id);
        setVehicles(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [user?.organization?.id]);

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.assetId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet</h1>
          <p className="text-gray-600 mt-2">Manage your vehicles</p>
        </div>
        <button className="btn btn-primary">Add Vehicle</button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search vehicles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-md"
        />
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          No vehicles found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="card hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Truck className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                    <p className="text-sm text-gray-500">{vehicle.assetId}</p>
                  </div>
                </div>
                <span className={`badge ${statusColors[vehicle.status]}`}>
                  {vehicle.status}
                </span>
              </div>

              {/* Vehicle Info */}
              <div className="space-y-2 mb-4">
                {vehicle.vin && (
                  <div className="text-sm text-gray-600">
                    <strong>VIN:</strong> {vehicle.vin}
                  </div>
                )}
                {vehicle.currentFuel !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="w-4 h-4" />
                    <span>Fuel: {vehicle.currentFuel}L</span>
                  </div>
                )}
                {vehicle.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>GPS: {vehicle.location}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-700">
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 text-sm rounded-lg bg-primary-100 hover:bg-primary-200 transition text-primary-700">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
