import { Request, Response } from 'express';
import FormatVersionRepository from '../repository/formatVersion';

export default class FormatVersionController {
  private repository: FormatVersionRepository;
  constructor(repository?: FormatVersionRepository) {
    this.repository = repository ?? new FormatVersionRepository();
  }

  public async list(_req: Request, res: Response): Promise<void> {
    const formatVersionEntity = await this.repository.list();
    res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
      .setHeader('ETag', `"${formatVersionEntity.join(',')}"`) // Simple ETag based on content
      .send(formatVersionEntity);
  }

  public async listPruefisByFormatVersion(req: Request, res: Response): Promise<void> {
    const formatVersion = req.params['formatVersion'];
    const pruefis = await this.repository.listPruefisByFormatVersion(formatVersion);
    res.status(200).setHeader('Content-Type', 'application/json').send(pruefis);
  }
}
