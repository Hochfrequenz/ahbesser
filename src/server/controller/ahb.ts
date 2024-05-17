import AHBRepository, { FileType } from '../repository/ahb';
import { Request, Response } from 'express';

export default class AHBController {
  private repository: AHBRepository;
  constructor(repository?: AHBRepository) {
    this.repository = repository ?? new AHBRepository();
  }
  public async get(req: Request, res: Response): Promise<void> {
    const pruefi = req.params['pruefi'];
    const formatVersion = req.params['formatVersion'];
    // TODO: Make this dynamic
    const type = FileType.JSON;
    const ahb = await this.repository.get(pruefi, formatVersion, type);
    res.status(200).setHeader('Content-Type', 'application/json').send(ahb);
  }
}
