import express, { Router, Request, Response } from 'express';
import { db } from '../app';
import * as uuid from 'uuid';
import BaseEntity, { EntityTypeInstance, EntityFactory } from '../entities/BaseEntity';
import { validate, logRoute, auth } from '../decorators'

export default class EntityRouter<T extends BaseEntity> {
  private _router: Router;

  get router(): Router {
    return this._router;
  }

  constructor(public name: string, private classRef: EntityTypeInstance<T>) {
    this._router = express.Router();
    this.addEntityRoutes();
  }

  //TODO: see if class level arrow function can replace nested call.
  private addEntityRoutes() {
    this._router
      .post('/', (req, res) => this.createEntity(req, res))
      .get('/', (req, res) => this.fetchAllEntities(req, res))
      .get('/:id', (req, res) => this.fetchEntity(req, res))
      .put('/:id', (req, res) => this.updateEntity(req, res))
      .delete('/:id', (req, res) => this.deleteEntity(req, res))
  }

  @logRoute
  @auth('writer')
  private createEntity(req: Request, res: Response) {
    try {
      let newEntity = EntityFactory.fromPersistenceObject<T>(req.body, this.classRef);

      let errorMap = validate(newEntity);
      if (Object.keys(errorMap).length > 0) {
        res.status(400).send({ error: errorMap })
        return;
      }

      const idProperty = Reflect.getMetadata('entity:id', newEntity);
      newEntity[idProperty] = uuid.v4();
      db.push(`/${this.name}/${newEntity[idProperty]}`, newEntity.getPersistanceObject());
      res.status(200).json(newEntity);
    } catch (error) {
      console.log(`${req.ip} [${new Date().toISOString()}] ${req.host} ${req.originalUrl} ${req.method} ${error}`);
      res.status(500).send(`Internal Server Error: contact administrator`)
    }
  }

  @logRoute
  @auth('writer')
  private updateEntity(req: Request, res: Response) {
    try {
      let dataPath = `/${this.name}/${req.params.id}`;
      let data = {}
      try {
        data = db.getData(dataPath);
      } catch (err) {
        res.status(404).json({ error: 'Object does not exist' })
      }
      let updatedData = req.body;
      let updatedObj = EntityFactory.fromPersistenceObject(data, this.classRef);
      const propKeys = Object.keys(updatedData);
      for (const propKey of propKeys) {
        updatedObj[propKey] = updatedData[propKey];
      }

      let errorMap = validate(updatedObj);
      if (Object.keys(errorMap).length > 0) {
        res.status(400).send({ error: errorMap })
        return;
      }

      db.push(dataPath, updatedData, false);
      data = db.getData(dataPath);
      res.json(data);
    } catch (error) {
      console.log(`${req.ip} [${new Date().toISOString()}] ${req.host} ${req.originalUrl} ${req.method} ${error}`);
      res.status(500).send(`Internal Server Error: contact administrator`)
    }
  }

  @logRoute
  @auth('reader')
  private fetchAllEntities(req: Request, res: Response) {
    const data = db.getData(`/${this.name}`);
    res.json(data);
  }

  @logRoute
  @auth('reader')
  private fetchEntity(req: Request, res: Response) {
    const data = db.getData(`/${this.name}/${req.params.id}`);
    res.json(data)
  }

  @logRoute
  @auth('deleter')
  private deleteEntity(req: Request, res: Response) {
    
    db.delete(`/${this.name}/${req.params.id}`);
    res.json({})
  }
}