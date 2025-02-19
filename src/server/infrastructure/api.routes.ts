import { Router, IRouter } from 'express';
import AHBController from '../controller/ahb';
import FormatVersionController from '../controller/formatVersion';
import HealthController from '../controller/health';

const router: IRouter = Router();

const ahbController = new AHBController();
const formatVersionController = new FormatVersionController();
const healthController = new HealthController();

router.get('/health', async (req, res, next) => {
  await healthController.check(req, res).catch((err: Error) => next(err));
});

router.get('/ahb/:formatVersion/:pruefi', (req, res, next) => {
  ahbController.get(req, res, next);
});

router.get('/format-versions', async (req, res, next) => {
  await formatVersionController.list(req, res).catch((err: Error) => next(err));
});

router.get('/format-versions/:formatVersion/pruefis', async (req, res, next) => {
  await formatVersionController
    .listPruefisByFormatVersion(req, res)
    .catch((err: Error) => next(err));
});

router.all('/**', (req, res) => {
  res.status(404);
  res.send({ message: 'not found' });
});

export default router;
