import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActivityType, type ChatInputCommandInteraction } from "discord.js";
import dotenv from "dotenv";
import { MongoClient, type Db } from "mongodb";
import { getSaldo, getSaldoMessage, addSaldo } from "./cogs/economia/saldo";
import { executeAddPetisco } from "./cogs/economia/addpetisco";
import { executeShip } from "./cogs/diversão/ship";
import { executeCoposSortidos, handleCopoChoice } from "./cogs/diversão/copossortidos";
import { executePedraPapelTesoura, handlePedraPapelTesoura } from "./cogs/diversão/pppt";
import { executeDaily, handleDailyButton } from "./cogs/economia/daily";
import { handleGuildCreate, handleGuildDelete } from "./logs-entrada";
import { executeInfo } from "./cogs/utilidades/info";
import { executeAvatar } from "./cogs/utilidades/avatar";
import { executeClear } from "./cogs/moderação/clear";

console.log("Iniciando bot TypeScript...");

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, MONGODB_URI } = process.env;

let mongoClient: MongoClient;
let db: Db;

async function connectMongoDB(): Promise<Db> {
  const uri = MONGODB_URI || "mongodb://localhost:27017";
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  db = mongoClient.db("myra_bot");
  console.log("✅ Conectado ao MongoDB com sucesso!");
  return db;
}

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in the environment (e.g. .env file)");
}

const token = DISCORD_TOKEN;
const clientId = DISCORD_CLIENT_ID;

const commands = [
  new SlashCommandBuilder()
    .setName("saldo")
    .setDescription("Mostra seu saldo atual"),
  new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Descubra a compatibilidade romântica entre dois usuários")
    .addUserOption(option =>
      option.setName('usuario1')
        .setDescription('Primeiro usuário')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('usuario2')
        .setDescription('Segundo usuário (deixe em branco para usar você)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("copossortidos")
    .setDescription("Jogue o jogo dos copos sortidos - encontre a bolinha!"),
  new SlashCommandBuilder()
    .setName("addpetisco")
    .setDescription("[ADMIN] Adiciona petiscos para um usuário")
    .setDefaultMemberPermissions(0)
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário que receberá os petiscos')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('quantidade')
        .setDescription('A quantidade de petiscos para adicionar')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("ppt")
    .setDescription("Jogue pedra, papel ou tesoura contra o bot!"),
  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Colete seus petiscos diários!"),
  new SlashCommandBuilder()
    .setName("info")
    .setDescription("Mostra informações sobre o bot!"),
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Mostra o avatar de um usuário")
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário para ver o avatar (deixe vazio para ver o seu)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("[ADMIN] Apaga mensagens do canal")
    .setDefaultMemberPermissions(0)
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de mensagens para apagar (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function updateBotStatus() {
  const guildCount = client.guilds.cache.size;
  client.user?.setActivity(`Myra está em ${guildCount} servidor 💚${guildCount !== 1 ? 'es' : ''}`, {
    type: ActivityType.Custom
  });
}

async function registerCommands() {
  if (DISCORD_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(clientId, DISCORD_GUILD_ID), { body: commands });
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
}

client.once(Events.ClientReady, async (readyClient) => {
  try {
    await registerCommands();
    updateBotStatus();
    console.log(`✨ Bot online como ${readyClient.user.tag}`);
    console.log(`📊 Conectado a ${readyClient.guilds.cache.size} servidor(es)`);
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);
  }
});

handleGuildCreate(client);
handleGuildDelete(client);

client.on(Events.GuildCreate, () => {
  updateBotStatus();
});

client.on(Events.GuildDelete, () => {
  updateBotStatus();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    try {
      await handleCommand(interaction);
    } catch (error) {
      console.error("Erro ao processar comando:", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: "Ocorreu um erro ao executar este comando.", flags: [64] });
      } else {
        await interaction.reply({ content: "Ocorreu um erro ao executar este comando.", flags: [64] });
      }
    }
  }

  if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith('copo_')) {
        await handleCopoChoice(interaction);
      } else if (interaction.customId.startsWith('ppt_')) {
        await handlePedraPapelTesoura(interaction);
      } else if (interaction.customId === 'daily_toggle_ping') {
        await handleDailyButton(interaction);
      }
    } catch (error) {
      console.error("Erro ao processar botão:", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: "Ocorreu um erro ao processar sua escolha.", flags: [64] });
      } else {
        await interaction.reply({ content: "Ocorreu um erro ao processar sua escolha.", flags: [64] });
      }
    }
  }
});

async function handleCommand(interaction: ChatInputCommandInteraction) {
  switch (interaction.commandName) {
    case "saldo":
      {
        const message = await getSaldoMessage(interaction.user.id, interaction.user.toString());
        await interaction.reply({ content: message });
      }
      break;
    case "ship":
      await executeShip(interaction);
      break;
    case "copossortidos":
      await executeCoposSortidos(interaction);
      break;
    case "addpetisco":
      await executeAddPetisco(interaction);
      break;
    case "ppt":
      await executePedraPapelTesoura(interaction);
      break;
    case "daily":
      await executeDaily(interaction);
      break;
    case "info":
      await executeInfo(interaction);
      break;
    case "avatar":
      await executeAvatar(interaction);
      break;
    case "clear":
      await executeClear(interaction);
      break;
    default:
      await interaction.reply({ content: "Comando desconhecido.", flags: [64] });
  }
}

console.log("Configurações carregadas, conectando ao MongoDB...");
connectMongoDB()
  .then(() => {
    console.log("MongoDB conectado, fazendo login no Discord...");
    return client.login(DISCORD_TOKEN);
  })
  .catch((error) => {
    console.error("Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  });
