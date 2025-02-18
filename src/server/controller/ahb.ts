import AHBRepository, { FileType } from '../repository/ahb';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../infrastructure/errors';

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

      // Validate prüfidentifikator format (5 digits)
      if (!/^\d{5}$/.test(pruefi)) {
        throw new ValidationError(
          `Invalid Prüfidentifikator format: ${pruefi}. Expected 5 digits.`
        );
      }

      // Validate format version pattern (e.g. FV2310)
      if (!/^FV\d{4}$/.test(formatVersion)) {
        throw new ValidationError(
          `Invalid format version: ${formatVersion}. Expected pattern: FV followed by 4 digits.`
        );
      }

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
        case 'json':
          fileType = FileType.JSON;
          contentType = 'application/json';
          break;
        default:
          throw new ValidationError(
            `Invalid format: ${format}. Supported formats are: json, xlsx, csv`
          );
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
