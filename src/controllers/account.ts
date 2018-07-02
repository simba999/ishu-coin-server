import { Request, Response } from 'express';
import * as express from 'express';
import { object, string } from 'joi';
import { errorWrap } from '../utils';
import validate from '../middleware/validate';
import { Account } from '../models/account';

const router = express.Router();

router.post('/accounts',
    validate({
        body: object().keys({
            type: string().valid('company'),
            name: string().max(255),
        }),
    }),
    errorWrap(async (req: Request, res: Response) => {
        const account = Account.create(req.body);

        res.json(account);
    }),
);

router.get('/accounts',
    validate({
        body: object().keys({}),
    }),
    errorWrap(async (req: Request, res: Response) => {
        res.status(200);
    }),
);

router.get('/accounts/:uuid',
    validate({
        body: object().keys({}),
    }),
    errorWrap(async (req: Request, res: Response) => {
        res.status(200);
    }),
);

router.patch('/accounts/:uuid',
    validate({
        body: object().keys({}),
    }),
    errorWrap(async (req: Request, res: Response) => {
        res.status(200);
    }),
);

export default router;