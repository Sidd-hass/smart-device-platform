import request from "supertest";
import app from "../index.js";

let token;

beforeAll(async () => {
  // create a user and login to get token
  await request(app).post("/auth/signup").send({
    name: "Device Tester",
    email: "device@test.com",
    password: "Password123",
    role: "user",
  });

  const res = await request(app).post("/auth/login").send({
    email: "device@test.com",
    password: "Password123",
  });

  token = res.body.token;
});

describe("Device Endpoints (CRUD + Heartbeat)", () => {
  let deviceId;

  it("should create a new device", async () => {
    const res = await request(app)
      .post("/devices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Living Room Light",
        type: "light",
        status: "active",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    deviceId = res.body.device.id;
  });

  it("should get devices", async () => {
    const res = await request(app)
      .get("/devices")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.devices)).toBe(true);
  });

  it("should update device details", async () => {
    const res = await request(app)
      .patch(`/devices/${deviceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "inactive", name: "Updated Light" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.device.status).toBe("inactive");
    expect(res.body.device.name).toBe("Updated Light");
  });

  it("should record heartbeat", async () => {
    const res = await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("should delete device", async () => {
    const res = await request(app)
      .delete(`/devices/${deviceId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
