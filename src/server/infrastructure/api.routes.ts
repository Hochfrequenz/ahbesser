import { Router } from 'express';
import AHBController from '../controller/ahb';
import FormatVersionController from '../controller/formatVersion';

const router = Router();

const ahbController = new AHBController();
const formatVersionController = new FormatVersionController();

router.get('/ahb/:formatVersion/:pruefi', async (req, res, next) => {
  await ahbController.get(req, res).catch((err: Error) => next(err));
});

router.get('/format-versions', async (req, res, next) => {
  await formatVersionController.list(req, res).catch((err: Error) => next(err));
});

router.get(
  '/format-versions/:formatVersion/pruefis',
  async (req, res, next) => {
    await formatVersionController
      .listPruefisByFormatVersion(req, res)
      .catch((err: Error) => next(err));
  },
);

router.all('/**', (req, res) => {
  res.status(404);
  res.send({ message: 'not found' });
});

export default router;
