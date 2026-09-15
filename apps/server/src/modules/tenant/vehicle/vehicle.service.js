import TenantProfile from '../../../shared/models/tenantProfile.model.js';

const toDto = (vehicle) => ({
  id: vehicle._id.toString(),
  make: vehicle.model,
  model: vehicle.model,
  plate: vehicle.plate,
});

const createVehicle = async (userId, payload) => {
  // Accepts either 'make' (sent by frontend) or 'model'
  const vehicleModel = payload?.make || payload?.model;
  const vehiclePlate = payload?.plate;

  if (!vehicleModel || !vehiclePlate) {
    const err = new Error('model and plate are required');
    err.status = 400;
    throw err;
  }

  const profile = await TenantProfile.findOneAndUpdate(
    { user: userId },
    { 
      $push: { 
        vehicles: { 
          model: String(vehicleModel).trim(), 
          plate: String(vehiclePlate).trim().toUpperCase() 
        } 
      } 
    },
    { new: true, runValidators: true }
  );

  if (!profile) {
    const err = new Error('Tenant profile not found');
    err.status = 404;
    throw err;
  }

  return toDto(profile.vehicles[profile.vehicles.length - 1]);
};

const deleteVehicle = async (userId, vehicleId) => {
  const before = await TenantProfile.findOne(
    { user: userId, 'vehicles._id': vehicleId },
    { 'vehicles.$': 1 }
  );

  if (!before) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  await TenantProfile.updateOne(
    { user: userId },
    { $pull: { vehicles: { _id: vehicleId } } }
  );

  return { id: vehicleId };
};
const getVehicles = async (userId) => {
  const profile = await TenantProfile.findOne({ user: userId });
  if (!profile) return [];
  return (profile.vehicles || []).map(toDto);
};

export default { getVehicles, createVehicle, deleteVehicle };