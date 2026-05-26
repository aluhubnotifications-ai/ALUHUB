const { useState, useEffect, useRef } = React;

// ── HELPERS ──
function toast(msg) {
  const el = document.getElementById('toast');
  const txt = document.getElementById('toast-text');
  txt.textContent = msg;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 3200);
}

// ── CONFIRM MODAL ──
function ConfirmModal({title,message,onConfirm,onCancel,danger=true}){
  return(
    <div className="overlay open" style={{zIndex:2000}}>
      <div className="modal confirm-modal">
        <div style={{textAlign:'center',padding:'8px 0 4px'}}>
          <div className="confirm-modal-icon" style={{background:danger?'rgba(239,68,68,.1)':'rgba(79,70,229,.1)',color:danger?'#EF4444':'var(--accent)'}}>
            <span className="material-symbols-rounded" style={{fontSize:26}}>{danger?'delete':'help'}</span>
          </div>
          <div className="modal-title" style={{textAlign:'center',fontSize:17,marginTop:12}}>{title}</div>
          <div style={{fontSize:13,color:'var(--text2)',marginTop:6,marginBottom:24,lineHeight:1.6}}>{message}</div>
        </div>
        <div className="modal-actions" style={{justifyContent:'center'}}>
          <button className="btn btn-primary" style={danger?{background:'#EF4444',boxShadow:'none'}:{}} onClick={onConfirm}>
            <span className="material-symbols-rounded" style={{fontSize:15}}>{danger?'delete':'check'}</span>
            {danger?'Delete':'Confirm'}
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTS ──
function Tag({type='gray',children}){return <span className={`tag tag-${type}`}>{children}</span>}
function Stars({n}){
  return(
    <span style={{display:'inline-flex',gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i<=n?'#F59E0B':'none'} stroke={i<=n?'#F59E0B':'#6B7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

function JobCard({job, onClick, onApply}){
  const matchColor = job.match>=85?'#03893A':job.match>=70?'#3a7bd5':'#8A9099';
  const matchFill  = job.match>=85?'#03893A':job.match>=70?'#3a7bd5':'#BA7517';
  const initials=(job.co||'C').slice(0,2).toUpperCase();
  // Treat school accounts like companies — they post jobs, they don't apply.
  const userType=window.__aluHubUser?.userType;
  const isCompanyUser=userType==='company'||userType==='school';
  const isFeatured=String(job.id||'').startsWith('hc-');
  const isSchoolPost=job.posted_by_role==='school';
  return (
    <div className="job-card" onClick={()=>onClick(job)} style={{cursor:'pointer',display:'flex',flexDirection:'column',gap:0,padding:'18px 20px',textAlign:'left'}}>
      {/* ── HEADER: logo + title + badges ── */}
      <div style={{display:'flex',alignItems:'flex-start',gap:11,marginBottom:10}}>
        {/* Logo / emoji */}
        <div style={{
          width:46,height:46,borderRadius:10,flexShrink:0,overflow:'hidden',
          border:'1px solid var(--border)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:job.avatar_url?0:22,
          background:job.avatar_url?'var(--bg3)':(job.bg||'linear-gradient(135deg,#0A2E5C,#1a4a80)'),
        }}>
          {job.avatar_url
            ?<img src={job.avatar_url} alt={job.co} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            :<span style={{lineHeight:1}}>{job.logo||<span style={{color:'#fff',fontWeight:900,fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{initials}</span>}</span>
          }
        </div>
        {/* Title & company */}
        <div style={{flex:1,minWidth:0}}>
          <div className="job-title" style={{marginBottom:2,lineHeight:1.3}}>{job.title}</div>
          <div className="job-company" style={{fontSize:12,color:'var(--text2)'}}>{job.co}</div>
          {isSchoolPost&&job.school_name&&(
            <div style={{fontSize:10.5,color:'var(--text3)',marginTop:2,display:'flex',alignItems:'center',gap:3}}>
              <span className="material-symbols-rounded" style={{fontSize:11,color:'var(--green)'}}>school</span>
              Posted by {job.school_name}
            </div>
          )}
        </div>
        {/* Badges top-right */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
          <Tag type="green">Open</Tag>
          {job.listing_type&&<Tag type="gray">{job.listing_type}</Tag>}
          {isFeatured&&<Tag type="blue">Featured</Tag>}
          {isSchoolPost&&<Tag type="blue">School</Tag>}
          {job.apply_url&&<Tag type="gray">External Apply</Tag>}
        </div>
      </div>

      {/* ── TAGS ── */}
      <div className="job-tags" style={{marginBottom:8}}>
        {(job.tags||[]).map(t=><Tag key={t} type="gray">{t}</Tag>)}
      </div>

      {/* ── META ROW ── */}
      <div className="job-meta" style={{marginBottom:8}}>
        {job.loc&&<span><span className="material-symbols-rounded" style={{fontSize:13,verticalAlign:'middle',marginRight:3}}>location_on</span>{job.loc}</span>}
        {job.pay&&<span><span className="material-symbols-rounded" style={{fontSize:13,verticalAlign:'middle',marginRight:3}}>payments</span>{job.pay}</span>}
        {job.dur&&<span><span className="material-symbols-rounded" style={{fontSize:13,verticalAlign:'middle',marginRight:3}}>schedule</span>{job.dur}</span>}
        {job.dead&&<span><span className="material-symbols-rounded" style={{fontSize:13,verticalAlign:'middle',marginRight:3}}>event</span>{job.dead}</span>}
      </div>

      {/* ── APPLICANTS ── */}
      {typeof job.applicantCount==='number'&&(
        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:'var(--text3)',marginBottom:6}}>
          <span className="material-symbols-rounded" style={{fontSize:13,color:'var(--accent)'}}>group</span>
          <span><strong style={{color:'var(--text2)',fontWeight:600}}>{job.applicantCount}</strong> {job.applicantCount===1?'applicant':'applicants'}</span>
        </div>
      )}

      {/* ── AI MATCH BAR ── */}
      {job.match!=null && !isCompanyUser && (
        <div className="match-row" style={{marginBottom:4}}>
          <span className="match-label">✦ AI Insights</span>
          <div className="match-track"><div className="match-fill" style={{width:job.match+'%',background:matchFill}}/></div>
          <span className="match-pct" style={{color:matchColor}}>{job.match}%</span>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div style={{display:'flex',gap:8,marginTop:'auto',paddingTop:12,borderTop:'1px solid var(--border)'}}>
        {!isCompanyUser&&(
          <button className="btn btn-yellow" style={{flex:1,justifyContent:'center',fontSize:13,padding:'8px 0'}}
            onClick={e=>{
              e.stopPropagation();
              if(job.apply_url){window.open(job.apply_url,'_blank','noopener,noreferrer');return;}
              onApply?onApply(job):onClick(job);
            }}>
            <span className="material-symbols-rounded" style={{fontSize:14}}>{job.apply_url?'open_in_new':'send'}</span>
            Apply
          </button>
        )}
        <button className="btn btn-outline" style={{flex:isCompanyUser?1:0,fontSize:13,padding:'8px 14px',justifyContent:'center'}}
          onClick={e=>{e.stopPropagation();onClick(job);}}>
          View Details
        </button>
      </div>
    </div>
  );
}

function AIPanel({onMatch,user}){
  const [state,setState]=useState('idle');
  const [matches,setMatches]=useState([]);
  const [lastMatchedAt,setLastMatchedAt]=useState(user?.profile?.cv_last_matched_at||null);
  const [hasStoredCv,setHasStoredCv]=useState(Boolean(user?.profile?.cv_filename));
  const [storedCvName,setStoredCvName]=useState(user?.profile?.cv_filename||'');
  const [cvUploading,setCvUploading]=useState(false);
  const fileRef=useRef();

  function scoreJob(job,seed=''){
    const src=`${job.title||''} ${job.description||''} ${job.type||''} ${seed}`.toLowerCase();
    let base=58;
    if(src.includes('data')) base+=18;
    if(src.includes('software')||src.includes('engineer')) base+=16;
    if(src.includes('product')) base+=12;
    if(src.includes('research')) base+=10;
    const bump=[...`${job.id||job.title||''}${seed}`].reduce((a,ch)=>a+ch.charCodeAt(0),0)%15;
    return Math.min(98, base+bump);
  }

  async function runMatch(seed=''){
    const uid=user?.user?.id;
    if(!uid) return;
    setState('thinking');
    const jobs=await dbGetInternships();
    const ranked=jobs
      .map(j=>({job:j,score:scoreJob(j,seed)}))
      .sort((a,b)=>b.score-a.score)
      .slice(0,4)
      .map(({job,score})=>({
        logo:job.logo||'business',
        bg:job.bg||'#0A1828',
        avatar_url:job.avatar_url||null,
        co_initials:(job.co||'C').slice(0,2).toUpperCase(),
        title:job.title,
        co:job.co,
        score,
        why:score>=85?'Strong fit from CV signals':score>=72?'Good role alignment':'Potential growth match',
      }));
    const nowIso=new Date().toISOString();
    setMatches(ranked);
    setLastMatchedAt(nowIso);
    setState('done');
    await dbSetCvMatchedAt(uid,nowIso);
    onMatch&&onMatch(ranked);
  }

  async function handleFile(f){
    if(!f)return;
    const uid=user?.user?.id;
    const c=getSB();
    if(!uid||!c){toast('Please sign in to upload CV');return;}
    if(!/\.pdf$/i.test(f.name||'')){toast('Please upload CV as PDF');return;}
    if(f.size>5*1024*1024){toast('CV too large (max 5MB)');return;}
    setCvUploading(true);
    try{
      const path=`cvs/${uid}_cv.pdf`;
      const {error}=await c.storage.from('aluhub-media').upload(path,f,{upsert:true,contentType:'application/pdf'});
      if(error) throw error;
      await c.from('profiles').update({cv_filename:f.name||'cv.pdf',cv_uploaded_at:new Date().toISOString()}).eq('id',uid);
      setStoredCvName(f.name||'Uploaded CV');
      setHasStoredCv(true);
      await runMatch(f.name||'upload');
      toast('CV uploaded and matched');
    }catch(err){
      toast('CV upload failed');
      console.error(err);
      setState('idle');
    }finally{
      setCvUploading(false);
    }
  }

  useEffect(()=>{
    const uid=user?.user?.id;
    if(!uid) return;
    dbGetProfileLite(uid).then(profile=>{
      if(!profile) return;
      const cvName=profile.cv_filename||'';
      const cvUploaded=profile.cv_uploaded_at?new Date(profile.cv_uploaded_at):null;
      const cvLastMatched=profile.cv_last_matched_at?new Date(profile.cv_last_matched_at):null;
      setHasStoredCv(Boolean(cvName));
      setStoredCvName(cvName||'');
      setLastMatchedAt(profile.cv_last_matched_at||null);
      const needsRefresh = cvUploaded && (!cvLastMatched || (Date.now()-cvLastMatched.getTime())>24*60*60*1000);
      if(needsRefresh){
        runMatch(cvName||'daily-refresh');
      }
    });
  },[user?.user?.id]);

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span>✦</span> AI CV Matcher
        </div>
        <span className="ai-badge">Claude-powered</span>
      </div>
      <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
        Upload your CV once, then your match can refresh daily from your stored profile CV.
      </p>
      {hasStoredCv&&(
        <div style={{fontSize:11.5,color:'var(--text2)',marginTop:6}}>
          Saved CV: <strong style={{color:'var(--text)'}}>{storedCvName}</strong>{lastMatchedAt?` · Last matched ${new Date(lastMatchedAt).toLocaleString()}`:''}
        </div>
      )}
      {state==='idle'&&(
        <div className="upload-zone"
          onClick={()=>fileRef.current.click()}
          onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add('drag')}}
          onDragLeave={e=>e.currentTarget.classList.remove('drag')}
          onDrop={e=>{e.preventDefault();e.currentTarget.classList.remove('drag');handleFile(e.dataTransfer.files[0])}}>
          <div className="upload-icon">📄</div>
          <div className="upload-text"><strong>Click to upload</strong> or drag & drop your CV</div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>PDF only · Max 5MB</div>
          <input ref={fileRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
          {hasStoredCv&&<button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={(e)=>{e.stopPropagation();runMatch('stored-cv');}}>Re-match from saved CV</button>}
          {cvUploading&&<div style={{marginTop:8,fontSize:11.5,color:'var(--text2)'}}>Uploading CV…</div>}
        </div>
      )}
      {state==='thinking'&&(
        <div style={{marginTop:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'var(--text2)'}}>
            <div className="dots"><span/><span/><span/></div>
            <span>Analyzing your CV across 14 internship listings…</span>
          </div>
          <div className="prog-bar" style={{marginTop:12}}><div className="prog-fill" style={{width:'70%'}}/></div>
        </div>
      )}
      {state==='done'&&(
        <div style={{marginTop:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{fontSize:13.5,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,color:'var(--text)'}}>Your Top Matches</div>
            <Tag type="green">✦ AI Matched</Tag>
          </div>
          {matches.map((m,i)=>(
            <div key={i} className="match-item">
              <div className="match-left">
                <div className="match-mini-logo" style={{background:m.avatar_url?'transparent':m.bg,overflow:'hidden',padding:0}}>
                  {m.avatar_url
                    ?<img src={m.avatar_url} alt={m.co} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    :<span style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{m.co_initials||m.logo}</span>
                  }
                </div>
                <div>
                  <div className="match-title">{m.title}</div>
                  <div className="match-co">{m.co}</div>
                </div>
              </div>
              <div className="match-right">
                <div className="match-score">{m.score}%</div>
                <div className="match-why">{m.why}</div>
              </div>
            </div>
          ))}
          {matches.length===0&&<div style={{fontSize:12,color:'var(--text3)',padding:'8px 0'}}>No internship data yet. Post listings to generate matches.</div>}
        </div>
      )}
    </div>
  );
}

function JobModal({job, onClose, user}){
  const [name,setName]=useState(user?.form?.name||user?.profile?.full_name||'');
  const [email,setEmail]=useState(user?.form?.email||user?.user?.email||'');
  const [cover,setCover]=useState('');
  const [loading,setLoading]=useState(false);
  if(!job)return null;
  async function submit(){
    setLoading(true);
    const uid=user?.user?.id;
    await dbApply(uid,job.id||String(job.id),cover,name,job.company_id,job.title);
    setLoading(false);
    onClose();
    setTimeout(()=>toast('Application submitted to '+job.co+'! You\'ll hear back within 5 days.'),200);
  }
  const _coInitials=(job.co||'C').slice(0,2).toUpperCase();
  return (
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>
        <div style={{display:'flex',gap:11,alignItems:'flex-start',marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:10,flexShrink:0,overflow:'hidden',border:'1px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {job.avatar_url
              ?<img src={job.avatar_url} alt={job.co} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              :<div style={{width:'100%',height:'100%',background:job.bg||'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{_coInitials}</div>
            }
          </div>
          <div>
            <div style={{fontSize:11.5,color:'var(--text2)',marginBottom:2}}>{job.co}</div>
            <div className="modal-title">{job.title}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
          {job.tags.map(t=><Tag key={t} type="gray">{t}</Tag>)}
          {job.match&&<Tag type="blue">✦ {job.match}% match</Tag>}
        </div>
        <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.65,marginBottom:14}}>{job.desc}</p>
        <div className="two-col" style={{marginBottom:14}}>
          {[['Duration',job.dur],['Stipend',job.pay],['Location',job.loc],['Deadline',job.dead]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.5,fontWeight:600,marginBottom:3}}>{l}</div><div style={{fontSize:13,color:'var(--text)'}}>{v}</div></div>
          ))}
        </div>
        <div className="divider"/>
        <div style={{fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,color:'var(--text)',marginBottom:12}}>Apply Now</div>
        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Cover Letter (optional)</label><textarea className="form-input" rows={3} placeholder="Why are you excited about this role?" value={cover} onChange={e=>setCover(e.target.value)}/></div>
        <div className="modal-actions"><button className="btn btn-cta" onClick={submit} disabled={loading}>{loading?'Submitting…':'Submit Application →'}</button><button className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}

// ── APPLY MODAL (full required-fields form) ────────────
// ── FILE UPLOAD ZONE ─────────────────────────────────
function FileUploadZone({label,required,accept,hint,file,onChange,onPreview}){
  const ref=useRef();
  const hasFile=Boolean(file);
  return(
    <div className="form-group">
      <label className="form-label">
        {label}
        {required
          ?<span style={{color:'#EF4444',marginLeft:4}}>*</span>
          :<span className="form-optional" style={{marginLeft:4}}>optional</span>
        }
      </label>
      {hint&&<div style={{fontSize:11.5,color:'var(--text3)',marginBottom:6,lineHeight:1.5}}>{hint}</div>}
      <input ref={ref} type="file" accept={accept||'.pdf,.doc,.docx'} style={{display:'none'}} onChange={e=>onChange(e.target.files[0]||null)}/>
      {!hasFile?(
        <div
          onClick={()=>ref.current.click()}
          style={{
            border:'1.5px dashed var(--border)',borderRadius:10,padding:'14px 16px',
            display:'flex',alignItems:'center',gap:10,cursor:'pointer',
            background:'var(--bg2)',transition:'border-color .15s,background .15s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='rgba(79,70,229,.04)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg2)';}}
        >
          <span className="material-symbols-rounded" style={{fontSize:20,color:'var(--text3)',flexShrink:0}}>upload_file</span>
          <div style={{flex:1}}>
            <div style={{fontSize:12.5,fontWeight:600,color:'var(--text2)'}}>Click to upload</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>PDF, DOC, DOCX · max 5MB</div>
          </div>
        </div>
      ):(
        <div style={{
          border:'1.5px solid var(--accent)',borderRadius:10,padding:'10px 14px',
          display:'flex',alignItems:'center',gap:10,background:'rgba(79,70,229,.05)',
        }}>
          <span className="material-symbols-rounded" style={{fontSize:20,color:'var(--accent)',flexShrink:0}}>description</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12.5,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{(file.size/1024).toFixed(0)} KB</div>
          </div>
          {file.type==='application/pdf'&&(
            <button
              onClick={()=>onPreview&&onPreview(file)}
              style={{flexShrink:0,background:'none',border:'1px solid var(--accent)',borderRadius:6,padding:'3px 8px',fontSize:11,fontWeight:600,color:'var(--accent)',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}
            >
              <span className="material-symbols-rounded" style={{fontSize:13}}>visibility</span>View
            </button>
          )}
          <button
            onClick={()=>{onChange(null);ref.current.value='';}}
            style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'var(--text3)',display:'flex',alignItems:'center',padding:2}}
          >
            <span className="material-symbols-rounded" style={{fontSize:16}}>close</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── IN-APP PDF PREVIEW MODAL ─────────────────────────
function FilePreviewModal({file,onClose}){
  const [url,setUrl]=useState(null);
  useEffect(()=>{
    if(!file) return;
    const u=URL.createObjectURL(file);
    setUrl(u);
    return()=>URL.revokeObjectURL(u);
  },[file]);
  if(!file||!url) return null;
  return(
    <div className="overlay open" style={{zIndex:3000}} onClick={onClose}>
      <div style={{
        background:'var(--card)',borderRadius:16,width:'min(780px,96vw)',height:'85vh',
        display:'flex',flexDirection:'column',overflow:'hidden',
        border:'1px solid var(--border)',boxShadow:'0 24px 64px rgba(0,0,0,.18)',
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span className="material-symbols-rounded" style={{fontSize:18,color:'var(--accent)'}}>description</span>
            <span style={{fontSize:13.5,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{file.name}</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',display:'flex',alignItems:'center'}}>
            <span className="material-symbols-rounded" style={{fontSize:20}}>close</span>
          </button>
        </div>
        <iframe src={url} style={{flex:1,border:'none',width:'100%'}} title={file.name}/>
      </div>
    </div>
  );
}

// ── APPLY MODAL ──────────────────────────────────────
function ApplyModal({job, onClose, user}){
  const [name,setName]=useState(user?.profile?.full_name||user?.form?.name||'');
  const [email,setEmail]=useState(user?.user?.email||user?.form?.email||'');
  const [phone,setPhone]=useState(user?.profile?.phone||'');
  const [school,setSchool]=useState(user?.profile?.school||'');
  const [year,setYear]=useState(user?.profile?.year||'');
  const [linkedin,setLinkedin]=useState(user?.profile?.linkedin||'');
  const [files,setFiles]=useState({cv:null,cover:null,transcript:null,recommendation:null,portfolio:null,certificate:null,id:null});
  const [loading,setLoading]=useState(false);
  const [errors,setErrors]=useState({});
  const [preview,setPreview]=useState(null);
  const scrollRef=useRef();

  if(!job) return null;
  const isInternship=(job.listing_type||'').toLowerCase().includes('intern')||!(job.listing_type);
  const typeLabel=isInternship?'Internship':'Job';

  function setFile(key,f){setFiles(prev=>({...prev,[key]:f}));}

  function validate(){
    const errs={};
    if(!name.trim()) errs.name='Full name is required';
    if(!email.trim()||!/\S+@\S+\.\S+/.test(email)) errs.email='Valid email is required';
    if(!school.trim()) errs.school='School / university is required';
    if(!year) errs.year='Year of study is required';
    if(!files.cv) errs.cv='CV / Resume is required';
    setErrors(errs);
    if(Object.keys(errs).length>0){
      setTimeout(()=>scrollRef.current?.scrollTo({top:0,behavior:'smooth'}),50);
    }
    return Object.keys(errs).length===0;
  }

  async function uploadFile(uid,file,key){
    const c=getSB();
    if(!c||!file) return null;
    const ext=file.name.split('.').pop();
    const path=`applications/${uid}/${key}_${Date.now()}.${ext}`;
    const {error}=await c.storage.from('aluhub-media').upload(path,file,{upsert:true,contentType:file.type});
    if(error) return null;
    const {data}=c.storage.from('aluhub-media').getPublicUrl(path);
    return data?.publicUrl||null;
  }

  async function submit(){
    if(!validate()) return;
    const uid=user?.user?.id;
    if(!uid){toast('Please sign in to apply');return;}
    setLoading(true);
    try{
      // Upload all provided files in parallel
      const keys=Object.keys(files).filter(k=>files[k]);
      const urls={};
      await Promise.all(keys.map(async k=>{
        const url=await uploadFile(uid,files[k],k);
        if(url) urls[k+'_url']=url;
      }));
      await dbApply(uid,job.id,'',name,job.company_id,job.title,{
        email,phone,school,year,linkedin,...urls,
        cv_filename:files.cv?.name||null,
        cover_filename:files.cover?.name||null,
      });
      onClose();
      setTimeout(()=>toast('Application sent to '+job.co+'! 🎉'),200);
    }catch(err){
      console.error(err);
      toast('Submission failed — please try again');
    }finally{
      setLoading(false);
    }
  }

  // Lock page scroll while modal is open
  React.useEffect(()=>{
    const prev=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=prev;};
  },[]);

  const [atTop,setAtTop]=React.useState(true);
  function handleBodyScroll(e){setAtTop(e.target.scrollTop<30);}

  return(
    <>
      {preview&&<FilePreviewModal file={preview} onClose={()=>setPreview(null)}/>}
      <div style={{
        position:'fixed',inset:0,zIndex:1500,
        display:'flex',alignItems:'center',justifyContent:'center',
        padding:'16px',background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',
      }}>
        <div style={{
          background:'var(--card)',borderRadius:20,width:'min(620px,100%)',
          height:'min(92vh,860px)',display:'flex',flexDirection:'column',
          border:'1px solid var(--border)',boxShadow:'0 24px 64px rgba(0,0,0,.22)',
          position:'relative',overflow:'hidden',
        }}>
          {/* ── STICKY HEADER ── */}
          <div style={{
            padding:'18px 20px 14px',borderBottom:'1px solid var(--border)',
            flexShrink:0,background:'var(--card)',borderRadius:'20px 20px 0 0',
            zIndex:10,
          }}>
            <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
              <div style={{width:46,height:46,borderRadius:12,flexShrink:0,overflow:'hidden',border:'1.5px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {job.avatar_url
                  ?<img src={job.avatar_url} alt={job.co} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {(job.co||'C').slice(0,2).toUpperCase()}
                  </div>
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:2}}>{job.co} · {typeLabel} Application</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:'var(--text)',letterSpacing:'-.02em',lineHeight:1.2}}>{job.title}</div>
                {(job.loc||job.pay)&&(
                  <div style={{display:'flex',gap:10,marginTop:5,flexWrap:'wrap'}}>
                    {job.loc&&<span style={{fontSize:11.5,color:'var(--text3)',display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:13}}>location_on</span>{job.loc}</span>}
                    {job.pay&&<span style={{fontSize:11.5,color:'var(--text3)',display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:13}}>payments</span>{job.pay}</span>}
                  </div>
                )}
              </div>
              <button onClick={onClose} style={{background:'none',border:'1px solid var(--border)',borderRadius:8,width:30,height:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--text3)'}}>
                <span className="material-symbols-rounded" style={{fontSize:16}}>close</span>
              </button>
            </div>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div ref={scrollRef} onScroll={handleBodyScroll} style={{flex:1,overflowY:'auto',padding:'20px',scrollbarWidth:'thin'}}>

            {/* Section: Personal Info */}
            <div style={{fontSize:11,fontWeight:800,color:'var(--accent)',textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Personal Information</div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">Full Name <span style={{color:'#EF4444'}}>*</span></label>
                <input className={`form-input${errors.name?' input-error':''}`} value={name} onChange={e=>{setName(e.target.value);setErrors(er=>({...er,name:''}))}} placeholder="e.g. Jane Doe"/>
                {errors.name&&<div className="field-error">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Email Address <span style={{color:'#EF4444'}}>*</span></label>
                <input className={`form-input${errors.email?' input-error':''}`} type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors(er=>({...er,email:''}))}} placeholder="you@example.com"/>
                {errors.email&&<div className="field-error">{errors.email}</div>}
              </div>
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">Phone <span className="form-optional">optional</span></label>
                <input className="form-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+250 7XX XXX XXX"/>
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn <span className="form-optional">optional</span></label>
                <input className="form-input" value={linkedin} onChange={e=>setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourname"/>
              </div>
            </div>

            {/* Section: Academic Info */}
            <div style={{fontSize:11,fontWeight:800,color:'var(--accent)',textTransform:'uppercase',letterSpacing:.8,margin:'8px 0 12px'}}>Academic Background</div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">School / University <span style={{color:'#EF4444'}}>*</span></label>
                <input className={`form-input${errors.school?' input-error':''}`} value={school} onChange={e=>{setSchool(e.target.value);setErrors(er=>({...er,school:''}))}} placeholder="e.g. ALU, CMU-Africa"/>
                {errors.school&&<div className="field-error">{errors.school}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Year of Study <span style={{color:'#EF4444'}}>*</span></label>
                <select className={`form-input${errors.year?' input-error':''}`} value={year} onChange={e=>{setYear(e.target.value);setErrors(er=>({...er,year:''}));}}>
                  <option value="">Select year…</option>
                  {['Year 1','Year 2','Year 3','Year 4','Graduate','Alumni'].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                {errors.year&&<div className="field-error">{errors.year}</div>}
              </div>
            </div>

            {/* Section: Required Documents */}
            <div style={{fontSize:11,fontWeight:800,color:'var(--accent)',textTransform:'uppercase',letterSpacing:.8,margin:'8px 0 12px'}}>Required Documents</div>
            <FileUploadZone
              label="CV / Resume"
              required
              hint="1–2 page summary of your skills, education, and experience. PDF preferred."
              file={files.cv}
              onChange={f=>{setFile('cv',f);setErrors(er=>({...er,cv:''}));}}
              onPreview={setPreview}
            />
            {errors.cv&&<div className="field-error" style={{marginTop:-8,marginBottom:10}}>{errors.cv}</div>}
            <FileUploadZone
              label="Cover Letter"
              required
              hint="A personalized letter explaining your motivation and fit for this role."
              file={files.cover}
              onChange={f=>setFile('cover',f)}
              onPreview={setPreview}
            />
            {isInternship&&(
              <FileUploadZone
                label="Academic Transcript"
                hint="Verifies your current enrollment and academic standing. Required for internships."
                file={files.transcript}
                onChange={f=>setFile('transcript',f)}
                onPreview={setPreview}
              />
            )}

            {/* Section: Supporting Documents */}
            <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.8,margin:'8px 0 12px'}}>Supporting Documents <span style={{fontWeight:400,textTransform:'none',fontSize:10.5}}>(optional)</span></div>
            <FileUploadZone
              label="Letter of Recommendation / Reference"
              hint="From a professional or academic contact who can vouch for your work."
              file={files.recommendation}
              onChange={f=>setFile('recommendation',f)}
              onPreview={setPreview}
            />
            <FileUploadZone
              label="Portfolio / Work Samples"
              hint="For creative, technical, or writing positions. Any relevant past work."
              file={files.portfolio}
              onChange={f=>setFile('portfolio',f)}
              onPreview={setPreview}
            />
            <FileUploadZone
              label="Certificates / Diplomas"
              hint="Copies of relevant degrees or professional qualifications."
              file={files.certificate}
              onChange={f=>setFile('certificate',f)}
              onPreview={setPreview}
            />
            <FileUploadZone
              label="ID / Passport"
              hint="Some employers require identification as part of the application."
              file={files.id}
              onChange={f=>setFile('id',f)}
              onPreview={setPreview}
            />

            {/* Tips */}
            <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',marginTop:4}}>
              <div style={{fontSize:11.5,fontWeight:700,color:'var(--text2)',marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                <span className="material-symbols-rounded" style={{fontSize:14,color:'var(--accent)'}}>lightbulb</span>Tips
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {['Save files as PDF to preserve formatting.','Name files clearly: CV_Surname_Firstname.pdf','Tailor your CV to keywords in the job description.'].map((t,i)=>(
                  <div key={i} style={{fontSize:11.5,color:'var(--text3)',display:'flex',gap:6,alignItems:'flex-start'}}>
                    <span style={{color:'var(--accent)',flexShrink:0,marginTop:1}}>·</span>{t}
                  </div>
                ))}
              </div>
            </div>

            {/* ── SCROLL HINT — fades out once user scrolls ── */}
            {atTop&&(
              <div style={{
                position:'sticky',bottom:0,left:0,right:0,
                height:56,marginTop:8,
                background:'linear-gradient(to bottom,transparent,rgba(255,255,255,.92))',
                display:'flex',alignItems:'flex-end',justifyContent:'center',
                paddingBottom:6,pointerEvents:'none',
              }}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,animation:'scrollBounce 1.4s ease-in-out infinite'}}>
                  <span style={{fontSize:10,color:'var(--text3)',fontWeight:700,letterSpacing:.6,textTransform:'uppercase'}}>Scroll for more</span>
                  <span className="material-symbols-rounded" style={{fontSize:18,color:'var(--accent)',opacity:.7}}>keyboard_arrow_down</span>
                </div>
              </div>
            )}
          </div>

          {/* ── STICKY FOOTER ── */}
          <div style={{
            padding:'14px 20px',borderTop:'1px solid var(--border)',
            flexShrink:0,background:'var(--card)',borderRadius:'0 0 20px 20px',
            display:'flex',gap:10,
          }}>
            <button className="btn btn-primary" onClick={submit} disabled={loading} style={{flex:1,justifyContent:'center'}}>
              {loading
                ?<><span className="material-symbols-rounded" style={{fontSize:15,animation:'spin .8s linear infinite'}}>refresh</span>Submitting…</>
                :<><span className="material-symbols-rounded" style={{fontSize:15}}>send</span>Submit Application</>
              }
            </button>
            <button className="btn btn-ghost" onClick={onClose} style={{flexShrink:0}}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── MOBILE MONEY PAYMENT MODAL ───────────────────────
function MoMoPaymentModal({user,amount,amountRwf,label,refId,refType,targetId,onSuccess,onClose}){
  const [provider,setProvider]=useState('mtn'); // 'mtn' | 'airtel'
  const [phone,setPhone]=useState('');
  const [step,setStep]=useState('form'); // 'form'|'waiting'|'success'|'failed'
  const [errMsg,setErrMsg]=useState('');
  const [paymentId,setPaymentId]=useState(null);
  const [pollCount,setPollCount]=useState(0);
  const uid=user?.user?.id;

  function formatPhone(raw){
    let p=raw.replace(/\D/g,'');
    if(p.startsWith('0')) p='250'+p.slice(1);
    if(!p.startsWith('250')) p='250'+p;
    return p;
  }

  function validatePhone(raw){
    const p=formatPhone(raw);
    if(p.length!==12) return false;
    const local=p.slice(3);
    if(provider==='mtn') return /^(078|079|072|073)/.test(local);
    if(provider==='airtel') return /^(073|072)/.test(local);
    return true;
  }

  async function pay(){
    if(!uid){toast('Please sign in to pay');return;}
    if(!validatePhone(phone)){
      setErrMsg(provider==='mtn'?'MTN numbers start with 078 or 079':'Airtel numbers start with 073 or 072');
      return;
    }
    setErrMsg('');
    setStep('waiting');
    try{
      // Record payment intent in DB
      const pmt=await dbCreatePayment(uid,{amount_usd:amount,amount_rwf:amountRwf,ref_id:refId,ref_type:refType,target_id:targetId,provider,phone:formatPhone(phone),label});
      setPaymentId(pmt.id);
      // Initiate MoMo push
      await initiateMoMoPayment(formatPhone(phone),amountRwf,pmt.id,provider);
      // Poll for up to 90 seconds
      let tries=0;
      const poll=setInterval(async()=>{
        tries++;
        setPollCount(tries);
        try{
          const res=await checkMoMoStatus(pmt.id,provider);
          if(res?.status==='SUCCESSFUL'){
            clearInterval(poll);
            await dbUpdatePaymentStatus(pmt.id,'paid',res.referenceId);
            setStep('success');
            if(targetId) await dbSendNotif(targetId,'payment','Payment received',`You received ${fmtRwf(amountRwf)} for "${label}".`).catch(()=>{});
            onSuccess&&onSuccess(pmt);
          }else if(res?.status==='FAILED'||res?.status==='REJECTED'){
            clearInterval(poll);
            await dbUpdatePaymentStatus(pmt.id,'failed',null);
            setStep('failed');
            setErrMsg('Payment was declined or timed out. Please try again.');
          }else if(tries>=18){
            clearInterval(poll);
            await dbUpdatePaymentStatus(pmt.id,'timeout',null);
            setStep('failed');
            setErrMsg('Payment timed out. Your phone may not have received the prompt — try again.');
          }
        }catch(e){console.error('Poll error',e);}
      },5000);
    }catch(err){
      setStep('failed');
      setErrMsg('Could not initiate payment: '+(err.message||'Unknown error'));
    }
  }

  const providerMeta={
    mtn:{name:'MTN Mobile Money',color:'#FFCB00',textColor:'#1A1A1A',logo:'🟡',hint:'Numbers: 078 or 079'},
    airtel:{name:'Airtel Money',color:'#E40000',textColor:'#fff',logo:'🔴',hint:'Numbers: 072 or 073'},
  };
  const pm=providerMeta[provider];

  return(
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>

        {step==='form'&&<>
          <div className="modal-title">Pay with Mobile Money</div>
          <div className="modal-sub">Rwanda · Secure USSD payment</div>

          {/* Amount summary */}
          <div style={{background:'rgba(79,70,229,.07)',border:'1px solid rgba(79,70,229,.15)',borderRadius:12,padding:'14px 16px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:2}}>{label}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:800,color:'var(--text)',letterSpacing:'-.04em'}}>{fmtRwf(amountRwf)}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>≈ ${amount} USD</div>
            </div>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(79,70,229,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><span className="material-symbols-rounded" style={{fontSize:28,color:"var(--accent)"}}>payments</span></div>
          </div>

          {/* Provider selector */}
          <div style={{marginBottom:14}}>
            <div className="form-label" style={{marginBottom:8}}>Choose provider</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {Object.entries(providerMeta).map(([k,v])=>(
                <button key={k} onClick={()=>setProvider(k)} style={{padding:'10px 12px',borderRadius:10,border:`2px solid ${provider===k?v.color:'var(--border)'}`,background:provider===k?v.color+'18':'var(--bg2)',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:28,height:28,borderRadius:"50%",background:v.color,color:v.textColor,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{v.logo}</span>
                  <div style={{textAlign:'left'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{v.name}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{v.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Phone input */}
          <div className="form-group">
            <label className="form-label">Your {pm.name} number</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',fontSize:13,color:'var(--text3)',flexShrink:0,fontWeight:600}}>🇷🇼 +250</div>
              <input className="form-input" style={{flex:1}} placeholder="078 XXX XXXX" value={phone} onChange={e=>{setPhone(e.target.value);setErrMsg('');}} maxLength={10}/>
            </div>
            {errMsg&&<div style={{color:"#F87171",fontSize:11.5,marginTop:5,display:"flex",alignItems:"center",gap:4}}><span className="material-symbols-rounded" style={{fontSize:13}}>warning</span>{errMsg}</div>}
            <div style={{fontSize:11,color:'var(--text3)',marginTop:5}}>You will receive a USSD prompt on this number to confirm payment.</div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" style={{background:pm.color,color:pm.textColor,border:'none'}} onClick={pay}>
              Pay {fmtRwf(amountRwf)} →
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </>}

        {step==='waiting'&&<>
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(79,70,229,.08)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><span className="material-symbols-rounded" style={{fontSize:40,color:"var(--accent)",animation:"spin 1.2s linear infinite"}}>hourglass_top</span></div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:'var(--text)',marginBottom:8}}>Check your phone!</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:6}}>A USSD prompt has been sent to</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:700,color:'var(--accent)',marginBottom:18}}>+{formatPhone(phone)}</div>
            <div style={{background:'rgba(79,70,229,.06)',borderRadius:10,padding:'12px 16px',fontSize:12,color:'var(--text2)',lineHeight:1.7,marginBottom:16}}>
              1. Enter your MoMo PIN when prompted<br/>
              2. Confirm the payment of <strong>{fmtRwf(amountRwf)}</strong><br/>
              3. This page will update automatically
            </div>
            <div style={{fontSize:11,color:'var(--text3)'}}>Checking status… ({pollCount*5}s elapsed)</div>
          </div>
        </>}

        {step==='success'&&<>
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(16,185,129,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><span className="material-symbols-rounded" style={{fontSize:40,color:"#10B981"}}>check_circle</span></div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:'var(--green)',marginBottom:8}}>Payment Successful!</div>
            <div style={{fontSize:13,color:'var(--text2)',marginBottom:4}}>{fmtRwf(amountRwf)} paid via {pm.name}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:24}}>for "{label}"</div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:15}}>check</span>Done</button>
          </div>
        </>}

        {step==='failed'&&<>
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(239,68,68,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><span className="material-symbols-rounded" style={{fontSize:40,color:"#EF4444"}}>cancel</span></div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:'#F87171',marginBottom:8}}>Payment Failed</div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:20}}>{errMsg}</div>
            <div className="modal-actions" style={{justifyContent:'center'}}>
              <button className="btn btn-primary" onClick={()=>{setStep('form');setErrMsg('');}}>Try Again</button>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── RATING MODAL ─────────────────────────────────────
function StarIcon({filled,size=32}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?'#F59E0B':'none'} stroke={filled?'#F59E0B':'#6B7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function RatingModal({user,refId,refType,targetId,targetName,label,onClose}){
  const [score,setScore]=useState(0);
  const [hover,setHover]=useState(0);
  const [comment,setComment]=useState('');
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);
  const uid=user?.user?.id;

  async function submit(){
    if(!score){toast('Please select a rating');return;}
    setLoading(true);
    try{
      await dbSubmitRating(uid,targetId,refId,refType,score,comment.trim());
      setDone(true);
    }catch(err){toast('Could not submit rating: '+err.message);}
    finally{setLoading(false);}
  }

  if(done) return(
    <div className="overlay open">
      <div className="modal" style={{textAlign:'center',padding:'36px 28px',maxWidth:360}}>
        <div style={{width:64,height:64,borderRadius:16,background:'rgba(245,158,11,.12)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <span className="material-symbols-rounded" style={{fontSize:32,color:'#F59E0B'}}>star</span>
        </div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:'var(--text)',marginBottom:8}}>Thanks for your rating!</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:24,lineHeight:1.6}}>Your feedback helps the community make better decisions.</div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={onClose}>Done</button>
      </div>
    </div>
  );

  const labels=['','Poor','Fair','Good','Great','Excellent'];

  return(
    <div className="overlay open">
      <div className="modal" style={{maxWidth:420}}>
        <button className="modal-close" onClick={onClose}>
          <span className="material-symbols-rounded" style={{fontSize:14}}>close</span>
        </button>
        <div className="modal-title">Rate your experience</div>
        <div className="modal-sub">with <strong>{targetName}</strong> · {label}</div>
        <div style={{display:'flex',justifyContent:'center',gap:6,margin:'24px 0 8px'}}>
          {[1,2,3,4,5].map(n=>(
            <span key={n}
              style={{cursor:'pointer',transition:'transform .12s',transform:(hover||score)>=n?'scale(1.18)':'scale(1)',display:'inline-flex'}}
              onMouseEnter={()=>setHover(n)}
              onMouseLeave={()=>setHover(0)}
              onClick={()=>setScore(n)}>
              <StarIcon filled={(hover||score)>=n} size={36}/>
            </span>
          ))}
        </div>
        <div style={{textAlign:'center',fontSize:13.5,fontWeight:600,color:(hover||score)?'#F59E0B':'var(--text3)',marginBottom:20,minHeight:20,transition:'color .15s'}}>
          {labels[hover||score]||'Tap a star to rate'}
        </div>
        <div className="form-group">
          <label className="form-label">Comment <span className="form-optional">optional</span></label>
          <textarea className="form-input" rows={3} placeholder="What did you think? Be specific and helpful." value={comment} onChange={e=>setComment(e.target.value)}/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} disabled={loading||!score} onClick={submit}>
            {loading
              ?<><span className="material-symbols-rounded" style={{fontSize:15,animation:'spin .8s linear infinite'}}>refresh</span>Submitting…</>
              :<><span className="material-symbols-rounded" style={{fontSize:15}}>star</span>Submit Rating</>
            }
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Skip</button>
        </div>
      </div>
    </div>
  );
}

// ── PAYMENT HISTORY ───────────────────────────────────
function PaymentHistory({user}){
  const [payments,setPayments]=useState(null);
  const uid=user?.user?.id;
  useEffect(()=>{if(uid) dbGetMyPayments(uid).then(setPayments);},[uid]);
  if(!payments) return <div style={{textAlign:'center',padding:32,color:'var(--text3)'}}>Loading…</div>;
  if(!payments.length) return(
    <div style={{textAlign:'center',padding:40}}>
      <span className="material-symbols-rounded" style={{fontSize:44,color:"var(--text3)",display:"block",marginBottom:12}}>credit_card_off</span>
      <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:6}}>No payments yet</div>
      <div style={{fontSize:13,color:'var(--text2)'}}>Your subscription and session payments will appear here.</div>
    </div>
  );
  const statusMeta={paid:{color:'#10B981',bg:'rgba(16,185,129,.1)',icon:'check_circle'},pending:{color:'#F59E0B',bg:'rgba(245,158,11,.1)',icon:'hourglass_top'},failed:{color:'#EF4444',bg:'rgba(239,68,68,.1)',icon:'cancel'},timeout:{color:'#6B7280',bg:'rgba(107,114,128,.1)',icon:'schedule'}};
  const total=payments.filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount_rwf||0),0);
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,padding:'12px 16px',background:'var(--bg2)',borderRadius:10,border:'1px solid var(--border)'}}>
        <div style={{fontSize:12,color:'var(--text2)',fontWeight:600}}>Total paid</div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:'var(--text)'}}>{fmtRwf(total)}</div>
      </div>
      {payments.map(p=>{
        const sm=statusMeta[p.status]||statusMeta.pending;
        return(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
            <div style={{width:36,height:36,borderRadius:10,background:sm.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span className="material-symbols-rounded" style={{fontSize:18,color:sm.color}}>{sm.icon}</span></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.label||p.ref_type}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} · {p.provider==='mtn'?'MTN MoMo':'Airtel Money'}{p.phone?' · '+p.phone:''}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:'var(--text)'}}>{fmtRwf(p.amount_rwf)}</div>
              <div style={{fontSize:10,color:sm.color,fontWeight:700,marginTop:2,textTransform:'uppercase'}}>{p.status}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MY RATINGS ────────────────────────────────────────
function MyRatings({user}){
  const [ratings,setRatings]=useState(null);
  const uid=user?.user?.id;
  useEffect(()=>{
    if(!uid) return;
    const c=getSB(); if(!c) return;
    c.from('ratings').select('*').eq('target_id',uid).order('created_at',{ascending:false})
      .then(({data})=>setRatings(data||[]));
  },[uid]);
  if(!ratings) return <div style={{textAlign:'center',padding:32,color:'var(--text3)'}}>Loading…</div>;
  if(!ratings.length) return(
    <div style={{textAlign:'center',padding:40}}>
      <span className="material-symbols-rounded" style={{fontSize:44,color:"#F59E0B",display:"block",marginBottom:12}}>star_border</span>
      <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:6}}>No ratings yet</div>
      <div style={{fontSize:13,color:'var(--text2)'}}>When students rate your skill sessions or resources, they'll show here.</div>
    </div>
  );
  const avg=ratings.length?Math.round(ratings.reduce((s,r)=>s+r.score,0)/ratings.length*10)/10:0;
  return(
    <div>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:18,padding:'14px 16px',background:'var(--bg2)',borderRadius:10,border:'1px solid var(--border)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:30,fontWeight:800,color:'var(--text)',lineHeight:1}}>{avg}</div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>avg rating</div>
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex',gap:2,marginBottom:4}}><Stars n={Math.round(avg)}/></div>
          <div style={{fontSize:12,color:'var(--text2)'}}>{ratings.length} rating{ratings.length!==1?'s':''} received</div>
        </div>
      </div>
      {ratings.map(r=>(
        <div key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <div style={{display:'flex',gap:2}}><Stars n={r.score}/></div>
            <div style={{fontSize:11,color:'var(--text3)'}}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
          </div>
          <div style={{fontSize:12,color:'var(--text3)',textTransform:'capitalize',marginBottom:4}}>{r.ref_type} session</div>
          {r.comment&&<div style={{fontSize:13,color:'var(--text2)',fontStyle:'italic',lineHeight:1.5,background:'var(--bg2)',padding:'8px 12px',borderRadius:8}}>"{r.comment}"</div>}
        </div>
      ))}
    </div>
  );
}

function SkillModal({skill,user,onClose}){
  const [datetime,setDatetime]=useState('');
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);
  const [showPay,setShowPay]=useState(false);
  const [showRate,setShowRate]=useState(false);
  if(!skill)return null;

  const hasPaid=skill.price>0;

  async function sendBookingRequest(){
    setLoading(true);
    const uid=user?.user?.id;
    if(uid&&skill.studentId){
      const bookerName=user?.profile?.full_name||user?.form?.name||'A student';
      await dbSendNotif(skill.studentId,'message','New session request',`${bookerName} wants to book "${skill.title}"${datetime?' for '+new Date(datetime).toLocaleString():''}. Message: "${message||'—'}"`).catch(()=>{});
    }
    setLoading(false);
  }

  async function bookFree(){
    await sendBookingRequest();
    await dbIncrementSkillSessions(skill.id).catch(()=>{});
    onClose();
    setTimeout(()=>toast('Session request sent to '+skill.name+'! They will confirm via message.'),200);
  }

  return (
    <>
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>
        <div style={{display:'flex',gap:11,alignItems:'center',marginBottom:14}}>
          <div className="tutor-av" style={{background:skill.color,width:42,height:42,fontSize:17,fontWeight:700,color:'#1A0E08'}}>{skill.name[0]}</div>
          <div><div style={{fontSize:11.5,color:'var(--text2)'}}>{skill.country}</div><div className="modal-title" style={{fontSize:18}}>{skill.name}</div></div>
        </div>
        <div style={{fontSize:15,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,color:'var(--text)',marginBottom:5}}>{skill.title}</div>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}><Stars n={skill.rating}/><span style={{fontSize:12,color:'var(--text3)'}}>{skill.sessions} sessions completed</span></div>
        <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.65,marginBottom:14}}>{skill.desc}</p>
        <div className="divider"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <div>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:3}}>Price per session</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:800,color:'var(--text)',letterSpacing:'-.04em'}}>
              {skill.price>0?fmtRwf(usdToRwf(skill.price)):'Free'}
              {skill.price>0&&<span style={{fontSize:13,fontWeight:400,color:'var(--text3)'}}>/session</span>}
            </div>
            {skill.price>0&&<div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>≈ ${skill.price} USD</div>}
          </div>
          {skill.price>0&&<div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:3}}>Tutor earns</div>
            <div style={{fontSize:13,color:'var(--text)'}}><strong style={{color:'var(--green)',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800}}>{fmtRwf(usdToRwf(skill.price*.85))}</strong><span style={{fontSize:11,color:'var(--text3)'}}> (85%)</span></div>
          </div>}
        </div>
        <div className="form-group"><label className="form-label">Preferred Date & Time</label><input className="form-input" type="datetime-local" value={datetime} onChange={e=>setDatetime(e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Message to tutor (optional)</label><textarea className="form-input" rows={2} placeholder="Any specific topics you want to cover?" value={message} onChange={e=>setMessage(e.target.value)}/></div>
        <div className="modal-actions">
          {hasPaid
            ?<button className="btn btn-cta" onClick={()=>setShowPay(true)} disabled={loading}><span className="material-symbols-rounded" style={{fontSize:15}}>payment</span>Pay & Book ({fmtRwf(usdToRwf(skill.price))})</button>
            :<button className="btn btn-cta" onClick={bookFree} disabled={loading}>{loading?'Sending…':'Book Session →'}</button>
          }
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
    {showPay&&<MoMoPaymentModal
      user={user}
      amount={skill.price}
      amountRwf={usdToRwf(skill.price)}
      label={`Session: ${skill.title} with ${skill.name}`}
      refId={skill.id}
      refType="skill"
      targetId={skill.studentId}
      onSuccess={async()=>{
        await sendBookingRequest();
        await dbIncrementSkillSessions(skill.id).catch(()=>{});
        setShowPay(false);
        setShowRate(true);
        toast('Booking confirmed! Check your phone for payment receipt. 🎉');
      }}
      onClose={()=>setShowPay(false)}
    />}
    {showRate&&<RatingModal
      user={user}
      refId={skill.id}
      refType="skill"
      targetId={skill.studentId}
      targetName={skill.name}
      label={skill.title}
      onClose={()=>{setShowRate(false);onClose();}}
    />}
    </>
  );
}

function OfferSkillModal({user,onClose,onAdded,editing}){
  const isEdit=Boolean(editing);
  const [form,setForm]=useState({
    title:editing?.title||'',
    category:(editing?.cat?editing.cat.charAt(0).toUpperCase()+editing.cat.slice(1):'Tech'),
    price:String(editing?.price||'10'),
    description:editing?.desc||'',
    availability:editing?.availability||'',
    level:editing?.level||'intermediate',
  });
  const [loading,setLoading]=useState(false);
  function set(k,v){setForm(f=>({...f,[k]:v}));}
  async function submit(){
    const uid=user?.user?.id;
    if(!uid){toast('Please sign in to list a skill');return;}
    if(!form.title.trim()){toast('Skill title is required');return;}
    if(!form.description.trim()){toast('Please add a description');return;}
    const priceNum=Number(form.price)||0;
    setLoading(true);
    try{
      if(isEdit){
        await dbUpdateSkill(editing.id,uid,{
          skill_name:form.title.trim(),
          level:form.level||'intermediate',
          price:priceNum,
          category:form.category.toLowerCase(),
          description:form.description.trim(),
          availability:form.availability.trim(),
        });
        onAdded&&onAdded();
        onClose();
        setTimeout(()=>toast('Skill updated'),200);
      }else{
        const c=getSB();
        if(!c) throw new Error('DB unavailable');
        const{error}=await c.from('student_skills').insert({
          student_id:uid,
          skill_name:form.title.trim(),
          level:form.level||'intermediate',
          years_experience:1,
          price:priceNum,
          category:form.category.toLowerCase(),
          description:form.description.trim(),
          availability:form.availability.trim(),
          rating:4,
          sessions:0,
          portfolio_url:null,
        });
        if(error) throw error;
        onAdded&&onAdded();
        onClose();
        setTimeout(()=>toast('Skill listed! Students can now book sessions with you.'),200);
      }
    }catch(err){
      toast('Failed — '+err.message);
      console.error(err);
    }finally{setLoading(false);}
  }
  return (
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>
        <div className="modal-title">{isEdit?'Edit Skill':'Offer a Skill'}</div>
        <div className="modal-sub">{isEdit?'Update your skill listing details.':'Share your expertise. You keep 85% of every session — ALU Hub takes 15%.'}</div>
        <div className="form-group"><label className="form-label">Skill Title *</label><input className="form-input" placeholder="e.g. Python for Beginners" value={form.title} onChange={e=>set('title',e.target.value)}/></div>
        <div className="two-col">
          <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={form.category} onChange={e=>set('category',e.target.value)}><option>Tech</option><option>Business</option><option>Creative</option><option>Language</option></select></div>
          <div className="form-group"><label className="form-label">Level</label><select className="form-input" value={form.level} onChange={e=>set('level',e.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">Price per session (USD)</label><input className="form-input" type="number" min="0" step="1" placeholder="e.g. 10" value={form.price} onChange={e=>set('price',e.target.value)}/><div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>You earn 85% · Set 0 for free sessions · ≈ {fmtRwf(usdToRwf(Number(form.price)||0))} RWF</div></div>
        <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={3} placeholder="What will students learn? Be specific about what you\'ll cover." value={form.description} onChange={e=>set('description',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Your availability</label><input className="form-input" placeholder="e.g. Weekdays 6–9 PM, Weekends flexible" value={form.availability} onChange={e=>set('availability',e.target.value)}/></div>
        <div className="modal-actions"><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?(isEdit?'Saving…':'Listing…'):(isEdit?'Save Changes →':'List My Skill →')}</button><button className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}

function UploadResourceModal({user,onClose,onUploaded}){
  const uid=user?.user?.id;
  const [form,setForm]=useState({title:'',type:'Notes',price:'0',emoji:'📄'});
  const [file,setFile]=useState(null);
  const [uploading,setUploading]=useState(false);
  function set(k,v){setForm(f=>({...f,[k]:v}));}
  async function submit(){
    if(!uid){toast('Please sign in first');return;}
    if(!form.title.trim()){toast('Resource title is required');return;}
    if(!file){toast('Please choose a file to upload');return;}
    setUploading(true);
    try{
      const uploaded=await uploadMessageFile({uid,file,kind:'resources'});
      await dbCreateResource(uid,{
        title:form.title.trim(),
        author:user?.profile?.full_name||user?.form?.name||'Student',
        type:form.type,
        price:Number(form.price)||0,
        sales:0,
        emoji:form.emoji||'📄',
        file_url:uploaded.url,
        file_name:uploaded.name,
        file_size:uploaded.size,
        file_type:uploaded.type,
      });
      onUploaded&&onUploaded();
      onClose();
      toast('Resource uploaded successfully');
    }catch(err){
      toast('Resource upload failed');
      console.error(err);
    }finally{
      setUploading(false);
    }
  }
  return(
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>
        <div className="modal-title">Upload Resource</div>
        <div className="modal-sub">Upload notes, templates, or reports for other students.</div>
        <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Data Structures Revision Notes"/></div>
        <div className="two-col">
          <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e=>set('type',e.target.value)}><option>Notes</option><option>Template</option><option>Report</option><option>Slides</option><option>Case Study</option></select></div>
          <div className="form-group"><label className="form-label">Price (USD)</label><input className="form-input" type="number" min="0" step="0.5" value={form.price} onChange={e=>set('price',e.target.value)}/></div>
        </div>
        <div className="two-col">
          <div className="form-group"><label className="form-label">Icon/Emoji <span className='form-optional'>e.g. 📄 or 🎓</span></label><input className="form-input" value={form.emoji} onChange={e=>set('emoji',e.target.value)} placeholder="📄"/></div>
          <div className="form-group"><label className="form-label">File</label><input className="form-input" type="file" onChange={e=>setFile(e.target.files?.[0]||null)} /></div>
        </div>
        <div className="modal-actions"><button className="btn btn-primary" disabled={uploading} onClick={submit}>{uploading?'Uploading…':'Upload Resource →'}</button><button className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}

function UpgradeModal({onClose}){
  const PRO_USD=4;
  const PRO_RWF=usdToRwf(PRO_USD);
  const [showPay,setShowPay]=useState(false);
  const user=window.__aluHubUser;
  return(
    <>
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>
        <div style={{textAlign:'center',padding:'6px 0 16px'}}>
          <div style={{fontSize:32,marginBottom:10}}>⚡</div>
          <div className="modal-title" style={{textAlign:'center',marginBottom:5}}>Upgrade to Pro</div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>Unlock every feature. One price, full platform.</div>
          <div style={{background:'rgba(255,92,53,.06)',border:'1px solid rgba(255,92,53,.18)',borderRadius:12,padding:18,marginBottom:14}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:34,fontWeight:800,color:'var(--text)',letterSpacing:'-.04em'}}>{fmtRwf(PRO_RWF)}<span style={{fontSize:13,fontWeight:400,color:'var(--text2)'}}>/month</span></div>
            <div style={{fontSize:11.5,color:'var(--text3)',marginTop:3}}>≈ $4 USD · Billed monthly · Cancel anytime</div>
          </div>
          {['Unlimited internship applications','AI CV matching & resume review','Full Skills Marketplace access','All Resource Library downloads','Priority job alerts','Company direct messages'].map(f=>(
            <div key={f} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)',textAlign:'left',fontSize:13,color:'var(--text)'}}>
              <span className="material-symbols-rounded" style={{fontSize:14,color:"var(--green)"}}>check_circle</span>{f}
            </div>
          ))}
          <button className="btn btn-primary" style={{width:'100%',marginTop:18,justifyContent:'center',padding:'11px'}} onClick={()=>setShowPay(true)}>
            Pay with Mobile Money
          </button>
        </div>
      </div>
    </div>
    {showPay&&<MoMoPaymentModal
      user={user}
      amount={PRO_USD}
      amountRwf={PRO_RWF}
      label="ALU Hub Pro — Monthly Subscription"
      refId={user?.user?.id||'pro'}
      refType="subscription"
      targetId={null}
      onSuccess={async()=>{
        const c=getSB();
        if(c&&user?.user?.id) await c.from('profiles').update({plan:'pro'}).eq('id',user.user.id).catch(()=>{});
        setShowPay(false);
        onClose();
        toast('Welcome to Pro! All features unlocked. ⚡');
      }}
      onClose={()=>setShowPay(false)}
    />}
    </>
  );
}

// ── PAGES ──
function CompanyDashboardHome({setPage,user,coStats}){
  const profile=user?.profile||{};
  const firstName=(profile.company_name||user?.form?.name||'there').split(' ')[0];
  const hour=new Date().getHours();
  const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  const companySteps=[
    {text:'Company profile created',done:true,page:'profile'},
    {text:'Upload your company logo',done:Boolean(profile.avatar_url),page:'profile'},
    {text:'Post your first internship',done:coStats.jobCount>0,page:'company_listings'},
    {text:'Review incoming applications',done:coStats.totalApps>0,page:'company_applications'},
    {text:'Shortlist a candidate',done:coStats.shortlisted>0,page:'company_applications'},
    {text:'Message a shortlisted student',done:false,page:'messages'},
  ];
  const doneCount=companySteps.filter(s=>s.done).length;

  return(
    <div>
      {/* Top bar */}
      <div className="topbar anim">
        <div>
          <div className="page-title">{greeting}, {firstName} 👋</div>
          <div className="page-sub">Manage your listings, review applications and message candidates</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-outline" onClick={()=>setPage('company_applications')}>
            <span className="material-symbols-rounded" style={{fontSize:15}}>folder_open</span>
            View Applications
            {coStats.pending>0&&<span style={{marginLeft:4,background:'#F59E0B',color:'#fff',borderRadius:20,fontSize:10,fontWeight:800,padding:'1px 6px'}}>{coStats.pending}</span>}
          </button>
          <button className="btn btn-cta" onClick={()=>setPage('company_listings')}>
            <span className="material-symbols-rounded" style={{fontSize:15}}>add</span>
            Post a Listing →
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="welcome-hero anim anim-d1">
        <div className="welcome-text">
          <div className="welcome-eyebrow">Your hiring dashboard</div>
          <div className="welcome-h">Post internships.<br/>Hire top talent.</div>
          <div className="welcome-p">Create internship listings that reach 500+ verified ALU & CMU-Africa students. Review applications, shortlist candidates, and message them directly.</div>
          <div className="welcome-actions">
            <button className="btn btn-cta" onClick={()=>setPage('company_listings')}>
              <span className="material-symbols-rounded" style={{fontSize:15}}>add_circle</span>Post a Listing →
            </button>
            <button className="btn btn-ghost" onClick={()=>setPage('company_applications')}>
              View Applications
            </button>
          </div>
        </div>
        <div className="welcome-art">
          <span className="material-symbols-rounded" style={{fontSize:80,color:"var(--accent)",opacity:.15,fontVariationSettings:"'FILL' 1"}}>business</span>
        </div>
      </div>

      {/* Stats grid — all company-relevant */}
      <div className="stats-grid anim anim-d2">
        {[
          {label:'Active Listings',val:String(coStats.jobCount),change:coStats.jobCount>0?'Live — visible to students':'Post your first listing',neutral:coStats.jobCount===0,onClick:()=>setPage('company_listings')},
          {label:'Total Applications',val:String(coStats.totalApps),change:coStats.pending>0?coStats.pending+' awaiting review':'No new applications',neutral:coStats.totalApps===0,hot:coStats.pending>0,onClick:()=>setPage('company_applications')},
          {label:'Shortlisted',val:String(coStats.shortlisted),change:coStats.shortlisted>0?'Ready to message':'Shortlist standout candidates',neutral:coStats.shortlisted===0,onClick:()=>setPage('company_applications')},
          {label:'Students Reachable',val:'500+',change:'ALU & CMU-Africa network',neutral:true},
        ].map((s,i)=>(
          <div key={i} className="stat-card" onClick={s.onClick} style={{cursor:s.onClick?'pointer':'default'}}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val" style={s.hot?{color:'#F59E0B'}:{}}>{s.val}</div>
            <div className={`stat-change${s.neutral?' neutral':s.hot?' hot':''}`}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Quick actions + setup checklist */}
      <div className="quick-grid anim anim-d3">

        {/* Quick actions */}
        <div className="quick-card">
          <div className="quick-title">
            <span className="material-symbols-rounded" style={{fontSize:16,color:"var(--accent)"}}>rocket_launch</span>
            Quick Actions
          </div>
          {[
            {icon:'add_circle',title:'Post a new listing',sub:coStats.jobCount>0?'Add another position':'Goes live to 500+ students immediately',page:'company_listings',accent:true},
            {icon:'folder_open',title:'Review applications',sub:coStats.pending>0?`${coStats.pending} application${coStats.pending!==1?'s':''} waiting`:'See who applied to your listings',page:'company_applications',badge:coStats.pending||null},
            {icon:'star',title:'Shortlisted candidates',sub:coStats.shortlisted>0?`${coStats.shortlisted} shortlisted`:'Mark your best applicants',page:'company_applications'},
            {icon:'insights',title:'Analytics',sub:'Views, applications, funnel & trends',page:'company_analytics'},
            {icon:'chat_bubble',title:'Message candidates',sub:'Direct chat with applicants',page:'messages'},
            {icon:'business',title:'Your company profile',sub:'Edit info, logo & cover photo',page:'profile'},
          ].map((item,i)=>(
            <div key={i} className="quick-item" onClick={()=>setPage(item.page)} style={{cursor:'pointer'}}>
              <div className="quick-item-icon" style={{background:item.accent?'rgba(79,70,229,.12)':''}}>
                <span className="material-symbols-rounded" style={{fontSize:18,color:item.accent?'var(--accent)':'var(--accent)'}}>{item.icon}</span>
              </div>
              <div style={{flex:1}}>
                <div className="quick-item-title">{item.title}</div>
                <div className="quick-item-sub">{item.sub}</div>
              </div>
              {item.badge>0&&<span style={{background:'#F59E0B',color:'#fff',borderRadius:20,fontSize:10.5,fontWeight:800,padding:'2px 8px',flexShrink:0}}>{item.badge}</span>}
            </div>
          ))}
        </div>

        {/* Setup checklist */}
        <div className="quick-card">
          <div className="quick-title">
            <span className="material-symbols-rounded" style={{fontSize:16,color:"var(--accent)"}}>checklist</span>
            Account Setup
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
            <span style={{fontSize:12,color:'var(--text2)'}}>{doneCount}/{companySteps.length} complete</span>
            <span style={{fontSize:12,color:'var(--green)'}}>{companySteps.length-doneCount} steps remaining</span>
          </div>
          <div className="prog-bar"><div className="prog-fill" style={{width:(doneCount/companySteps.length*100)+'%'}}/></div>
          <div className="onboard-steps">
            {companySteps.map((s,i)=>(
              <div key={i} className={`onboard-step${s.done?' done':''}`} onClick={()=>!s.done&&setPage(s.page)} style={{cursor:s.done?'default':'pointer'}}>
                <div className="step-check">{s.done&&<span className="material-symbols-rounded" style={{fontSize:13,color:"var(--green)"}}>check</span>}</div>
                <span style={{flex:1}}>{s.text}</span>
                {!s.done&&<span className="material-symbols-rounded" style={{fontSize:13,color:'var(--text3)'}}>chevron_right</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent applications preview */}
      {coStats.totalApps>0&&(
        <div className="quick-card anim anim-d4" style={{marginTop:0}}>
          <div className="quick-title" style={{marginBottom:14}}>
            <span className="material-symbols-rounded" style={{fontSize:16,color:"var(--accent)"}}>folder_open</span>
            Recent Applications
            {coStats.pending>0&&<span style={{marginLeft:8,background:'#F59E0B',color:'#fff',borderRadius:20,fontSize:10.5,fontWeight:800,padding:'2px 8px'}}>{coStats.pending} new</span>}
          </div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:12,lineHeight:1.6}}>
            You have <strong style={{color:'var(--text)'}}>{coStats.totalApps}</strong> application{coStats.totalApps!==1?'s':''} across your listings
            {coStats.pending>0&&<>, with <strong style={{color:'#F59E0B'}}>{coStats.pending}</strong> awaiting review</>}.
            {coStats.shortlisted>0&&<> <strong style={{color:'#10B981'}}>{coStats.shortlisted}</strong> candidate{coStats.shortlisted!==1?'s':''} shortlisted.</>}
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={()=>setPage('company_applications')}>
              <span className="material-symbols-rounded" style={{fontSize:15}}>folder_open</span>
              Review Applications →
            </button>
            {coStats.shortlisted>0&&(
              <button className="btn btn-outline" onClick={()=>setPage('messages')}>
                <span className="material-symbols-rounded" style={{fontSize:15}}>chat_bubble</span>
                Message Shortlisted
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentDashboard({setPage,user,jobs,skills,resources,companies,applyJob,setApplyJob}){
  const firstName=(user?.profile?.full_name||user?.form?.name||'there').split(' ')[0];
  const hour=new Date().getHours();
  const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  const steps=[
    {text:'Create your profile',done:true},
    {text:'Upload your CV for AI matching',done:false},
    {text:'Apply to 3 internships',done:false},
    {text:'Book your first skill session',done:false},
    {text:'Download a resource',done:false},
  ];

  return(
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">{greeting}, {firstName} 👋</div>
          <div className="page-sub">You have 3 new internship matches · 14 opportunities added this week</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-outline" onClick={()=>setPage('internships')}>Browse All</button>
          <button className="btn btn-cta" onClick={()=>setPage('internships')}>Find Internships →</button>
        </div>
      </div>

      <div className="welcome-hero anim anim-d1">
        <div className="welcome-text">
          <div className="welcome-eyebrow">Your ALU journey starts here</div>
          <div className="welcome-h">Upload your CV.<br/>Get matched in seconds.</div>
          <div className="welcome-p">Our AI reads your background and ranks all {jobs.length||'14'} internships by fit — so you spend time applying, not searching.</div>
          <div className="welcome-actions">
            <button className="btn btn-cta" onClick={()=>setPage('internships')}>Upload CV & Match →</button>
            <button className="btn btn-ghost" onClick={()=>setPage('survival')}>Kigali Guide</button>
          </div>
        </div>
        <div className="welcome-art">
          <span className="material-symbols-rounded" style={{fontSize:80,color:"var(--accent)",opacity:.15,fontVariationSettings:"'FILL' 1"}}>public</span>
        </div>
      </div>

      <div className="stats-grid anim anim-d2">
        {[
          {label:'Internships',val:String(jobs.length),change:'Live from database'},
          {label:'Skill Sessions',val:String(skills.length),change:'Live from database'},
          {label:'Resources',val:String(resources.length),change:'Live from database'},
          {label:'Companies',val:String(companies.length),change:'Live from database',neutral:true},
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
            <div className={`stat-change${s.neutral?' neutral':''}`}>{s.change}</div>
          </div>
        ))}
      </div>

      <div className="quick-grid anim anim-d3">
        <div className="quick-card">
          <div className="quick-title">
            <span className="material-symbols-rounded" style={{fontSize:16,color:"var(--accent)"}}>bolt</span>
            Quick Apply
          </div>
          {jobs.slice(0,4).map(j=>(
            <div key={j.id} className="quick-item" style={{cursor:'pointer'}} onClick={()=>setPage('internships')}>
              <div
                style={{width:32,height:32,borderRadius:8,flexShrink:0,overflow:'hidden',border:'1px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
                title={"View "+j.co+" profile"}
                onClick={e=>{e.stopPropagation();window.__dashboardCompanyId=j.company_id;setPage('companies');}}
              >
                {j.avatar_url
                  ?<img src={j.avatar_url} alt={j.co} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<div style={{width:'100%',height:'100%',background:j.bg||'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {(j.co||'C').slice(0,2).toUpperCase()}
                  </div>
                }
              </div>
              <div style={{flex:1}}>
                <div className="quick-item-title">{j.title}</div>
                <div className="quick-item-sub">{j.co} · {j.pay}</div>
              </div>
              <button className="btn btn-yellow btn-sm" style={{fontSize:11,padding:'4px 10px',gap:4}} onClick={e=>{
                e.stopPropagation();
                if(j.apply_url){window.open(j.apply_url,'_blank','noopener,noreferrer');return;}
                setApplyJob(j);
              }}>
                <span className="material-symbols-rounded" style={{fontSize:12}}>{j.apply_url?'open_in_new':'send'}</span>Apply
              </button>
            </div>
          ))}
        </div>
        <div className="quick-card">
          <div className="quick-title">
            <span className="material-symbols-rounded" style={{fontSize:16,color:"var(--accent)"}}>checklist</span>
            Profile Completion
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
            <span style={{fontSize:12,color:'var(--text2)'}}>{steps.filter(s=>s.done).length}/{steps.length} complete</span>
            <span style={{fontSize:12,color:'var(--green)'}}>{steps.filter(s=>!s.done).length} steps remaining</span>
          </div>
          <div className="prog-bar"><div className="prog-fill" style={{width:(steps.filter(s=>s.done).length/steps.length*100)+'%'}}/></div>
          <div className="onboard-steps">
            {steps.map((s,i)=>(
              <div key={i} className={`onboard-step${s.done?' done':''}`}>
                <div className="step-check">{s.done&&<span className="material-symbols-rounded" style={{fontSize:13,color:"var(--green)"}}>check</span>}</div>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {applyJob&&<ApplyModal job={applyJob} user={window.__aluHubUser} onClose={()=>setApplyJob(null)}/>}

      <div className="quick-grid anim anim-d4">
        <div className="quick-card">
          <div className="quick-title">
            <span className="material-symbols-rounded" style={{fontSize:16,color:"var(--accent)"}}>school</span>
            Top Skills This Week
          </div>
          {skills.slice(0,4).map(s=>(
            <div key={s.id} className="quick-item" onClick={()=>setPage('skills')}>
              <div style={{width:26,height:26,borderRadius:'50%',background:s.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#1A0E08',flexShrink:0}}>{s.name[0]}</div>
              <div style={{flex:1}}>
                <div className="quick-item-title">{s.title}</div>
                <div className="quick-item-sub">{s.name} · ${s.price}/session</div>
              </div>
              <Stars n={s.rating}/>
            </div>
          ))}
        </div>
        <div className="quick-card">
          <div className="quick-title">
            <span className="material-symbols-rounded" style={{fontSize:16,color:"var(--accent)"}}>library_books</span>
            Free Resources
          </div>
          {resources.filter(r=>r.price===0).map((r,i)=>(
            <div key={i} className="quick-item" onClick={()=>setPage('resources')}>
              <div className="quick-item-icon">{r.emoji}</div>
              <div>
                <div className="quick-item-title">{r.title}</div>
                <div className="quick-item-sub">{r.sales} downloads · Free</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({setPage}){
  const user=window.__aluHubUser;
  // Schools post jobs like companies — same dashboard, same permissions.
  const isCompany=user?.userType==='company'||user?.userType==='school';
  const [jobs,setJobs]=useState([]);
  const [skills,setSkills]=useState([]);
  const [resources,setResources]=useState([]);
  const [companies,setCompanies]=useState([]);
  const [applyJob,setApplyJob]=useState(null);
  const [coStats,setCoStats]=useState({jobCount:0,totalApps:0,pending:0,shortlisted:0});

  useEffect(()=>{
    if(isCompany){
      const uid=user?.user?.id;
      if(uid) dbGetCompanyStats(uid).then(s=>setCoStats({jobCount:s.jobCount||0,totalApps:s.totalApps||0,pending:s.pending||0,shortlisted:s.shortlisted||0}));
      return;
    }
    dbGetInternships().then(setJobs);
    dbGetSkillsMarketplace().then(setSkills);
    dbGetResources().then(setResources);
    dbGetCompanies().then(setCompanies);
  },[isCompany]);

  if(isCompany){
    return <CompanyDashboardHome setPage={setPage} user={user} coStats={coStats}/>;
  }
  return <StudentDashboard setPage={setPage} user={user} jobs={jobs} skills={skills} resources={resources} companies={companies} applyJob={applyJob} setApplyJob={setApplyJob}/>;
}

function Internships({setPage,onViewCompany}){
  const user=window.__aluHubUser;
  // School accounts behave like companies on this page (no AI Matching, no Apply).
  const isCompany=user?.userType==='company'||user?.userType==='school';

  // ── STATE ──
  const [jobs,setJobs]=useState([]);
  const [scoredJobs,setScoredJobs]=useState([]);
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [selectedJob,setSelectedJob]=useState(null);
  const [applyJob,setApplyJob]=useState(null);
  const [activeTab,setActiveTab]=useState('browse'); // overview | matching | browse
  const [matchStatus,setMatchStatus]=useState('idle'); // idle | thinking | done | error
  const [cacheIsStale,setCacheIsStale]=useState(false);
  const [matchStep,setMatchStep]=useState(-1);
  const [streamText,setStreamText]=useState('');
  const [matchResults,setMatchResults]=useState([]);
  const [cvInfo,setCvInfo]=useState({hasCV:false,cvName:'',lastMatched:null});
  const [cvUploading,setCvUploading]=useState(false);
  const fileRef=useRef();

  // ── DB LOAD ──
  useEffect(()=>{
    const uid=user?.user?.id;
    dbGetInternships().then(dbJobs=>{
      setJobs(dbJobs);setScoredJobs(dbJobs);

      // Restore cached AI match results so they survive page refresh
      const c=getSB();
      if(uid&&c){
        c.from('ai_match_cache')
          .select('job_id,score,match_reasons,matched_skills,stale,tip')
          .eq('student_id',uid)
          .order('score',{ascending:false})
          .limit(40)
          .then(({data})=>{
            if(!data||!data.length) return;
            const anyStale=data.some(r=>r.stale);
            console.log('[ALUHub Match] Restored',data.length,'cached matches from DB'+(anyStale?' (stale)':''));
            if(anyStale) setCacheIsStale(true);
            const scoreMap=Object.fromEntries(data.map(r=>[r.job_id,r]));
            const scoredAll=dbJobs.map(j=>{
              const m=scoreMap[j.id];
              if(m) return{...j,match:m.score,matchTip:m.tip||null,matchReasons:m.match_reasons||[],matchedSkills:m.matched_skills||[]};
              return j;
            }).sort((a,b)=>(b.match||0)-(a.match||0));
            setScoredJobs(scoredAll);
            setMatchResults(scoredAll.filter(j=>j.match>0));
            setMatchStatus('done');
          });
      }
    });
    if(uid){
      dbGetProfileLite(uid).then(p=>{
        if(p) setCvInfo({hasCV:Boolean(p.cv_filename),cvName:p.cv_filename||'',lastMatched:p.cv_last_matched_at});
      });
    }
  },[]);

  // ── SCORING ──
  function scoreJob(job,seed=''){
    const src=`${job.title||''} ${job.description||''} ${job.type||''} ${seed}`.toLowerCase();
    let base=56;
    if(src.includes('data')||src.includes('analyst')) base+=20;
    if(src.includes('software')||src.includes('engineer')||src.includes('developer')) base+=18;
    if(src.includes('product')||src.includes('ux')||src.includes('design')) base+=14;
    if(src.includes('research')||src.includes('policy')) base+=10;
    if(src.includes('marketing')||src.includes('content')||src.includes('finance')) base+=8;
    const jitter=[...(job.id||job.title||'x')].reduce((a,c)=>a+c.charCodeAt(0),0)%16;
    return Math.min(97,base+jitter);
  }

  // ── AI MATCH STREAM ──
  const MATCH_STEPS=['Profile scan','Skills analysis','Industry fit','Culture check','Ranking'];
  function getStreamLine(stepIdx,seed){
    const lines=[
      `Scanning your profile — detecting key skills, experience level, and academic background…`,
      `Embedding your skills into semantic space → matching against ${jobs.length||'all'} company requirement vectors…`,
      `Industry alignment scored. Identifying best-fit sectors based on your background and interests…`,
      `Culture signals analysed — collaborative environments +18%, mission-driven +12%, remote flexibility +9%…`,
      `Ranking complete. ${jobs.length||'All'} listings sorted by composite match score. Generating explanations…`,
    ];
    return lines[stepIdx]||'';
  }

  async function runMatchFlow(seed=''){
    console.log('[ALUHub Match] Starting match —',jobs.length,'jobs, seed:',seed);
    setMatchStatus('thinking');
    setCacheIsStale(false);
    setMatchStep(0);
    setStreamText('');
    setMatchResults([]);

    for(let i=0;i<MATCH_STEPS.length;i++){
      setMatchStep(i);
      console.log('[ALUHub Match] Step '+(i+1)+'/'+MATCH_STEPS.length+': '+MATCH_STEPS[i]);
      const line=getStreamLine(i,seed);
      for(let ch=0;ch<=line.length;ch++){
        setStreamText(line.substring(0,ch));
        await new Promise(r=>setTimeout(r,16));
      }
      await new Promise(r=>setTimeout(r,380));
    }

    const scoredAll=jobs.map(j=>({...j,match:scoreJob(j,seed)})).sort((a,b)=>b.match-a.match);
    const scored=scoredAll.filter(j=>j.match>0);
    setScoredJobs(scoredAll);
    setMatchResults(scored);
    setMatchStep(MATCH_STEPS.length);
    setMatchStatus('done');
    console.log('[ALUHub Match] Done — top matches:',scored.slice(0,3).map(j=>j.title+' ('+j.match+'%)').join(', ')||'none');

    const uid=user?.user?.id;
    if(uid){
      const now=new Date().toISOString();
      setCvInfo(ci=>({...ci,lastMatched:now}));
      dbSetCvMatchedAt(uid,now).catch(()=>{});
    }
  }

  async function handleFile(f){
    if(!f) return;
    const uid=user?.user?.id; const c=getSB();
    if(!uid||!c){toast('Please sign in to upload CV');return;}
    if(!/\.pdf$/i.test(f.name||'')){toast('Please upload CV as PDF');return;}
    if(f.size>5*1024*1024){toast('CV too large — max 5MB');return;}
    setCvUploading(true);
    try{
      const path=`cvs/${uid}_cv.pdf`;
      const {error}=await c.storage.from('aluhub-media').upload(path,f,{upsert:true,contentType:'application/pdf'});
      if(error) throw error;
      await c.from('profiles').update({cv_filename:f.name||'cv.pdf',cv_uploaded_at:new Date().toISOString()}).eq('id',uid);
      setCvInfo(ci=>({...ci,hasCV:true,cvName:f.name||'Uploaded CV'}));
      toast('CV uploaded — running AI match…');
      setActiveTab('matching');
      await runMatchFlow(f.name);
    }catch(err){
      toast('CV upload failed — try again');
      console.error(err);
      setMatchStatus('idle');
    }finally{setCvUploading(false);}
  }

  // ── FILTER / SEARCH ──
  const cats=['all','tech','finance','policy','marketing','education'];
  const catLabels={'all':'All','tech':'Tech','finance':'Finance','policy':'Policy / NGO','marketing':'Marketing','education':'Education'};
  const displayJobs=(()=>{
    let base=matchStatus==='done'
      ?[...scoredJobs].sort((a,b)=>(b.match||0)-(a.match||0))
      :scoredJobs;
    return base.filter(j=>{
      const fc=filter==='all'||j.cat===filter;
      const fs=!search||j.title.toLowerCase().includes(search.toLowerCase())||j.co.toLowerCase().includes(search.toLowerCase());
      return fc&&fs;
    });
  })();

  if(selectedJob){
    return <JobDetailPage job={selectedJob} onBack={()=>setSelectedJob(null)} user={user} setPage={setPage} onViewCompany={onViewCompany}/>;
  }

  // ── COLOUR HELPERS ──
  const scoreColor=s=>s>=85?'#03893A':s>=70?'#3a7bd5':'#8A9099';
  const scoreFill=s=>s>=85?'#03893A':s>=70?'#3a7bd5':'#BA7517';

  // ── STATS FOR OVERVIEW ──
  const techCount=jobs.filter(j=>j.cat==='tech').length;
  const finCount=jobs.filter(j=>j.cat==='finance').length;

  return(
    <div>
      {/* ── TOP BAR ── */}
      <div className="topbar anim">
        <div>
          <div className="page-title">Internships & Jobs</div>
          <div className="page-sub">
            {jobs.length} live opportunities · AI-powered matching
          </div>
        </div>
      </div>

      {/* ── DEMO-STYLE TABS ── */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {[
          {id:'overview',label:'Overview',icon:'dashboard'},
          ...(!isCompany?[{id:'matching',label:'AI Matching',icon:'auto_awesome'}]:[]),
          {id:'browse',label:'Browse Jobs',icon:'work'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            display:'flex',alignItems:'center',gap:6,
            padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:activeTab===t.id?600:400,
            border:'1.5px solid',cursor:'pointer',transition:'all .15s',
            fontFamily:"'DM Sans',sans-serif",
            background:activeTab===t.id?'var(--bg3)':'transparent',
            borderColor:activeTab===t.id?'var(--border)':'transparent',
            color:activeTab===t.id?'var(--text)':'var(--text2)',
          }}>
            <span className="material-symbols-rounded" style={{fontSize:16}}>{t.icon}</span>
            {t.label}
            {t.id==='matching'&&matchStatus==='done'&&<span style={{background:'#03893A',color:'#fff',fontSize:10,padding:'1px 6px',borderRadius:20,fontWeight:700}}>ON</span>}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {activeTab==='overview'&&(
        <div>
          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            {[
              {label:'Live Listings',val:jobs.length,sub:'Updated live from DB'},
              {label:'Tech roles',val:techCount,sub:`${Math.round(techCount/(jobs.length||1)*100)||0}% of total`},
              {label:'Finance roles',val:finCount,sub:`${Math.round(finCount/(jobs.length||1)*100)||0}% of total`},
              {label:'Avg Match',val:'84%',sub:'After AI scoring'},
            ].map((s,i)=>(
              <div key={i} style={{background:'var(--bg3)',borderRadius:10,padding:'14px 16px',border:'1px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:4,fontWeight:500}}>{s.label}</div>
                <div style={{fontSize:24,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{s.val}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* How matching works */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px',marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:12}}>How AI matching works</div>
            <div style={{display:'flex',gap:0,marginBottom:16,alignItems:'center'}}>
              {[
                {icon:'description',label:'Your CV',sub:'Skills & background',bg:'var(--bg3)'},
                {icon:'arrow_forward',arrow:true},
                {icon:'auto_awesome',label:'AI Engine',sub:'Semantic analysis',bg:'#E6F1FB',color:'#0C447C'},
                {icon:'arrow_forward',arrow:true},
                {icon:'work',label:'Job Listings',sub:'Real DB companies',bg:'var(--bg3)'},
                {icon:'arrow_forward',arrow:true},
                {icon:'workspace_premium',label:'Ranked Matches',sub:'Score + explanation',bg:'#EAF3DE',color:'#27500A'},
              ].map((it,i)=>it.arrow?(
                <div key={i} style={{padding:'0 6px',color:'var(--text3)'}}>
                  <span className="material-symbols-rounded" style={{fontSize:16}}>arrow_forward</span>
                </div>
              ):(
                <div key={i} style={{flex:1,textAlign:'center',padding:'12px 8px',borderRadius:10,background:it.bg||'var(--bg3)'}}>
                  <span className="material-symbols-rounded" style={{fontSize:24,color:it.color||'var(--text2)',display:'block',marginBottom:4}}>{it.icon}</span>
                  <div style={{fontSize:12,fontWeight:600,color:it.color||'var(--text)'}}>{it.label}</div>
                  <div style={{fontSize:11,color:it.color||'var(--text3)'}}>{it.sub}</div>
                </div>
              ))}
            </div>

            {/* Scoring breakdown */}
            <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>What the AI analyses</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
              {[
                {icon:'code',label:'Skills match (tech + soft)',pct:'35%',color:'#3a7bd5'},
                {icon:'language',label:'Industry alignment',pct:'20%',color:'#0F6E56'},
                {icon:'location_on',label:'Location & remote fit',pct:'15%',color:'#534AB7'},
                {icon:'trending_up',label:'Career trajectory',pct:'15%',color:'#854F0B'},
                {icon:'groups',label:'Culture & values fit',pct:'10%',color:'#27500A'},
                {icon:'school',label:'Academic background',pct:'5%',color:'#712B13'},
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)',opacity:1}}>
                  <span className="material-symbols-rounded" style={{fontSize:17,color:'var(--text3)',flexShrink:0}}>{r.icon}</span>
                  <div style={{flex:1,fontSize:13,color:'var(--text2)'}}>{r.label}</div>
                  <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'var(--bg3)',border:'1px solid var(--border)',fontWeight:600,color:r.color}}>{r.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent listings preview */}
          <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Latest listings</div>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'4px 20px'}}>
            {jobs.slice(0,5).map((j,i)=>(
              <div key={j.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:i<Math.min(jobs.length,5)-1?'1px solid var(--border)':'none',cursor:'pointer'}} onClick={()=>{setSelectedJob(j);}}>
                <div style={{width:36,height:36,borderRadius:8,background:j.avatar_url?'transparent':'#0A1828',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--border)'}}>
                  {j.avatar_url?<img src={j.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#fff',fontWeight:700,fontSize:12}}>{(j.co||'C').slice(0,2).toUpperCase()}</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.title}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{j.co} · {j.loc}</div>
                </div>
                {j.listing_type&&<span className="tag tag-gray">{j.listing_type}</span>}
              </div>
            ))}
            {jobs.length===0&&<div style={{padding:'20px 0',textAlign:'center',color:'var(--text3)',fontSize:13}}>Loading listings…</div>}
          </div>

          {!isCompany&&(
            <div style={{marginTop:16,display:'flex',gap:10}}>
              <button className="btn btn-cta" style={{flex:1,justifyContent:'center'}} onClick={()=>setActiveTab('matching')}>
                <span className="material-symbols-rounded" style={{fontSize:15}}>auto_awesome</span>
                Run AI Match →
              </button>
              <button className="btn btn-outline" style={{flex:1,justifyContent:'center'}} onClick={()=>setActiveTab('browse')}>
                Browse all {jobs.length} listings
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════ AI MATCHING TAB ══════════ */}
      {activeTab==='matching'&&!isCompany&&(
        <div>
          {/* CV upload / status card */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <span style={{fontSize:15}}>✦</span>
              <span style={{fontSize:14,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>CV Match Engine</span>
              <span style={{marginLeft:'auto',fontSize:11,background:'var(--bg3)',border:'1px solid var(--border)',padding:'2px 10px',borderRadius:20,color:'var(--text3)'}}>
                {jobs.length} live listings from database
              </span>
            </div>

            {/* CV on file */}
            {cvInfo.hasCV&&(
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 12px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--border)'}}>
                <span className="material-symbols-rounded" style={{fontSize:18,color:'var(--accent)'}}>description</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cvInfo.cvName}</div>
                  {cvInfo.lastMatched&&<div style={{fontSize:11,color:'var(--text3)'}}>Last matched {new Date(cvInfo.lastMatched).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>runMatchFlow('re-run')} disabled={matchStatus==='thinking'}>Re-match</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>fileRef.current.click()} disabled={cvUploading}>Replace</button>
                <input ref={fileRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
            )}

            {/* No CV upload zone */}
            {!cvInfo.hasCV&&matchStatus==='idle'&&(
              <div
                style={{border:'2px dashed var(--border)',borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',transition:'all .15s'}}
                onClick={()=>fileRef.current.click()}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--accent)';}}
                onDragLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}
                onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--border)';handleFile(e.dataTransfer.files[0]);}}>
                <div style={{fontSize:32,marginBottom:8}}>📄</div>
                <div style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:4}}><strong>Drop or click</strong> to upload your CV</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>PDF only · Max 5MB · We'll rank every listing by fit</div>
                <input ref={fileRef} type="file" accept=".pdf" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])}/>
                {cvUploading&&<div style={{marginTop:10,fontSize:13,color:'var(--text2)'}}>Uploading…</div>}
              </div>
            )}

            {/* Start match button if CV exists but no match run yet */}
            {cvInfo.hasCV&&matchStatus==='idle'&&(
              <button className="btn btn-cta" style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={()=>runMatchFlow('stored-cv')}>
                <span className="material-symbols-rounded" style={{fontSize:15}}>auto_awesome</span>
                Run AI Matching Now
              </button>
            )}
          </div>

          {/* Progress — circular ring + step list, visible while thinking or done */}
          {(matchStatus==='thinking'||matchStatus==='done')&&(()=>{
            const r=38,circ=2*Math.PI*r;
            const pct=matchStatus==='done'?1:Math.min((matchStep+1)/MATCH_STEPS.length,1);
            const offset=circ*(1-pct);
            const ringColor=matchStatus==='done'?'#03893A':'#3a7bd5';
            return(
              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px',marginBottom:16}}>
                <div style={{display:'flex',gap:20,alignItems:'center',marginBottom:matchStatus==='thinking'?16:0}}>
                  <svg width={92} height={92} viewBox="0 0 92 92" style={{flexShrink:0}}>
                    <circle cx={46} cy={46} r={r} fill="none" stroke="var(--border)" strokeWidth={7}/>
                    <circle cx={46} cy={46} r={r} fill="none"
                      stroke={ringColor} strokeWidth={7}
                      strokeDasharray={circ} strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 46 46)"
                      style={{transition:'stroke-dashoffset .5s ease,stroke .4s'}}
                    />
                    <text x={46} y={42} textAnchor="middle" fill="var(--text)"
                      fontSize={matchStatus==='done'?20:15} fontWeight={700}
                      fontFamily="'Plus Jakarta Sans',sans-serif">
                      {matchStatus==='done'?'✓':Math.round(pct*100)+'%'}
                    </text>
                    <text x={46} y={57} textAnchor="middle" fill="var(--text3)" fontSize={9}>
                      {matchStatus==='done'?'Matched':MATCH_STEPS[matchStep]||''}
                    </text>
                  </svg>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:9}}>
                    {MATCH_STEPS.map((st,i)=>{
                      const done=matchStep>i||(matchStatus==='done');
                      const active=matchStep===i&&matchStatus==='thinking';
                      return(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{
                            width:20,height:20,borderRadius:'50%',flexShrink:0,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:9,fontWeight:600,
                            background:done?'#EAF3DE':active?'#E6F1FB':'var(--bg3)',
                            border:`1px solid ${done?'#639922':active?'#378ADD':'var(--border)'}`,
                            color:done?'#27500A':active?'#0C447C':'var(--text3)',
                            transition:'all .3s',
                          }}>
                            {done?<span className="material-symbols-rounded" style={{fontSize:11}}>check</span>:i+1}
                          </div>
                          <span style={{fontSize:12,color:active?'var(--text)':'var(--text2)',fontWeight:active?600:400,flex:1,transition:'all .3s'}}>{st}</span>
                          {active&&<span className="material-symbols-rounded" style={{fontSize:14,color:'#3a7bd5',animation:'spin .8s linear infinite'}}>progress_activity</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {matchStatus==='thinking'&&(
                  <div style={{background:'var(--bg3)',borderRadius:8,padding:'12px 14px',border:'1px solid var(--border)'}}>
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:6,fontWeight:500}}>AI analysis stream</div>
                    <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,minHeight:40}}>
                      {streamText}
                      <span style={{display:'inline-block',width:2,height:14,background:'var(--text3)',marginLeft:1,verticalAlign:'text-bottom',animation:'blink .9s step-end infinite'}}/>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Match results */}
          {matchStatus==='done'&&matchResults.length>0&&(
            <div>
              {cacheIsStale&&(
                <div style={{display:'flex',alignItems:'center',gap:9,padding:'11px 14px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.28)',borderRadius:10,marginBottom:10}}>
                  <span className="material-symbols-rounded" style={{fontSize:18,color:'#D97706',flexShrink:0}}>sync</span>
                  <div style={{flex:1,minWidth:0,fontSize:13,color:'var(--text)',lineHeight:1.4}}>
                    Your preferences changed — scores below are from your previous profile.
                  </div>
                  <button className="btn btn-cta btn-sm" style={{flexShrink:0,whiteSpace:'nowrap'}} onClick={()=>runMatchFlow('pref-refresh')}>
                    Re-match
                  </button>
                </div>
              )}
              <div style={{display:'flex',alignItems:'center',gap:9,padding:'9px 14px',background:'linear-gradient(135deg,#0A2E5C,#2563EB)',borderRadius:10,marginBottom:10,cursor:'pointer'}} onClick={()=>setPage('ai_insights')}>
                <span style={{fontSize:18,lineHeight:1}}>🤖</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:800,color:'#fff',lineHeight:1.2}}>AI Insights</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.75)'}}>Chat, career advice & full analysis →</div>
                </div>
                <span className="material-symbols-rounded" style={{fontSize:16,color:'rgba(255,255,255,.7)'}}>arrow_forward</span>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>
                {matchResults.length} results · sorted by AI score
              </div>
              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'4px 20px',marginBottom:16}}>
                {matchResults.map((j,i)=>(
                  <div key={j.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:i<matchResults.length-1?'1px solid var(--border)':'none',cursor:'pointer'}} onClick={()=>setSelectedJob(j)}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--text3)',flexShrink:0,border:'1px solid var(--border)'}}>{i+1}</div>
                    <div style={{width:36,height:36,borderRadius:8,background:j.avatar_url?'transparent':'#0A1828',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--border)'}}>
                      {j.avatar_url?<img src={j.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#fff',fontWeight:700,fontSize:12}}>{(j.co||'C').slice(0,2).toUpperCase()}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.title}</div>
                      <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>{j.co} · {j.loc}</div>
                      <div style={{height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:j.match+'%',background:scoreFill(j.match),borderRadius:3,transition:'width .6s ease'}}/>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:22,fontWeight:700,color:scoreColor(j.match),fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{j.match}%</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>match</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:10}}>
                <button className="btn btn-outline" style={{flex:1,justifyContent:'center'}} onClick={()=>setActiveTab('browse')}>
                  <span className="material-symbols-rounded" style={{fontSize:14}}>view_list</span>
                  Browse all {jobs.length} listings
                </button>
                <button className="btn btn-ghost btn-sm" onClick={()=>runMatchFlow('re-run')} disabled={matchStatus==='thinking'}>
                  Refresh match
                </button>
              </div>
            </div>
          )}

          {/* Empty state — no CV, no thinking */}
          {!cvInfo.hasCV&&matchStatus==='idle'&&(
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--text3)',fontSize:13}}>
              Upload your CV above to get AI-powered rankings across all {jobs.length} live listings.
            </div>
          )}
        </div>
      )}

      {/* ══════════ BROWSE JOBS TAB ══════════ */}
      {activeTab==='browse'&&(
        <div>
          {/* AI match banner when scored — stale warning takes priority */}
          {matchStatus==='done'&&!isCompany&&(
            cacheIsStale
              ?<div style={{display:'flex',alignItems:'center',gap:9,padding:'11px 14px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.28)',borderRadius:10,marginBottom:14}}>
                <span className="material-symbols-rounded" style={{fontSize:18,color:'#D97706',flexShrink:0}}>sync</span>
                <div style={{flex:1,minWidth:0,fontSize:13,color:'var(--text)',lineHeight:1.4}}>
                  Your preferences changed — scores below are from your previous profile.
                </div>
                <button className="btn btn-cta btn-sm" style={{flexShrink:0,whiteSpace:'nowrap'}} onClick={()=>{setActiveTab('matching');runMatchFlow('pref-refresh');}}>
                  Re-match
                </button>
              </div>
              :<div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#EAF3DE',borderRadius:10,marginBottom:14,border:'1px solid #c0dfaa'}}>
                <span style={{color:'#03893A',fontSize:16}}>✓</span>
                <span style={{fontSize:13,color:'#27500A',flex:1}}>AI match active — listings sorted by your CV fit</span>
                <button className="btn btn-ghost btn-sm" onClick={()=>setActiveTab('matching')}>View scores</button>
              </div>
          )}

          {/* Search + filters */}
          <div style={{display:'flex',gap:9,marginBottom:14,alignItems:'center'}}>
            <div className="search-bar" style={{flex:1}}>
              <span className="search-icon material-symbols-rounded" style={{fontSize:18}}>search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search role, company, or skill…"/>
            </div>
            {!isCompany&&matchStatus!=='done'&&(
              <button className="btn btn-outline" style={{whiteSpace:'nowrap',fontSize:13}} onClick={()=>setActiveTab('matching')}>
                <span className="material-symbols-rounded" style={{fontSize:14}}>auto_awesome</span>
                AI Match
              </button>
            )}
          </div>
          <div className="filters">
            {cats.map(c=>(
              <button key={c} className={`filter-chip${filter===c?' active':''}`} onClick={()=>setFilter(c)}>
                {catLabels[c]||c.charAt(0).toUpperCase()+c.slice(1)}
                {c==='all'?` (${jobs.length})`:` (${jobs.filter(j=>j.cat===c).length})`}
              </button>
            ))}
          </div>

          <div className="job-grid">
            {displayJobs.map(j=>(
              <JobCard key={j.id} job={j} onClick={setSelectedJob} onApply={isCompany?null:setApplyJob}/>
            ))}
          </div>
          {jobs.length===0&&(
            <div className="card" style={{marginTop:12,textAlign:'center',color:'var(--text3)'}}>
              No listings yet — companies can post internships from their dashboard.
            </div>
          )}
          {displayJobs.length===0&&jobs.length>0&&(
            <div className="card" style={{marginTop:12,textAlign:'center',color:'var(--text3)'}}>
              No listings match your search or filter.
            </div>
          )}
          {applyJob&&<ApplyModal job={applyJob} user={user} onClose={()=>setApplyJob(null)}/>}
        </div>
      )}
    </div>
  );
}

function JobDetailPage({job,onBack,user,setPage,onViewCompany}){
  const [showApply,setShowApply]=useState(false);
  const [apps,setApps]=useState(null);
  const [showApps,setShowApps]=useState(false);
  const [appCount,setAppCount]=useState(typeof job.applicantCount==='number'?job.applicantCount:null);
  const isCompanyUser=user?.userType==='company'||user?.userType==='school';
  const isOwnListing=isCompanyUser&&job?.company_id&&user?.user?.id===job?.company_id;

  useEffect(()=>{
    if(!job?.id) return;
    const c=getSB(); if(!c) return;
    // Always fetch live count
    c.from('applications').select('id',{count:'exact',head:true}).eq('job_id',job.id)
      .then(r=>setAppCount(r.count||0));
  },[job?.id]);

  async function loadApps(){
    if(apps!==null){setShowApps(s=>!s);return;}
    const c=getSB(); if(!c) return;
    const {data}=await c.from('applications')
      .select('id,status,created_at,cover_letter,student_id,student:student_id(id,full_name,school,major,year,avatar_url)')
      .eq('job_id',job.id).order('created_at',{ascending:false});
    setApps(data||[]);
    setShowApps(true);
  }

  function handleViewCompany(){
    if(onViewCompany) onViewCompany(job);
    else if(setPage) setPage('companies');
  }

  return(
    <div>
      <div className="topbar anim">
        <button className="btn btn-ghost" onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          <span className="material-symbols-rounded" style={{fontSize:16}}>arrow_back</span> {isCompanyUser?'Back to My Listings':'Back to listings'}
        </button>
      </div>
      <div className="card anim" style={{maxWidth:680,margin:'0 auto'}}>
        {/* Header — logo + company name are clickable */}
        <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:20}}>
          <div onClick={handleViewCompany} title={"View "+job.co+" profile"} style={{width:56,height:56,borderRadius:14,flexShrink:0,overflow:'hidden',border:'1.5px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(10,46,92,.12)',cursor:'pointer'}}>
            {job.avatar_url
              ?<img src={job.avatar_url} alt={job.co} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                {(job.co||'C').slice(0,2).toUpperCase()}
              </div>
            }
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
              <div style={{fontSize:20,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",color:'var(--text)',letterSpacing:'-.03em'}}>{job.title}</div>
              <span className="tag tag-green">Open</span>
              {job.listing_type&&job.listing_type!=='Internship'&&<span className="tag tag-blue">{job.listing_type}</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginTop:2}}>
              <button onClick={handleViewCompany} style={{fontSize:14,color:'var(--accent)',fontWeight:600,background:'none',border:'none',padding:0,cursor:'pointer',textDecoration:'underline',textDecorationColor:'transparent',transition:'text-decoration-color .15s'}} onMouseEnter={e=>e.currentTarget.style.textDecorationColor='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.textDecorationColor='transparent'}>
                {job.co}
              </button>
              {appCount!==null&&(
                <button onClick={isOwnListing?loadApps:undefined} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--text3)',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:20,padding:'3px 10px',cursor:isOwnListing?'pointer':'default',fontFamily:'inherit',transition:'border-color .15s'}} onMouseEnter={e=>{if(isOwnListing)e.currentTarget.style.borderColor='var(--accent)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}>
                  <span className="material-symbols-rounded" style={{fontSize:13,color:'var(--accent)'}}>group</span>
                  <strong style={{color:'var(--text2)',fontWeight:600,fontSize:12}}>{appCount}</strong>&nbsp;{appCount===1?'applicant':'applicants'}{isOwnListing&&<span className="material-symbols-rounded" style={{fontSize:12,marginLeft:2}}>{showApps?'expand_less':'expand_more'}</span>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Applications panel — company owner only */}
        {isOwnListing&&showApps&&(
          <div style={{marginBottom:20,border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',background:'var(--bg3)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
              <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--accent)'}}>group</span>
              <span style={{fontWeight:700,fontSize:13.5,color:'var(--text)'}}>Applicants ({apps?.length||0})</span>
            </div>
            {!apps?<div style={{padding:16,color:'var(--text3)',fontSize:13}}>Loading…</div>
            :apps.length===0?<div style={{padding:16,color:'var(--text3)',fontSize:13}}>No applications yet.</div>
            :apps.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--border)',background:'var(--card)'}}>
                <AvatarImg src={a.student?.avatar_url} name={a.student?.full_name} size={36}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)'}}>{a.student?.full_name||'Student'}</div>
                  <div style={{fontSize:11.5,color:'var(--text3)'}}>{[a.student?.school,a.student?.major,a.student?.year&&`Year ${a.student.year}`].filter(Boolean).join(' · ')}</div>
                  {a.cover_letter&&<div style={{fontSize:12,color:'var(--text2)',marginTop:5,lineHeight:1.5,background:'var(--bg3)',borderRadius:8,padding:'6px 10px'}}>{a.cover_letter.slice(0,200)}{a.cover_letter.length>200?'…':''}</div>}
                </div>
                <StatusBadge status={a.status}/>
              </div>
            ))}
          </div>
        )}

        {/* Meta pills */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
          {[
            {icon:'location_on',text:job.loc||job.location},
            {icon:'payments',text:job.pay},
            {icon:'schedule',text:job.dur||job.duration},
            {icon:'event',text:job.dead?'Deadline: '+job.dead:''},
          ].filter(m=>m.text).map((m,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',background:'var(--bg3)',borderRadius:20,border:'1px solid var(--border)',fontSize:12.5,color:'var(--text2)'}}>
              <span className="material-symbols-rounded" style={{fontSize:14,color:'var(--accent)'}}>{m.icon}</span>
              {m.text}
            </div>
          ))}
        </div>

        {/* Tags */}
        {job.tags&&job.tags.length>0&&(
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
            {job.tags.map(t=><Tag key={t} type="gray">{t}</Tag>)}
          </div>
        )}

        {/* Description */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:8}}>About this role</div>
          <div style={{fontSize:13.5,color:'var(--text2)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{job.description||job.desc}</div>
        </div>

        {/* Responsibilities */}
        {job.responsibilities&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:8}}>Responsibilities</div>
            <div style={{fontSize:13.5,color:'var(--text2)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{job.responsibilities}</div>
          </div>
        )}

        {/* Requirements */}
        {(job.requirements||job.req)&&(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:8}}>Qualifications & Requirements</div>
            <div style={{fontSize:13.5,color:'var(--text2)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{job.requirements||job.req}</div>
          </div>
        )}

        {/* About the Company — hidden when company views their own listing */}
        {(job.company_name||job.co)&&!isOwnListing&&(
          <div onClick={handleViewCompany} style={{marginBottom:20,padding:'14px 16px',background:'var(--bg3)',borderRadius:12,border:'1px solid var(--border)',cursor:'pointer',transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:10}}>About {job.company_name||job.co}</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:job.company_desc?10:0}}>
              {job.avatar_url
                ?<img src={job.avatar_url} alt={job.co} style={{width:40,height:40,borderRadius:8,objectFit:'cover'}}/>
                :<div style={{width:40,height:40,borderRadius:8,background:job.bg||'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff'}}>{(job.co||'C').slice(0,2).toUpperCase()}</div>
              }
              <div style={{flex:1}}>
                <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)'}}>{job.company_name||job.co}</div>
                {job.industry&&<div style={{fontSize:12,color:'var(--text3)'}}>{job.industry}</div>}
              </div>
              <span className="material-symbols-rounded" style={{fontSize:18,color:'var(--accent)'}}>arrow_forward</span>
            </div>
            {job.company_desc&&<div style={{fontSize:13,color:'var(--text2)',lineHeight:1.65,marginBottom:8}}>{job.company_desc}</div>}
            <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
              {job.company_size&&<span style={{fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-rounded" style={{fontSize:14}}>group</span>{job.company_size} employees</span>}
              {job.company_location&&<span style={{fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-rounded" style={{fontSize:14}}>location_on</span>{job.company_location}</span>}
              <span style={{fontSize:12,color:'var(--accent)',display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-rounded" style={{fontSize:14}}>open_in_new</span>View full profile</span>
            </div>
          </div>
        )}

        {/* Apply button — only shown to students; companies see a back button only */}
        <div style={{borderTop:'1px solid var(--border)',paddingTop:16,display:'flex',gap:10}}>
          {!isCompanyUser&&(
            <button className="btn btn-cta" onClick={()=>{
              // External apply URL set on the listing? → open it in a new tab.
              // Otherwise the application is received natively in ALU Hub.
              if(job?.apply_url){window.open(job.apply_url,'_blank','noopener,noreferrer');return;}
              setShowApply(true);
            }}>
              <span className="material-symbols-rounded" style={{fontSize:16}}>{job?.apply_url?'open_in_new':'send'}</span> Apply
            </button>
          )}
          <button className="btn btn-ghost" onClick={onBack}>
            <span className="material-symbols-rounded" style={{fontSize:16}}>arrow_back</span> {isCompanyUser?'Back to My Listings':'Back'}
          </button>
        </div>
      </div>
      {showApply&&<ApplyModal job={job} user={user} onClose={()=>setShowApply(false)}/>}
    </div>
  );
}
function Skills(){
  const [filter,setFilter]=useState('all');
  const [offerOpen,setOfferOpen]=useState(false);
  const [editingSkill,setEditingSkill]=useState(null);
  const [selectedSkill,setSelectedSkill]=useState(null);
  const [skills,setSkills]=useState([]);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const myId=window.__aluHubUser?.user?.id;
  const isCompanyUser=window.__aluHubUser?.userType==='company'||window.__aluHubUser?.userType==='school';
  function reload(){dbGetSkillsMarketplace().then(setSkills);}
  useEffect(()=>{reload();},[]);
  const cats=['all','tech','business','creative','language'];
  const filtered=skills.filter(s=>filter==='all'||s.cat===filter);

  async function doDeleteSkill(s){
    try{
      await dbDeleteSkill(s.id,myId);
      reload();
      toast('Skill deleted');
    }catch(err){toast('Delete failed — '+err.message);}
    setConfirmDelete(null);
  }

  return (
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Skills Marketplace</div>
          <div className="page-sub">Learn from peers · {skills.length} sessions available · You keep 85%</div>
        </div>
        <div className="topbar-right">
          {!isCompanyUser&&<button className="btn btn-primary" onClick={()=>setOfferOpen(true)}>+ Offer a Skill</button>}
        </div>
      </div>
      {!isCompanyUser&&<div className="offer-banner">
        <div className="offer-text">
          <h4>Have a skill to share? Earn while you study.</h4>
          <p>List a session in 2 minutes. ALU Hub handles payment — you just show up and teach.</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setOfferOpen(true)}>Start earning →</button>
      </div>}
      <div className="filters">
        {cats.map(c=><button key={c} className={`filter-chip${filter===c?' active':''}`} onClick={()=>setFilter(c)}>{c.charAt(0).toUpperCase()+c.slice(1)}{c==='all'?` (${skills.length})`:` (${skills.filter(s=>s.cat===c.toLowerCase()).length})`}</button>)}
      </div>
      <div className="skills-grid">
        {filtered.map(s=>(
          <div key={s.id} className="skill-card">
            <div className="tutor-row">
              <div className="tutor-av" style={{background:s.color}}>{s.name[0]}</div>
              <div style={{flex:1}}>
                <div className="tutor-name">{s.name}</div>
                <div className="tutor-flag">{s.country}</div>
              </div>
              <div className="sessions-count">{s.sessions} sessions</div>
            </div>
            <div className="skill-title">{s.title}</div>
            <div className="skill-desc">{s.desc}</div>
            <div className="skill-footer">
              <div>
                <Stars n={s.rating}/>
                <div style={{fontSize:10.5,color:'var(--text3)',marginTop:2}}>{['','','','Good','Great','Excellent'][s.rating]}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="skill-price">${s.price}<span>/session</span></div>
                {s.studentId===myId
                  ?<div style={{display:'flex',gap:5,marginTop:6,justifyContent:'flex-end'}}>
                    <button className="btn btn-ghost btn-sm" style={{gap:4}}><span className="material-symbols-rounded" style={{fontSize:13}}>edit</span>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{color:"#F87171",gap:4}} onClick={()=>setConfirmDelete(s)}><span className="material-symbols-rounded" style={{fontSize:13}}>delete</span>Delete</button>
                  </div>
                  :!isCompanyUser&&<button className="btn btn-cta btn-sm" style={{marginTop:6}} onClick={()=>setSelectedSkill(s)}>Book →</button>
                }
              </div>
            </div>
          </div>
        ))}
      </div>
      {skills.length===0&&<div className="card" style={{marginTop:12,textAlign:'center',color:'var(--text3)'}}>No skills listed yet. Be the first to offer a skill!</div>}
      {(offerOpen||editingSkill)&&<OfferSkillModal user={window.__aluHubUser} editing={editingSkill} onClose={()=>{setOfferOpen(false);setEditingSkill(null);}} onAdded={reload}/>}
      {selectedSkill&&<SkillModal skill={selectedSkill} user={window.__aluHubUser} onClose={()=>setSelectedSkill(null)}/>}
      {confirmDelete&&<ConfirmModal title="Delete Skill?" message={`Are you sure you want to delete "${confirmDelete.title}"? This cannot be undone.`} onConfirm={()=>doDeleteSkill(confirmDelete)} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
}

const KIGALI_GUIDE_FALLBACK=[
  {icon:'sim_card',title:'SIM Cards & Mobile Data',items:[
    {e:'📶',name:'MTN Rwanda',desc:'Best coverage across Kigali. Get a SIM at any MTN shop (bring passport). Ask for the "Yello" data bundle — 2GB for ~RWF 1,500. Top up everywhere.',price:'SIM free · Data from RWF 500'},
    {e:'🔴',name:'Airtel Rwanda',desc:'Good alternative, especially for calls. Slightly cheaper call rates than MTN. SIM cards available at Airtel shops and local street vendors.',price:'SIM free · Data bundles from RWF 400'},
    {e:'🏪',name:'Where to top up',desc:'Any small shop (handiteur), pharmacy, or supermarket. Say "Iyo ya MTN" or "Iyo ya Airtel" and the amount. They send you a voucher code via SMS.',price:'No fee'},
  ]},
  {icon:'🚕',title:'Getting Around Kigali',items:[
    {e:'🛵',name:'Moto-taxis (Motos)',desc:'Fastest way to move in Kigali. Negotiate price before getting on — typical ride within Kigali 3km: RWF 500–1,000. Always wear the helmet they give you. Be firm on price.',price:'RWF 300–2,000 depending on distance'},
    {e:'🚌',name:'Tap-tap buses (Twegerane)',desc:'Cheapest option. Fixed routes across the city. Flat fare of RWF 100–300. Crowded but an authentic experience. Ask locals which bus goes where.',price:'RWF 100–300 flat fare'},
    {e:'🚗',name:'Yego Cab / Move',desc:'Uber-style apps for Kigali. Yego is local. More comfortable, safer, metered. Download the app before arriving. Great for late nights or heavy luggage.',price:'RWF 1,500–8,000 per trip'},
    {e:'🚶',name:'Walking in Zindiro/Remera',desc:'ALU campus is in Zindiro. Remera shopping area is ~20 min walk downhill. The area is very safe and walkable during the day. Street lighting is decent at night.',price:'Free'},
  ]},
  {icon:'restaurant',title:'Food & Eating',items:[
    {e:'🍚',name:'Inzoga/Ibirayi (local spots)',desc:'Look for local canteens (restaurants oculaires) near Zindiro. Full plate of rice, beans, and vegetables (igikoni): RWF 500–1,200. Fresh and filling. Ask ALU mates for the best spots.',price:'RWF 500–1,500 per meal'},
    {e:'🛒',name:'Kigali Heights / Simba Supermarket',desc:'Simba at Remera has the best price-to-quality ratio for groceries. Kigali Heights has premium imported items. For basics: green market in Remera is much cheaper.',price:'Groceries from RWF 3,000/week basics'},
    {e:'🥑',name:'Nyamirambo Market',desc:'The best fresh produce in Kigali. Avocados, tomatoes, onions — all incredibly cheap. A bit further from campus but worth it for weekly shop. Take a moto.',price:'Avocado: RWF 100–300 · Tomatoes: RWF 200/kg'},
    {e:'☕',name:'Coffee culture',desc:'Rwanda grows excellent arabica coffee. Bourbon Coffee (upmarket) and Inzozi Nziza are great. But local small cafés ("café") sell amazing Rwandan coffee for RWF 200–500.',price:'Coffee: RWF 200–1,500'},
  ]},
  {icon:'🏦',title:'Money & Banking',items:[
    {e:'💳',name:'Mobile Money (MoMo)',desc:'MTN Mobile Money is how most Kigali residents pay for everything — groceries, motos, subscriptions. Set up an account when you get your SIM. Link to your bank if you have one.',price:'Setup free · Small fees per transaction'},
    {e:'🏧',name:'ATMs in Kigali',desc:'Bank of Kigali, BPR, and Equity Bank ATMs are reliable. Visa/Mastercard accepted. Best rates at Bank of Kigali. Avoid airport ATMs. Bring some USD as emergency backup.',price:'ATM fee: RWF 500–1,000 per withdrawal'},
    {e:'💵',name:'USD exchange',desc:'Many forex bureaux in Kigali offer competitive rates. Avenue de la Paix and City Centre have multiple options. Always ask "best rate?" and compare. Avoid airport.',price:'Rate: ~1 USD = 1,350–1,420 RWF'},
    {e:'🔒',name:'Cash safety',desc:'Kigali is very safe but keep cards and cash secure in busier areas. The city has a very low crime rate compared to regional peers. Pockets are your biggest risk.',price:'General safety tip'},
  ]},
  {icon:'apartment',title:'Housing & Accommodation',items:[
    {e:'🏫',name:'ALU Student Residences (Souls A)',desc:'Main student residence on Zindiro Road, very close to campus. Included in most housing packages. Community atmosphere. Ask housing office for room allocation and rules.',price:'Covered by ALU housing package'},
    {e:'🏡',name:'Private apartments nearby',desc:'Zindiro and Remera have affordable private apartments. 1-bedroom studio: RWF 150,000–300,000/month. Share with a fellow student to halve costs. Use ALU Hub housing board.',price:'Studio: RWF 150k–300k/month'},
    {e:'🛜',name:'WiFi in accommodation',desc:'ALU campus has campus WiFi. Residences may have variable speed. Many students buy their own MiFi device (MTN or Airtel) for personal use — costs ~RWF 25,000 + data bundles.',price:'MiFi device: ~RWF 25,000'},
  ]},
  {icon:'🏥',title:'Health & Safety',items:[
    {e:'💊',name:'Pharmacies',desc:'Pharmacies (pharmacies) are everywhere in Kigali and open late. They sell most medications without prescription. Paracetamol, anti-malarials, ORS — all available. Bring your insurance card.',price:'Consult + basic meds: RWF 2,000–15,000'},
    {e:'🦟',name:'Malaria prevention',desc:'Kigali is relatively low-risk but Rwanda does have malaria. Take prophylaxis (doxycycline or malarone) if prescribed. Use mosquito nets at night. Report fever quickly.',price:'Malaria test at clinic: ~RWF 3,000'},
    {e:'🏥',name:'King Faisal Hospital',desc:'Best private hospital in Kigali. Accepts most international insurance. Rwanda Military Hospital and CHUK are public options — free for nationals, fee for foreigners.',price:'Consultation: RWF 10,000–30,000'},
    {e:'💧',name:'Water safety',desc:'Tap water in Kigali is officially treated but most residents drink bottled or filtered water. Buy large 5L bottles (RWF 500–700) at supermarkets. Boiling is also fine.',price:'5L bottle: RWF 500–700'},
  ]},
  {icon:'groups',title:'Student Life & Culture',items:[
    {e:'🌍',name:'Kinyarwanda basics',desc:'Learning a few phrases goes a long way: "Mwaramutse" (good morning), "Muraho" (hello), "Murakoze" (thank you), "Bite" (how are you). Locals genuinely appreciate any effort.',price:'Free — just practice'},
    {e:'📶',name:'Campus WiFi tips',desc:'ALU campus WiFi works best in the library and main building. Peak hours (evening) get congested. Connect before 8pm for best speeds. VPN may be needed for some services.',price:'Included in tuition'},
    {e:'🛍️',name:'Shopping essentials',desc:'Nakumatt (now Simba Centre) at Remera for supermarket staples. Kigali Heights for premium items. GT Mall and Downtown for electronics. Remera market for cheap fabric and clothing.',price:'Budget: ~RWF 50,000–80,000/month basics'},
    {e:'🌙',name:'Kigali nightlife',desc:'Kigali is very safe at night. KG 9 area has bars and clubs. Popular spots: Papyrus Club, Chill Bar, Heaven Restaurant. Motos run late but confirm price. Take Yego app after midnight.',price:'Club entry: free to RWF 5,000'},
  ]},
];

function SurvivalGuide(){
  const [open,setOpen]=useState(0);
  const [guide,setGuide]=useState([]);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{dbGetGuide().then(d=>{setGuide(d);setLoaded(true);});},[]);
  const displayGuide=loaded&&guide.length>0?guide:KIGALI_GUIDE_FALLBACK;
  return (
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Kigali Survival Guide</div>
          <div className="page-sub">Everything to settle in · Curated by students who arrived before you</div>
        </div>
      </div>
      <div className="card anim" style={{display:'flex',alignItems:'center',gap:14,marginBottom:18,borderColor:'rgba(255,92,53,.14)'}}>
        <div style={{fontSize:32,flexShrink:0}}>🗺</div>
        <div>
          <div style={{fontSize:14.5,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,color:'var(--text)',marginBottom:3,letterSpacing:'-.03em'}}>New to Kigali? Start here.</div>
          <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.55}}>Written by ALU students from 20+ countries who figured out Kigali the hard way so you don\'t have to.</div>
        </div>
      </div>
      {displayGuide.map((cat,i)=>(
        <div key={i} className="guide-acc">
          <div className={`guide-head${open===i?' open':''}`} onClick={()=>setOpen(open===i?-1:i)}>
            <div className="guide-head-left">
              <span style={{fontSize:16}}>{cat.icon}</span>
              {cat.title}
              <Tag type="gray">{cat.items.length} tips</Tag>
            </div>
            <span className={`guide-arrow${open===i?' open':''}`}>▼</span>
          </div>
          <div className={`guide-body${open===i?' open':''}`}>
            {cat.items.map((item,j)=>(
              <div key={j} className="guide-item">
                <div className="guide-emoji">{item.e}</div>
                <div>
                  <div className="guide-item-title">{item.name}</div>
                  <div className="guide-item-desc">{item.desc}</div>
                  <span className="guide-item-price">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EditResourceModal({resource,user,onClose,onSaved}){
  const [form,setForm]=useState({title:resource.title||'',type:resource.type||'Notes',price:String(resource.price||0),emoji:resource.emoji||'📄'});
  const [loading,setLoading]=useState(false);
  function set(k,v){setForm(f=>({...f,[k]:v}));}
  async function submit(){
    const uid=user?.user?.id;
    if(!uid||!form.title.trim()){toast('Title required');return;}
    setLoading(true);
    try{
      await dbUpdateResource(resource.id,uid,{title:form.title.trim(),type:form.type,price:Number(form.price)||0,emoji:form.emoji||'📄'});
      onSaved&&onSaved();
      onClose();
      toast('Resource updated');
    }catch(err){toast('Update failed — '+err.message);console.error(err);}
    finally{setLoading(false);}
  }
  return(
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>
        <div className="modal-title">Edit Resource</div>
        <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e=>set('title',e.target.value)}/></div>
        <div className="two-col">
          <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e=>set('type',e.target.value)}><option>Notes</option><option>Template</option><option>Report</option><option>Slides</option><option>Case Study</option></select></div>
          <div className="form-group"><label className="form-label">Price (USD)</label><input className="form-input" type="number" min="0" step="0.5" value={form.price} onChange={e=>set('price',e.target.value)}/></div>
        </div>
        <div className="form-group"><label className="form-label">Icon/Emoji <span className='form-optional'>e.g. 📄 or 🎓</span></label><input className="form-input" value={form.emoji} onChange={e=>set('emoji',e.target.value)} placeholder="📄"/></div>
        <div className="modal-actions"><button className="btn btn-primary" disabled={loading} onClick={submit}>{loading?'Saving…':'Save Changes →'}</button><button className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}

function Resources(){
  const [filter,setFilter]=useState('all');
  const [resources,setResources]=useState([]);
  const [uploadOpen,setUploadOpen]=useState(false);
  const [editingResource,setEditingResource]=useState(null);
  const [buyingResource,setBuyingResource]=useState(null);
  const [ratingResource,setRatingResource]=useState(null);
  const currentUser=window.__aluHubUser;
  const myId=currentUser?.user?.id;
  const [confirmDeleteRes,setConfirmDeleteRes]=useState(null);
  function reload(){dbGetResources().then(setResources);}
  useEffect(()=>{reload();},[]);
  const types=['all','Notes','Template','Report','Slides','Case Study'];
  const filtered=resources.filter(r=>filter==='all'||r.type===filter);

  async function dl(r){
    if(r.file_url){
      window.open(r.file_url,'_blank','noopener,noreferrer');
      await dbIncrementResourceSales(r.id,r.sales);
      reload();
      toast(`"${r.title}" opened`);
      return;
    }
    toast(`"${r.title}" has no file URL yet.`);
  }

  function buyResource(r){
    if(!myId){toast('Please sign in to purchase');return;}
    setBuyingResource(r);
  }

  async function doDeleteResource(r){
    try{
      await dbDeleteResource(r.id,myId);
      reload();
      toast('Resource deleted');
    }catch(err){toast('Delete failed — '+err.message);}
    setConfirmDeleteRes(null);
  }

  return (
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Resource Library</div>
          <div className="page-sub">Notes, templates & guides from students · ALU Hub takes 15%</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={()=>setUploadOpen(true)}>+ Upload</button>
        </div>
      </div>
      <div className="filters">
        {types.map(t=><button key={t} className={`filter-chip${filter===t?' active':''}`} onClick={()=>setFilter(t)}>{t}</button>)}
      </div>
      <div className="res-grid">
        {filtered.map((r,i)=>(
          <div key={r.id||i} className="res-card">
            <div style={{display:'flex',alignItems:'center',gap:9,justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:9}}>
                <div style={{fontSize:22}}>{r.emoji}</div>
                <Tag type="gray">{r.type}</Tag>
              </div>
              {r.author_id===myId&&(
                <div style={{display:'flex',gap:4}}>
                  <button className="btn btn-ghost btn-xs" onClick={()=>setEditingResource(r)} title="Edit"><span className="material-symbols-rounded" style={{fontSize:13}}>edit</span></button>
                  <button className="btn btn-ghost btn-xs" style={{color:"#F87171"}} onClick={()=>setConfirmDeleteRes(r)} title="Delete"><span className="material-symbols-rounded" style={{fontSize:13}}>delete</span></button>
                </div>
              )}
            </div>
            <div className="res-title">{r.title}</div>
            <div className="res-author">by {r.author}</div>
            <div className="res-footer">
              <div>
                <div className="res-price">{r.price===0?'Free':'$'+r.price}</div>
                <div className="res-sales">{r.sales} downloads</div>
              </div>
              <button className={`btn btn-sm${r.price===0?' btn-ghost':' btn-primary'}`} onClick={()=>r.price===0?dl(r):buyResource(r)}>{r.price===0?'Open':`Buy ${fmtRwf(usdToRwf(r.price))} →`}</button>
            </div>
          </div>
        ))}
      </div>
      {resources.length===0&&<div className="card" style={{marginTop:12,textAlign:'center',color:'var(--text3)'}}>No resources published yet.</div>}
      {uploadOpen&&<UploadResourceModal user={currentUser} onClose={()=>setUploadOpen(false)} onUploaded={reload}/>}
      {editingResource&&<EditResourceModal resource={editingResource} user={currentUser} onClose={()=>setEditingResource(null)} onSaved={reload}/>}
      {buyingResource&&<MoMoPaymentModal
        user={currentUser}
        amount={buyingResource.price}
        amountRwf={usdToRwf(buyingResource.price)}
        label={`Resource: ${buyingResource.title}`}
        refId={buyingResource.id}
        refType="resource"
        targetId={buyingResource.author_id}
        onSuccess={async()=>{
          await dbIncrementResourceSales(buyingResource.id,buyingResource.sales);
          reload();
          setBuyingResource(null);
          setRatingResource(buyingResource);
          if(buyingResource.file_url) setTimeout(()=>window.open(buyingResource.file_url,'_blank','noopener,noreferrer'),500);
          toast('Purchase complete! File is unlocked. 🎉');
        }}
        onClose={()=>setBuyingResource(null)}
      />}
      {ratingResource&&<RatingModal
        user={currentUser}
        refId={ratingResource.id}
        refType="resource"
        targetId={ratingResource.author_id}
        targetName={ratingResource.author}
        label={ratingResource.title}
        onClose={()=>setRatingResource(null)}
      />}
      {confirmDeleteRes&&<ConfirmModal title="Delete Resource?" message={`Are you sure you want to delete "${confirmDeleteRes.title}"? This cannot be undone.`} onConfirm={()=>doDeleteResource(confirmDeleteRes)} onCancel={()=>setConfirmDeleteRes(null)}/>}
    </div>
  );
}

// ── COMPANY FULL-PAGE VIEW (public profile, read-only) ───
function StarRating({value, onSelect, size=18, readonly=false}){
  const [hover,setHover]=useState(0);
  return(
    <span style={{display:'inline-flex',gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i}
          className="material-symbols-rounded"
          style={{
            fontSize:size,
            color:i<=(hover||value)?'#F59E0B':'var(--border)',
            cursor:readonly?'default':'pointer',
            fontVariationSettings:"'FILL' 1",
            transition:'color .1s',
          }}
          onMouseEnter={()=>!readonly&&setHover(i)}
          onMouseLeave={()=>!readonly&&setHover(0)}
          onClick={()=>!readonly&&onSelect&&onSelect(i)}
        >star</span>
      ))}
    </span>
  );
}

function CompanyPage({company, onBack, onApply}){
  const [jobs,setJobs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [viewJob,setViewJob]=useState(null);
  const [following,setFollowing]=useState(false);
  const [followCount,setFollowCount]=useState(0);
  const [followLoading,setFollowLoading]=useState(false);
  const [activeTab,setActiveTab]=useState('about');
  const [followers,setFollowers]=useState([]);
  const [followersLoading,setFollowersLoading]=useState(false);
  const [ratings,setRatings]=useState([]);
  const [ratingsLoading,setRatingsLoading]=useState(false);
  const [myRating,setMyRating]=useState(null);
  const [ratingDraft,setRatingDraft]=useState(0);
  const [ratingComment,setRatingComment]=useState('');
  const [submittingRating,setSubmittingRating]=useState(false);
  const [emailPref,setEmailPref]=useState(true);
  const viewer=window.__aluHubUser;
  const isOwner=viewer?.user?.id===company?.id;
  const isCompanyUser=viewer?.userType==='company'||viewer?.userType==='school';
  const uid=viewer?.user?.id;

  useEffect(()=>{
    const c=getSB();
    if(!c||!company?.id){setLoading(false);return;}
    c.from('job_listings').select('*').eq('company_id',company.id).eq('status','active')
      .order('created_at',{ascending:false})
      .then(({data})=>{setJobs(data||[]);setLoading(false);});
    dbGetFollowerCount(company.id).then(setFollowCount);
    if(uid&&!isCompanyUser&&!isOwner){
      dbGetFollowedCompanies(uid).then(ids=>setFollowing(ids.includes(company.id)));
      dbGetMyCompanyRating(uid,company.id).then(r=>{
        if(r){setMyRating(r);setRatingDraft(r.score||0);setRatingComment(r.comment||'');}
      });
    }
  },[company?.id]);

  useEffect(()=>{
    if(activeTab==='followers'&&!followersLoading&&followers.length===0){
      setFollowersLoading(true);
      dbGetFollowersList(company.id).then(list=>{setFollowers(list);setFollowersLoading(false);});
    }
    if(activeTab==='reviews'&&!ratingsLoading&&ratings.length===0){
      setRatingsLoading(true);
      dbGetCompanyRatings(company.id).then(list=>{setRatings(list);setRatingsLoading(false);});
    }
  },[activeTab]);

  async function toggleFollow(){
    if(!uid){toast('Sign in to follow companies');return;}
    setFollowLoading(true);
    if(following){
      await dbUnfollowCompany(uid,company.id);
      setFollowing(false);
      setFollowCount(n=>Math.max(0,n-1));
      toast('Unfollowed '+company.name);
    }else{
      await dbFollowCompany(uid,company.id);
      setFollowing(true);
      setFollowCount(n=>n+1);
      toast('Following '+company.name+' \u2014 you\u2019ll get notified of new listings!');
    }
    setFollowLoading(false);
  }

  async function submitRating(){
    if(!uid){toast('Sign in to leave a review');return;}
    if(!ratingDraft){toast('Please select a star rating');return;}
    setSubmittingRating(true);
    await dbSubmitCompanyRating(uid,company.id,ratingDraft,ratingComment);
    setMyRating({score:ratingDraft,comment:ratingComment});
    setRatings([]);setRatingsLoading(false); // reset so re-fetch happens
    toast('Review submitted \u2714');
    setSubmittingRating(false);
    setActiveTab('reviews');
  }

  if(!company) return null;
  if(viewJob){
    return <JobDetailPage
      job={{...viewJob,co:company.name,avatar_url:company.avatar_url,bg:company.bg,company_id:company.id,company_name:company.name,company_desc:company.desc}}
      onBack={()=>setViewJob(null)}
      user={viewer}
      onViewCompany={()=>setViewJob(null)}
    />;
  }

  const tierColors={Premium:'purple',Standard:'blue',Basic:'gray'};
  const initials=(company.name||'C').slice(0,2).toUpperCase();
  const avgRating=ratings.length>0?(ratings.reduce((s,r)=>s+(r.score||0),0)/ratings.length).toFixed(1):null;

  const tabs=[
    {id:'about',label:'About',icon:'info'},
    {id:'jobs',label:`Jobs${jobs.length>0?' ('+jobs.length+')':''}`,icon:'work'},
    {id:'followers',label:`Followers${followCount>0?' ('+followCount+')':''}`,icon:'group'},
    {id:'reviews',label:'Reviews',icon:'star'},
  ];

  return(
    <div className="company-page anim" style={{maxWidth:860,margin:'0 auto'}}>
      <button className="btn btn-ghost" style={{marginBottom:20,gap:6,fontSize:13}} onClick={onBack}>
        <span className="material-symbols-rounded" style={{fontSize:16}}>arrow_back</span>
        Back to Companies
      </button>

      {/* Cover */}
      <div style={{position:'relative',width:'100%',height:200,borderRadius:'16px 16px 0 0',overflow:'hidden',background:'linear-gradient(135deg,#0A2E5C,#1a4a80 50%,#071e3d)'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,203,0,.07),transparent 55%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
          <div style={{opacity:.06,fontSize:110,fontWeight:900,color:'#fff',letterSpacing:-8,userSelect:'none',fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:'nowrap'}}>{company.name}</div>
        </div>
      </div>

      {/* Header Card */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderTop:'none',borderRadius:'0 0 16px 16px',padding:'0 28px 20px',marginBottom:0,boxShadow:'0 2px 12px rgba(10,46,92,.07)'}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16}}>
          <div style={{position:'relative',marginTop:-44}}>
            <div style={{width:88,height:88,borderRadius:16,background:'var(--bg2)',border:'3px solid var(--bg2)',boxShadow:'0 4px 20px rgba(0,0,0,.2)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {company.avatar_url
                ?<img src={company.avatar_url} alt={company.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,var(--alu-navy),#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.02em'}}>{initials}</div>
              }
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,paddingBottom:4}}>
            {isOwner&&(
              <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:20,background:'var(--alu-yellow-dim)',border:'1px solid var(--alu-yellow-border)',fontSize:12,fontWeight:700,color:'var(--alu-navy)'}}>
                <span className="material-symbols-rounded" style={{fontSize:13}}>verified</span>Your Profile
              </span>
            )}
            {!isOwner&&!isCompanyUser&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5}}>
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:20,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s',background:following?'var(--alu-yellow)':'var(--bg3)',border:following?'1.5px solid var(--alu-yellow)':'1.5px solid var(--border)',color:following?'var(--alu-navy)':'var(--text2)',opacity:followLoading?.6:1}}
                >
                  <span className="material-symbols-rounded" style={{fontSize:15,fontVariationSettings:following?"'FILL' 1":"'FILL' 0"}}>{following?'notifications_active':'add_alert'}</span>
                  {following?'Following':'Follow'}
                </button>
                {following&&(
                  <label style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:'var(--text3)',cursor:'pointer'}}>
                    <input type="checkbox" checked={emailPref} onChange={e=>setEmailPref(e.target.checked)} style={{width:12,height:12}}/>
                    Email me new listings
                  </label>
                )}
              </div>
            )}
            {followCount>0&&(
              <span style={{fontSize:11,color:'var(--text3)',fontWeight:500,cursor:!isCompanyUser?'pointer':'default'}} onClick={()=>setActiveTab('followers')}>
                {followCount} follower{followCount!==1?'s':''}
              </span>
            )}
            {avgRating&&(
              <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--text2)',fontWeight:600}}>
                <span className="material-symbols-rounded" style={{fontSize:14,color:'#F59E0B',fontVariationSettings:"'FILL' 1"}}>star</span>
                {avgRating} ({ratings.length} review{ratings.length!==1?'s':''})
              </span>
            )}
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:5}}>
          <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:900,color:'var(--text)',letterSpacing:'-.03em',margin:0}}>{company.name}</h1>
          <Tag type={tierColors[company.tier]||'gray'}>{company.tier||'Listed'}</Tag>
        </div>
        {company.tagline&&<div style={{fontSize:14,color:'var(--text2)',marginBottom:10,lineHeight:1.5}}>{company.tagline}</div>}

        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
          {company.type&&(<span className="co-info-chip"><span className="material-symbols-rounded">domain</span>{company.type}</span>)}
          {company.location&&(<span className="co-info-chip"><span className="material-symbols-rounded">location_on</span>{company.location}</span>)}
          {company.size&&(<span className="co-info-chip"><span className="material-symbols-rounded">people</span>{company.size} employees</span>)}
          {company.since&&(<span className="co-info-chip"><span className="material-symbols-rounded">calendar_today</span>Est. {company.since}</span>)}
          {!loading&&(
            jobs.length>0
              ?<span className="stat-open-positions"><span className="material-symbols-rounded" style={{fontSize:14,fontVariationSettings:"'FILL' 1"}}>work</span>{jobs.length} open {jobs.length===1?'position':'positions'}</span>
              :<span className="co-info-chip" style={{color:'var(--text3)'}}><span className="material-symbols-rounded">work_off</span>No open positions</span>
          )}
        </div>

        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {company.website&&(<a href={company.website.startsWith('http')?company.website:'https://'+company.website} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:20,background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text2)',fontSize:12.5,fontWeight:600,textDecoration:'none',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--alu-yellow)';e.currentTarget.style.color='var(--alu-navy)';e.currentTarget.style.borderColor='var(--alu-yellow)';}} onMouseLeave={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.color='var(--text2)';e.currentTarget.style.borderColor='var(--border)';}}>
            <span className="material-symbols-rounded" style={{fontSize:14}}>language</span>Website</a>)}
          {company.linkedin&&(<a href={company.linkedin.startsWith('http')?company.linkedin:'https://'+company.linkedin} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:20,background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text2)',fontSize:12.5,fontWeight:600,textDecoration:'none',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--alu-yellow)';e.currentTarget.style.color='var(--alu-navy)';e.currentTarget.style.borderColor='var(--alu-yellow)';}} onMouseLeave={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.color='var(--text2)';e.currentTarget.style.borderColor='var(--border)';}}>
            <span className="material-symbols-rounded" style={{fontSize:14}}>link</span>LinkedIn</a>)}
          {company.email&&(<a href={'mailto:'+company.email} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:20,background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text2)',fontSize:12.5,fontWeight:600,textDecoration:'none',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--alu-yellow)';e.currentTarget.style.color='var(--alu-navy)';e.currentTarget.style.borderColor='var(--alu-yellow)';}} onMouseLeave={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.color='var(--text2)';e.currentTarget.style.borderColor='var(--border)';}}>
            <span className="material-symbols-rounded" style={{fontSize:14}}>mail</span>{company.email}</a>)}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{display:'flex',gap:0,background:'var(--bg2)',border:'1px solid var(--border)',borderTop:'none',borderRadius:'0 0 0 0',marginBottom:0,overflowX:'auto'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'12px 18px',fontSize:13,fontWeight:activeTab===t.id?700:500,color:activeTab===t.id?'var(--alu-navy)':'var(--text2)',background:'transparent',border:'none',borderBottom:activeTab===t.id?'2px solid var(--alu-navy)':'2px solid transparent',cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s'}}>
            <span className="material-symbols-rounded" style={{fontSize:15,fontVariationSettings:activeTab===t.id?"'FILL' 1":"'FILL' 0"}}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderTop:'none',borderRadius:'0 0 16px 16px',padding:'24px 28px',marginBottom:16}}>

        {/* ABOUT TAB */}
        {activeTab==='about'&&(
          <div>
            {company.desc&&(
              <div style={{marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
                  <span className="material-symbols-rounded" style={{fontSize:18,color:'var(--alu-yellow)',fontVariationSettings:"'FILL' 1"}}>info</span>
                  <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:'var(--text)',letterSpacing:'-.02em'}}>About {company.name}</span>
                </div>
                <p style={{fontSize:14,color:'var(--text2)',lineHeight:1.75,margin:0}}>{company.desc}</p>
              </div>
            )}
            {!company.desc&&(<div style={{fontSize:13,color:'var(--text3)',textAlign:'center',padding:'24px 0'}}>No company description yet.</div>)}
          </div>
        )}

        {/* JOBS TAB */}
        {activeTab==='jobs'&&(
          <div>
            {loading&&<div style={{textAlign:'center',padding:32,color:'var(--text3)',fontSize:13}}>Loading listings…</div>}
            {!loading&&jobs.length===0&&(
              <div style={{textAlign:'center',padding:32}}>
                <span className="material-symbols-rounded" style={{fontSize:40,color:'var(--text3)',display:'block',marginBottom:8}}>work_off</span>
                <div style={{fontSize:14,color:'var(--text3)'}}>No open positions right now.</div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {jobs.map((j,i)=>(
                <div key={i} onClick={()=>setViewJob(j)} style={{padding:'14px 18px',borderRadius:12,background:'var(--bg3)',border:'1px solid var(--border)',cursor:'pointer',transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)'}}>{j.title}</span>
                    <div style={{display:'flex',gap:6}}>
                      {j.listing_type&&<Tag type="gray">{j.listing_type}</Tag>}
                      <Tag type="green">Open</Tag>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:14,fontSize:12,color:'var(--text3)',flexWrap:'wrap'}}>
                    {j.location&&<span style={{display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:13}}>location_on</span>{j.location}</span>}
                    {j.pay&&<span style={{display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:13}}>payments</span>{j.pay}</span>}
                    {j.duration&&<span style={{display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:13}}>schedule</span>{j.duration}</span>}
                    {j.deadline&&<span style={{display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:13}}>event</span>Deadline: {new Date(j.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>}
                  </div>
                  {!isCompanyUser&&(<button className="btn btn-yellow" style={{marginTop:10,fontSize:12,padding:'6px 14px'}} onClick={e=>{
                    e.stopPropagation();
                    // External apply link wins over the in-app form — if no URL is set the
                    // application is received natively on ALU Hub.
                    if(j?.apply_url){window.open(j.apply_url,'_blank','noopener,noreferrer');return;}
                    if(onApply) onApply(j);
                  }}>Apply</button>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOLLOWERS TAB */}
        {activeTab==='followers'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span className="material-symbols-rounded" style={{fontSize:18,color:'var(--accent)',fontVariationSettings:"'FILL' 1"}}>group</span>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:'var(--text)'}}>Followers</span>
                <span style={{fontSize:13,color:'var(--text3)',fontWeight:500}}>{followCount} total</span>
              </div>
            </div>
            {followersLoading&&<div style={{textAlign:'center',padding:32,color:'var(--text3)',fontSize:13}}>Loading followers…</div>}
            {!followersLoading&&followers.length===0&&(
              <div style={{textAlign:'center',padding:40}}>
                <span className="material-symbols-rounded" style={{fontSize:40,color:'var(--text3)',display:'block',marginBottom:8}}>person_off</span>
                <div style={{fontSize:14,color:'var(--text3)'}}>No followers yet. Students who follow {company.name} will appear here.</div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {followers.map((f,i)=>{
                const initials2=(f.name||'S').slice(0,2).toUpperCase();
                const timeAgo=(dateStr)=>{
                  const s=Math.floor((Date.now()-new Date(dateStr).getTime())/1000);
                  if(s<60) return 'just now';
                  if(s<3600) return Math.floor(s/60)+'m ago';
                  if(s<86400) return Math.floor(s/3600)+'h ago';
                  if(s<7*86400) return Math.floor(s/86400)+'d ago';
                  return new Date(dateStr).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
                };
                return(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                    <div style={{width:38,height:38,borderRadius:'50%',flexShrink:0,overflow:'hidden',background:'linear-gradient(135deg,var(--alu-navy),#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      {f.avatar_url?<img src={f.avatar_url} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials2}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)'}}>{f.name}</div>
                      <div style={{fontSize:12,color:'var(--text3)'}}>{[f.school,f.year,f.major].filter(Boolean).join(' \u00b7 ')}</div>
                    </div>
                    <span style={{fontSize:11,color:'var(--text3)',flexShrink:0}}>{timeAgo(f.followedAt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab==='reviews'&&(
          <div>
            {/* Aggregate rating */}
            {ratings.length>0&&(
              <div style={{display:'flex',alignItems:'center',gap:20,padding:'16px 20px',background:'var(--bg3)',borderRadius:12,border:'1px solid var(--border)',marginBottom:20}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:40,fontWeight:900,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>{avgRating}</div>
                  <StarRating value={Math.round(Number(avgRating))} readonly size={14}/>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{ratings.length} review{ratings.length!==1?'s':''}</div>
                </div>
                <div style={{flex:1}}>
                  {[5,4,3,2,1].map(star=>{
                    const cnt=ratings.filter(r=>r.score===star).length;
                    const pct=ratings.length>0?(cnt/ratings.length*100):0;
                    return(
                      <div key={star} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:11,color:'var(--text3)',minWidth:12}}>{star}</span>
                        <span className="material-symbols-rounded" style={{fontSize:12,color:'#F59E0B',fontVariationSettings:"'FILL' 1"}}>star</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:'var(--border)',overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:3,background:'#F59E0B',width:pct+'%',transition:'width .5s ease'}}/>
                        </div>
                        <span style={{fontSize:11,color:'var(--text3)',minWidth:18}}>{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write a review (students only, not owner) */}
            {!isOwner&&!isCompanyUser&&(
              <div style={{padding:'16px 20px',background:'var(--bg3)',borderRadius:12,border:'1px solid var(--border)',marginBottom:20}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:'var(--text)',marginBottom:10}}>
                  {myRating?'Update your review':'Leave a review'}
                </div>
                <div style={{marginBottom:10}}>
                  <StarRating value={ratingDraft} onSelect={setRatingDraft} size={22}/>
                </div>
                <textarea
                  value={ratingComment}
                  onChange={e=>setRatingComment(e.target.value)}
                  placeholder="Share your experience with this company (optional)…"
                  rows={3}
                  style={{width:'100%',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--text)',fontSize:13,padding:'10px 12px',resize:'vertical',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}
                />
                <button className="btn btn-primary" style={{marginTop:10,fontSize:13}} onClick={submitRating} disabled={submittingRating||!ratingDraft}>
                  <span className="material-symbols-rounded" style={{fontSize:14}}>star</span>
                  {submittingRating?'Submitting…':myRating?'Update Review':'Submit Review'}
                </button>
              </div>
            )}

            {ratingsLoading&&<div style={{textAlign:'center',padding:24,color:'var(--text3)',fontSize:13}}>Loading reviews…</div>}
            {!ratingsLoading&&ratings.length===0&&(
              <div style={{textAlign:'center',padding:32}}>
                <span className="material-symbols-rounded" style={{fontSize:40,color:'var(--text3)',display:'block',marginBottom:8}}>rate_review</span>
                <div style={{fontSize:14,color:'var(--text3)'}}>No reviews yet. {!isOwner&&!isCompanyUser?'Be the first to leave one!':''}</div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {ratings.map((r,i)=>{
                const rInitials=(r.student?.full_name||'S').slice(0,2).toUpperCase();
                return(
                  <div key={i} style={{padding:'14px 16px',borderRadius:12,background:'var(--bg3)',border:'1px solid var(--border)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                      <div style={{width:34,height:34,borderRadius:'50%',flexShrink:0,overflow:'hidden',background:'linear-gradient(135deg,var(--alu-navy),#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>
                        {r.student?.avatar_url?<img src={r.student.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:rInitials}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{r.student?.full_name||'Student'}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>{r.student?.school||'ALU'}{r.student?.year?' \u00b7 '+r.student.year:''}</div>
                      </div>
                      <StarRating value={r.score||0} readonly size={13}/>
                    </div>
                    {r.comment&&<p style={{fontSize:13,color:'var(--text2)',lineHeight:1.65,margin:0}}>{r.comment}</p>}
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>
                      {r.updated_at?new Date(r.updated_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Companies({initialCompanyId,onEnter}){
  const tiers={Premium:'purple',Standard:'blue',Basic:'gray'};
  const [companies,setCompanies]=useState([]);
  const [loading,setLoading]=useState(true);
  const [viewingCompany,setViewingCompany]=useState(null);
  const [applyJob,setApplyJob]=useState(null);
  // Support navigation from Dashboard logo click via window.__dashboardCompanyId
  const resolvedId=initialCompanyId||window.__dashboardCompanyId||null;
  useEffect(()=>{
    setLoading(true);
    dbGetCompanies()
      .then(data=>{
        setCompanies(data||[]);
        // Auto-open company if navigated from a job listing or dashboard logo click
        const targetId=initialCompanyId||window.__dashboardCompanyId;
        if(targetId && data){
          const match=data.find(c=>c.id===targetId);
          if(match) setViewingCompany(match);
        }
        window.__dashboardCompanyId=null; // clear after use
        if(onEnter) onEnter();
      })
      .catch(()=>setCompanies([]))
      .finally(()=>setLoading(false));
  },[resolvedId]);

  if(viewingCompany) return(
    <CompanyPage
      company={viewingCompany}
      onBack={()=>setViewingCompany(null)}
      onApply={job=>{
        if(job?.apply_url){window.open(job.apply_url,'_blank','noopener,noreferrer');return;}
        setApplyJob(job);
      }}
    />
  );

  return (
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Company Listings</div>
          <div className="page-sub">{companies.length} companies hiring ALU & CMU-Africa students</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-outline" onClick={()=>toast('Create a company account to list your company.')}>
            <span className="material-symbols-rounded" style={{fontSize:15}}>add_business</span>
            List Your Company
          </button>
        </div>
      </div>

      <div className="card anim" style={{marginBottom:20,borderColor:'rgba(255,92,53,.12)',background:'linear-gradient(135deg,rgba(79,70,229,.04),rgba(16,185,129,.04))'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:'var(--text)',marginBottom:5,letterSpacing:'-.03em'}}>
              <span className="material-symbols-rounded" style={{fontSize:18,verticalAlign:'middle',marginRight:6,color:'var(--accent)'}}>campaign</span>
              Advertise on ALU Hub
            </div>
            <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>Reach 500+ ALU & CMU-Africa students. Post internships, list your company, hire top talent.</div>
          </div>
          <div className="pricing-row">
            {[{n:'Basic',p:'$25/mo',f:'1 job posting',c:'gray'},{n:'Standard',p:'$75/mo',f:'5 postings + featured',c:'blue'},{n:'Premium',p:'$150/mo',f:'Unlimited + homepage',c:'purple'}].map(t=>(
              <div key={t.n} className="price-tier">
                <div className="price-tier-name">{t.n}</div>
                <div className="price-tier-price">{t.p}</div>
                <div className="price-tier-feat">{t.f}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading?(
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:64,flexDirection:'column',gap:14}}>
          <div style={{width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          <div style={{fontSize:13,color:'var(--text3)'}}>Loading companies…</div>
        </div>
      ):(
      <><div className="co-grid">
        {companies.map((c,i)=>{
          const initials=(c.name||'C').slice(0,2).toUpperCase();
          return(
          <div key={i} className="co-card" style={{cursor:'pointer',display:'flex',flexDirection:'column',gap:0}} onClick={()=>setViewingCompany(c)}>
            {/* Logo + name row */}
            <div className="co-card-top" style={{alignItems:'flex-start',gap:14}}>
              {/* Logo */}
              <div style={{
                width:52,height:52,borderRadius:12,flexShrink:0,
                overflow:'hidden',border:'1px solid var(--border)',
                display:'flex',alignItems:'center',justifyContent:'center',
                background:'var(--bg3)',boxShadow:'0 2px 8px rgba(10,46,92,.1)',
              }}>
                {c.avatar_url
                  ?<img src={c.avatar_url} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<div style={{
                    width:'100%',height:'100%',
                    background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:18,fontWeight:900,color:'#fff',
                    fontFamily:"'Plus Jakarta Sans',sans-serif",
                  }}>{initials}</div>
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div className="co-name" style={{fontSize:15,letterSpacing:'-.02em',marginBottom:2}}>{c.name}</div>
                <div className="co-type" style={{fontSize:12,marginBottom:5}}>{c.type}</div>
                <Tag type={tiers[c.tier]||'gray'}>{c.tier||'Listed'}</Tag>
              </div>
            </div>
            {/* Description */}
            {c.desc&&c.desc!=='Company profile'&&(
              <div className="co-desc" style={{fontSize:12.5,lineHeight:1.65,margin:'10px 0',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{c.desc}</div>
            )}
            {/* Footer */}
            <div className="co-footer" style={{marginTop:'auto',paddingTop:10,borderTop:'1px solid var(--border)'}}>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div style={{fontSize:11.5,color:'var(--text2)',display:'flex',alignItems:'center',gap:5}}>
                  <span className="material-symbols-rounded" style={{fontSize:13,color:'var(--alu-navy)'}}>calendar_today</span>
                  Est. {c.since||'N/A'}
                </div>
                <div style={{fontSize:11.5,color:'var(--text2)',display:'flex',alignItems:'center',gap:5}}>
                  <span className="material-symbols-rounded" style={{fontSize:13,color:'var(--accent)'}}>group</span>
                  {c.jobs>0?c.jobs+' open position'+(c.jobs!==1?'s':''):'No open positions'}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" style={{display:'flex',alignItems:'center',gap:5,fontSize:12}} onClick={e=>{e.stopPropagation();setViewingCompany(c);}}>
                View Profile
                <span className="material-symbols-rounded" style={{fontSize:13}}>arrow_forward</span>
              </button>
            </div>
          </div>
          );
        })}
      </div>
      {companies.length===0&&(
        <div className="card" style={{marginTop:12,textAlign:'center',padding:48}}>
          <span className="material-symbols-rounded" style={{fontSize:40,color:'var(--text3)',display:'block',marginBottom:12}}>business</span>
          <div style={{fontWeight:700,color:'var(--text)',marginBottom:6}}>No companies listed yet</div>
          <div style={{fontSize:13,color:'var(--text2)'}}>Companies will appear here once they register on ALU Hub.</div>
        </div>
      )}
      </>)}
      {applyJob&&<ApplyModal job={applyJob} user={window.__aluHubUser} onClose={()=>setApplyJob(null)}/>}
    </div>
  );
}

// ── SVG ICONS ──
function IconBed({size=14,color='currentColor'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><path d="M2 9h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z"/><path d="M6 9V5"/><path d="M18 9V5"/><path d="M10 9v4"/><path d="M14 9v4"/></svg>;
}
function IconMapPin({size=13,color='currentColor'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IconCalendar({size=13,color='currentColor'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
}
function IconUsers({size=13,color='currentColor'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconMail({size=13,color='currentColor'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}
function IconHome({size=14,color='currentColor'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IconAlertCircle({size=16,color='#FB923C'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
}
function IconPlus({size=13,color='currentColor'}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
}

// ── HOUSING BOARD ──
function PostHousingModal({onClose}){
  const [form,setForm]=useState({title:'',desc:'',area:'',dates:'',people:'1'});
  const [loading,setLoading]=useState(false);
  function set(k,v){setForm(f=>({...f,[k]:v}));}
  async function submit(){
    if(!form.title||!form.desc){toast('Please fill in a title and description.');return;}
    setLoading(true);
    // In production: insert to Supabase housing_requests table
    // For now: optimistic + toast
    const user=window.__aluHubUser;
    const uid=user?.user?.id;
    const c=getSB();
    if(c&&uid){
      // Insert housing request
      await c.from('housing_requests').insert({
        user_id:uid,title:form.title,description:form.desc,area:form.area,
        dates:form.dates,people:parseInt(form.people)||1,status:'active',
        posted_by:user?.form?.name||user?.profile?.full_name||'Student'
      }).select();
      // Notify all active users (broadcast as new housing post)
      await dbSendNotif(uid,'housing','Your housing request is live',`"${form.title}" is now visible to all students.`);
    }
    setLoading(false);
    onClose();
    setTimeout(()=>toast('Housing request posted! Other students can now see it.'),200);
  }
  return(
    <div className="overlay open">
      <div className="modal">
        <button className="modal-close" onClick={onClose}><span className="material-symbols-rounded" style={{fontSize:14}}>close</span></button>
        <div style={{fontSize:18,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,color:'var(--text)',marginBottom:4}}>Post Housing Request</div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>Let other ALU students know you need a place to stay.</div>
        <div className="form-group"><label className="form-label">Title *</label><input className="form-input" placeholder="e.g. Need a room near campus for 2 weeks" value={form.title} onChange={e=>set('title',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={3} placeholder="Tell students about your situation, what you need, and any relevant details…" value={form.desc} onChange={e=>set('desc',e.target.value)}/></div>
        <div className="two-col">
          <div className="form-group"><label className="form-label">Preferred Area</label><input className="form-input" placeholder="e.g. Kimironko" value={form.area} onChange={e=>set('area',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">People</label><select className="form-input" value={form.people} onChange={e=>set('people',e.target.value)}><option value="1">1 person</option><option value="2">2 people</option><option value="3">3+ people</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">Dates Needed</label><input className="form-input" placeholder="e.g. June 1 – 15" value={form.dates} onChange={e=>set('dates',e.target.value)}/></div>
        <div className="modal-actions"><button className="btn btn-primary" disabled={loading} onClick={submit}>{loading?'Posting…':'Post Request →'}</button><button className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}

function HousingBoard({onDMStudent}){
  const [filter,setFilter]=useState('all');
  const [showPost,setShowPost]=useState(false);
  const [dbRequests,setDbRequests]=useState(null);
  const [confirmDeleteReq,setConfirmDeleteReq]=useState(null);
  const myId=window.__aluHubUser?.user?.id;

  async function doDeleteRequest(r){
    try{
      await dbDeleteHousingRequest(r.id,myId);
      setDbRequests(prev=>(prev||[]).filter(x=>x.id!==r.id));
      toast('Housing request removed');
    }catch(err){toast('Delete failed — '+err.message);}
    setConfirmDeleteReq(null);
  }
  const filters=[
    {id:'all',label:'All Requests'},
    {id:'urgent',label:'Urgent'},
    {id:'solo',label:'Solo'},
    {id:'group',label:'Group'},
  ];

  // Load live housing requests from DB; if empty, use seeded in-app listings
  React.useEffect(()=>{
    const c=getSB();
    if(!c){setDbRequests([]);return;}
    c.from('housing_requests').select('*, poster:user_id(id,full_name,avatar_url,school,year,major)').eq('status','active').order('created_at',{ascending:false}).then(({data})=>{
      setDbRequests((data||[]).map(r=>({
        id:r.id, user_id:r.user_id,
        name:r.poster?.full_name||r.posted_by||'Student',
        avatar_url:r.poster?.avatar_url||null,
        prog:(r.poster?.major||'Student')+(r.poster?.year?' · Year '+r.poster.year:''),
        color:'#4F46E5', title:r.title, desc:r.description,
        area:r.area||'Kigali', dates:r.dates||'', people:r.people||1,
        urgent:r.urgent||false,
        posted:new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
        contact:''
      })));
    }).catch(()=>setDbRequests([]));
    // Realtime: new housing requests appear instantly
    const ch=c.channel('housing-board').on('postgres_changes',{event:'INSERT',schema:'public',table:'housing_requests'},()=>{
      c.from('housing_requests').select('*, poster:user_id(id,full_name,avatar_url,school,year,major)').eq('status','active').order('created_at',{ascending:false}).then(({data})=>{
        if(data&&data.length>0) setDbRequests(data.map(r=>({id:r.id,user_id:r.user_id,name:r.poster?.full_name||r.posted_by||'Student',avatar_url:r.poster?.avatar_url||null,prog:(r.poster?.major||'Student')+(r.poster?.year?' · Year '+r.poster.year:''),color:'#4F46E5',title:r.title,desc:r.description,area:r.area||'Kigali',dates:r.dates||'',people:r.people||1,urgent:r.urgent||false,posted:new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),contact:''})));
      });
    }).subscribe();
    return ()=>c.removeChannel(ch);
  },[]);

  const requests=dbRequests||[];
  const filtered = requests.filter(r=>{
    if(filter==='urgent') return r.urgent;
    if(filter==='solo') return r.people===1;
    if(filter==='group') return r.people>1;
    return true;
  });
  return (
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Housing Board</div>
          <div className="page-sub">Students looking for a place to stay — help a fellow ALU student out</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" style={{gap:6}} onClick={()=>setShowPost(true)}>
            <IconPlus size={13} color="#fff"/> Post Request
          </button>
        </div>
      </div>

      <div className="housing-banner anim">
        <div className="housing-banner-left">
          <div className="housing-banner-icon">
            <IconBed size={18} color="#FB923C"/>
          </div>
          <div>
            <div className="housing-banner-title">Community Housing Help</div>
            <div className="housing-banner-sub">If you have a spare room or couch, reach out directly to the student. No fees, just community.</div>
          </div>
        </div>
        <div style={{display:'flex',gap:18,flexShrink:0}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:'var(--text)',letterSpacing:'-.04em'}}>{requests.length}</div>
            <div style={{fontSize:10.5,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.6px',fontWeight:600}}>Open</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:'#FB923C',letterSpacing:'-.04em'}}>{requests.filter(r=>r.urgent).length}</div>
            <div style={{fontSize:10.5,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.6px',fontWeight:600}}>Urgent</div>
          </div>
        </div>
      </div>

      <div className="filters">
        {filters.map(f=>(
          <button key={f.id} className={`filter-chip${filter===f.id?' active':''}`} onClick={()=>setFilter(f.id)}>
            {f.id==='urgent'&&<span className="material-symbols-rounded" style={{fontSize:11,color:'#EF4444',marginRight:3,verticalAlign:'middle'}}>circle</span>}{f.label}
          </button>
        ))}
      </div>

      <div className="housing-grid">
        {filtered.map((r,i)=>(
          <div key={r.id} className={`housing-card anim${r.urgent?' urgent':''}`} style={{animationDelay:i*0.05+'s'}}>
            <div className="housing-card-top">
              <div className="housing-poster">
                <div className="housing-av" style={{background:r.color+'22',color:r.color,border:`1px solid ${r.color}44`,overflow:'hidden',padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {r.avatar_url
                    ?<img src={r.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    :r.name.split(' ').map(w=>w[0]).join('').slice(0,2)
                  }
                </div>
                <div>
                  <div className="housing-poster-name">{r.name}</div>
                  <div className="housing-poster-prog">{r.prog}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:4,alignItems:'center',flexShrink:0}}>
                {r.urgent&&<span className="tag tag-orange" style={{display:'flex',alignItems:'center',gap:3}}><IconAlertCircle size={10} color="#FB923C"/> Urgent</span>}
                {r.people>1&&<span className="tag tag-blue" style={{display:'flex',alignItems:'center',gap:3}}><IconUsers size={10} color="var(--accent)"/> Group</span>}
              </div>
            </div>

            <div className="housing-title">{r.title}</div>
            <div className="housing-desc">{r.desc}</div>

            <div className="housing-meta">
              <div className="housing-meta-item"><IconMapPin size={12} color="var(--text3)"/>{r.area}</div>
              <div className="housing-meta-item"><IconCalendar size={12} color="var(--text3)"/>{r.dates}</div>
              <div className="housing-meta-item"><IconUsers size={12} color="var(--text3)"/>{r.people} person{r.people>1?'s':''}</div>
            </div>

              <div className="housing-footer">
              <div className="housing-posted">Posted {r.posted}</div>
              <button className="btn btn-sm btn-outline" style={{gap:5}} onClick={()=>{
                navigator.clipboard?.writeText(r.contact).catch(()=>{});
                toast(`Contact copied: ${r.contact}`);
              }}>
                <IconMail size={12} color="var(--accent)"/> Email
              </button>
              {r.user_id&&r.user_id===myId&&(
                <button className="btn btn-sm btn-ghost" style={{gap:5,color:'#F87171'}} onClick={()=>setConfirmDeleteReq(r)}>
                  <span className="material-symbols-rounded" style={{fontSize:13}}>delete</span>Remove
                </button>
              )}
              {r.user_id&&r.user_id!==myId&&(
                <button className="btn btn-sm btn-primary" style={{gap:5}} onClick={()=>{
                  if(onDMStudent) onDMStudent({otherId:r.user_id,other:{full_name:r.name,school:r.prog,avatar_url:r.avatar_url||null}});
                }}>
                  <span className="material-symbols-rounded" style={{fontSize:13}}>chat_bubble_outline</span>Message
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length===0&&(
        <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)',fontSize:13}}>
          No requests matching this filter right now.
        </div>
      )}
      {showPost&&<PostHousingModal onClose={()=>setShowPost(false)}/>}
      {confirmDeleteReq&&<ConfirmModal title="Remove Request?" message={`Remove "${confirmDeleteReq.title}"? Other students won\'t see it anymore.`} onConfirm={()=>doDeleteRequest(confirmDeleteReq)} onCancel={()=>setConfirmDeleteReq(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  ALU HUB v3 — NEW FEATURES
//  Applications · Company Dashboard · Messenger · Notifications
// ══════════════════════════════════════════════════════

// ── SUPABASE BRIDGE ──────────────────────────────────
const SB_URL2 = 'https://dkvrvnufajnwrrpvgsck.supabase.co';
const SB_KEY2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdnJ2bnVmYWpud3JycHZnc2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTkyNjksImV4cCI6MjA5Mjc3NTI2OX0.BqAdsWxfgr0eCP9Imf9qV58W6Xx9lYFt6TGJ1EUj2HQ';
function getSB(){
  if(window._sbMain) return window._sbMain;
  if(!window.supabase?.createClient) return null;
  window._sbMain = window.supabase.createClient(SB_URL2, SB_KEY2);
  return window._sbMain;
}

function fmtBytes(bytes){
  if(!bytes||Number.isNaN(bytes)) return '0 B';
  const units=['B','KB','MB','GB'];
  let v=bytes, i=0;
  while(v>=1024&&i<units.length-1){v/=1024;i++;}
  return `${v.toFixed(v<10&&i>0?1:0)} ${units[i]}`;
}

async function uploadMessageFile({uid,file,kind='message'}){
  const c=getSB();
  if(!c||!uid||!file) throw new Error('Upload unavailable');
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const safeName=(file.name||'upload').replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`chat_uploads/${kind}/${uid}/${Date.now()}_${safeName}`;
  const {error}=await c.storage.from('aluhub-media').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
  if(error) throw error;
  const {data}=c.storage.from('aluhub-media').getPublicUrl(path);
  return {
    url:data?.publicUrl||'',
    name:file.name||`file.${ext}`,
    size:file.size||0,
    type:file.type||'application/octet-stream',
    kind:(file.type||'').startsWith('image/')?'image':'file',
  };
}

// ── DB HELPERS ────────────────────────────────────────
async function dbGetMyApps(uid){
  const c=getSB(); if(!c||!uid) return [];
  const {data}=await c.from('applications')
    .select('*, job:job_id(*, company:profiles!fk_job_listings_company_id(company_name,avatar_url))')
    .eq('student_id',uid).order('created_at',{ascending:false});
  return (data||[]).map(app=>({
    ...app,
    job:app.job?{
      ...app.job,
      co:app.job.company?.company_name||app.job.co||'Company',
      avatar_url:app.job.company?.avatar_url||app.job.avatar_url||null,
    }:app.job,
  }));
}
async function dbApply(studentId,jobId,coverNote,studentName,companyId,jobTitle,extra={}){
  const c=getSB(); if(!c) return {error:'No DB'};
  // Only include columns that exist in the schema (see SUPABASE_RLS_FIX.sql)
  const payload={
    student_id:studentId,
    job_id:jobId,
    cover_note:coverNote||'',
    status:'pending',
    cv_url:extra.cv_url||null,
    cover_url:extra.cover_url||null,
    transcript_url:extra.transcript_url||null,
    recommendation_url:extra.recommendation_url||null,
    portfolio_url:extra.portfolio_url||null,
    certificate_url:extra.certificate_url||null,
    id_url:extra.id_url||null,
  };
  const result=await c.from('applications').upsert(payload,{onConflict:'student_id,job_id'});
  if(result.error) console.error('dbApply error:',result.error.message);
  if(companyId){
    await dbSendNotif(companyId,'new_application','New application received',`${studentName||'A student'} applied to "${jobTitle||'your listing'}".`,{ref_id:jobId});
  }
  return result;
}
async function dbGetCoApps(uid){
  const c=getSB(); if(!c||!uid) return [];
  // Step 1: get company's job IDs
  const {data:jobs}=await c.from('job_listings').select('id,title').eq('company_id',uid);
  if(!jobs||jobs.length===0) return [];
  const jobIds=jobs.map(j=>j.id);
  // Step 2: fetch applications for those jobs, join student profile
  const {data}=await c
    .from('applications')
    .select('*, student:student_id(id,full_name,school,major,year,avatar_url), job:job_id(id,title,listing_type)')
    .in('job_id',jobIds)
    .order('created_at',{ascending:false});
  return data||[];
}
async function dbSetStatus(appId,status,studentId,jobTitle){
  const c=getSB(); if(!c) return;
  const {error}=await c.from('applications').update({status}).eq('id',appId);
  if(error){ console.error('dbSetStatus error:',error.message); return; }
  // Notify the student (avoid referencing S_META which is defined later in the file)
  const STATUS_TITLES={pending:'Application received',reviewed:'Application reviewed',shortlisted:"You've been shortlisted!",hired:"Congratulations — you've been accepted!",rejected:'Application update'};
  const STATUS_BODIES={reviewed:`Your application for "${jobTitle||'the position'}" was reviewed.`,shortlisted:`Great news! You were shortlisted for "${jobTitle||'the position'}".`,hired:`You have been officially accepted for "${jobTitle||'the position'}"! Congratulations.`,rejected:`Your application for "${jobTitle||'the position'}" was not selected this time.`};
  if(studentId&&STATUS_TITLES[status]&&STATUS_BODIES[status]){
    await dbSendNotif(studentId,'status_change',STATUS_TITLES[status],STATUS_BODIES[status],{ref_id:appId});
  }
}
async function dbGetMsgs(appId){
  const c=getSB(); if(!c||!appId) return [];
  const {data,error}=await c.from('messages').select('*').eq('application_id',appId).order('created_at',{ascending:true});
  if(error) console.error('dbGetMsgs error:',error.message);
  return data||[];
}
async function dbSendMsg(senderId,appId,text,recipientId,senderName,meta={}){
  const c=getSB(); if(!c) return;
  await c.from('messages').insert({
    sender_id:senderId,
    application_id:appId,
    text,
    attachment_url:meta.attachment_url||null,
    attachment_name:meta.attachment_name||null,
    attachment_type:meta.attachment_type||null,
    attachment_size:meta.attachment_size||null,
    message_kind:meta.message_kind||'text',
  });
  // Notify recipient
  if(recipientId&&recipientId!==senderId){
    await dbSendNotif(recipientId,'message','New message',`${senderName||'Someone'} sent you a message.`);
  }
}
async function dbGetNotifs(uid){
  const c=getSB(); if(!c||!uid) return [];
  const {data}=await c.from('notifications').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(20);
  return data||[];
}
async function dbMarkRead(uid){
  const c=getSB(); if(!c) return;
  await c.from('notifications').update({read:true}).eq('user_id',uid).eq('read',false);
}
async function dbSendNotif(userId, type, title, body, meta={}){
  const c=getSB(); if(!c||!userId) return;
  // Try with ref_id first, fall back to minimal insert if column missing
  try {
    const {error}=await c.from('notifications').insert({user_id:userId,type,title,body,read:false,ref_id:meta.ref_id||null});
    if(error){
      // Fallback: insert without optional columns
      await c.from('notifications').insert({user_id:userId,type,title,body,read:false});
    }
  } catch(e){
    try { await c.from('notifications').insert({user_id:userId,type,title,body,read:false}); } catch(_){}
  }
}

// ── DIRECT MESSAGE HELPERS (student↔student) ─────────────────────
function dmThreadId(a,b){ return [a,b].sort().join('__'); }

async function dbGetDMThreads(uid){
  const c=getSB(); if(!c||!uid) return [];
  const {data}=await c.from('direct_messages')
    .select('*, sender:sender_id(id,full_name,company_name,user_type,avatar_url,school,year), recipient:recipient_id(id,full_name,company_name,user_type,avatar_url,school,year)')
    .or('sender_id.eq.'+uid+',recipient_id.eq.'+uid)
    .order('created_at',{ascending:false});
  if(!data) return [];
  // Collapse into threads keyed by the other person's id
  const seen=new Map();
  for(const m of data){
    const otherId=m.sender_id===uid?m.recipient_id:m.sender_id;
    if(!seen.has(otherId)){
      const other=m.sender_id===uid?m.recipient:m.sender;
      // Normalise display name across student (full_name) and company (company_name)
      if(other) other.displayName=other.full_name||other.company_name||'User';
      seen.set(otherId,{threadId:dmThreadId(uid,otherId),otherId,other,lastMsg:m.text,lastAt:m.created_at,unread:(!m.read&&m.recipient_id===uid)?1:0});
    } else if(!m.read&&m.recipient_id===uid){
      seen.get(otherId).unread++;
    }
  }
  return [...seen.values()];
}

async function dbGetDMs(uid,otherId){
  const c=getSB(); if(!c) return [];
  const tid=dmThreadId(uid,otherId);
  const {data}=await c.from('direct_messages')
    .select('*, sender:sender_id(id,full_name,avatar_url)')
    .eq('thread_id',tid)
    .order('created_at',{ascending:true});
  return data||[];
}

async function dbSendDM(senderId,recipientId,text,senderName,meta={}){
  const c=getSB(); if(!c) return {error:{message:'No Supabase client'}};
  const tid=dmThreadId(senderId,recipientId);
  const row={
    sender_id:senderId,
    recipient_id:recipientId,
    thread_id:tid,
    text,
    read:false,
    attachment_url:meta.attachment_url||null,
    attachment_name:meta.attachment_name||null,
    attachment_type:meta.attachment_type||null,
    attachment_size:meta.attachment_size||null,
    message_kind:meta.message_kind||'text',
  };
  let {error}=await c.from('direct_messages').insert(row);
  // 401 typically means the access token expired between page load
  // and now. Refresh once and retry — saves the user from a confusing
  // "message just disappeared" experience.
  if(error && /jwt|expired|401|unauthor/i.test(error.message||'')){
    try{
      if(typeof window.refreshSession==='function') await window.refreshSession();
      ({error}=await c.from('direct_messages').insert(row));
    }catch{}
  }
  if(error){
    console.error('[DM] insert failed:',error.message||error);
    return {error};
  }
  await dbSendNotif(recipientId,'dm','New message',`${senderName||'A student'} sent you a message.`);
  return {ok:true};
}

async function dbResearchStudents(uid,q,userType='student'){
  const c=getSB(); if(!c||!uid) return [];
  const query=(q||'').trim();
  if(!query) return [];
  let req=c.from('profiles')
    .select('id,full_name,school,major,year,avatar_url,bio,company_name,user_type')
    .neq('id',uid)
    .or(`full_name.ilike.%${query}%,major.ilike.%${query}%,school.ilike.%${query}%,company_name.ilike.%${query}%`)
    .limit(10);
  // Students only search other students; companies can search everyone
  if(userType==='student') req=req.eq('user_type','student');
  const {data,error}=await req;
  if(error) return [];
  return data||[];
}

async function dbMarkDMsRead(uid,otherId){
  const c=getSB(); if(!c) return;
  const tid=dmThreadId(uid,otherId);
  await c.from('direct_messages').update({read:true}).eq('thread_id',tid).eq('recipient_id',uid).eq('read',false);
}
async function dbDeleteDM(msgId,uid){
  const c=getSB(); if(!c||!msgId) return;
  await c.from('direct_messages').update({text:'[deleted]',attachment_url:null,attachment_name:null,attachment_type:null,attachment_size:null,message_kind:'deleted'}).eq('id',msgId).eq('sender_id',uid);
}
async function dbDeleteDMConversation(uid,otherId){
  const c=getSB(); if(!c) return;
  const tid=dmThreadId(uid,otherId);
  await c.from('direct_messages').delete().eq('thread_id',tid);
}
async function dbDeleteAppMsg(msgId,uid){
  const c=getSB(); if(!c||!msgId) return;
  await c.from('messages').update({text:'[deleted]',attachment_url:null,attachment_name:null,attachment_type:null,attachment_size:null,message_kind:'deleted'}).eq('id',msgId).eq('sender_id',uid);
}
async function dbDeleteAppConversation(appId,uid){
  const c=getSB(); if(!c||!appId) return;
  await c.from('messages').delete().eq('application_id',appId);
}
async function dbReactMsg(table,msgId,uid,emoji){
  const c=getSB(); if(!c||!msgId) return;
  // Store reactions as JSON in a reactions column; graceful fallback if column missing
  try {
    const {data}=await c.from(table).select('reactions').eq('id',msgId).single();
    const reactions=(data?.reactions)||{};
    if(!reactions[emoji]) reactions[emoji]=[];
    const idx=reactions[emoji].indexOf(uid);
    if(idx>-1) reactions[emoji].splice(idx,1); else reactions[emoji].push(uid);
    if(reactions[emoji].length===0) delete reactions[emoji];
    await c.from(table).update({reactions}).eq('id',msgId);
    return reactions;
  } catch(e){ return null; }
}

async function dbGetInternships(){
  const c=getSB(); if(!c) return [];
  // Try joined query first (requires FK job_listings.company_id → profiles)
  const {data,error}=await c.from('job_listings')
    .select('*, company:company_id(company_name,avatar_url,bio,industry,website,company_size,location)')
    .eq('status','active').order('created_at',{ascending:false});
  let jobs=[];
  if(!error && data && data.length>=0){
    jobs=data.map(j=>_mapJob(j,j.company));
  } else {
    console.warn('[ALUHub] job_listings join failed (FK likely missing), using fallback.',error?.message);
    const {data:plain,error:e2}=await c.from('job_listings')
      .select('*').eq('status','active').order('created_at',{ascending:false});
    if(e2||!plain) return [];
    const ids=[...new Set(plain.map(j=>j.company_id).filter(Boolean))];
    let coMap={};
    if(ids.length){
      const {data:profiles}=await c.from('profiles')
        .select('id,company_name,avatar_url,bio,industry,website,company_size,location').in('id',ids);
      (profiles||[]).forEach(p=>{coMap[p.id]=p;});
    }
    jobs=plain.map(j=>_mapJob(j,coMap[j.company_id]||null));
  }
  // Year-based filtering: hide jobs whose allowed_years restricts them
  // out of the current student's year. Companies / schools / unset-year
  // students see everything.
  const u=window.__aluHubUser;
  const userType=u?.userType;
  const userYear=u?.profile?.year||null;
  if(userType==='student'&&userYear){
    jobs=jobs.filter(j=>{
      const r=j.allowed_years;
      return !Array.isArray(r)||r.length===0||r.includes(userYear);
    });
  }
  // Fetch application counts for all jobs
  if(jobs.length){
    const jobIds=jobs.map(j=>j.id);
    const {data:appCounts}=await c.from('applications').select('job_id').in('job_id',jobIds);
    const countMap={};
    (appCounts||[]).forEach(a=>{countMap[a.job_id]=(countMap[a.job_id]||0)+1;});
    jobs=jobs.map(j=>({...j,applicantCount:countMap[j.id]||0}));
  }
  return jobs;
}
function _mapJob(j,co){
  // When a school posts a job FOR an external employer, the displayed
  // company name + logo come from `original_company_*` (set by the
  // school in the post form). For the school's own roles, fall back to
  // the school's profile. For company-posted jobs, the company profile.
  const isSchoolPost = j.posted_by_role === 'school';
  const hasOriginalCo = isSchoolPost && j.original_company_name;
  const displayCo     = hasOriginalCo ? j.original_company_name        : (co?.company_name || co?.full_name || 'Company');
  const displayAvatar = hasOriginalCo ? j.original_company_logo_url    : (co?.avatar_url || null);
  return {
    id:j.id,
    co:displayCo,
    company_name:displayCo,
    avatar_url:displayAvatar,
    company_desc:co?.bio||'',
    industry:co?.industry||'',
    company_website:co?.website||'',
    company_size:co?.company_size||'',
    company_location:co?.location||'',
    logo:'',bg:'#0A1828',
    title:j.title||'Internship',
    listing_type:j.listing_type||'',
    type:j.type||'General',
    tags:j.tags||[],
    desc:j.description||'',
    description:j.description||'',
    responsibilities:j.responsibilities||'',
    requirements:j.requirements||'',
    dur:j.duration||'',pay:j.pay||'',
    loc:j.location||'Kigali',
    dead:j.deadline?new Date(j.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Open',
    match:null,
    cat:(j.type||'other').toLowerCase(),
    company_id:j.company_id,
    // ── NEW: dual-mode apply + school posting + year restrictions ──
    apply_url:j.apply_url||null,
    posted_by_role:j.posted_by_role||'company',
    school_name:isSchoolPost ? (co?.company_name || co?.full_name || 'School') : null,
    school_avatar_url:isSchoolPost ? (co?.avatar_url || null) : null,
    original_company_name:j.original_company_name||null,
    original_company_logo_url:j.original_company_logo_url||null,
    allowed_years:Array.isArray(j.allowed_years) ? j.allowed_years : [],
  };
}

async function dbGetProfileLite(uid){
  const c=getSB(); if(!c||!uid) return null;
  const {data}=await c.from('profiles').select('cv_filename,cv_uploaded_at,cv_last_matched_at').eq('id',uid).single();
  return data||null;
}

async function dbSetCvMatchedAt(uid,isoTime){
  const c=getSB(); if(!c||!uid) return;
  await c.from('profiles').update({cv_last_matched_at:isoTime}).eq('id',uid);
}

async function dbGetSkillsMarketplace(){
  const c=getSB(); if(!c) return [];
  const {data}=await c.from('student_skills').select('id,student_id,skill_name,level,years_experience,price,category,description,availability,rating,sessions,student:student_id(id,full_name,school)').order('created_at',{ascending:false});
  return (data||[]).map(s=>({
    id:s.id,
    studentId:s.student_id,
    name:s.student?.full_name||'Student',
    country:s.student?.school||'ALU',
    color:'#4F46E5',
    title:s.skill_name||'Skill Session',
    desc:s.description||`${s.level||'intermediate'} level · ${(s.years_experience||0)} years experience`,
    price:Number(s.price)||0,
    rating:Number(s.rating)||4,
    sessions:Number(s.sessions)||0,
    cat:(s.category||'tech').toLowerCase(),
    level:s.level||'intermediate',
    availability:s.availability||'',
  }));
}

async function dbGetResources(){
  const c=getSB(); if(!c) return [];
  const {data}=await c.from('resources').select('*').order('created_at',{ascending:false});
  return data||[];
}

async function dbCreateResource(uid,payload){
  const c=getSB(); if(!c||!uid) throw new Error('Not signed in');
  const {error}=await c.from('resources').insert([{author_id:uid,...payload}]);
  if(error) throw error;
}

async function dbIncrementResourceSales(resourceId,currentSales){
  const c=getSB(); if(!c||!resourceId) return;
  await c.from('resources').update({sales:(currentSales||0)+1}).eq('id',resourceId);
}

// ── FOLLOW HELPERS ────────────────────────────────────
async function dbFollowCompany(studentId, companyId){
  const c=getSB(); if(!c||!studentId||!companyId) return;
  try {
    await c.from('company_follows').insert({student_id:studentId,company_id:companyId});
  } catch(e){ console.warn('dbFollowCompany:',e.message); }
}
async function dbUnfollowCompany(studentId, companyId){
  const c=getSB(); if(!c||!studentId||!companyId) return;
  await c.from('company_follows').delete().eq('student_id',studentId).eq('company_id',companyId);
}
async function dbGetFollowedCompanies(studentId){
  const c=getSB(); if(!c||!studentId) return [];
  const {data}=await c.from('company_follows').select('company_id').eq('student_id',studentId);
  return (data||[]).map(r=>r.company_id);
}
async function dbGetFollowerCount(companyId){
  const c=getSB(); if(!c||!companyId) return 0;
  const {count}=await c.from('company_follows').select('*',{count:'exact',head:true}).eq('company_id',companyId);
  return count||0;
}
async function dbGetFollowersList(companyId){
  const c=getSB(); if(!c||!companyId) return [];
  const {data}=await c.from('company_follows')
    .select('student_id, created_at, student:student_id(id,full_name,school,year,avatar_url,major)')
    .eq('company_id',companyId)
    .order('created_at',{ascending:false});
  return (data||[]).map(r=>({
    id:r.student_id,
    name:r.student?.full_name||'Student',
    school:r.student?.school||'ALU',
    year:r.student?.year||'',
    major:r.student?.major||'',
    avatar_url:r.student?.avatar_url||null,
    followedAt:r.created_at,
  }));
}
async function dbSubmitCompanyRating(studentId, companyId, score, comment){
  const c=getSB(); if(!c||!studentId||!companyId) return;
  await c.from('company_ratings').upsert({
    student_id:studentId, company_id:companyId, score, comment,
    updated_at:new Date().toISOString(),
  },{onConflict:'student_id,company_id'});
}
async function dbGetCompanyRatings(companyId){
  const c=getSB(); if(!c||!companyId) return [];
  try {
    const {data}=await c.from('company_ratings')
      .select('*, student:student_id(id,full_name,school,year,avatar_url)')
      .eq('company_id',companyId)
      .order('updated_at',{ascending:false});
    return data||[];
  } catch(e){ return []; }
}
async function dbGetMyCompanyRating(studentId, companyId){
  const c=getSB(); if(!c||!studentId||!companyId) return null;
  try {
    const {data}=await c.from('company_ratings').select('*').eq('student_id',studentId).eq('company_id',companyId).single();
    return data||null;
  } catch(e){ return null; }
}

async function dbNotifyFollowers(companyId, companyName, listingTitle, listingType){
  const c=getSB(); if(!c||!companyId) return;
  try {
    const {data:followers}=await c.from('company_follows').select('student_id').eq('company_id',companyId);
    if(!followers||!followers.length) return;
    const notifs=followers.map(f=>({
      user_id:f.student_id,
      type:'followed_company_listing',
      title:`New ${listingType||'listing'} from ${companyName}`,
      body:`${companyName} just posted: "${listingTitle}". Apply before the deadline!`,
      read:false,
      ref_id:companyId,
    }));
    await c.from('notifications').insert(notifs);
  } catch(e){ console.warn('dbNotifyFollowers:',e.message); }
}

async function dbGetCompanies(){
  const c=getSB(); if(!c) return [];
  // Full query — requires migration in SUPABASE_RLS_FIX.sql to add
  // tagline/location/company_size/linkedin/twitter to profiles table.
  // Falls back to minimal query if those columns don't exist yet (400).
  let data=null;
  const full=await c.from('profiles')
    .select('id,company_name,industry,plan,bio,created_at,website,avatar_url,tagline,location,company_size,linkedin,twitter')
    .eq('user_type','company').order('created_at',{ascending:false});
  if(full.error&&full.error.code==='42703'){
    // column doesn't exist — fall back to core columns only
    const fallback=await c.from('profiles')
      .select('id,company_name,industry,plan,bio,created_at,website,avatar_url')
      .eq('user_type','company').order('created_at',{ascending:false});
    data=fallback.data;
    console.warn('[ALUHub] dbGetCompanies: some profile columns missing. Run SUPABASE_RLS_FIX.sql migration.');
  } else {
    data=full.data;
  }
  // Fetch active job counts per company
  const jobCountMap={};
  try{
    const{data:jobRows}=await c.from('job_listings').select('company_id').eq('status','active');
    (jobRows||[]).forEach(j=>{jobCountMap[j.company_id]=(jobCountMap[j.company_id]||0)+1;});
  }catch(e){}
  return (data||[]).map(co=>({
    id:co.id,
    name:co.company_name||'Company',
    logo:'',
    bg:'#0A1828',
    type:co.industry||'Organization',
    tier:({premium:'Premium',standard:'Standard',basic:'Basic'})[co.plan]||'Basic',
    desc:co.bio||'',
    website:co.website||'',
    avatar_url:co.avatar_url||null,
    tagline:co.tagline||'',
    location:co.location||'',
    size:co.company_size||'',
    linkedin:co.linkedin||'',
    twitter:co.twitter||'',
    jobs:(jobCountMap&&jobCountMap[co.id])||0,
    since:co.created_at?new Date(co.created_at).toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'N/A',
  }));
}

async function dbGetGuide(){
  const c=getSB(); if(!c) return [];
  const {data}=await c.from('survival_guide').select('*').order('created_at',{ascending:true});
  return data||[];
}

// ── CRUD DB HELPERS ──────────────────────────────────
async function dbDeleteSkill(skillId,uid){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('student_skills').delete().eq('id',skillId).eq('student_id',uid);
  if(error) throw error;
}
async function dbUpdateSkill(skillId,uid,data){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('student_skills').update(data).eq('id',skillId).eq('student_id',uid);
  if(error) throw error;
}
async function dbDeleteResource(resourceId,uid){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('resources').delete().eq('id',resourceId).eq('author_id',uid);
  if(error) throw error;
}
async function dbUpdateResource(resourceId,uid,data){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('resources').update(data).eq('id',resourceId).eq('author_id',uid);
  if(error) throw error;
}
async function dbDeleteHousingRequest(reqId,uid){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('housing_requests').update({status:'deleted'}).eq('id',reqId).eq('user_id',uid);
  if(error) throw error;
}
async function dbWithdrawApplication(appId,uid){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('applications').delete().eq('id',appId).eq('student_id',uid);
  if(error) throw error;
}
async function dbDeleteJob(jobId,uid){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('job_listings').update({status:'closed'}).eq('id',jobId).eq('company_id',uid);
  if(error) throw error;
}
async function dbUpdateJob(jobId,uid,data){
  const c=getSB(); if(!c) return;
  const{error}=await c.from('job_listings').update(data).eq('id',jobId).eq('company_id',uid);
  if(error) throw error;
}
async function dbGetMyJobListings(uid){
  const c=getSB(); if(!c||!uid) return [];
  const{data}=await c.from('job_listings').select('*').eq('company_id',uid).in('status',['active','draft']).order('created_at',{ascending:false});
  return data||[];
}

// ── PAYMENT & RATING DB HELPERS ──────────────────────
const RWF_RATE=1400; // ~1 USD = 1400 RWF (update as needed)
function usdToRwf(usd){return Math.round((usd||0)*RWF_RATE);}
function fmtRwf(rwf){return 'RWF '+Number(rwf).toLocaleString();}

async function dbCreatePayment(uid,payload){
  const c=getSB(); if(!c||!uid) throw new Error('Not signed in');
  const{data,error}=await c.from('payments').insert({
    payer_id:uid,
    ...payload,
    status:'pending',
    created_at:new Date().toISOString(),
  }).select().single();
  if(error) throw error;
  return data;
}
async function dbUpdatePaymentStatus(paymentId,status,momoRef){
  const c=getSB(); if(!c) return;
  await c.from('payments').update({status,momo_ref:momoRef||null}).eq('id',paymentId);
}
async function dbGetMyPayments(uid){
  const c=getSB(); if(!c||!uid) return [];
  const{data}=await c.from('payments').select('*').eq('payer_id',uid).order('created_at',{ascending:false}).limit(50);
  return data||[];
}
async function dbSubmitRating(uid,targetId,refId,refType,score,comment){
  const c=getSB(); if(!c||!uid) return;
  await c.from('ratings').upsert({rater_id:uid,target_id:targetId,ref_id:refId,ref_type:refType,score,comment},{onConflict:'rater_id,ref_id,ref_type'});
  // Update avg rating on student_skills if skill rating
  if(refType==='skill'){
    const{data}=await c.from('ratings').select('score').eq('ref_id',refId).eq('ref_type','skill');
    if(data&&data.length){
      const avg=Math.round(data.reduce((s,r)=>s+r.score,0)/data.length*10)/10;
      await c.from('student_skills').update({rating:avg}).eq('id',refId);
    }
  }
}

async function dbIncrementSkillSessions(skillId){
  const c=getSB(); if(!c||!skillId) return;
  // Fetch current then update (Supabase doesn't support field increment in JS SDK simply)
  const{data}=await c.from('student_skills').select('sessions').eq('id',skillId).single();
  const current=Number(data?.sessions||0);
  await c.from('student_skills').update({sessions:current+1}).eq('id',skillId);
}
async function dbGetCompanyStats(uid){
  const c=getSB(); if(!c||!uid) return {};
  const[jobs,apps]=await Promise.all([
    c.from('job_listings').select('id,title,status,created_at').eq('company_id',uid),
    c.from('applications').select('id,status,created_at,job_id').in('job_id',(await c.from('job_listings').select('id').eq('company_id',uid)).data?.map(j=>j.id)||[]),
  ]);
  const jobList=jobs.data||[];
  const appList=apps.data||[];
  return{jobCount:jobList.filter(j=>j.status==='active').length,totalApps:appList.length,pending:appList.filter(a=>a.status==='pending').length,shortlisted:appList.filter(a=>a.status==='shortlisted').length,hired:appList.filter(a=>a.status==='hired').length,jobList,appList};
}

// MTN MoMo Rwanda — production-ready request initiator
// Calls your Supabase Edge Function `momo-pay` which holds the API key securely
async function initiateMoMoPayment(phone,amountRwf,paymentId,provider){
  const c=getSB(); if(!c) throw new Error('DB unavailable');
  const{data,error}=await c.functions.invoke('momo-pay',{
    body:{phone,amount:amountRwf,currency:'RWF',paymentId,provider,externalId:paymentId},
  });
  if(error) throw error;
  return data; // {referenceId, status}
}
async function checkMoMoStatus(referenceId,provider){
  const c=getSB(); if(!c) return null;
  const{data}=await c.functions.invoke('momo-status',{body:{referenceId,provider}});
  return data; // {status:'SUCCESSFUL'|'FAILED'|'PENDING'}
}

// ── STATUS BADGE ──────────────────────────────────────
const S_META={
  pending:    {label:'Pending',      color:'#F59E0B',bg:'rgba(245,158,11,.12)',   icon:'schedule'},
  reviewed:   {label:'Reviewed',     color:'#3B82F6',bg:'rgba(59,130,246,.12)',   icon:'visibility'},
  shortlisted:{label:'Shortlisted',  color:'#10B981',bg:'rgba(16,185,129,.12)',   icon:'star'},
  hired:      {label:'Accepted ✓',   color:'#7D52AD',bg:'rgba(125,82,173,.13)',   icon:'workspace_premium'},
  rejected:   {label:'Not Selected', color:'#6B7280',bg:'rgba(107,114,128,.1)',   icon:'cancel'},
};
function StatusBadge({status}){
  const m=S_META[status]||S_META.pending;
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:11.5,fontWeight:600,color:m.color,background:m.bg,whiteSpace:'nowrap'}}>
      <span className="material-symbols-rounded" style={{fontSize:12}}>{m.icon}</span>
      {m.label}
    </span>
  );
}

// ── COMPANY RESEARCH PANEL (inline — no page navigation) ─
function CompanyResearchPanel({app,onClose}){
  const job=app.job||{};
  const coName=job.co||job.company_name||'Company';
  const [research,setResearch]=useState(null);
  const [loading,setLoading]=useState(false);
  const initials=(coName).slice(0,2).toUpperCase();

  async function runResearch(){
    setLoading(true);
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',max_tokens:1000,
          system:'You are a career research assistant. Respond ONLY with a valid JSON object — no markdown, no backticks, no preamble.',
          messages:[{role:'user',content:`Research this company for a student considering applying or who has already applied. Company: "${coName}". Industry: "${job.tags?.join(', ')||''}". Location: "${job.loc||''}". Return JSON: {"overview":"2-3 sentence company summary","culture":"what it's like to work there","opportunity":"why it's good for students/interns","redflags":"any concerns to be aware of (or null if none)","questions":["3 smart questions to ask in an interview"],"verdict":"one sentence bottom line"}`}]
        })
      });
      const data=await resp.json();
      const text=data.content?.find(b=>b.type==='text')?.text||'{}';
      try{ setResearch(JSON.parse(text.replace(/```json|```/g,'').trim())); }
      catch{ setResearch({overview:text,culture:null,opportunity:null,redflags:null,questions:[],verdict:null}); }
    }catch(e){ setResearch({overview:'Research unavailable — check connection.',culture:null,opportunity:null,redflags:null,questions:[],verdict:null}); }
    setLoading(false);
  }

  useEffect(()=>{ runResearch(); },[]);

  return(
    <div style={{position:'fixed',inset:0,zIndex:1100,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.45)'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',maxWidth:600,maxHeight:'88vh',overflowY:'auto',background:'var(--bg2)',borderRadius:'20px 20px 0 0',padding:0,boxShadow:'0 -8px 40px rgba(0,0,0,.25)'}}>
        {/* Handle bar */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 0'}}><div style={{width:40,height:4,borderRadius:2,background:'var(--border2)'}}/></div>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px 14px',borderBottom:'1px solid var(--border)'}}>
          <div style={{width:52,height:52,borderRadius:12,flexShrink:0,overflow:'hidden',border:'1.5px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {job.avatar_url
              ?<img src={job.avatar_url} alt={coName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              :<div style={{width:'100%',height:'100%',background:job.bg||'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{initials}</div>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,color:'var(--text)',letterSpacing:'-.02em'}}>{coName}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginTop:2,display:'flex',alignItems:'center',gap:5}}>
              <span className="material-symbols-rounded" style={{fontSize:13}}>work_outline</span>
              {job.title||'Position'}
              {job.loc&&<><span style={{opacity:.4}}>·</span><span className="material-symbols-rounded" style={{fontSize:13}}>location_on</span>{job.loc}</>}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--accent)',background:'rgba(79,70,229,.1)',padding:'3px 8px',borderRadius:20,border:'1px solid rgba(79,70,229,.2)'}}>AI Research</span>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,display:'flex',alignItems:'center',borderRadius:6}}>
              <span className="material-symbols-rounded" style={{fontSize:18}}>close</span>
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{padding:'18px 20px 32px'}}>
          {loading?(
            <div style={{textAlign:'center',padding:'40px 0'}}>
              <div style={{width:36,height:36,borderRadius:'50%',border:'3px solid var(--border)',borderTopColor:'var(--accent)',margin:'0 auto 14px',animation:'spin 0.8s linear infinite'}}/>
              <div style={{fontSize:13,color:'var(--text2)'}}>Researching {coName}…</div>
            </div>
          ):research?(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {research.overview&&(
                <div style={{background:'var(--bg3)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:.8,marginBottom:7,display:'flex',alignItems:'center',gap:5}}>
                    <span className="material-symbols-rounded" style={{fontSize:14}}>info</span>Overview
                  </div>
                  <p style={{fontSize:13.5,color:'var(--text)',lineHeight:1.65,margin:0}}>{research.overview}</p>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {research.culture&&(
                  <div style={{background:'rgba(59,130,246,.07)',borderRadius:10,padding:'12px 14px',border:'1px solid rgba(59,130,246,.15)'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#3B82F6',textTransform:'uppercase',letterSpacing:.8,marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                      <span className="material-symbols-rounded" style={{fontSize:13}}>people</span>Culture
                    </div>
                    <p style={{fontSize:12.5,color:'var(--text)',lineHeight:1.6,margin:0}}>{research.culture}</p>
                  </div>
                )}
                {research.opportunity&&(
                  <div style={{background:'rgba(16,185,129,.07)',borderRadius:10,padding:'12px 14px',border:'1px solid rgba(16,185,129,.15)'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#10B981',textTransform:'uppercase',letterSpacing:.8,marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                      <span className="material-symbols-rounded" style={{fontSize:13}}>trending_up</span>Opportunity
                    </div>
                    <p style={{fontSize:12.5,color:'var(--text)',lineHeight:1.6,margin:0}}>{research.opportunity}</p>
                  </div>
                )}
              </div>
              {research.redflags&&(
                <div style={{background:'rgba(239,68,68,.06)',borderRadius:10,padding:'12px 14px',border:'1px solid rgba(239,68,68,.15)'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#EF4444',textTransform:'uppercase',letterSpacing:.8,marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
                    <span className="material-symbols-rounded" style={{fontSize:13}}>warning</span>Things to consider
                  </div>
                  <p style={{fontSize:12.5,color:'var(--text)',lineHeight:1.6,margin:0}}>{research.redflags}</p>
                </div>
              )}
              {research.questions?.length>0&&(
                <div style={{borderRadius:10,padding:'12px 14px',border:'1px solid var(--border)',background:'var(--bg3)'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:.8,marginBottom:8,display:'flex',alignItems:'center',gap:4}}>
                    <span className="material-symbols-rounded" style={{fontSize:13}}>help_outline</span>Smart questions to ask
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {research.questions.map((q,qi)=>(
                      <div key={qi} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                        <span style={{width:18,height:18,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{qi+1}</span>
                        <p style={{fontSize:12.5,color:'var(--text)',margin:0,lineHeight:1.55}}>{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {research.verdict&&(
                <div style={{background:'linear-gradient(135deg,rgba(79,70,229,.1),rgba(16,185,129,.07))',borderRadius:10,padding:'12px 16px',border:'1px solid rgba(79,70,229,.2)',display:'flex',alignItems:'center',gap:10}}>
                  <span className="material-symbols-rounded" style={{fontSize:20,color:'var(--accent)',flexShrink:0}}>stars</span>
                  <p style={{fontSize:13,color:'var(--text)',fontWeight:600,margin:0,lineHeight:1.5}}>{research.verdict}</p>
                </div>
              )}
              <button onClick={runResearch} style={{alignSelf:'flex-start',background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px',fontSize:12,color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                <span className="material-symbols-rounded" style={{fontSize:13}}>refresh</span>Refresh research
              </button>
            </div>
          ):null}
        </div>
      </div>
    </div>
  );
}

function DocViewer({docs,app}){
  const [active,setActive]=useState(null);
  function isImage(url){return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);}
  function isPDF(url){return /\.pdf(\?|$)/i.test(url)||url.includes('application/pdf');}
  const url=active?app[active.key]:null;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {docs.map((d,i)=>{
        const docUrl=app[d.key];
        const isActive=active?.key===d.key;
        return(
          <div key={i}>
            <div
              className="sap-doc-row"
              style={{cursor:'pointer',borderColor:isActive?d.color:'var(--border)',background:isActive?d.color+'12':'var(--bg3)'}}
              onClick={()=>setActive(isActive?null:d)}
              onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor=d.color;e.currentTarget.style.background=d.color+'10';}}}
              onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg3)';}}}
            >
              <div style={{width:40,height:40,borderRadius:10,background:d.color+'18',border:`1px solid ${d.color}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span className="material-symbols-rounded" style={{fontSize:20,color:d.color,fontVariationSettings:"'FILL' 1"}}>{d.icon}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)'}}>{d.label}</div>
                <div style={{fontSize:11.5,color:'var(--text3)',marginTop:2}}>{isActive?'Click to collapse':'Click to preview inline'}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <a href={docUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:7,background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--text3)',textDecoration:'none'}}>
                  <span className="material-symbols-rounded" style={{fontSize:14}}>open_in_new</span>
                </a>
                <span className="material-symbols-rounded" style={{fontSize:18,color:d.color,transform:isActive?'rotate(180deg)':'none',transition:'transform .2s'}}>expand_more</span>
              </div>
            </div>
            {isActive&&(
              <div style={{marginTop:4,borderRadius:12,overflow:'hidden',border:`1.5px solid ${d.color}30`,background:'#000'}}>
                {isImage(docUrl)?(
                  <img src={docUrl} alt={d.label} style={{width:'100%',maxHeight:600,objectFit:'contain',display:'block',background:'#111'}}/>
                ):isPDF(docUrl)?(
                  <iframe src={docUrl} title={d.label} style={{width:'100%',height:520,border:'none',display:'block'}}/>
                ):(
                  <div style={{padding:20,textAlign:'center',color:'var(--text2)'}}>
                    <span className="material-symbols-rounded" style={{fontSize:36,color:d.color,display:'block',marginBottom:8}}>description</span>
                    <div style={{fontSize:13,marginBottom:12}}>This file type can't be previewed inline.</div>
                    <a href={docUrl} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:10,background:d.color,color:'#fff',fontWeight:700,fontSize:13,textDecoration:'none'}}>
                      <span className="material-symbols-rounded" style={{fontSize:15}}>download</span>Download / Open
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MY APPLICATIONS ───────────────────────────────────
function StudentApplicationPage({app, allApps, onBack, onWithdraw, onDelete, user}) {
  const [confirmAction, setConfirmAction] = React.useState(null); // {type:'withdraw'|'delete'}
  const [acting, setActing]               = React.useState(false);
  const [viewCompanyOpen, setViewCompanyOpen] = React.useState(false);
  const uid = user?.user?.id;

  const idx     = allApps ? allApps.findIndex(a => a.id === app.id) : -1;
  const prevApp = idx > 0 ? allApps[idx - 1] : null;
  const nextApp = idx >= 0 && idx < allApps.length - 1 ? allApps[idx + 1] : null;

  const job    = app?.job || {};
  const coName = job.co || job.company_name || 'Company';
  const initials = coName.slice(0,2).toUpperCase();

  const DOCS = [
    {key:'cv_url',             label:'CV / Resume',     icon:'description',       color:'#6366F1'},
    {key:'cover_url',          label:'Cover Letter',    icon:'mail',              color:'#0A2E5C'},
    {key:'transcript_url',     label:'Transcript',      icon:'school',            color:'#10B981'},
    {key:'recommendation_url', label:'Recommendation', icon:'verified_user',      color:'#F59E0B'},
    {key:'portfolio_url',      label:'Portfolio',       icon:'folder_open',       color:'#8B5CF6'},
    {key:'certificate_url',    label:'Certificate',     icon:'workspace_premium', color:'#EC4899'},
    {key:'id_url',             label:'ID / Passport',   icon:'badge',             color:'#3B82F6'},
  ].filter(d => app[d.key]);

  const infoRows = [
    {label:'Full Name',    val:app.applicant_name  || user?.profile?.full_name},
    {label:'Email',        val:app.applicant_email || user?.profile?.email},
    {label:'Phone',        val:app.applicant_phone},
    {label:'LinkedIn',     val:app.applicant_linkedin},
    {label:'University',   val:app.applicant_school|| user?.profile?.school},
    {label:'Year / Level', val:app.applicant_year  || user?.profile?.year},
  ].filter(r => r.val);

  const sc = S_META[app.status] || S_META.pending;

  async function handleAction(type) {
    setActing(true);
    try {
      await dbWithdrawApplication(app.id, uid);
      if (type === 'withdraw') onWithdraw(app.id);
      else                     onDelete(app.id);
    } catch(e) { toast((type==='withdraw'?'Withdraw':'Delete')+' failed — '+e.message); }
    finally { setActing(false); setConfirmAction(null); }
  }

  // Inject CSS once
  const cssId = 'sap-css';
  if (!document.getElementById(cssId)) {
    const s = document.createElement('style');
    s.id = cssId;
    s.textContent = `
      .sap-root { display:flex; flex-direction:column; min-height:100vh; background:var(--bg); }
      .sap-topbar { background:var(--card); border-bottom:1px solid var(--border); padding:0 24px; display:flex; align-items:center; gap:10px; height:60px; flex-shrink:0; position:sticky; top:0; z-index:100; box-shadow:0 2px 10px rgba(0,0,0,.07); }
      .sap-back { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:10px; background:var(--bg3); border:1px solid var(--border); font-size:13px; font-weight:600; color:var(--text2); cursor:pointer; transition:all .15s; white-space:nowrap; flex-shrink:0; }
      .sap-back:hover { border-color:var(--accent); color:var(--accent); }
      .sap-crumb { flex:1; display:flex; align-items:center; gap:6px; font-size:13px; min-width:0; overflow:hidden; }
      .sap-nav { display:flex; align-items:center; gap:6px; padding-left:10px; border-left:1px solid var(--border); flex-shrink:0; }
      .sap-layout { display:flex; flex:1; width:100%; max-width:1400px; margin:0 auto; padding:28px 28px 60px; gap:24px; align-items:flex-start; box-sizing:border-box; }
      .sap-sidebar { width:300px; flex-shrink:0; display:flex; flex-direction:column; gap:14px; position:sticky; top:70px; max-height:calc(100vh - 90px); overflow-y:auto; }
      .sap-sidebar::-webkit-scrollbar { width:0; }
      .sap-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }
      .sap-card { background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
      .sap-section-label { font-size:11px; font-weight:800; color:var(--text3); text-transform:uppercase; letter-spacing:.7px; display:flex; align-items:center; gap:6px; margin-bottom:12px; }
      .sap-doc-row { display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--bg3); border:1px solid var(--border); border-radius:11px; text-decoration:none; transition:all .15s; }
      .sap-doc-row:hover { transform:translateX(3px); }
      .sap-info-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
      .sap-info-cell { background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:10px 14px; }
      @media (max-width:860px) {
        .sap-layout { flex-direction:column; padding:16px 14px 60px; gap:16px; }
        .sap-sidebar { width:100%; position:static; max-height:none; }
        .sap-topbar { padding:0 14px; }
      }
      @media (max-width:560px) {
        .sap-info-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(s);
  }

  return (
    <div className="sap-root">

      {/* TOP BAR */}
      <div className="sap-topbar">
        <button className="sap-back" onClick={onBack}>
          <span className="material-symbols-rounded" style={{fontSize:16}}>arrow_back</span>
          <span>My Applications</span>
        </button>

        <div className="sap-crumb">
          <span className="material-symbols-rounded" style={{fontSize:14,color:'var(--text3)',flexShrink:0}}>chevron_right</span>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'5px 12px',overflow:'hidden',minWidth:0}}>
            <span style={{fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:13}}>{job.title||'Position'}</span>
            <span style={{fontSize:12,color:'var(--text3)',flexShrink:0}}>·</span>
            <span style={{fontSize:12,color:'var(--text2)',flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{coName}</span>
            <span style={{padding:'2px 10px',borderRadius:20,background:sc.bg,color:sc.color,fontSize:10.5,fontWeight:800,flexShrink:0,border:`1px solid ${sc.color}33`}}>{sc.label}</span>
          </div>
        </div>

        <div className="sap-nav">
          <span style={{fontSize:12,color:'var(--text3)'}}>{idx+1}/{allApps?.length||1}</span>
          <button onClick={()=>prevApp&&onBack('nav',prevApp)} disabled={!prevApp} style={{width:32,height:32,borderRadius:8,background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:prevApp?'pointer':'not-allowed',opacity:prevApp?1:.35,color:'var(--text2)'}}>
            <span className="material-symbols-rounded" style={{fontSize:16}}>chevron_left</span>
          </button>
          <button onClick={()=>nextApp&&onBack('nav',nextApp)} disabled={!nextApp} style={{width:32,height:32,borderRadius:8,background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:nextApp?'pointer':'not-allowed',opacity:nextApp?1:.35,color:'var(--text2)'}}>
            <span className="material-symbols-rounded" style={{fontSize:16}}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="sap-layout">

        {/* ── SIDEBAR ── */}
        <div className="sap-sidebar">

          {/* Company hero card */}
          <div className="sap-card">
            <div style={{background:'linear-gradient(145deg,#071e3d,#0A2E5C 55%,#1a4a80)',padding:'28px 20px 22px',display:'flex',flexDirection:'column',alignItems:'center',gap:10,position:'relative'}}>
              <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 70% 20%,rgba(255,255,255,.07),transparent 60%)',pointerEvents:'none'}}/>
              <div style={{width:70,height:70,borderRadius:16,flexShrink:0,overflow:'hidden',border:'2.5px solid rgba(255,255,255,.3)',background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 28px rgba(0,0,0,.35)',zIndex:1}}>
                {job.avatar_url
                  ? <img src={job.avatar_url} alt={coName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <div style={{width:'100%',height:'100%',background:'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{initials}</div>
                }
              </div>
              <div style={{textAlign:'center',zIndex:1}}>
                <div style={{fontSize:16,fontWeight:800,color:'#fff',letterSpacing:'-.02em',fontFamily:"'Plus Jakarta Sans',sans-serif",textShadow:'0 1px 6px rgba(0,0,0,.25)'}}>{coName}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.65)',marginTop:3}}>{job.title||'Position'}{job.listing_type&&` · ${job.listing_type}`}</div>
              </div>
              <span style={{zIndex:1,padding:'4px 14px',borderRadius:20,background:'rgba(0,0,0,.28)',color:sc.color,fontSize:11.5,fontWeight:800,border:`1.5px solid ${sc.color}55`,backdropFilter:'blur(8px)',display:'inline-flex',alignItems:'center',gap:6}}>
                <span className="material-symbols-rounded" style={{fontSize:12,fontVariationSettings:"'FILL' 1"}}>{sc.icon||'schedule'}</span>
                {sc.label}
              </span>
            </div>

            {/* Job meta */}
            <div style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:10}}>
              {[
                {icon:'calendar_today', label:'Applied',   val:new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})},
                {icon:'location_on',   label:'Location',   val:job.loc},
                {icon:'payments',      label:'Pay',        val:job.pay},
                {icon:'work_outline',  label:'Type',       val:job.listing_type},
              ].filter(r=>r.val).map((r,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:28,height:28,borderRadius:7,background:'rgba(10,46,92,.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span className="material-symbols-rounded" style={{fontSize:14,color:'var(--accent)'}}>{r.icon}</span>
                  </div>
                  <div>
                    <div style={{fontSize:9.5,color:'var(--text3)',fontWeight:800,textTransform:'uppercase',letterSpacing:.5}}>{r.label}</div>
                    <div style={{fontSize:12.5,color:'var(--text)',fontWeight:600,marginTop:1}}>{r.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status insight */}
          <div className="sap-card" style={{padding:'14px 18px'}}>
            <div className="sap-section-label">
              <span className="material-symbols-rounded" style={{fontSize:14,color:sc.color}}>info</span>
              Application Status
            </div>
            <div style={{padding:'12px 14px',borderRadius:11,background:sc.bg||'var(--bg3)',border:`1px solid ${sc.color}33`,display:'flex',alignItems:'center',gap:10}}>
              <span className="material-symbols-rounded" style={{fontSize:22,color:sc.color,fontVariationSettings:"'FILL' 1"}}>{sc.icon||'schedule'}</span>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:sc.color}}>{sc.label}</div>
                <div style={{fontSize:11.5,color:'var(--text3)',marginTop:2,lineHeight:1.4}}>
                  {app.status==='pending'&&'Your application was submitted and is awaiting review.'}
                  {app.status==='reviewed'&&'The company has reviewed your application.'}
                  {app.status==='shortlisted'&&'🎉 Great news — you\'ve been shortlisted!'}
                  {app.status==='hired'&&'🏆 Congratulations — you\'ve been accepted!'}
                  {app.status==='rejected'&&'This application was not selected this time.'}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={()=>setViewCompanyOpen(true)} className="btn btn-ghost" style={{width:'100%',justifyContent:'center',gap:7,fontSize:13,padding:'11px 0',borderRadius:11,border:'1px solid var(--border)'}}>
              <span className="material-symbols-rounded" style={{fontSize:16}}>business</span>
              View Company Profile
            </button>
            {(app.status==='pending'||app.status==='reviewed'||app.status==='shortlisted')&&(
              <button onClick={()=>setConfirmAction({type:'withdraw'})} className="btn btn-ghost" style={{width:'100%',justifyContent:'center',gap:7,fontSize:13,padding:'11px 0',borderRadius:11,border:'1.5px solid rgba(245,158,11,.35)',color:'#F59E0B',background:'rgba(245,158,11,.06)'}}>
                <span className="material-symbols-rounded" style={{fontSize:16}}>undo</span>
                Withdraw Application
              </button>
            )}
            {(app.status==='rejected'||app.status==='hired'||app.status==='withdrawn')&&(
              <button onClick={()=>setConfirmAction({type:'delete'})} className="btn btn-ghost" style={{width:'100%',justifyContent:'center',gap:7,fontSize:13,padding:'11px 0',borderRadius:11,border:'1.5px solid rgba(239,68,68,.3)',color:'#EF4444',background:'rgba(239,68,68,.05)'}}>
                <span className="material-symbols-rounded" style={{fontSize:16}}>delete_outline</span>
                Remove from History
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="sap-main">

          {/* Status banners */}
          {app.status==='shortlisted'&&(
            <div style={{padding:'14px 18px',borderRadius:14,background:'rgba(16,185,129,.08)',border:'1.5px solid rgba(16,185,129,.25)',display:'flex',alignItems:'center',gap:12}}>
              <span className="material-symbols-rounded" style={{fontSize:28,color:'#10B981',fontVariationSettings:"'FILL' 1",flexShrink:0}}>star</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#10B981'}}>You've been shortlisted!</div>
                <div style={{fontSize:12.5,color:'var(--text2)',marginTop:2}}>The company is interested in your profile. Be ready — they may reach out soon.</div>
              </div>
            </div>
          )}
          {app.status==='hired'&&(
            <div style={{padding:'14px 18px',borderRadius:14,background:'rgba(125,82,173,.08)',border:'1.5px solid rgba(125,82,173,.3)',display:'flex',alignItems:'center',gap:12}}>
              <span className="material-symbols-rounded" style={{fontSize:28,color:'#7D52AD',fontVariationSettings:"'FILL' 1",flexShrink:0}}>workspace_premium</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#7D52AD'}}>Congratulations — you\'ve been accepted!</div>
                <div style={{fontSize:12.5,color:'var(--text2)',marginTop:2}}>You\'ve officially been selected for {job.title||'this position'} at {coName}.</div>
              </div>
            </div>
          )}

          {/* Cover note */}
          {app.cover_note&&(
            <div className="sap-card" style={{padding:'20px 22px'}}>
              <div className="sap-section-label">
                <span className="material-symbols-rounded" style={{fontSize:14,color:'var(--accent)'}}>edit_note</span>
                Your Cover Note
              </div>
              <div style={{background:'linear-gradient(135deg,rgba(79,70,229,.04),rgba(99,102,241,.02))',border:'1px solid rgba(79,70,229,.15)',borderLeft:'3.5px solid var(--accent)',borderRadius:'0 10px 10px 0',padding:'16px 18px',fontSize:14,color:'var(--text)',lineHeight:1.7,whiteSpace:'pre-wrap',fontStyle:'italic'}}>
                {app.cover_note}
              </div>
            </div>
          )}

          {/* Personal info submitted */}
          {infoRows.length>0&&(
            <div className="sap-card" style={{padding:'20px 22px'}}>
              <div className="sap-section-label">
                <span className="material-symbols-rounded" style={{fontSize:14,color:'#3B82F6'}}>person</span>
                Information You Submitted
              </div>
              <div className="sap-info-grid">
                {infoRows.map((r,i)=>(
                  <div key={i} className="sap-info-cell" style={{gridColumn:(r.label==='Email'||r.label==='LinkedIn')?'1/-1':'auto'}}>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.4,marginBottom:4}}>{r.label}</div>
                    <div style={{fontSize:13.5,color:'var(--text)',fontWeight:600,wordBreak:'break-word'}}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {DOCS.length>0&&(
            <div className="sap-card" style={{padding:'20px 22px'}}>
              <div className="sap-section-label">
                <span className="material-symbols-rounded" style={{fontSize:14,color:'#10B981'}}>folder_open</span>
                Documents Submitted ({DOCS.length})
              </div>
              <DocViewer docs={DOCS} app={app}/>
            </div>
          )}

          {!app.cover_note&&DOCS.length===0&&infoRows.length===0&&(
            <div className="sap-card" style={{textAlign:'center',padding:48}}>
              <span className="material-symbols-rounded" style={{fontSize:44,color:'var(--text3)',display:'block',marginBottom:12}}>inbox</span>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text2)',marginBottom:4}}>No extra details</div>
              <div style={{fontSize:13,color:'var(--text3)'}}>No cover note or documents were attached to this application.</div>
            </div>
          )}
        </div>
      </div>

      {/* Company Profile modal */}
      {viewCompanyOpen&&<CompanyProfileModal companyId={app.job?.company_id||app.company_id} onClose={()=>setViewCompanyOpen(false)}/>}

      {/* Confirm modal */}
      {confirmAction&&(
        <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'var(--card)',borderRadius:18,width:'100%',maxWidth:400,padding:'28px 24px',boxShadow:'0 24px 80px rgba(0,0,0,.4)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:18,fontWeight:800,color:'var(--text)',marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {confirmAction.type==='withdraw'?'Withdraw Application?':'Remove from History?'}
            </div>
            <div style={{fontSize:13.5,color:'var(--text2)',lineHeight:1.6,marginBottom:24}}>
              {confirmAction.type==='withdraw'
                ?`This will withdraw your application for "${job.title||'this position'}" at ${coName}. The company will no longer see it.`
                :`This will permanently remove this application record from your history.`
              }
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setConfirmAction(null)} className="btn btn-ghost" style={{flex:1,justifyContent:'center',padding:'11px 0',borderRadius:11}}>Cancel</button>
              <button onClick={()=>handleAction(confirmAction.type)} disabled={acting}
                style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'11px 0',borderRadius:11,background:confirmAction.type==='withdraw'?'rgba(245,158,11,.15)':'rgba(239,68,68,.12)',border:`1.5px solid ${confirmAction.type==='withdraw'?'rgba(245,158,11,.4)':'rgba(239,68,68,.35)'}`,color:confirmAction.type==='withdraw'?'#F59E0B':'#EF4444',fontSize:13.5,fontWeight:700,cursor:'pointer'}}>
                <span className="material-symbols-rounded" style={{fontSize:16}}>{confirmAction.type==='withdraw'?'undo':'delete_outline'}</span>
                {acting?'Processing…':confirmAction.type==='withdraw'?'Yes, Withdraw':'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyApplications({user,onMessage}){
  const [apps,setApps]=useState(null);
  const [ratingApp,setRatingApp]=useState(null);
  const [viewApp,setViewApp]=useState(null);
  const [viewCompanyId,setViewCompanyId]=useState(null);
  const uid=user?.user?.id;

  function handleWithdraw(appId){
    setApps(prev=>prev.filter(a=>a.id!==appId));
    setViewApp(null);
    toast('Application withdrawn');
  }
  function handleDelete(appId){
    setApps(prev=>prev.filter(a=>a.id!==appId));
    setViewApp(null);
    toast('Removed from history');
  }

  useEffect(()=>{
    dbGetMyApps(uid).then(setApps);
    const c=getSB();
    if(!c||!uid) return;
    const ch=c.channel('my-apps-'+uid)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'applications',filter:'student_id=eq.'+uid},payload=>{
        setApps(prev=>prev?.map(a=>a.id===payload.new.id?{...a,...payload.new}:a));
        const sm=S_META[payload.new.status];
        if(payload.new.status!==payload.old?.status) toast('Status update: '+sm?.label);
      }).subscribe();
    return ()=>c.removeChannel(ch);
  },[uid]);

  if(!apps) return <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading…</div>;

  if(viewApp){
    return <StudentApplicationPage
      app={viewApp}
      allApps={apps}
      user={user}
      onBack={(mode,navApp)=>{
        if(mode==='nav'&&navApp) setViewApp(navApp);
        else setViewApp(null);
      }}
      onWithdraw={handleWithdraw}
      onDelete={handleDelete}
    />;
  }

  const counts={total:apps.length,pending:apps.filter(a=>a.status==='pending').length,shortlisted:apps.filter(a=>a.status==='shortlisted').length,reviewed:apps.filter(a=>a.status==='reviewed').length,hired:apps.filter(a=>a.status==='hired').length};

  return (
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">My Applications</div>
          <div className="page-sub">{counts.total} total · {counts.shortlisted} shortlisted · {counts.pending} pending{counts.hired>0?` · ${counts.hired} accepted`:''}</div>
        </div>
      </div>
      <div className="stats-grid anim anim-d1" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        {[
          {label:'Total',val:counts.total,icon:'folder_open',col:null},
          {label:'Pending',val:counts.pending,icon:'schedule',col:null},
          {label:'Shortlisted',val:counts.shortlisted,icon:'star',col:counts.shortlisted>0?'#10B981':null},
          {label:'Accepted',val:counts.hired,icon:'workspace_premium',col:counts.hired>0?'#7D52AD':null}
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <span className="material-symbols-rounded" style={{fontSize:22,color:s.col||'var(--accent)',marginBottom:4}}>{s.icon}</span>
            <div className="stat-val" style={s.col?{color:s.col}:{}}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      {apps.length===0?(
        <div className="card" style={{textAlign:'center',padding:48}}>
          <span className="material-symbols-rounded" style={{fontSize:48,color:'var(--text3)',display:'block',marginBottom:12}}>inbox</span>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:6}}>No applications yet</div>
          <div style={{fontSize:13,color:'var(--text2)'}}>Browse internships and apply — your applications will show here with live status updates.</div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {apps.map((app,i)=>{
            const job=app.job||{};
            const coName=job.co||job.company_name||'Company';
            const initials=coName.slice(0,2).toUpperCase();
            const isAccepted=app.status==='hired';
            const isShortlisted=app.status==='shortlisted';
            return(
              <div key={app.id} className="card anim" style={{animationDelay:i*.05+'s',padding:'16px 18px',border:isAccepted?'1.5px solid rgba(125,82,173,.35)':isShortlisted?'1.5px solid rgba(16,185,129,.25)':'1px solid var(--border)',background:isAccepted?'linear-gradient(135deg,rgba(125,82,173,.05),var(--bg2))':isShortlisted?'linear-gradient(135deg,rgba(16,185,129,.04),var(--bg2))':'var(--bg2)'}}>
                {/* Top row: logo + info + status */}
                <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                  {/* Company logo */}
                  <div style={{width:50,height:50,borderRadius:12,flexShrink:0,overflow:'hidden',border:'1.5px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
                    {job.avatar_url
                      ?<img src={job.avatar_url} alt={coName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      :<div style={{width:'100%',height:'100%',background:job.bg||'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{initials}</div>
                    }
                  </div>
                  {/* Title + meta */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap',marginBottom:4}}>
                      <div>
                        <div style={{fontSize:15,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,color:'var(--text)',letterSpacing:'-.02em',lineHeight:1.2}}>{job.title||'Position'}</div>
                        <button onClick={e=>{e.stopPropagation();setViewCompanyId(app.job?.company_id||null);}} style={{background:'none',border:'none',padding:0,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4,marginTop:3}}>
                          <span style={{fontSize:12.5,color:'var(--accent)',fontWeight:600,textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:2}}>{coName}</span>
                        </button>
                      </div>
                      <StatusBadge status={app.status}/>
                    </div>
                    {/* Meta chips */}
                    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
                      {job.loc&&(
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11.5,color:'var(--text3)',background:'var(--bg3)',padding:'3px 8px',borderRadius:20,border:'1px solid var(--border)'}}>
                          <span className="material-symbols-rounded" style={{fontSize:12}}>location_on</span>{job.loc}
                        </span>
                      )}
                      {job.pay&&(
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11.5,color:'var(--text3)',background:'var(--bg3)',padding:'3px 8px',borderRadius:20,border:'1px solid var(--border)'}}>
                          <span className="material-symbols-rounded" style={{fontSize:12}}>payments</span>{job.pay}
                        </span>
                      )}
                      <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11.5,color:'var(--text3)',background:'var(--bg3)',padding:'3px 8px',borderRadius:20,border:'1px solid var(--border)'}}>
                        <span className="material-symbols-rounded" style={{fontSize:12}}>calendar_today</span>
                        Applied {new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Cover note */}
                {app.cover_note&&<div style={{fontSize:12,color:'var(--text3)',marginTop:12,lineHeight:1.55,background:'var(--bg3)',borderRadius:8,padding:'8px 12px',fontStyle:'italic',borderLeft:'3px solid var(--border2)'}}>"{app.cover_note.slice(0,150)}{app.cover_note.length>150?'…':''}"</div>}
                {/* Status highlights */}
                {isAccepted&&(
                  <div style={{marginTop:10,padding:'8px 12px',borderRadius:10,background:'rgba(125,82,173,.1)',border:'1px solid rgba(125,82,173,.25)',display:'flex',alignItems:'center',gap:8,fontSize:12.5,color:'#7D52AD',fontWeight:700}}>
                    <span className="material-symbols-rounded" style={{fontSize:16,fontVariationSettings:"'FILL' 1"}}>workspace_premium</span>
                    You\'ve been officially accepted — congratulations!
                  </div>
                )}
                {isShortlisted&&(
                  <div style={{marginTop:10,padding:'8px 12px',borderRadius:10,background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)',display:'flex',alignItems:'center',gap:8,fontSize:12.5,color:'#10B981',fontWeight:600}}>
                    <span className="material-symbols-rounded" style={{fontSize:16,fontVariationSettings:"'FILL' 1"}}>star</span>
                    You\'ve been shortlisted — the company is interested in you!
                  </div>
                )}
                {/* Actions */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,borderTop:'1px solid var(--border)',paddingTop:10,gap:8,flexWrap:'wrap'}}>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {(app.status==='pending'||app.status==='reviewed'||app.status==='shortlisted')&&(
                      <button className="btn btn-ghost btn-sm" style={{gap:4,color:'#F59E0B',border:'1px solid rgba(245,158,11,.3)',background:'rgba(245,158,11,.05)'}}
                        onClick={()=>{if(window.confirm(`Withdraw your application for "${app.job?.title||'this position'}" at ${app.job?.co||app.job?.company_name||'Company'}?`)){
                          dbWithdrawApplication(app.id,uid).then(()=>{handleWithdraw(app.id);}).catch(e=>toast('Withdraw failed: '+e.message));
                        }}}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>undo</span>Withdraw
                      </button>
                    )}
                    {(app.status==='rejected'||app.status==='hired'||app.status==='withdrawn')&&(
                      <button className="btn btn-ghost btn-sm" style={{gap:4,color:'#EF4444',border:'1px solid rgba(239,68,68,.25)',background:'rgba(239,68,68,.04)'}}
                        onClick={()=>{if(window.confirm('Remove this application from your history?')){
                          dbWithdrawApplication(app.id,uid).then(()=>{handleDelete(app.id);}).catch(e=>toast('Delete failed: '+e.message));
                        }}}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>delete_outline</span>Remove
                      </button>
                    )}
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <button className="btn btn-ghost btn-sm" style={{gap:4,color:'var(--accent)',border:'1px solid rgba(79,70,229,.25)',background:'rgba(79,70,229,.06)'}} onClick={()=>setViewApp(app)}>
                      <span className="material-symbols-rounded" style={{fontSize:13}}>visibility</span>View
                    </button>
                    {(app.status==='shortlisted'||app.status==='reviewed'||app.status==='hired')&&(
                      <button className="btn btn-ghost btn-sm" style={{gap:4,color:'#F59E0B'}} onClick={()=>setRatingApp(app)}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>star_outline</span>Rate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ratingApp&&<RatingModal
        user={user}
        refId={ratingApp.job_id||ratingApp.id}
        refType="internship"
        targetId={ratingApp.job?.company_id||ratingApp.company_id}
        targetName={ratingApp.job?.co||ratingApp.job?.company_name||'Company'}
        label={ratingApp.job?.title||'Position'}
        onClose={()=>setRatingApp(null)}
      />}

      {/* Company profile modal */}
      {viewCompanyId&&<CompanyProfileModal companyId={viewCompanyId} onClose={()=>setViewCompanyId(null)}/>}
    </div>
  );
}

function CompanyProfileModal({companyId,onClose}){
  const [company,setCompany]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const c=getSB();if(!c||!companyId)return;
    c.from('profiles').select('*').eq('id',companyId).single().then(({data})=>{
      if(data) setCompany({
        id:data.id,name:data.company_name||'Company',
        logo:data.avatar_url,cover:data.cover_url,
        desc:data.bio||data.tagline||'Company profile',
        industry:data.industry,size:data.company_size,
        location:data.location,website:data.website,
        linkedin:data.linkedin,twitter:data.twitter,
        founded:data.founded,tagline:data.tagline,bg:'var(--bg3)',
      });
      setLoading(false);
    });
  },[companyId]);
  return(
    <div style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(0,0,0,.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',borderRadius:20,background:'var(--card)',border:'1px solid var(--border)',boxShadow:'0 32px 80px rgba(0,0,0,.4)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Company Profile</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center',width:32,height:32,borderRadius:8,background:'var(--bg3)'}}>
            <span className="material-symbols-rounded" style={{fontSize:18}}>close</span>
          </button>
        </div>
        {loading?(<div style={{padding:48,textAlign:'center',color:'var(--text3)'}}>Loading…</div>)
        :company?(<CompanyPage company={company} onBack={onClose} onApply={null} embedded={true}/>)
        :(<div style={{padding:48,textAlign:'center',color:'var(--text3)'}}>Company not found.</div>)}
      </div>
    </div>
  );
}

// ── COMPANY ANALYTICS PAGE ────────────────────────────
function CompanyAnalyticsPage({user}){
  const uid=user?.user?.id;
  const [apps,setApps]=useState(null);
  const [listings,setListings]=useState([]);
  const [followerCount,setFollowerCount]=useState(0);
  const [followerList,setFollowerList]=useState([]);
  useEffect(()=>{
    const c=getSB();if(!c||!uid)return;
    c.from('job_listings').select('*').eq('company_id',uid).then(({data})=>setListings(data||[]));
    c.from('applications').select('*').eq('company_id',uid).then(({data})=>setApps(data||[]));
    dbGetFollowerCount(uid).then(setFollowerCount);
    dbGetFollowersList(uid).then(setFollowerList);
  },[uid]);

  const loading=apps===null;
  const totalApps=apps?.length||0;
  const pending=apps?.filter(a=>a.status==='pending'||!a.status).length||0;
  const shortlisted=apps?.filter(a=>a.status==='shortlisted').length||0;
  const rejected=apps?.filter(a=>a.status==='rejected').length||0;
  const hired=apps?.filter(a=>a.status==='hired').length||0;
  const convRate=totalApps>0?Math.round((shortlisted/totalApps)*100):0;

  // Per-listing breakdown
  const listingStats=(listings||[]).map(l=>{
    const la=(apps||[]).filter(a=>a.listing_id===l.id||a.job_id===l.id);
    return{...l,appCount:la.length,shortCount:la.filter(a=>a.status==='shortlisted').length};
  }).sort((a,b)=>b.appCount-a.appCount);

  // Application trend (group by week roughly — last 6 "slots")
  const trendData=(()=>{
    if(!apps||apps.length===0) return [];
    const now=Date.now();
    const slots=6;
    const slotMs=7*24*60*60*1000;
    return Array.from({length:slots},(_,i)=>{
      const start=now-(slots-i)*slotMs;
      const end=start+slotMs;
      const count=apps.filter(a=>{
        const d=new Date(a.created_at||a.applied_at||0).getTime();
        return d>=start&&d<end;
      }).length;
      const label=new Date(start).toLocaleDateString('en',{month:'short',day:'numeric'});
      return{label,count};
    });
  })();
  const maxTrend=Math.max(1,...trendData.map(d=>d.count));

  const funnel=[
    {label:'Total Applications',count:totalApps,color:'var(--accent)'},
    {label:'Pending Review',count:pending,color:'#F59E0B'},
    {label:'Shortlisted',count:shortlisted,color:'#10B981'},
    {label:'Hired',count:hired,color:'#03893A'},
  ];

  return(
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-sub">Performance overview for your listings and applications</div>
        </div>
      </div>

      {loading?(
        <div style={{textAlign:'center',padding:'60px 0',color:'var(--text2)',fontSize:14}}>Loading analytics…</div>
      ):(
        <>
          {/* KPI Stats */}
          <div className="stats-grid anim anim-d1">
            {[
              {label:'Active Listings',val:String(listings.length),change:'Live on platform'},
              {label:'Followers',val:String(followerCount),change:followerCount>0?followerCount+' students following you':'No followers yet',neutral:followerCount===0,hot:followerCount>10},
              {label:'Total Applications',val:String(totalApps),change:totalApps===0?'No applications yet':'Across all listings'},
              {label:'Shortlist Rate',val:convRate+'%',change:convRate>0?'Of applicants shortlisted':'Shortlist to see rate',hot:convRate>30},
              {label:'Shortlisted',val:String(shortlisted),change:shortlisted>0?'Ready to message':'None yet',neutral:shortlisted===0},
            ].map((s,i)=>(
              <div key={i} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-val" style={s.hot?{color:'#10B981'}:{}}>{s.val}</div>
                <div className={`stat-change${s.neutral?' neutral':s.hot?' hot':''}`}>{s.change}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:0}} className="anim anim-d2">

            {/* Application Funnel */}
            <div className="quick-card">
              <div className="quick-title">
                <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--accent)'}}>filter_alt</span>
                Hiring Funnel
              </div>
              {totalApps===0?(
                <div style={{fontSize:13,color:'var(--text3)',padding:'16px 0',textAlign:'center'}}>Post listings and receive applications to see your funnel.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
                  {funnel.map((f,i)=>(
                    <div key={i}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:12,color:'var(--text2)'}}>{f.label}</span>
                        <span style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{f.count}</span>
                      </div>
                      <div style={{height:8,borderRadius:4,background:'var(--bg3)',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:4,background:f.color,width:totalApps>0?(f.count/totalApps*100)+'%':'0%',transition:'width .6s ease'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Application Trend */}
            <div className="quick-card">
              <div className="quick-title">
                <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--accent)'}}>trending_up</span>
                Applications (6-week trend)
              </div>
              {totalApps===0?(
                <div style={{fontSize:13,color:'var(--text3)',padding:'16px 0',textAlign:'center'}}>No applications received yet.</div>
              ):(
                <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80,marginTop:12}}>
                  {trendData.map((d,i)=>(
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <div style={{
                        width:'100%',borderRadius:'4px 4px 0 0',
                        background:d.count>0?'var(--accent)':'var(--bg3)',
                        height:d.count>0?Math.max(8,(d.count/maxTrend)*64)+'px':'8px',
                        transition:'height .5s ease',opacity:d.count>0?1:.3,
                      }}/>
                      <span style={{fontSize:9,color:'var(--text3)',textAlign:'center',lineHeight:1.1}}>{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Per-listing breakdown */}
          <div className="quick-card anim anim-d3" style={{marginTop:0}}>
            <div className="quick-title">
              <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--accent)'}}>list_alt</span>
              Listing Performance
            </div>
            {listingStats.length===0?(
              <div style={{fontSize:13,color:'var(--text3)',padding:'16px 0',textAlign:'center'}}>No listings posted yet.</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 80px',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)',marginBottom:4}}>
                  {['Role','Status','Applicants','Shortlisted'].map(h=>(
                    <span key={h} style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.04em'}}>{h}</span>
                  ))}
                </div>
                {listingStats.map((l,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 80px',gap:8,padding:'10px 0',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{l.title}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{l.type||'Internship'}</div>
                    </div>
                    <Tag type={l.status==='active'?'green':'gray'}>{l.status||'active'}</Tag>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{l.appCount}</span>
                    <span style={{fontSize:13,fontWeight:700,color:l.shortCount>0?'#10B981':'var(--text3)'}}>{l.shortCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Followers Panel */}
          <div className="quick-card anim anim-d4" style={{marginTop:0}}>
            <div className="quick-title">
              <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--accent)'}}>group</span>
              Recent Followers
            </div>
            {followerList.length===0?(
              <div style={{fontSize:13,color:'var(--text3)',padding:'16px 0',textAlign:'center'}}>No followers yet. Students who follow your company appear here.</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:0,marginTop:8}}>
                {followerList.slice(0,8).map((f,i)=>{
                  const fInit=(f.name||'S').slice(0,2).toUpperCase();
                  return(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                      <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,overflow:'hidden',background:'linear-gradient(135deg,var(--alu-navy),#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff'}}>
                        {f.avatar_url?<img src={f.avatar_url} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:fInit}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{f.name}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>{[f.school,f.year].filter(Boolean).join(' · ')}</div>
                      </div>
                    </div>
                  );
                })}
                {followerList.length>8&&(
                  <div style={{fontSize:12,color:'var(--text3)',padding:'8px 0',textAlign:'center'}}>{followerList.length-8} more followers</div>
                )}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="quick-card anim anim-d4" style={{marginTop:0}}>
            <div className="quick-title">
              <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--accent)'}}>lightbulb</span>
              Hiring Tips
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
              {[
                {icon:'edit_note',tip:'Add a detailed description to your listing — it gets 3× more applications.'},
                {icon:'schedule',tip:'Set a clear deadline. Listings with deadlines fill faster.'},
                {icon:'star',tip:'Shortlist candidates quickly — top students get multiple offers.'},
                {icon:'chat_bubble',tip:'Message shortlisted candidates within 48 hours to close faster.'},
              ].map((t,i)=>(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10}}>
                  <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--accent)',marginTop:1,flexShrink:0}}>{t.icon}</span>
                  <span style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── COMPANY APPLICATIONS DASHBOARD ────────────────────
function CompanyDashboard({user,onMessage}){
  const [apps,setApps]=useState(null);
  const [filter,setFilter]=useState('all');
  const [updating,setUpdating]=useState(null);
  const [selectedApp,setSelectedApp]=useState(null);
  const uid=user?.user?.id;

  useEffect(()=>{
    if(!uid) return;
    dbGetCoApps(uid).then(setApps);
    const c=getSB();
    if(!c) return;
    // Reload on any new application — simple polling approach is safer than filtering by joined column
    const ch=c.channel('co-apps-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'applications'},()=>{
        dbGetCoApps(uid).then(data=>{
          setApps(data);
          toast('New application received!');
        });
      }).subscribe();
    return ()=>c.removeChannel(ch);
  },[uid]);

  const [undoQueue,setUndoQueue]=React.useState({});

  async function changeStatus(appId,newStatus){
    const app=apps.find(a=>a.id===appId);
    const prevStatus=app?.status;
    setUpdating(appId);
    setApps(prev=>prev.map(a=>a.id===appId?{...a,status:newStatus}:a));
    await dbSetStatus(appId,newStatus,app?.student_id||app?.student?.id,app?.job?.title);
    setUpdating(null);
    // Show undo toast for 5s
    const tid=setTimeout(()=>setUndoQueue(q=>{const n={...q};delete n[appId];return n;}),5000);
    setUndoQueue(q=>({...q,[appId]:{prevStatus,tid}}));
    toast((S_META[newStatus]?.label||newStatus)+' — tap Undo to revert');
  }

  async function undoStatus(appId){
    const q=undoQueue[appId];
    if(!q) return;
    clearTimeout(q.tid);
    setUndoQueue(prev=>{const n={...prev};delete n[appId];return n;});
    const app=apps.find(a=>a.id===appId);
    setApps(prev=>prev.map(a=>a.id===appId?{...a,status:q.prevStatus}:a));
    await dbSetStatus(appId,q.prevStatus,app?.student_id||app?.student?.id,app?.job?.title);
    toast('Action undone');
  }

  if(!apps) return <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading…</div>;
  const counts={all:apps.length,pending:apps.filter(a=>a.status==='pending').length,reviewed:apps.filter(a=>a.status==='reviewed').length,shortlisted:apps.filter(a=>a.status==='shortlisted').length,hired:apps.filter(a=>a.status==='hired').length,rejected:apps.filter(a=>a.status==='rejected').length};
  const filtered=apps.filter(a=>filter==='all'||a.status===filter);

  // Full-page applicant view
  if(selectedApp){
    return(
      <ApplicantViewPage
        app={selectedApp}
        allApps={filtered}
        currentUid={uid}
        user={user}
        onMessage={onMessage}
        onStatusChange={(appId,newStatus)=>{
          setApps(prev=>prev.map(a=>a.id===appId?{...a,status:newStatus}:a));
          setSelectedApp(prev=>prev?.id===appId?{...prev,status:newStatus}:prev);
        }}
        onBack={(mode,navApp)=>{
          if(mode==='nav'&&navApp) setSelectedApp(navApp);
          else setSelectedApp(null);
        }}
      />
    );
  }

  return(
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Applications Received</div>
          <div className="page-sub">{counts.all} total · {counts.pending} new · {counts.shortlisted} shortlisted{counts.hired>0?` · ${counts.hired} accepted`:''}</div>
        </div>
      </div>
      <div className="stats-grid anim anim-d1">
        {[
          {label:'Total',val:counts.all,icon:'folder_open',col:null,filterVal:'all'},
          {label:'New',val:counts.pending,icon:'mark_email_unread',col:counts.pending>0?'#F59E0B':null,filterVal:'pending'},
          {label:'Shortlisted',val:counts.shortlisted,icon:'star',col:counts.shortlisted>0?'#10B981':null,filterVal:'shortlisted'},
          {label:'Accepted',val:counts.hired,icon:'workspace_premium',col:counts.hired>0?'#7D52AD':null,filterVal:'hired'},
        ].map((s,i)=>(
          <div key={i} className="stat-card" onClick={()=>setFilter(s.filterVal)} style={{cursor:'pointer',outline:filter===s.filterVal?`2px solid ${s.col||'var(--accent)'}`:undefined,transition:'all .15s'}}>
            <span className="material-symbols-rounded" style={{fontSize:22,color:s.col||'var(--accent)',marginBottom:4}}>{s.icon}</span>
            <div className="stat-val" style={s.col?{color:s.col}:{}}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="filters">
        {['all','pending','reviewed','shortlisted','hired','rejected'].map(f=>(
          <button key={f} className={`filter-chip${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
            {f==='hired'?'Accepted':f.charAt(0).toUpperCase()+f.slice(1)} ({counts[f]||0})
          </button>
        ))}
      </div>
      {filtered.length===0?(
        <div className="card" style={{textAlign:'center',padding:48}}>
          <span className="material-symbols-rounded" style={{fontSize:48,color:'var(--text3)',display:'block',marginBottom:12}}>{filter==='all'?'inbox':'filter_list'}</span>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:6}}>
            {filter==='all'?'No applications yet':'No '+filter+' applications'}
          </div>
          <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,maxWidth:320,margin:'0 auto'}}>
            {filter==='all'
              ?'Applications will appear here once students apply to your listings. Make sure you have an active listing posted.'
              :'Try a different filter above.'}
          </div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map((app,i)=>{
            const st=app.student||{};
            const job=app.job||{};
            const initials=(st.full_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
            const avatarColor=['#0A2E5C','#1a4a80','#3a7bd5','#0d3572','#071e3d'][i%5];
            return(
              <div key={app.id} className="card anim" style={{animationDelay:i*.04+'s',padding:18,cursor:'pointer',transition:'box-shadow .15s,border-color .15s'}} onClick={()=>setSelectedApp(app)} onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 20px rgba(10,46,92,.12)';e.currentTarget.style.borderColor='var(--accent)';}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor='';}}>          <div style={{fontSize:11,color:'var(--accent)',fontWeight:700,textAlign:'right',marginBottom:6,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4}}><span className="material-symbols-rounded" style={{fontSize:13}}>open_in_new</span>View full profile</div>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  {/* Avatar */}
                  <div style={{width:44,height:44,borderRadius:'50%',background:avatarColor+'20',color:avatarColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,flexShrink:0,border:`1.5px solid ${avatarColor}30`,overflow:'hidden'}}>
                    {st.avatar_url
                      ?<img src={st.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      :initials
                    }
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap',marginBottom:4}}>
                      <div>
                        <div style={{fontSize:15,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,color:'var(--text)'}}>{st.full_name||'Student'}</div>
                        <div style={{fontSize:12,color:'var(--text2)',marginTop:2,display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                          <span>{st.school||'ALU'}</span>
                          {st.major&&<><span style={{color:'var(--border2)'}}>·</span><span>{st.major}</span></>}
                          {st.year&&<><span style={{color:'var(--border2)'}}>·</span><span>Year {st.year}</span></>}
                        </div>
                      </div>
                      <StatusBadge status={app.status}/>
                    </div>

                    {/* Listing applied to */}
                    <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',background:'var(--bg3)',borderRadius:6,border:'1px solid var(--border)',fontSize:12,color:'var(--text2)',marginBottom:8}}>
                      <span className="material-symbols-rounded" style={{fontSize:13,color:'var(--accent)'}}>work_outline</span>
                      <strong style={{color:'var(--text)'}}>{job.title||'Position'}</strong>
                      {job.listing_type&&<span style={{color:'var(--text3)'}}>· {job.listing_type}</span>}
                    </div>

                    {/* Cover note */}
                    {app.cover_note&&(
                      <div style={{fontSize:12.5,color:'var(--text2)',lineHeight:1.6,background:'var(--bg3)',borderRadius:8,padding:'8px 12px',fontStyle:'italic',borderLeft:'3px solid var(--border2)'}}>
                        "{app.cover_note.slice(0,200)}{app.cover_note.length>200?'…':''}"
                      </div>
                    )}

                    {/* Uploaded documents */}
                    {[
                      {key:'cv_url',label:'CV / Resume',icon:'description'},
                      {key:'cover_url',label:'Cover Letter',icon:'mail'},
                      {key:'transcript_url',label:'Transcript',icon:'school'},
                      {key:'recommendation_url',label:'Recommendation',icon:'verified_user'},
                      {key:'portfolio_url',label:'Portfolio',icon:'folder_open'},
                      {key:'certificate_url',label:'Certificate',icon:'workspace_premium'},
                      {key:'id_url',label:'ID / Passport',icon:'badge'},
                    ].filter(d=>app[d.key]).length>0&&(
                      <div style={{marginTop:8}}>
                        <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.6,marginBottom:6}}>Documents</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {[
                            {key:'cv_url',label:'CV / Resume',icon:'description'},
                            {key:'cover_url',label:'Cover Letter',icon:'mail'},
                            {key:'transcript_url',label:'Transcript',icon:'school'},
                            {key:'recommendation_url',label:'Recommendation',icon:'verified_user'},
                            {key:'portfolio_url',label:'Portfolio',icon:'folder_open'},
                            {key:'certificate_url',label:'Certificate',icon:'workspace_premium'},
                            {key:'id_url',label:'ID / Passport',icon:'badge'},
                          ].filter(d=>app[d.key]).map(d=>(
                            <a key={d.key} href={app[d.key]} target="_blank" rel="noopener noreferrer"
                              style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:7,fontSize:12,fontWeight:600,color:'var(--accent)',textDecoration:'none',cursor:'pointer'}}
                              onMouseEnter={e=>{e.currentTarget.style.background='rgba(79,70,229,.08)';e.currentTarget.style.borderColor='var(--accent)';}}
                              onMouseLeave={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderColor='var(--border)';}}
                            >
                              <span className="material-symbols-rounded" style={{fontSize:13}}>{d.icon}</span>
                              {d.label}
                              <span className="material-symbols-rounded" style={{fontSize:11,opacity:.6}}>open_in_new</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Undo banner */}
                {undoQueue[app.id]&&(
                  <div style={{marginTop:10,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'7px 12px',borderRadius:8,background:'rgba(79,70,229,.09)',border:'1px solid rgba(79,70,229,.2)'}}>
                    <span style={{fontSize:12,color:'var(--accent)',fontWeight:600}}>Status changed — undo available for 5s</span>
                    <button onClick={()=>undoStatus(app.id)} style={{background:'var(--accent)',color:'#fff',border:'none',borderRadius:6,padding:'4px 10px',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                      <span className="material-symbols-rounded" style={{fontSize:13}}>undo</span>Undo
                    </button>
                  </div>
                )}
                {/* Footer actions */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,borderTop:'1px solid var(--border)',paddingTop:12,gap:8,flexWrap:'wrap'}}>
                  <div style={{fontSize:11.5,color:'var(--text3)'}}>
                    Applied {new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <button className="btn btn-ghost btn-sm" style={{gap:4,display:'flex',alignItems:'center'}} onClick={()=>onMessage(app)}>
                      <span className="material-symbols-rounded" style={{fontSize:13}}>chat_bubble_outline</span> Message
                    </button>
                    {app.status==='pending'&&(
                      <button className="btn btn-ghost btn-sm" style={{gap:4,display:'flex',alignItems:'center'}} disabled={updating===app.id} onClick={()=>changeStatus(app.id,'reviewed')}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>visibility</span>
                        {updating===app.id?'…':'Review'}
                      </button>
                    )}
                    {(app.status==='pending'||app.status==='reviewed')&&(
                      <button className="btn btn-primary btn-sm" style={{gap:4,display:'flex',alignItems:'center'}} disabled={updating===app.id} onClick={()=>changeStatus(app.id,'shortlisted')}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>star</span>
                        {updating===app.id?'…':'Shortlist'}
                      </button>
                    )}
                    {app.status!=='rejected'&&app.status!=='hired'&&(
                      <button className="btn btn-sm" style={{gap:4,display:'flex',alignItems:'center',background:'rgba(125,82,173,.12)',color:'#7D52AD',border:'1.5px solid rgba(125,82,173,.3)',borderRadius:8,fontWeight:700}} disabled={updating===app.id} onClick={()=>changeStatus(app.id,'hired')}>
                        <span className="material-symbols-rounded" style={{fontSize:13,fontVariationSettings:"'FILL' 1"}}>workspace_premium</span>
                        {updating===app.id?'…':'Accept / Hire'}
                      </button>
                    )}
                    {app.status!=='rejected'&&app.status!=='hired'&&(
                      <button className="btn btn-ghost btn-sm" style={{color:'#EF4444',gap:4,display:'flex',alignItems:'center'}} disabled={updating===app.id} onClick={()=>changeStatus(app.id,'rejected')}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>close</span>
                        {updating===app.id?'…':'Decline'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MESSENGER ─────────────────────────────────────────
function Messenger({user,activeApp,activeDM}){
  const myId=user?.user?.id;
  const isCompany=user?.userType==='company'||user?.userType==='school';

  // Companies / schools only have Applications tab; students have both, defaulting to DM
  const defaultTab = activeDM ? 'dm' : (isCompany ? 'apps' : 'dm');
  const [tab,setTab]=useState(defaultTab);

  // Switch to DM tab when activeDM prop arrives (students only)
  React.useEffect(()=>{ if(activeDM && !isCompany) setTab('dm'); },[activeDM?.otherId]);
  // Switch to apps tab when activeApp arrives
  React.useEffect(()=>{ if(activeApp) setTab('apps'); },[activeApp?.id]);

  return(
    <div className="messenger-shell">
      {/* Tab bar — inside the fixed shell so it\'s actually visible */}
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',flexShrink:0,background:'var(--card)'}}>
        <button
          onClick={()=>setTab('apps')}
          style={{flex:1,padding:'10px 0',background:'transparent',border:'none',borderBottom:tab==='apps'?'2px solid var(--accent)':'2px solid transparent',fontSize:13,fontWeight:tab==='apps'?700:500,color:tab==='apps'?'var(--accent)':'var(--text2)',cursor:'pointer',transition:'all .15s'}}
        >
          {isCompany ? 'Applications' : 'Application Messages'}
        </button>
        {!isCompany&&(
          <button
            onClick={()=>setTab('dm')}
            style={{flex:1,padding:'10px 0',background:'transparent',border:'none',borderBottom:tab==='dm'?'2px solid var(--accent)':'2px solid transparent',fontSize:13,fontWeight:tab==='dm'?700:500,color:tab==='dm'?'var(--accent)':'var(--text2)',cursor:'pointer',transition:'all .15s'}}
          >
            Direct Messages
          </button>
        )}
      </div>
      <div style={{flex:1,overflow:'hidden',display:'flex',minHeight:0}}>
        {tab==='apps'&&<AppMessenger user={user} activeApp={activeApp}/>}
        {tab==='dm'&&!isCompany&&<DMMessenger user={user} activeDM={activeDM}/>}
      </div>
    </div>
  );
}

// ── Shared avatar component ───────────────────────────────────────
function AvatarImg({src,name,size=36,style={}}){
  const [err,setErr]=React.useState(false);
  const initial=(name||'?')[0].toUpperCase();
  const base={width:size,height:size,borderRadius:'50%',flexShrink:0,objectFit:'cover',...style};
  if(src&&!err) return <img src={src} alt={name||''} style={base} onError={()=>setErr(true)}/>;
  return <div style={{...base,background:'linear-gradient(135deg,var(--accent),#7D52AD)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:700,color:'#fff'}}>{initial}</div>;
}

// ── MESSAGE ACTION POPUP (emoji react + delete) ───────────────────
function MsgActions({msgId,isMe,myId,onReact,onDelete,onClose,anchorRef}){
  const EMOJIS=['👍','❤️','😂','😮','😢','🔥'];
  const popRef=useRef(null);

  // Position above or below the bubble
  const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{
    if(!anchorRef?.current) return;
    const r=anchorRef.current.getBoundingClientRect();
    const popH=130, popW=240;
    let top=r.top-popH-8;
    if(top<8) top=r.bottom+8;
    let left=isMe?r.right-popW:r.left;
    left=Math.max(8,Math.min(left,window.innerWidth-popW-8));
    setPos({top,left});
  },[anchorRef]);

  useEffect(()=>{
    function handler(e){
      if(popRef.current&&!popRef.current.contains(e.target)&&
         anchorRef?.current&&!anchorRef.current.contains(e.target)) onClose();
    }
    // Small delay so the click that opened us doesn\'t immediately close us
    const id=setTimeout(()=>{
      document.addEventListener('mousedown',handler);
      document.addEventListener('touchstart',handler);
    },50);
    return()=>{clearTimeout(id);document.removeEventListener('mousedown',handler);document.removeEventListener('touchstart',handler);};
  },[onClose]);

  return(
    <div ref={popRef} style={{
      position:'fixed',zIndex:9999,background:'var(--card)',border:'1px solid var(--border)',
      borderRadius:16,boxShadow:'0 8px 32px rgba(0,0,0,.22)',padding:'10px 10px 6px',
      width:240,top:pos.top,left:pos.left,
      animation:'fadeUp .12s ease both',
    }}>
      {/* Emoji row */}
      <div style={{display:'flex',gap:4,justifyContent:'space-around',marginBottom:8}}>
        {EMOJIS.map(em=>(
          <button key={em} onClick={()=>{onReact(em);onClose();}}
            style={{fontSize:22,background:'none',border:'none',cursor:'pointer',
              width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',
              justifyContent:'center',transition:'background .1s,transform .1s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.transform='scale(1.25)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.transform='';}}
          >{em}</button>
        ))}
      </div>
      {/* Divider */}
      <div style={{height:1,background:'var(--border)',margin:'0 -4px 6px'}}/>
      {/* Delete — only for own messages */}
      {isMe
        ?<button onClick={()=>{onDelete();onClose();}}
          style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'7px 10px',
            background:'none',border:'none',borderRadius:8,cursor:'pointer',
            color:'#EF4444',fontSize:13,fontWeight:600}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.08)'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}
        >
          <span className="material-symbols-rounded" style={{fontSize:16}}>delete</span>
          Delete message
        </button>
        :<div style={{fontSize:11.5,color:'var(--text3)',padding:'4px 10px',textAlign:'center'}}>
          Long-press or right-click to react
        </div>
      }
    </div>
  );
}

// ── SINGLE MESSAGE BUBBLE with inline ⋯ button ────────────────────
function MsgBubble({m,isMe,showAvatar,isLast,myId,otherAvatar,otherName,onReact,onDeleteMsg,table}){
  const [open,setOpen]=useState(false);
  const bubbleRef=useRef(null);
  const isDeleted=m.message_kind==='deleted'||m.text==='[deleted]';
  const isTmp=m.id?.startsWith('tmp');

  // Long-press for mobile
  const ltRef=useRef(null);
  function onTouchStart(){if(!isDeleted&&!isTmp){ltRef.current=setTimeout(()=>setOpen(true),500);}}
  function onTouchEnd(){clearTimeout(ltRef.current);}

  async function handleReact(emoji){
    const reactions=await dbReactMsg(table,m.id,myId,emoji);
    if(reactions) onReact(m.id,reactions);
  }
  async function handleDelete(){
    if(table==='messages') await dbDeleteAppMsg(m.id,myId);
    else await dbDeleteDM(m.id,myId);
    onDeleteMsg(m.id);
  }

  return(
    <div className={`msg-row${isMe?' me':''}`} style={{position:'relative'}}>
      {!isMe&&<div style={{visibility:showAvatar?'visible':'hidden',flexShrink:0}}><AvatarImg src={otherAvatar} name={otherName} size={28}/></div>}
      <div className="msg-group" style={{position:'relative'}}>

        {/* ⋯ action button — shown on hover (CSS), always tappable */}
        {!isDeleted&&!isTmp&&(
          <button
            className={`msg-action-btn${isMe?' me':''}`}
            onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}
            title="React or delete"
          >
            <span className="material-symbols-rounded" style={{fontSize:16}}>more_horiz</span>
          </button>
        )}

        {open&&<MsgActions msgId={m.id} isMe={isMe} myId={myId}
          onReact={handleReact} onDelete={handleDelete} onClose={()=>setOpen(false)}
          anchorRef={bubbleRef}
        />}

        <div
          ref={bubbleRef}
          className={`msg-bubble${isMe?' me':''}${isDeleted?' deleted-bubble':''}`}
          onContextMenu={e=>{if(!isDeleted&&!isTmp){e.preventDefault();setOpen(o=>!o);}}}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchMove={()=>clearTimeout(ltRef.current)}
        >
          {isDeleted
            ?<span style={{fontStyle:'italic',opacity:.55,fontSize:12.5}}>This message was deleted</span>
            :<>
              {m.text&&<span>{m.text}</span>}
              {m.attachment_url&&(
                <div className="msg-attachment">
                  {(m.message_kind==='image'||(m.attachment_type||'').startsWith('image/'))
                    ?<a href={m.attachment_url} target="_blank" rel="noreferrer"><img src={m.attachment_url} alt={m.attachment_name||'image'} className="msg-img"/></a>
                    :<a href={m.attachment_url} target="_blank" rel="noreferrer" className={`msg-file${isMe?' me':''}`}>
                      <span>📎</span>{m.attachment_name||'File'}{m.attachment_size?` (${fmtBytes(m.attachment_size)})`:''}
                    </a>
                  }
                </div>
              )}
            </>
          }
        </div>

        {/* Reaction pills */}
        {m.reactions&&Object.keys(m.reactions).filter(k=>m.reactions[k]?.length>0).length>0&&(
          <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap',justifyContent:isMe?'flex-end':'flex-start'}}>
            {Object.entries(m.reactions).map(([emoji,users])=>users.length>0&&(
              <button key={emoji}
                onClick={async()=>{const r=await dbReactMsg(table,m.id,myId,emoji);if(r)onReact(m.id,r);}}
                style={{background:users.includes(myId)?'rgba(10,46,92,.18)':'var(--bg2)',
                  border:'1px solid var(--border)',borderRadius:20,padding:'3px 8px',
                  cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:4,
                  fontWeight:600,color:'var(--text2)'}}
              >
                {emoji}<span style={{fontSize:11}}>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`msg-time${isMe?' me':''}`}>
          {new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
          {isMe&&isLast&&<span className="msg-sent-tick"> ✓</span>}
        </div>
      </div>
    </div>
  );
}

// ── APP MESSENGER (student↔company via application) ───────────────
function AppMessenger({user,activeApp}){
  const [threads,setThreads]=useState([]);
  const [selected,setSelected]=useState(activeApp||null);
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState('');
  const [isUploading,setIsUploading]=useState(false);
  const [loadingMsgs,setLoadingMsgs]=useState(false);
  const [unreadCounts,setUnreadCounts]=useState({});
  const [typingOther,setTypingOther]=useState(false);
  const [lastThreadMsgs,setLastThreadMsgs]=useState({});
  const [confirmDelConv,setConfirmDelConv]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<=768);
  const [mobileView,setMobileView]=useState('list');
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const endRef=useRef(null);
  const inputRef=useRef(null);
  const fileRef=useRef(null);
  const typingTimer=useRef(null);
  const myId=user?.user?.id;
  const isCompany=user?.userType==='company'||user?.userType==='school';
  const selectedRef=useRef(selected);
  useEffect(()=>{selectedRef.current=selected;},[selected]);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener('resize',fn); return()=>window.removeEventListener('resize',fn);
  },[]);

  useEffect(()=>{if(activeApp){setSelected(activeApp);if(isMobile)setMobileView('chat');}},[activeApp?.id]);

  // Load threads
  useEffect(()=>{
    if(!myId) return;
    if(isCompany){
      dbGetCoApps(myId).then(data=>setThreads(data||[]));
    }else{
      dbGetMyApps(myId).then(data=>setThreads(data||[]));
    }
  },[isCompany,myId]);

  // ── PER-THREAD realtime: subscribe when a thread is selected ──────
  // This catches ALL new messages (own + other) for the open thread.
  useEffect(()=>{
    if(!myId||!selected?.id) return;
    const c=getSB(); if(!c) return;
    const ch=c.channel('appmsg-thread-'+selected.id)
      .on('postgres_changes',
        {event:'INSERT',schema:'public',table:'messages',filter:'application_id=eq.'+selected.id},
        payload=>{
          const msg=payload.new;
          if(!msg) return;
          // Replace optimistic tmp row OR append real row
          setMsgs(prev=>{
            // If it\'s our own message, swap out the tmp bubble
            if(msg.sender_id===myId){
              const hasTmp=prev.some(m=>m.id?.startsWith('tmp'));
              if(hasTmp) return [...prev.filter(m=>!m.id?.startsWith('tmp')),msg];
              // Already removed (race) — deduplicate by id
              if(prev.some(m=>m.id===msg.id)) return prev;
              return [...prev,msg];
            }
            // Incoming from other person
            setTypingOther(false);
            if(prev.some(m=>m.id===msg.id)) return prev;
            return [...prev,msg];
          });
          // Update sidebar preview
          setLastThreadMsgs(p=>({...p,[msg.application_id]:{text:msg.text||'📎 Attachment',time:msg.created_at}}));
        }
      ).subscribe();
    return ()=>c.removeChannel(ch);
  },[myId,selected?.id]);

  // ── GLOBAL realtime: bump unread badge on OTHER threads when a message arrives ──
  useEffect(()=>{
    if(!myId) return;
    const c=getSB(); if(!c) return;
    const ch=c.channel('appmsg-global-'+myId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
        const appId=payload.new?.application_id;
        const senderId=payload.new?.sender_id;
        if(!appId||senderId===myId) return; // only care about incoming
        // Update sidebar preview
        setLastThreadMsgs(prev=>({...prev,[appId]:{text:payload.new?.text||'📎 Attachment',time:payload.new?.created_at}}));
        // Only bump unread if this thread is NOT currently open (per-thread channel handles the open one)
        if(selectedRef.current?.id!==appId){
          setUnreadCounts(prev=>({...prev,[appId]:(prev[appId]||0)+1}));
        }
      }).subscribe();
    return ()=>c.removeChannel(ch);
  },[myId]);

  // Typing indicator via Supabase Presence
  useEffect(()=>{
    if(!myId||!selected?.id) return;
    const c=getSB(); if(!c) return;
    const presenceCh=c.channel('typing-app-'+selected.id,{config:{presence:{key:myId}}});
    presenceCh
      .on('presence',{event:'sync'},()=>{
        const state=presenceCh.presenceState();
        const others=Object.keys(state).filter(k=>k!==myId);
        setTypingOther(others.some(k=>state[k]?.[0]?.typing===true));
      })
      .subscribe();
    return ()=>c.removeChannel(presenceCh);
  },[myId,selected?.id]);

  // Broadcast typing to presence channel
  const presenceChRef=useRef(null);
  useEffect(()=>{
    if(!myId||!selected?.id) return;
    const c=getSB(); if(!c) return;
    presenceChRef.current=c.channel('typing-app-'+selected.id,{config:{presence:{key:myId}}});
    presenceChRef.current.subscribe();
    return ()=>{if(presenceChRef.current) c.removeChannel(presenceChRef.current);};
  },[myId,selected?.id]);

  function onInputChange(e){
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height='auto';
    e.target.style.height=Math.min(e.target.scrollHeight,120)+'px';
    // Broadcast typing
    if(presenceChRef.current&&myId){
      presenceChRef.current.track({typing:true,user:myId}).catch(()=>{});
      clearTimeout(typingTimer.current);
      typingTimer.current=setTimeout(()=>{
        presenceChRef.current?.track({typing:false,user:myId}).catch(()=>{});
      },2000);
    }
  }

  // Load messages for selected thread + clear its unread count
  useEffect(()=>{
    if(!selected) return;
    setLoadingMsgs(true);
    setTypingOther(false);
    dbGetMsgs(selected.id).then(data=>{setMsgs(data);setLoadingMsgs(false);});
    // Clear unread for this thread when opened
    setUnreadCounts(prev=>({...prev,[selected.id]:0}));
  },[selected?.id]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs,typingOther]);

  async function send(meta){
    const text=input.trim();
    const hasAttachment=Boolean(meta?.attachment_url);
    if((!text&&!hasAttachment)||!selected) return;
    if(text) setInput('');
    // Stop typing indicator
    clearTimeout(typingTimer.current);
    if(presenceChRef.current&&myId) presenceChRef.current.track({typing:false,user:myId}).catch(()=>{});
    const tmp={id:'tmp-'+Date.now(),sender_id:myId||'me',application_id:selected.id,text,created_at:new Date().toISOString(),...meta};
    setMsgs(prev=>[...prev,tmp]);
    setLastThreadMsgs(prev=>({...prev,[selected.id]:{text:text||'📎 Attachment',time:new Date().toISOString()}}));
    const recipientId=isCompany?(selected.student_id||selected.student?.id):(selected.company_id||selected.job?.company_id);
    const senderName=user?.form?.name||user?.profile?.full_name||user?.profile?.company_name||'Someone';
    await dbSendMsg(myId,selected.id,text,recipientId,senderName,meta||{});
    inputRef.current?.focus();
  }

  async function onPickAttachment(e){
    const file=e.target.files?.[0];
    if(!file||!myId||!selected) return;
    setIsUploading(true);
    try{
      const uploaded=await uploadMessageFile({uid:myId,file,kind:'application'});
      await send({
        attachment_url:uploaded.url,
        attachment_name:uploaded.name,
        attachment_type:uploaded.type,
        attachment_size:uploaded.size,
        message_kind:uploaded.kind,
      });
    }catch(err){
      toast('File upload failed');
      console.error(err);
    }finally{
      setIsUploading(false);
      e.target.value='';
    }
  }

  const threadName=(t)=>isCompany?(t.student?.full_name||'Student'):(t.job?.co||t.job?.company_name||'Company');
  const threadAvatar=(t)=>isCompany?(t.student?.avatar_url||null):(t.job?.avatar_url||null);
  const threadSub=(t)=>t.job?.title||'Application';

  function handleMsgReact(msgId,reactions){
    setMsgs(prev=>prev.map(m=>m.id===msgId?{...m,reactions}:m));
  }
  function handleMsgDelete(msgId){
    setMsgs(prev=>prev.map(m=>m.id===msgId?{...m,text:'[deleted]',attachment_url:null,attachment_name:null,message_kind:'deleted'}:m));
    toast('Message deleted');
  }

  async function handleDeleteConv(){
    if(!selected?.id||!myId) return;
    await dbDeleteAppConversation(selected.id,myId);
    setMsgs([]);
    setSelected(null);
    if(isMobile) setMobileView('list');
    toast('Conversation cleared');
  }

  function selectThread(t){
    setSelected(t);
    if(isMobile) setMobileView('chat');
  }

  const showList=!isMobile||(isMobile&&mobileView==='list');
  const showChat=!isMobile||(isMobile&&mobileView==='chat');

  return(
    <div style={{display:'flex',flex:1,overflow:'hidden',height:'100%',minHeight:0,position:'relative'}}>
      {confirmDelConv&&<ConfirmModal title="Delete conversation" message="All messages in this conversation will be permanently deleted." onConfirm={()=>{handleDeleteConv();setConfirmDelConv(false);}} onCancel={()=>setConfirmDelConv(false)}/>}

      {/* Thread sidebar */}
      {showList&&<div className="messenger-sidebar" style={isMobile?{width:'100%',borderRight:'none'}:{}}>
        <div className="messenger-sidebar-head">
          <div className="messenger-sidebar-title">Messages</div>
        </div>
        <div className="messenger-thread-list">
          {threads.length===0
            ?<div className="messenger-empty-threads">No conversations yet.</div>
            :threads.map((t,i)=>{
              const active=selected?.id===t.id;
              const unread=unreadCounts[t.id]||0;
              const hasUnread=unread>0&&!active;
              const preview=lastThreadMsgs[t.id];
              const previewText=preview?.text||null;
              const previewTime=preview?.time?new Date(preview.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):null;
              return(
                <div key={t.id||i} onClick={()=>selectThread(t)} className={`messenger-thread${active&&!isMobile?' active':''}`}>
                  <div style={{position:'relative',flexShrink:0}}>
                    <AvatarImg src={threadAvatar(t)} name={threadName(t)} size={40}/>
                    {hasUnread&&<span style={{position:'absolute',top:0,right:0,width:10,height:10,borderRadius:'50%',background:'#EF4444',border:'2px solid var(--bg)'}}/>}
                  </div>
                  <div className="messenger-thread-info" style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                      <div className="messenger-thread-name" style={{fontWeight:hasUnread?700:600}}>{threadName(t)}</div>
                      {previewTime&&<div style={{fontSize:10.5,color:'var(--text3)',flexShrink:0}}>{previewTime}</div>}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                      <div className="messenger-thread-sub" style={{fontWeight:hasUnread?600:400,color:hasUnread?'var(--text)':'var(--text3)'}}>{previewText||threadSub(t)}</div>
                      <div style={{flexShrink:0}}><StatusBadge status={t.status}/></div>
                    </div>
                  </div>
                  {hasUnread&&<span className="messenger-unread-badge">{unread}</span>}
                  {isMobile&&<span className="material-symbols-rounded" style={{fontSize:18,color:'var(--text3)'}}>chevron_right</span>}
                </div>
              );
            })
          }
        </div>
      </div>}

      {/* Chat area */}
      {showChat&&<div className="messenger-chat" style={isMobile?{width:'100%'}:{}}>
        {selected?(
          <>
            <div className="messenger-chat-header">
              {isMobile&&<button onClick={()=>setMobileView('list')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--accent)',display:'flex',alignItems:'center',padding:'4px 8px 4px 0',borderRadius:8}}>
                <span className="material-symbols-rounded" style={{fontSize:24}}>arrow_back</span>
              </button>}
              <AvatarImg src={threadAvatar(selected)} name={threadName(selected)} size={34}/>
              <div style={{flex:1}}>
                <div className="messenger-chat-name">{threadName(selected)}</div>
                <div className="messenger-chat-sub">{threadSub(selected)}</div>
              </div>
              <button onClick={()=>setConfirmDelConv(true)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',display:'flex',alignItems:'center',padding:'6px',borderRadius:8}} title="Delete conversation">
                <span className="material-symbols-rounded" style={{fontSize:20}}>delete_sweep</span>
              </button>
            </div>

            <div className="messenger-messages">
              <div className="msg-spacer"/>
              {loadingMsgs
                ?<div className="messenger-loading">Loading…</div>
                :msgs.length===0
                  ?<div className="messenger-no-msgs"><span className="material-symbols-rounded" style={{fontSize:36,color:'var(--text3)',display:'block',marginBottom:8}}>chat_bubble_outline</span><div>No messages yet. Say hello!</div></div>
                  :msgs.map((m,i)=>(
                    <MsgBubble key={m.id||i} m={m} isMe={m.sender_id===myId||m.id?.startsWith('tmp')}
                      showAvatar={!(m.sender_id===myId||m.id?.startsWith('tmp'))&&(i===0||msgs[i-1]?.sender_id!==m.sender_id)}
                      isLast={i===msgs.length-1} myId={myId}
                      otherAvatar={threadAvatar(selected)} otherName={threadName(selected)}
                      onReact={handleMsgReact} onDeleteMsg={handleMsgDelete} table="messages"
                    />
                  ))
              }
              {typingOther&&(
                <div className='msg-row' style={{marginTop:4}}>
                  <div style={{flexShrink:0}}><AvatarImg src={threadAvatar(selected)} name={threadName(selected)} size={28}/></div>
                  <div className='msg-group'><div className='msg-bubble typing-bubble'><span className='typing-dot'/><span className='typing-dot'/><span className='typing-dot'/></div></div>
                </div>
              )}
              <div ref={endRef}/>
            </div>

            <div className="messenger-input-bar" style={{position:'relative'}}>
              {showEmojiPicker&&(
                <div className="emoji-picker-popover" onClick={e=>e.stopPropagation()}>
                  {['😀','😂','😍','🥰','😎','🤔','😅','😭','🙏','👍','👏','🔥','❤️','✅','🎉','💯','😊','🤣','😢','😤','🚀','💪','🎯','⭐','💡','📌','🙌','👀','💬','✨'].map(em=>(
                    <button key={em} className="emoji-picker-item" onClick={()=>{
                      const ta=inputRef.current;
                      if(ta){const s=ta.selectionStart,e2=ta.selectionEnd;const v=input;const next=v.slice(0,s)+em+v.slice(e2);setInput(next);setTimeout(()=>{ta.focus();ta.setSelectionRange(s+em.length,s+em.length);},0);}
                      else{setInput(p=>p+em);}
                      setShowEmojiPicker(false);
                    }}>{em}</button>
                  ))}
                </div>
              )}
              <label className="messenger-attach-btn" title="Attach file">
                {isUploading?<span style={{fontSize:12,color:'var(--text3)'}}>…</span>:'📎'}
                <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" style={{display:'none'}} onChange={onPickAttachment}/>
              </label>
              <button className="messenger-emoji-btn" title="Emoji" onClick={()=>setShowEmojiPicker(p=>!p)}>😊</button>
              <textarea ref={inputRef} className="messenger-input" placeholder="Type a message…" value={input} onChange={onInputChange} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(inputRef.current)inputRef.current.style.height='auto';send();}}} rows={1}/>
              <button className="messenger-send-btn" onClick={()=>send()}><span className="material-symbols-rounded">send</span></button>
            </div>
          </>
        ):(
          !isMobile&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--text3)',padding:40}}><span className="material-symbols-rounded" style={{fontSize:44,display:'block',textAlign:'center'}}>chat</span><div style={{fontSize:14}}>Select a conversation</div></div>
        )}
      </div>}
    </div>
  );
}
function StudentProfilePanel({profile,onClose}){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!profile?.id) return;
    setLoading(true);
    const c=getSB(); if(!c) return;
    c.from('profiles').select('*').eq('id',profile.id).single()
      .then(({data:d})=>{setData(d);setLoading(false);});
  },[profile?.id]);
  if(!profile) return null;
  const p=data||{};
  return(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',zIndex:200}}/>
      {/* Panel */}
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:320,background:'var(--card)',borderLeft:'1px solid var(--border)',zIndex:201,display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,.13)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Student Profile</div>
          <button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text3)',display:'flex',alignItems:'center'}}><span className="material-symbols-rounded" style={{fontSize:20}}>close</span></button>
        </div>
        {loading?(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13}}>Loading…</div>
        ):(
          <div style={{padding:'20px 16px',display:'flex',flexDirection:'column',gap:16}}>
            {/* Avatar + name */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,textAlign:'center'}}>
              <AvatarImg src={p.avatar_url} name={p.full_name} size={64}/>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{p.full_name||'Student'}</div>
                {p.school&&<div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{p.school}{p.year?' · Year '+p.year:''}</div>}
                {p.major&&<div style={{fontSize:12,color:'var(--text3)'}}>{p.major}</div>}
              </div>
            </div>
            {/* Bio */}
            {p.bio&&(
              <div>
                <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--text3)',marginBottom:5}}>About</div>
                <div style={{fontSize:12.5,color:'var(--text)',lineHeight:1.6}}>{p.bio}</div>
              </div>
            )}
            {/* Links */}
            {[p.linkedin,p.github,p.twitter].some(Boolean)&&(
              <div>
                <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--text3)',marginBottom:8}}>Links</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {p.linkedin&&<a href={p.linkedin.startsWith('http')?p.linkedin:'https://'+p.linkedin} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,background:'#0A2E5C',color:'#fff',fontSize:12,fontWeight:600,textDecoration:'none'}}><span className="material-symbols-rounded" style={{fontSize:13}}>link</span>LinkedIn</a>}
                  {p.github&&<a href={p.github.startsWith('http')?p.github:'https://'+p.github} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,background:'#1a1a2e',color:'#fff',fontSize:12,fontWeight:600,textDecoration:'none'}}><span className="material-symbols-rounded" style={{fontSize:13}}>code</span>GitHub</a>}
                  {p.twitter&&<a href={`https://twitter.com/${p.twitter.replace('@','')}`} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,background:'rgba(10,46,92,.08)',color:'var(--accent)',fontSize:12,fontWeight:600,textDecoration:'none',border:'1px solid rgba(10,46,92,.14)'}}><span className="material-symbols-rounded" style={{fontSize:13}}>alternate_email</span>Twitter</a>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── DM MESSENGER (student↔student) ────────────────────────────────
function DMMessenger({user,activeDM}){
  const [threads,setThreads]=useState([]);
  const [selected,setSelected]=useState(activeDM||null);
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState('');
  const [isUploading,setIsUploading]=useState(false);
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const [researchQuery,setResearchQuery]=useState('');
  const [researching,setResearching]=useState(false);
  const [researchResults,setResearchResults]=useState([]);
  const [loading,setLoading]=useState(false);
  const [viewProfileId,setViewProfileId]=useState(null);
  const [typingOther,setTypingOther]=useState(false);
  const [ctxMenu,setCtxMenu]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [isMobile,setIsMobile]=useState(window.innerWidth<=768);
  const [mobileView,setMobileView]=useState('list');
  const endRef=useRef(null);
  const inputRef=useRef(null);
  const fileRef=useRef(null);
  const typingTimer=useRef(null);
  const presenceChRef=useRef(null);
  const myId=user?.user?.id;
  const myName=user?.form?.name||user?.profile?.full_name||user?.profile?.company_name||'User';
  const isCompany=user?.userType==='company'||user?.userType==='school';
  const selectedRef=useRef(selected);
  useEffect(()=>{selectedRef.current=selected;},[selected]);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener('resize',fn); return()=>window.removeEventListener('resize',fn);
  },[]);

  useEffect(()=>{if(activeDM){setSelected(activeDM);if(isMobile)setMobileView('chat');}},[activeDM?.otherId]);

  useEffect(()=>{
    if(!myId) return;
    const q=researchQuery.trim();
    if(q.length<2){ setResearchResults([]); return; }
    let cancelled=false;
    setResearching(true);
    const timer=setTimeout(async()=>{
      const rows=await dbResearchStudents(myId,q,isCompany?'company':'student');
      if(!cancelled) setResearchResults(rows);
      if(!cancelled) setResearching(false);
    },300);
    return ()=>{cancelled=true; clearTimeout(timer);};
  },[researchQuery,myId,isCompany]);

  // Load all DM threads for this user
  useEffect(()=>{
    if(!myId) return;
    dbGetDMThreads(myId).then(setThreads);
    const c=getSB(); if(!c) return;
    // Realtime: new DM arrives → append message or bump unread on thread
    const ch=c.channel('dm-threads-'+myId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages',filter:'recipient_id=eq.'+myId},payload=>{
        const senderId=payload.new?.sender_id;
        const isOpenThread=selectedRef.current?.otherId===senderId;
        if(isOpenThread){
          // Message is in the open thread — add it directly
          setMsgs(prev=>[...prev.filter(m=>!m.id?.startsWith('tmp')),payload.new]);
          dbMarkDMsRead(myId,senderId);
        }
        // Refresh thread list to update lastMsg preview + unread counts
        dbGetDMThreads(myId).then(setThreads);
      }).subscribe();
    return ()=>c.removeChannel(ch);
  },[myId]);

  // Load messages for selected DM thread + mark read
  useEffect(()=>{
    if(!selected||!myId) return;
    setLoading(true);
    setTypingOther(false);
    dbGetDMs(myId,selected.otherId).then(data=>{setMsgs(data);setLoading(false);});
    dbMarkDMsRead(myId,selected.otherId);
    // After marking read, refresh threads so unread badge clears
    dbGetDMThreads(myId).then(setThreads);
  },[selected?.otherId,myId]);

  // ── PER-THREAD DM realtime: catches ALL inserts (sent + received) for open thread ──
  useEffect(()=>{
    if(!myId||!selected?.otherId) return;
    const c=getSB(); if(!c) return;
    const tid=dmThreadId(myId,selected.otherId);
    const ch=c.channel('dm-thread-'+tid)
      .on('postgres_changes',
        {event:'INSERT',schema:'public',table:'direct_messages',filter:'thread_id=eq.'+tid},
        payload=>{
          const msg=payload.new;
          if(!msg) return;
          setMsgs(prev=>{
            // Replace optimistic tmp row for own sent messages
            if(msg.sender_id===myId){
              const hasTmp=prev.some(m=>m.id?.startsWith('tmp'));
              if(hasTmp) return [...prev.filter(m=>!m.id?.startsWith('tmp')),msg];
              if(prev.some(m=>m.id===msg.id)) return prev;
              return [...prev,msg];
            }
            // Incoming from other person — stop typing indicator
            setTypingOther(false);
            if(prev.some(m=>m.id===msg.id)) return prev;
            return [...prev,msg];
          });
          // Mark incoming as read immediately (thread is open)
          if(msg.sender_id!==myId) dbMarkDMsRead(myId,selected.otherId);
          // Refresh thread list sidebar preview
          dbGetDMThreads(myId).then(setThreads);
        }
      ).subscribe();
    return ()=>c.removeChannel(ch);
  },[myId,selected?.otherId]);

  // Typing presence for DMs
  useEffect(()=>{
    if(!myId||!selected?.otherId) return;
    const c=getSB(); if(!c) return;
    const tid=dmThreadId(myId,selected.otherId);
    const presenceCh=c.channel('typing-dm-'+tid,{config:{presence:{key:myId}}});
    presenceChRef.current=presenceCh;
    presenceCh
      .on('presence',{event:'sync'},()=>{
        const state=presenceCh.presenceState();
        const others=Object.keys(state).filter(k=>k!==myId);
        setTypingOther(others.some(k=>state[k]?.[0]?.typing===true));
      })
      .subscribe();
    return ()=>{c.removeChannel(presenceCh); presenceChRef.current=null;};
  },[myId,selected?.otherId]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs,typingOther]);

  async function send(meta){
    const text=input.trim();
    const hasAttachment=Boolean(meta?.attachment_url);
    if((!text&&!hasAttachment)||!selected) return;
    if(text) setInput('');
    // Stop typing indicator
    clearTimeout(typingTimer.current);
    if(presenceChRef.current&&myId) presenceChRef.current.track({typing:false,user:myId}).catch(()=>{});
    const tmp={id:'tmp-'+Date.now(),sender_id:myId,recipient_id:selected.otherId,thread_id:dmThreadId(myId,selected.otherId),text,created_at:new Date().toISOString(),...meta};
    setMsgs(prev=>[...prev,tmp]);
    await dbSendDM(myId,selected.otherId,text,myName,meta||{});
    inputRef.current?.focus();
  }

  function onInputChange(e){
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height='auto';
    e.target.style.height=Math.min(e.target.scrollHeight,120)+'px';
    if(presenceChRef.current&&myId){
      presenceChRef.current.track({typing:true,user:myId}).catch(()=>{});
      clearTimeout(typingTimer.current);
      typingTimer.current=setTimeout(()=>{
        presenceChRef.current?.track({typing:false,user:myId}).catch(()=>{});
      },2000);
    }
  }

  async function onPickAttachment(e){
    const file=e.target.files?.[0];
    if(!file||!myId||!selected) return;
    setIsUploading(true);
    try{
      const uploaded=await uploadMessageFile({uid:myId,file,kind:'direct'});
      await send({
        attachment_url:uploaded.url,
        attachment_name:uploaded.name,
        attachment_type:uploaded.type,
        attachment_size:uploaded.size,
        message_kind:uploaded.kind,
      });
    }catch(err){
      toast('Upload failed');
      console.error(err);
    }finally{
      setIsUploading(false);
      e.target.value='';
    }
  }

  const avatarInitial=(name)=>(name||'?')[0].toUpperCase();

  function handleDMMsgReact(msgId,reactions){
    setMsgs(prev=>prev.map(m=>m.id===msgId?{...m,reactions}:m));
  }
  function handleDMMsgDelete(msgId){
    setMsgs(prev=>prev.map(m=>m.id===msgId?{...m,text:'[deleted]',attachment_url:null,attachment_name:null,message_kind:'deleted'}:m));
    toast('Message deleted');
  }

  async function handleDeleteDMConv(){
    if(!selected?.otherId||!myId) return;
    await dbDeleteDMConversation(myId,selected.otherId);
    setMsgs([]);
    setThreads(prev=>prev.filter(t=>t.otherId!==selected.otherId));
    setSelected(null);
    if(isMobile) setMobileView('list');
    toast('Conversation deleted');
  }

  function selectDMThread(t){
    setSelected(t);
    setResearchQuery('');
    if(isMobile) setMobileView('chat');
  }

  const showList=!isMobile||(isMobile&&mobileView==='list');
  const showChat=!isMobile||(isMobile&&mobileView==='chat');

  return(
    <div style={{display:'flex',flex:1,overflow:'hidden',height:'100%',minHeight:0,position:'relative'}}>
      {confirmDel==='conv'&&<ConfirmModal title="Delete conversation" message="All messages with this person will be permanently deleted." onConfirm={()=>{handleDeleteDMConv();setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}

      {/* Thread sidebar */}
      {showList&&<div className="messenger-sidebar" style={isMobile?{width:'100%',borderRight:'none'}:{}}>
        <div className="messenger-sidebar-head">
          <div className="messenger-sidebar-title">Direct Messages</div>
          <input className="messenger-search" value={researchQuery} onChange={e=>setResearchQuery(e.target.value)} placeholder={isCompany?'Find students or companies…':'Find students…'}/>
        </div>
        <div className="messenger-thread-list">
          {researchQuery.trim().length>=2&&(
            <div className="messenger-search-results">
              <div className="messenger-search-label">Search Results</div>
              {researching&&<div style={{fontSize:12,color:'var(--text3)',padding:'4px 0'}}>Searching…</div>}
              {!researching&&researchResults.length===0&&<div style={{fontSize:12,color:'var(--text3)',padding:'4px 0'}}>No results found.</div>}
              {researchResults.map(r=>(
                <button key={r.id} onClick={()=>selectDMThread({otherId:r.id,other:r})} className="messenger-search-result">
                  <AvatarImg src={r.avatar_url} name={r.full_name||r.company_name} size={36}/>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:600,color:'var(--text)'}}>{r.full_name||r.company_name||'User'}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{r.user_type==='company'?'Company':[r.school,r.major].filter(Boolean).join(' · ')||'ALU'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {threads.length===0&&researchQuery.trim().length<2
            ?<div className="messenger-empty-threads">No DMs yet.<br/>{isCompany?'Search for a student to message them directly.':'Search for a student to start a conversation.'}</div>
            :threads.map((t,i)=>{
              const active=selected?.otherId===t.otherId;
              const hasUnread=t.unread>0;
              const lastTime=t.lastAt?new Date(t.lastAt):null;
              const timeStr=lastTime?lastTime.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
              return(
              <div key={t.otherId||i} onClick={()=>selectDMThread(t)} className={`messenger-thread${active&&!isMobile?' active':''}`}>
                <div style={{position:'relative',flexShrink:0}}>
                  <AvatarImg src={t.other?.avatar_url} name={t.other?.displayName||t.other?.full_name||t.other?.company_name} size={40}/>
                  {hasUnread&&<span style={{position:'absolute',top:0,right:0,width:10,height:10,borderRadius:'50%',background:'#EF4444',border:'2px solid var(--bg)'}}/>}
                </div>
                <div className="messenger-thread-info">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                    <div className="messenger-thread-name" style={{fontWeight:hasUnread?700:600}}>{t.other?.displayName||t.other?.full_name||t.other?.company_name||'User'}</div>
                    {timeStr&&<div style={{fontSize:10.5,color:'var(--text3)',flexShrink:0}}>{timeStr}</div>}
                  </div>
                  <div className="messenger-thread-sub" style={{fontWeight:hasUnread?600:400,color:hasUnread?'var(--text)':'var(--text3)'}}>{t.lastMsg||t.other?.school||'ALU'}</div>
                </div>
                {hasUnread&&<span className="messenger-unread-badge">{t.unread}</span>}
                {isMobile&&<span className="material-symbols-rounded" style={{fontSize:18,color:'var(--text3)'}}>chevron_right</span>}
              </div>
              );
            })
          }
        </div>
      </div>}

      {/* Chat area */}
      {showChat&&<div className="messenger-chat" style={isMobile?{width:'100%'}:{}}>
        {selected?(
          <>
            <div className="messenger-chat-header">
              {isMobile&&<button onClick={()=>setMobileView('list')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--accent)',display:'flex',alignItems:'center',padding:'4px 8px 4px 0',borderRadius:8}}>
                <span className="material-symbols-rounded" style={{fontSize:24}}>arrow_back</span>
              </button>}
              <div style={{cursor:'pointer'}} onClick={()=>selected.other?.user_type!=='company'&&setViewProfileId(selected.otherId)}>
                <AvatarImg src={selected.other?.avatar_url} name={selected.other?.displayName||selected.other?.full_name||selected.other?.company_name} size={34}/>
              </div>
              <div style={{flex:1}}>
                <div className="messenger-chat-name" style={{cursor:selected.other?.user_type!=='company'?'pointer':'default',display:'inline-flex',alignItems:'center',gap:6}} onClick={()=>selected.other?.user_type!=='company'&&setViewProfileId(selected.otherId)}>
                  {selected.other?.displayName||selected.other?.full_name||selected.other?.company_name||'User'}
                  {selected.other?.user_type!=='company'&&<span className="material-symbols-rounded" style={{fontSize:14,color:'var(--text3)'}}>open_in_new</span>}
                </div>
                <div className="messenger-chat-sub">{selected.other?.user_type==='company'?'Company':selected.other?.school||'ALU'}{selected.other?.year?' · Year '+selected.other.year:''}</div>
              </div>
              <button onClick={()=>setConfirmDel('conv')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',display:'flex',alignItems:'center',padding:'6px',borderRadius:8}} title="Delete conversation">
                <span className="material-symbols-rounded" style={{fontSize:20}}>delete_sweep</span>
              </button>
            </div>

            <div className="messenger-messages">
              <div className="msg-spacer"/>
              {loading
                ?<div className="messenger-loading">Loading…</div>
                :msgs.length===0
                  ?<div className="messenger-no-msgs"><div style={{fontSize:36,marginBottom:10}}>👋</div><div>Start the conversation!</div></div>
                  :msgs.map((m,i)=>(
                    <MsgBubble key={m.id||i} m={m} isMe={m.sender_id===myId||m.id?.startsWith('tmp')}
                      showAvatar={!(m.sender_id===myId||m.id?.startsWith('tmp'))&&(i===0||msgs[i-1]?.sender_id!==m.sender_id)}
                      isLast={i===msgs.length-1} myId={myId}
                      otherAvatar={selected.other?.avatar_url}
                      otherName={selected.other?.displayName||selected.other?.full_name||selected.other?.company_name}
                      onReact={handleDMMsgReact} onDeleteMsg={handleDMMsgDelete} table="direct_messages"
                    />
                  ))
              }
              {typingOther&&(
                <div className='msg-row' style={{marginTop:4}}>
                  <div style={{flexShrink:0}}><AvatarImg src={selected.other?.avatar_url} name={selected.other?.displayName||selected.other?.full_name||selected.other?.company_name} size={28}/></div>
                  <div className='msg-group'><div className='msg-bubble typing-bubble'><span className='typing-dot'/><span className='typing-dot'/><span className='typing-dot'/></div></div>
                </div>
              )}
              <div ref={endRef}/>
            </div>

            <div className="messenger-input-bar" style={{position:'relative'}}>
              {showEmojiPicker&&(
                <div className="emoji-picker-popover" onClick={e=>e.stopPropagation()}>
                  {['😀','😂','😍','🥰','😎','🤔','😅','😭','🙏','👍','👏','🔥','❤️','✅','🎉','💯','😊','🤣','😢','😤','🚀','💪','🎯','⭐','💡','📌','🙌','👀','💬','✨'].map(em=>(
                    <button key={em} className="emoji-picker-item" onClick={()=>{
                      const ta=inputRef.current;
                      if(ta){const s=ta.selectionStart,e2=ta.selectionEnd;const v=input;const next=v.slice(0,s)+em+v.slice(e2);setInput(next);setTimeout(()=>{ta.focus();ta.setSelectionRange(s+em.length,s+em.length);},0);}
                      else{setInput(p=>p+em);}
                      setShowEmojiPicker(false);
                    }}>{em}</button>
                  ))}
                </div>
              )}
              <label className="messenger-attach-btn" title="Attach file">
                {isUploading?<span style={{fontSize:12,color:'var(--text3)'}}>…</span>:'📎'}
                <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" style={{display:'none'}} onChange={onPickAttachment}/>
              </label>
              <button className="messenger-emoji-btn" title="Emoji" onClick={()=>setShowEmojiPicker(p=>!p)}>😊</button>
              <textarea ref={inputRef} className="messenger-input" placeholder="Type a message…" value={input} onChange={onInputChange} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(inputRef.current)inputRef.current.style.height='auto';send();}}} rows={1}/>
              <button className="messenger-send-btn" onClick={()=>send()}><span className="material-symbols-rounded">send</span></button>
            </div>
          </>
        ):(
          !isMobile&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--text3)',padding:40}}><span className="material-symbols-rounded" style={{fontSize:44,display:'block',textAlign:'center'}}>chat</span><div style={{fontSize:14}}>Select a conversation</div></div>
        )}
        {viewProfileId&&<StudentProfilePanel profile={{id:viewProfileId}} onClose={()=>setViewProfileId(null)}/>}
      </div>}
    </div>
  );
}
function CompanyListingsPage({user}){
  // Schools use this page too — they post jobs (their own or forwarded from
  // external employers). The extra UI below is gated on isSchool.
  const isSchool=user?.userType==='school';
  const YEARS=['Year 1','Year 2','Year 3','Year 4'];

  const uid=user?.user?.id;
  const [listings,setListings]=React.useState([]);
  const [counts,setCounts]=React.useState({all:0,active:0,closed:0});
  const [showCreate,setShowCreate]=React.useState(false);
  const [editId,setEditId]=React.useState(null);
  const blankForm={
    listing_type:'Internship',title:'',type:'Tech',location:'Kigali, Rwanda',pay:'',
    duration:'',deadline:'',description:'',responsibilities:'',requirements:'',tags:'',
    apply_mode:'in_app',apply_url:'',allowed_years:[],
    is_for_other_company:false,original_company_name:'',original_company_logo_url:'',
  };
  const [form,setForm]=React.useState(blankForm);
  const [saving,setSaving]=React.useState(false);
  const [filter,setFilter]=React.useState('all');
  const [tab,setTab]=React.useState('all');
  const [posting,setPosting]=React.useState(false);
  const [logoUploading,setLogoUploading]=React.useState(false);
  const logoFileRef=React.useRef();
  const [deletingId,setDeletingId]=React.useState(null);
  const [togglingId,setTogglingId]=React.useState(null);
  const [selectedListing,setSelectedListing]=React.useState(null);

  // Company / school display vars
  const profile=user?.profile||{};
  const companyName=profile.company_name||profile.full_name||(isSchool?'Your School':'Your Company');
  const companyAvatar=profile.avatar_url||null;
  const companyInitials=(companyName||'C').slice(0,2).toUpperCase();

  const listingTypeBadge={
    'Internship':{color:'#6366F1',bg:'rgba(99,102,241,.13)',icon:'school'},
    'Full-time Job':{color:'#10B981',bg:'rgba(16,185,129,.13)',icon:'work'},
    'Part-time Job':{color:'#F59E0B',bg:'rgba(245,158,11,.13)',icon:'schedule'},
    'Freelance':{color:'#8B5CF6',bg:'rgba(139,92,246,.13)',icon:'handshake'},
  };

  // Derived
  const filtered=tab==='all'?listings:listings.filter(l=>l.status===tab);

  function setF(k,v){setForm(f=>({...f,[k]:v}));}

  // Load listings + realtime subscriptions
  React.useEffect(()=>{
    if(!uid) return;
    loadListings();
    const c=getSB(); if(!c) return;

    // Watch job_listings table for any change on this company's listings
    const listingsCh=c.channel('co-listings-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'job_listings',filter:'company_id=eq.'+uid},()=>{
        loadListings();
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'job_listings',filter:'company_id=eq.'+uid},()=>{
        loadListings();
      })
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'job_listings',filter:'company_id=eq.'+uid},()=>{
        loadListings();
      })
      .subscribe();

    // Watch applications table — any new application on any of this company's listings
    const appsCh=c.channel('co-listing-apps-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'applications'},()=>{
        loadListings(); // re-fetch to recount applicants
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'applications'},()=>{
        loadListings();
      })
      .subscribe();

    return()=>{
      c.removeChannel(listingsCh);
      c.removeChannel(appsCh);
    };
  },[uid]);

  // Update counts when listings change
  React.useEffect(()=>{
    setCounts({
      all:listings.length,
      active:listings.filter(l=>l.status==='active').length,
      closed:listings.filter(l=>l.status==='closed'||l.status==='draft').length,
    });
  },[listings]);

  async function loadListings(){
    const c=getSB(); if(!c||!uid) return;
    const{data}=await c.from('job_listings').select('*').eq('company_id',uid).order('created_at',{ascending:false});
    const rows=data||[];
    if(rows.length){
      const ids=rows.map(r=>r.id);
      const{data:appRows}=await c.from('applications').select('job_id').in('job_id',ids);
      const countMap={};
      (appRows||[]).forEach(a=>{countMap[a.job_id]=(countMap[a.job_id]||0)+1;});
      setListings(rows.map(r=>({...r,appCount:countMap[r.id]||0})));
    } else {
      setListings([]);
    }
  }

  // Image compressor (mirrors CompanyProfilePage's helper)
  async function compressImage(file,maxPx=600,quality=0.78){
    return new Promise(resolve=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        const scale=Math.min(1,maxPx/Math.max(img.width,img.height));
        const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        canvas.toBlob(blob=>resolve(blob),'image/webp',quality);
        URL.revokeObjectURL(url);
      };
      img.src=url;
    });
  }

  async function handleOtherCompanyLogoUpload(e){
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size>10*1024*1024){toast('Image too large (max 10MB)');return;}
    setLogoUploading(true);
    try{
      const blob=await compressImage(file,600);
      const path=`external_logos/${uid||'anon'}/${Date.now()}.webp`;
      const c=getSB();
      const {error}=await c.storage.from('aluhub-media').upload(path,blob,{upsert:true,contentType:'image/webp',cacheControl:'0'});
      if(error){toast('Upload failed: '+error.message);return;}
      const {data}=c.storage.from('aluhub-media').getPublicUrl(path);
      setF('original_company_logo_url',data.publicUrl+'?t='+Date.now());
      toast('Logo uploaded ✓');
    }catch(err){toast('Upload failed: '+err.message);}
    finally{setLogoUploading(false);}
  }

  function toggleYear(y){
    setForm(f=>({
      ...f,
      allowed_years:(f.allowed_years||[]).includes(y)
        ? f.allowed_years.filter(x=>x!==y)
        : [...(f.allowed_years||[]),y],
    }));
  }

  async function handlePost(){
    if(!form.title.trim()){toast('Title is required.');return;}
    if(!form.description.trim()){toast('Description is required.');return;}
    // School forwarding another company → URL is mandatory; in-app applications
    // can't be received on behalf of an external employer.
    const forceExternal=isSchool&&form.is_for_other_company;
    const effectiveMode=forceExternal?'external':form.apply_mode;
    if(effectiveMode==='external'){
      const u=(form.apply_url||'').trim();
      if(!u){toast('Please paste the external apply URL.');return;}
      if(!/^https?:\/\//i.test(u)){toast('Apply URL must start with http:// or https://');return;}
    }
    if(isSchool&&form.is_for_other_company&&!form.original_company_name.trim()){
      toast('Please enter the other company’s name.');return;
    }
    setPosting(true);
    try{
      const c=getSB(); if(!c||!uid) return;
      const payload={
        company_id:uid,title:form.title.trim(),description:form.description.trim(),
        responsibilities:form.responsibilities.trim(),requirements:form.requirements.trim(),
        listing_type:form.listing_type,type:form.type,location:form.location,
        pay:form.pay,duration:form.duration,deadline:form.deadline||null,
        tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean),status:'active',
        // New columns
        apply_url:effectiveMode==='external'?form.apply_url.trim():null,
        posted_by_role:isSchool?'school':'company',
        original_company_name:(isSchool&&form.is_for_other_company)?form.original_company_name.trim():null,
        original_company_logo_url:(isSchool&&form.is_for_other_company)?(form.original_company_logo_url||null):null,
        allowed_years:form.allowed_years||[],
      };
      if(editId){
        await c.from('job_listings').update(payload).eq('id',editId).eq('company_id',uid);
        toast('Listing updated ✓');
      }else{
        await c.from('job_listings').insert(payload);
        toast(`${form.listing_type} posted! 🎉`);
      }
      setShowCreate(false);
      setEditId(null);
      setForm(blankForm);
      loadListings();
    }catch(err){toast('Failed: '+(err.message||'Unknown error'));}
    finally{setPosting(false);}
  }

  async function toggleStatus(l){
    setTogglingId(l.id);
    const ns=l.status==='active'?'closed':'active';
    const c=getSB();
    if(c) await c.from('job_listings').update({status:ns}).eq('id',l.id).eq('company_id',uid);
    setListings(prev=>prev.map(x=>x.id===l.id?{...x,status:ns}:x));
    toast(ns==='active'?'Listing reopened ✓':'Listing closed ✓');
    setTogglingId(null);
  }

  async function deleteListing(l){
    if(!window.confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    setDeletingId(l.id);
    const c=getSB();
    if(c) await c.from('job_listings').delete().eq('id',l.id).eq('company_id',uid);
    setListings(prev=>prev.filter(x=>x.id!==l.id));
    toast('Listing deleted');
    setDeletingId(null);
  }

  function startEdit(l){
    setForm({
      listing_type:l.listing_type||'Internship',title:l.title||'',type:l.type||'Tech',
      location:l.location||'Kigali, Rwanda',pay:l.pay||'',duration:l.duration||'',
      deadline:l.deadline||'',description:l.description||'',responsibilities:l.responsibilities||'',
      requirements:l.requirements||'',tags:(l.tags||[]).join(', '),
      apply_mode:l.apply_url?'external':'in_app',
      apply_url:l.apply_url||'',
      allowed_years:Array.isArray(l.allowed_years)?l.allowed_years:[],
      is_for_other_company:Boolean(l.original_company_name),
      original_company_name:l.original_company_name||'',
      original_company_logo_url:l.original_company_logo_url||'',
    });
    setEditId(l.id);
    setShowCreate(true);
  }

  // Show job detail when a listing is clicked
  if(selectedListing){
    // If the school posted on behalf of another company, the card/header
    // should show that company's name + logo (matching what students see).
    const isSchoolForOther = selectedListing.posted_by_role==='school' && selectedListing.original_company_name;
    const displayCo     = isSchoolForOther ? selectedListing.original_company_name        : companyName;
    const displayAvatar = isSchoolForOther ? selectedListing.original_company_logo_url    : companyAvatar;
    const mappedJob={
      id:selectedListing.id,
      co:displayCo,
      company_name:displayCo,
      avatar_url:displayAvatar,
      company_desc:profile.bio||'',
      industry:profile.industry||'',
      company_size:profile.company_size||'',
      company_location:profile.location||'',
      title:selectedListing.title||'',
      listing_type:selectedListing.listing_type||'',
      type:selectedListing.type||'',
      tags:selectedListing.tags||[],
      desc:selectedListing.description||'',
      description:selectedListing.description||'',
      responsibilities:selectedListing.responsibilities||'',
      requirements:selectedListing.requirements||'',
      dur:selectedListing.duration||'',
      pay:selectedListing.pay||'',
      loc:selectedListing.location||'Kigali',
      dead:selectedListing.deadline?new Date(selectedListing.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Open',
      match:null,
      cat:(selectedListing.type||'other').toLowerCase(),
      company_id:selectedListing.company_id,
      bg:'#0A1828',
      // New fields for badges and external apply
      apply_url:selectedListing.apply_url||null,
      posted_by_role:selectedListing.posted_by_role||'company',
      school_name:isSchool?companyName:null,
      original_company_name:selectedListing.original_company_name||null,
      original_company_logo_url:selectedListing.original_company_logo_url||null,
      allowed_years:Array.isArray(selectedListing.allowed_years)?selectedListing.allowed_years:[],
    };
    return <JobDetailPage job={mappedJob} onBack={()=>setSelectedListing(null)} user={user} setPage={()=>{}} onViewCompany={null}/>;
  }

  return(
    <div>
      <div className="topbar anim" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <div className="page-title">My Listings</div>
          <div className="page-sub">{counts.all} listings · {counts.active} open · {counts.closed} closed</div>
        </div>
        <button
          className="btn btn-primary"
          style={{display:'flex',alignItems:'center',gap:6}}
          onClick={()=>{setShowCreate(true);setEditId(null);setForm(blankForm); }}
        >
          <span className="material-symbols-rounded" style={{fontSize:18}}>add</span>
          Create Listing
        </button>
      </div>

      {/* Create/Edit modal card */}
      {showCreate&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget){setShowCreate(false);setEditId(null);}}}>
          <div style={{background:'var(--bg2)',borderRadius:18,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.5)',border:'1px solid var(--border2)'}}>
            {/* Modal header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--bg2)',zIndex:2,borderRadius:'18px 18px 0 0'}}>
              <div>
                <div style={{fontSize:17,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{editId?'Edit Listing':'Create a Listing'}</div>
                <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>Visible to 500+ ALU &amp; CMU-Africa students</div>
              </div>
              <button onClick={()=>{setShowCreate(false);setEditId(null);}} style={{background:'var(--bg3)',border:'none',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)'}}>
                <span className="material-symbols-rounded" style={{fontSize:18}}>close</span>
              </button>
            </div>
            <div style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {/* SCHOOL-ONLY: post on behalf of another company */}
              {isSchool&&(
                <div style={{padding:14,borderRadius:10,background:'rgba(79,70,229,.06)',border:'1px solid var(--border)'}}>
                  <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                    <input type="checkbox" checked={form.is_for_other_company} onChange={e=>{
                      const checked=e.target.checked;
                      setForm(f=>({
                        ...f,
                        is_for_other_company:checked,
                        // External-company postings must redirect to that company's apply URL —
                        // the school can't receive applications on their behalf.
                        ...(checked?{apply_mode:'external'}:{}),
                      }));
                    }}/>
                    <span style={{fontWeight:600,fontSize:13}}>This opportunity is from another company</span>
                  </label>
                  <div style={{fontSize:11.5,color:'var(--text3)',marginTop:4,marginLeft:24}}>
                    Tick this if you are forwarding an external employer's role (e.g. Microsoft, Safaricom). Leave unticked if it's your own role.
                  </div>
                  {form.is_for_other_company&&(
                    <div style={{marginTop:12,paddingLeft:24,display:'flex',flexDirection:'column',gap:12}}>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Company Name *</label>
                        <input className="form-input" placeholder="e.g. Microsoft" value={form.original_company_name} onChange={e=>setF('original_company_name',e.target.value)}/>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label className="form-label">Company Logo</label>
                        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                          {form.original_company_logo_url
                            ? <img src={form.original_company_logo_url} alt="" style={{width:48,height:48,borderRadius:8,objectFit:'cover',border:'1px solid var(--border)'}}/>
                            : <div style={{width:48,height:48,borderRadius:8,background:'var(--bg3)',border:'1px dashed var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)'}}>
                                <span className="material-symbols-rounded" style={{fontSize:20}}>image</span>
                              </div>
                          }
                          <input type="file" ref={logoFileRef} accept="image/*" style={{display:'none'}} onChange={handleOtherCompanyLogoUpload}/>
                          <button type="button" className="btn btn-outline" style={{fontSize:12,padding:'6px 12px'}}
                            disabled={logoUploading} onClick={()=>logoFileRef.current?.click()}>
                            <span className="material-symbols-rounded" style={{fontSize:14}}>upload</span>
                            {logoUploading?'Uploading…':(form.original_company_logo_url?'Replace':'Upload Logo')}
                          </button>
                          {form.original_company_logo_url&&(
                            <button type="button" className="btn btn-outline" style={{fontSize:12,padding:'6px 12px'}}
                              onClick={()=>setF('original_company_logo_url','')}>Remove</button>
                          )}
                        </div>
                        <div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>
                          Used on the job card instead of your school logo. If you skip this, the school logo will show with the company name in the badge.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Listing type pills */}
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Listing Type</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {['Internship','Full-time Job','Part-time Job','Freelance'].map(t=>{
                    const m=listingTypeBadge[t]||{color:'var(--accent)',bg:'rgba(99,102,241,.1)'};
                    const sel=form.listing_type===t;
                    return(
                      <button key={t} onClick={()=>setF('listing_type',t)} style={{padding:'7px 14px',borderRadius:20,border:`1.5px solid ${sel?m.color:'var(--border)'}`,fontSize:12.5,fontWeight:600,cursor:'pointer',background:sel?m.bg:'transparent',color:sel?m.color:'var(--text2)',transition:'all .15s'}}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Title */}
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder={`e.g. ${form.listing_type==='Internship'?'Software Engineer Intern':'Product Manager'}`} value={form.title} onChange={e=>setF('title',e.target.value)}/>
              </div>
              {/* Category + Location */}
              <div className="two-col">
                <div className="form-group" style={{margin:0}}>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.type} onChange={e=>setF('type',e.target.value)}>
                    <option>Tech</option><option>Finance</option><option>Policy</option><option>Marketing</option>
                    <option>Education</option><option>Design</option><option>Research</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location} onChange={e=>setF('location',e.target.value)}/>
                </div>
              </div>
              {/* Pay + Duration */}
              <div className="two-col">
                <div className="form-group" style={{margin:0}}>
                  <label className="form-label">{form.listing_type==='Internship'?'Stipend':'Salary'}</label>
                  <input className="form-input" placeholder="e.g. RWF 200,000/mo or Unpaid" value={form.pay} onChange={e=>setF('pay',e.target.value)}/>
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label className="form-label">Duration</label>
                  <input className="form-input" placeholder="e.g. 3 months" value={form.duration} onChange={e=>setF('duration',e.target.value)}/>
                </div>
              </div>
              {/* Deadline */}
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Application Deadline</label>
                <input className="form-input" type="date" value={form.deadline} onChange={e=>setF('deadline',e.target.value)}/>
              </div>
              {/* Description */}
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">About This Role *</label>
                <textarea className="form-input" rows={4} placeholder={`Overview: What will the ${form.listing_type==='Internship'?'intern':'hire'} work on? What team will they join?`} value={form.description} onChange={e=>setF('description',e.target.value)}/>
              </div>
              {/* Responsibilities */}
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Responsibilities</label>
                <textarea className="form-input" rows={4} placeholder={"List key responsibilities, one per line:\n• Design and build new features\n• Collaborate with cross-functional teams\n• Write clean, testable code"} value={form.responsibilities} onChange={e=>setF('responsibilities',e.target.value)}/>
              </div>
              {/* Requirements */}
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Qualifications & Requirements</label>
                <textarea className="form-input" rows={3} placeholder={"List requirements, one per line:\n• Currently pursuing a degree in CS or related field\n• Strong communication skills\n• Python experience preferred"} value={form.requirements} onChange={e=>setF('requirements',e.target.value)}/>
              </div>
              {/* Tags */}
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Skills Tags (comma-separated)</label>
                <input className="form-input" placeholder="JavaScript, React, On-site, Paid" value={form.tags} onChange={e=>setF('tags',e.target.value)}/>
              </div>
              {/* Apply mode */}
              <div style={{padding:14,borderRadius:10,background:'var(--bg2)',border:'1px solid var(--border)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>How should students apply?</div>
                {isSchool&&form.is_for_other_company?(
                  <div>
                    <div style={{fontSize:12.5,color:'var(--text2)',marginBottom:10,lineHeight:1.5}}>
                      Since this opportunity is from <strong>{form.original_company_name||'another company'}</strong>, applications must go to their site. Paste the URL where students should apply.
                    </div>
                    <div className="form-group" style={{margin:0}}>
                      <label className="form-label">External Apply URL *</label>
                      <input className="form-input" placeholder="https://company.com/careers/role-id" value={form.apply_url} onChange={e=>setF('apply_url',e.target.value)}/>
                    </div>
                  </div>
                ):(
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',padding:8,borderRadius:6,background:form.apply_mode==='in_app'?'rgba(79,70,229,.08)':'transparent'}}>
                      <input type="radio" name="apply_mode" checked={form.apply_mode==='in_app'} onChange={()=>setF('apply_mode','in_app')} style={{marginTop:3}}/>
                      <div>
                        <div style={{fontSize:13,fontWeight:600}}>Receive applications in ALU Hub</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>Students apply through the app. CVs, cover notes, and messages land in your ALU Hub inbox.</div>
                      </div>
                    </label>
                    <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',padding:8,borderRadius:6,background:form.apply_mode==='external'?'rgba(79,70,229,.08)':'transparent'}}>
                      <input type="radio" name="apply_mode" checked={form.apply_mode==='external'} onChange={()=>setF('apply_mode','external')} style={{marginTop:3}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600}}>Redirect to external apply link</div>
                        <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>The "Apply" button opens your career page (Greenhouse, Workday, Google Form, etc.) in a new tab.</div>
                        {form.apply_mode==='external'&&(
                          <input className="form-input" placeholder="https://yourcompany.com/careers/role-id" value={form.apply_url} onChange={e=>setF('apply_url',e.target.value)}/>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
              {/* Year restriction */}
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Restrict to specific student years (optional)</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {YEARS.map(y=>{
                    const on=(form.allowed_years||[]).includes(y);
                    return (
                      <button key={y} type="button" onClick={()=>toggleYear(y)} style={{
                        padding:'6px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:600,cursor:'pointer',
                        borderColor:on?'var(--green)':'var(--border)',
                        background:on?'rgba(79,70,229,.08)':'var(--bg2)',
                        color:on?'var(--green)':'var(--text2)',
                      }}>{y}</button>
                    );
                  })}
                </div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>
                  {(form.allowed_years||[]).length===0
                    ? 'Leave all unselected to make this visible to all students.'
                    : `Only students in: ${form.allowed_years.join(', ')} will see this listing.`}
                </div>
              </div>
              {/* Actions */}
              <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4}}>
                <button className="btn btn-ghost" onClick={()=>{setShowCreate(false);setEditId(null);}}>Cancel</button>
                <button className="btn btn-primary" disabled={posting} onClick={handlePost} style={{display:'flex',alignItems:'center',gap:6}}>
                  <span className="material-symbols-rounded" style={{fontSize:16}}>{editId?'save':'send'}</span>
                  {posting?'Posting…':editId?'Save Changes':`Post ${form.listing_type}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:0}}>
        {[['all','All'],['active','Open'],['closed','Closed']].map(([v,lbl])=>(
          <button key={v} onClick={()=>setTab(v)} style={{
            padding:'9px 18px',background:'transparent',border:'none',borderBottom:tab===v?'2px solid var(--accent)':'2px solid transparent',
            fontSize:13.5,fontWeight:tab===v?700:500,color:tab===v?'var(--accent)':'var(--text2)',
            cursor:'pointer',transition:'all .15s',whiteSpace:'nowrap',
          }}>
            {lbl} <span style={{fontSize:12,opacity:.7}}>({counts[v]})</span>
          </button>
        ))}
      </div>

      {/* Listings feed */}
      {!listings?(
        <div style={{padding:60,textAlign:'center',color:'var(--text3)'}}>Loading…</div>
      ):filtered.length===0?(
        <div className="card" style={{textAlign:'center',padding:56}}>
          <span className="material-symbols-rounded" style={{fontSize:52,color:'var(--text3)',display:'block',marginBottom:14}}>inbox</span>
          <div style={{fontWeight:700,fontSize:16,color:'var(--text)',marginBottom:6}}>
            {tab==='all'?'No listings yet':'No '+tab+' listings'}
          </div>
          <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,maxWidth:300,margin:'0 auto 20px'}}>
            {tab==='all'?'Post your first listing and reach 500+ students immediately.':'Try a different filter above.'}
          </div>
          {tab==='all'&&(
            <button className="btn btn-primary" onClick={()=>setShowCreate(true)}>
              <span className="material-symbols-rounded" style={{fontSize:16}}>add</span> Create your first listing
            </button>
          )}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {filtered.map((l,i)=>{
            const lm=listingTypeBadge[l.listing_type]||{color:'var(--accent)',bg:'rgba(99,102,241,.1)',icon:'work'};
            const isActive=l.status==='active';
            const isDeleting=deletingId===l.id;
            const isToggling=togglingId===l.id;
            const daysAgo=Math.floor((Date.now()-new Date(l.created_at))/86400000);
            const deadlinePassed=l.deadline&&new Date(l.deadline)<new Date();
            const appCount=l.appCount||0;

            return(
              <div key={l.id}
                className="anim"
                style={{
                  animationDelay:i*.05+'s',
                  background:'var(--card)',
                  border:`1.5px solid ${isActive?lm.color+'33':'var(--border)'}`,
                  borderRadius:16,
                  overflow:'hidden',
                  boxShadow:isActive?`0 2px 16px ${lm.color}18`:'0 1px 6px rgba(0,0,0,.04)',
                  opacity:isDeleting?.4:1,
                  transition:'all .2s',
                  cursor:'pointer',
                  display:'flex',
                  flexDirection:'column',
                }}
                onClick={()=>setSelectedListing(l)}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 6px 28px ${lm.color}28`;e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow=isActive?`0 2px 16px ${lm.color}18`:'0 1px 6px rgba(0,0,0,.04)';e.currentTarget.style.transform='';}}
              >
                <div style={{height:4,background:isActive?lm.color:'var(--border2)',borderRadius:'0'}}/>
                <div style={{padding:'16px 20px 14px',display:'flex',flexDirection:'column',gap:0,flex:1}}>
                  {/* ── HEADER: company avatar + title ── */}
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
                    {/* Company avatar / logo */}
                    <div style={{width:46,height:46,borderRadius:12,flexShrink:0,overflow:'hidden',border:'1.5px solid var(--border)',background:lm.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {companyAvatar
                        ?<img src={companyAvatar} alt={companyName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{companyInitials}</div>
                      }
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,fontWeight:700,color:lm.color,textTransform:'uppercase',letterSpacing:.4}}>{l.listing_type||'Listing'}</span>
                        <span style={{width:3,height:3,borderRadius:'50%',background:'var(--text3)',flexShrink:0}}/>
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,color:isActive?'#10B981':'#9CA3AF'}}>
                          <span style={{width:6,height:6,borderRadius:'50%',background:isActive?'#10B981':'#9CA3AF',display:'inline-block',boxShadow:isActive?'0 0 0 3px rgba(16,185,129,.2)':''}}/>
                          {isActive?'Live':'Closed'}
                        </span>
                        <span style={{marginLeft:'auto',fontSize:11,color:'var(--text3)'}}>{daysAgo===0?'Today':daysAgo===1?'Yesterday':`${daysAgo}d ago`}</span>
                      </div>
                      <div style={{fontSize:15,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.25,letterSpacing:'-.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</div>
                      <div style={{fontSize:12,color:'var(--text3)',marginTop:1}}>{companyName}</div>
                    </div>
                  </div>

                  {/* ── META PILLS ── */}
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10,alignItems:'center'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:appCount>0?'rgba(99,102,241,.09)':'var(--bg2)',border:`1px solid ${appCount>0?'rgba(99,102,241,.2)':'var(--border)'}`,color:appCount>0?'#6366F1':'var(--text3)'}}>
                      <span className="material-symbols-rounded" style={{fontSize:12}}>group</span>
                      <span style={{fontSize:11,fontWeight:700}}>{appCount} {appCount===1?'applicant':'applicants'}</span>
                    </div>
                    {l.location&&<div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--text2)'}}><span className="material-symbols-rounded" style={{fontSize:12}}>location_on</span><span style={{fontSize:11,fontWeight:500}}>{l.location}</span></div>}
                    {l.pay&&<div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--text2)'}}><span className="material-symbols-rounded" style={{fontSize:12}}>payments</span><span style={{fontSize:11,fontWeight:500}}>{l.pay}</span></div>}
                    {l.duration&&<div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--text2)'}}><span className="material-symbols-rounded" style={{fontSize:12}}>schedule</span><span style={{fontSize:11,fontWeight:500}}>{l.duration}</span></div>}
                    {l.deadline&&<div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,background:deadlinePassed?'rgba(239,68,68,.07)':'var(--bg2)',border:`1px solid ${deadlinePassed?'rgba(239,68,68,.2)':'var(--border)'}`,color:deadlinePassed?'#EF4444':'var(--text2)'}}><span className="material-symbols-rounded" style={{fontSize:12}}>event</span><span style={{fontSize:11,fontWeight:500}}>{deadlinePassed?'Expired':'Due'} {new Date(l.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span></div>}
                  </div>

                  {/* ── DESCRIPTION ── */}
                  {l.description&&<div style={{fontSize:12.5,color:'var(--text2)',lineHeight:1.65,marginBottom:10,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',textAlign:'left'}}>{l.description}</div>}

                  {/* ── TAGS ── */}
                  {l.tags&&l.tags.length>0&&(
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10,justifyContent:'flex-start'}}>
                      {l.tags.slice(0,5).map(t=>(<span key={t} style={{padding:'2px 9px',borderRadius:10,fontSize:11,fontWeight:500,background:'var(--bg3)',color:'var(--text2)',border:'1px solid var(--border)'}}>{t}</span>))}
                    </div>
                  )}

                  {/* ── ACTIONS ── */}
                  <div style={{borderTop:'1px solid var(--border)',paddingTop:11,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:'auto'}}>
                    <div style={{display:'flex',gap:5}}>
                      <button disabled={isToggling||isDeleting} onClick={e=>{e.stopPropagation();toggleStatus(l);}} className="btn btn-ghost btn-sm" style={{gap:4,display:'flex',alignItems:'center',fontSize:11.5,color:isActive?'#6B7280':'#10B981',padding:'4px 10px'}}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>{isActive?'toggle_off':'toggle_on'}</span>
                        {isToggling?'…':isActive?'Close':'Reopen'}
                      </button>
                      <button onClick={e=>{e.stopPropagation();startEdit(l);}} className="btn btn-ghost btn-sm" style={{gap:4,display:'flex',alignItems:'center',fontSize:11.5,padding:'4px 10px'}}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>edit</span>Edit
                      </button>
                      <button disabled={isDeleting} onClick={e=>{e.stopPropagation();deleteListing(l);}} className="btn btn-ghost btn-sm" style={{gap:4,display:'flex',alignItems:'center',fontSize:11.5,color:'#EF4444',padding:'4px 10px'}}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>delete_outline</span>{isDeleting?'…':'Delete'}
                      </button>
                    </div>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:700,color:lm.color}}>
                      View Details <span className="material-symbols-rounded" style={{fontSize:14}}>arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── POST JOB (company) ────────────────────────────────
function PostJob({user}){
  // School accounts get an extra section to forward another employer's role.
  const isSchool=user?.userType==='school';
  const YEARS=['Year 1','Year 2','Year 3','Year 4'];

  const [form,setForm]=useState({
    listing_type:'Internship',
    title:'',
    type:'Tech',
    location:'Kigali, Rwanda',
    pay:'',
    duration:'',
    deadline:'',
    description:'',
    responsibilities:'',
    requirements:'',
    tags:'',
    // Apply mode — either native (in-app) or external (redirect to URL)
    apply_mode:'in_app',          // 'in_app' | 'external'
    apply_url:'',
    // Year restriction (empty = all years)
    allowed_years:[],
    // School-only: this listing is for another employer
    is_for_other_company:false,
    original_company_name:'',
    original_company_logo_url:'',
  });
  const [loading,setLoading]=useState(false);
  const [logoUploading,setLogoUploading]=useState(false);
  const logoFileRef=useRef();
  function set(k,v){setForm(f=>({...f,[k]:v}));}
  function toggleYear(y){
    setForm(f=>({
      ...f,
      allowed_years:f.allowed_years.includes(y)
        ? f.allowed_years.filter(x=>x!==y)
        : [...f.allowed_years,y],
    }));
  }

  // Mirrors compressImage in CompanyProfilePage — kept local so PostJob
  // is self-contained.
  async function compressImage(file,maxPx=600,quality=0.78){
    return new Promise(resolve=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        const scale=Math.min(1,maxPx/Math.max(img.width,img.height));
        const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        canvas.toBlob(blob=>resolve(blob),'image/webp',quality);
        URL.revokeObjectURL(url);
      };
      img.src=url;
    });
  }

  async function handleOtherCompanyLogoUpload(e){
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size>10*1024*1024){toast('Image too large (max 10MB)');return;}
    setLogoUploading(true);
    try{
      const blob=await compressImage(file,600);
      const uid=user?.user?.id;
      const path=`external_logos/${uid||'anon'}/${Date.now()}.webp`;
      const c=getSB();
      const {error}=await c.storage.from('aluhub-media').upload(path,blob,{upsert:true,contentType:'image/webp',cacheControl:'0'});
      if(error){toast('Upload failed: '+error.message);return;}
      const {data}=c.storage.from('aluhub-media').getPublicUrl(path);
      set('original_company_logo_url',data.publicUrl+'?t='+Date.now());
      toast('Logo uploaded ✓');
    }catch(err){toast('Upload failed: '+err.message);}
    finally{setLogoUploading(false);}
  }

  async function submit(){
    if(!form.title.trim()){toast('Title is required.');return;}
    if(!form.description.trim()){toast('Description is required.');return;}
    if(form.apply_mode==='external'){
      const u=form.apply_url.trim();
      if(!u){toast('Please paste the external apply URL.');return;}
      if(!/^https?:\/\//i.test(u)){toast('Apply URL must start with http:// or https://');return;}
    }
    if(isSchool&&form.is_for_other_company&&!form.original_company_name.trim()){
      toast('Please enter the other company’s name.');return;
    }
    setLoading(true);
    const c=getSB();
    const uid=user?.user?.id;
    if(c&&uid){
      const payload={
        company_id:uid,
        title:form.title.trim(),
        description:form.description.trim(),
        responsibilities:form.responsibilities.trim(),
        requirements:form.requirements.trim(),
        listing_type:form.listing_type,
        type:form.type,
        location:form.location,
        pay:form.pay,
        duration:form.duration,
        deadline:form.deadline||null,
        tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        status:'active',
        // New columns
        apply_url:form.apply_mode==='external'?form.apply_url.trim():null,
        posted_by_role:isSchool?'school':'company',
        original_company_name:(isSchool&&form.is_for_other_company)?form.original_company_name.trim():null,
        original_company_logo_url:(isSchool&&form.is_for_other_company)?(form.original_company_logo_url||null):null,
        allowed_years:form.allowed_years,
      };
      const {error}=await c.from('job_listings').insert(payload).select().single();

      if(error){
        toast('Failed to post: '+error.message);
        setLoading(false);
        return;
      }

      // Notify the poster
      await dbSendNotif(uid,'new_job',`${form.listing_type} listing is live!`,`"${form.title}" is now visible to ${form.allowed_years.length?form.allowed_years.join(' + '):'all'} students.`);

      // Notify students (only those eligible by year if restricted)
      let q=c.from('profiles').select('id,year').eq('user_type','student');
      const {data:students}=await q;
      const eligible=(students||[]).filter(s=>{
        if(!form.allowed_years.length) return true;
        return s.year && form.allowed_years.includes(s.year);
      });
      if(eligible.length){
        const notifs=eligible.map(s=>({
          user_id:s.id,
          type:'new_listing',
          title:`New ${form.listing_type}: ${form.title}`,
          body:`A new ${form.listing_type.toLowerCase()} just posted on ALU Hub. Check it out!`,
          read:false,
        }));
        await c.from('notifications').insert(notifs);
      }
    }
    setLoading(false);
    toast(`${form.listing_type} posted! Students are being notified. 🎉`);
    setForm({
      listing_type:'Internship',title:'',type:'Tech',location:'Kigali, Rwanda',pay:'',
      duration:'',deadline:'',description:'',responsibilities:'',requirements:'',tags:'',
      apply_mode:'in_app',apply_url:'',allowed_years:[],
      is_for_other_company:false,original_company_name:'',original_company_logo_url:'',
    });
  }

  return(
    <div>
      <div className="topbar anim">
        <div>
          <div className="page-title">Post a Listing</div>
          <div className="page-sub">{isSchool
            ? 'Post an opportunity for ALU students — your own role or one from an external employer.'
            : 'Create an internship or job listing — goes live immediately and notifies all students.'}</div>
        </div>
      </div>
      <div className="card anim" style={{maxWidth:600}}>

        {/* ── SCHOOL-ONLY: post on behalf of another company ── */}
        {isSchool&&(
          <div className="form-group" style={{padding:14,borderRadius:10,background:'rgba(79,70,229,.06)',border:'1px solid var(--border)'}}>
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
              <input type="checkbox" checked={form.is_for_other_company} onChange={e=>set('is_for_other_company',e.target.checked)}/>
              <span style={{fontWeight:600,fontSize:13}}>This opportunity is from another company</span>
            </label>
            <div style={{fontSize:11.5,color:'var(--text3)',marginTop:4,marginLeft:24}}>
              Tick this if you are forwarding an external employer's role (e.g. Microsoft, Safaricom). Leave unticked if it's an ALU role.
            </div>
            {form.is_for_other_company&&(
              <div style={{marginTop:12,paddingLeft:24}}>
                <div className="form-group" style={{marginBottom:10}}>
                  <label className="form-label">Company Name *</label>
                  <input className="form-input" placeholder="e.g. Microsoft" value={form.original_company_name} onChange={e=>set('original_company_name',e.target.value)}/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Company Logo</label>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    {form.original_company_logo_url
                      ? <img src={form.original_company_logo_url} alt="" style={{width:48,height:48,borderRadius:8,objectFit:'cover',border:'1px solid var(--border)'}}/>
                      : <div style={{width:48,height:48,borderRadius:8,background:'var(--bg3)',border:'1px dashed var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)'}}>
                          <span className="material-symbols-rounded" style={{fontSize:20}}>image</span>
                        </div>
                    }
                    <input type="file" ref={logoFileRef} accept="image/*" style={{display:'none'}} onChange={handleOtherCompanyLogoUpload}/>
                    <button type="button" className="btn btn-outline" style={{fontSize:12,padding:'6px 12px'}}
                      disabled={logoUploading} onClick={()=>logoFileRef.current?.click()}>
                      <span className="material-symbols-rounded" style={{fontSize:14}}>upload</span>
                      {logoUploading?'Uploading…':(form.original_company_logo_url?'Replace':'Upload Logo')}
                    </button>
                    {form.original_company_logo_url&&(
                      <button type="button" className="btn btn-outline" style={{fontSize:12,padding:'6px 12px'}}
                        onClick={()=>set('original_company_logo_url','')}>Remove</button>
                    )}
                  </div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>
                    Used on the job card instead of ALU's logo. If you don't upload one, ALU's logo will be shown with the company name in the badge.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Listing type selector */}
        <div className="form-group">
          <label className="form-label">Listing Type</label>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {['Internship','Full-time Job','Part-time Job','Freelance'].map(t=>(
              <button key={t} onClick={()=>set('listing_type',t)} style={{
                padding:'8px 16px',borderRadius:8,border:'1.5px solid',fontSize:13,fontWeight:600,cursor:'pointer',
                borderColor:form.listing_type===t?'var(--green)':'var(--border)',
                background:form.listing_type===t?'rgba(79,70,229,.08)':'var(--bg2)',
                color:form.listing_type===t?'var(--green)':'var(--text2)',
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div className="form-group"><label className="form-label">Title *</label><input className="form-input" placeholder={`e.g. ${form.listing_type==='Internship'?'Software Engineer Intern':'Product Manager'}`} value={form.title} onChange={e=>set('title',e.target.value)}/></div>

        <div className="two-col">
          <div className="form-group"><label className="form-label">Category</label>
            <select className="form-input" value={form.type} onChange={e=>set('type',e.target.value)}>
              <option>Tech</option><option>Finance</option><option>Policy</option><option>Marketing</option>
              <option>Education</option><option>Design</option><option>Research</option><option>Other</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e=>set('location',e.target.value)}/></div>
        </div>

        <div className="two-col">
          <div className="form-group"><label className="form-label">{form.listing_type==='Internship'?'Stipend':'Salary'}</label><input className="form-input" placeholder="e.g. RWF 200,000/mo or Unpaid" value={form.pay} onChange={e=>set('pay',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Duration</label><input className="form-input" placeholder="e.g. 3 months" value={form.duration} onChange={e=>set('duration',e.target.value)}/></div>
        </div>

        <div className="form-group"><label className="form-label">Application Deadline</label><input className="form-input" type="date" value={form.deadline} onChange={e=>set('deadline',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">About This Role *</label><textarea className="form-input" rows={4} placeholder={`Overview: What will the ${form.listing_type==='Internship'?'intern':'hire'} work on? What team will they join?`} value={form.description} onChange={e=>set('description',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Responsibilities</label><textarea className="form-input" rows={4} placeholder={"List key responsibilities, one per line:\n• Design and build new features\n• Collaborate with cross-functional teams"} value={form.responsibilities} onChange={e=>set('responsibilities',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Qualifications & Requirements</label><textarea className="form-input" rows={3} placeholder={"List requirements, one per line:\n• Currently pursuing a CS degree\n• Strong communication skills"} value={form.requirements} onChange={e=>set('requirements',e.target.value)}/></div>
        <div className="form-group"><label className="form-label">Skills Tags (comma-separated)</label><input className="form-input" placeholder="JavaScript, React, On-site, Paid" value={form.tags} onChange={e=>set('tags',e.target.value)}/></div>

        {/* ── APPLY MODE ── */}
        <div className="form-group" style={{padding:14,borderRadius:10,background:'var(--bg2)',border:'1px solid var(--border)'}}>
          <label className="form-label" style={{marginBottom:8}}>How should students apply?</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',padding:8,borderRadius:6,background:form.apply_mode==='in_app'?'rgba(79,70,229,.08)':'transparent'}}>
              <input type="radio" name="apply_mode" checked={form.apply_mode==='in_app'} onChange={()=>set('apply_mode','in_app')} style={{marginTop:3}}/>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>Receive applications in ALU Hub</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>Students apply through the app. CVs, cover notes, and messages land in your ALU Hub inbox.</div>
              </div>
            </label>
            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',padding:8,borderRadius:6,background:form.apply_mode==='external'?'rgba(79,70,229,.08)':'transparent'}}>
              <input type="radio" name="apply_mode" checked={form.apply_mode==='external'} onChange={()=>set('apply_mode','external')} style={{marginTop:3}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>Redirect to external apply link</div>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>The "Apply" button opens your career page (Greenhouse, Workday, Google Form, etc.) in a new tab.</div>
                {form.apply_mode==='external'&&(
                  <input className="form-input" placeholder="https://yourcompany.com/careers/role-id" value={form.apply_url} onChange={e=>set('apply_url',e.target.value)}/>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* ── YEAR RESTRICTION ── */}
        <div className="form-group">
          <label className="form-label">Restrict to specific student years (optional)</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {YEARS.map(y=>{
              const on=form.allowed_years.includes(y);
              return (
                <button key={y} type="button" onClick={()=>toggleYear(y)} style={{
                  padding:'6px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:600,cursor:'pointer',
                  borderColor:on?'var(--green)':'var(--border)',
                  background:on?'rgba(79,70,229,.08)':'var(--bg2)',
                  color:on?'var(--green)':'var(--text2)',
                }}>{y}</button>
              );
            })}
          </div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>
            {form.allowed_years.length===0
              ? 'Leave all unselected to make this visible to all students.'
              : `Only students in: ${form.allowed_years.join(', ')} will see this listing.`}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" disabled={loading} onClick={submit}>
            <span className="material-symbols-rounded" style={{fontSize:16}}>send</span>
            {loading?'Posting…':`Post ${form.listing_type} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PROFILE PAGE ─────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
//  FULL APPLICANT VIEW PAGE
// ═══════════════════════════════════════════════════════════════
function ApplicantViewPage({app, allApps, onBack, onStatusChange, onMessage, currentUid, user}) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [msgs, setMsgs] = React.useState([]);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [pdfViewer, setPdfViewer] = React.useState(null);
  const [localStatus, setLocalStatus] = React.useState(app?.status || 'pending');
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  const [mobilePanel, setMobilePanel] = React.useState(false); // mobile sidebar toggle
  const bottomRef = React.useRef();

  const idx = allApps ? allApps.findIndex(a => a.id === app.id) : -1;
  const prevApp = idx > 0 ? allApps[idx - 1] : null;
  const nextApp = idx >= 0 && idx < allApps.length - 1 ? allApps[idx + 1] : null;

  React.useEffect(() => { setLocalStatus(app?.status || 'pending'); }, [app?.id]);

  React.useEffect(() => {
    if (!app?.id) return;
    dbGetMsgs(app.id).then(setMsgs);
    if (app.status === 'pending') {
      dbSetStatus(app.id, 'reviewed', app?.student_id || app?.student?.id, app?.job?.title);
      onStatusChange && onStatusChange(app.id, 'reviewed');
    }
    const c = getSB(); if (!c) return;
    const ch = c.channel('av-msgs-' + app.id)
      .on('postgres_changes', {event:'INSERT', schema:'public', table:'messages', filter:`application_id=eq.${app.id}`}, () => {
        dbGetMsgs(app.id).then(setMsgs);
      }).subscribe();
    return () => c.removeChannel(ch);
  }, [app?.id]);

  React.useEffect(() => {
    if (activeTab === 'messages') bottomRef.current?.scrollIntoView({behavior:'smooth'});
  }, [msgs, activeTab]);

  async function handleStatus(newStatus) {
    if (statusUpdating) return;
    setStatusUpdating(true);
    try {
      const target = (localStatus === newStatus) ? 'reviewed' : newStatus;
      await dbSetStatus(app.id, target, app?.student_id || app?.student?.id, app?.job?.title);
      setLocalStatus(target);
      onStatusChange && onStatusChange(app.id, target);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function sendMsg() {
    if (!text.trim() || !app?.id) return;
    setSending(true);
    try {
      const recipientId = app?.student_id || app?.student?.id;
      const senderName = user?.profile?.company_name || user?.profile?.full_name || 'Company';
      await dbSendMsg(currentUid, app.id, text.trim(), recipientId, senderName);
      setText('');
      dbGetMsgs(app.id).then(setMsgs);
    } finally {
      setSending(false);
    }
  }

  const st = app?.student || {};
  const job = app?.job || {};
  const initials = (st.full_name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const isPdf = url => url && (url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application%2Fpdf'));
  const firstName = st.full_name ? st.full_name.split(' ')[0] : 'Applicant';

  const STATUS_CFG = {
    pending:     {label:'New',         color:'#F59E0B', bg:'rgba(245,158,11,.12)',  icon:'schedule'},
    reviewed:    {label:'Reviewed',    color:'#3B82F6', bg:'rgba(59,130,246,.12)', icon:'visibility'},
    shortlisted: {label:'Shortlisted', color:'#10B981', bg:'rgba(16,185,129,.12)', icon:'star'},
    hired:       {label:'Accepted',    color:'#7D52AD', bg:'rgba(125,82,173,.12)', icon:'workspace_premium'},
    rejected:    {label:'Declined',    color:'#EF4444', bg:'rgba(239,68,68,.1)',   icon:'cancel'},
  };
  const sc = STATUS_CFG[localStatus] || STATUS_CFG.pending;

  const DOCS = [
    {key:'cv_url',            label:'CV / Resume',      icon:'description',       color:'#6366F1'},
    {key:'cover_url',         label:'Cover Letter',     icon:'mail',              color:'#0A2E5C'},
    {key:'transcript_url',    label:'Transcript',       icon:'school',            color:'#10B981'},
    {key:'recommendation_url',label:'Recommendation',  icon:'verified_user',     color:'#F59E0B'},
    {key:'portfolio_url',     label:'Portfolio',        icon:'folder_open',       color:'#8B5CF6'},
    {key:'certificate_url',   label:'Certificate',      icon:'workspace_premium', color:'#EC4899'},
    {key:'id_url',            label:'ID / Passport',    icon:'badge',             color:'#3B82F6'},
  ].filter(d => app[d.key]);

  const ACTIONS = [
    {status:'shortlisted', label:'Shortlist',   doneLabel:'Shortlisted ✓', icon:'star',              color:'#10B981', bg:'rgba(16,185,129,.12)'},
    {status:'hired',       label:'Accept / Hire', doneLabel:'Accepted ✓',  icon:'workspace_premium', color:'#7D52AD', bg:'rgba(125,82,173,.12)'},
    {status:'rejected',    label:'Decline',     doneLabel:'Declined',      icon:'close',             color:'#EF4444', bg:'rgba(239,68,68,.08)'},
  ];

  const isViewerCompany = user?.userType === 'company' || user?.userType === 'school';
  const TABS = [
    {id:'overview',  label:'Overview',   icon:'person'},
    {id:'documents', label:`Documents${DOCS.length > 0 ? ' ('+DOCS.length+')' : ''}`, icon:'folder_open'},
    ...(!isViewerCompany ? [{id:'messages', label:`Messages${msgs.length > 0 ? ' ('+msgs.length+')' : ''}`, icon:'chat_bubble'}] : []),
  ];

  // Responsive CSS injected once
  const cssId = 'apv-responsive-css';
  if (!document.getElementById(cssId)) {
    const s = document.createElement('style');
    s.id = cssId;
    s.textContent = `
      .apv-root { display:flex; flex-direction:column; min-height:100vh; background:var(--bg); }
      .apv-topbar { background:var(--card); border-bottom:1px solid var(--border); padding:0 24px; display:flex; align-items:center; gap:10px; height:60px; flex-shrink:0; position:sticky; top:0; z-index:100; box-shadow:0 2px 10px rgba(0,0,0,.07); }
      .apv-topbar-back { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:10px; background:var(--bg3); border:1px solid var(--border); font-size:13px; font-weight:600; color:var(--text2); cursor:pointer; transition:all .15s; white-space:nowrap; flex-shrink:0; }
      .apv-topbar-back:hover { border-color:var(--accent); color:var(--accent); }
      .apv-topbar-crumb { flex:1; display:flex; align-items:center; gap:6px; font-size:13px; min-width:0; overflow:hidden; }
      .apv-topbar-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
      .apv-topbar-nav { display:flex; align-items:center; gap:6px; padding-left:10px; border-left:1px solid var(--border); flex-shrink:0; }
      .apv-btn-shortlist { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; background:rgba(16,185,129,.1); border:1.5px solid rgba(16,185,129,.35); font-size:12.5px; font-weight:700; color:#10B981; cursor:pointer; transition:all .15s; white-space:nowrap; }
      .apv-btn-shortlist:hover:not(:disabled) { background:rgba(16,185,129,.2); }
      .apv-btn-shortlist:disabled { opacity:.5; cursor:not-allowed; }
      .apv-btn-accept { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; background:rgba(125,82,173,.1); border:1.5px solid rgba(125,82,173,.35); font-size:12.5px; font-weight:700; color:#7D52AD; cursor:pointer; transition:all .15s; white-space:nowrap; }
      .apv-btn-accept:hover:not(:disabled) { background:rgba(125,82,173,.2); }
      .apv-btn-accept:disabled { opacity:.5; cursor:not-allowed; }
      .apv-btn-decline { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; background:rgba(239,68,68,.07); border:1.5px solid rgba(239,68,68,.3); font-size:12.5px; font-weight:700; color:#EF4444; cursor:pointer; transition:all .15s; white-space:nowrap; }
      .apv-btn-decline:hover:not(:disabled) { background:rgba(239,68,68,.15); }
      .apv-btn-decline:disabled { opacity:.5; cursor:not-allowed; }
      .apv-btn-reopen { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; background:var(--bg3); border:1px solid var(--border); font-size:12.5px; font-weight:700; color:var(--text2); cursor:pointer; transition:all .15s; }
      .apv-btn-reopen:hover:not(:disabled) { border-color:var(--accent); color:var(--accent); }
      .apv-layout { display:flex; flex:1; width:100%; max-width:1500px; margin:0 auto; padding:28px 28px 60px; gap:28px; align-items:flex-start; box-sizing:border-box; }
      .apv-sidebar { width:320px; flex-shrink:0; display:flex; flex-direction:column; gap:14px; position:sticky; top:70px; max-height:calc(100vh - 90px); overflow-y:auto; }
      .apv-sidebar::-webkit-scrollbar { width:0; }
      .apv-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:0; }
      .apv-hero { background:linear-gradient(145deg,#071e3d 0%,#0A2E5C 55%,#1a4a80 100%); padding:32px 22px 24px; display:flex; flex-direction:column; align-items:center; gap:12px; position:relative; }
      .apv-hero-overlay { position:absolute; inset:0; background:radial-gradient(circle at 70% 20%,rgba(255,255,255,.07) 0%,transparent 60%); pointer-events:none; }
      .apv-hero-avatar { width:90px; height:90px; border-radius:50%; background:rgba(255,255,255,.18); border:3px solid rgba(255,255,255,.4); display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:800; color:#fff; overflow:hidden; flex-shrink:0; box-shadow:0 8px 28px rgba(0,0,0,.35); }
      .apv-decision-btn { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:11px; font-size:13px; font-weight:700; cursor:pointer; transition:all .18s; width:100%; text-align:left; border:1.5px solid var(--border); background:transparent; color:var(--text2); }
      .apv-decision-btn:hover:not(:disabled) { transform:translateX(2px); }
      .apv-decision-btn:disabled { opacity:.55; cursor:not-allowed; }
      .apv-decision-btn.active-shortlisted { border-color:#10B981; background:rgba(16,185,129,.12); color:#10B981; }
      .apv-decision-btn.active-hired { border-color:#7D52AD; background:rgba(125,82,173,.12); color:#7D52AD; }
      .apv-decision-btn.active-rejected { border-color:#EF4444; background:rgba(239,68,68,.08); color:#EF4444; }
      .apv-decision-btn:not(:disabled):not(.active-shortlisted):not(.active-hired):not(.active-rejected):hover { border-color:var(--accent); color:var(--accent); background:rgba(10,46,92,.05); }
      .apv-tab-bar { display:flex; background:var(--card); border:1px solid var(--border); border-radius:16px 16px 0 0; border-bottom:none; overflow:hidden; }
      .apv-tab { flex:1; padding:14px 0; border:none; font-size:13.5px; background:transparent; color:var(--text3); border-bottom:2.5px solid transparent; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:7px; font-weight:500; }
      .apv-tab.active { font-weight:700; color:var(--accent); background:rgba(10,46,92,.04); border-bottom-color:var(--accent); }
      .apv-tab-content { background:var(--card); border:1px solid var(--border); border-top:none; border-radius:0 0 16px 16px; min-height:400px; }
      .apv-mobile-actions-bar { display:none; }
      @media (max-width: 900px) {
        .apv-topbar { padding:0 14px; gap:8px; height:56px; }
        .apv-topbar-back span.back-label { display:none; }
        .apv-topbar-back { padding:8px 10px; }
        .apv-topbar-actions .apv-btn-shortlist span.btn-label,
        .apv-topbar-actions .apv-btn-accept span.btn-label,
        .apv-topbar-actions .apv-btn-decline span.btn-label,
        .apv-topbar-actions .apv-btn-reopen span.btn-label { display:none; }
        .apv-topbar-actions button { padding:8px 10px; }
        .apv-layout { flex-direction:column; padding:16px 14px 60px; gap:0; }
        .apv-sidebar { width:100%; position:static; max-height:none; overflow-y:visible; display:none; }
        .apv-sidebar.mobile-open { display:flex; margin-bottom:16px; }
        .apv-main { width:100%; }
        .apv-mobile-actions-bar { display:flex; gap:8px; padding:12px 14px; background:var(--card); border-bottom:1px solid var(--border); overflow-x:auto; flex-shrink:0; }
        .apv-topbar-nav span.nav-count { display:none; }
      }
      @media (max-width: 600px) {
        .apv-topbar-actions { display:none; }
        .apv-mobile-actions-bar { display:flex; }
        .apv-layout { padding:12px 10px 60px; }
        .apv-tab { font-size:12px; padding:12px 0; gap:5px; }
        .apv-tab span.tab-label { font-size:11px; }
      }
    `;
    document.head.appendChild(s);
  }

  const topbarActions = (
    <div className="apv-topbar-actions">
      {localStatus !== 'hired' && localStatus !== 'rejected' && localStatus !== 'shortlisted' && (
        <button
          className="apv-btn-shortlist"
          disabled={statusUpdating}
          onClick={() => handleStatus('shortlisted')}
        >
          <span className="material-symbols-rounded" style={{fontSize:15, fontVariationSettings:"'FILL' 1"}}>star</span>
          <span className="btn-label">Shortlist</span>
        </button>
      )}
      {localStatus !== 'hired' && localStatus !== 'rejected' && (
        <button
          className="apv-btn-accept"
          disabled={statusUpdating}
          onClick={() => handleStatus('hired')}
        >
          <span className="material-symbols-rounded" style={{fontSize:15, fontVariationSettings:"'FILL' 1"}}>workspace_premium</span>
          <span className="btn-label">{localStatus === 'shortlisted' ? 'Accept' : 'Accept / Hire'}</span>
        </button>
      )}
      {localStatus !== 'rejected' && localStatus !== 'hired' && (
        <button className="apv-btn-decline" disabled={statusUpdating} onClick={() => handleStatus('rejected')}>
          <span className="material-symbols-rounded" style={{fontSize:15}}>close</span>
          <span className="btn-label">Decline</span>
        </button>
      )}
      {(localStatus === 'rejected' || localStatus === 'hired') && (
        <button className="apv-btn-reopen" disabled={statusUpdating} onClick={() => handleStatus('reviewed')}>
          <span className="material-symbols-rounded" style={{fontSize:15}}>undo</span>
          <span className="btn-label">Reopen</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="apv-root">

      {/* PDF Overlay */}
      {pdfViewer && (
        <div style={{position:'fixed', inset:0, zIndex:500, display:'flex', flexDirection:'column', background:'var(--bg)'}}>
          <div style={{display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--card)', flexShrink:0}}>
            <button onClick={() => setPdfViewer(null)} style={{background:'var(--bg3)', border:'none', borderRadius:8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text2)'}}>
              <span className="material-symbols-rounded" style={{fontSize:18}}>close</span>
            </button>
            <span className="material-symbols-rounded" style={{fontSize:16, color:'var(--accent)'}}>description</span>
            <div style={{flex:1, fontWeight:700, fontSize:14, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{pdfViewer.label} — {st.full_name || 'Applicant'}</div>
            <a href={pdfViewer.url} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:'var(--accent)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', flexShrink:0}}>
              <span className="material-symbols-rounded" style={{fontSize:14}}>open_in_new</span>
              <span style={{display:'none'}} className="back-label">New tab</span>
            </a>
          </div>
          <iframe src={pdfViewer.url + '#toolbar=1&view=FitH'} style={{flex:1, border:'none', width:'100%'}} title={pdfViewer.label} />
        </div>
      )}

      {/* ── TOP NAV BAR ── */}
      <div className="apv-topbar">
        <button className="apv-topbar-back" onClick={onBack}>
          <span className="material-symbols-rounded" style={{fontSize:16}}>arrow_back</span>
          <span className="back-label">Applications</span>
        </button>

        <div className="apv-topbar-crumb">
          <span className="material-symbols-rounded" style={{fontSize:14, color:'var(--text3)', flexShrink:0}}>chevron_right</span>
          <div style={{display:'flex', alignItems:'center', gap:8, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'5px 12px', overflow:'hidden', minWidth:0}}>
            <div style={{width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#0A2E5C,#3a7bd5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0}}>{initials}</div>
            <span style={{fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13}}>{st.full_name || 'Applicant'}</span>
            <span style={{padding:'2px 10px', borderRadius:20, background:sc.bg, color:sc.color, fontSize:10.5, fontWeight:800, flexShrink:0, border:`1px solid ${sc.color}33`}}>{sc.label}</span>
          </div>
        </div>

        {topbarActions}

        {/* Mobile toggle for sidebar */}
        <button onClick={() => setMobilePanel(p => !p)} style={{display:'none', alignItems:'center', gap:5, padding:'7px 10px', borderRadius:9, background:'var(--bg3)', border:'1px solid var(--border)', fontSize:12, fontWeight:600, color:'var(--text2)', cursor:'pointer', flexShrink:0, className:'apv-mobile-toggle'}}
          className="apv-mobile-toggle">
          <span className="material-symbols-rounded" style={{fontSize:15}}>{mobilePanel ? 'expand_less' : 'person'}</span>
        </button>

        <div className="apv-topbar-nav">
          <span className="nav-count" style={{fontSize:12, color:'var(--text3)'}}>{idx+1}/{allApps?.length || 1}</span>
          <button onClick={() => prevApp && onBack('nav', prevApp)} disabled={!prevApp} style={{width:32, height:32, borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:prevApp?'pointer':'not-allowed', opacity:prevApp?1:.35, color:'var(--text2)'}}>
            <span className="material-symbols-rounded" style={{fontSize:16}}>chevron_left</span>
          </button>
          <button onClick={() => nextApp && onBack('nav', nextApp)} disabled={!nextApp} style={{width:32, height:32, borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:nextApp?'pointer':'not-allowed', opacity:nextApp?1:.35, color:'var(--text2)'}}>
            <span className="material-symbols-rounded" style={{fontSize:16}}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* Mobile quick-action bar (below 600px) */}
      <div className="apv-mobile-actions-bar">
        {localStatus !== 'hired' && localStatus !== 'rejected' && localStatus !== 'shortlisted' && (
          <button
            className="apv-btn-shortlist"
            disabled={statusUpdating}
            onClick={() => handleStatus('shortlisted')}
            style={{flexShrink:0}}
          >
            <span className="material-symbols-rounded" style={{fontSize:14, fontVariationSettings:"'FILL' 1"}}>star</span>
            Shortlist
          </button>
        )}
        {localStatus !== 'hired' && localStatus !== 'rejected' && (
          <button
            className="apv-btn-accept"
            disabled={statusUpdating}
            onClick={() => handleStatus('hired')}
            style={{flexShrink:0}}
          >
            <span className="material-symbols-rounded" style={{fontSize:14, fontVariationSettings:"'FILL' 1"}}>workspace_premium</span>
            {localStatus === 'shortlisted' ? 'Accept' : 'Accept / Hire'}
          </button>
        )}
        {localStatus !== 'rejected' && localStatus !== 'hired' && (
          <button className="apv-btn-decline" disabled={statusUpdating} onClick={() => handleStatus('rejected')} style={{flexShrink:0}}>
            <span className="material-symbols-rounded" style={{fontSize:14}}>close</span>
            Decline
          </button>
        )}
        {(localStatus === 'rejected' || localStatus === 'hired') && (
          <button className="apv-btn-reopen" disabled={statusUpdating} onClick={() => handleStatus('reviewed')} style={{flexShrink:0}}>
            <span className="material-symbols-rounded" style={{fontSize:14}}>undo</span>
            Reopen
          </button>
        )}
        {onMessage && (
          <button onClick={() => onMessage(app)} style={{flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background:'var(--accent)', border:'none', fontSize:12.5, fontWeight:700, color:'#fff', cursor:'pointer'}}>
            <span className="material-symbols-rounded" style={{fontSize:14, fontVariationSettings:"'FILL' 1"}}>chat_bubble</span>
            Message
          </button>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="apv-layout">

        {/* ══ LEFT SIDEBAR ══ */}
        <div className={`apv-sidebar${mobilePanel ? ' mobile-open' : ''}`}>

          {/* Candidate hero card */}
          <div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 24px rgba(10,46,92,.09)'}}>
            <div className="apv-hero">
              <div className="apv-hero-overlay"/>
              <div className="apv-hero-avatar">
                {st.avatar_url ? <img src={st.avatar_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : initials}
              </div>
              <div style={{textAlign:'center', zIndex:1}}>
                <div style={{fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-.02em', fontFamily:"'Plus Jakarta Sans',sans-serif", textShadow:'0 1px 6px rgba(0,0,0,.25)'}}>{st.full_name || app.applicant_name || 'Applicant'}</div>
                <div style={{fontSize:13, color:'rgba(255,255,255,.7)', marginTop:4}}>{st.school || 'ALU'}{st.major && ` · ${st.major}`}</div>
              </div>
              <span style={{zIndex:1, padding:'5px 16px', borderRadius:20, background:'rgba(0,0,0,.28)', color:sc.color, fontSize:12, fontWeight:800, border:`1.5px solid ${sc.color}55`, backdropFilter:'blur(8px)', display:'inline-flex', alignItems:'center', gap:6}}>
                <span className="material-symbols-rounded" style={{fontSize:13, fontVariationSettings:"'FILL' 1"}}>{sc.icon}</span>
                {sc.label}
              </span>
            </div>

            {/* Applied for */}
            <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', gap:10, alignItems:'center'}}>
              <span className="material-symbols-rounded" style={{fontSize:18, color:'var(--accent)', flexShrink:0, fontVariationSettings:"'FILL' 1"}}>work</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:10, fontWeight:800, color:'var(--text3)', textTransform:'uppercase', letterSpacing:.7, marginBottom:2}}>Applied for</div>
                <div style={{fontSize:13.5, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{job.title || 'Position'}</div>
                {job.listing_type && <div style={{fontSize:11, color:'var(--text3)', marginTop:1}}>{job.listing_type}</div>}
              </div>
              <div style={{fontSize:11, color:'var(--text3)', flexShrink:0, textAlign:'right'}}>
                {app.created_at && new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
              </div>
            </div>

            {/* Contact info */}
            <div style={{padding:'14px 18px', display:'flex', flexDirection:'column', gap:10}}>
              {[
                {icon:'email',   label:'Email',    val:st.email||app.applicant_email,   href:`mailto:${st.email||app.applicant_email}`},
                {icon:'phone',   label:'Phone',    val:app.applicant_phone,             href:`tel:${app.applicant_phone}`},
                {icon:'link',    label:'LinkedIn', val:app.applicant_linkedin,          href:app.applicant_linkedin?.startsWith('http')?app.applicant_linkedin:'https://'+app.applicant_linkedin},
              ].filter(r => r.val).map((r,i) => (
                <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{width:30, height:30, borderRadius:8, background:'rgba(10,46,92,.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <span className="material-symbols-rounded" style={{fontSize:14, color:'var(--accent)'}}>{r.icon}</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:9.5, color:'var(--text3)', fontWeight:800, textTransform:'uppercase', letterSpacing:.5}}>{r.label}</div>
                    <a href={r.href} target="_blank" rel="noreferrer" style={{fontSize:12.5, color:'var(--accent)', fontWeight:600, textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.val}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          {(app.applicant_school||app.applicant_year||st.school||st.year||st.major) && (
            <div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'14px 18px'}}>
              <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:12}}>
                <span className="material-symbols-rounded" style={{fontSize:16, color:'#10B981', fontVariationSettings:"'FILL' 1"}}>school</span>
                <span style={{fontSize:11, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8}}>Education</span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                {[
                  {label:'University', val:app.applicant_school||st.school},
                  {label:'Year',       val:app.applicant_year||st.year},
                  {label:'Major',      val:st.major},
                ].filter(r=>r.val).map((r,i)=>(
                  <div key={i} style={{gridColumn:r.label==='Major'?'1/-1':'auto'}}>
                    <div style={{fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:.4}}>{r.label}</div>
                    <div style={{fontSize:13, color:'var(--text)', fontWeight:600, marginTop:2}}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision panel */}
          <div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'16px 18px'}}>
            <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:14}}>
              <span className="material-symbols-rounded" style={{fontSize:14, color:'var(--accent)'}}>manage_accounts</span>
              <span style={{fontSize:11, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8}}>Decision</span>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:7}}>
              {ACTIONS.map(b => {
                const active = localStatus === b.status;
                return (
                  <button
                    key={b.status}
                    disabled={statusUpdating}
                    onClick={() => handleStatus(b.status)}
                    className={`apv-decision-btn${active ? ' active-'+b.status : ''}`}
                  >
                    <div style={{width:32, height:32, borderRadius:9, background:active ? b.color+'22' : 'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s'}}>
                      <span className="material-symbols-rounded" style={{fontSize:17, color:active ? b.color : 'var(--text3)', fontVariationSettings:active?"'FILL' 1":"'FILL' 0"}}>{b.icon}</span>
                    </div>
                    <span style={{flex:1}}>{active ? b.doneLabel : b.label}</span>
                    {active && <span className="material-symbols-rounded" style={{fontSize:16, color:b.color}}>check_circle</span>}
                    {statusUpdating && active && <span style={{fontSize:11, opacity:.6}}>…</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message CTA */}
          {onMessage && (
            <button onClick={() => onMessage(app)} className="btn btn-primary" style={{width:'100%', justifyContent:'center', gap:8, fontSize:14, padding:'13px 0', borderRadius:12, boxShadow:'0 4px 14px rgba(10,46,92,.22)'}}>
              <span className="material-symbols-rounded" style={{fontSize:18, fontVariationSettings:"'FILL' 1"}}>chat_bubble</span>
              Message {firstName}
            </button>
          )}
        </div>

        {/* ══ RIGHT MAIN AREA ══ */}
        <div className="apv-main">

          {/* Tab bar */}
          <div className="apv-tab-bar">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`apv-tab${activeTab===t.id ? ' active' : ''}`}>
                <span className="material-symbols-rounded" style={{fontSize:17, fontVariationSettings:activeTab===t.id?"'FILL' 1":"'FILL' 0"}}>{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="apv-tab-content">

            {/* OVERVIEW */}
            {activeTab==='overview' && (
              <div style={{padding:'24px 28px', display:'flex', flexDirection:'column', gap:20}}>

                {app.cover_note && (
                  <div style={{background:'linear-gradient(135deg,rgba(139,92,246,.06),rgba(99,102,241,.04))', border:'1px solid rgba(139,92,246,.2)', borderRadius:14, padding:'18px 22px', borderLeft:'4px solid #8B5CF6'}}>
                    <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10}}>
                      <span className="material-symbols-rounded" style={{fontSize:16, color:'#8B5CF6', fontVariationSettings:"'FILL' 1"}}>format_quote</span>
                      <span style={{fontSize:11, fontWeight:800, color:'#8B5CF6', textTransform:'uppercase', letterSpacing:.9}}>Cover Note</span>
                    </div>
                    <p style={{fontSize:14.5, color:'var(--text)', lineHeight:1.8, margin:0, fontStyle:'italic'}}>"{app.cover_note}"</p>
                  </div>
                )}

                {/* Stats strip */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
                  {[
                    {icon:'calendar_today', label:'Applied', val:app.created_at?new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—', color:'var(--accent)'},
                    {icon:'folder_open',    label:'Documents', val:DOCS.length + ' uploaded', color:'#6366F1'},
                    {icon:'chat_bubble',    label:'Messages',  val:msgs.length + ' sent', color:'#10B981'},
                  ].map((s,i) => (
                    <div key={i} style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 12px', display:'flex', alignItems:'center', gap:10}}>
                      <div style={{width:34, height:34, borderRadius:10, background:s.color+'14', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                        <span className="material-symbols-rounded" style={{fontSize:17, color:s.color, fontVariationSettings:"'FILL' 1"}}>{s.icon}</span>
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:.5}}>{s.label}</div>
                        <div style={{fontSize:13, color:'var(--text)', fontWeight:700, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{s.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contact info */}
                <div>
                  <div style={{fontSize:11, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8, marginBottom:12, display:'flex', alignItems:'center', gap:7}}>
                    <span className="material-symbols-rounded" style={{fontSize:14, color:'var(--accent)'}}>contact_page</span>
                    Contact Information
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:10}}>
                    {[
                      {icon:'person',  label:'Full Name', val:st.full_name||app.applicant_name, plain:true},
                      {icon:'email',   label:'Email',     val:st.email||app.applicant_email,    href:`mailto:${st.email||app.applicant_email}`},
                      {icon:'phone',   label:'Phone',     val:app.applicant_phone,              href:`tel:${app.applicant_phone}`},
                      {icon:'link',    label:'LinkedIn',  val:app.applicant_linkedin,           href:app.applicant_linkedin?.startsWith('http')?app.applicant_linkedin:'https://'+app.applicant_linkedin},
                    ].filter(r=>r.val).map((r,i) => (
                      <div key={i} style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:10}}>
                        <div style={{width:32, height:32, borderRadius:9, background:'rgba(10,46,92,.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                          <span className="material-symbols-rounded" style={{fontSize:15, color:'var(--accent)'}}>{r.icon}</span>
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:.5}}>{r.label}</div>
                          {r.href
                            ? <a href={r.href} target="_blank" rel="noreferrer" style={{fontSize:13, color:'var(--accent)', fontWeight:600, textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.val}</a>
                            : <div style={{fontSize:13, color:'var(--text)', fontWeight:600, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.val}</div>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents quick preview */}
                {DOCS.length > 0 && (
                  <div>
                    <div style={{fontSize:11, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8, marginBottom:12, display:'flex', alignItems:'center', gap:7}}>
                      <span className="material-symbols-rounded" style={{fontSize:14, color:'#6366F1'}}>folder_open</span>
                      Uploaded Documents
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10}}>
                      {DOCS.map(d => (
                        <div key={d.key} style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', transition:'border-color .15s'}}
                          onClick={() => setPdfViewer({url:app[d.key],label:d.label})}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=d.color;}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}>
                          <div style={{width:34, height:34, borderRadius:9, background:d.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                            <span className="material-symbols-rounded" style={{fontSize:18, color:d.color, fontVariationSettings:"'FILL' 1"}}>{d.icon}</span>
                          </div>
                          <div style={{flex:1, minWidth:0}}>
                            <div style={{fontSize:12.5, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.label}</div>
                            <div style={{fontSize:10.5, color:'var(--text3)', marginTop:1}}>Click to preview</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab==='documents' && (
              <div style={{padding:'24px 28px'}}>
                {DOCS.length === 0 ? (
                  <div style={{textAlign:'center', padding:'64px 0', color:'var(--text3)'}}>
                    <span className="material-symbols-rounded" style={{display:'block', fontSize:52, marginBottom:14, opacity:.3}}>folder_off</span>
                    <div style={{fontSize:15, fontWeight:700, marginBottom:6, color:'var(--text2)'}}>No documents uploaded</div>
                    <div style={{fontSize:13}}>This applicant didn't submit any files.</div>
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:12}}>
                    <div style={{fontSize:13, color:'var(--text3)', marginBottom:4}}>{DOCS.length} document{DOCS.length!==1?'s':''} submitted</div>
                    {DOCS.map(d => (
                      <div key={d.key} style={{border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', background:'var(--bg2)'}}>
                        <div style={{display:'flex', alignItems:'center', gap:14, padding:'14px 18px', flexWrap:'wrap', gap:12}}>
                          <div style={{width:46, height:46, borderRadius:12, background:d.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                            <span className="material-symbols-rounded" style={{fontSize:24, color:d.color, fontVariationSettings:"'FILL' 1"}}>{d.icon}</span>
                          </div>
                          <div style={{flex:1, minWidth:120}}>
                            <div style={{fontSize:14, fontWeight:700, color:'var(--text)'}}>{d.label}</div>
                            <div style={{fontSize:12, color:'var(--text3)', marginTop:2}}>{isPdf(app[d.key]) ? 'PDF Document' : 'Document'}</div>
                          </div>
                          <div style={{display:'flex', gap:8, flexShrink:0}}>
                            <button onClick={() => setPdfViewer({url:app[d.key],label:d.label})} style={{display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, background:'rgba(10,46,92,.07)', border:'1px solid rgba(10,46,92,.15)', fontSize:13, fontWeight:700, color:'var(--accent)', cursor:'pointer'}}>
                              <span className="material-symbols-rounded" style={{fontSize:14}}>preview</span>Preview
                            </button>
                            <a href={app[d.key]} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, background:'var(--bg3)', border:'1px solid var(--border)', fontSize:13, fontWeight:700, color:'var(--text2)', textDecoration:'none'}}>
                              <span className="material-symbols-rounded" style={{fontSize:14}}>open_in_new</span>Open
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab==='messages' && !isViewerCompany && (
              <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:0}}>
                <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:12,maxHeight:480,overflowY:'auto'}}>
                  {msgs.length===0?(
                    <div style={{textAlign:'center',padding:'64px 0',color:'var(--text3)'}}>
                      <span className="material-symbols-rounded" style={{display:'block',fontSize:52,marginBottom:14,opacity:.3}}>chat_bubble_outline</span>
                      <div style={{fontSize:15,fontWeight:700,marginBottom:6,color:'var(--text2)'}}>No messages yet</div>
                      <div style={{fontSize:13}}>Messages from the company about your application will appear here.</div>
                    </div>
                  ):msgs.map((m,i)=>{
                    const isMine=m.sender_id===currentUid;
                    return(
                      <div key={m.id||i} style={{display:'flex',flexDirection:isMine?'row-reverse':'row',gap:10,alignItems:'flex-end'}}>
                        <div style={{maxWidth:'72%',padding:'10px 14px',borderRadius:isMine?'16px 16px 4px 16px':'16px 16px 16px 4px',background:isMine?'var(--accent)':'var(--bg3)',color:isMine?'#fff':'var(--text)',fontSize:13.5,lineHeight:1.5,boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
                          {!isMine&&<div style={{fontSize:11,fontWeight:700,marginBottom:4,opacity:.7}}>{m.sender_name||'Company'}</div>}
                          <div>{m.content}</div>
                          <div style={{fontSize:10.5,marginTop:4,opacity:.6,textAlign:isMine?'right':'left'}}>{m.created_at&&new Date(m.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef}/>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyProfilePage({user,onProfileUpdate,setPage}){
  const uid=user?.user?.id;
  const initProfile=user?.profile||{};
  const [activeTab,setActiveTab]=useState('about'); // 'about' | 'listings' | 'applications'
  const [listings,setListings]=useState(null);
  const [apps,setApps]=useState(null);
  const [appFilter,setAppFilter]=useState('all');
  const [shortlistFilter,setShortlistFilter]=useState('all'); // for shortlist subview
  const [appView,setAppView]=useState('all'); // 'all' | 'shortlist'
  const [updating,setUpdating]=useState(null);
  const [selectedApp,setSelectedApp]=useState(null);
  const [editSection,setEditSection]=useState(null);
  const [photoUploading,setPhotoUploading]=useState(false);
  const [coverUploading,setCoverUploading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [showCreateListing,setShowCreateListing]=useState(false);
  const [editListingId,setEditListingId]=useState(null);
  const [deletingId,setDeletingId]=useState(null);
  const [togglingId,setTogglingId]=useState(null);
  const [postingListing,setPostingListing]=useState(false);

  const [profileData,setProfileData]=useState({
    company_name: initProfile.company_name||'',
    industry: initProfile.industry||'',
    company_size: initProfile.company_size||'',
    bio: initProfile.bio||'',
    website: initProfile.website||'',
    avatar_url: initProfile.avatar_url||null,
    linkedin: initProfile.linkedin||'',
    twitter: initProfile.twitter||'',
    tagline: initProfile.tagline||'',
    location: initProfile.location||'Kigali, Rwanda',
    founded: initProfile.founded||'',
  });
  const [photoUrl,setPhotoUrl]=useState(initProfile.avatar_url||null);
  const [coverUrl,setCoverUrl]=useState(initProfile.cover_url||null);
  const [listingForm,setListingForm]=useState({listing_type:'Internship',title:'',type:'Tech',location:'Kigali, Rwanda',pay:'',duration:'',deadline:'',description:'',responsibilities:'',requirements:'',tags:''});

  function setPD(k,v){setProfileData(p=>({...p,[k]:v}));}
  function setLF(k,v){setListingForm(f=>({...f,[k]:v}));}

  useEffect(()=>{
    if(!uid) return;
    loadListings();
    loadApps();
  },[uid]);

  // Real-time new applications
  useEffect(()=>{
    if(!uid) return;
    const c=getSB(); if(!c) return;
    const ch=c.channel('co-apps-rt-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'applications'},()=>{
        loadApps();
        toast('New application received!');
      }).subscribe();
    return ()=>c.removeChannel(ch);
  },[uid]);

  async function loadListings(){
    const c=getSB(); if(!c||!uid) return;
    const{data}=await c.from('job_listings').select('*').eq('company_id',uid).order('created_at',{ascending:false});
    setListings(data||[]);
  }

  async function loadApps(){
    if(!uid) return;
    const data=await dbGetCoApps(uid);
    setApps(data);
  }

  async function compressImage(file,maxPx=1200,quality=0.82){
    return new Promise(resolve=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        let w=img.width,h=img.height;
        if(w>maxPx||h>maxPx){const r=Math.min(maxPx/w,maxPx/h);w=Math.round(w*r);h=Math.round(h*r);}
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        canvas.toBlob(blob=>resolve(blob),'image/webp',quality);
        URL.revokeObjectURL(url);
      };
      img.src=url;
    });
  }

  async function handleLogoUpload(e){
    const file=e.target.files?.[0]; if(!file||!uid) return;
    if(file.size>10*1024*1024){toast('Image too large (max 10MB)');return;}
    setPhotoUploading(true);
    try{
      const blob=await compressImage(file,600);
      const path=`avatars/${uid}.webp`;
      const c=getSB();
      await c.storage.from('aluhub-media').upload(path,blob,{upsert:true,contentType:'image/webp',cacheControl:'0'});
      const{data}=c.storage.from('aluhub-media').getPublicUrl(path);
      const url=data.publicUrl+'?t='+Date.now();
      await c.from('profiles').update({avatar_url:url}).eq('id',uid);
      setPhotoUrl(url);
      if(onProfileUpdate) onProfileUpdate({...user,profile:{...initProfile,avatar_url:url}});
      toast('Logo updated ✓');
    }catch(err){toast('Upload failed: '+err.message);}
    finally{setPhotoUploading(false);}
  }

  async function handleCoverUpload(e){
    const file=e.target.files?.[0]; if(!file||!uid) return;
    if(file.size>15*1024*1024){toast('Image too large (max 15MB)');return;}
    setCoverUploading(true);
    try{
      const blob=await compressImage(file,1400,0.80);
      const path=`covers/${uid}.webp`;
      const c=getSB();
      await c.storage.from('aluhub-media').upload(path,blob,{upsert:true,contentType:'image/webp',cacheControl:'0'});
      const{data}=c.storage.from('aluhub-media').getPublicUrl(path);
      const url=data.publicUrl+'?t='+Date.now();
      await c.from('profiles').update({cover_url:url}).eq('id',uid);
      setCoverUrl(url);
      if(onProfileUpdate) onProfileUpdate({...user,profile:{...initProfile,cover_url:url}});
      toast('Cover photo updated ✓');
    }catch(err){toast('Upload failed: '+err.message);}
    finally{setCoverUploading(false);}
  }

  async function saveSection(section){
    if(!uid) return;
    setSaving(true);
    try{
      const c=getSB();
      const patch={
        company_name:profileData.company_name,industry:profileData.industry,
        company_size:profileData.company_size,bio:profileData.bio,website:profileData.website,
        linkedin:profileData.linkedin,twitter:profileData.twitter,tagline:profileData.tagline,
        location:profileData.location,founded:profileData.founded,
      };
      await c.from('profiles').update(patch).eq('id',uid);
      if(onProfileUpdate) onProfileUpdate({...user,profile:{...initProfile,...patch}});
      setEditSection(null);
      toast('Saved ✓');
    }catch(err){toast('Save failed: '+err.message);}
    finally{setSaving(false);}
  }

  async function handlePostListing(){
    if(!listingForm.title.trim()){toast('Title is required.');return;}
    if(!listingForm.description.trim()){toast('Description is required.');return;}
    setPostingListing(true);
    const c=getSB();
    if(c&&uid){
      const payload={
        company_id:uid,title:listingForm.title.trim(),description:listingForm.description.trim(),
        responsibilities:listingForm.responsibilities.trim(),requirements:listingForm.requirements.trim(),listing_type:listingForm.listing_type,
        type:listingForm.type,location:listingForm.location,pay:listingForm.pay,
        duration:listingForm.duration,deadline:listingForm.deadline||null,
        tags:listingForm.tags.split(',').map(t=>t.trim()).filter(Boolean),status:'active',
      };
      if(editListingId){
        await c.from('job_listings').update(payload).eq('id',editListingId).eq('company_id',uid);
        toast('Listing updated ✓');
        setEditListingId(null);
      }else{
        await c.from('job_listings').insert(payload);
        await dbSendNotif(uid,'new_job',`${listingForm.listing_type} listing is live!`,`"${listingForm.title}" is now visible to all students.`);
        // Notify students who follow this company (targeted), plus all others generically
        await dbNotifyFollowers(uid, window.__aluHubUser?.profile?.company_name||'A company', listingForm.title, listingForm.listing_type);
        const {data:students}=await c.from('profiles').select('id').eq('user_type','student');
        // Exclude followers who already got a targeted notif
        const {data:followerRows}=await c.from('company_follows').select('student_id').eq('company_id',uid);
        const followerIds=new Set((followerRows||[]).map(r=>r.student_id));
        const nonFollowers=(students||[]).filter(s=>!followerIds.has(s.id));
        if(nonFollowers.length) await c.from('notifications').insert(nonFollowers.map(s=>({user_id:s.id,type:'new_listing',title:`New ${listingForm.listing_type}: ${listingForm.title}`,body:`A new listing just posted on ALU Hub.`,read:false})));
        toast(`${listingForm.listing_type} posted! 🎉`);
      }
    }
    setPostingListing(false);
    setShowCreateListing(false);
    setEditListingId(null);
    setListingForm({listing_type:'Internship',title:'',type:'Tech',location:'Kigali, Rwanda',pay:'',duration:'',deadline:'',description:'',responsibilities:'',requirements:'',tags:''});
    loadListings();
  }

  async function toggleListingStatus(l){
    setTogglingId(l.id);
    const ns=l.status==='active'?'closed':'active';
    const c=getSB();
    await c.from('job_listings').update({status:ns}).eq('id',l.id).eq('company_id',uid);
    setListings(prev=>prev.map(x=>x.id===l.id?{...x,status:ns}:x));
    toast(ns==='active'?'Listing reopened ✓':'Listing closed ✓');
    setTogglingId(null);
  }

  async function deleteListing(l){
    if(!window.confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    setDeletingId(l.id);
    const c=getSB();
    await c.from('job_listings').delete().eq('id',l.id).eq('company_id',uid);
    setListings(prev=>prev.filter(x=>x.id!==l.id));
    toast('Listing deleted');
    setDeletingId(null);
  }

  function startEditListing(l){
    setListingForm({
      listing_type:l.listing_type||'Internship',title:l.title||'',type:l.type||'Tech',
      location:l.location||'Kigali, Rwanda',pay:l.pay||'',duration:l.duration||'',
      deadline:l.deadline||'',description:l.description||'',responsibilities:l.responsibilities||'',requirements:l.requirements||'',
      tags:(l.tags||[]).join(', '),
    });
    setEditListingId(l.id);
    setShowCreateListing(true);
  }

  const [undoQueue,setUndoQueue]=React.useState({});

  async function changeStatus(appId,newStatus){
    const app=apps.find(a=>a.id===appId);
    const prevStatus=app?.status;
    setUpdating(appId);
    setApps(prev=>prev.map(a=>a.id===appId?{...a,status:newStatus}:a));
    await dbSetStatus(appId,newStatus,app?.student_id||app?.student?.id,app?.job?.title);
    setUpdating(null);
    const tid=setTimeout(()=>setUndoQueue(q=>{const n={...q};delete n[appId];return n;}),5000);
    setUndoQueue(q=>({...q,[appId]:{prevStatus,tid}}));
    toast((S_META[newStatus]?.label||newStatus)+' — tap Undo to revert');
  }

  async function undoStatus(appId){
    const q=undoQueue[appId];
    if(!q) return;
    clearTimeout(q.tid);
    setUndoQueue(prev=>{const n={...prev};delete n[appId];return n;});
    const app=apps.find(a=>a.id===appId);
    setApps(prev=>prev.map(a=>a.id===appId?{...a,status:q.prevStatus}:a));
    await dbSetStatus(appId,q.prevStatus,app?.student_id||app?.student?.id,app?.job?.title);
    toast('Action undone');
  }

  const lTypeBadge={
    'Internship':{color:'#6366F1',bg:'rgba(99,102,241,.13)',icon:'school'},
    'Full-time Job':{color:'#10B981',bg:'rgba(16,185,129,.13)',icon:'work'},
    'Part-time Job':{color:'#F59E0B',bg:'rgba(245,158,11,.13)',icon:'schedule'},
    'Freelance':{color:'#3B82F6',bg:'rgba(59,130,246,.13)',icon:'bolt'},
  };

  const activeListings=(listings||[]).filter(l=>l.status==='active');
  const closedListings=(listings||[]).filter(l=>l.status==='closed');
  const initials=(profileData.company_name||'C').slice(0,2).toUpperCase();

  const allApps=apps||[];
  const shortlistedApps=allApps.filter(a=>a.status==='shortlisted');
  const appCounts={
    all:allApps.length,
    pending:allApps.filter(a=>a.status==='pending').length,
    reviewed:allApps.filter(a=>a.status==='reviewed').length,
    shortlisted:shortlistedApps.length,
    hired:allApps.filter(a=>a.status==='hired').length,
    rejected:allApps.filter(a=>a.status==='rejected').length,
  };

  const displayedApps=appView==='shortlist'
    ? shortlistedApps
    : allApps.filter(a=>appFilter==='all'||a.status===appFilter);

  // ── Listing Modal ──────────────────────────────────
  const ListingModal=()=>(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget){setShowCreateListing(false);setEditListingId(null);}}}>
      <div style={{background:'var(--bg2)',borderRadius:18,width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.5)',border:'1px solid var(--border2)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--bg2)',zIndex:2,borderRadius:'18px 18px 0 0'}}>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{editListingId?'Edit Listing':'New Listing'}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>Reaches 500+ ALU & CMU-Africa students</div>
          </div>
          <button onClick={()=>{setShowCreateListing(false);setEditListingId(null);}} style={{background:'var(--bg3)',border:'none',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)'}}>
            <span className="material-symbols-rounded" style={{fontSize:18}}>close</span>
          </button>
        </div>
        <div style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <div style={{fontSize:11.5,fontWeight:700,color:'var(--text2)',marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Type</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {['Internship','Full-time Job','Part-time Job','Freelance'].map(t=>{
                const m=lTypeBadge[t]||{color:'var(--accent)',bg:'rgba(99,102,241,.1)'};
                const sel=listingForm.listing_type===t;
                return <button key={t} onClick={()=>setLF('listing_type',t)} style={{padding:'7px 14px',borderRadius:20,border:`1.5px solid ${sel?m.color:'var(--border)'}`,fontSize:12.5,fontWeight:600,cursor:'pointer',background:sel?m.bg:'transparent',color:sel?m.color:'var(--text2)',transition:'all .15s'}}>{t}</button>;
              })}
            </div>
          </div>
          <div className="form-group" style={{margin:0}}><label className="form-label">Title *</label><input className="form-input" placeholder={`e.g. ${listingForm.listing_type==='Internship'?'Software Engineer Intern':'Product Manager'}`} value={listingForm.title} onChange={e=>setLF('title',e.target.value)}/></div>
          <div className="two-col">
            <div className="form-group" style={{margin:0}}><label className="form-label">Category</label><select className="form-input" value={listingForm.type} onChange={e=>setLF('type',e.target.value)}><option>Tech</option><option>Finance</option><option>Policy</option><option>Marketing</option><option>Education</option><option>Design</option><option>Research</option><option>Other</option></select></div>
            <div className="form-group" style={{margin:0}}><label className="form-label">Location</label><input className="form-input" value={listingForm.location} onChange={e=>setLF('location',e.target.value)}/></div>
          </div>
          <div className="two-col">
            <div className="form-group" style={{margin:0}}><label className="form-label">{listingForm.listing_type==='Internship'?'Stipend':'Salary'}</label><input className="form-input" placeholder="e.g. RWF 200,000/mo" value={listingForm.pay} onChange={e=>setLF('pay',e.target.value)}/></div>
            <div className="form-group" style={{margin:0}}><label className="form-label">Duration</label><input className="form-input" placeholder="e.g. 3 months" value={listingForm.duration} onChange={e=>setLF('duration',e.target.value)}/></div>
          </div>
          <div className="form-group" style={{margin:0}}><label className="form-label">Deadline</label><input className="form-input" type="date" value={listingForm.deadline} onChange={e=>setLF('deadline',e.target.value)}/></div>
          <div className="form-group" style={{margin:0}}><label className="form-label">About This Role *</label><textarea className="form-input" rows={4} value={listingForm.description} onChange={e=>setLF('description',e.target.value)} placeholder="Overview: What will they work on? What team will they join?"/></div>
          <div className="form-group" style={{margin:0}}><label className="form-label">Responsibilities</label><textarea className="form-input" rows={4} value={listingForm.responsibilities} onChange={e=>setLF('responsibilities',e.target.value)} placeholder={"List key responsibilities, one per line:\n• Design and build new features\n• Collaborate with cross-functional teams"}/></div>
          <div className="form-group" style={{margin:0}}><label className="form-label">Qualifications & Requirements</label><textarea className="form-input" rows={3} value={listingForm.requirements} onChange={e=>setLF('requirements',e.target.value)} placeholder={"List requirements, one per line:\n• Currently pursuing a CS degree\n• Strong communication skills"}/></div>
          <div className="form-group" style={{margin:0}}><label className="form-label">Skills Tags (comma-separated)</label><input className="form-input" placeholder="JavaScript, React, Paid, On-site" value={listingForm.tags} onChange={e=>setLF('tags',e.target.value)}/></div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4}}>
            <button className="btn btn-ghost" onClick={()=>{setShowCreateListing(false);setEditListingId(null);}}>Cancel</button>
            <button className="btn btn-primary" disabled={postingListing} onClick={handlePostListing} style={{display:'flex',alignItems:'center',gap:6}}>
              <span className="material-symbols-rounded" style={{fontSize:16}}>{editListingId?'save':'send'}</span>
              {postingListing?'Posting…':editListingId?'Save Changes':`Post ${listingForm.listing_type}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Edit Modal ──────────────────────────────────────
  const EditModal=()=>{
    if(!editSection) return null;
    return(
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget) setEditSection(null);}}>
        <div style={{background:'var(--bg2)',borderRadius:18,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.5)',border:'1px solid var(--border2)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--bg2)',zIndex:2,borderRadius:'18px 18px 0 0'}}>
            <div style={{fontSize:16,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {editSection==='header'?'Edit Company Info':editSection==='about'?'Edit About':'Edit Details'}
            </div>
            <button onClick={()=>setEditSection(null)} style={{background:'var(--bg3)',border:'none',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)'}}>
              <span className="material-symbols-rounded" style={{fontSize:18}}>close</span>
            </button>
          </div>
          <div style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',gap:14}}>
            {(editSection==='header'||editSection==='details')&&(
              <>
                <div className="form-group" style={{margin:0}}><label className="form-label">Company Name</label><input className="form-input" value={profileData.company_name} onChange={e=>setPD('company_name',e.target.value)}/></div>
                <div className="form-group" style={{margin:0}}><label className="form-label">Tagline</label><input className="form-input" value={profileData.tagline} onChange={e=>setPD('tagline',e.target.value)} placeholder="e.g. Empowering African tech talent"/></div>
                <div className="two-col">
                  <div className="form-group" style={{margin:0}}><label className="form-label">Industry</label><input className="form-input" value={profileData.industry} onChange={e=>setPD('industry',e.target.value)}/></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Company Size</label>
                    <select className="form-input" value={profileData.company_size} onChange={e=>setPD('company_size',e.target.value)}>
                      <option value="">Select…</option>
                      {['1–10','11–50','51–200','201–500','500+'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="two-col">
                  <div className="form-group" style={{margin:0}}><label className="form-label">Location</label><input className="form-input" value={profileData.location} onChange={e=>setPD('location',e.target.value)}/></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Founded Year</label><input className="form-input" placeholder="e.g. 2019" value={profileData.founded} onChange={e=>setPD('founded',e.target.value)}/></div>
                </div>
                <div className="form-group" style={{margin:0}}><label className="form-label">Website</label><input className="form-input" value={profileData.website} onChange={e=>setPD('website',e.target.value)} placeholder="https://…"/></div>
                <div className="two-col">
                  <div className="form-group" style={{margin:0}}><label className="form-label">LinkedIn</label><input className="form-input" value={profileData.linkedin} onChange={e=>setPD('linkedin',e.target.value)} placeholder="linkedin.com/company/…"/></div>
                  <div className="form-group" style={{margin:0}}><label className="form-label">Twitter / X</label><input className="form-input" value={profileData.twitter} onChange={e=>setPD('twitter',e.target.value)} placeholder="@handle"/></div>
                </div>
              </>
            )}
            {editSection==='about'&&(
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">About your company</label>
                <textarea className="form-input" rows={9} value={profileData.bio} onChange={e=>setPD('bio',e.target.value)} placeholder="Describe what your company does, your mission, culture, and what you look for in candidates…" style={{minHeight:200,fontSize:14,lineHeight:1.75}}/>
              </div>
            )}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4}}>
              <button className="btn btn-ghost" onClick={()=>setEditSection(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={()=>saveSection(editSection)} style={{display:'flex',alignItems:'center',gap:6}}>
                <span className="material-symbols-rounded" style={{fontSize:16}}>save</span>
                {saving?'Saving…':'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

    // ── RENDER ─────────────────────────────────────────

  // If an application is selected, show its full detail view as a fixed full-screen overlay
  // (same experience as the navbar Applications page)

  return(
    <div className="co-profile-page-root" style={{width:'100%',maxWidth:'100%',paddingBottom:48,overflow:'hidden',boxSizing:'border-box'}}>
      {showCreateListing&&<ListingModal/>}
      {editSection&&<EditModal/>}

      {/* ── COVER PHOTO (full width) ── */}
      <div className="co-profile-cover" style={{position:'relative',width:'100%',height:220,overflow:'hidden',background:'linear-gradient(135deg,#0A1828,#1a3a6e)'}}>
        {coverUrl
          ?<img src={coverUrl} alt="cover" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#0A2E5C 0%,#1a4a80 40%,#0d3572 70%,#071e3d 100%)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,203,0,0.08),transparent 60%)',pointerEvents:'none'}}/>
            <div style={{opacity:.08,fontSize:100,color:'#fff',fontWeight:900,letterSpacing:-6,userSelect:'none',fontFamily:"'Plus Jakarta Sans',sans-serif",position:'relative',zIndex:1}}>ALU HUB</div>
          </div>
        }
        <label style={{position:'absolute',bottom:12,right:16,background:'rgba(0,0,0,.55)',backdropFilter:'blur(8px)',color:'#fff',padding:'7px 14px',borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:12.5,fontWeight:600,border:'1px solid rgba(255,255,255,.15)'}}>
          <span className="material-symbols-rounded" style={{fontSize:15}}>photo_camera</span>
          {coverUploading?'Uploading…':'Edit cover'}
          <input type="file" accept="image/*" style={{display:'none'}} onChange={handleCoverUpload}/>
        </label>
      </div>
      <div className="co-profile-info-wrap" style={{background:'var(--card)',border:'1px solid var(--border)',borderBottom:'none',padding:'0 28px 0',position:'relative'}}>
        <div className="co-profile-header-row" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',paddingBottom:16,flexWrap:'wrap',gap:8}}>
          {/* Logo */}
          <div className="co-profile-logo-wrap" style={{position:'relative',marginTop:-44}}>
            <div className="co-profile-logo" style={{width:96,height:96,borderRadius:18,background:'var(--bg2)',border:'3px solid var(--card)',boxShadow:'0 4px 20px rgba(0,0,0,.25)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {photoUrl
                ?<img src={photoUrl} alt="logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,var(--accent),#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{initials}</div>
              }
            </div>
            <label style={{position:'absolute',bottom:-4,right:-4,background:'var(--accent)',color:'#fff',width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'2px solid var(--card)',boxShadow:'0 2px 8px rgba(0,0,0,.25)'}}>
              {photoUploading?<span style={{fontSize:9}}>…</span>:<span className="material-symbols-rounded" style={{fontSize:14}}>photo_camera</span>}
              <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoUpload}/>
            </label>
          </div>
          <div className="co-profile-header-actions" style={{display:'flex',gap:8,paddingTop:16,paddingBottom:4}}>
            <button className="btn btn-yellow" style={{display:'flex',alignItems:'center',gap:6,fontSize:13}} onClick={()=>setPage&&setPage('company_listings')}>
              <span className="material-symbols-rounded" style={{fontSize:16}}>add</span>Post Listing
            </button>
            <button className="btn btn-outline" style={{display:'flex',alignItems:'center',gap:6,fontSize:13}} onClick={()=>setEditSection('header')}>
              <span className="material-symbols-rounded" style={{fontSize:15}}>edit</span>Edit Profile
            </button>
          </div>
        </div>

        {/* Company info row */}
        <div className="co-profile-info-row" style={{paddingBottom:16}}>
          <h1 className="co-profile-name" style={{fontSize:24,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",margin:'0 0 4px',letterSpacing:'-.02em'}}>
            {profileData.company_name||'Your Company Name'}
          </h1>
          {profileData.tagline&&<div className="co-profile-tagline" style={{fontSize:14,color:'var(--text2)',marginBottom:8}}>{profileData.tagline}</div>}
          <div className="co-profile-meta-row" style={{display:'flex',flexWrap:'wrap',gap:16,fontSize:13,color:'var(--text3)',alignItems:'center'}}>
            {profileData.industry&&<span style={{display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-rounded" style={{fontSize:14}}>domain</span>{profileData.industry}</span>}
            {profileData.location&&<span style={{display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-rounded" style={{fontSize:14}}>location_on</span>{profileData.location}</span>}
            {profileData.company_size&&<span style={{display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-rounded" style={{fontSize:14}}>people</span>{profileData.company_size} employees</span>}
            {profileData.founded&&<span style={{display:'flex',alignItems:'center',gap:4}}><span className="material-symbols-rounded" style={{fontSize:14}}>calendar_today</span>Est. {profileData.founded}</span>}
            <span className="stat-open-positions">
              <span className="material-symbols-rounded" style={{fontSize:14,fontVariationSettings:"'FILL' 1"}}>work</span>
              {activeListings.length} open position{activeListings.length!==1?'s':''}
            </span>
            <span style={{display:'flex',alignItems:'center',gap:4,color:appCounts.pending>0?'#F59E0B':'var(--text3)',fontWeight:appCounts.pending>0?700:400}}>
              <span className="material-symbols-rounded" style={{fontSize:14}}>folder_open</span>{appCounts.all} application{appCounts.all!==1?'s':''}
              {appCounts.pending>0&&<span style={{marginLeft:2,background:'#F59E0B',color:'#fff',borderRadius:20,fontSize:10.5,fontWeight:700,padding:'1px 7px'}}>{appCounts.pending} new</span>}
            </span>
          </div>
          {/* Social links */}
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
            {profileData.website&&<a href={profileData.website.startsWith('http')?profileData.website:'https://'+profileData.website} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 13px',borderRadius:20,background:'var(--bg3)',color:'var(--text2)',fontSize:12.5,fontWeight:600,textDecoration:'none',border:'1px solid var(--border)',transition:'all .15s'}}>
              <span className="material-symbols-rounded" style={{fontSize:13}}>language</span>Website
            </a>}
            {profileData.linkedin&&<a href={profileData.linkedin.startsWith('http')?profileData.linkedin:'https://'+profileData.linkedin} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 13px',borderRadius:20,background:'var(--bg3)',color:'var(--text2)',fontSize:12.5,fontWeight:600,textDecoration:'none',border:'1px solid var(--border)'}}>
              <span className="material-symbols-rounded" style={{fontSize:13}}>link</span>LinkedIn
            </a>}
            {profileData.twitter&&<a href={`https://twitter.com/${profileData.twitter.replace('@','')}`} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 13px',borderRadius:20,background:'var(--bg3)',color:'var(--text2)',fontSize:12.5,fontWeight:600,textDecoration:'none',border:'1px solid var(--border)'}}>
              <span className="material-symbols-rounded" style={{fontSize:13}}>alternate_email</span>Twitter
            </a>}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="co-profile-tabs" style={{display:'flex',gap:0,borderTop:'1px solid var(--border)'}}>
          {[
            {id:'about',label:'About',shortLabel:'About',icon:'info',badge:null},
            {id:'listings',label:'Job Listings',shortLabel:'Jobs',icon:'work',badge:activeListings.length||null},
            {id:'applications',label:'Applications',shortLabel:'Apps',icon:'folder_open',badge:appCounts.pending||null},
          ].map(tab=>(
            <button key={tab.id} onClick={()=>{setActiveTab(tab.id);setSelectedApp(null);}} className="co-profile-tab" style={{
              flex:1,padding:'14px 0',background:activeTab===tab.id?'rgba(255,203,0,.04)':'transparent',border:'none',
              borderBottom:activeTab===tab.id?'3px solid var(--alu-yellow)':'3px solid transparent',
              fontSize:13.5,fontWeight:activeTab===tab.id?800:500,
              color:activeTab===tab.id?'var(--alu-navy)':'var(--text2)',
              cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              letterSpacing: activeTab===tab.id?'-.02em':'0',
            }}>
              <span className="material-symbols-rounded" style={{fontSize:16,fontVariationSettings:activeTab===tab.id?"'FILL' 1":"'FILL' 0",color:activeTab===tab.id?'var(--alu-yellow)':undefined}}>{tab.icon}</span>
              <span className="co-tab-label-full">{tab.label}</span>
              <span className="co-tab-label-short">{tab.shortLabel}</span>
              {tab.badge!=null&&tab.badge>0&&(
                <span style={{background:tab.id==='applications'?'#F59E0B':'var(--alu-yellow)',color:tab.id==='applications'?'#fff':'var(--alu-navy)',borderRadius:20,fontSize:10.5,fontWeight:800,padding:'1px 7px',lineHeight:'16px'}}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}

      {/* JOB LISTINGS TAB */}
      {activeTab==='listings'&&(
        <div style={{padding:'24px 28px'}}>
          {/* Active listings */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.03em'}}>
                  Open Positions
                </div>
                {activeListings.length>0&&(
                  <span className="positions-count-pill">
                    <span className="listing-live-dot"/>
                    {activeListings.length} live
                  </span>
                )}
              </div>
              <div style={{fontSize:12.5,color:'var(--text3)',marginTop:2,display:'flex',alignItems:'center',gap:5}}>
                <span className="material-symbols-rounded" style={{fontSize:13}}>groups</span>
                Visible to all ALU &amp; CMU-Africa students
              </div>
            </div>
            <button className="btn btn-yellow" style={{display:'flex',alignItems:'center',gap:6}} onClick={()=>setPage&&setPage('company_listings')}>
              <span className="material-symbols-rounded" style={{fontSize:16}}>add</span>New Listing
            </button>
          </div>

          {!listings?(
            <div style={{textAlign:'center',padding:48,color:'var(--text3)'}}>Loading…</div>
          ):activeListings.length===0?(
            <div style={{textAlign:'center',padding:'48px 0',background:'var(--card)',borderRadius:16,border:'1px solid var(--border)'}}>
              <span className="material-symbols-rounded" style={{fontSize:52,color:'var(--text3)',display:'block',marginBottom:12}}>work_outline</span>
              <div style={{fontWeight:700,color:'var(--text)',marginBottom:6,fontSize:15}}>No open positions</div>
              <div style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>Post your first listing and start reaching 500+ students.</div>
              <button className="btn btn-primary" onClick={()=>setPage&&setPage('company_listings')}>
                <span className="material-symbols-rounded" style={{fontSize:15}}>add</span>Post a listing
              </button>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))',gap:14}}>
              {activeListings.map((l,i)=>{
                const lm=lTypeBadge[l.listing_type]||{color:'var(--accent)',bg:'rgba(99,102,241,.1)',icon:'work'};
                const isDeleting=deletingId===l.id;
                const isToggling=togglingId===l.id;
                const daysAgo=Math.floor((Date.now()-new Date(l.created_at))/86400000);
                const deadlinePassed=l.deadline&&new Date(l.deadline)<new Date();
                const listingApps=(apps||[]).filter(a=>a.job?.id===l.id||a.job_id===l.id);
                return(
                  <div key={l.id} className="listing-card-active" style={{border:'1px solid var(--border)',borderRadius:14,padding:20,background:'var(--card)',opacity:isDeleting?.4:1,transition:'opacity .2s, box-shadow .2s, transform .2s',display:'flex',flexDirection:'column',gap:10}}>
                    {/* Company identity header */}
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:2,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
                      <div style={{width:40,height:40,borderRadius:10,flexShrink:0,overflow:'hidden',border:'1.5px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(10,46,92,.08)'}}>
                        {profileData.avatar_url
                          ?<img src={profileData.avatar_url} alt={profileData.company_name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            {(profileData.company_name||'C').slice(0,2).toUpperCase()}
                          </div>
                        }
                      </div>
                      <div>
                        <div style={{fontSize:12.5,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{profileData.company_name||'Your Company'}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>{l.listing_type||'Listing'} · {l.location||'Kigali, Rwanda'}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 11px',borderRadius:20,fontSize:11.5,fontWeight:700,color:lm.color,background:lm.bg}}>
                          <span className="material-symbols-rounded" style={{fontSize:12,fontVariationSettings:"'FILL' 1"}}>{lm.icon}</span>{l.listing_type||'Listing'}
                        </span>
                        <span className="listing-live-badge">
                          <span className="listing-live-dot"/>Open
                        </span>
                      </div>
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        <button disabled={isToggling||isDeleting} onClick={()=>toggleListingStatus(l)} className="btn btn-ghost btn-sm" style={{fontSize:11,color:'#6B7280',gap:3,display:'flex',alignItems:'center'}}>
                          <span className="material-symbols-rounded" style={{fontSize:12}}>toggle_off</span>{isToggling?'…':'Close'}
                        </button>
                        <button onClick={()=>setPage&&setPage('company_listings')} className="btn btn-ghost btn-sm" style={{fontSize:11,gap:3,display:'flex',alignItems:'center'}}>
                          <span className="material-symbols-rounded" style={{fontSize:12}}>edit</span>Edit
                        </button>
                        <button disabled={isDeleting} onClick={()=>deleteListing(l)} className="btn btn-ghost btn-sm" style={{fontSize:11,color:'#EF4444',gap:3,display:'flex',alignItems:'center'}}>
                          <span className="material-symbols-rounded" style={{fontSize:12}}>delete_outline</span>{isDeleting?'…':''}
                        </button>
                      </div>
                    </div>

                    <div style={{fontSize:16,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l.title}</div>

                    <div style={{display:'flex',flexWrap:'wrap',gap:10,fontSize:12,color:'var(--text2)'}}>
                      {l.location&&<span style={{display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:12,color:'var(--text3)'}}>location_on</span>{l.location}</span>}
                      {l.pay&&<span style={{display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:12,color:'var(--text3)'}}>payments</span>{l.pay}</span>}
                      {l.duration&&<span style={{display:'flex',alignItems:'center',gap:3}}><span className="material-symbols-rounded" style={{fontSize:12,color:'var(--text3)'}}>hourglass_empty</span>{l.duration}</span>}
                      {l.deadline&&<span style={{display:'flex',alignItems:'center',gap:3,color:deadlinePassed?'#EF4444':'var(--text2)'}}>
                        <span className="material-symbols-rounded" style={{fontSize:12,color:deadlinePassed?'#EF4444':'var(--text3)'}}>event</span>
                        {new Date(l.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                        {deadlinePassed&&' (Passed)'}
                      </span>}
                    </div>

                    {l.description&&<p style={{fontSize:12.5,color:'var(--text2)',lineHeight:1.6,margin:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{l.description}</p>}

                    {l.tags?.length>0&&(
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {l.tags.slice(0,5).map(t=><span key={t} style={{padding:'3px 9px',borderRadius:12,fontSize:11,fontWeight:500,background:'var(--bg3)',color:'var(--text2)',border:'1px solid var(--border)'}}>{t}</span>)}
                      </div>
                    )}

                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:10,marginTop:2}}>
                      <div style={{fontSize:11.5,color:'var(--text3)'}}>Posted {daysAgo===0?'today':daysAgo===1?'yesterday':`${daysAgo}d ago`}</div>
                      <button onClick={()=>{setActiveTab('applications');setAppFilter('all');}} style={{display:'flex',alignItems:'center',gap:4,background:'none',border:'none',color:'var(--accent)',fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 8px',borderRadius:8}}>
                        <span className="material-symbols-rounded" style={{fontSize:13}}>folder_open</span>
                        {listingApps.length} application{listingApps.length!==1?'s':''}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Closed listings */}
          {closedListings.length>0&&(
            <div style={{marginTop:28}}>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                Closed Listings
                <span style={{fontSize:12,fontWeight:600,color:'var(--text3)',background:'var(--bg3)',padding:'2px 9px',borderRadius:20,border:'1px solid var(--border)'}}>{closedListings.length}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:10}}>
                {closedListings.map(l=>{
                  const lm=lTypeBadge[l.listing_type]||{color:'#6B7280',bg:'rgba(107,114,128,.1)',icon:'work'};
                  const isToggling=togglingId===l.id;
                  const isDeleting=deletingId===l.id;
                  return(
                    <div key={l.id} style={{border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px',background:'var(--card)',opacity:isDeleting?.4:.65}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:'var(--text2)',marginBottom:4}}>{l.title}</div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:600,color:'#6B7280',background:'rgba(107,114,128,.1)'}}>{l.listing_type}</span>
                            <span style={{fontSize:11.5,color:'var(--text3)'}}>Closed</span>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:4}}>
                          <button disabled={isToggling||isDeleting} onClick={()=>toggleListingStatus(l)} className="btn btn-ghost btn-sm" style={{fontSize:11,color:'#10B981',gap:3,display:'flex',alignItems:'center'}}>
                            <span className="material-symbols-rounded" style={{fontSize:12}}>toggle_on</span>{isToggling?'…':'Reopen'}
                          </button>
                          <button disabled={isDeleting} onClick={()=>deleteListing(l)} className="btn btn-ghost btn-sm" style={{fontSize:11,color:'#EF4444',gap:3,display:'flex',alignItems:'center'}}>
                            <span className="material-symbols-rounded" style={{fontSize:12}}>delete_outline</span>{isDeleting?'…':'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABOUT TAB */}
      {activeTab==='about'&&(
        <div className="co-about-grid" style={{padding:'24px 28px',display:'grid',gridTemplateColumns:'1fr 300px',gap:20,alignItems:'start'}}>

          {/* Left column */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* About card */}
            <div className="about-card-enhanced co-section-card" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:24}}>
              <div className="about-card-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span className="material-symbols-rounded about-card-header-icon" style={{fontSize:18,color:'var(--alu-yellow)',fontVariationSettings:"'FILL' 1"}}>info</span>
                  <div className="about-card-header-title" style={{fontWeight:800,fontSize:15,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.02em'}}>About Your Company</div>
                </div>
                <button className="about-card-edit-btn" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 14px',background:'var(--alu-yellow-dim)',border:'1px solid var(--alu-yellow-border)',borderRadius:20,fontSize:12,fontWeight:700,color:'var(--alu-navy)',cursor:'pointer'}} onClick={()=>setEditSection('about')}>
                  <span className="material-symbols-rounded" style={{fontSize:13}}>edit</span>Edit
                </button>
              </div>
              {profileData.bio
                ?<p className="about-body-text" style={{margin:0,whiteSpace:'pre-line',wordBreak:'break-word',overflowWrap:'anywhere'}}>{profileData.bio}</p>
                :<div className="about-empty-state" style={{textAlign:'center',padding:'32px 0'}}>
                  <div className="about-empty-icon" style={{width:56,height:56,borderRadius:16,background:'rgba(255,203,0,.12)',border:'1px solid rgba(255,203,0,.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                    <span className="material-symbols-rounded" style={{fontSize:30,color:'var(--alu-navy)',fontVariationSettings:"'FILL' 1"}}>article</span>
                  </div>
                  <div className="about-empty-title" style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:6}}>Tell your story</div>
                  <div className="about-empty-desc" style={{fontSize:13,color:'var(--text3)',marginBottom:18,lineHeight:1.7,maxWidth:260,margin:'0 auto 18px'}}>Describe your mission, culture and what makes your company great.</div>
                  <button className="btn btn-yellow" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 20px',fontSize:13}} onClick={()=>setEditSection('about')}>
                    <span className="material-symbols-rounded" style={{fontSize:15}}>add</span>Write About Section
                  </button>
                </div>
              }
            </div>

            {/* Open positions teaser */}
            {activeListings.length>0&&(
              <div className="co-section-card co-jobs-teaser" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:24,overflow:'hidden'}}>
                <div className="co-jobs-teaser-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:16,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Open Positions</div>
                  <button className="co-jobs-teaser-viewall" style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12.5,fontWeight:600,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',padding:'4px 8px',borderRadius:7,flexShrink:0,whiteSpace:'nowrap'}} onClick={()=>setActiveTab('listings')}>
                    <span className="co-jobs-teaser-viewall-text">View all</span>
                    <span className="material-symbols-rounded" style={{fontSize:14}}>chevron_right</span>
                  </button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {activeListings.slice(0,3).map(l=>{
                    const lm=lTypeBadge[l.listing_type]||{color:'var(--accent)',bg:'rgba(99,102,241,.1)',icon:'work'};
                    return(
                      <div key={l.id} className="co-jobs-teaser-row" style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg3)',overflow:'hidden'}}>
                        <div className="co-jobs-teaser-logo" style={{width:36,height:36,borderRadius:9,overflow:'hidden',flexShrink:0,border:'1px solid var(--border)',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {photoUrl
                            ?<img src={photoUrl} alt={profileData.company_name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,var(--accent),#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{initials}</div>
                          }
                        </div>
                        <div style={{flex:1,minWidth:0,overflow:'hidden'}}>
                          <div className="co-jobs-teaser-title" style={{fontSize:13.5,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</div>
                          <div className="co-jobs-teaser-meta" style={{fontSize:11.5,color:'var(--text3)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {l.location||''}{l.location&&l.pay?' · ':''}{l.pay||''}
                          </div>
                        </div>
                        <span className="co-jobs-teaser-tag" style={{fontSize:11,fontWeight:600,color:lm.color,background:lm.bg,padding:'3px 9px',borderRadius:12,flexShrink:0,whiteSpace:'nowrap'}}>{l.listing_type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* Company Details */}
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:14,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Company Details</div>
                <button style={{width:28,height:28,borderRadius:7,background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={()=>setEditSection('details')}>
                  <span className="material-symbols-rounded" style={{fontSize:14,color:'var(--text2)'}}>edit</span>
                </button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:11}}>
                {[
                  ['Industry',profileData.industry,'domain'],
                  ['Size',profileData.company_size?profileData.company_size+' employees':'','people'],
                  ['Location',profileData.location,'location_on'],
                  ['Founded',profileData.founded?'Est. '+profileData.founded:'','calendar_today'],
                ].filter(([,v])=>v).map(([label,val,icon])=>(
                  <div key={label} style={{display:'flex',alignItems:'center',gap:10}}>
                    <span className="material-symbols-rounded" style={{fontSize:16,color:'var(--text3)',flexShrink:0}}>{icon}</span>
                    <div>
                      <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.4}}>{label}</div>
                      <div style={{fontSize:13,color:'var(--text)',fontWeight:500}}>{val}</div>
                    </div>
                  </div>
                ))}
                {![profileData.industry,profileData.company_size,profileData.location,profileData.founded].some(Boolean)&&(
                  <button style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontWeight:600,fontSize:12.5,textAlign:'left',padding:0}} onClick={()=>setEditSection('details')}>+ Add details</button>
                )}
              </div>
              {/* Links */}
              {[profileData.website,profileData.linkedin,profileData.twitter].some(Boolean)&&(
                <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:8}}>
                  {profileData.website&&<a href={profileData.website.startsWith('http')?profileData.website:'https://'+profileData.website} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:7,fontSize:13,color:'var(--accent)',fontWeight:500,textDecoration:'none'}}>
                    <span className="material-symbols-rounded" style={{fontSize:15}}>language</span>{profileData.website.replace(/^https?:\/\//,'').replace(/\/$/,'')}
                  </a>}
                  {profileData.linkedin&&<a href={profileData.linkedin.startsWith('http')?profileData.linkedin:'https://'+profileData.linkedin} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:7,fontSize:13,color:'var(--accent)',fontWeight:500,textDecoration:'none'}}>
                    <span className="material-symbols-rounded" style={{fontSize:15}}>link</span>LinkedIn
                  </a>}
                  {profileData.twitter&&<a href={`https://twitter.com/${profileData.twitter.replace('@','')}`} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:7,fontSize:13,color:'var(--accent)',fontWeight:500,textDecoration:'none'}}>
                    <span className="material-symbols-rounded" style={{fontSize:15}}>alternate_email</span>@{profileData.twitter.replace('@','')}
                  </a>}
                </div>
              )}
            </div>

            {/* Activity stats */}
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:20}}>
              <div style={{fontWeight:700,fontSize:14,color:'var(--text)',marginBottom:14,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Activity</div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[
                  {label:'Active Listings',val:activeListings.length,icon:'work',color:'#10B981',bg:'rgba(16,185,129,.08)'},
                  {label:'Total Applications',val:appCounts.all,icon:'folder_open',color:'var(--accent)',bg:'rgba(10,46,92,.07)'},
                  {label:'Shortlisted',val:appCounts.shortlisted,icon:'star',color:'#F59E0B',bg:'rgba(245,158,11,.08)'},
                ].map(s=>(
                  <div key={s.label} style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:34,height:34,borderRadius:8,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span className="material-symbols-rounded" style={{fontSize:16,color:s.color}}>{s.icon}</span>
                    </div>
                    <div style={{flex:1,fontSize:12.5,color:'var(--text2)',fontWeight:500}}>{s.label}</div>
                    <div style={{fontSize:16,fontWeight:800,color:s.color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab==='applications'&&(
        <div style={{padding:'24px 28px'}}>

          {/* Header row */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.03em'}}>Applications</div>
              <div style={{fontSize:12.5,color:'var(--text3)',marginTop:3}}>Click any applicant to open their full profile</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              {[
                {id:'all',label:'All',count:appCounts.all},
                {id:'shortlist',label:'⭐ Shortlist',count:appCounts.shortlisted},
              ].map(v=>(
                <button key={v.id} onClick={()=>{setAppView(v.id);}} style={{
                  padding:'7px 16px',borderRadius:20,border:`1.5px solid ${appView===v.id?'var(--accent)':'var(--border)'}`,
                  fontSize:12.5,fontWeight:600,cursor:'pointer',
                  background:appView===v.id?'rgba(79,70,229,.08)':'transparent',
                  color:appView===v.id?'var(--accent)':'var(--text2)',transition:'all .15s',
                  display:'flex',alignItems:'center',gap:6,
                }}>
                  {v.label}
                  <span style={{background:appView===v.id?'var(--accent)':'var(--bg3)',color:appView===v.id?'#fff':'var(--text2)',borderRadius:20,fontSize:10,fontWeight:700,padding:'1px 6px'}}>{v.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          {appView==='all'&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:20}}>
              {[
                {label:'Total',val:appCounts.all,icon:'folder_open',col:'var(--accent)',bg:'rgba(10,46,92,.06)'},
                {label:'New',val:appCounts.pending,icon:'mark_email_unread',col:appCounts.pending>0?'#F59E0B':'var(--text3)',bg:appCounts.pending>0?'rgba(245,158,11,.07)':'var(--bg3)'},
                {label:'Reviewed',val:appCounts.reviewed,icon:'visibility',col:'#3B82F6',bg:'rgba(59,130,246,.06)'},
                {label:'Shortlisted',val:appCounts.shortlisted,icon:'star',col:'#10B981',bg:'rgba(16,185,129,.07)'},
                {label:'Accepted',val:appCounts.hired,icon:'workspace_premium',col:'#7D52AD',bg:'rgba(125,82,173,.07)'},
              ].map((s,i)=>(
                <div key={i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}
                  onClick={()=>setAppFilter(s.label.toLowerCase()==='total'?'all':s.label.toLowerCase()==='new'?'pending':s.label.toLowerCase()==='accepted'?'hired':s.label.toLowerCase())}>
                  <div style={{width:36,height:36,borderRadius:9,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span className="material-symbols-rounded" style={{fontSize:18,color:s.col,fontVariationSettings:"'FILL' 1"}}>{s.icon}</span>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>{s.label}</div>
                    <div style={{fontSize:20,fontWeight:800,color:s.col,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.1,marginTop:2}}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter chips */}
          {appView==='all'&&(
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
              {['all','pending','reviewed','shortlisted','hired','rejected'].map(f=>(
                <button key={f} className={`filter-chip${appFilter===f?' active':''}`} onClick={()=>setAppFilter(f)} style={{fontSize:11.5}}>
                  {f==='hired'?'Accepted':f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}
                  <span style={{marginLeft:4,opacity:.7}}>({appCounts[f]||0})</span>
                </button>
              ))}
            </div>
          )}

          {/* Applicant grid */}
          {!apps?(
            <div style={{textAlign:'center',padding:48,color:'var(--text3)'}}>Loading…</div>
          ):displayedApps.length===0?(
            <div style={{textAlign:'center',padding:'56px 0',background:'var(--card)',borderRadius:16,border:'1px solid var(--border)'}}>
              <span className="material-symbols-rounded" style={{fontSize:52,color:'var(--text3)',display:'block',marginBottom:12,opacity:.4}}>{appView==='shortlist'?'star_border':'inbox'}</span>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:6}}>
                {appView==='shortlist'?'No shortlisted candidates yet':appFilter==='all'?'No applications yet':'No '+appFilter+' applications'}
              </div>
              <div style={{fontSize:13,color:'var(--text2)',maxWidth:300,margin:'0 auto',lineHeight:1.6}}>
                {appView==='shortlist'?'Shortlist standout candidates from the All Applications view.':appFilter==='all'?'Applications will appear here when students apply to your listings.':'Try a different filter.'}
              </div>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:12}}>
              {displayedApps.map((app,i)=>{
                const st=app.student||{};
                const job=app.job||{};
                const initials2=(st.full_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                const sc=S_META[app.status]||S_META.pending;
                return(
                  <div key={app.id} onClick={()=>setSelectedApp(app)} style={{
                    border:'1px solid var(--border)',borderRadius:16,
                    background:'var(--card)',cursor:'pointer',transition:'all .18s',overflow:'hidden',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.boxShadow='0 4px 20px rgba(10,46,92,.1)';e.currentTarget.style.transform='translateY(-1px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>

                    {/* Card header */}
                    <div style={{padding:'16px 18px',display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,rgba(10,46,92,.12),rgba(10,46,92,.06))',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,flexShrink:0,overflow:'hidden',border:'1.5px solid rgba(10,46,92,.1)'}}>
                        {st.avatar_url?<img src={st.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials2}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                          <div style={{fontWeight:800,fontSize:14.5,color:'var(--text)',letterSpacing:'-.01em',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{st.full_name||'Student'}</div>
                          <span style={{padding:'3px 9px',borderRadius:20,background:sc.bg,color:sc.color,fontSize:10.5,fontWeight:700,whiteSpace:'nowrap',flexShrink:0,border:`1px solid ${sc.color}22`}}>{sc.label}</span>
                        </div>
                        <div style={{fontSize:12,color:'var(--text3)',marginTop:3,display:'flex',alignItems:'center',gap:5}}>
                          <span className="material-symbols-rounded" style={{fontSize:12}}>school</span>
                          {st.school||'ALU'}{st.major&&` · ${st.major}`}
                        </div>
                      </div>
                    </div>

                    {/* Job pill + date */}
                    <div style={{padding:'0 18px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                      <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--border)',fontSize:12,color:'var(--text2)',fontWeight:600,overflow:'hidden',maxWidth:'70%'}}>
                        <span className="material-symbols-rounded" style={{fontSize:12,color:'var(--accent)',flexShrink:0}}>work_outline</span>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{job.title||'Position'}</span>
                      </div>
                      <div style={{fontSize:11,color:'var(--text3)',flexShrink:0}}>{app.created_at&&new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                    </div>

                    {/* Cover note preview */}
                    {app.cover_note&&(
                      <div style={{margin:'0 18px 14px',padding:'8px 12px',background:'rgba(139,92,246,.05)',borderLeft:'3px solid rgba(139,92,246,.3)',borderRadius:'0 8px 8px 0',fontSize:12,color:'var(--text2)',lineHeight:1.5,fontStyle:'italic',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                        "{app.cover_note}"
                      </div>
                    )}

                    {/* Footer — doc count + open button */}
                    <div style={{borderTop:'1px solid var(--border)',padding:'10px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--bg2)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,fontSize:11.5,color:'var(--text3)'}}>
                        {['cv_url','cover_url','transcript_url','recommendation_url','portfolio_url','certificate_url','id_url'].filter(k=>app[k]).length>0&&(
                          <span style={{display:'flex',alignItems:'center',gap:4}}>
                            <span className="material-symbols-rounded" style={{fontSize:13}}>folder_open</span>
                            {['cv_url','cover_url','transcript_url','recommendation_url','portfolio_url','certificate_url','id_url'].filter(k=>app[k]).length} doc{['cv_url','cover_url','transcript_url','recommendation_url','portfolio_url','certificate_url','id_url'].filter(k=>app[k]).length!==1?'s':''}
                          </span>
                        )}
                      </div>
                      <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:700,color:'var(--accent)'}}>
                        View Application <span className="material-symbols-rounded" style={{fontSize:14}}>arrow_forward</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Application detail — full-screen overlay so it looks the same as navbar Applications page */}
      {selectedApp&&(
        <div style={{position:'fixed',inset:0,zIndex:1100,background:'var(--bg)',overflowY:'auto'}}>
          <ApplicantViewPage
            app={selectedApp}
            allApps={displayedApps}
            currentUid={uid}
            user={user}
            onMessage={null}
            onStatusChange={(appId,newStatus)=>{
              changeStatus(appId,newStatus);
              setSelectedApp(prev=>prev?.id===appId?{...prev,status:newStatus}:prev);
            }}
            onBack={(mode,navApp)=>{
              if(mode==='nav'&&navApp) setSelectedApp(navApp);
              else setSelectedApp(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
function ProfileApplicationsSection({setPage}){
  const user=window.__aluHubUser;
  const uid=user?.user?.id;
  const [apps,setApps]=useState(null);
  const [viewJobModal,setViewJobModal]=useState(null); // job object to view

  useEffect(()=>{
    if(!uid) return;
    dbGetMyApps(uid).then(data=>setApps((data||[]).slice(0,5)));
  },[uid]);

  if(!apps||apps.length===0) return null;

  const S_META_LOC={pending:{label:'Pending',color:'#F59E0B',bg:'rgba(245,158,11,.1)',icon:'schedule'},reviewed:{label:'Reviewed',color:'#3B82F6',bg:'rgba(59,130,246,.1)',icon:'visibility'},shortlisted:{label:'Shortlisted',color:'#10B981',bg:'rgba(16,185,129,.1)',icon:'star'},hired:{label:'Accepted',color:'#7D52AD',bg:'rgba(125,82,173,.1)',icon:'workspace_premium'},rejected:{label:'Rejected',color:'#EF4444',bg:'rgba(239,68,68,.1)',icon:'close'},withdrawn:{label:'Withdrawn',color:'var(--text3)',bg:'var(--bg3)',icon:'undo'}};

  return(
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,marginBottom:12,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <span className="material-symbols-rounded" style={{fontSize:19,color:'var(--accent)'}}>task_alt</span>
          <div style={{fontWeight:700,fontSize:15,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.01em'}}>My Applications</div>
        </div>
        {setPage&&<button onClick={()=>setPage('my_applications')} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:8,background:'var(--bg3)',border:'1px solid var(--border)',fontSize:12,fontWeight:600,color:'var(--text2)',cursor:'pointer'}}>
          See all <span className="material-symbols-rounded" style={{fontSize:13}}>chevron_right</span>
        </button>}
      </div>
      <div style={{paddingBottom:16,paddingLeft:20,paddingRight:20,display:'flex',flexDirection:'column',gap:10}}>
        {apps.map((app,i)=>{
          const job=app.job||{};
          const coName=job.co||job.company_name||'Company';
          const sc=S_META_LOC[app.status]||S_META_LOC.pending;
          return(
            <div key={app.id} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 14px',background:'var(--bg3)',borderRadius:11,border:'1px solid var(--border)',cursor:'pointer',transition:'border-color .15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              onClick={()=>setViewJobModal(app)}
            >
              <div style={{width:38,height:38,borderRadius:10,flexShrink:0,overflow:'hidden',border:'1.5px solid var(--border)',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {job.avatar_url
                  ?<img src={job.avatar_url} alt={coName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{coName.slice(0,2).toUpperCase()}</div>
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{job.title||'Position'}</div>
                <div style={{fontSize:11.5,color:'var(--text3)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{coName}</div>
              </div>
              <span style={{padding:'3px 10px',borderRadius:20,background:sc.bg,color:sc.color,fontSize:10.5,fontWeight:800,flexShrink:0,border:`1px solid ${sc.color}33`}}>{sc.label}</span>
            </div>
          );
        })}
      </div>
      {/* Job detail modal */}
      {viewJobModal&&(
        <div style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(0,0,0,.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setViewJobModal(null)}>
          <div style={{width:'100%',maxWidth:560,maxHeight:'88vh',overflowY:'auto',borderRadius:20,background:'var(--card)',border:'1px solid var(--border)',boxShadow:'0 32px 80px rgba(0,0,0,.4)'}} onClick={e=>e.stopPropagation()}>
            {/* Modal header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,background:'var(--card)',zIndex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Application Details</div>
              <button onClick={()=>setViewJobModal(null)} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)'}}>
                <span className="material-symbols-rounded" style={{fontSize:18}}>close</span>
              </button>
            </div>
            {/* Job hero */}
            {(()=>{
              const app=viewJobModal;
              const job=app.job||{};
              const coName=job.co||job.company_name||'Company';
              const sc=S_META_LOC[app.status]||S_META_LOC.pending;
              return(
                <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:16}}>
                  {/* Company + role */}
                  <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                    <div style={{width:60,height:60,borderRadius:14,flexShrink:0,overflow:'hidden',border:'2px solid var(--border)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(0,0,0,.08)'}}>
                      {job.avatar_url?<img src={job.avatar_url} alt={coName} style={{width:'100%',height:'100%',objectFit:'cover'}}/> :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff'}}>{coName.slice(0,2).toUpperCase()}</div>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.02em',marginBottom:3}}>{job.title||'Position'}</div>
                      <div style={{fontSize:13,color:'var(--text2)',fontWeight:600,marginBottom:8}}>{coName}</div>
                      <span style={{padding:'4px 12px',borderRadius:20,background:sc.bg,color:sc.color,fontSize:11,fontWeight:800,border:`1px solid ${sc.color}33`}}>{sc.label}</span>
                    </div>
                  </div>
                  {/* Meta chips */}
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {job.loc&&<span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text2)',background:'var(--bg3)',padding:'5px 11px',borderRadius:20,border:'1px solid var(--border)'}}><span className="material-symbols-rounded" style={{fontSize:13}}>location_on</span>{job.loc}</span>}
                    {job.pay&&<span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text2)',background:'var(--bg3)',padding:'5px 11px',borderRadius:20,border:'1px solid var(--border)'}}><span className="material-symbols-rounded" style={{fontSize:13}}>payments</span>{job.pay}</span>}
                    {job.listing_type&&<span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text2)',background:'var(--bg3)',padding:'5px 11px',borderRadius:20,border:'1px solid var(--border)'}}><span className="material-symbols-rounded" style={{fontSize:13}}>work_outline</span>{job.listing_type}</span>}
                    <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text2)',background:'var(--bg3)',padding:'5px 11px',borderRadius:20,border:'1px solid var(--border)'}}><span className="material-symbols-rounded" style={{fontSize:13}}>calendar_today</span>Applied {new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                  </div>
                  {/* Description */}
                  {job.description&&(
                    <div style={{background:'var(--bg3)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)'}}>
                      <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:.6,marginBottom:8}}>Job Description</div>
                      <div style={{fontSize:13.5,color:'var(--text2)',lineHeight:1.75,whiteSpace:'pre-wrap'}}>{job.description}</div>
                    </div>
                  )}
                  {/* Status insight */}
                  <div style={{padding:'12px 16px',borderRadius:12,background:sc.bg||'var(--bg3)',border:`1px solid ${sc.color}33`,display:'flex',alignItems:'center',gap:10}}>
                    <span className="material-symbols-rounded" style={{fontSize:22,color:sc.color,fontVariationSettings:"'FILL' 1",flexShrink:0}}>{sc.icon}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:sc.color}}>{sc.label}</div>
                      <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>
                        {app.status==='pending'&&'Your application was submitted and is awaiting review.'}
                        {app.status==='reviewed'&&'The company has reviewed your application.'}
                        {app.status==='shortlisted'&&'🎉 Great news — you\'ve been shortlisted!'}
                        {app.status==='hired'&&'🏆 Congratulations — you\'ve been accepted!'}
                        {app.status==='rejected'&&'This application was not selected this time.'}
                      </div>
                    </div>
                  </div>
                  {/* View full details button */}
                  <button onClick={()=>{setViewJobModal(null);if(setPage)setPage('my_applications');}} style={{width:'100%',padding:'12px',borderRadius:12,background:'#0A2E5C',color:'#fff',border:'none',fontSize:13.5,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    <span className="material-symbols-rounded" style={{fontSize:16}}>open_in_new</span>
                    View Full Application Details
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePage({user,onProfileUpdate,setPage}){
  // Schools use the company-style LinkedIn profile too — same shape, just labelled as a school.
  const isCompany=user?.userType==='company'||user?.userType==='school';
  // Company / school users get the LinkedIn-style company profile
  if(isCompany) return <CompanyProfilePage user={user} onProfileUpdate={onProfileUpdate} setPage={setPage}/>;

  const isCompanyX=false; // always false here — company users are handled above
  const uid=user?.user?.id;
  const initProfile=user?.profile||{};
  const [profTab,setProfTab]=useState('info'); // 'info' | 'payments' | 'ratings'

  // Form state — seeded from existing profile
  const [form,setForm]=useState({
    full_name: initProfile.full_name||user?.form?.name||'',
    bio: initProfile.bio||'',
    school: initProfile.school||'',
    major: initProfile.major||'',
    year: initProfile.year||'',
    linkedin: initProfile.linkedin||'',
    github: initProfile.github||'',
    twitter: initProfile.twitter||'',
    company_name: initProfile.company_name||'',
    industry: initProfile.industry||'',
    company_size: initProfile.company_size||'',
    website: initProfile.website||'',
  });
  const [saving,setSaving]=useState(false);
  const [photoUploading,setPhotoUploading]=useState(false);
  const [cvUploading,setCvUploading]=useState(false);
  const [photoUrl,setPhotoUrl]=useState(initProfile.avatar_url||null);
  const [cvName,setCvName]=useState(initProfile.cv_filename||null);
  const [cvUrl,setCvUrl]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const photoInputRef=useRef(null);

  function set(k,v){setForm(f=>({...f,[k]:v}));}

  useEffect(()=>{
    if(!uid||!cvName) { setCvUrl(null); return; }
    const c=getSB();
    if(!c){ setCvUrl(null); return; }
    const path=`cvs/${uid}_cv.pdf`;
    const {data}=c.storage.from('aluhub-media').getPublicUrl(path);
    setCvUrl(data?.publicUrl?`${data.publicUrl}?t=${Date.now()}`:null);
  },[uid,cvName]);

  // ── compress image client-side using Canvas (no external lib needed)
  async function compressImage(file,maxPx=800,quality=0.78){
    return new Promise((resolve)=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        let w=img.width,h=img.height;
        if(w>maxPx||h>maxPx){
          const ratio=Math.min(maxPx/w,maxPx/h);
          w=Math.round(w*ratio);h=Math.round(h*ratio);
        }
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        canvas.toBlob(blob=>resolve(blob),'image/webp',quality);
        URL.revokeObjectURL(url);
      };
      img.src=url;
    });
  }

  async function handlePhotoUpload(e){
    const file=e.target.files?.[0];
    if(!file||!uid) return;
    if(photoInputRef.current) photoInputRef.current.value='';
    if(file.size>10*1024*1024){toast('Image too large (max 10MB)');return;}
    setPhotoUploading(true);
    try{
      const compressed=await compressImage(file);
      const path=`avatars/${uid}.webp`;
      const c=getSB();
      // Use upsert:true — do NOT remove first, that causes RLS errors when file doesn't exist
      const{error}=await c.storage.from('aluhub-media').upload(path,compressed,{
        upsert:true,
        contentType:'image/webp',
        cacheControl:'0',
      });
      if(error) throw error;
      const{data}=c.storage.from('aluhub-media').getPublicUrl(path);
      const url=data.publicUrl+'?t='+Date.now();
      await c.from('profiles').update({avatar_url:url}).eq('id',uid);
      setPhotoUrl(url);
      if(onProfileUpdate) onProfileUpdate({...user,profile:{...(user.profile||{}),avatar_url:url}});
      toast('Photo updated');
    }catch(err){
      toast('Upload failed — make sure aluhub-media bucket allows authenticated uploads');
      console.error(err);
    }finally{setPhotoUploading(false);}
  }

  async function handleDeletePhoto(){
    if(!uid) return;
    setPhotoUploading(true);
    try{
      const c=getSB();
      const path=`avatars/${uid}.webp`;
      // Update DB first so UI reflects change even if storage delete is slow
      await c.from('profiles').update({avatar_url:null}).eq('id',uid);
      setPhotoUrl(null);
      if(onProfileUpdate) onProfileUpdate({...user,profile:{...(user.profile||{}),avatar_url:null}});
      // Try removing from storage — non-critical if it fails
      await c.storage.from('aluhub-media').remove([path]).catch(()=>{});
      toast('Photo removed');
    }catch(err){
      toast('Remove failed — '+err.message);
      console.error(err);
    }finally{setPhotoUploading(false);}
  }

  async function handleCvUpload(e){
    const file=e.target.files[0];
    if(!file||!uid) return;
    if(file.size>5*1024*1024){toast('CV too large (max 5MB)');return;}
    setCvUploading(true);
    try{
      const path=`cvs/${uid}_cv.pdf`;
      const c=getSB();
      const{error}=await c.storage.from('aluhub-media').upload(path,file,{upsert:true,contentType:'application/pdf'});
      if(error) throw error;
      await c.from('profiles').update({cv_filename:file.name,cv_uploaded_at:new Date().toISOString()}).eq('id',uid);
      setCvName(file.name);
      const {data}=c.storage.from('aluhub-media').getPublicUrl(path);
      setCvUrl(data?.publicUrl?`${data.publicUrl}?t=${Date.now()}`:null);
      toast('CV saved');
    }catch(err){
      toast('CV upload failed — check Supabase Storage bucket');
      console.error(err);
    }finally{setCvUploading(false);}
  }

  async function saveProfile(){
    if(!uid){toast('Not signed in');return;}
    setSaving(true);
    try{
      const c=getSB();
      const patch=isCompany
        ?{full_name:form.full_name,company_name:form.company_name,industry:form.industry,company_size:form.company_size,bio:form.bio,website:form.website,linkedin:form.linkedin,twitter:form.twitter}
        :{full_name:form.full_name,school:form.school,major:form.major,year:form.year,bio:form.bio,linkedin:form.linkedin,github:form.github,twitter:form.twitter};
      const{error}=await c.from('profiles').update(patch).eq('id',uid);
      if(error) throw error;
      if(onProfileUpdate) onProfileUpdate({...user,profile:{...initProfile,...patch},form:{...user.form,name:form.full_name}});
      setEditMode(false);
      toast('Profile saved');
    }catch(err){
      toast('Save failed');
      console.error(err);
    }finally{setSaving(false);}
  }

  const initials=(form.full_name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const planLabel={'pro':'Pro','premium':'Premium','standard':'Standard','basic':'Basic'}[initProfile.plan]||'Free';

  // ── LinkedIn-style section card ─────────────────────
  const SectionCard=({title,icon,onEdit,children,emptyContent})=>(
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,marginBottom:12,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <span className="material-symbols-rounded" style={{fontSize:19,color:'var(--accent)',fontVariationSettings:"'FILL' 0"}}>{icon}</span>
          <div style={{fontWeight:700,fontSize:15,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.01em'}}>{title}</div>
        </div>
        {onEdit&&<button onClick={onEdit} style={{width:32,height:32,borderRadius:8,background:'var(--bg3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
          <span className="material-symbols-rounded" style={{fontSize:15,color:'var(--text2)'}}>edit</span>
        </button>}
      </div>
      <div style={{paddingBottom:18,paddingLeft:20,paddingRight:20}}>
        {children||emptyContent}
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:1100,margin:'0 auto',padding:'0 0 60px'}}>

      {/* ── COVER + AVATAR hero — full bleed ── */}
      <div style={{position:'relative',marginBottom:80,marginLeft:'-32px',marginRight:'-32px',marginTop:'-24px'}}>
        <div style={{height:260,overflow:'hidden',background:'linear-gradient(130deg,#0A2E5C 0%,#1560a8 50%,#0d3572 100%)',position:'relative',width:'100%'}}>
          {initProfile.cover_url&&<img src={initProfile.cover_url} alt="cover" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(10,24,46,.3))'}}/>
        </div>

        {/* Avatar overlapping cover */}
        <div style={{position:'absolute',bottom:-52,left:48}}>
          <div style={{position:'relative'}}>
            {photoUrl
              ?<img src={photoUrl} alt="avatar" style={{width:108,height:108,borderRadius:'50%',objectFit:'cover',border:'5px solid var(--bg)',boxShadow:'0 6px 24px rgba(0,0,0,.22)'}}/>
              :<div style={{width:108,height:108,borderRadius:'50%',background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,fontWeight:900,color:'#fff',border:'5px solid var(--bg)',boxShadow:'0 6px 24px rgba(0,0,0,.22)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{initials}</div>
            }
            <label style={{position:'absolute',bottom:2,right:2,background:'#0A2E5C',color:'#fff',width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'3px solid var(--bg)',boxShadow:'0 2px 8px rgba(0,0,0,.25)'}} title="Change photo">
              {photoUploading?<span style={{fontSize:9,fontWeight:700}}>…</span>:<span className="material-symbols-rounded" style={{fontSize:14,fontVariationSettings:"'FILL' 1"}}>photo_camera</span>}
              <input ref={photoInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoUpload}/>
            </label>
          </div>
        </div>
        <div style={{position:'absolute',bottom:-60,right:0,display:'flex',gap:8}}>
          {profTab==='info'&&!editMode&&(
            <button onClick={()=>setEditMode(true)} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 20px',background:'#0A2E5C',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 10px rgba(10,46,92,.3)',letterSpacing:'-.01em'}}>
              <span className="material-symbols-rounded" style={{fontSize:15}}>edit</span>Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── NAME CARD (full-width) ── */}
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:'22px 28px 18px',marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:26,color:'var(--text)',letterSpacing:'-.04em',marginBottom:4}}>{form.full_name||'Your Name'}</div>
            {(form.major||form.year)&&<div style={{fontSize:15,color:'var(--text2)',fontWeight:500,marginBottom:8}}>{form.major}{form.year?' · '+form.year:''}</div>}
            <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center',marginBottom:8}}>
              {form.school&&<span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'var(--text2)',background:'rgba(10,46,92,.05)',padding:'3px 10px',borderRadius:20,border:'1px solid rgba(10,46,92,.1)'}}>
                <span className="material-symbols-rounded" style={{fontSize:14,color:'var(--accent)',fontVariationSettings:"'FILL' 1"}}>school</span>{form.school}
              </span>}
              <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700,color:'#10B981',background:'rgba(16,185,129,.08)',padding:'3px 12px',borderRadius:20,border:'1px solid rgba(16,185,129,.18)'}}>{planLabel}</span>
            </div>
          </div>
          {/* Social links */}
          {[form.linkedin,form.github,form.twitter].some(Boolean)&&(
            <div style={{display:'flex',flexWrap:'wrap',gap:7,alignItems:'center'}}>
              {form.linkedin&&<a href={form.linkedin.startsWith('http')?form.linkedin:'https://'+form.linkedin} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:20,background:'#0A2E5C',color:'#fff',fontSize:12,fontWeight:600,textDecoration:'none'}}>
                <span className="material-symbols-rounded" style={{fontSize:13}}>link</span>LinkedIn
              </a>}
              {form.github&&<a href={form.github.startsWith('http')?form.github:'https://'+form.github} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:20,background:'#1a1a2e',color:'#fff',fontSize:12,fontWeight:600,textDecoration:'none'}}>
                <span className="material-symbols-rounded" style={{fontSize:13}}>code</span>GitHub
              </a>}
              {form.twitter&&<a href={`https://twitter.com/${form.twitter.replace('@','')}`} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:20,background:'rgba(10,46,92,.08)',color:'var(--accent)',fontSize:12,fontWeight:600,textDecoration:'none',border:'1px solid rgba(10,46,92,.14)'}}>
                <span className="material-symbols-rounded" style={{fontSize:13}}>alternate_email</span>Twitter
              </a>}
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:'flex',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'10px 10px 0 0',borderBottom:'none',marginBottom:0,overflow:'hidden'}}>
        {[{id:'info',label:'Profile',icon:'person'},{id:'payments',label:'Payments',icon:'payments'},{id:'ratings',label:'Ratings',icon:'star'}].map(t=>(
          <button key={t.id} onClick={()=>{setProfTab(t.id);setEditMode(false);}} style={{flex:1,padding:'12px 16px',background:profTab===t.id?'rgba(10,46,92,.05)':'transparent',border:'none',borderBottom:profTab===t.id?'2.5px solid #0A2E5C':'2.5px solid transparent',fontSize:13,fontWeight:profTab===t.id?700:500,color:profTab===t.id?'#0A2E5C':'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all .15s'}}>
            <span className="material-symbols-rounded" style={{fontSize:15,fontVariationSettings:profTab===t.id?"'FILL' 1":"'FILL' 0"}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{height:1,background:'var(--border)',marginBottom:20}}/>

      {profTab==='payments'&&<div className="card anim"><PaymentHistory user={user}/></div>}
      {profTab==='ratings'&&<div className="card anim"><MyRatings user={user}/></div>}
      {profTab==='info'&&<>

      {/* ── EDIT MODE ── */}
      {editMode?(
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:28,marginBottom:16,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
            <div style={{fontWeight:700,fontSize:16,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.02em'}}>Edit Profile</div>
            <button onClick={()=>setEditMode(false)} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text2)'}}>
              <span className="material-symbols-rounded" style={{fontSize:16}}>close</span>
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{display:'block',fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:7}}>Full Name</label>
              <input className="form-input" value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="Your full name" style={{width:'100%'}}/>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{display:'block',fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:7}}>About Me</label>
              <textarea className="form-input" value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Your skills, interests, and career goals…" rows={5} style={{width:'100%',resize:'vertical'}}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:7}}>School</label>
              <select className="form-input" value={form.school} onChange={e=>set('school',e.target.value)} style={{width:'100%'}}>
                <option value="">Select…</option>
                <option>ALU</option>
                <option>CMU-Africa</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:7}}>Year</label>
              <select className="form-input" value={form.year} onChange={e=>set('year',e.target.value)} style={{width:'100%'}}>
                <option value="">Select…</option>
                {['Year 1','Year 2','Year 3','Year 4','Graduate'].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{display:'block',fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:7}}>Major / Programme</label>
              <input className="form-input" value={form.major} onChange={e=>set('major',e.target.value)} style={{width:'100%'}} placeholder="e.g. Software Engineering"/>
            </div>
            <div style={{gridColumn:'1/-1',borderTop:'1px solid var(--border)',paddingTop:16}}>
              <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:12}}>Social Links</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[['LinkedIn','linkedin','link'],['GitHub','github','code'],['Twitter','twitter','alternate_email']].map(([label,key,icon])=>(
                  <div key={key} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,overflow:'hidden',paddingLeft:10}}>
                    <span className="material-symbols-rounded" style={{fontSize:15,color:'var(--text3)',flexShrink:0}}>{icon}</span>
                    <input className="form-input" value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={label} style={{border:'none',background:'transparent',padding:'9px 8px 9px 0',width:'100%',outline:'none'}}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={{gridColumn:'1/-1',display:'flex',gap:10,paddingTop:4}}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{flex:1,justifyContent:'center'}}>{saving?'Saving…':'Save Changes'}</button>
              <button className="btn btn-ghost" onClick={()=>setEditMode(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ):(

        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start'}}>

          {/* LEFT COLUMN */}
          <div>

            {/* About */}
            <SectionCard title="About" icon="person" onEdit={()=>setEditMode(true)}>
              {form.bio
                ?<p style={{fontSize:14.5,color:'var(--text2)',lineHeight:1.9,margin:0,whiteSpace:'pre-line'}}>{form.bio}</p>
                :<div style={{textAlign:'center',padding:'24px 0'}}>
                  <span className="material-symbols-rounded" style={{fontSize:44,color:'var(--text3)',display:'block',marginBottom:12,opacity:.35}}>edit_note</span>
                  <div style={{fontSize:13.5,color:'var(--text3)',marginBottom:16,lineHeight:1.6}}>Tell your story — your skills,<br/>interests and career goals.</div>
                  <button onClick={()=>setEditMode(true)} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 20px',background:'#0A2E5C',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    <span className="material-symbols-rounded" style={{fontSize:15}}>add</span>Add About
                  </button>
                </div>
              }
            </SectionCard>

            {/* Education */}
            <SectionCard title="Education" icon="school" onEdit={()=>setEditMode(true)}>
              {[form.school,form.major,form.year].some(Boolean)
                ?<div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                  <div style={{width:52,height:52,borderRadius:12,background:'rgba(10,46,92,.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid rgba(10,46,92,.1)'}}>
                    <span className="material-symbols-rounded" style={{fontSize:28,color:'#0A2E5C',fontVariationSettings:"'FILL' 1"}}>school</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:15,color:'var(--text)',marginBottom:3}}>{form.school||'ALU'}</div>
                    {form.major&&<div style={{fontSize:13.5,color:'var(--text2)',marginBottom:2}}>{form.major}</div>}
                    {form.year&&<div style={{fontSize:12.5,color:'var(--text3)',fontStyle:'italic'}}>{form.year}</div>}
                  </div>
                </div>
                :<div style={{textAlign:'center',padding:'16px 0'}}>
                  <button onClick={()=>setEditMode(true)} style={{background:'none',border:'none',color:'#0A2E5C',fontWeight:600,cursor:'pointer',fontSize:13,display:'inline-flex',alignItems:'center',gap:4}}>
                    <span className="material-symbols-rounded" style={{fontSize:15}}>add</span>Add education
                  </button>
                </div>
              }
            </SectionCard>

            {/* CV Card */}
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:22,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:cvName?16:0}}>
                <div style={{width:46,height:46,borderRadius:12,background:'rgba(10,46,92,.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid rgba(10,46,92,.1)'}}>
                  <span className="material-symbols-rounded" style={{fontSize:22,color:'#0A2E5C'}}>description</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14.5,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'-.01em'}}>CV / Resume</div>
                  <div style={{fontSize:12,color:'var(--text3)',marginTop:1}}>PDF · max 5MB · used for AI job matching</div>
                </div>
                {cvName
                  ?<span style={{fontSize:11,color:'#10B981',fontWeight:700,display:'inline-flex',alignItems:'center',gap:3,background:'rgba(16,185,129,.08)',padding:'4px 12px',borderRadius:20,border:'1px solid rgba(16,185,129,.2)'}}><span className='material-symbols-rounded' style={{fontSize:12,fontVariationSettings:"'FILL' 1"}}>check_circle</span>Uploaded</span>
                  :<label style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 18px',background:'#0A2E5C',color:'#fff',borderRadius:9,cursor:cvUploading?'not-allowed':'pointer',fontSize:12.5,fontWeight:600}}>
                    <span className="material-symbols-rounded" style={{fontSize:14}}>upload</span>{cvUploading?'Uploading…':'Upload CV'}
                    <input type="file" accept="application/pdf" style={{display:'none'}} onChange={handleCvUpload} disabled={cvUploading}/>
                  </label>
                }
              </div>
              {cvName&&(
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',background:'rgba(16,185,129,.05)',borderRadius:10,border:'1px solid rgba(16,185,129,.15)'}}>
                  <span className="material-symbols-rounded" style={{fontSize:24,color:'#10B981',fontVariationSettings:"'FILL' 1",flexShrink:0}}>picture_as_pdf</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cvName}</div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {cvUrl&&<a href={cvUrl} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text2)',fontSize:12,fontWeight:600,textDecoration:'none'}}>
                      <span className="material-symbols-rounded" style={{fontSize:13}}>open_in_new</span>View
                    </a>}
                    <label style={{display:'inline-flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background:'var(--bg3)',border:'1px solid var(--border)',color:'#0A2E5C',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      <span className="material-symbols-rounded" style={{fontSize:13}}>upload</span>Replace
                      <input type="file" accept="application/pdf" style={{display:'none'}} onChange={handleCvUpload} disabled={cvUploading}/>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* My Recent Applications */}
            <ProfileApplicationsSection setPage={setPage}/>

          </div>

          {/* RIGHT COLUMN — sidebar cards */}
          <div>

            {/* Profile completeness */}
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:'18px 20px',marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
              <div style={{fontWeight:700,fontSize:13.5,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:12}}>Profile Strength</div>
              {(()=>{
                const items=[form.full_name,form.bio,form.school,form.major,form.linkedin,cvName,photoUrl];
                const filled=items.filter(Boolean).length;
                const pct=Math.round(filled/items.length*100);
                const color=pct>=80?'#10B981':pct>=50?'#F59E0B':'#EF4444';
                return(
                  <>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontSize:22,fontWeight:800,color,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{pct}%</span>
                      <span style={{fontSize:12,color:'var(--text3)'}}>{filled}/{items.length} complete</span>
                    </div>
                    <div style={{height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:pct+'%',background:color,borderRadius:3,transition:'width 1s ease'}}/>
                    </div>
                    {pct<100&&<div style={{fontSize:12,color:'var(--text3)',marginTop:10,lineHeight:1.6}}>
                      {!form.bio&&<div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="material-symbols-rounded" style={{fontSize:13,color:'#F59E0B'}}>radio_button_unchecked</span>Add an About Me</div>}
                      {!form.linkedin&&<div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span className="material-symbols-rounded" style={{fontSize:13,color:'#F59E0B'}}>radio_button_unchecked</span>Add LinkedIn</div>}
                      {!cvName&&<div style={{display:'flex',alignItems:'center',gap:6}}><span className="material-symbols-rounded" style={{fontSize:13,color:'#F59E0B'}}>radio_button_unchecked</span>Upload your CV</div>}
                    </div>}
                  </>
                );
              })()}
            </div>

            {/* Photo card */}
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:'18px 20px',marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
              <div style={{fontWeight:700,fontSize:13.5,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:12}}>Profile Photo</div>
              <div style={{fontSize:12.5,color:'var(--text3)',marginBottom:12}}>{photoUrl?'Change or remove your photo':'Add a photo to stand out'}</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <label style={{display:'inline-flex',alignItems:'center',gap:5,padding:'8px 14px',background:'rgba(10,46,92,.07)',border:'1px solid rgba(10,46,92,.13)',borderRadius:8,fontSize:12,fontWeight:600,color:'#0A2E5C',cursor:'pointer',flex:1,justifyContent:'center'}}>
                  <span className="material-symbols-rounded" style={{fontSize:13}}>upload</span>{photoUrl?'Change':'Upload'}
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoUpload}/>
                </label>
              </div>
            </div>
            <div style={{background:'linear-gradient(135deg,#0A2E5C,#1a4a80)',borderRadius:16,padding:'18px 20px',marginBottom:14,color:'#fff'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span className="material-symbols-rounded" style={{fontSize:18,fontVariationSettings:"'FILL' 1"}}>workspace_premium</span>
                <div style={{fontWeight:700,fontSize:13.5,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{planLabel} Plan</div>
              </div>
              <div style={{fontSize:12,opacity:.7,lineHeight:1.6,marginBottom:14}}>Unlock premium features — priority listings, unlimited applications, and direct messaging.</div>
              <button style={{width:'100%',padding:'9px',borderRadius:9,background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',fontSize:12.5,fontWeight:700,cursor:'pointer'}}>Upgrade Plan</button>
            </div>

          </div>
        </div>
      )}
      </>}
    </div>
  );
}

// ── NOTIFICATIONS FULL PAGE ───────────────────────────
function NotificationsPage({user}){
  const [notifs,setNotifs]=useState([]);
  const [filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true);

  const typeIcon={new_job:'work',new_listing:'work',followed_company_listing:'notifications_active',status_change:'stars',housing:'apartment',dm:'mail',message:'chat_bubble',payment:'payments',new_application:'folder_open',booking:'event'};
  const typeColor={new_job:'#0A2E5C',new_listing:'#0A2E5C',followed_company_listing:'#7D52AD',status_change:'#E66000',housing:'#03893A',dm:'#7eb3f8',message:'#7eb3f8',payment:'#03893A',new_application:'#7D52AD',booking:'#E66000'};
  const typeLabel={new_job:'New Listing',new_listing:'New Listing',followed_company_listing:'Followed Company',status_change:'Status Update',housing:'Housing',dm:'Direct Message',message:'Message',payment:'Payment',new_application:'New Application',booking:'Booking'};
  const typeBg={new_job:'rgba(10,46,92,.12)',new_listing:'rgba(10,46,92,.12)',followed_company_listing:'rgba(125,82,173,.12)',status_change:'rgba(230,96,0,.12)',housing:'rgba(3,137,58,.12)',dm:'rgba(63,188,233,.12)',message:'rgba(63,188,233,.12)',payment:'rgba(3,137,58,.12)',new_application:'rgba(125,82,173,.12)',booking:'rgba(230,96,0,.12)'};

  function timeSince(dateStr){
    if(!dateStr) return '';
    const s=Math.floor((Date.now()-new Date(dateStr).getTime())/1000);
    if(s<60) return 'just now';
    if(s<3600) return Math.floor(s/60)+'m ago';
    if(s<86400) return Math.floor(s/3600)+'h ago';
    return Math.floor(s/86400)+'d ago';
  }

  function dayLabel(dateStr){
    if(!dateStr) return 'Unknown';
    const d=new Date(dateStr);
    const today=new Date();
    const yest=new Date(today); yest.setDate(yest.getDate()-1);
    if(d.toDateString()===today.toDateString()) return 'Today';
    if(d.toDateString()===yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
  }

  useEffect(()=>{
    const uid=user?.user?.id;
    if(!uid){setLoading(false);return;}
    dbGetNotifs(uid).then(data=>{
      setNotifs(data||[]);
      setLoading(false);
    });
  },[user?.user?.id]);

  async function markAllRead(){
    const uid=user?.user?.id;
    if(!uid) return;
    await dbMarkRead(uid);
    setNotifs(prev=>prev.map(n=>({...n,read:true})));
  }

  const filtered=filter==='all'?notifs:filter==='unread'?notifs.filter(n=>!n.read):notifs.filter(n=>n.type===filter);
  const unreadCount=notifs.filter(n=>!n.read).length;

  // Group by day
  const groups=[];
  let lastDay='';
  filtered.forEach(n=>{
    const day=dayLabel(n.created_at);
    if(day!==lastDay){groups.push({type:'day',label:day});lastDay=day;}
    groups.push({type:'notif',notif:n});
  });

  const types=[...new Set(notifs.map(n=>n.type).filter(Boolean))];

  return(
    <div className="notif-page">
      {/* Hero */}
      <div className="notif-page-hero">
        <div style={{display:'flex',alignItems:'center',gap:16,flex:1,minWidth:0}}>
          <div className="notif-page-hero-icon">
            <span className="material-symbols-rounded">notifications_active</span>
          </div>
          <div>
            <div className="notif-page-title">Notifications</div>
            <div className="notif-page-sub">Stay on top of your updates, messages, and opportunities</div>
            {unreadCount>0&&(
              <div className="notif-page-count">
                <span className="material-symbols-rounded" style={{fontSize:13}}>mark_email_unread</span>
                {unreadCount} unread
              </div>
            )}
          </div>
        </div>
        <div className="notif-page-actions">
          {unreadCount>0&&(
            <button className="btn btn-ghost" style={{color:'rgba(255,255,255,.75)',borderColor:'rgba(255,255,255,.15)',background:'rgba(255,255,255,.08)'}} onClick={markAllRead}>
              <span className="material-symbols-rounded" style={{fontSize:14}}>done_all</span>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="notif-filters">
        {[{id:'all',label:'All'},{id:'unread',label:'Unread'},...types.map(t=>({id:t,label:typeLabel[t]||t}))].map(f=>(
          <button key={f.id} className={`notif-filter-btn${filter===f.id?' active':''}`} onClick={()=>setFilter(f.id)}>
            {f.label}
            {f.id==='unread'&&unreadCount>0&&<span style={{marginLeft:5,background:'#C53832',color:'#fff',borderRadius:10,padding:'1px 6px',fontSize:10,fontWeight:800}}>{unreadCount}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading?(
        <div style={{textAlign:'center',padding:48,color:'var(--text3)'}}>
          <div className="dots"><span/><span/><span/></div>
          <div style={{marginTop:14,fontSize:13}}>Loading notifications…</div>
        </div>
      ):filtered.length===0?(
        <div className="notif-page-empty">
          <span className="material-symbols-rounded">notifications_off</span>
          <div className="notif-page-empty-title">{filter==='unread'?'All caught up!':'No notifications yet'}</div>
          <div className="notif-page-empty-sub">{filter==='unread'?"You've read all your notifications.":'New listings, status updates, and messages will appear here.'}</div>
        </div>
      ):(
        <div className="notif-page-list">
          {groups.map((g,i)=>g.type==='day'
            ?<div key={`day-${i}`} className="notif-day-label">{g.label}</div>
            :(()=>{const n=g.notif;return(
            <div key={n.id||i} className={`notif-page-item${n.read?'':' unread'}`}>
              <div className="notif-page-icon" style={{background:typeBg[n.type]||'rgba(10,46,92,.1)',color:typeColor[n.type]||'#0A2E5C'}}>
                <span className="material-symbols-rounded">{typeIcon[n.type]||'notifications'}</span>
              </div>
              <div className="notif-page-content">
                <div className="notif-page-type" style={{color:typeColor[n.type]||'var(--accent)'}}>{typeLabel[n.type]||n.type||'Notification'}</div>
                <div className="notif-page-item-title">{n.title}</div>
                <div className="notif-page-item-body">{n.body}</div>
                <div className="notif-page-meta">
                  <span className="notif-page-time">
                    <span className="material-symbols-rounded" style={{fontSize:12}}>schedule</span>
                    {new Date(n.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    <span style={{opacity:.6}}>· {timeSince(n.created_at)}</span>
                  </span>
                  <span className="notif-page-status" style={{color:n.read?'var(--text3)':'#0A2E5C'}}>
                    <span className="material-symbols-rounded">{n.read?'done_all':'mark_email_unread'}</span>
                    {n.read?'Read':'New'}
                  </span>
                </div>
              </div>
              {!n.read&&<div className="notif-page-unread-dot"/>}
            </div>
          );})()
          )}
        </div>
      )}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────
function NotificationBell({user,onNavigate}){
  const [unread,setUnread]=useState(0);
  const uid=user?.user?.id;
  useEffect(()=>{
    if(!uid) return;
    dbGetNotifs(uid).then(data=>{
      setUnread((data||[]).filter(n=>!n.read).length);
    });
    const c=getSB(); if(!c) return;
    const ch=c.channel('notif-bell-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+uid},()=>{
        setUnread(p=>p+1);
      }).subscribe();
    return ()=>c.removeChannel(ch);
  },[uid]);
  return(
    <button onClick={onNavigate} title="Notifications" style={{position:'relative',background:'none',border:'none',cursor:'pointer',color:'var(--text2)',display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36,borderRadius:9,transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
      <span className="material-symbols-rounded" style={{fontSize:22}}>notifications</span>
      {unread>0&&<span style={{position:'absolute',top:4,right:4,minWidth:16,height:16,borderRadius:8,background:'#C53832',color:'#fff',fontSize:9.5,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',lineHeight:1,border:'2px solid var(--bg)'}}>{unread>99?'99+':unread}</span>}
    </button>
  );
}
function AIMatchingDemo(){
  const ref=React.useRef(null);
  React.useEffect(()=>{
    // Resize iframe to its content height once loaded
    const el=ref.current;
    if(!el) return;
    const onLoad=()=>{
      try{
        const h=el.contentDocument?.body?.scrollHeight;
        if(h) el.style.height=h+'px';
      }catch(e){}
    };
    el.addEventListener('load',onLoad);
    return ()=>el.removeEventListener('load',onLoad);
  },[]);
  return(
    <div style={{padding:'0 0 2rem'}}>
      <iframe
        ref={ref}
        src="aluhub_ai_matching_demo.html"
        title="AI Matching Demo"
        style={{width:'100%',minHeight:'90vh',border:'none',display:'block'}}
        scrolling="yes"
      />
    </div>
  );
}
function App({user:initialUser,onSignOut}){
  // Schools start on the company dashboard too — they post jobs like companies.
  const [page,setPage]=useState((initialUser?.userType==='company'||initialUser?.userType==='school')?'company_dashboard':'dashboard');
  const [viewCompanyFromJob,setViewCompanyFromJob]=useState(null);
  const [activeMsg,setActiveMsg]=useState(null);
  const [activeDM,setActiveDM]=useState(null);
  const [user,setUser]=useState(initialUser);
  const [mobileNavOpen,setMobileNavOpen]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [sidebarHovered,setSidebarHovered]=useState(false);
  const [msgUnread,setMsgUnread]=useState(0);

  // Always keep window.__aluHubUser in sync so child components reading it get the real userType
  window.__aluHubUser = user;

  // Schools use the company-style chrome (sidebar/header) — same posting flow.
  const isSchool=user?.userType==='school';
  const isCompany=user?.userType==='company'||isSchool;
  const profile=user?.profile||{};
  const initials=isCompany
    ?(profile.company_name||profile.full_name||'C').slice(0,2).toUpperCase()
    :(profile.full_name||user?.form?.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const planLabel=isSchool
    ?'School'
    :isCompany
      ?({'premium':'Premium','standard':'Standard','basic':'Basic'}[profile.plan]||'Listed')
      :({'pro':'Pro','premium':'Premium','standard':'Standard','basic':'Basic'}[profile.plan]||'Member');

  useEffect(()=>{
    window.__aluHubUser = user;
    document.documentElement.setAttribute('data-theme','light');
  },[user]);

  // ── Global realtime unread message counter ──────────────────────
  const pageRef=useRef(page);
  useEffect(()=>{pageRef.current=page;},[page]);

  useEffect(()=>{
    const uid=user?.user?.id; if(!uid) return;
    const c=getSB(); if(!c) return;
    // Count unread on mount (DMs + app messages)
    const refreshUnread=()=>{
      // Only count unread from direct_messages; app 'messages' table has no read column
      c.from('direct_messages').select('id',{count:'exact',head:true}).eq('recipient_id',uid).eq('read',false)
        .then(dm=>setMsgUnread(dm.count||0));
    };
    refreshUnread();
    // Realtime: new message arrives → bump count if not on messages page
    const ch=c.channel('global-unread-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages',filter:'recipient_id=eq.'+uid},()=>{
        if(pageRef.current!=='messages') setMsgUnread(n=>n+1);
      })
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
        if(payload.new?.sender_id!==uid && pageRef.current!=='messages') setMsgUnread(n=>n+1);
      })
      .subscribe();
    return ()=>c.removeChannel(ch);
  },[user?.user?.id]);

  // Clear unread badge when user opens messages page
  useEffect(()=>{ if(page==='messages') setMsgUnread(0); },[page]);

  const studentNav=[
    {id:'dashboard',icon:'grid_view',label:'Dashboard'},
    {id:'internships',icon:'work',label:'Internships & Jobs',badge:3},
    {id:'my_applications',icon:'task_alt',label:'My Applications'},
    {id:'messages',icon:'chat_bubble',label:'Messages',badge:msgUnread||null},
    {id:'notifications',icon:'notifications',label:'Notifications'},
    {id:'skills',icon:'school',label:'Skills Market'},
    {id:'survival',icon:'map',label:'Kigali Guide'},
    {id:'resources',icon:'auto_stories',label:'Resources'},
    {id:'companies',icon:'business',label:'Companies'},
    {id:'housing',icon:'apartment',label:'Housing Board',badge:3},

    {id:'profile',icon:'account_circle',label:'My Profile'},
  ];

  const companyNav=[
    {id:'company_dashboard',icon:'bar_chart',label:'Dashboard'},
    {id:'company_applications',icon:'folder_open',label:'Applications',badge:2},
    {id:'company_listings',icon:'work',label:'My Listings'},
    {id:'company_analytics',icon:'insights',label:'Analytics'},
    {id:'messages',icon:'chat_bubble',label:'Messages',badge:msgUnread||null},
    {id:'notifications',icon:'notifications',label:'Notifications'},
    {id:'profile',icon:'business',label:'Company Profile'},
  ];

  const navItems=isCompany?companyNav:studentNav;
  const currentPage=navItems.find(n=>n.id===page)||navItems[0];

  function go(p){setPage(p);setMobileNavOpen(false);}

  function handleMessage(app){setActiveMsg(app);setActiveDM(null);setPage('messages');}
  function handleDMStudent(dm){setActiveDM(dm);setActiveMsg(null);setPage('messages');}

  // Guard: strictly route each user type to only their allowed pages
  const STUDENT_PAGES=['dashboard','internships','my_applications','skills','survival','resources','companies','housing'];
  const COMPANY_PAGES=['company_dashboard','company_applications','company_listings','company_analytics','post_job'];
  const SHARED_PAGES=['messages','notifications','profile'];

  const effectivePage = (() => {
    if(isCompany && STUDENT_PAGES.includes(page)) return 'company_dashboard';
    if(!isCompany && COMPANY_PAGES.includes(page)) return 'dashboard';
    return page;
  })();

  // Student-only pages
  const studentPages=!isCompany?{
    dashboard:<Dashboard setPage={setPage}/>,
    internships:<Internships setPage={setPage} onViewCompany={job=>{setViewCompanyFromJob(job);setPage('companies');}}/>,
    my_applications:<MyApplications user={user} onMessage={handleMessage}/>,
    skills:<Skills/>,
    survival:<SurvivalGuide/>,
    resources:<Resources/>,
    companies:<Companies initialCompanyId={viewCompanyFromJob?.company_id} onEnter={()=>setViewCompanyFromJob(null)}/>,
    housing:<HousingBoard onDMStudent={handleDMStudent}/>,
  }:{};

  // Company-only pages (never rendered for students)
  const companyPages=isCompany?{
    company_dashboard:<Dashboard setPage={setPage}/>,
    company_applications:<CompanyDashboard user={user} onMessage={handleMessage}/>,
    company_listings:<CompanyListingsPage user={user}/>,
    company_analytics:<CompanyAnalyticsPage user={user}/>,
  }:{};

  // Shared pages (both user types)
  const sharedPages={
    messages:<Messenger user={user} activeApp={activeMsg} activeDM={activeDM}/>,
    notifications:<NotificationsPage user={user}/>,
    profile:<ProfilePage user={user} onProfileUpdate={setUser} setPage={setPage}/>,
  };

  const pages={...studentPages,...companyPages,...sharedPages};

  return(
    <>
      {/* Mobile overlay */}
      {mobileNavOpen&&<div className="mob-overlay" onClick={()=>setMobileNavOpen(false)}/>}

      {/* ── FIXED TOP BAR (outside main so it never scrolls away) ── */}
      <div className="sb-topbar">
        <div className="sb-topbar-left">
          <button className="sb-hamburger" onClick={()=>setMobileNavOpen(o=>!o)}>
            <span className="material-symbols-rounded">menu</span>
          </button>
          <span className="sb-topbar-crumb">ALU Hub</span>
          <span className="sb-topbar-sep">›</span>
          <span className="sb-topbar-title">{currentPage?.label||'Dashboard'}</span>
        </div>
        <div className="sb-topbar-right">
          <NotificationBell user={user} onNavigate={()=>go('notifications')}/>
        </div>
      </div>

      <div className={`shell${sidebarCollapsed&&!sidebarHovered?' sb-collapsed':''}`}>
        {/* ── SIDEBAR ── */}
        <aside
          className={`sidebar${mobileNavOpen?' mob-open':''}${sidebarCollapsed&&!sidebarHovered?' collapsed':''}`}
          onMouseEnter={()=>sidebarCollapsed&&setSidebarHovered(true)}
          onMouseLeave={()=>setSidebarHovered(false)}
        >
          {/* Logo */}
          <div className="sb-logo">
            <div className="sb-logo-mark">A</div>
            <div className="sb-logo-text">ALU<span>Hub</span></div>
            <button className="sb-collapse-btn" onClick={()=>setSidebarCollapsed(c=>!c)} title={sidebarCollapsed?'Expand sidebar':'Collapse sidebar'}>
              <span className="material-symbols-rounded">chevron_left</span>
            </button>
          </div>

          {/* Nav */}
          <nav className="sb-nav">
            {navItems.map(n=>(
              <button
                key={n.id}
                className={`sb-nav-item${page===n.id?' active':''}`}
                onClick={()=>go(n.id)}
                data-label={n.label}
              >
                <span className="material-symbols-rounded sb-nav-icon">{n.icon}</span>
                <span className="sb-nav-label">{n.label}</span>
                {n.badge&&page!==n.id&&<span className="sb-badge">{n.badge}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div className="sb-bottom">
            <div className="sb-user" onClick={()=>go('profile')}>
              {profile.avatar_url
                ?<img src={profile.avatar_url} alt="av" className="sb-avatar" style={{objectFit:'cover'}}/>
                :<div className="sb-avatar">{initials}</div>
              }
              <div className="sb-user-info">
                <div className="sb-user-name">{isCompany?(profile.company_name||'Company'):(profile.full_name||user?.form?.name||'Member')}</div>
                <div className="sb-user-sub">{isCompany?(profile.industry||'Hiring partner'):(planLabel+' · '+(profile.school||'ALU'))}</div>
              </div>
            </div>
            <button className="sb-action-btn" onClick={onSignOut}>
              <span className="material-symbols-rounded" style={{fontSize:17}}>logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className={`main${effectivePage==='messages'?' messenger-page':''}`} style={{marginLeft:undefined,transition:'margin-left .28s cubic-bezier(.4,0,.2,1)'}}>
          <div className="main-inner" style={page==='profile'&&isCompany?{maxWidth:'1100px',padding:'24px 32px',margin:'0 auto',boxSizing:'border-box'}:{}}>
            {pages[effectivePage]||<div style={{padding:40,color:'var(--text3)'}}>Page not found</div>}
          </div>
        </main>
      </div>

      <div id="toast">
        <span className="material-symbols-rounded" style={{fontSize:16}}>check_circle</span>
        <span id="toast-text"></span>
      </div>
    </>
  );
}

// App is rendered by ALUHub_Auth.js's AppWithAuth wrapper.
// Do NOT call ReactDOM.createRoot here — auth handles it.
