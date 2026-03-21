import express from "express";
import matchRoutes from "./routes/match.route.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.use("/matches", matchRoutes);

const PORT = 8000;

app.listen(PORT, () => {
  console.log(
    `Server listening at http://localhost:${PORT}${app.mountpath ?? ""}`,
  );
});
