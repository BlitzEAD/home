const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (Substitua pelas suas)
const SUPABASE_URL = 'https://wjrpwjrhnpqqtizkekgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcnB3anJobnBxcXRpemtla2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NzUxOTQsImV4cCI6MjEwMDU1MTE5NH0.UriDrr4Kk8mTmw36xbSrdzZE9ZtOWaaZ0jDUtGmTlo4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function gerarPaginasDasMaterias() {
    console.log("Iniciando a geração de páginas das matérias...");

    // 1. Busca todas as matérias no Supabase
    const { data: posts, error } = await supabase.from('jornal_posts').select('*');
    
    if (error) {
        console.error("Erro ao buscar posts no Supabase:", error);
        return;
    }

    if (!posts || posts.length === 0) {
        console.log("Nenhum post encontrado para gerar páginas.");
        return;
    }

    // 2. Lê o arquivo template que criamos
    const templateHTML = fs.readFileSync('materia_template.html', 'utf-8');

    // 3. Para cada post, cria um HTML novo substituindo as tags
    for (const post of posts) {
        // Trata textos para evitar erros no HTML
        const tituloSeguro = (post.titulo || 'Jornal Blitz').replace(/"/g, '&quot;');
        const resumoSeguro = (post.resumo || '').replace(/"/g, '&quot;');
        const capaSegura = post.capa_url || '';
        
        let htmlFinal = templateHTML
            .replace(/__TITULO__/g, tituloSeguro)
            .replace(/__RESUMO__/g, resumoSeguro)
            .replace(/__CAPA__/g, capaSegura)
            .replace(/__ID__/g, post.id);

        // Define o nome do arquivo, ex: materia_12.html
        const nomeArquivo = `materia_${post.id}.html`;
        
        // Salva o arquivo fisicamente na pasta
        fs.writeFileSync(nomeArquivo, htmlFinal);
        
        console.log(`Página gerada com sucesso: ${nomeArquivo}`);
    }

    console.log("Processo concluído!");
}

gerarPaginasDasMaterias();