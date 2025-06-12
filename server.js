const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.urlencoded({ extended: true}));
app.use(express.json());


app.get("/", (req, res) => {
    res.send("UjuziAI is running...")
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}...`)
});

