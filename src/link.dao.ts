import { Pool } from "pg";
import { Link } from "./link.model.js";
import { plainToClass } from "class-transformer";

export class LinkDao {
    constructor(private dataSource: Pool) {}

    async getById(id: number): Promise<Link> | never {
        const query = {
            text: 'SELECT * FROM link WHERE id = $1',
            values: [id]
        };
        const res = await this.dataSource.query(query);
        if (res.rowCount === 0) throw new Error('Not found');
        return this.mapRowToModel(res.rows[0])
    }

    async create(link: Link): Promise<Link> {
        const query = {
            text: 'INSERT INTO link (original, clicks) VALUES ($1, $2) RETURNING id',
            values: [link.original, link.clicks],
        };
        try {
            await this.dataSource.query('BEGIN');
            const row = await (await this.dataSource.query(query)).rows[0];
            link.id = row['id'];
            await this.dataSource.query('COMMIT');
            return link;
        } catch(e) {
            await this.dataSource.query('ROLLBACK');
            throw Error('Persistence error. Unable to save link');
        }
    }

    async update(link: Link): Promise<Link> {
        const query = {
            text: "UPDATE link SET original = $1, clicks = $2 WHERE id = $3",
            values: [link.original, link.clicks, link.id],
        };
        try {
            await this.dataSource.query('BEGIN');
            await (await this.dataSource.query(query)).rows[0];
            await this.dataSource.query('COMMIT');
            return link;
        } catch(e) {
            await this.dataSource.query('ROLLBACK');
            throw Error('Persistence error. Unable to save link');
        }
    }

    private mapRowToModel(row: any): Link {
        return plainToClass(Link, row)
    }
}