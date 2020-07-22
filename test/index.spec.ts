import sinon from "sinon";
import chai from "chai";
import chaiHttp from "chai-http";
import request from "request";
import faker from "faker";
import { app } from "../app/app";
import { serviceLocate } from "../app/config/di";
const userController = serviceLocate.get("userController");
import { getloginRecord } from "./factories/user";

chai.use(chaiHttp);
chai.should();

describe("User Controller", () => {
  beforeEach(() => {
    this.get = sinon.stub(request, "get");
    this.post = sinon.stub(request, "post");
  });
  afterEach(() => {
    request.get.restore();
    request.post.restore();
  });

  it("Login(POST) should login a new user", (done) => {
    const options = {
      body: {
        mobile: faker.phone.phoneNumber(),
        password: faker.internet.password(),
      },
      json: true,
      url: `localhost:7300/login`,
    };
    this.post.yields(
      null,
      getloginRecord().code,
      JSON.stringify(getloginRecord().data),
    );
    request.post(options, (err, res, body) => {
      res.should.equal(200);
      body = JSON.parse(body);
      body.user.otpVerified.should.eql(true);
      done();
    });
  });
});
