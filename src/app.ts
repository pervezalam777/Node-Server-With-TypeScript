import path from 'path'
import {JsonDB} from 'node-json-db';
import APIServer from './api-server';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';
import Person from './entities/Person';

export const apiServer = new APIServer();
export const db = new JsonDB(new Config('entityDatabase', true, true, '/'));

apiServer.addEntity<Person>(Person);

apiServer.start();