import { describe, it, expect, mock, beforeEach } from 'bun:test';
import express from 'express';
import request from 'supertest';

const mockFindOneAndUpdate = mock();
const mockFindOne = mock();
const mockUpdateOne = mock();

mock.module('../../../shared/models/tenantProfile.model.js', () => ({
  default: {
    findOneAndUpdate: mockFindOneAndUpdate,
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
  },
}));
mock.module('../../../shared/middleware/authenticate.js', () => ({
  default: (req, _res, next) => { req.user = { id: 'user-1' }; next(); },
}));

const { default: vehicleService } = await import('./vehicle.service.js');
const { default: vehicleRoutes } = await import('./vehicle.routes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/tenant/vehicles', vehicleRoutes);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ message: err.message });
  });
  return app;
};

describe('vehicle.service', () => {
  beforeEach(() => {
    mockFindOneAndUpdate.mockReset();
    mockFindOne.mockReset();
    mockUpdateOne.mockReset();
  });

  describe('createVehicle', () => {
    it('rejects missing model', async () => {
      await expect(vehicleService.createVehicle('user-1', { plate: 'ABC123' }))
        .rejects.toThrow('model and plate are required');
    });

    it('rejects missing plate', async () => {
      await expect(vehicleService.createVehicle('user-1', { model: 'Civic' }))
        .rejects.toThrow('model and plate are required');
    });

    it('trims/uppercases and returns the created vehicle', async () => {
      mockFindOneAndUpdate.mockResolvedValue({
        vehicles: [{ _id: 'veh-1', model: 'Civic', plate: 'ABC123' }],
      });

      const result = await vehicleService.createVehicle('user-1', { model: '  Civic ', plate: ' abc123 ' });

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { user: 'user-1' },
        { $push: { vehicles: { model: 'Civic', plate: 'ABC123' } } },
        { new: true, runValidators: true }
      );
      expect(result).toEqual({ id: 'veh-1', model: 'Civic', plate: 'ABC123' });
    });

    it('throws 404 when tenant profile not found', async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);
      await expect(vehicleService.createVehicle('user-1', { model: 'Civic', plate: 'ABC123' }))
        .rejects.toThrow('Tenant profile not found');
    });
  });

  describe('deleteVehicle', () => {
    it('returns the deleted id on success', async () => {
      mockFindOne.mockResolvedValue({ vehicles: [{ _id: 'veh-1' }] });
      mockUpdateOne.mockResolvedValue({});

      const result = await vehicleService.deleteVehicle('user-1', 'veh-1');

      expect(result).toEqual({ id: 'veh-1' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { user: 'user-1' },
        { $pull: { vehicles: { _id: 'veh-1' } } }
      );
    });

    it('throws 404 when vehicle not found', async () => {
      mockFindOne.mockResolvedValue(null);
      await expect(vehicleService.deleteVehicle('user-1', 'veh-x'))
        .rejects.toThrow('Vehicle not found');
    });
  });
});

describe('vehicle routes', () => {
  beforeEach(() => {
    mockFindOneAndUpdate.mockReset();
    mockFindOne.mockReset();
    mockUpdateOne.mockReset();
  });

  it('POST / creates a vehicle', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      vehicles: [{ _id: 'veh-1', model: 'Civic', plate: 'ABC123' }],
    });

    const res = await request(buildApp())
      .post('/api/tenant/vehicles')
      .send({ model: 'Civic', plate: 'ABC123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { id: 'veh-1', model: 'Civic', plate: 'ABC123' } });
  });

  it('POST / returns 400 on validation error', async () => {
    const res = await request(buildApp())
      .post('/api/tenant/vehicles')
      .send({ model: 'Civic' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('model and plate are required');
  });

  it('DELETE /:id removes a vehicle', async () => {
    mockFindOne.mockResolvedValue({ vehicles: [{ _id: 'veh-1' }] });
    mockUpdateOne.mockResolvedValue({});

    const res = await request(buildApp()).delete('/api/tenant/vehicles/veh-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { id: 'veh-1' } });
  });

  it('DELETE /:id returns 404 when not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(buildApp()).delete('/api/tenant/vehicles/veh-x');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Vehicle not found');
  });
});