import { loadFlow } from "@flyde/runtime";
import * as express from "express";
import { readFileSync } from "fs";

const PORT = 8500;
const app = express();

app.use(express.urlencoded());

const execute = loadFlow('src/RequestLoan.flyde');


app.get("/", async (req, res) => {
  const invoiceFormHtml = readFileSync(__dirname + "/web/index.html", "utf8");
  res.send(invoiceFormHtml);
});

app.post("/loan", async (req, res) => {

  const {email, amount} = req.body;
  execute({ email, amount}, {
    onOutputs: (_, value) => {
      res.send(`<center><h1>${value}</h1><a href="/">Back</a></center>`);
    }
  });
});

app.listen(PORT);
console.log(`Example request loan app listening on port ${PORT}`);
