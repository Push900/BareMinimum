
const app = document.getElementById("app");
const toastArea = document.getElementById("toastArea");

const state = {
  screen: "home",
  scores: { wellbeing: 62, work: 48, consumption: 71 },
  completedChallenges: new Set(),
  assessmentIndex: 0,
  assessmentAnswers: {},
  assessmentSelected: null,
  challengeTab: "daily",
  exploreFilter: "all"
};

const questions = [
  ["wellbeing","🌿","How often do you get 7+ hours of sleep?",["Rarely","Sometimes","Most nights","Every night"]],
  ["wellbeing","🏃","How much do you move your body in a week?",["Barely at all","1-2 times","3-4 times","Daily"]],
  ["wellbeing","📱","How's your relationship with screens?",["Always on","Hard to put down","Mostly mindful","Very intentional"]],
  ["wellbeing","🧘","How do you manage stress?",["Barely manage","Sometimes cope","Have some tools","Got this handled"]],
  ["work","⏰","How often do you actually disconnect after work?",["Never","Rarely","Usually","Always"]],
  ["work","🎯","Do you feel like your work has meaning?",["Not really","Sometimes","Mostly yes","Absolutely"]],
  ["work","🤝","How are your workplace relationships?",["Tough","Okay","Pretty good","Great"]],
  ["work","📚","Do you make time to learn new things?",["Never","Rarely","Sometimes","Regularly"]],
  ["consumption","🛒","How intentional are your purchases?",["Impulse buyer","Sometimes impulsive","Usually thoughtful","Very intentional"]],
  ["consumption","🍽️","How plant-forward is your diet?",["Mostly meat","Some balance","Mostly plants","Plant-based"]],
  ["consumption","🌍","How often do you think about your environmental impact?",["Not often","Occasionally","Regularly","It's a priority"]],
  ["consumption","♻️","How much do you reduce, reuse, recycle?",["Barely","A little","Quite a bit","Obsessively"]]
];

const challenges = {
  daily: [
    ["💧","Drink 8 cups of water","Hydration = energy. No excuses.",10,342,"wellbeing"],
    ["🚶","10-min walk, no headphones","Just you and the world.",15,218,"wellbeing"],
    ["📵","Phone-free breakfast","Eat. Just eat.",20,156,"wellbeing"],
    ["🌿","One plant-based meal","Swap one thing. That's it.",15,289,"consumption"],
    ["✍️","3 things you're grateful for","Write it down. It compounds.",10,405,"wellbeing"]
  ],
  "7day": [
    ["🛌","7 days of 7hrs sleep","Build the habit that builds everything else.",100,89,"wellbeing"],
    ["🥗","No ultra-processed food week","Real ingredients only.",120,67,"consumption"],
    ["🚫","Social media morning detox","No socials until 11am for 7 days.",80,134,"wellbeing"],
    ["🌍","Zero single-use plastic week","Bring your own. Always.",150,52,"consumption"]
  ],
  monthly: [
    ["🏃","30-day movement streak","Move every single day. Shape that counts.",500,31,"wellbeing"],
    ["♻️","Carbon-conscious month","Track and reduce your impact systematically.",600,18,"consumption"],
    ["🎯","Learn one new skill","One hour a day. 30 days. Something new.",400,45,"work"]
  ]
};

const articles = [
  ["wellbeing","7 min","Why 7hrs beats 9hrs for most people","More sleep isn't always better. Here's what your body actually needs."],
  ["consumption","5 min","The 48-hour rule for impulse buying","A simple pause that makes spending more intentional."],
  ["work","6 min","Why your inbox is lying to you","Being busy and doing meaningful work are not the same thing."],
  ["wellbeing","4 min","Micro-stress: the invisible drain","Small sources of stress can quietly add up throughout the day."],
  ["consumption","8 min","Your actual carbon footprint (simplified)","The few lifestyle areas that matter most."],
  ["work","5 min","The minimum viable workday","How to protect your energy without disappearing from work."],
  ["wellbeing","6 min","Why 'exercise' is the wrong frame","Think movement, not punishment."],
  ["consumption","7 min","Plant-based for beginners (no lectures)","A practical starting point without the guilt."]
];

function go(screen) {
  state.screen = screen;
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}

function toast(message) {
  toastArea.innerHTML = `<div class="design-toast">${message}</div>`;
  setTimeout(() => toastArea.innerHTML = "", 2500);
}

function overallScore() {
  return Math.round((state.scores.wellbeing + state.scores.work + state.scores.consumption) / 3);
}

function logo() {
  return `<span class="brand">bare<span class="brand-mark">min</span></span>`;
}

function topNav() {
  return `
    <nav class="container-fluid px-4 px-md-5 py-4">
      <div class="d-flex align-items-center justify-content-between">
        ${logo()}
        <div class="d-none d-md-flex gap-4 mono-label text-muted-design">
          <button class="btn btn-link p-0 text-muted-design text-decoration-none" onclick="go('explore')">Explore</button>
          <button class="btn btn-link p-0 text-muted-design text-decoration-none" onclick="go('challenges')">Challenges</button>
          <button class="btn btn-link p-0 text-muted-design text-decoration-none" onclick="go('impact')">Impact</button>
        </div>
        <button class="btn btn-ink btn-round px-4 py-2 mono-label btn-press" onclick="go('assessment')">Start →</button>
      </div>
    </nav>`;
}

function bottomNav() {
  const items = [
    ["home","🏠","Home"],["dashboard","📋","Today"],["challenges","⚡","Challenges"],["explore","🗺️","Explore"],["impact","📈","Impact"]
  ];
  return `<div class="bottom-nav">
    <div class="bottom-nav-inner d-flex justify-content-around">
      ${items.map(([id,icon,label]) => `
        <button class="${state.screen===id ? "active" : ""}" onclick="go('${id}')">
          <span class="nav-icon">${icon}</span><span class="nav-text">${label}</span>
        </button>`).join("")}
    </div>
  </div>`;
}

function home() {
  return `<div class="page">
    ${topNav()}
    <main>
      <section class="container px-4 px-md-5 pt-4 pt-md-5 pb-5">
        <div class="max-width">
          <span class="pill bg-lime mb-4 fade-up">● Because the minimum should be better.</span>
          <div class="fade-up">
            <div class="hero-title">BARE</div>
            <div class="hero-title hero-min">MINIMUM</div>
          </div>
          <div class="row align-items-start mt-4 mt-md-5 g-4">
            <div class="col-lg-5">
              <p class="text-muted-design fs-5">Small actions. Real impact. No guilt trips. Just your bare minimum — done consistently.</p>
              <button class="btn btn-ink rounded-4 p-4 mt-3 w-100 text-start btn-press" onclick="go('assessment')">
                <div class="fs-1">⚡</div>
                <div class="display-serif fs-2">Find your<br>bare minimum</div>
                <div class="mono-label mt-2 opacity-75">3-min assessment →</div>
              </button>
            </div>
            <div class="col-lg-5 offset-lg-1">
              <div class="d-flex flex-wrap flex-lg-column gap-3">
                <button class="btn bg-lime rounded-4 p-3 text-start card-hover" onclick="go('explore')">🌿 <span class="display-serif fs-5">Well-being</span></button>
                <button class="btn bg-blue text-white rounded-4 p-3 text-start card-hover" onclick="go('explore')">💼 <span class="display-serif fs-5">Work</span></button>
                <button class="btn bg-orange text-white rounded-4 p-3 text-start card-hover" onclick="go('explore')">♻️ <span class="display-serif fs-5">Consumption</span></button>
              </div>
            </div>
          </div>
          <div class="row border-top mt-5 pt-4 g-4 fade-up">
            ${[["3 min","to assess your lifestyle"],["12k+","people taking action"],["94%","feel less overwhelmed"]].map(x=>`
              <div class="col-4"><div class="stat-number">${x[0]}</div><div class="mono-label text-muted-design mt-1">${x[1]}</div></div>`).join("")}
          </div>
        </div>
      </section>

      <section class="section-dark py-5 mt-3">
        <div class="container px-4 px-md-5">
          <div class="max-width">
            <div class="mono-label text-lime mb-4" style="color:var(--lime)">How it works</div>
            <div class="row g-4">
              ${[
                ["01","🧭","Assess","Answer 12 quick questions about your lifestyle. No judgment."],
                ["02","📊","Understand","Get your score across Well-being, Work, and Consumption."],
                ["03","⚡","Act","Pick 1-3 tiny actions from your personalized bare minimum."]
              ].map(s=>`
                <div class="col-md-4">
                  <div class="h-100 p-4 rounded-4 border border-secondary-subtle">
                    <div class="mono-label text-secondary">${s[0]}</div>
                    <div class="display-5 mt-3">${s[1]}</div>
                    <h3 class="display-serif text-light mt-3">${s[2]}</h3>
                    <p class="muted">${s[3]}</p>
                  </div>
                </div>`).join("")}
            </div>

            <div class="bg-orange rounded-4 p-4 p-md-5 mt-5">
              <div class="mono-label text-white opacity-75">Today's challenge</div>
              <h3 class="display-serif display-6 text-white mt-2">Drink 8 cups of water. No excuses.</h3>
              <p class="text-white opacity-75">+342 doing this today</p>
              <button class="btn btn-dark btn-round px-4 mt-2" onclick="go('challenges')">Take the challenge →</button>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${bottomNav()}
  </div>`;
}

function assessment() {
  const [category,emoji,question,options] = questions[state.assessmentIndex];
  const colors = {wellbeing:"var(--lime)",work:"var(--blue)",consumption:"var(--orange)"};
  const progress = (state.assessmentIndex / questions.length) * 100;
  return `<div class="page">
    <div class="container px-4 px-md-5 pt-4">
      <div class="max-width">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <button class="btn btn-link p-0 text-muted-design mono-label text-decoration-none" onclick="assessmentBack()">← Back</button>
          <span class="mono-label text-muted-design">${state.assessmentIndex+1} / ${questions.length}</span>
        </div>
        <div class="progress-design"><div style="width:${progress}%;background:${colors[category]}"></div></div>
        <span class="pill mt-4" style="background:${colors[category]}">${category==="wellbeing"?"Well-being":category}</span>
      </div>
    </div>

    <main class="container px-4 px-md-5 py-5">
      <div class="max-width" style="max-width:760px">
        <div class="mb-4">
          <div class="display-2">${emoji}</div>
          <h1 class="display-serif display-4 mt-3">${question}</h1>
        </div>
        <div class="d-grid gap-3">
          ${options.map((option,i)=>`
            <button class="option-btn ${state.assessmentSelected===i?"selected":""} btn-press" onclick="selectAnswer(${i})">
              <span class="font-mono me-3 opacity-50">${String.fromCharCode(65+i)}</span>${option}
            </button>`).join("")}
        </div>
        <button class="btn ${state.assessmentSelected===null?"btn-secondary":"btn-ink"} btn-round w-100 py-3 mt-4 mono-label"
          ${state.assessmentSelected===null?"disabled":""} onclick="nextAssessment()">
          ${state.assessmentIndex===questions.length-1?"See my score →":"Next →"}
        </button>
      </div>
    </main>
  </div>`;
}

function selectAnswer(i) { state.assessmentSelected=i; render(); }

function nextAssessment() {
  if (state.assessmentSelected===null) return;
  const [category,, ,options] = questions[state.assessmentIndex];
  state.assessmentAnswers[state.assessmentIndex] = state.assessmentSelected + 1;
  if (state.assessmentIndex < questions.length-1) {
    state.assessmentIndex++;
    state.assessmentSelected = state.assessmentAnswers[state.assessmentIndex] ?? null;
    render();
    return;
  }
  ["wellbeing","work","consumption"].forEach(cat=>{
    const ids = questions.map((q,i)=>q[0]===cat?i:-1).filter(i=>i>=0);
    const total = ids.reduce((sum,i)=>sum+(state.assessmentAnswers[i]||0),0);
    state.scores[cat] = Math.round(total/(ids.length*4)*100);
  });
  state.assessmentIndex=0;
  state.assessmentAnswers={};
  state.assessmentSelected=null;
  go("score");
}

function assessmentBack() {
  if (state.assessmentIndex===0) { go("home"); return; }
  state.assessmentIndex--;
  state.assessmentSelected = state.assessmentAnswers[state.assessmentIndex] ?? null;
  render();
}

function ring(score,color,size=150,stroke=12) {
  const r=(size-stroke)/2, c=2*Math.PI*r, offset=c-(score/100)*c;
  return `<div class="score-ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--soft)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </svg>
    <div class="score-ring-content"><span class="score-ring-value" style="color:${color}">${score}</span><span class="mono-label text-muted-design">/ 100</span></div>
  </div>`;
}

function score() {
  const overall=overallScore();
  const level=overall>=80?"🌟 Thriving":overall>=60?"🌱 Growing":overall>=40?"🌀 Starting":"💪 Room to grow";
  const cats=[
    ["wellbeing","🌿","Well-being",varColor("wellbeing"),"Your sleep and movement habits are a solid foundation. Small consistency wins here."],
    ["work","💼","Work",varColor("work"),"Your boundaries between work and life could use some love. Start with one log-off time."],
    ["consumption","♻️","Consumption",varColor("consumption"),"Small swaps in your daily habits can compound into something big over time."]
  ];
  return `<div class="page section-dark">
    <div class="container px-4 px-md-5 py-4">
      <div class="max-width">
        <button class="btn btn-link p-0 mono-label text-secondary text-decoration-none" onclick="go('home')">← Home</button>
        <div class="row align-items-center g-5 py-5">
          <div class="col-md-auto">${ring(overall,"var(--lime)",210,16)}</div>
          <div class="col">
            <div class="mono-label text-secondary">Your bare minimum score</div>
            <h1 class="display-serif display-2 mt-2">${level}</h1>
            <p class="text-secondary fs-5 mt-3" style="max-width:500px">You're not broken. You're building. Your score shows where you are — not where you'll stay.</p>
          </div>
        </div>

        <div class="mono-label text-secondary mb-4">Category breakdown</div>
        <div class="row g-4">
          ${cats.map(c=>`
            <div class="col-md-4">
              <div class="rounded-4 p-4 h-100" style="background:${c[3]}">
                <div class="d-flex justify-content-between align-items-start">
                  <span class="fs-2">${c[1]}</span>
                  ${ring(state.scores[c[0]],c[2]==="Well-being"?"var(--ink)":"var(--paper)",64,6)}
                </div>
                <h3 class="display-serif fs-2 mt-3">${c[2]}</h3>
                <div class="display-serif display-4">${state.scores[c[0]]}</div>
                <p class="small mt-3">${c[4]}</p>
              </div>
            </div>`).join("")}
        </div>

        <div class="bg-dark rounded-4 p-4 p-md-5 mt-5">
          <h3 class="display-serif">Ready to do the minimum?</h3>
          <p class="text-secondary">Your personalized action plan is waiting.</p>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button class="btn btn-lime btn-round px-4" onclick="go('dashboard')">Go to dashboard →</button>
            <button class="btn btn-outline-secondary btn-round px-4" onclick="go('assessment')">Retake</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function varColor(cat) {
  return cat==="wellbeing"?"var(--lime)":cat==="work"?"var(--blue)":"var(--orange)";
}

function dashboard() {
  const tasks=[
    ["💧","Drink 8 cups of water","wellbeing",10],
    ["🚶","Take a 10-minute walk","wellbeing",15],
    ["📵","Phone-free breakfast","wellbeing",20]
  ];
  const days=["M","T","W","T","F","S","S"], streak=[1,1,1,0,1,1,0];
  return `<div class="page">
    <div class="container px-4 px-md-5 py-4">
      <div class="max-width">
        <div class="mono-label text-muted-design">Thursday, Sep 18</div>
        <h1 class="display-serif display-4 mt-1">Today's minimum</h1>

        <div class="row g-4 mt-3">
          <div class="col-lg-8">
            <div class="card-soft p-4">
              <div class="mono-label text-muted-design mb-4">Your actions</div>
              ${tasks.map((t,i)=>`
                <div class="d-flex align-items-center gap-3 py-3 border-bottom">
                  <button class="btn rounded-circle ${state.completedChallenges.has("today"+i)?"btn-lime":"btn-outline-soft"}"
                    style="width:42px;height:42px" onclick="toggleToday(${i})">
                    ${state.completedChallenges.has("today"+i)?"✓":t[0]}
                  </button>
                  <div class="flex-grow-1">
                    <div class="fw-semibold ${state.completedChallenges.has("today"+i)?"task-done":""}">${t[1]}</div>
                    <div class="mono-label text-muted-design">${t[2]} · +${t[3]}pts</div>
                  </div>
                </div>`).join("")}
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card-soft p-4">
              <div class="mono-label text-muted-design mb-4">This week's streak</div>
              <div class="d-flex align-items-end gap-2 chart">
                ${streak.map((v,i)=>`<div class="flex-fill d-flex flex-column justify-content-end align-items-center h-100"><div class="chart-bar ${v&&i===5?"best":""}" style="height:${v?70:25}%"></div><small class="font-mono text-muted-design mt-2">${days[i]}</small></div>`).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-ink text-light rounded-4 p-4 mt-4">
          <div class="mono-label text-secondary mb-4">Your scores</div>
          <div class="row g-4">
            ${[
              ["Well-being",state.scores.wellbeing,"var(--lime)"],
              ["Work",state.scores.work,"var(--blue)"],
              ["Consumption",state.scores.consumption,"var(--orange)"]
            ].map(s=>`
              <div class="col-md-4">
                <div class="d-flex justify-content-between"><span class="display-serif fs-5">${s[0]}</span><strong style="color:${s[2]}">${s[1]}</strong></div>
                <div class="progress-design mt-2" style="background:#2a2a28"><div style="width:${s[1]}%;background:${s[2]}"></div></div>
              </div>`).join("")}
          </div>
        </div>

        <div class="row g-3 mt-3">
          ${[
            ["Challenges","⚡","challenges","bg-blue"],
            ["Explore","🗺️","explore","bg-orange"],
            ["Impact","📈","impact","bg-lime"]
          ].map(x=>`<div class="col-md-4"><button class="btn ${x[3]} w-100 rounded-4 p-4 text-start card-hover" onclick="go('${x[2]}')"><span class="fs-2">${x[1]}</span><div class="display-serif fs-4 mt-2">${x[0]} →</div></button></div>`).join("")}
        </div>
      </div>
    </div>
    ${bottomNav()}
  </div>`;
}

function toggleToday(i) {
  const key="today"+i;
  state.completedChallenges.has(key)?state.completedChallenges.delete(key):state.completedChallenges.add(key);
  toast(state.completedChallenges.has(key)?"ACTION COMPLETED":"ACTION UNCHECKED");
  render();
}

function challengesPage() {
  const list=challenges[state.challengeTab];
  return `<div class="page">
    <div class="container px-4 px-md-5 py-4">
      <div class="max-width">
        <div class="d-flex justify-content-between align-items-end mb-4">
          <div>
            <div class="mono-label text-muted-design">Level up</div>
            <h1 class="display-serif display-2 mb-0">Challenges</h1>
          </div>
          <div class="text-end">
            <div class="stat-number" style="color:var(--lime)">${state.completedChallenges.size}</div>
            <div class="mono-label text-muted-design">completed</div>
          </div>
        </div>

        <div class="btn-group w-100 mb-4">
          ${[["daily","Daily"],["7day","7-Day"],["monthly","Monthly"]].map(t=>`
            <button class="btn ${state.challengeTab===t[0]?"btn-ink":"btn-outline-soft"}" onclick="state.challengeTab='${t[0]}';render()">${t[1]}</button>`).join("")}
        </div>

        <div class="row g-4">
          ${list.map((c,i)=>{
            const key=state.challengeTab+i, done=state.completedChallenges.has(key);
            return `<div class="col-md-6">
              <div class="card-soft p-4 h-100 card-hover ${done?"opacity-75":""}">
                <div class="d-flex justify-content-between"><span class="fs-2">${c[0]}</span><span class="pill ${c[5]==="wellbeing"?"bg-lime":c[5]==="work"?"bg-blue":"bg-orange"}">${c[5]}</span></div>
                <h3 class="display-serif fs-3 mt-3 ${done?"text-muted-design":""}">${c[1]}</h3>
                <p class="text-muted-design">${c[2]}</p>
                <div class="d-flex justify-content-between align-items-end mt-4">
                  <div><div class="display-serif fs-5">+${c[3]} pts</div><div class="mono-label text-muted-design">${c[4]} doing this</div></div>
                  <button class="btn ${done?"btn-outline-soft":"btn-ink"} btn-round px-3" onclick="toggleChallenge('${key}')">${done?"✓ Done":"Do it"}</button>
                </div>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>
    ${bottomNav()}
  </div>`;
}

function toggleChallenge(key) {
  if(state.completedChallenges.has(key)) state.completedChallenges.delete(key);
  else state.completedChallenges.add(key);
  toast(state.completedChallenges.has(key)?"CHALLENGE COMPLETED +POINTS":"CHALLENGE UNCHECKED");
  render();
}

function explore() {
  const filtered=state.exploreFilter==="all"?articles:articles.filter(a=>a[0]===state.exploreFilter);
  return `<div class="page">
    <div class="container px-4 px-md-5 py-4">
      <div class="max-width">
        <div class="mono-label text-muted-design">Learn + grow</div>
        <h1 class="display-serif display-2">Explore</h1>
        <p class="text-muted-design" style="max-width:450px">Guides and articles curated for your lifestyle — no fluff, just what works.</p>

        <div class="d-flex flex-wrap gap-2 my-4">
          ${[["all","All","var(--ink)"],["wellbeing","🌿 Well-being","var(--lime)"],["work","💼 Work","var(--blue)"],["consumption","♻️ Consumption","var(--orange)"]].map(f=>`
            <button class="btn btn-sm rounded-pill ${state.exploreFilter===f[0]?"text-white":"text-dark"}" style="background:${state.exploreFilter===f[0]?f[2]:"var(--paper)"};border:1px solid var(--border)" onclick="state.exploreFilter='${f[0]}';render()">${f[1]}</button>`).join("")}
        </div>

        <div class="article-feature p-4 p-md-5 mb-4">
          <div class="mono-label text-secondary">${articles[0][0]} · ${articles[0][1]}</div>
          <h2 class="display-serif display-5 mt-2">${articles[0][2]}</h2>
          <p class="text-secondary mt-3" style="max-width:600px">${articles[0][3]}</p>
          <button class="btn btn-lime btn-round px-4 mt-2" onclick="toast('ARTICLE OPENED')">Read article →</button>
        </div>

        <div class="row g-4">
          ${filtered.map(a=>`
            <div class="col-md-6">
              <div class="card-soft article-card p-4 card-hover">
                <div class="mono-label text-muted-design">${a[0]} · ${a[1]}</div>
                <h3 class="display-serif fs-3 mt-3">${a[2]}</h3>
                <p class="text-muted-design flex-grow-1">${a[3]}</p>
                <button class="btn btn-link p-0 text-dark text-start fw-semibold" onclick="toast('ARTICLE OPENED')">Read →</button>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </div>
    ${bottomNav()}
  </div>`;
}

function impact() {
  const avg=overallScore();
  const weekly=[40,55,45,70,60,80,75], days=["M","T","W","T","F","S","S"];
  const stats=[[""+7,"Days active","var(--lime)","var(--ink)"],[avg,"Avg score","var(--ink)","var(--lime)"],["47","Tasks done","var(--paper)","var(--orange)"],["5","Day streak","var(--paper)","var(--blue)"]];
  const sdgs=[[3,"Good Health","❤️","var(--lime)"],[8,"Decent Work","💼","var(--blue)"],[12,"Responsible Consumption","♻️","var(--orange)"],[13,"Climate Action","🌍","var(--lime)"]];
  return `<div class="page">
    <div class="container px-4 px-md-5 py-4">
      <div class="max-width">
        <div class="mono-label text-muted-design">Your journey</div>
        <h1 class="display-serif display-2 mb-4">Impact</h1>

        <div class="row g-3">
          ${stats.map(s=>`<div class="col-6 col-lg-3"><div class="rounded-4 p-4 h-100" style="background:${s[3]};color:${s[2]}"><div class="stat-number">${s[0]}</div><div class="mono-label mt-1" style="opacity:.7">${s[1]}</div></div></div>`).join("")}
        </div>

        <div class="card-soft p-4 mt-4">
          <div class="mono-label text-muted-design mb-4">This week's activity</div>
          <div class="chart">
            ${weekly.map((v,i)=>`<div class="flex-fill d-flex flex-column justify-content-end align-items-center h-100"><div class="chart-bar ${v===Math.max(...weekly)?"best":""}" style="height:${v}%"></div><small class="font-mono text-muted-design mt-2">${days[i]}</small></div>`).join("")}
          </div>
        </div>

        <div class="bg-ink text-light rounded-4 p-4 mt-4">
          <div class="mono-label text-secondary mb-4">Progress by category</div>
          ${[
            ["🌿","Well-being",state.scores.wellbeing,"var(--lime)"],
            ["💼","Work",state.scores.work,"var(--blue)"],
            ["♻️","Consumption",state.scores.consumption,"var(--orange)"]
          ].map(x=>`<div class="mb-4">
            <div class="d-flex justify-content-between mb-2"><span class="display-serif fs-5">${x[0]} ${x[1]}</span><strong style="color:${x[3]}">${x[2]}</strong></div>
            <div class="progress-design" style="background:#2a2a28"><div style="width:${x[2]}%;background:${x[3]}"></div></div>
          </div>`).join("")}
        </div>

        <div class="mono-label text-muted-design mt-5 mb-3">Global goals you're contributing to</div>
        <div class="row g-3">
          ${sdgs.map(s=>`<div class="col-6 col-lg-3"><div class="rounded-4 p-4 text-center card-hover" style="background:${s[3]}"><div class="fs-2">${s[2]}</div><div class="mono-label mt-2">SDG ${s[0]}</div><div class="display-serif mt-1">${s[1]}</div></div></div>`).join("")}
        </div>

        <div class="bg-lime rounded-4 p-4 p-md-5 mt-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div><h3 class="display-serif mb-1">Keep the momentum.</h3><p class="mb-0 opacity-75">Your next challenge is waiting.</p></div>
          <button class="btn btn-dark btn-round px-4" onclick="go('challenges')">See challenges →</button>
        </div>
      </div>
    </div>
    ${bottomNav()}
  </div>`;
}

function render() {
  const screens={home,assessment,score,dashboard,challenges:challengesPage,explore,impact};
  app.innerHTML=`<div class="screen-enter">${screens[state.screen]()}</div>`;
}

render();
