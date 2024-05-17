import { Router } from 'express';
import AHBController from '../controller/ahb';

const router = Router();

const ahbController = new AHBController();


router.get('/ahb/:formatVersion/:pruefi', async (req, res, next) => {
  await ahbController.get(req, res).catch((err: Error) => next(err));
});

router.all('/**', (req, res) => {
  res.status(404);
  res.send({ message: 'not found' });
});

export default router;