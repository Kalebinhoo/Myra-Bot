import { REST, Routes } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in the environment (e.g. .env file)");
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
const clientId = DISCORD_CLIENT_ID;

async function clearDuplicateCommands() {
  try {
    console.log("🔍 Buscando comandos registrados...");

    const globalCommands = await rest.get(Routes.applicationCommands(clientId)) as any[];
    
    console.log(`📋 Encontrados ${globalCommands.length} comandos globais`);

    if (globalCommands.length === 0) {
      console.log("✅ Nenhum comando para limpar!");
      return;
    }

    console.log("\n📋 Comandos atuais:");
    globalCommands.forEach((cmd, index) => {
      console.log(`${index + 1}. ${cmd.name} - ${cmd.description}`);
    });

    const commandNames = new Map<string, number>();
    const duplicates: string[] = [];
    
    globalCommands.forEach(cmd => {
      const count = commandNames.get(cmd.name) || 0;
      commandNames.set(cmd.name, count + 1);
      
      if (count > 0 && !duplicates.includes(cmd.name)) {
        duplicates.push(cmd.name);
      }
    });

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Comandos duplicados encontrados: ${duplicates.join(", ")}`);
    } else {
      console.log("\n✅ Nenhum comando duplicado encontrado!");
    }


    console.log("\n🗑️  OPÇÕES:");
    console.log("1. Limpar TODOS os comandos (recomendado)");
    console.log("2. Manter comandos existentes");
    console.log("0. Cancelar operação");

    const choice = await askForChoice();

    switch (choice) {
      case "1":
        await clearAllCommands();
        break;
      case "2":
        console.log("✅ Comandos mantidos. Nada foi alterado.");
        break;
      case "0":
      default:
        console.log("❌ Operação cancelada.");
        break;
    }

  } catch (error) {
    console.error("❌ Erro ao processar comandos:", error);
  }
}

async function clearAllCommands() {
  try {
    console.log("\n🗑️  Limpando TODOS os comandos...");
    
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    
    console.log("✅ Todos os comandos foram removidos!");
    console.log("💡 Execute 'npm start' para reregistrar os comandos atualizados.");
    
  } catch (error) {
    console.error("❌ Erro ao limpar comandos:", error);
  }
}

function askForChoice(): Promise<string> {
  return new Promise((resolve) => {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Escolha uma opção (0-2): ", (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function showCommandStats() {
  try {
    const globalCommands = await rest.get(Routes.applicationCommands(clientId)) as any[];
    
    console.log("\n📊 ESTATÍSTICAS DOS COMANDOS:");
    console.log(`Total: ${globalCommands.length} comandos`);
    
    const categories = {
      economia: 0,
      diversao: 0,
      utilidades: 0,
      moderacao: 0,
      outros: 0
    };

    globalCommands.forEach(cmd => {
      const name = cmd.name.toLowerCase();
      const desc = cmd.description.toLowerCase();
      
      if (name.includes('saldo') || name.includes('daily') || name.includes('petisco') || name.includes('rank')) {
        categories.economia++;
      } else if (name.includes('ship') || name.includes('ppt') || name.includes('copo') || desc.includes('jog')) {
        categories.diversao++;
      } else if (name.includes('info') || name.includes('avatar') || name.includes('ping')) {
        categories.utilidades++;
      } else if (name.includes('clear') || name.includes('ban') || name.includes('kick')) {
        categories.moderacao++;
      } else {
        categories.outros++;
      }
    });

    console.log(`💰 Economia: ${categories.economia}`);
    console.log(`🎮 Diversão: ${categories.diversao}`);
    console.log(`🔧 Utilidades: ${categories.utilidades}`);
    console.log(`⚖️  Moderação: ${categories.moderacao}`);
    console.log(`📦 Outros: ${categories.outros}`);
    
  } catch (error) {
    console.error("❌ Erro ao mostrar estatísticas:", error);
  }
}

async function main() {
  console.log("🤖 MYRA BOT - LIMPADOR DE COMANDOS");
  console.log("=====================================");
  
  await showCommandStats();
  await clearDuplicateCommands();
  
  console.log("\n🔄 Para reregistrar comandos, execute: npm start");
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

export { clearDuplicateCommands, clearAllCommands };
