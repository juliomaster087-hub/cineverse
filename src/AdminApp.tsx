import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CalendarClock, CheckCircle2, Clapperboard, Film, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";

type Series = { id:string; title:string; genre:string; year:number|null; synopsis:string; poster_url:string; };
type Episode = { id:string; series_id:string; title:string; season_number:number; episode_number:number; status:string; scheduled_at:number|null; released:boolean; youtube_url:string; };
const API = "/admin/api";
const dateValue = (value:number|null) => value ? new Date(value).toLocaleString("pt-BR") : "—";

export default function AdminApp() {
  const [auth,setAuth] = useState<"checking"|"ok"|"blocked">("checking");
  const [series,setSeries] = useState<Series[]>([]);
  const [episodes,setEpisodes] = useState<Episode[]>([]);
  const [tab,setTab] = useState<"series"|"episodes">("series");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [seriesForm,setSeriesForm] = useState({title:"",genre:"",year:"",synopsis:"",poster_url:""});
  const [episodeForm,setEpisodeForm] = useState({series_id:"",season_number:"1",episode_number:"1",title:"",synopsis:"",youtube_url:"",mode:"published",scheduled_at:""});

  const load = async () => {
    const response = await fetch(API + "/content", { cache:"no-store" });
    if (response.status === 403) { setAuth("blocked"); return; }
    if (!response.ok) throw new Error("Não foi possível carregar o painel.");
    const data = await response.json();
    setSeries(data.series); setEpisodes(data.episodes); setAuth("ok");
  };
  useEffect(() => { fetch(API + "/session").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(() => load()).catch(() => setAuth("blocked")); }, []);

  const submitSeries = async (event:FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const r = await fetch(API + "/series",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(seriesForm)});
      const d = await r.json(); if(!r.ok) throw new Error(d.error || "Erro ao salvar.");
      setSeriesForm({title:"",genre:"",year:"",synopsis:"",poster_url:""}); setMessage("Série cadastrada!"); await load();
    } catch(e:any) { setMessage(e.message); } finally { setBusy(false); }
  };
  const submitEpisode = async (event:FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const r = await fetch(API + "/episodes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(episodeForm)});
      const d = await r.json(); if(!r.ok) throw new Error(d.error || "Erro ao salvar.");
      setEpisodeForm(v=>({...v,title:"",synopsis:"",youtube_url:""})); setMessage(episodeForm.mode==="scheduled"?"Estreia agendada para todos os visitantes!":"Episódio publicado!"); await load();
    } catch(e:any) { setMessage(e.message); } finally { setBusy(false); }
  };
  const remove = async (kind:"series"|"episodes",id:string) => {
    if(!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
    const r=await fetch(`${API}/${kind}/${id}`,{method:"DELETE"});
    if(r.ok) { setMessage("Conteúdo excluído."); await load(); } else setMessage("Não foi possível excluir.");
  };
  if(auth==="checking") return <div className="admin-screen"><Loader2 className="spin"/> Verificando acesso seguro…</div>;
  if(auth==="blocked") return <div className="admin-screen"><div className="admin-lock"><ShieldCheck size={34}/><h1>Painel privado</h1><p>Esta área só aceita a conta autorizada. O Cloudflare Access precisa estar ativado para este endereço e permitir somente o e-mail cadastrado.</p><a href="/">Voltar ao CineVerse</a></div></div>;

  return <div className="admin-screen"><header className="admin-header"><a className="admin-brand" href="/"><Clapperboard/> CINEVERSE <span>ADMIN</span></a><a href="/" className="admin-back"><ArrowLeft size={16}/> Ver site</a></header>
    <main className="admin-main"><div className="admin-heading"><div><span className="admin-kicker">CENTRAL DO CRIADOR</span><h1>Painel administrativo</h1><p>Gerencie séries, episódios e estreias do CineVerse.</p></div><span className="admin-secure"><ShieldCheck size={15}/> Acesso protegido</span></div>
    <div className="admin-tabs"><button className={tab==="series"?"selected":""} onClick={()=>setTab("series")}><Film size={16}/> Séries</button><button className={tab==="episodes"?"selected":""} onClick={()=>setTab("episodes")}><CalendarClock size={16}/> Episódios e estreias</button></div>
    {message && <div className="admin-message" role="status">{message}</div>}
    {tab==="series" ? <div className="admin-columns"><form className="admin-card" onSubmit={submitSeries}><h2><Plus size={18}/> Cadastrar série</h2><label>Nome da série<input required value={seriesForm.title} onChange={e=>setSeriesForm({...seriesForm,title:e.target.value})} placeholder="Ex.: Minha série"/></label><div className="admin-two"><label>Gênero<input value={seriesForm.genre} onChange={e=>setSeriesForm({...seriesForm,genre:e.target.value})} placeholder="Fantasia, drama..."/></label><label>Ano<input type="number" min="1900" max="2100" value={seriesForm.year} onChange={e=>setSeriesForm({...seriesForm,year:e.target.value})} placeholder="2026"/></label></div><label>Sinopse<textarea rows={3} value={seriesForm.synopsis} onChange={e=>setSeriesForm({...seriesForm,synopsis:e.target.value})}/></label><label>URL da capa (opcional)<input type="url" value={seriesForm.poster_url} onChange={e=>setSeriesForm({...seriesForm,poster_url:e.target.value})} placeholder="https://..."/></label><button className="admin-primary" disabled={busy}>{busy?<Loader2 className="spin"/>:<Plus size={16}/>} Salvar série</button></form>
    <section className="admin-card"><h2>Séries cadastradas <span className="admin-count">{series.length}</span></h2>{series.length===0?<p className="admin-muted">Nenhuma série cadastrada ainda.</p>:<div className="admin-list">{series.map(s=><div className="admin-list-item" key={s.id}><div><strong>{s.title}</strong><small>{s.genre||"Sem gênero"} · {episodes.filter(e=>e.series_id===s.id).length} episódio(s)</small></div><button title="Excluir série" onClick={()=>remove("series",s.id)}><Trash2 size={16}/></button></div>)}</div>}</section></div>
    : <div className="admin-columns"><form className="admin-card" onSubmit={submitEpisode}><h2><Plus size={18}/> Adicionar episódio</h2><label>Série<select required value={episodeForm.series_id} onChange={e=>setEpisodeForm({...episodeForm,series_id:e.target.value})}><option value="">Selecione uma série</option>{series.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label><div className="admin-two"><label>Temporada<input type="number" min="1" value={episodeForm.season_number} onChange={e=>setEpisodeForm({...episodeForm,season_number:e.target.value})}/></label><label>Nº do episódio<input type="number" min="1" value={episodeForm.episode_number} onChange={e=>setEpisodeForm({...episodeForm,episode_number:e.target.value})}/></label></div><label>Título do episódio<input required value={episodeForm.title} onChange={e=>setEpisodeForm({...episodeForm,title:e.target.value})} placeholder="Ex.: O começo"/></label><label>Link do YouTube<input required type="url" value={episodeForm.youtube_url} onChange={e=>setEpisodeForm({...episodeForm,youtube_url:e.target.value})} placeholder="https://youtu.be/..."/></label><label>Descrição (opcional)<textarea rows={2} value={episodeForm.synopsis} onChange={e=>setEpisodeForm({...episodeForm,synopsis:e.target.value})}/></label><div className="release-options"><strong>Quando o episódio será liberado?</strong><label className="radio-line"><input type="radio" name="mode" checked={episodeForm.mode==="published"} onChange={()=>setEpisodeForm({...episodeForm,mode:"published"})}/> Publicar imediatamente</label><label className="radio-line"><input type="radio" name="mode" checked={episodeForm.mode==="scheduled"} onChange={()=>setEpisodeForm({...episodeForm,mode:"scheduled"})}/> Agendar estreia com contagem regressiva global</label>{episodeForm.mode==="scheduled"&&<label>Data e horário da estreia<input required type="datetime-local" value={episodeForm.scheduled_at} onChange={e=>setEpisodeForm({...episodeForm,scheduled_at:e.target.value})}/><small>Use o horário de Brasília. A data pode ser escolhida com meses de antecedência.</small></label>}</div><button className="admin-primary" disabled={busy||!series.length}>{busy?<Loader2 className="spin"/>:<CalendarClock size={16}/>} {episodeForm.mode==="scheduled"?"Agendar estreia":"Publicar episódio"}</button></form>
    <section className="admin-card"><h2>Programação e episódios <span className="admin-count">{episodes.length}</span></h2>{episodes.length===0?<p className="admin-muted">Seus episódios aparecerão aqui.</p>:<div className="admin-list">{episodes.map(e=><div className="admin-list-item" key={e.id}><div><strong>{e.title}</strong><small>{series.find(s=>s.id===e.series_id)?.title||"Série"} · T{e.season_number} E{e.episode_number}</small><small className={e.status==="scheduled"&&!e.released?"admin-scheduled":"admin-published"}>{e.status==="draft"?"Rascunho":e.status==="scheduled"&&!e.released?`Estreia: ${dateValue(e.scheduled_at)}`:"Publicado"}</small></div><button title="Excluir episódio" onClick={()=>remove("episodes",e.id)}><Trash2 size={16}/></button></div>)}</div>}</section></div>}
    <div className="admin-footnote"><CheckCircle2 size={15}/> A estreia é controlada pelo servidor: todos os visitantes recebem o mesmo horário de liberação.</div></main></div>;
}