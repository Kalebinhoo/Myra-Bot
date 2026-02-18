import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('calculadora')
    .setDescription('Realiza cálculos matemáticos')
    .addStringOption(option =>
        option.setName('conta')
            .setDescription('A operação matemática a ser calculada (ex: 2+2, 10*5, 100/4)')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const conta = interaction.options.getString('conta', true);
    
    try {
        const sanitizedInput = conta.replace(/[^0-9+\-*/().% ]/g, '');
        
        if (sanitizedInput !== conta) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erro na Calculadora')
                .setDescription('Por favor, use apenas números e operadores matemáticos válidos:\n`+` `-` `*` `/` `%` `()` `**`')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const resultado = eval(sanitizedInput);
        
        if (!isFinite(resultado)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erro na Calculadora')
                .setDescription('Resultado inválido. Verifique se a operação está correta.')
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        let resultadoFormatado: string;
        
        if (Math.abs(resultado) >= 1e6 || (Math.abs(resultado) < 0.001 && resultado !== 0)) {
            resultadoFormatado = resultado.toExponential(6);
        } else {
            resultadoFormatado = parseFloat(resultado.toPrecision(12)).toString();
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🧮 Calculadora')
            .addFields(
                { name: '📝 Operação', value: `\`\`\`${conta}\`\`\``, inline: false },
                { name: '📊 Resultado', value: `\`\`\`${resultadoFormatado}\`\`\``, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Erro na Calculadora')
            .setDescription('Não foi possível calcular essa operação. Verifique a sintaxe e tente novamente.\n\n**Exemplos válidos:**\n`2 + 2`\n`10 * 5`\n`100 / 4`\n`2 ** 3` (potenciação)\n`15 % 4` (resto da divisão)')
            .setTimestamp();
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}