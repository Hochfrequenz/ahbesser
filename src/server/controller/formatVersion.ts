import { Request, Response } from "express";
import FormatVersionRepository from "../repository/formatVersion";

export default class FormatVersionController {
    private repository: FormatVersionRepository;
    constructor(repository?: FormatVersionRepository) {
        this.repository = repository ?? new FormatVersionRepository();
    }

    public async list(_req: Request, res: Response): Promise<void> {
        const formatVersionEntity = await this.repository.list();
        res.status(200).send(formatVersionEntity);
    }
}