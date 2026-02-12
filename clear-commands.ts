import dotenv from "dotenv";
import { REST, Routes } from "discord.js";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in .env");
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

async function clearCommands() {
  try {
    console.log("🗑️ Limpando comandos antigos...");

    if (DISCORD_GUILD_ID) {
      const guildCommands = await rest.get(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
      ) as any[];

      for (const command of guildCommands) {
        await rest.delete(
          Routes.applicationGuildCommand(DISCORD_CLIENT_ID, DISCORD_GUILD_ID, command.id)
        );
        console.log(`✅ Comando "${command.name}" removido do servidor`);
      }
    }

    const globalCommands = await rest.get(
      Routes.applicationCommands(DISCORD_CLIENT_ID)
    ) as any[];

    for (const command of globalCommands) {
      await rest.delete(
        Routes.applicationCommand(DISCORD_CLIENT_ID, command.id)
      );
      console.log(`✅ Comando global "${command.name}" removido`);
    }

    console.log("✨ Todos os comandos antigos foram removidos!");
  } catch (error) {
    console.error("Erro ao limpar comandos:", error);
    process.exit(1);
  }
}

clearCommands();
