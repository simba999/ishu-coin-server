import express, { NextFunction, Request, Response } from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import cors from 'cors';
import expressValidator from 'express-validator';
import generateConfig from './config';
import { initSequelize } from './database';
import passport from 'passport';
import passportJwt from 'passport-jwt';
import { User } from './models/user';
import SwaggerJsDoc from 'swagger-jsdoc';
import SwaggerUI from 'swagger-ui-express';
import Routers from './routers';
import dotenv from 'dotenv';

dotenv.config({path: '.env'});

const config = generateConfig();
const sequelize = initSequelize(config);

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

passport.use(new JwtStrategy({
        secretOrKey: config.secrets.salt,
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    },
    async function (payload: any, done: any) {
        const user = await User.findById(payload.userId);
        if (!user) return done(null, false);
        done(null, user);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

const options = {
    swaggerDefinition: {
        host: process.env.HOST,
        basePath: '/v1',
        swagger: '2.0',
        info: {
            title: 'ISHU Swagger API Documentation',
            version: '1.0',
            description: 'This is Ishu Captable API documentation.',
            contact: {
                email: 'alex.vaitkus@ishu.io'
            }
        },
        securityDefinitions: {
            Bearer: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header'
            }
        }
    },
    apis: [
        './src/controllers/user/*.ts',
        './src/controllers/account/*.ts',
        './src/controllers/security/*.ts',
        './src/controllers/shareholder/*.ts',
        './src/controllers/security_transaction/*.ts',
        './src/controllers/captable/*.ts',
    ]
};
const swaggerSpec = SwaggerJsDoc(options);

const app = express();

app.set('port', config.port);
app.set('sequelize', sequelize);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(cors({origin: '*'}));
app.use(passport.initialize());

app.use('/v1', Routers);

app.use((req, res, next) => {
    console.info(`${new Date()}: [${req.method}] ${req.url}`);
    next();
});

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
app.use('/api-docs', SwaggerUI.serve, SwaggerUI.setup(swaggerSpec));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`${req.url}: ${err.message}`);

    if (err.isBoom) {
        return res
            .status(err.output.statusCode || 500)
            .json(Object.assign(
                err.output.payload,
                err.data ? {details: err.data} : null
            ));
    }

    res.status(err.status || 500).json({
        statusCode: err.status || 500,
        error: err.name,
        message: err.message,
    });
});

app.use((req, res) => {
    res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: 'No such route',
    });
});

export default app;