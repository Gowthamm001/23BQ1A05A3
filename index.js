const express = require("express");

const app = express();

app.use(express.json());

let students = [
  { id: 1, name: "Sai" }
];

app.get("/students", (req, res) => {
  res.json(students);
});

app.post("/students", (req, res) => {
  students.push(req.body);
  res.json({ message: "Student Added" });
});

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.listen(3000, () => {
  console.log("Server Started");
});