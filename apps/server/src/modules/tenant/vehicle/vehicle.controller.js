import vehicleService from './vehicle.service.js';

const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getVehicles(req.user.id);
    res.status(200).json({ data: vehicles });
  } catch (err) {
    next(err);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.user.id, req.body);
    res.status(201).json({ data: vehicle });
  } catch (err) {
    next(err);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const result = await vehicleService.deleteVehicle(req.user.id, req.params.id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export default { getVehicles, createVehicle, deleteVehicle };