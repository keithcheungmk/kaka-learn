(() => {
  const stories = window.FAMILY_STORIES || [];
  const dialogue = {
    'park-kite':['「我們到公園放風箏吧。」','「我來拿着線。」','「風箏飛起來了！」','「我們一起慢慢跑。」','「風箏掛在樹枝上了。」','「謝謝你幫忙！」'],
    'fruit-sharing':['「我們一起買水果。」','「這個橙又大又香。」','「我選了幾個蘋果。」','「水果都放進袋裏了。」','「回家後一起分吧。」','「每個人都有一份。」'],
    'red-balloon':['「我拿着紅氣球。」','「氣球飛走了！」','「我們先看看它飛去哪裏。」','「沿着那個方向找找看。」','「氣球掛在樹枝上了。」','「我把氣球交給你。」'],
    'rainbow-umbrella':['「秋天的雨來了。」','「我帶了橙色雨傘。」','「我們一起回家。」','「前面有一個水窪。」','「雨停了，太陽出來了。」','「我們把雨傘收好吧。」'],
    'garden-flowers':['「花園裏有好多花。」','「這裏有一朵小花。」','「這片黃葉落下來了。」','「我們做一束花吧。」','「把花送給媽媽。」','「謝謝你們的花。」'],
    'zhuhai-aquarium':['「我們到水族館看看吧。」','「玻璃後面有好多魚。」','「那是一隻海龜。」','「我找到小魚了。」','「海豚在水裏游泳。」','「我們拍一張合照吧。」'],
    'zhuhai-hotel':['「早上了，窗外很亮。」','「我們起牀吧。」','「大家一起吃早餐。」','「我們乘電梯下樓。」','「晚上回房間休息。」','「晚安，明天再出發。」'],
    'chimelong-safari':['「我們到動物園了。」','「我用望遠鏡看小鹿。」','「斑馬慢慢走過來了。」','「猴子在叫呢。」','「我們在安全區看大象。」','「今天看見好多動物。」'],
    'shenzhen-waterpark':['「我們到水上樂園了。」','「每人拿一個泳圈。」','「請沿着通道慢慢走。」','「我們在淺水區玩水。」','「滑水道真有趣。」','「玩過以後要擦乾身體。」'],
    'hongkong-disney':['「我們一起去樂園吧。」','「我看看地圖怎樣走。」','「前面就是城堡。」','「大家站好看巡遊。」','「我們拍一張合照。」','「回家把照片給姑姑看。」']
  };
  const bookTitles = {rb_anan:'《貪吃的安安》',rb_dongdong:'《冬冬請客》',rb_fenguo:'《分果果》',rb_fengwan:'《風跟我玩》',rb_huangye:'《黃葉》',rb_kuaipao:'《快跑呀》',rb_qiqiu:'《我的氣球呢？》',rb_shuijiao:'《誰在叫？》',rb_xiaoming:'《小明和氣球》',rb_xin:'《信》',rb_yishuhua:'《一束花》',rb_yusan:'《雨傘》'};
  const cast = [
    ['卡卡','4歲・106 cm','短黑髮；黃衣深藍邊','kaka-turnaround.webp'],
    ['禧禧','3歲・約96 cm','圓臉大眼；深藍衣黃衣領','heihei-turnaround.webp'],
    ['姑姑／紅姑姑','161 cm','身形較高、面尖、長髮','auntie-turnaround.webp'],
    ['蛙蛙','155 cm','禧禧的媽媽；身形較矮、圓臉大眼','wawa-turnaround.webp'],
    ['傑叔叔','170 cm','卡卡的爸爸；深藍外套','jie-turnaround.webp'],
    ['堯叔叔','175 cm','禧禧的爸爸；灰綠外套','yao-turnaround.webp']
  ];
  const $ = id => document.getElementById(id);
  const library = $('library'), reader = $('reader');
  let current = null, pageIndex = 0, selectedQuiz = '', chosenTiles = [], quizDone = false, builderDone = false;
  const finishedKey = 'kaka-family-storybook-finished-v1';
  const safeRead = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const refreshStars = () => { $('star-total').textContent = safeRead(finishedKey).length; };
  const shuffle = array => array.map(value => [Math.random(),value]).sort((a,b)=>a[0]-b[0]).map(pair=>pair[1]);
  function renderLibrary(){
    $('story-grid').innerHTML = stories.map((story,i)=>{
      const done = safeRead(finishedKey).includes(story.id);
      const image = `assets/family-stories/scenes/${story.id}-p01.webp`;
      return `<button class="story-card" type="button" data-story="${story.id}" aria-label="開始故事：${story.title}"><img class="story-cover" src="${image}" alt="${story.title}插圖" onerror="this.src='assets/family-stories/characters/family-height-lineup.webp'"><span><strong class="story-title">${String(i+1).padStart(2,'0')}・${story.title} ${done?'<span class="done-tag">★</span>':''}</strong><p>${story.place} · ${story.pages.length}頁</p><p>${story.summary}</p><p class="card-words">讀本詞：${story.bookWords.slice(0,4).join('、')}</p>${story.artNote?`<p class="art-note">${story.artNote}</p>`:''}</span></button>`;
    }).join('');
    $('cast-grid').innerHTML = cast.map(([name,height,traits,file])=>`<article class="cast-card"><img src="assets/family-stories/characters/${file}" alt="${name}角色三視圖"><div><strong>${name}</strong><p>${height} · ${traits}</p></div></article>`).join('');
    $('story-grid').querySelectorAll('[data-story]').forEach(button=>button.addEventListener('click',()=>openStory(button.dataset.story)));
    refreshStars();
  }
  function openStory(id){current=stories.find(story=>story.id===id);if(!current)return;pageIndex=0;quizDone=false;builderDone=false;library.classList.add('hidden');reader.classList.remove('hidden');$('activity').classList.add('hidden');$('completion').classList.add('hidden');$('story-title').textContent=current.title;$('story-place').textContent=current.place;renderPage();window.scrollTo({top:0,behavior:'smooth'});}
  function renderPage(){
    const page=current.pages[pageIndex];
    $('page-count').textContent=`第 ${pageIndex+1} / ${current.pages.length} 頁`;
    $('page-progress').style.width=`${((pageIndex+1)/current.pages.length)*100}%`;
    $('scene-image').src=`assets/family-stories/scenes/${current.id}-p${String(pageIndex+1).padStart(2,'0')}.webp`;
    $('scene-image').alt=`${current.title}，第 ${pageIndex+1} 頁`;
    $('scene-image').onerror=()=>{$('scene-image').src='assets/family-stories/characters/family-height-lineup.webp';};
    $('scene-caption').textContent=`${current.title}・第 ${pageIndex+1} 頁${current.artNote?`｜${current.artNote}`:''}`;
    $('page-sentence').textContent=page.sentence;
    $('page-dialogue').textContent=dialogue[current.id]?.[pageIndex] || '';
    $('learn-words').innerHTML=page.learn.map(word=>`<span class="word-chip ${current.extensionWords.includes(word)?'extension':''}">${word}</span>`).join('');
    $('source-note').textContent=`讀本詞語：${current.bookWords.join('、')}｜場景延伸：${current.extensionWords.join('、')}｜參考讀本：${current.sourceBooks.map(id=>bookTitles[id]||id).join('、')}`;
    $('prev-page').disabled=pageIndex===0;$('prev-page').style.opacity=pageIndex===0?'.45':'1';
    $('next-page').textContent=pageIndex===current.pages.length-1?'開始故事任務 →':'下一頁 →';
  }
  function leaveReader(){stopAudio();reader.classList.add('hidden');library.classList.remove('hidden');renderLibrary();window.scrollTo({top:0,behavior:'smooth'});}
  $('back-library').addEventListener('click',leaveReader);$('next-story').addEventListener('click',leaveReader);
  $('prev-page').addEventListener('click',()=>{if(pageIndex>0){pageIndex--;renderPage();}});
  $('next-page').addEventListener('click',()=>{if(pageIndex<current.pages.length-1){pageIndex++;renderPage();}else showActivity();});
  let activeAudio=null;
  function stopAudio(){if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null;}if('speechSynthesis'in window)speechSynthesis.cancel();}
  function setAudioFeedback(message){const node=$('audio-feedback');if(node)node.textContent=message;}
  function sayText(text,src){stopAudio();setAudioFeedback('');if(src){const audio=new Audio(src);activeAudio=audio;audio.addEventListener('ended',()=>setAudioFeedback('播放完畢。'),{once:true});audio.play().catch(()=>speakBrowser(text));}else speakBrowser(text);}
  function speakBrowser(text){if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){setAudioFeedback('此裝置未提供語音朗讀。請在系統啟用中文語音，或改用支援語音合成的瀏覽器。');return;}const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-CN';utterance.rate=1;const voices=speechSynthesis.getVoices();utterance.voice=voices.find(v=>/^zh[-_]CN/i.test(v.lang)||/^cmn/i.test(v.lang))||null;if(voices.length&&!utterance.voice)setAudioFeedback('裝置沒有列出普通話語音，現請瀏覽器按 zh-CN 設定朗讀。');utterance.onstart=()=>setAudioFeedback('正在用普通話朗讀……');utterance.onend=()=>setAudioFeedback('播放完畢。');utterance.onerror=()=>setAudioFeedback('語音播放失敗，請檢查裝置的普通話語音設定。');speechSynthesis.speak(utterance);}
  $('speak-sentence').addEventListener('click',()=>{const page=current.pages[pageIndex];const spoken=[page.sentence,dialogue[current.id]?.[pageIndex]].filter(Boolean).join(' ');sayText(spoken);});
  function showActivity(){
    $('activity').classList.remove('hidden');$('completion').classList.add('hidden');quizDone=false;builderDone=false;selectedQuiz='';chosenTiles=[];
    const targetPage=current.pages[pageIndex];const candidates=[...new Set(targetPage.learn)];const quizWord=candidates[0]||current.bookWords[0];$('speak-word').dataset.word=quizWord;
    const distractors=shuffle([...new Set(current.bookWords.filter(w=>w!==quizWord).concat(targetPage.distractors||[]))]).slice(0,3);
    $('quiz-options').innerHTML=shuffle([quizWord,...distractors]).map(word=>`<button class="quiz-option" type="button" data-word="${word}">${word}</button>`).join('');
    $('quiz-options').querySelectorAll('[data-word]').forEach(btn=>btn.addEventListener('click',()=>{selectedQuiz=btn.dataset.word;$('quiz-options').querySelectorAll('.quiz-option').forEach(b=>b.classList.toggle('selected',b===btn));}));
    $('quiz-feedback').textContent='';$('builder-feedback').textContent='';renderTiles(targetPage);
    $('activity').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function renderTiles(page){
    const correct=page.tiles;
    const distractors=(page.distractors||[]).slice(0,2);
    const pool=shuffle([...correct,...distractors]);chosenTiles=[];
    $('tile-answer').innerHTML='';$('tile-bank').innerHTML=pool.map((word,i)=>`<button class="tile" type="button" data-index="${i}" data-word="${word}">${word}</button>`).join('');
    $('tile-bank').querySelectorAll('.tile').forEach(btn=>btn.addEventListener('click',()=>{if(btn.disabled)return;chosenTiles.push({word:btn.dataset.word,index:Number(btn.dataset.index)});btn.disabled=true;renderAnswer();}));
  }
  function renderAnswer(){ $('tile-answer').innerHTML=chosenTiles.map((item,i)=>`<button class="tile" type="button" data-remove="${i}">${item.word} ×</button>`).join('');$('tile-answer').querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{const [item]=chosenTiles.splice(Number(btn.dataset.remove),1);const bank=$('tile-bank').querySelector(`[data-index="${item.index}"]`);if(bank)bank.disabled=false;renderAnswer();})); }
  $('speak-word').addEventListener('click',()=>{const word=$('speak-word').dataset.word;sayText(word);});
  $('clear-tiles').addEventListener('click',()=>{renderTiles(current.pages[pageIndex]);$('builder-feedback').textContent='';});
  $('submit-answer').addEventListener('click',()=>{
    const target=current.pages[pageIndex];
    const assembled=chosenTiles.map(item=>item.word).join('');const expected=target.tiles.join('');
    const text=assembled.replace(/[，。！？、\s]/g,'');const answer=expected.replace(/[，。！？、\s]/g,'');
    if(text===answer){builderDone=true;$('builder-feedback').textContent='句子正確！';$('builder-feedback').style.color='var(--mint)';}
    else{$('builder-feedback').textContent='再試一次：看看句子的先後次序。';$('builder-feedback').style.color='var(--gold)';}
    if(selectedQuiz){quizDone=selectedQuiz===($('speak-word').dataset.word);$('quiz-feedback').textContent=quizDone?'聽得準！':'再聽一次，想想故事中的詞語。';$('quiz-feedback').style.color=quizDone?'var(--mint)':'var(--gold)';}
    if(quizDone&&builderDone)completeStory();
  });
  $('quiz-options').addEventListener('click',event=>{const btn=event.target.closest('[data-word]');if(!btn)return;const correct=btn.dataset.word===$('speak-word').dataset.word;quizDone=correct;$('quiz-feedback').textContent=correct?'聽得準！再砌好最後一句就完成。':'再聽一次，想想故事中的詞語。';$('quiz-feedback').style.color=correct?'var(--mint)':'var(--gold)';if(correct&&builderDone)completeStory();});
  function completeStory(){
    let completed=safeRead(finishedKey);if(!completed.includes(current.id)){completed.push(current.id);localStorage.setItem(finishedKey,JSON.stringify(completed));}
    refreshStars();$('activity').classList.add('hidden');$('completion').classList.remove('hidden');$('completion-summary').textContent=`你完成了《${current.title}》，學會了「${current.bookWords.slice(0,5).join('、')}」等讀本詞語。`;window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  }
  renderLibrary();
})();
