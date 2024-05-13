import { Router } from 'express';

export const apiRoutes = Router();

apiRoutes.all('/**', (req, res) => {
  res.status(404);
  res.send({ message: 'not found' });
});
