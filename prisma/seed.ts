import PrismaClient  from '../src/prisma/index';



async function main() {
    console.log('🌱 Iniciando seed...');

    console.log('🏭 Garantindo facção interna...');
    const faccaoInterna = await PrismaClient.faccao.findFirst({
        where: { nome: 'Produção Interna' }
    });

    if (!faccaoInterna) {
        await PrismaClient.faccao.create({
            data: {
                nome: 'Produção Interna',
                status: 'ativo'
            }
        });
        console.log('  ✓ Facção Produção Interna criada');
    } else {
        console.log('  ⊘ Facção Produção Interna já existe');
    }

    // Seed de Tamanhos
    const tamanhos = [
        { nome: 'P', ordem: 1 },
        { nome: 'M', ordem: 2 },
        { nome: 'G', ordem: 3 },
        { nome: 'GG', ordem: 4 },
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
