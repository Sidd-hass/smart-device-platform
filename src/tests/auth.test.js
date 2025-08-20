import request from "supertest";
import app from "../index.js"; // make sure index.js exports app without listening

describe("Auth Endpoints", () => {
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
        role: "user",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  it("should login a user", async () => {
    await request(app).post("/auth/signup").send({
      name: "Test User",
      email: "login@example.com",
      password: "Password123",
      role: "user",
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@example.com", password: "Password123" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
  });
});
