import PrismaClient  from '../src/prisma/index';



async function main() {
    console.log('🌱 Iniciando seed...');

    // Seed de Tamanhos
    const tamanhos = [
        { nome: 'PP', ordem: 1 },
        { nome: 'P', ordem: 2 },
        { nome: 'M', ordem: 3 },
        { nome: 'G', ordem: 4 },
        { nome: 'GG', ordem: 5 },
    ];

    console.log('📦 Criando tamanhos...');
    
    for (const tamanho of tamanhos) {
        const existing = await PrismaClient.tamanho.findFirst({
            where: { nome: tamanho.nome }
        });

        if (!existing) {
            await PrismaClient.tamanho.create({
                data: tamanho
            });
            console.log(`  ✓ ${tamanho.nome} criado`);
        } else {
            console.log(`  ⊘ ${tamanho.nome} já existe`);
        }
    }

    console.log('✅ Seed concluído com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await PrismaClient.$disconnect();
    });
