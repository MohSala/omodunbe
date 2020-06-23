import chai from 'chai';
import chaiHttp from 'chai-http';

import { app } from '../app/app';
import { UserController } from "../app/controllers/user"

chai.use(chaiHttp);
const should = chai.should();


describe("User Controller", () => {
  it("UserController should exist", () => {
    UserController.should.exist;
  });
});
