import { MongoClient } from "mongodb";

const mongoClient = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
const db = mongoClient.db("myra_bot");
const usersCollection = db.collection("users");

export async function getSaldo(userId: string): Promise<number> {
  try {
    await mongoClient.connect();
  } catch (error) {
  }
  
  const user = await usersCollection.findOne({ userId });
  return user?.petiscos ?? 100;
}

export async function addSaldo(userId: string, amount: number): Promise<number> {
  try {
    await mongoClient.connect();
  } catch (error) {
  }
  
  const result = await usersCollection.findOneAndUpdate(
    { userId },
    { $inc: { petiscos: amount } },
    { upsert: true, returnDocument: 'after' }
  );
  
  return result?.petiscos ?? (100 + amount);
}

export async function removeSaldo(userId: string, amount: number): Promise<number> {
  try {
    await mongoClient.connect();
  } catch (error) {
  }
  
  const existingUser = await usersCollection.findOne({ userId });
  
  if (!existingUser) {
    await usersCollection.insertOne({ userId, petiscos: 100 });
  }
  
  const result = await usersCollection.findOneAndUpdate(
    { userId },
    { $inc: { petiscos: -amount } },
    { returnDocument: 'after' }
  );
  
  return result?.petiscos ?? 0;
}

export async function getMultipleSaldos(userIds: string[]): Promise<Map<string, number>> {
  try {
    await mongoClient.connect();
  } catch (error) {
  }
  
  const result = new Map<string, number>();
  const users = await usersCollection.find({ userId: { $in: userIds } }).toArray();
  
  for (const userId of userIds) {
    const user = users.find(u => u.userId === userId);
    result.set(userId, user?.petiscos ?? 100);
  }
  
  return result;
}

export async function getAllNonDefaultSaldos(): Promise<Map<string, number>> {
  try {
    await mongoClient.connect();
  } catch (error) {
  }
  
  const result = new Map<string, number>();
  const users = await usersCollection.find({ petiscos: { $gt: 100 } }).toArray();
  
  for (const user of users) {
    result.set(user.userId, user.petiscos);
  }
  
  return result;
}

export async function getSaldoMessage(userId: string, userMention: string): Promise<string> {
  const saldo = await getSaldo(userId);

  return `${userMention}, seu saldo dentro do banco da Myra está com **${saldo.toLocaleString()}** de petiscos.
----------------------------------------------------------------------------------------------
Você pode analisar suas características em \`/rank\` ou se você quiser ganhar, temos exatamente minigames para você se divertir e farmar bastante petiscos e se tornar o mais **Rico**! 🤑<:petisco:1472879242868953150>`;
}

export async function closeSaldoClient() {
}
