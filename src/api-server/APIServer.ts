import * as http from 'http';
import express, {Express} from 'express';
import BaseEntity from '../entities/BaseEntity';
import EntityRouter from '../entity-router/EntityRouter';

export default class APIServer {
  private _app: Express;

  get app(): Express {
    return this._app;
  }

  private _server:http.Server;

  get server():http.Server {
    return this._server;
  }

  constructor() {
    this._app = express();

    this._app.set('port', process.env.PORT || 5000);

    this.configureMiddleware();
  }

  private configureMiddleware() {
    this._app.use(express.json());
    this._app.use(express.urlencoded({extended:true}));

    this._app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
      res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin,Access-Control-Allow-Credentials,Access-Control-Allow-Methods,Access-Control-Allow-Headers,Origin,Accept,x-Requested-With,Content-Type,Authorization');
      next();
    })
  }

  public addEntity<T extends BaseEntity>(classRef) {
    const name = Reflect.getMetadata('entity:name', classRef);
    let entityRouter = new EntityRouter<T>(name, classRef);
    this._app.use(`/${name}`, entityRouter.router);
  }

  public start() {
    let port:string | number = this._app.get('port');
    this._server = this._app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    })
  }
}