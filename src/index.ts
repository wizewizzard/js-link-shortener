import express from 'express';
import { base32Encode, base32Decode } from '@ctrl/ts-base32';
import { LinkDao } from './link.dao.js';
import poolPckg from 'pg';
import bodyParser from 'body-parser';
import { Link } from './link.model.js';
import { dbConfig } from './db.config.js';

const {Pool} = poolPckg;

function bootstrap() {
    const app = express();
    const port = process.env.PORT;
    const protocol = process.env.SECURED ? "https" : "http";
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    const dbConnection = new Pool(dbConfig);
    const linkDao = new LinkDao(dbConnection);

    app.post('/shorten',  async (req, res, next) => {
        try {
            const domain = req.get('host');
            const url = req?.body?.['url'];
            if (!url) {
                return res.status(400).send({
                    message: 'Link is empty'
                });
            }
            
            const link = new Link();
            link.original = url;
            link.clicks = 0;
    
            await linkDao.create(link);
            console.log(link.id);
            return res.status(201).send({
                shortened: `${protocol}://${domain}/${base32Encode(Buffer.from(link.id.toString()))}`,
                original: link.original
            });
        } catch(e) {
            next(e);
        }
    });

    app.get('/:code/info', async (req, res, next) => {
        try {
            const code = req.params.code;
            const id = parseInt(Buffer.from(base32Decode(code)).toString());
            const link = await linkDao.getById(id);
            if (!link) {
                return res.status(404).send({
                    message: 'Link not found'
                });
            }
            return res.status(200).send({
                original: link.original,
                clicks: link.clicks
            });
        } catch(e) {
            next(e);
        }
    });

    app.get('/:code', async (req, res, next) => {
        try {
            const code = req.params.code;
            const id = parseInt(Buffer.from(base32Decode(code)).toString());
            const link = await linkDao.getById(id);
            if (!link) {
                return res.status(404).send({
                    message: 'Link not found'
                });
            }
            link.clicks ++;
            await linkDao.update(link);
            return res.redirect(link.original);
        } catch(e) {
            next(e);
        }
    });

    app.use((err: any, req: any, res: any, next: any) => {
        console.log(err.stack);
        res.status(500).send('Server error. ' + err.message);
    });

    app.listen(port, () => {
        console.log(`Application started on port ${port}`);
    });
}

bootstrap();
