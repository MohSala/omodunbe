import faker from "faker";
export function getloginRecord() {
  return {
    error: false,
    code: 200,
    data: {
      user: {
        otpVerified: true,
        status: "PENDING",
        active: true,
        isDeleted: false,
        _id: faker.random.uuid(),
        mobile: faker.phone.phoneNumber(),
        __v: 0,
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
        email: faker.internet.email(),
      },
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2JpbGUiOiIwOTAyOTE1NzcxMiIsImlhdCI6MTU5NTEwOTY1OSwiZXhwIjoxNTk1MTA5NjU5fQ.jOv4SfKFaXd1Sfkf5GdPbeFNCUHVO5vbv_hnlWf4IHc",
    },
    message: "User Signed in Successfully",
  };
}
