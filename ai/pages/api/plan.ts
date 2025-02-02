import { generateFlowScore } from "@/lib/generateNode/generateFlowScore";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, model } = JSON.parse(req.body);
  const lastMessage = messages[messages.length - 1].content;

  try {
    const result = await generateFlowScore(lastMessage, model);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to plan flow" });
  }
}
