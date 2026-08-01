const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (Substitua pelas suas se necessário)
const SUPABASE_URL = 'https://wjrpwjrhnpqqtizkekgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcnB3anJobnBxcXRpemtla2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NzUxOTQsImV4cCI6MjEwMDU1MTE5NH0.UriDrr4Kk8mTmw36xbSrdzZE9ZtOWaaZ0jDUtGmTlo4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Domínio principal do site para as URLs absolutas
const BASE_URL = 'https://www.eadblitz.com.br';

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
    let templateHTML;
    try {
        templateHTML = fs.readFileSync('materia_template.html', 'utf-8');
    } catch (err) {
        console.error("Erro ao ler o materia_template.html. Verifique se o arquivo existe.", err);
        return;
    }

    // Array para armazenar as URLs do Sitemap (inicia com as rotas estáticas)
    const sitemapUrls = [
        { loc: `${BASE_URL}/`, priority: '1.0' },
        { loc: `${BASE_URL}/index.html`, priority: '0.9' },
        { loc: `${BASE_URL}/biblioteca.html`, priority: '0.8' },
        { loc: `${BASE_URL}/jornal.html`, priority: '0.9' }
    ];

    // 3. Para cada post, cria um HTML novo substituindo as tags
    for (const post of posts) {
        // Trata textos para evitar erros no HTML
        const tituloSeguro = (post.titulo || 'Jornal Blitz').replace(/"/g, '&quot;');
        const resumoSeguro = (post.resumo || '').replace(/"/g, '&quot;');
        const capaSegura = post.capa_url || '';
        
        // Define a URL absoluta da matéria e a data no formato ISO
        const urlMateria = `${BASE_URL}/materia_${post.id}.html`;
        const dataIso = post.criado_em ? new Date(post.criado_em).toISOString() : new Date().toISOString();
        
        let htmlFinal = templateHTML
            .replace(/__TITULO__/g, tituloSeguro)
            .replace(/__RESUMO__/g, resumoSeguro)
            .replace(/__CAPA__/g, capaSegura)
            .replace(/__ID__/g, post.id)
            .replace(/__DATA__/g, dataIso)
            .replace(/__URL__/g, urlMateria);

        // Define o nome do arquivo, ex: materia_12.html
        const nomeArquivo = `materia_${post.id}.html`;
        
        // Salva o arquivo fisicamente na pasta
        fs.writeFileSync(nomeArquivo, htmlFinal);
        
        console.log(`Página gerada com sucesso: ${nomeArquivo}`);

        // Adiciona a página gerada na lista do sitemap
        sitemapUrls.push({
            loc: urlMateria,
            lastmod: dataIso.split('T')[0], // Apenas a data (YYYY-MM-DD)
            priority: '0.7'
        });
    }

    // 4. Chama a função que constrói e salva o sitemap
    gerarSitemap(sitemapUrls);

    console.log("Processo concluído!");
}

function gerarSitemap(urls) {
    console.log("Gerando arquivo sitemap.xml...");
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    urls.forEach(item => {
        xml += `  <url>\n`;
        xml += `    <loc>${item.loc}</loc>\n`;
        if (item.lastmod) {
            xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
        }
        if (item.priority) {
            xml += `    <priority>${item.priority}</priority>\n`;
        }
        xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    try {
        fs.writeFileSync('sitemap.xml', xml, 'utf-8');
        console.log("✅ Sitemap gerado com sucesso: sitemap.xml");
    } catch (err) {
        console.error("❌ Erro ao salvar o sitemap.xml", err);
    }
}

// Inicia a rotina principal
gerarPaginasDasMaterias();