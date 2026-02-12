import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { addSaldo, getSaldo } from "./saldo.ts";
import { MongoClient } from "mongodb";

let mongoClient: MongoClient;
let db: any;

async function connectToMongoDB() {
  if (!mongoClient) {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    db = mongoClient.db("myra_bot");
  }
  return db;
}

async function getLastDaily(userId: string): Promise<Date | null> {
  try {
    const database = await connectToMongoDB();
    const collection = database.collection("daily_claims");
    const record = await collection.findOne({ userId });
    return record ? new Date(record.lastClaim) : null;
  } catch (error) {
    console.error("Erro ao buscar último daily:", error);
    return null;
  }
}

async function setLastDaily(userId: string, date: Date): Promise<void> {
  try {
    const database = await connectToMongoDB();
    const collection = database.collection("daily_claims");
    await collection.replaceOne(
      { userId },
      { userId, lastClaim: date, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (error) {
    console.error("Erro ao salvar último daily:", error);
  }
}

async function getDailyPingEnabled(userId: string): Promise<boolean> {
  try {
    const database = await connectToMongoDB();
    const collection = database.collection("daily_settings");
    const record = await collection.findOne({ userId });
    return record ? record.pingEnabled : true;
  } catch (error) {
    console.error("Erro ao buscar configuração de ping:", error);
    return true;
  }
}

async function setDailyPingEnabled(userId: string, enabled: boolean): Promise<void> {
  try {
    const database = await connectToMongoDB();
    const collection = database.collection("daily_settings");
    await collection.replaceOne(
      { userId },
      { userId, pingEnabled: enabled, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (error) {
    console.error("Erro ao salvar configuração de ping:", error);
  }
}

const DAILY_AMOUNT = 100;

export async function executeDaily(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const now = new Date();
  const lastClaim = await getLastDaily(userId);

  if (lastClaim) {
    const nextClaim = new Date(lastClaim);
    nextClaim.setDate(nextClaim.getDate() + 1);
    
    if (now.getTime() < nextClaim.getTime()) {
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("⏰ Já coletou!")
        .setDescription(`Você já coletou seu daily hoje!\n\nPróximo daily em: <t:${Math.floor(nextClaim.getTime() / 1000)}:R>`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: [64] });
    }
  }

  const newBalance = await addSaldo(userId, DAILY_AMOUNT);
  await setLastDaily(userId, now);

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("✅ Daily Coletado!")
    .setDescription(`Você recebeu **${DAILY_AMOUNT}** petiscos!`)
    .addFields(
      { name: "Saldo atual", value: `${newBalance.toLocaleString()} petiscos`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleDailyButton(interaction: any) {
  if (interaction.customId === "daily_toggle_ping") {
    const current = await getDailyPingEnabled(interaction.user.id);
    const newState = !current;
    await setDailyPingEnabled(interaction.user.id, newState);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("🔧 Sistema de Lembretes")
      .setDescription("O sistema de lembretes por DM foi temporariamente desabilitado para correções.\n\nAs configurações foram salvas para quando o sistema for reativado.")
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("daily_toggle_ping")
        .setLabel("Sistema desabilitado")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⚙️")
        .setDisabled(true)
    );

    await interaction.update({ embeds: [embed], components: [row] });
  }
}
