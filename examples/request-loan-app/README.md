# Request Loan Web App - Flyde Example

A very simplistic "request loan" app that showcases how Flyde can be used to orchestrate high-level services together. Inspiration: the example from [this great blog post](https://www.confluent.io/blog/every-company-is-becoming-software/) by [Confluent](https://www.confluent.io/)

It consists of a simple [express](https://expressjs.com/) app that exposes a simple form and a POST endpoint.
The POST request is handled by a [Flyde](https://www.flyde.dev) workflow that orchestrates fictional Credit, CRM and Risk services (declared as custom Flyde nodes - see `.flyde.ts` files).

![Preview](preview.gif)

## Running the app

1. `npm install`
2. `npm start`
3. Open `RequestLoan.flyde` using the [Flyde VSCode Extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode)
4. Open http://localhost:8500 in your browser and submit a request. Keep the flyde editor visible to see the visual feedback.

## Next steps

- Try adding a new service to the workflow. For example, a "Fraud" service that rejects all requests from blocked IP addresses.
- Try adding an API call to Slack or Discord whenever a load is approved or rejected

---

Looking to learn more about Flyde? Visit the official website at https://www.flyde.dev
