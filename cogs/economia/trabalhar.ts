import { ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuInteraction } from "discord.js";
import { MongoClient } from "mongodb";

const mongoClient = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
const db = mongoClient.db("myra_bot");
const workCollection = db.collection("work_cooldowns");

const trabalhos = [
	{ label: "Vendedor", value: "vendedor", description: "R$ 1.800 a R$ 8.000 (comissão)", emoji: "<:vendedora:1472609731053879436>" },
	{ label: "Técnico de Enfermagem", value: "tecnico_enfermagem", description: "R$ 2.000 a R$ 3.500", emoji: "<:tecnicodeenfermagem:1472610341296017428>" },
	{ label: "Social Media", value: "social_media", description: "R$ 2.000 a R$ 5.000", emoji: "<:socialmedia:1472610707320078457>" },
	{ label: "Fisioterapeuta", value: "fisioterapeuta", description: "R$ 2.500 a R$ 6.000", emoji: "<:fisioterapeuta:1472611125785788565>" },
	{ label: "Eletricista", value: "eletricista", description: "R$ 2.500 a R$ 6.000", emoji: "<:eletricista:1472611602594271346>" },
	{ label: "Designer Gráfico", value: "designer_grafico", description: "R$ 2.500 a R$ 6.000", emoji: "<:designerdeweb:1472611909986422906>" },
	{ label: "Editor de Vídeo", value: "editor_video", description: "R$ 2.500 a R$ 7.000", emoji: "<:editordevideo:1472612839578669209>" },
	{ label: "Professor", value: "professor_fundamental", description: "R$ 2.500 a R$ 5.000", emoji: "<:professores:1472613177375195374>" },
	{ label: "Administrador", value: "administrador", description: "R$ 3.000 a R$ 8.000", emoji: "<:administrador:1472613411845312676>" },
	{ label: "Psicólogo", value: "psicologo", description: "R$ 3.000 a R$ 8.000", emoji: "<:psicologo:1472613871331311790>" },
	{ label: "Policial Militar", value: "policial_militar", description: "R$ 3.000 a R$ 7.000", emoji: "<:Policia_militar:1472614528612040834>" },
	{ label: "Enfermeiro", value: "enfermeiro", description: "R$ 3.500 a R$ 7.000", emoji: "<:enfermeira:1472614827414524047>" },
	{ label: "Arquiteto", value: "arquiteto", description: "R$ 4.000 a R$ 12.000", emoji: "<:arquiteto:1472615145292173384>" },
	{ label: "Dentista", value: "dentista", description: "R$ 4.000 a R$ 15.000", emoji: "<:dentista:1472615297163857950>" },
	{ label: "Engenheiro de Software", value: "engenheiro_software", description: "R$ 10.000 a R$ 20.000", emoji: "<:engenheiro_de_softwear:1472615658591227984>" },
	{ label: "Juiz", value: "juiz", description: "R$ 30.000+", emoji: "<:juiz:1472615840485740670>" },
	{ label: "Influenciador Digital", value: "influenciador_digital", description: "R$ 1.000 a 100.000+ (muito variável)", emoji: "<:influenciador:1472616101673173093>" }
];

export async function executeTrabalhar(interaction: ChatInputCommandInteraction) {
	const embed = new EmbedBuilder()
		.setTitle("💼 Profissões da Myra")
		.setDescription(" • No sistema de trabalho da Myra, vai ser uma forma de ganhar petiscos realizando diferentes profissões.\n\n • Cada profissão recebe uma quantia diferente e cada um no horário diferente.")
		.setColor(0x00FF00)
		.setThumbnail("https://cdn-icons-png.flaticon.com/128/8540/8540926.png");

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId("trabalho_select")
		.setPlaceholder("💼 Selecione um trabalho...")
		.addOptions(trabalhos);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

	await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handleTrabalhoSelect(interaction: StringSelectMenuInteraction) {
	const userId = interaction.user.id;
	const selectedJob = interaction.values[0];
	
	try {
		await mongoClient.connect();
	} catch (error) {
	}
	
	const lastWork = await workCollection.findOne({ userId });
	const now = new Date();
	
	if (lastWork) {
		const timeDiff = now.getTime() - lastWork.lastWorkTime.getTime();
		const cooldownTime = 24 * 60 * 60 * 1000;
		
		if (timeDiff < cooldownTime) {
			const timeLeft = cooldownTime - timeDiff;
			const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
			const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
			const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
			let timeString = "";
			if (hoursLeft > 0) {
				timeString += `**${hoursLeft}** hora${hoursLeft !== 1 ? 's' : ''}`;
			}
			if (minutesLeft > 0) {
				if (timeString) timeString += ", ";
				timeString += `**${minutesLeft}** minuto${minutesLeft !== 1 ? 's' : ''}`;
			}
			if (secondsLeft > 0) {
				if (timeString) timeString += " e ";
				timeString += `**${secondsLeft}** segundo${secondsLeft !== 1 ? 's' : ''}`;
			}
			const nextWorkTime = Math.floor((lastWork.lastWorkTime.getTime() + cooldownTime) / 1000);
			const embed = new EmbedBuilder()
				.setTitle("⏰ Você já trabalhou hoje!")
				.setDescription(`Você precisa esperar mais ${timeString} para trabalhar novamente.\n\n🕐 **Próximo trabalho disponível:** <t:${nextWorkTime}:R>\n📅 **Data/Hora:** <t:${nextWorkTime}:F>`)
				.setColor(0xFF6B6B)
				.setThumbnail("https://media.tenor.com/Hd8nLZZTPRYAAAAi/alarm-clock-alarm.gif");
			await interaction.reply({ embeds: [embed], flags: [64] });
			return;
		}
	}
	await interaction.deferReply();
	const job = trabalhos.find(t => t.value === selectedJob);
	if (!job) {
		await interaction.editReply({ content: "Trabalho não encontrado!" });
		return;
	}
	let minSalary = 1000;
	let maxSalary = 5000;
	switch (selectedJob) {
		case "vendedor":
			minSalary = 1800; maxSalary = 8000; break;
		case "tecnico_enfermagem":
			minSalary = 2000; maxSalary = 3500; break;
		case "social_media":
			minSalary = 2000; maxSalary = 5000; break;
		case "fisioterapeuta":
			minSalary = 2500; maxSalary = 6000; break;
		case "eletricista":
			minSalary = 2500; maxSalary = 6000; break;
		case "designer_grafico":
			minSalary = 2500; maxSalary = 6000; break;
		case "editor_video":
			minSalary = 2500; maxSalary = 7000; break;
		case "professor_fundamental":
			minSalary = 2500; maxSalary = 5000; break;
		case "administrador":
			minSalary = 3000; maxSalary = 8000; break;
		case "psicologo":
			minSalary = 3000; maxSalary = 8000; break;
		case "policial_militar":
			minSalary = 3000; maxSalary = 7000; break;
		case "enfermeiro":
			minSalary = 3500; maxSalary = 7000; break;
		case "arquiteto":
			minSalary = 4000; maxSalary = 12000; break;
		case "dentista":
			minSalary = 4000; maxSalary = 15000; break;
		case "engenheiro_software":
			minSalary = 10000; maxSalary = 20000; break;
		case "juiz":
			minSalary = 30000; maxSalary = 35000; break;
		case "influenciador_digital":
			minSalary = 1000; maxSalary = 100000; break;
	}
	const salary = Math.floor(Math.random() * (maxSalary - minSalary + 1)) + minSalary;
	const usersCollection = db.collection("users");
	await usersCollection.updateOne(
		{ userId },
		{ $inc: { petiscos: salary } },
		{ upsert: true }
	);
	await workCollection.updateOne(
		{ userId },
		{ $set: { userId, lastWorkTime: now, lastJob: selectedJob } },
		{ upsert: true }
	);
	const embed = new EmbedBuilder()
		.setTitle("💼 Trabalho Concluído!")
		.setDescription(`${job.emoji} Você trabalhou como **${job.label}** e ganhou **${salary.toLocaleString('pt-BR')} petiscos**!\n\n⏰ Próximo trabalho disponível em: **24 horas**`)
		.setColor(0x00FF00)
		.setThumbnail("https://cdn-icons-png.flaticon.com/128/8540/8540926.png")
		.setTimestamp();
	await interaction.editReply({ embeds: [embed] });
}
