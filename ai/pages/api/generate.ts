import { generateNode } from "@/lib/generateNode/generateNode";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = JSON.parse(req.body);
  const lastMessage = messages[messages.length - 1].content;

  try {
    const { node, rawResponse } = await generateNode(lastMessage);
    res.json({ node, rawResponse });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate node" });
  }
}
