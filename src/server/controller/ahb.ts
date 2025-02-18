import AHBRepository, { FileType } from '../repository/ahb';
import { Request, Response, NextFunction } from 'express';

export default class AHBController {
  private repository: AHBRepository;
  constructor(repository?: AHBRepository) {
    this.repository = repository ?? new AHBRepository();
  }
  public async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pruefi = req.params['pruefi'];
      const formatVersion = req.params['formatVersion'];
      const format = (req.query['format'] as string) || 'json';

      let fileType: FileType;
      let contentType: string;

      switch (format.toLowerCase()) {
        case 'xlsx':
          fileType = FileType.XLSX;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          fileType = FileType.CSV;
          contentType = 'text/csv';
          break;
        default:
          fileType = FileType.JSON;
          contentType = 'application/json';
      }

      const content = await this.repository.get(pruefi, formatVersion, fileType);

      res
        .status(200)
        .setHeader('Content-Type', contentType)
        .setHeader(
          'Content-Disposition',
          `attachment; filename=AHB_${formatVersion}_${pruefi}.${format}`
        );

      if (fileType === FileType.JSON) {
        res.json(content);
      } else {
        res.send(content);
      }
    } catch (error) {
      next(error);
    }
  }
}
