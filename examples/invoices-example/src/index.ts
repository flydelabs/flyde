import * as express from "express";
import { readFileSync } from "fs";

import { executeFlow, expose } from "@flyde/runtime";

import { crmService } from "./services/crm";
import { creditService } from "./services/credit";
import { riskService } from "./services/risk";

const PORT = 8500;
const app = express();

app.use(express.urlencoded());

const init = async () => {
  expose(crmService.getUser, "CRM.getUserByEmail", ["email"]);
  expose(creditService.getCredit, "CreditService.getCredit", ["userId"]);
  expose(riskService.calculateRisk, "RiskService.calculateRisk", ["userId", "amount"]);
  const bob = () => 'Hello SF';
  expose(bob, "Hello", ["hi"]);

  app.get("/", async (req, res) => {
    const invoiceFormHtml = readFileSync(__dirname + "/loan-app.html", "utf8");
    res.send(invoiceFormHtml);
  });

  app.get('/hello', async (req, res) => {
    const result = await executeFlow("hello-world.flyde", {});
    res.send(result);
  })

  app.post("/loan", async (req, res) => {
    const response = await executeFlow("loan-app.flyde", { formData: req.body });
    res.send(`<center><h1>${response}</h1><a href="/">Back</a></center>`);
  });

  app.listen(PORT);
};

init().then(() => {
  console.log(`listenning on port ${PORT}`);
});
