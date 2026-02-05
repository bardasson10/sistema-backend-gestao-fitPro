# Atualização do Relatório de Produtividade

## Mudança Solicitada

Ajustar o endpoint `/conferencias/relatorio/produtividade` para calcular o período baseado nas datas reais:

- **período.inicio**: Menor `dataSaida` dos direcionamentos nas conferências retornadas
- **período.fim**: Maior `dataConferencia` das conferências retornadas

## Código Atual (ConferenciaService.ts - linha 220)

```typescript
class GetRelatorioProdutividadeService {
    async execute(dataInicio?: string, dataFim?: string) {
        const conferencias = await prismaClient.conferencia.findMany({
            where: {
                dataConferencia: {
                    ...(dataInicio && { gte: new Date(dataInicio) }),
                    ...(dataFim && { lte: new Date(dataFim) })
                }
            },
            include: {
                direcionamento: {
                    include: {
                        faccao: true
                    }
                },
                items: true
            }
        });

        // ADICIONAR AQUI:
        // Calcular período baseado nas datas reais
        let periodoInicio = "início";
        let periodoFim = "hoje";

        if (conferencias.length > 0) {
            // Encontrar a menor dataSaida dos direcionamentos
            const dataSaidas = conferencias
                .map(c => c.direcionamento.dataSaida)
                .filter(d => d !== null) as Date[];
            
            if (dataSaidas.length > 0) {
                const menorDataSaida = new Date(Math.min(...dataSaidas.map(d => d.getTime())));
                periodoInicio = menorDataSaida.toISOString().split('T')[0];
            }

            // Encontrar a maior dataConferencia
            const datasConferencia = conferencias
                .map(c => c.dataConferencia)
                .filter(d => d !== null) as Date[];
            
            if (datasConferencia.length > 0) {
                const maiorDataConferencia = new Date(Math.max(...datasConferencia.map(d => d.getTime())));
                periodoFim = maiorDataConferencia.toISOString().split('T')[0];
            }
        }

        // ... resto do código ...

        return {
            periodo: {
                inicio: periodoInicio,  // MUDAR de: dataInicio || "início"
                fim: periodoFim         // MUDAR de: dataFim || "hoje"
            },
            // ... resto dos campos
        };
    }
}
```

## Arquivo a Editar

**Arquivo**: `src/services/producao/ConferenciaService.ts`  
**Classe**: `GetRelatorioProdutividadeService`  
**Linha**: ~220

## Resultado Esperado

```json
{
  "periodo": {
    "inicio": "2026-02-01",  // data_saida mais antiga
    "fim": "2026-02-05"      // data_conferencia mais recente
  },
  "totalConferencias": 1,
  "conformes": 1,
  "naoConformes": 0,
  "comDefeito": 0,
  "taxaConformidade": "100.00%",
  "pagasAutorizadas": 0,
  "porFaccao": {
    "Facção Premium Costura": {
      "total": 1,
      "conforme": 1,
      "defeitos": 0
    }
  }
}
```
