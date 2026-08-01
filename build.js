const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://wjrpwjrhnpqqtizkekgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcnB3anJobnBxcXRpemtla2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NzUxOTQsImV4cCI6MjEwMDU1MTE5NH0.UriDrr4Kk8mTmw36xbSrdzZE9ZtOWaaZ0jDUtGmTlo4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Domínio principal do site para as URLs absolutas
const BASE_URL = 'https://www.eadblitz.com.br';

async function gerarSiteBuild() {
    console.log("Iniciando a geração estática do site (Matérias e Livros)...");

    // Array para armazenar todas as URLs do Sitemap (inicia com as rotas estáticas principais)
    const sitemapUrls = [
        { loc: `${BASE_URL}/`, priority: '1.0' },
        { loc: `${BASE_URL}/index.html`, priority: '0.9' },
        { loc: `${BASE_URL}/biblioteca.html`, priority: '0.8' },
        { loc: `${BASE_URL}/jornal.html`, priority: '0.9' }
    ];

    // ==========================================
    // 1. GERAÇÃO DAS PÁGINAS DE MATÉRIAS (JORNAL)
    // ==========================================
    const { data: posts, error: errorPosts } = await supabase.from('jornal_posts').select('*');
    
    if (errorPosts) {
        console.error("Erro ao buscar posts no Supabase:", errorPosts);
    } else if (posts && posts.length > 0) {
        let templateMateriaHTML;
        try {
            templateMateriaHTML = fs.readFileSync('materia_template.html', 'utf-8');
            
            for (const post of posts) {
                const tituloSeguro = (post.titulo || 'Jornal Blitz').replace(/"/g, '&quot;');
                const resumoSeguro = (post.resumo || '').replace(/"/g, '&quot;');
                const capaSegura = post.capa_url || '';
                
                const urlMateria = `${BASE_URL}/materia_${post.id}.html`;
                const dataIso = post.criado_em ? new Date(post.criado_em).toISOString() : new Date().toISOString();
                
                let htmlFinal = templateMateriaHTML
                    .replace(/__TITULO__/g, tituloSeguro)
                    .replace(/__RESUMO__/g, resumoSeguro)
                    .replace(/__CAPA__/g, capaSegura)
                    .replace(/__ID__/g, post.id)
                    .replace(/__DATA__/g, dataIso)
                    .replace(/__URL__/g, urlMateria);

                const nomeArquivo = `materia_${post.id}.html`;
                fs.writeFileSync(nomeArquivo, htmlFinal);
                console.log(`Página de matéria gerada: ${nomeArquivo}`);

                sitemapUrls.push({
                    loc: urlMateria,
                    lastmod: dataIso.split('T')[0],
                    priority: '0.7'
                });
            }
        } catch (err) {
            console.error("Erro ao processar o materia_template.html. Verifique se o arquivo existe.", err);
        }
    }

    // ==========================================
    // 2. GERAÇÃO DAS PÁGINAS INDIVIDUAIS DE LIVROS
    // ==========================================
    const { data: livros, error: errorLivros } = await supabase.from('livros').select('*');

    if (errorLivros) {
        console.error("Erro ao buscar livros no Supabase:", errorLivros);
    } else if (livros && livros.length > 0) {
        let templateLivroHTML;
        try {
            templateLivroHTML = fs.readFileSync('livro_template.html', 'utf-8');

            for (const livro of livros) {
                const tituloLivroSeguro = (livro.titulo || 'Biblioteca').replace(/"/g, '&quot;');
                const descricaoSegura = (livro.descricao || '').replace(/"/g, '&quot;');
                const capaLivroSegura = livro.capa_url || '';
                const precoFormatado = (livro.preco === 0 || livro.preco === "0.00") ? "Gratuito" : `R$ ${parseFloat(livro.preco).toFixed(2).replace('.', ',')}`;
                const linkDestino = livro.link_destino || '#';

                const urlLivro = `${BASE_URL}/livro_${livro.id}.html`;
                const dataLivroIso = livro.criado_em ? new Date(livro.criado_em).toISOString() : new Date().toISOString();

                let htmlLivroFinal = templateLivroHTML
                    .replace(/__TITULO__/g, tituloLivroSeguro)
                    .replace(/__DESCRICAO__/g, descricaoSegura)
                    .replace(/__CAPA__/g, capaLivroSegura)
                    .replace(/__PRECO__/g, precoFormatado)
                    .replace(/__LINK_DESTINO__/g, linkDestino)
                    .replace(/__ID__/g, livro.id)
                    .replace(/__DATA__/g, dataLivroIso)
                    .replace(/__URL__/g, urlLivro);

                const nomeArquivoLivro = `livro_${livro.id}.html`;
                fs.writeFileSync(nomeArquivoLivro, htmlLivroFinal);
                console.log(`Página de livro gerada: ${nomeArquivoLivro}`);

                sitemapUrls.push({
                    loc: urlLivro,
                    lastmod: dataLivroIso.split('T')[0],
                    priority: '0.6'
                });
            }
        } catch (err) {
            console.error("Erro ao processar o livro_template.html. Crie o arquivo antes de rodar o build.", err);
        }
    }

    // ==========================================
    // 3. GERAÇÃO DO SITEMAP COMPLETO
    // ==========================================
    gerarSitemap(sitemapUrls);

    console.log("Processo de build concluído com sucesso!");
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
gerarSiteBuild();