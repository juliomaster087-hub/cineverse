import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Bookmark, Check, ChevronDown, Clapperboard, Compass,
  Play, Search, Sparkles, Tv, X,
} from "lucide-react";

type Series = {
  id: number | string;
  title: string;
  genre: string;
  year: string;
  seasons: string;
  description: string;
  color: string;
  accent: string;
  tag?: string;
  poster_url?: string;
  episodes?: Episode[];
};

type Episode = { id:string; season_number:number; episode_number:number; title:string; synopsis:string; youtube_url:string; status:string; scheduled_at:number|null; available:boolean };

const series: Series[] = [
  {
    id: 1, title: "Ecos da Aurora", genre: "Fantasia", year: "2026", seasons: "1 temporada",
    description: "Em uma cidade onde as estrelas desapareceram, uma jovem encontra um mapa capaz de mudar o destino de todos.",
    color: "from-violet-950 via-indigo-900 to-slate-950", accent: "bg-violet-400", tag: "Em destaque",
  },
  {
    id: 2, title: "Arquivo 09", genre: "Mistério", year: "2026", seasons: "1 temporada",
    description: "Uma equipe recebe gravações de acontecimentos que ainda não aconteceram.",
    color: "from-slate-800 via-slate-950 to-black", accent: "bg-cyan-300", tag: "Suspense",
  },
  {
    id: 3, title: "Além do Horizonte", genre: "Aventura", year: "2025", seasons: "2 temporadas",
    description: "Quatro amigos partem em uma jornada para descobrir o que existe depois das fronteiras conhecidas.",
    color: "from-emerald-950 via-teal-900 to-slate-950", accent: "bg-emerald-300",
  },
  {
    id: 4, title: "Código Carmesim", genre: "Drama", year: "2025", seasons: "1 temporada",
    description: "Segredos de família vêm à tona quando uma antiga carta reaparece depois de vinte anos.",
    color: "from-rose-950 via-red-950 to-zinc-950", accent: "bg-rose-300",
  },
  {
    id: 5, title: "Órbita Zero", genre: "Ficção científica", year: "2026", seasons: "1 temporada",
    description: "A tripulação de uma estação remota perde contato com a Terra e precisa descobrir o motivo.",
    color: "from-blue-950 via-sky-950 to-black", accent: "bg-sky-300",
  },
  {
    id: 6, title: "O Último Verão", genre: "Drama", year: "2024", seasons: "3 temporadas",
    description: "Uma pequena cidade costeira guarda histórias que seus moradores preferiam esquecer.",
    color: "from-amber-950 via-orange-950 to-zinc-950", accent: "bg-amber-300",
  },
];

const filters = ["Todas", "Fantasia", "Mistério", "Aventura", "Drama", "Ficção científica"];

function Poster({ item, featured = false }: { item: Series; featured?: boolean }) {
  return (
    <div className={`poster-art bg-gradient-to-br ${item.color} ${featured ? "poster-featured" : ""}`}>
      {item.poster_url && <img className="poster-image" src={item.poster_url} alt="" />}
      <div className="poster-orbit" />
      <div className="poster-glow" />
      <span className="poster-kicker">CINEVERSE ORIGINAL</span>
      <div className="poster-copy">
        <span className="poster-line" />
        <strong>{item.title}</strong>
        <small>{item.genre.toUpperCase()} · {item.year}</small>
      </div>
      <span className={`poster-dot ${item.accent}`} />
    </div>
  );
}

function Countdown({ target, offset=0 }: { target:number; offset?:number }) {
  const [now,setNow] = useState(Date.now());
  useEffect(() => { const timer=window.setInterval(()=>setNow(Date.now()),1000); return ()=>window.clearInterval(timer); },[]);
  const diff=Math.max(0,target-(now+offset));
  const days=Math.floor(diff/86400000), hours=Math.floor(diff%86400000/3600000), minutes=Math.floor(diff%3600000/60000), seconds=Math.floor(diff%60000/1000);
  useEffect(()=>{ if(diff===0){ const timer=window.setTimeout(()=>window.location.reload(),700); return ()=>window.clearTimeout(timer); } },[diff]);
  return <div className="episode-countdown"><strong>ESTREIA EM</strong><div><span>{days}<small>dias</small></span><b>:</b><span>{String(hours).padStart(2,"0")}<small>horas</small></span><b>:</b><span>{String(minutes).padStart(2,"0")}<small>min</small></span><b>:</b><span>{String(seconds).padStart(2,"0")}<small>seg</small></span></div></div>;
}
function youtubeEmbed(url:string) {
  try { const parsed=new URL(url); const id=parsed.hostname.includes("youtu.be")?parsed.pathname.slice(1):parsed.searchParams.get("v"); return id ? "https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id) : ""; } catch { return ""; }
}

export default function App() {
  const [catalog,setCatalog] = useState<Series[]>(series);
  const [serverOffset,setServerOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Array<number|string>>([]);
  const [selected, setSelected] = useState<Series | null>(null);
  const [selectedEpisode,setSelectedEpisode] = useState<Episode | null>(null);
  useEffect(() => { fetch("/api/catalog",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{ if(!data) return; if(typeof data.serverNow==="number") setServerOffset(data.serverNow-Date.now()); const items=(data.series||[]).map((row:any)=>({id:row.id,title:row.title,genre:row.genre||"Série",year:String(row.year||"2026"),seasons:"Temporadas disponíveis",description:row.synopsis||"",color:"from-violet-950 via-indigo-900 to-slate-950",accent:"bg-violet-400",poster_url:row.poster_url,episodes:(data.episodes||[]).filter((ep:any)=>ep.series_id===row.id)})); setCatalog(items); }).catch(()=>{}); },[]);

  const filtered = useMemo(() => catalog.filter((item) => {
    const matchesFilter = activeFilter === "Todas" || item.genre === activeFilter;
    const matchesSearch = `${item.title} ${item.genre} ${item.description}`.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [catalog, activeFilter, search]);

  const toggleSaved = (id: number|string) => {
    setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <header className="site-header">
        <a className="brand" href="#" aria-label="CineVerse início">
          <span className="brand-mark"><Clapperboard size={20} strokeWidth={2.2} /></span>
          <span>CINE<span>VERSE</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a className="nav-active" href="#inicio">Início</a>
          <a href="#catalogo">Séries</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <div className="header-actions">
          <label className="search-box">
            <Search size={17} />
            <input aria-label="Buscar séries" placeholder="Buscar séries..." value={search} onChange={(event) => { setSearch(event.target.value); document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }); }} />
            {search && <button aria-label="Limpar busca" onClick={() => setSearch("")}><X size={15} /></button>}
          </label>
          <a className="explore-link" href="#catalogo">Explorar <ChevronDown size={14} /></a>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="hero-backdrop" />
          <div className="hero-content">
            <div className="eyebrow"><Sparkles size={14} /> SEU PRÓXIMO UNIVERSO COMEÇA AQUI</div>
            <p className="hero-overline">UMA NOVA HISTÓRIA ESPERA POR VOCÊ</p>
            <h1>Histórias que<br /><span>ficam com você.</span></h1>
            <p className="hero-description">Explore mundos, descubra personagens e encontre sua próxima série favorita. Tudo em um só lugar.</p>
            <div className="hero-buttons">
              <a href="#catalogo" className="button-primary"><Compass size={17} /> Explorar catálogo <ArrowRight size={16} /></a>
              <a href="#sobre" className="button-quiet">Conheça o CineVerse</a>
            </div>
            <div className="hero-note"><span className="live-dot" /> UM UNIVERSO DE SÉRIES, SEM ASSINATURA</div>
          </div>
          <div className="hero-feature">
            {catalog[0] && <Poster item={catalog[0]} featured />}
            <div className="feature-caption"><span>DESTAQUE DO UNIVERSO</span><strong>{catalog[0]?.title || "Em breve"}</strong><small>{catalog[0]?.genre || "Séries"} · CineVerse</small></div>
          </div>
          <div className="hero-bottom-fade" />
        </section>

        <section id="catalogo" className="catalog-section">
          <div className="section-heading">
            <div>
              <div className="section-kicker"><span /> DESCUBRA SEU PRÓXIMO MARATONA</div>
              <h2>Explore o universo</h2>
              <p>Séries para todos os momentos e todos os gostos.</p>
            </div>
            <div className="catalog-count"><Tv size={16} /> {filtered.length} {filtered.length === 1 ? "série" : "séries"}</div>
          </div>

          <div className="filter-row" role="group" aria-label="Filtrar por gênero">
            {filters.map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={activeFilter === filter ? "filter-chip active" : "filter-chip"}>{filter}</button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="series-grid">
              {filtered.map((item) => (
                <article className="series-card" key={item.id}>
                  <button className="poster-button" onClick={() => { setSelected(item); setSelectedEpisode(null); }} aria-label={`Ver detalhes de ${item.title}`}>
                    <Poster item={item} />
                    <span className="card-play"><Play size={19} fill="currentColor" /></span>
                  </button>
                  <div className="card-info">
                    <div><h3>{item.title}</h3><p>{item.genre} <span>·</span> {item.year}</p></div>
                    <button className={saved.includes(item.id) ? "save-button is-saved" : "save-button"} onClick={() => toggleSaved(item.id)} aria-label={saved.includes(item.id) ? "Remover dos salvos" : "Salvar série"}>{saved.includes(item.id) ? <Check size={17} /> : <Bookmark size={17} />}</button>
                  </div>
                  {item.tag && <span className="card-tag">{item.tag}</span>}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Search size={28} /><h3>Nenhuma série encontrada</h3><p>Tente outro título ou escolha um gênero diferente.</p><button onClick={() => { setSearch(""); setActiveFilter("Todas"); }}>Limpar filtros</button></div>
          )}
        </section>

        <section id="sobre" className="about-section">
          <div className="about-icon"><Clapperboard size={24} /></div>
          <div><span className="section-kicker">BEM-VINDO AO CINEVERSE</span><h2>Seu espaço para boas histórias.</h2><p>Estamos construindo um catálogo de séries com acesso simples e gratuito. Novos títulos e episódios serão adicionados conforme houver conteúdo autorizado para publicação.</p></div>
          <a href="#catalogo" className="about-link">Ver catálogo <ArrowRight size={16} /></a>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><Clapperboard size={17} /></span><span>CINE<span>VERSE</span></span></a>
        <p>Um universo de histórias para descobrir.</p>
        <small>© 2026 CineVerse. Projeto independente.</small>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="series-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => { setSelected(null); setSelectedEpisode(null); }} aria-label="Fechar"><X size={20} /></button>
            <Poster item={selected} featured />
            <div className="modal-content"><span className="section-kicker">SÉRIE · {selected.year}</span><h2 id="modal-title">{selected.title}</h2><p className="modal-meta">{selected.genre} <span>·</span> {selected.seasons}</p><p>{selected.description}</p><div className="episode-list"><strong>EPISÓDIOS</strong>{(selected.episodes||[]).map(ep=><button key={ep.id} className="episode-row" onClick={()=>setSelectedEpisode(ep)}><span>T{ep.season_number} · E{ep.episode_number} — {ep.title}</span><small>{ep.available?"Assistir":ep.scheduled_at? "Estreia programada":"Em breve"}</small></button>)}</div>{selectedEpisode && <div className="episode-player">{selectedEpisode.available ? <iframe title={selectedEpisode.title} src={youtubeEmbed(selectedEpisode.youtube_url)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : selectedEpisode.scheduled_at ? <Countdown target={selectedEpisode.scheduled_at} offset={serverOffset}/> : <p>Este episódio ainda não foi publicado.</p>}</div>}<button className="button-primary modal-action" onClick={() => toggleSaved(selected.id)}>{saved.includes(selected.id) ? <Check size={17} /> : <Bookmark size={17} />}{saved.includes(selected.id) ? "Salvo na sua lista" : "Adicionar à minha lista"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}