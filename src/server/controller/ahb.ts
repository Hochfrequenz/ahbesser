import AHBRepository, { FileType } from "../repository/ahb";
import { Request, Response } from "express";

export default class AHBController {
    private repository: AHBRepository;
    constructor(repository?: AHBRepository) {
        this.repository = repository ?? new AHBRepository();
    }
    public async get(req: Request, res: Response): Promise<void> {
        const pruefi = req.params["pruefi"];
        const formatVersion = req.params["formatVersion"];
        // TODO: Make this dynamic
        const type = FileType.JSON;
        try {
            const ahb = await this.repository.get(pruefi, formatVersion, type);
            res.status(200).send(ahb);
        } catch (err) {
            // TODO: Make error handling more grnaular. E. G. 4xx for wrong pruefi
            console.error(err instanceof Error ? err.message : 'Unknown error');
            res.status(500).send("Internal server error");
        }
    }
}