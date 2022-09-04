// // import { createDbClient } from "./db-client"

// export interface InvoiceDto {
//     name: string;
//     email: string;
//     amount: number;
// }

// export interface Invoice extends InvoiceDto {
//     id: string;
//     created: number;
//     paidTime?: number;
//     emailOpenTime?: number;
// }

// export const createInvoicesService = async () => {
//     const client = await createDbClient();

//     const invoicesCollection = client.db('data').collection<Invoice>("invoices");

//     const addInvoice = async (dto: InvoiceDto) => {
//         const invoice: Invoice = {
//             ...dto,
//             id: `${Date.now()}-${Math.random()}`,
//             created: Date.now()
//         };
//         await invoicesCollection.insertOne(invoice, {});
//         return invoicesCollection.findOne({id: invoice.id});
//     }

//     return {
//         addInvoice,
//         getInvoices: () => invoicesCollection.find({}).toArray()
//     }
    
// }
