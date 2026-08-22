import {
  fitGeometryMetrics,
  fitPatternInsideBoard,
  gridForLongSide,
  gridFromAspectAnchor,
  orientedSourceDimensions,
} from './core/geometry.js';
import { LEGACY_64_HEX } from './palettes/mard221.js';
import { DEFAULT_PALETTE_PROVIDER_ID, getPaletteProvider } from './palettes/catalog.js';
import SAMPLE_IMAGE_URL from '../tests/fixtures/rocket-badge.png?inline';
import {
  applyDocumentTranslations,
  formatNumber,
  getLocale,
  initializeI18n,
  localizedAppUrl,
  onLocaleChange,
  setLocale,
  t,
} from './i18n/index.js';

    'use strict';

    const BASE_CELL = 16;
    const MAX_HISTORY = 50;
    const PROJECT_VERSION = 2;
    const APP_VERSION = '1.1.3';
    const BUILD_DATE = '2026-08-22';
    const DRAFT_KEY = 'bead-grid-studio:draft:v2';
    const WORKER_TIMEOUT_MS = 12000;
    const PALETTE_PROVIDER = getPaletteProvider(DEFAULT_PALETTE_PROVIDER_ID);
    const PALETTE = PALETTE_PROVIDER.colors;
    const MARD_PALETTE_SOURCE = PALETTE_PROVIDER.source;

    const els = Object.fromEntries([
      'projectTitle','projectSubtitle','topUploadBtn','emptyUploadBtn','imageInput','dropzone','fileMeta','fileName','fileDetails','productHelpBtn',
      'smartCard','smartTitle','smartSummary','smartGenerateBtn','smartExportBtn','smartAdvancedBtn','restoreFullImageBtn','advancedSettings',
      'detailAdvice','detailAdviceKicker','detailAdviceTitle','detailAdviceText','detailMetricScale','detailMetricFit','applyRecommendedBtn','openCropBtn',
      'processMode','processModeHint','fitMode','whiteMode','referenceOpacity','opacityValue','maxColors','maxColorsValue','mergeStrength','mergeStrengthValue','protectDark','convertBtn','gridCols','gridRows','gridColsLabel','gridRowsLabel','aspectLock','aspectStatus','patternSizeControls','boardSizeControls','boardProfile','boardStatus',
      'applySizeBtn','undoBtn','redoBtn','zoomOutBtn','zoomInBtn','zoomValue','topExportBtn','mirrorHBtn','mirrorVBtn','rotateBtn',
      'clearBtn','saveProjectBtn','loadProjectBtn','projectInput','exportPngBtn','printBtn','majorGridStep','referenceCanvas','patternCanvas',
      'topRuler','leftRuler','boardShell','canvasStack','canvasViewport','emptyState','legendStrip','paletteGrid','paletteSearch',
      'paletteCountLabel','totalBeads','usedColors','emptyCells','statsList','copyStatsBtn','selectedColorSwatch','selectedColorName','selectedColorCode',
      'statusSize','statusColors','statusBeads','statusZoom','statusMessage','gridToggle','rulerToggle','codesToggle','fitCanvasBtn','convertOverlay',
      'progressText','cancelConvertBtn','toast','mobileScrim','controlPanel','palettePanel','printSheet','printImage','printPages',
      'cropDialog','cropCanvas','cropXInput','cropYInput','cropWInput','cropHInput','cropCloseBtn','cropResetBtn','cropCancelBtn','cropApplyBtn','stageQualityBanner','stageQualityTitle','stageQualityText','stageCropBtn',
      'productDialog','productCloseBtn','productOkBtn','recoveryActions','restoreDraftBtn','clearDraftBtn','appVersion',
      'trySampleBtn','panelTrySampleBtn','patternReadyBar','readyExportBtn','readySaveBtn','readyShareBtn','readyShareCardBtn',
      'shareDialog','shareFormat','sharePreviewCanvas','shareCardCloseBtn','shareCardCancelBtn','shareCardDownloadBtn'
    ].map(id => [id, document.getElementById(id)]));

    const state = {
      cols: 60,
      rows: 60,
      grid: new Int16Array(60 * 60).fill(-1),
      selectedColor: PALETTE.findIndex(color=>color.code==='H7'),
      tool: 'brush',
      previewMode: 'square',
      showGrid: true,
      showRulers: true,
      showCodes: true,
      zoom: 1,
      paletteMode: 'mard221',
      paletteSeries: 'all',
      maxColors: 32,
      majorGridStep: 10,
      mergeStrength: 10,
      protectDark: true,
      smartMode: true,
      smartPhase: 'idle',
      referenceOpacity: 0,
      referenceImage: null,
      referenceFileName: '',
      referenceFileSize: 0,
      referenceSourceWidth: 0,
      referenceSourceHeight: 0,
      referenceRaster: null,
      referenceTransforms: [],
      sourceAnalysis: null,
      lastConversionDiagnostics: null,
      autoTrimApplied: false,
      autoTrimFraction: 0,
      crop: {x:0,y:0,w:1,h:1},
      cropDraft: {x:0,y:0,w:1,h:1},
      cropPreview: null,
      cropPreviewBase: null,
      cropDrag: null,
      history: [],
      historyIndex: -1,
      isDrawing: false,
      strokeChanged: false,
      lastCell: null,
      keyboardCursor: { x: 0, y: 0 },
      canvasFocused: false,
      renderQueued: false,
      statsQueued: false,
      converter: null,
      cancelConversion: null,
      conversionJob: 0,
      sourceLoadJob: 0,
      hasAutoFit: false,
      sizeMode: 'pattern',
      aspectLock: true,
      lastSizeAxis: 'cols',
      boardProfile: 'mini52',
      boardTilesX: 1,
      boardTilesY: 1,
      dirty: false,
      exporting: false,
      convertFocusReturn: null,
      productFocusReturn: null,
      shareFocusReturn: null,
      statusKey: 'status.ready',
      statusParams: {},
      projectSubtitleKey: 'project.localOnly',
      projectSubtitleParams: {}
    };

    const DEVICE_LIMITS = (() => {
      const memory=Number(navigator.deviceMemory)||0,cores=Number(navigator.hardwareConcurrency)||0;
      const compact=Boolean(window.matchMedia?.('(pointer:coarse)').matches)||memory>0&&memory<=4||cores>0&&cores<=4;
      return Object.freeze({compact,renderPixels:8000000,exportPixels:compact?10000000:12000000,decodePixels:compact?2000000:4000000});
    })();

    const BOARD_PROFILES = Object.freeze({
      mini52:{id:'mini52',labelKey:'board.mini52',cells:52,beadMm:2.6,boardCm:14.4},
      mini26:{id:'mini26',labelKey:'board.mini26',cells:26,beadMm:2.6,boardCm:7.5},
      artkal50:{id:'artkal50',labelKey:'board.artkal50',cells:50,beadMm:2.6,boardCm:14.5},
      artkal78:{id:'artkal78',labelKey:'board.artkal78',cells:78,beadMm:2.6,boardCm:21},
      midi29:{id:'midi29',labelKey:'board.midi29',cells:29,beadMm:5,boardCm:14.5},
      midi14:{id:'midi14',labelKey:'board.midi14',cells:14,beadMm:5,boardCm:8}
    });

    const MODE_HINTS = Object.freeze({cartoon:'modeHint.cartoon',detail:'modeHint.detail',document:'modeHint.document',photo:'modeHint.photo',pixel:'modeHint.pixel'});

    function modeHint(mode) { return t(MODE_HINTS[mode] || MODE_HINTS.cartoon); }
    function modeLabel(mode) { return t(`mode.${mode}`); }
    function boardProfileLabel(profile) { return t(profile?.labelKey || 'board.mini52'); }
    function localizedColorName(color) {
      if(color?.code==='H1')return t('palette.transparent');
      if(color?.code==='H2')return t('palette.white');
      if(color?.code==='H7')return t('palette.black');
      return t(`palette.series.${color?.series || 'H'}`);
    }
    function localizedPatternSize(pattern=currentPatternPlacement()) {
      return state.sizeMode==='board'
        ? t('size.patternAndBoard',{patternCols:pattern.cols,patternRows:pattern.rows,boardCols:state.cols,boardRows:state.rows})
        : t('size.patternOnly',{cols:state.cols,rows:state.rows});
    }

    function clamp(value, min, max) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
    }

    function normalizeCrop(crop) {
      const x=clamp(crop?.x??0,0,1),y=clamp(crop?.y??0,0,1);
      const w=clamp(crop?.w??1,.01,1-x),h=clamp(crop?.h??1,.01,1-y);
      return {x,y,w,h};
    }

    function cropSourceRect(width,height,crop) {
      const value=normalizeCrop(crop);
      return {x:value.x*width,y:value.y*height,w:value.w*width,h:value.h*height};
    }

    function physicalBoardLayout(profileId,tilesX=1,tilesY=1,sourceWidth=1,sourceHeight=1) {
      const profile=BOARD_PROFILES[profileId]||BOARD_PROFILES.mini52;
      tilesX=Math.max(1,Math.round(Number(tilesX)||1));tilesY=Math.max(1,Math.round(Number(tilesY)||1));
      const boardCols=profile.cells*tilesX,boardRows=profile.cells*tilesY;
      const pattern=fitPatternInsideBoard(sourceWidth,sourceHeight,boardCols,boardRows);
      return {profile,tilesX,tilesY,boardCols,boardRows,pattern,boardCount:tilesX*tilesY,widthCm:profile.boardCm*tilesX,heightCm:profile.boardCm*tilesY,withinLimit:boardCols<=160&&boardRows<=160};
    }

    function embedPatternGrid(compact,patternCols,patternRows,boardCols,boardRows,offsetX,offsetY) {
      const board=new Int16Array(boardCols*boardRows).fill(-1);
      for(let y=0;y<patternRows;y++)for(let x=0;x<patternCols;x++){
        const bx=offsetX+x,by=offsetY+y;
        if(bx>=0&&by>=0&&bx<boardCols&&by<boardRows)board[by*boardCols+bx]=compact[y*patternCols+x];
      }
      return board;
    }

    function assessPatternQuality({width,height,cols,rows,fitMode='contain',analysis=null}) {
      const fit=fitGeometryMetrics(width,height,cols,rows,fitMode);
      const effectiveLong=Math.max(fit.contentCols,fit.contentRows),effectiveCells=fit.contentCols*fit.contentRows;
      const isDocument=Boolean(analysis?.likelyDocument),isPhoto=Boolean(analysis?.likelyPhoto),isLineArt=Boolean(analysis?.likelyLineArt);
      // 简单线稿需要保存的是轮廓拓扑，而不是照片纹理。24 格长边经过
      // 小图精修后可完整承载常见头像线稿；继续沿用卡通 32 格警告会与
      // 实际转换结果矛盾。16 格仍保留容量提示，并由转换诊断说明具体冲突。
      const targetLong=Math.max(cols,rows);
      const lowDetail=isDocument?effectiveLong<100:isPhoto?effectiveLong<64:isLineArt?targetLong<=16:effectiveLong<32;
      const severeDetail=isDocument?effectiveLong<64:isPhoto?effectiveLong<40:isLineArt?targetLong<16:effectiveLong<20;
      const aspectWarning=fit.mismatch>.05;
      return {fit,effectiveLong,effectiveCells,isDocument,isPhoto,isLineArt,lowDetail,severeDetail,aspectWarning,hasWarning:lowDetail||aspectWarning};
    }

    function analyzeLineArtSubject({data,width,height}) {
      const count=Math.max(0,width*height);
      const empty={likelyLineArt:false,autoCrop:null,trimFraction:0,retainedInkRatio:0,confidence:0};
      if(!data||!count||width<8||height<8)return empty;
      const mask=new Uint8Array(count),visited=new Uint8Array(count),luminance=new Uint8Array(count);
      let neutral=0,bright=0,strongInk=0,chromatic=0,inkTotal=0;
      for(let i=0;i<count;i++){
        const p=i*4,a=data[p+3]/255,r=data[p]*a+255*(1-a),g=data[p+1]*a+255*(1-a),b=data[p+2]*a+255*(1-a);
        const lum=Math.round(.2126*r+.7152*g+.0722*b),maximum=Math.max(r,g,b),chroma=maximum-Math.min(r,g,b),relative=chroma/Math.max(1,maximum);
        luminance[i]=lum;if(chroma<=20)neutral++;if(lum>=235&&chroma<=24)bright++;if(lum<=175&&chroma<=24)strongInk++;if(chroma>=22&&relative>=.15)chromatic++;
        if(lum<=205&&chroma<=24){mask[i]=1;inkTotal++;}
      }
      const neutralRatio=neutral/count,brightRatio=bright/count,strongInkRatio=strongInk/count,chromaticRatio=chromatic/count;
      const likelyLineArt=neutralRatio>=.985&&brightRatio>=.62&&strongInkRatio>=.006&&strongInkRatio<=.38&&chromaticRatio<=.012;
      if(!likelyLineArt||inkTotal<4)return {...empty,likelyLineArt};

      // 扫描/JPEG 偶尔会在最外沿留下整齐的浅灰 1px 条带。它只能在有
      // 更深主体墨线作参照、条带自身高度均匀、紧邻内侧几乎全白时才可
      // 被忽略；仅凭“贴边且很长”会误删真实的黑色边框。
      const strictInkLums=[];
      for(let i=0;i<count;i++)if(mask[i]&&luminance[i]<=80)strictInkLums.push(luminance[i]);
      strictInkLums.sort((a,b)=>a-b);
      const strictInkP90=strictInkLums.length>=8?strictInkLums[Math.min(strictInkLums.length-1,Math.floor(strictInkLums.length*.90))]:null;
      const median=values=>{if(!values.length)return 0;const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
      const scannerEdgeStrip=({minX,maxX,minY,maxY})=>{
        if(strictInkP90===null)return false;
        const maxStripY=Math.max(2,Math.floor(height*.025)),maxStripX=Math.max(2,Math.floor(width*.025));
        const evaluateHorizontal=(edgeY,innerY)=>{
          if(innerY<0||innerY>=height)return false;
          const edge=[],inner=[];let covered=0;
          for(let x=0;x<width;x++){
            const i=edgeY*width+x;if(mask[i]){covered++;edge.push(luminance[i]);}
            inner.push(luminance[innerY*width+x]);
          }
          if(covered/width<.90||!edge.length)return false;
          const edgeMedian=median(edge),innerMedian=median(inner),uniform=edge.filter(value=>Math.abs(value-edgeMedian)<=8).length/edge.length,innerBright=inner.filter(value=>value>=235).length/inner.length;
          return edgeMedian>=88&&uniform>=.98&&innerBright>=.95&&innerMedian-edgeMedian>=64&&edgeMedian-strictInkP90>=24;
        };
        const evaluateVertical=(edgeX,innerX)=>{
          if(innerX<0||innerX>=width)return false;
          const edge=[],inner=[];let covered=0;
          for(let y=0;y<height;y++){
            const i=y*width+edgeX;if(mask[i]){covered++;edge.push(luminance[i]);}
            inner.push(luminance[y*width+innerX]);
          }
          if(covered/height<.90||!edge.length)return false;
          const edgeMedian=median(edge),innerMedian=median(inner),uniform=edge.filter(value=>Math.abs(value-edgeMedian)<=8).length/edge.length,innerBright=inner.filter(value=>value>=235).length/inner.length;
          return edgeMedian>=88&&uniform>=.98&&innerBright>=.95&&innerMedian-edgeMedian>=64&&edgeMedian-strictInkP90>=24;
        };
        const thinHorizontal=maxY-minY+1<=maxStripY,thinVertical=maxX-minX+1<=maxStripX;
        return (thinHorizontal&&minY===0&&maxX-minX+1>=width*.90&&evaluateHorizontal(0,maxY+1))
          ||(thinHorizontal&&maxY===height-1&&maxX-minX+1>=width*.90&&evaluateHorizontal(height-1,minY-1))
          ||(thinVertical&&minX===0&&maxY-minY+1>=height*.90&&evaluateVertical(0,maxX+1))
          ||(thinVertical&&maxX===width-1&&maxY-minY+1>=height*.90&&evaluateVertical(width-1,minX-1));
      };

      const queue=new Int32Array(count),components=[];
      for(let start=0;start<count;start++){
        if(!mask[start]||visited[start])continue;
        let head=0,tail=0,area=0,minX=width,maxX=0,minY=height,maxY=0;visited[start]=1;queue[tail++]=start;
        while(head<tail){
          const i=queue[head++],x=i%width,y=Math.floor(i/width);area++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
            const next=ny*width+nx;if(mask[next]&&!visited[next]){visited[next]=1;queue[tail++]=next;}
          }
        }
        const component={area,minX,maxX,minY,maxY};
        if(!scannerEdgeStrip(component))components.push(component);
      }
      if(!components.length)return {...empty,likelyLineArt};
      components.sort((a,b)=>b.area-a.area);const main=components[0];
      if(main.area<count*.0015)return {...empty,likelyLineArt};
      // 除了已经严格识别出的整边扫描伪影，所有有效墨线组件都参与取景。
      // 不按“离主体远/面积小”静默丢弃装饰点、文字或独立零件，避免自动裁边造成少豆。
      let minX=main.minX,maxX=main.maxX,minY=main.minY,maxY=main.maxY,retained=0;
      for(const component of components){
        retained+=component.area;minX=Math.min(minX,component.minX);maxX=Math.max(maxX,component.maxX);minY=Math.min(minY,component.minY);maxY=Math.max(maxY,component.maxY);
      }
      // 5% 留边让 16 格小图仍有接近 1 格安全边，48–60 格约有 2–3 格，防止轮廓贴边。
      const inkBounds={minX,maxX,minY,maxY},span=Math.max(maxX-minX+1,maxY-minY+1),padding=Math.max(2,Math.round(span*.05));
      minX=Math.max(0,minX-padding);minY=Math.max(0,minY-padding);maxX=Math.min(width-1,maxX+padding);maxY=Math.min(height-1,maxY+padding);
      const crop={x:minX/width,y:minY/height,w:(maxX-minX+1)/width,h:(maxY-minY+1)/height};
      const trimFraction=1-crop.w*crop.h,retainedInkRatio=retained/Math.max(1,components.reduce((sum,component)=>sum+component.area,0));
      const confidence=Math.max(0,Math.min(1,(neutralRatio-.96)*8+(brightRatio-.55)*1.4+(retainedInkRatio-.90)*2));
      return {likelyLineArt,autoCrop:trimFraction>=.06&&retainedInkRatio>=.995?normalizeCrop(crop):null,trimFraction,retainedInkRatio,confidence,inkBounds,componentCount:components.length,excludedComponentCount:0};
    }

    function analyzeSourceComplexity({data,width,height,sourceWidth=width,sourceHeight=height}) {
      const clampUnit=value=>Math.max(0,Math.min(1,value));
      const count=Math.max(0,width*height);
      if(!data||!count)return {likelyDocument:false,likelyPhoto:false,documentScore:0,nearWhiteRatio:0,edgeDensity:0,transitionDensity:0,longLineRatio:0,darkRatio:0,saturatedRatio:0,quantizedColorCount:0,flatPairRatio:1,smallComponentCount:0,medianGlyphHeightPx:null};
      const luminance=new Uint8Array(count),darkMask=new Uint8Array(count),colorBins=new Uint8Array(512);
      let nearWhite=0,dark=0,saturated=0,edges=0,transitions=0,flatPairs=0,pairCount=0;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const i=y*width+x,p=i*4,a=data[p+3]/255;
        const r=data[p]*a+255*(1-a),g=data[p+1]*a+255*(1-a),b=data[p+2]*a+255*(1-a);
        const lum=Math.round(.2126*r+.7152*g+.0722*b),chroma=Math.max(r,g,b)-Math.min(r,g,b);
        colorBins[((Math.round(r)>>5)<<6)|((Math.round(g)>>5)<<3)|(Math.round(b)>>5)]=1;
        luminance[i]=lum;
        if(lum>228&&chroma<30)nearWhite++;
        if(lum<182){dark++;darkMask[i]=1;}
        if(chroma>52&&lum<245)saturated++;
        if(x>0){
          const diff=Math.abs(lum-luminance[i-1]);if(diff>42)edges++;if(darkMask[i]!==darkMask[i-1])transitions++;
          const pp=p-4,pa=data[pp+3]/255,pr=data[pp]*pa+255*(1-pa),pg=data[pp+1]*pa+255*(1-pa),pb=data[pp+2]*pa+255*(1-pa);
          if(Math.abs(r-pr)+Math.abs(g-pg)+Math.abs(b-pb)<28)flatPairs++;pairCount++;
        }
        if(y>0){
          const diff=Math.abs(lum-luminance[i-width]);if(diff>42)edges++;if(darkMask[i]!==darkMask[i-width])transitions++;
          const pp=p-width*4,pa=data[pp+3]/255,pr=data[pp]*pa+255*(1-pa),pg=data[pp+1]*pa+255*(1-pa),pb=data[pp+2]*pa+255*(1-pa);
          if(Math.abs(r-pr)+Math.abs(g-pg)+Math.abs(b-pb)<28)flatPairs++;pairCount++;
        }
      }
      let longRows=0,longCols=0;
      for(let y=0;y<height;y++){
        let run=0,best=0;
        for(let x=0;x<width;x++){if(darkMask[y*width+x]){run++;best=Math.max(best,run);}else run=0;}
        if(best>=width*.42)longRows++;
      }
      for(let x=0;x<width;x++){
        let run=0,best=0;
        for(let y=0;y<height;y++){if(darkMask[y*width+x]){run++;best=Math.max(best,run);}else run=0;}
        if(best>=height*.42)longCols++;
      }
      const nearWhiteRatio=nearWhite/count,darkRatio=dark/count,saturatedRatio=saturated/count;
      const edgeDensity=edges/Math.max(1,(width-1)*height+(height-1)*width);
      const transitionDensity=transitions/Math.max(1,(width-1)*height+(height-1)*width);
      const longLineRatio=(longRows+longCols)/Math.max(1,width+height);
      const quantizedColorCount=colorBins.reduce((sum,value)=>sum+value,0),flatPairRatio=flatPairs/Math.max(1,pairCount);

      // 小暗色连通组件的中位高度可近似字符高度；长边框与大图块会被尺寸门槛排除。
      const visited=new Uint8Array(count),queue=new Int32Array(count),componentHeights=[];
      const maxComponent=Math.max(24,Math.floor(count*.025));
      for(let start=0;start<count;start++){
        if(!darkMask[start]||visited[start])continue;
        let head=0,tail=0,area=0,minX=width,maxX=0,minY=height,maxY=0;
        visited[start]=1;queue[tail++]=start;
        while(head<tail){
          const i=queue[head++],x=i%width,y=Math.floor(i/width);area++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
          const add=next=>{if(next>=0&&next<count&&darkMask[next]&&!visited[next]){visited[next]=1;queue[tail++]=next;}};
          if(x>0)add(i-1);if(x+1<width)add(i+1);if(y>0)add(i-width);if(y+1<height)add(i+width);
        }
        const boxW=maxX-minX+1,boxH=maxY-minY+1;
        if(area>=2&&area<=maxComponent&&boxW<=width*.16&&boxH<=height*.16&&boxH>=2)componentHeights.push(boxH*sourceHeight/height);
      }
      componentHeights.sort((a,b)=>a-b);
      const smallComponentCount=componentHeights.length;
      const medianGlyphHeightPx=componentHeights.length>=4?componentHeights[Math.floor(componentHeights.length/2)]:null;
      const documentScore=clampUnit((nearWhiteRatio-.42)*1.25+edgeDensity*2.1+transitionDensity*2.4+longLineRatio*1.5+(darkRatio>.008&&darkRatio<.42?.18:0)-saturatedRatio*.45);
      const documentTexture=(smallComponentCount>=4&&transitionDensity>=.025)||transitionDensity>=.05;
      const likelyDocument=nearWhiteRatio>=.48&&edgeDensity>=.03&&darkRatio<.30&&documentTexture&&documentScore>=.60;
      const likelyPhoto=!likelyDocument&&quantizedColorCount>=42&&flatPairRatio<.76;
      return {likelyDocument,likelyPhoto,documentScore,nearWhiteRatio,edgeDensity,transitionDensity,longLineRatio,darkRatio,saturatedRatio,quantizedColorCount,flatPairRatio,smallComponentCount,medianGlyphHeightPx};
    }

    function recommendDocumentGrid({width,height,analysis,maxSide=100}) {
      const longest=Math.max(4,Math.min(160,Math.round(maxSide)||100));
      const {cols,rows}=gridForLongSide(width,height,longest);
      const glyph=analysis?.medianGlyphHeightPx;
      const requiredTextLongSide=Number.isFinite(glyph)&&glyph>0?Math.ceil(4*Math.max(width,height)/glyph):null;
      const textReadable=requiredTextLongSide!==null&&requiredTextLongSide<=longest;
      const structuralOnly=Boolean(analysis?.likelyDocument)&&!textReadable;
      return {cols,rows,requiredTextLongSide,textReadable,structuralOnly,warningCode:structuralOnly?'DOCUMENT_STRUCTURE_ONLY':null};
    }

    function recommendAutoHdSettings({width,height,analysis,quality='ultra'}) {
      const documentMode=Boolean(analysis?.likelyDocument);
      const photoMode=!documentMode&&Boolean(analysis?.likelyPhoto||(
        Math.max(width,height)>=1200&&(analysis?.quantizedColorCount||0)>=32&&(analysis?.flatPairRatio??1)<.84
      ));
      const lineArtMode=!documentMode&&!photoMode&&Boolean(analysis?.likelyLineArt);
      const maxSide=documentMode?100:photoMode?(quality==='ultra'?160:100):lineArtMode?60:(quality==='ultra'?120:100);
      const grid=recommendDocumentGrid({width,height,analysis,maxSide});
      return {
        cols:grid.cols,rows:grid.rows,capacity:grid.cols*grid.rows,
        processMode:documentMode?'document':photoMode?'detail':'cartoon',
        fitMode:'contain',whiteMode:'auto',maxColors:documentMode?24:photoMode?48:lineArtMode?16:32,mergeStrength:2,protectDark:true,
        paletteMode:'mard221',previewMode:'square',showGrid:true,showCodes:true,
        structuralOnly:Boolean(documentMode&&grid.structuralOnly)
      };
    }

    function analyzeReferenceImage(image,sourceWidth,sourceHeight,crop={x:0,y:0,w:1,h:1}) {
      const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
      const normalized=normalizeCrop(crop),sourceRect=cropSourceRect(iw,ih,normalized);
      const scale=Math.min(1,384/Math.max(sourceRect.w,sourceRect.h));
      const width=Math.max(1,Math.round(sourceRect.w*scale)),height=Math.max(1,Math.round(sourceRect.h*scale));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,sourceRect.x,sourceRect.y,sourceRect.w,sourceRect.h,0,0,width,height);
      const pixels=ctx.getImageData(0,0,width,height).data;
      const analysis=analyzeSourceComplexity({data:pixels,width,height,sourceWidth:(sourceWidth||iw)*normalized.w,sourceHeight:(sourceHeight||ih)*normalized.h});
      const framing=analyzeLineArtSubject({data:pixels,width,height});
      return {...analysis,...framing,autoCrop:!analysis.likelyDocument&&!analysis.likelyPhoto?framing.autoCrop:null};
    }

    function applyAutomaticMode() {
      if(state.sourceAnalysis?.likelyDocument){
        els.processMode.value='document';els.processModeHint.textContent=modeHint('document');els.fitMode.value='contain';els.whiteMode.value='auto';
      }else if(els.processMode.value==='document'){
        els.processMode.value='cartoon';els.processModeHint.textContent=modeHint('cartoon');els.fitMode.value='cover';els.whiteMode.value='auto';
      }
    }

    function effectiveSourceSize() {
      if(!state.referenceImage)return {width:state.cols,height:state.rows};
      const iw=state.referenceSourceWidth||(state.referenceImage.naturalWidth||state.referenceImage.width),ih=state.referenceSourceHeight||(state.referenceImage.naturalHeight||state.referenceImage.height);
      const crop=normalizeCrop(state.crop);
      let width=Math.max(1,iw*crop.w),height=Math.max(1,ih*crop.h);
      const quarterTurns=(state.referenceTransforms||[]).filter(type=>type==='rotate').length%2;
      if(quarterTurns)[width,height]=[height,width];
      return {width,height};
    }

    function currentBoardLayout() {
      const source=effectiveSourceSize();
      return physicalBoardLayout(state.boardProfile,state.boardTilesX,state.boardTilesY,source.width,source.height);
    }

    function currentPatternPlacement() {
      if(state.sizeMode!=='board')return {cols:state.cols,rows:state.rows,offsetX:0,offsetY:0,blankLeft:0,blankRight:0,blankTop:0,blankBottom:0,aspectError:0};
      if(!state.referenceImage&&state.grid.some(value=>value>=0)){
        const bounds=occupiedBounds(state.grid,state.cols,state.rows);
        return {cols:bounds.cols,rows:bounds.rows,offsetX:bounds.minX,offsetY:bounds.minY,blankLeft:bounds.minX,blankRight:state.cols-1-bounds.maxX,blankTop:bounds.minY,blankBottom:state.rows-1-bounds.maxY,aspectError:0};
      }
      return fitPatternInsideBoard(effectiveSourceSize().width,effectiveSourceSize().height,state.cols,state.rows);
    }

    function currentBeadMm() {
      return state.sizeMode==='board'?(BOARD_PROFILES[state.boardProfile]||BOARD_PROFILES.mini52).beadMm:2.6;
    }

    function syncBoardStatus() {
      const layout=currentBoardLayout(),pattern=currentPatternPlacement();
      const blank=layout.boardCols*layout.boardRows-pattern.cols*pattern.rows;
      const heading=document.createElement('strong');
      heading.textContent=t('board.statusTitle',{boardCols:layout.boardCols,boardRows:layout.boardRows,patternCols:pattern.cols,patternRows:pattern.rows});
      els.boardStatus.replaceChildren(heading,document.createTextNode(t('board.statusBody',{
        profile:boardProfileLabel(layout.profile),count:layout.boardCount,width:layout.widthCm.toFixed(1),height:layout.heightCm.toFixed(1),
        left:pattern.blankLeft,right:pattern.blankRight,top:pattern.blankTop,bottom:pattern.blankBottom,blank:formatNumber(blank),
      })));
      document.querySelectorAll('[data-board-layout]').forEach(button=>{
        const [x,y]=button.dataset.boardLayout.split('x').map(Number),valid=layout.profile.cells*x<=160&&layout.profile.cells*y<=160;
        button.disabled=!valid;button.setAttribute('aria-pressed',String(valid&&x===state.boardTilesX&&y===state.boardTilesY));
      });
    }

    function syncSizeModeUI() {
      const boardMode=state.sizeMode==='board';
      els.patternSizeControls.hidden=boardMode;els.boardSizeControls.hidden=!boardMode;
      els.gridColsLabel.textContent=t(boardMode?'size.boardCols':'size.patternWidth');els.gridRowsLabel.textContent=t(boardMode?'size.boardRows':'size.patternHeight');
      els.gridCols.readOnly=boardMode;els.gridRows.readOnly=boardMode;
      els.fitMode.disabled=boardMode;if(boardMode)els.fitMode.value='contain';
      document.querySelectorAll('[data-size-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sizeMode===state.sizeMode)));
      if(boardMode)syncBoardStatus();else syncAspectStatus();
    }

    function currentQualityAssessment(cols=state.cols,rows=state.rows) {
      const source=effectiveSourceSize();
      const pattern=state.sizeMode==='board'?currentPatternPlacement():{cols,rows};
      return assessPatternQuality({width:source.width,height:source.height,cols:pattern.cols,rows:pattern.rows,fitMode:'contain',analysis:state.sourceAnalysis});
    }

    function syncAspectStatus() {
      state.aspectLock=Boolean(els.aspectLock.checked);
      if(!state.referenceImage){els.aspectStatus.textContent=t(state.aspectLock?'size.aspectInitial':'size.aspectUnlockedInitial');return;}
      const source=effectiveSourceSize(),locked=gridForLongSide(source.width,source.height,Math.max(state.cols,state.rows));
      els.aspectStatus.textContent=state.aspectLock
        ? t('size.aspectLocked',{ratio:(source.width/source.height).toFixed(2),cols:locked.cols,rows:locked.rows})
        : t('size.aspectUnlocked');
    }

    function syncLockedSizeInput(axis) {
      if(state.sizeMode==='board'||!state.referenceImage||!els.aspectLock.checked)return;
      const source=effectiveSourceSize(),input=axis==='rows'?els.gridRows:els.gridCols;
      if(!Number.isFinite(input.valueAsNumber)||input.valueAsNumber<4||input.valueAsNumber>160)return;
      const next=gridFromAspectAnchor(source.width,source.height,input.value,axis);
      els.gridCols.value=next.cols;els.gridRows.value=next.rows;state.lastSizeAxis=axis;
    }

    function updateDetailAdvice() {
      if(!state.referenceImage||!state.sourceAnalysis){els.detailAdvice.hidden=true;els.stageQualityBanner.hidden=true;return;}
      const source=effectiveSourceSize(),analysis=state.sourceAnalysis;
      const pattern=currentPatternPlacement(),displaySize=localizedPatternSize(pattern);
      const recommendation=recommendDocumentGrid({width:source.width,height:source.height,analysis,maxSide:100});
      const perX=source.width/pattern.cols,perY=source.height/pattern.rows,pixelsPerCell=perX*perY;
      const glyphCells=analysis.medianGlyphHeightPx?analysis.medianGlyphHeightPx/Math.max(perX,perY):null;
      const structuralOnly=analysis.likelyDocument&&(glyphCells===null||glyphCells<4);
      const usingDocumentMode=els.processMode.value==='document';
      const quality=currentQualityAssessment(),fit=quality.fit;
      const aspectWarning=state.sizeMode!=='board'&&quality.aspectWarning,lowDetail=quality.lowDetail,detailIssues=lineDetailIssues(),detailConflict=Boolean(analysis.likelyLineArt&&detailIssues.total);
      els.stageQualityBanner.hidden=!(structuralOnly||aspectWarning||lowDetail||detailConflict);
      if(!(structuralOnly||aspectWarning||lowDetail||detailConflict)){els.detailAdvice.hidden=true;return;}
      els.stageQualityTitle.textContent=t(structuralOnly?'quality.textTooSmall':aspectWarning?'quality.aspectMismatch':detailConflict?'quality.detailConflict':'quality.outlineOnly');
      els.stageQualityText.textContent=structuralOnly
        ? t('quality.structureOnlyShort',{size:displaySize,action:t(usingDocumentMode?'quality.cropSuggestion':'quality.modeOrCropSuggestion')})
        : aspectWarning
          ? t('quality.aspectShort',{cols:state.cols,rows:state.rows,result:t(els.fitMode.value==='contain'?'quality.hasMargins':'quality.cropsContent')})
          : detailConflict
            ? t('quality.detailShort',{size:displaySize,warning:lineDetailWarningCopy(detailIssues,{short:true})})
            : t('quality.outlineShort',{size:displaySize});
      els.detailAdvice.hidden=false;
      els.detailAdvice.dataset.level='warn';
      els.detailAdviceKicker.textContent=t(structuralOnly?'quality.documentWarning':aspectWarning?'quality.aspectWarning':detailConflict?'quality.cellConflict':'quality.smallWarning');
      els.detailAdviceTitle.textContent=structuralOnly?t('quality.documentTitle'):aspectWarning?t('quality.aspectTitle',{cols:state.cols,rows:state.rows}):detailConflict?lineDetailWarningCopy(detailIssues,{short:true}):t('quality.photoDetailTitle');
      const beadCm=currentBeadMm()/10;
      els.detailAdviceText.textContent=structuralOnly
        ? t('quality.documentBody',{size:displaySize,modeAdvice:usingDocumentMode?'':t('quality.documentModeAdvice'),beadMm:currentBeadMm(),width:(state.cols*beadCm).toFixed(1),height:(state.rows*beadCm).toFixed(1)})
        : aspectWarning
          ? (els.fitMode.value==='contain'
            ? t('quality.letterboxBody',{percent:(fit.letterboxFraction*100).toFixed(1),cols:fit.contentCols.toFixed(1),rows:fit.contentRows.toFixed(1)})
            : t('quality.cropBody',{percent:(fit.cropFraction*100).toFixed(1)}))
          : detailConflict
            ? t('quality.detailBody',{warning:lineDetailWarningCopy(detailIssues)})
            : t('quality.photoBody',{long:quality.effectiveLong.toFixed(0),cells:formatNumber(Math.round(quality.effectiveCells))});
      els.detailMetricScale.textContent=t('quality.sourcePixels',{x:perX>=10?perX.toFixed(0):perX.toFixed(1),y:perY>=10?perY.toFixed(0):perY.toFixed(1)});
      els.detailMetricFit.textContent=structuralOnly?(glyphCells?t('quality.glyphHeight',{height:glyphCells.toFixed(2)}):t('quality.largeStructureOnly')):aspectWarning?(els.fitMode.value==='contain'?t('quality.marginPercent',{percent:(fit.letterboxFraction*100).toFixed(1)}):t('quality.cropPercent',{percent:(fit.cropFraction*100).toFixed(1)})):t('quality.pixelsPerBead',{count:formatNumber(Math.round(pixelsPerCell))});
      const aspectGrid=gridForLongSide(source.width,source.height,Math.max(state.cols,state.rows));
      const hdGrid=recommendAutoHdSettings({width:source.width,height:source.height,analysis,quality:'ultra'});
      const target=structuralOnly?recommendation:aspectWarning?aspectGrid:hdGrid;
      const same=target.cols===state.cols&&target.rows===state.rows;
      els.applyRecommendedBtn.disabled=same;
      els.applyRecommendedBtn.dataset.cols=target.cols;
      els.applyRecommendedBtn.dataset.rows=target.rows;
      const targetBeadCm=currentBeadMm()/10;
      els.applyRecommendedBtn.textContent=same?t('quality.alreadySize',{cols:target.cols,rows:target.rows}):aspectWarning?t('quality.fixAspect',{cols:target.cols,rows:target.rows}):t('quality.increaseSize',{cols:target.cols,rows:target.rows,beadMm:currentBeadMm(),width:(target.cols*targetBeadCm).toFixed(1),height:(target.rows*targetBeadCm).toFixed(1)});
      els.openCropBtn.textContent=t(structuralOnly?'action.cropRegion':aspectWarning&&els.fitMode.value==='cover'?'quality.cropChoose':'quality.oneSubject');
      els.stageCropBtn.dataset.action=aspectWarning&&!same?'aspect':'crop';
      els.stageCropBtn.textContent=t(aspectWarning&&!same?'quality.fixAspectShort':structuralOnly?'action.cropRegion':'quality.cropSubject');
    }

    function currentSmartSettings() {
      const source=effectiveSourceSize();
      return recommendAutoHdSettings({width:source.width,height:source.height,analysis:state.sourceAnalysis,quality:'ultra'});
    }

    function applySmartSettings(settings,{resetGrid=true,resetHistoryNow=false}={}) {
      // “一键高清”只负责自动选择转换参数，不应悄悄推翻用户已经选择的
      // 实体底板。底板模式始终保留其名义行列，图片先按原比例生成紧凑
      // 图案，再由 convertImage 居中嵌入底板；图案模式才采用推荐分辨率。
      const keepBoardMode=state.sizeMode==='board';
      if(keepBoardMode){
        const board=currentBoardLayout();
        state.cols=board.boardCols;state.rows=board.boardRows;
      }else{
        state.cols=settings.cols;state.rows=settings.rows;
      }
      if(resetGrid)state.grid=new Int16Array(state.cols*state.rows).fill(-1);
      state.maxColors=settings.maxColors;state.mergeStrength=settings.mergeStrength;state.protectDark=settings.protectDark;
      state.lastConversionDiagnostics=null;
      state.paletteMode=settings.paletteMode;state.previewMode=settings.previewMode;state.showGrid=settings.showGrid;state.showCodes=settings.showCodes;
      state.keyboardCursor={x:0,y:0};state.hasAutoFit=false;state.smartMode=true;state.smartPhase='ready';state.sizeMode=keepBoardMode?'board':'pattern';state.aspectLock=true;
      els.gridCols.value=state.cols;els.gridRows.value=state.rows;
      els.aspectLock.checked=true;
      els.processMode.value=settings.processMode;els.processModeHint.textContent=modeHint(settings.processMode);
      els.fitMode.value=keepBoardMode?'contain':settings.fitMode;els.whiteMode.value=settings.whiteMode;
      els.maxColors.value=state.maxColors;els.maxColorsValue.textContent=t('unit.colorsValue',{count:state.maxColors});
      els.mergeStrength.value=state.mergeStrength;els.mergeStrengthValue.textContent=state.mergeStrength;
      els.protectDark.checked=state.protectDark;
      renderPalette();updateViewButtons();syncSizeModeUI();syncAspectStatus();
      if(resetHistoryNow)resetHistory();
    }

    function lineDetailIssues(diagnostics=state.lastConversionDiagnostics) {
      const missing=Math.max(0,Number(diagnostics?.lineUnrepresentableComponents)||0);
      const collisions=Math.max(0,Number(diagnostics?.lineUnresolvedConflicts)||0);
      return {missing,collisions,total:missing+collisions};
    }

    function lineDetailWarningCopy(issues,{short=false}={}) {
      const parts=[];
      if(issues.missing)parts.push(t('quality.missingDetails',{count:issues.missing}));
      if(issues.collisions)parts.push(t('quality.detailCollisions',{count:issues.collisions}));
      if(!parts.length)return '';
      return short?parts.join(t('punctuation.list')):t('quality.detailIntegrity',{details:parts.join(t('punctuation.list'))});
    }

    function updateSmartCard() {
      if(!state.referenceImage){els.smartCard.hidden=true;return;}
      els.smartCard.hidden=false;
      els.restoreFullImageBtn.hidden=!state.autoTrimApplied;
      const settings=currentSmartSettings(),stats=getStats();
      const actualReady=state.smartPhase==='done'&&state.smartMode&&stats.total>0;
      if(settings.structuralOnly){
        els.smartTitle.textContent=t('smart.documentUnreadable');
        els.smartSummary.textContent=t('smart.documentSummary',{cols:settings.cols,rows:settings.rows});
        els.smartGenerateBtn.textContent=t('smart.cropFirst');els.smartGenerateBtn.dataset.action='crop';
        els.smartExportBtn.hidden=true;
      }else if(actualReady){
        const smallLineReady=Boolean(state.sourceAnalysis?.likelyLineArt)&&Math.max(state.cols,state.rows)<=60;
        const issues=lineDetailIssues();
        els.smartTitle.textContent=issues.total?t('smart.generatedWithWarning',{warning:lineDetailWarningCopy(issues,{short:true})}):t(smallLineReady?'smart.generatedSmallLine':'smart.generatedReview');
        const pattern=currentPatternPlacement(),beadCm=currentBeadMm()/10,sizeCopy=localizedPatternSize(pattern);
        const framing=state.autoTrimApplied?t('smart.trimmed',{percent:Math.round(state.autoTrimFraction*100)}):'';
        const nextSide=[24,32,40,48,60].find(side=>side>Math.max(pattern.cols,pattern.rows))||Math.min(160,Math.max(pattern.cols,pattern.rows)+16);
        const detailWarning=issues.total?t('smart.detailWarning',{warning:lineDetailWarningCopy(issues),size:nextSide}):'';
        els.smartSummary.textContent=t('smart.readySummary',{size:sizeCopy,beads:formatNumber(stats.total),colors:stats.counts.size,framing,detailWarning,beadMm:currentBeadMm(),width:(state.cols*beadCm).toFixed(1),height:(state.rows*beadCm).toFixed(1)});
        els.smartGenerateBtn.textContent=t('smart.regenerate');els.smartGenerateBtn.dataset.action='generate';
        els.smartExportBtn.hidden=false;
      }else if(!state.smartMode){
        const quality=currentQualityAssessment(),issues=lineDetailIssues();
        els.smartTitle.textContent=issues.total?lineDetailWarningCopy(issues,{short:true}):t(quality.severeDetail?'smart.customTooSmall':quality.aspectWarning?'smart.customAspect':'smart.custom');
        els.smartSummary.textContent=issues.total
          ? t('smart.customIssues',{cols:state.cols,rows:state.rows,warning:lineDetailWarningCopy(issues)})
          : quality.severeDetail
          ? t('smart.customCapacity',{cols:state.cols,rows:state.rows,cells:formatNumber(Math.round(quality.effectiveCells))})
          : quality.aspectWarning
            ? t('smart.customMismatch',{effect:t(els.fitMode.value==='contain'?'quality.marginVerb':'quality.cropVerb'),percent:(quality.fit.mismatch*100).toFixed(1)})
            : t('smart.customSummary',{cols:state.cols,rows:state.rows,colors:state.maxColors});
        els.smartGenerateBtn.textContent=t('smart.restore');els.smartGenerateBtn.dataset.action='generate';
        els.smartExportBtn.hidden=stats.total===0||quality.severeDetail||quality.aspectWarning;
      }else{
        els.smartTitle.textContent=t('smart.recommendedReady');
        els.smartSummary.textContent=t('smart.recommendedSummary',{cols:settings.cols,rows:settings.rows,capacity:formatNumber(settings.capacity),colors:settings.maxColors,trimmed:state.autoTrimApplied?t('smart.trimmedShort',{percent:Math.round(state.autoTrimFraction*100)}):''});
        els.smartGenerateBtn.textContent=t('smart.generate');els.smartGenerateBtn.dataset.action='generate';
        els.smartExportBtn.hidden=true;
      }
    }

    function markCustomSettings() {
      if(!state.referenceImage)return;
      state.smartMode=false;state.smartPhase='custom';updateSmartCard();
    }

    async function generateSmartHd() {
      if(!state.referenceImage)return;
      const settings=currentSmartSettings();
      applySmartSettings(settings,{resetGrid:true});
      state.referenceRaster=renderReferenceRaster();
      renderAll();updateDetailAdvice();updateSmartCard();
      setStatus('status.generatingPixel',{cols:state.cols,rows:state.rows});
      await convertImage();
    }

    function hexToRgb(hex) {
      const value = hex.replace('#', '');
      return [parseInt(value.slice(0,2),16), parseInt(value.slice(2,4),16), parseInt(value.slice(4,6),16)];
    }

    function rgbToOklab(rgb) {
      const toLinear = value => {
        const c = value / 255;
        return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
      };
      const r = toLinear(rgb[0]), g = toLinear(rgb[1]), b = toLinear(rgb[2]);
      const l = .4122214708*r + .5363325363*g + .0514459929*b;
      const m = .2119034982*r + .6806995451*g + .1073969566*b;
      const s = .0883024619*r + .2817188376*g + .6299787005*b;
      const l3 = Math.cbrt(l), m3 = Math.cbrt(m), s3 = Math.cbrt(s);
      return [
        .2104542553*l3 + .793617785*m3 - .0040720468*s3,
        1.9779984951*l3 - 2.428592205*m3 + .4505937099*s3,
        .0259040371*l3 + .7827717662*m3 - .808675766*s3
      ];
    }

    function rgbToCielab(rgb) {
      const linear=value=>{const c=value/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);};
      const r=linear(rgb[0]),g=linear(rgb[1]),b=linear(rgb[2]);
      const x=(.4124564*r+.3575761*g+.1804375*b)/.95047;
      const y=(.2126729*r+.7151522*g+.072175*b);
      const z=(.0193339*r+.119192*g+.9503041*b)/1.08883;
      const f=value=>value>216/24389?Math.cbrt(value):(24389/27*value+16)/116;
      const fx=f(x),fy=f(y),fz=f(z);
      return [116*fy-16,500*(fx-fy),200*(fy-fz)];
    }

    function deltaE2000(first,second) {
      const [l1,a1,b1]=first,[l2,a2,b2]=second,rad=Math.PI/180,deg=180/Math.PI;
      const c1=Math.hypot(a1,b1),c2=Math.hypot(a2,b2),cBar=(c1+c2)/2,cBar7=cBar**7;
      const g=.5*(1-Math.sqrt(cBar7/(cBar7+25**7)));
      const a1p=(1+g)*a1,a2p=(1+g)*a2,c1p=Math.hypot(a1p,b1),c2p=Math.hypot(a2p,b2);
      const hue=(b,a)=>{const value=Math.atan2(b,a)*deg;return value<0?value+360:value;};
      const h1p=hue(b1,a1p),h2p=hue(b2,a2p),dLp=l2-l1,dCp=c2p-c1p;
      let dhp=0;
      if(c1p*c2p!==0){dhp=h2p-h1p;if(dhp>180)dhp-=360;else if(dhp<-180)dhp+=360;}
      const dHp=2*Math.sqrt(c1p*c2p)*Math.sin(dhp*rad/2),lBar=(l1+l2)/2,cBarp=(c1p+c2p)/2;
      let hBar=h1p+h2p;
      if(c1p*c2p!==0){hBar=Math.abs(h1p-h2p)<=180?(h1p+h2p)/2:(h1p+h2p<360?(h1p+h2p+360)/2:(h1p+h2p-360)/2);}
      const t=1-.17*Math.cos((hBar-30)*rad)+.24*Math.cos(2*hBar*rad)+.32*Math.cos((3*hBar+6)*rad)-.20*Math.cos((4*hBar-63)*rad);
      const deltaTheta=30*Math.exp(-1*Math.pow((hBar-275)/25,2)),cBarp7=cBarp**7;
      const rc=2*Math.sqrt(cBarp7/(cBarp7+25**7)),sl=1+.015*(lBar-50)**2/Math.sqrt(20+(lBar-50)**2),sc=1+.045*cBarp,sh=1+.015*cBarp*t;
      const rt=-Math.sin(2*deltaTheta*rad)*rc,dl=dLp/sl,dc=dCp/sc,dh=dHp/sh;
      return Math.sqrt(Math.max(0,dl*dl+dc*dc+dh*dh+rt*dc*dh));
    }

    PALETTE.forEach(color => {
      color.rgb = hexToRgb(color.hex);
      color.lab = rgbToOklab(color.rgb);
      color.cieLab = rgbToCielab(color.rgb);
    });
    const LEGACY_TO_MARD=new Map([...LEGACY_64_HEX].map(([code,hex])=>{
      const target=rgbToCielab(hexToRgb(hex));let best=PALETTE.findIndex(color=>color.code==='H2'),distance=Infinity;
      PALETTE.forEach(color=>{if(color.isTransparent)return;const value=deltaE2000(target,color.cieLab);if(value<distance){distance=value;best=color.index;}});
      return [code,best];
    }));

    function getAllowedPalette() {
      // H1 是透明豆，不应从普通不透明图片自动生成；用户仍可在色板中手动画入。
      return PALETTE.filter(color=>!color.isTransparent);
    }

    function cellSize() { return Math.max(1, Math.round(BASE_CELL * state.zoom)); }

    function maxSafeZoom(cols=state.cols,rows=state.rows) {
      const raw=Math.sqrt(DEVICE_LIMITS.renderPixels/Math.max(1,cols*rows))/BASE_CELL;
      return Math.max(.0625,Math.min(2,Math.floor(raw*4)/4));
    }

    function safeDpr(width, height) {
      const requested = Math.min(window.devicePixelRatio || 1, 2);
      const budgetScale=Math.sqrt(DEVICE_LIMITS.renderPixels/Math.max(1,width*height));
      return Math.max(.5,Math.min(requested,budgetScale));
    }

    function setupCanvas(canvas, cssWidth, cssHeight) {
      const dpr = safeDpr(cssWidth, cssHeight);
      canvas.width = Math.max(1, Math.round(cssWidth * dpr));
      canvas.height = Math.max(1, Math.round(cssHeight * dpr));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      return ctx;
    }

    function setStatus(key, params = {}) {
      state.statusKey=key;
      state.statusParams={...params};
      els.statusMessage.textContent = t(key,params);
    }

    function setProjectSubtitle(key,params={}) {
      state.projectSubtitleKey=key;
      state.projectSubtitleParams={...params};
      els.projectSubtitle.textContent=t(key,params);
    }

    let toastTimer = 0;
    function toast(key, type = 'info', params = {}) {
      window.clearTimeout(toastTimer);
      els.toast.textContent = t(key,params);
      els.toast.dataset.type = type;
      els.toast.setAttribute('role',type==='error'?'alert':'status');
      els.toast.setAttribute('aria-live',type==='error'?'assertive':'polite');
      els.toast.classList.add('is-visible');
      toastTimer = window.setTimeout(() => els.toast.classList.remove('is-visible'), 3000);
    }

    function updateSelectedColor() {
      const color = PALETTE[state.selectedColor] || PALETTE[0];
      els.selectedColorSwatch.style.background = color.displayHex;
      els.selectedColorSwatch.style.backgroundImage = color.isTransparent?'linear-gradient(45deg,#d9d9d9 25%,transparent 25%),linear-gradient(-45deg,#d9d9d9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d9d9d9 75%),linear-gradient(-45deg,transparent 75%,#d9d9d9 75%)':'';
      els.selectedColorSwatch.style.backgroundSize = color.isTransparent?'10px 10px':'';
      els.selectedColorName.textContent = localizedColorName(color);
      els.selectedColorCode.textContent = `${color.code} · ${color.hex.toUpperCase()}`;
      document.querySelectorAll('.palette-color').forEach(btn => {
        const selected=Number(btn.dataset.colorIndex) === state.selectedColor;
        btn.setAttribute('aria-pressed', String(selected));
        btn.tabIndex=selected?0:-1;
      });
    }

    function setTool(tool) {
      state.tool = tool;
      document.querySelectorAll('[data-tool]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
      });
      const cursor = tool === 'eraser' ? 'cell' : tool === 'picker' ? 'copy' : 'crosshair';
      els.patternCanvas.style.cursor = cursor;
      setStatus(`status.tool.${tool}`);
    }

    function renderPalette() {
      const rawQuery=els.paletteSearch.value.trim().toLowerCase();
      const query=rawQuery.replace(/^([a-hm])0+(\d+)$/,'$1$2');
      const allowed=PALETTE;
      els.paletteGrid.innerHTML = '';
      const visible=allowed.filter(color => (state.paletteSeries==='all'||color.series===state.paletteSeries)&&(!query || color.code.toLowerCase().includes(query) || localizedColorName(color).toLowerCase().includes(query) || color.name.includes(query) || color.hex.toLowerCase().includes(query)));
      visible.forEach(color => {
          const button = document.createElement('button');
          button.className = 'palette-color';
          button.type = 'button';
          button.dataset.colorIndex = color.index;
          button.setAttribute('aria-label', t('aria.chooseColor',{code:color.code,name:localizedColorName(color)}));
          button.setAttribute('aria-pressed', String(color.index === state.selectedColor));
          button.tabIndex=color.index===state.selectedColor?0:-1;
          button.title = t('title.color',{code:color.code,name:localizedColorName(color),hex:color.hex.toUpperCase()});
          button.innerHTML = `<span class="color-bead${color.isTransparent?' is-transparent':''}" style="background:${color.displayHex}"></span><b>${color.code}</b>`;
          button.addEventListener('click', () => {
            state.selectedColor = color.index;
            updateSelectedColor();
            setTool('brush');
          });
          button.addEventListener('keydown',event=>{
            if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
            const buttons=[...els.paletteGrid.querySelectorAll('.palette-color')];if(!buttons.length)return;
            event.preventDefault();const current=buttons.indexOf(button),columns=Math.max(1,Math.round(els.paletteGrid.clientWidth/Math.max(1,button.offsetWidth+12)));
            let next=current;
            if(event.key==='ArrowLeft')next=current-1;if(event.key==='ArrowRight')next=current+1;
            if(event.key==='ArrowUp')next=current-columns;if(event.key==='ArrowDown')next=current+columns;
            if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;
            buttons[Math.max(0,Math.min(buttons.length-1,next))].focus();
          });
          els.paletteGrid.appendChild(button);
        });
      els.paletteCountLabel.textContent=state.paletteSeries==='all'?t('palette.countAll'):t('palette.countSeries',{series:state.paletteSeries,count:visible.length});
    }

    function makeSnapshot() {
      return {
        cols:state.cols,rows:state.rows,cells:Array.from(state.grid),
        crop:{...normalizeCrop(state.crop)},referenceTransforms:[...(state.referenceTransforms||[])],
        settings:{processMode:els.processMode.value,fitMode:els.fitMode.value,whiteMode:els.whiteMode.value,maxColors:state.maxColors,mergeStrength:state.mergeStrength,protectDark:state.protectDark,sizeMode:state.sizeMode,aspectLock:state.aspectLock,boardProfile:state.boardProfile,boardTilesX:state.boardTilesX,boardTilesY:state.boardTilesY,smartMode:state.smartMode,smartPhase:state.smartPhase,autoTrimApplied:state.autoTrimApplied,autoTrimFraction:state.autoTrimFraction,lastConversionDiagnostics:state.lastConversionDiagnostics?{...state.lastConversionDiagnostics}:null}
      };
    }

    function snapshotsEqual(a, b) {
      if (!a || !b || a.cols !== b.cols || a.rows !== b.rows || a.cells.length !== b.cells.length) return false;
      for (let i = 0; i < a.cells.length; i++) if (a.cells[i] !== b.cells[i]) return false;
      return JSON.stringify(a.crop)===JSON.stringify(b.crop)&&JSON.stringify(a.referenceTransforms)===JSON.stringify(b.referenceTransforms)&&JSON.stringify(a.settings)===JSON.stringify(b.settings);
    }

    function resetHistory() {
      state.history = [makeSnapshot()];
      state.historyIndex = 0;
      updateHistoryButtons();
    }

    function commitHistory(labelKey = 'history.edited', labelParams = {}) {
      const next = makeSnapshot();
      const current = state.history[state.historyIndex];
      if (snapshotsEqual(next, current)) return;
      state.history.splice(state.historyIndex + 1);
      state.history.push(next);
      if (state.history.length > MAX_HISTORY + 1) state.history.shift();
      state.historyIndex = state.history.length - 1;
      state.dirty = true;
      updateHistoryButtons();
      scheduleDraftSave();
      setStatus('history.undoAvailable',{action:t(labelKey,labelParams),count:Math.min(state.historyIndex, MAX_HISTORY - 1)});
    }

    function updateHistoryButtons() {
      els.undoBtn.disabled = state.historyIndex <= 0;
      els.redoBtn.disabled = state.historyIndex >= state.history.length - 1;
    }

    function restoreSnapshot(snapshot) {
      state.cols = snapshot.cols;
      state.rows = snapshot.rows;
      state.grid = Int16Array.from(snapshot.cells);
      state.crop=normalizeCrop(snapshot.crop||state.crop);
      state.referenceTransforms=[...(snapshot.referenceTransforms||[])];
      const settings=snapshot.settings||{};
      if(settings.processMode&&MODE_HINTS[settings.processMode])els.processMode.value=settings.processMode;
      if(settings.fitMode)els.fitMode.value=settings.fitMode==='contain'?'contain':'cover';
      if(settings.whiteMode)els.whiteMode.value=settings.whiteMode==='keep'?'keep':'auto';
      state.maxColors=Math.round(clamp(settings.maxColors??state.maxColors,2,64));state.mergeStrength=Math.round(clamp(settings.mergeStrength??state.mergeStrength,0,30));state.protectDark=settings.protectDark!==false;state.sizeMode=settings.sizeMode==='board'?'board':'pattern';state.aspectLock=settings.aspectLock!==false;
      state.boardProfile=BOARD_PROFILES[settings.boardProfile]?settings.boardProfile:'mini52';state.boardTilesX=Math.max(1,Math.round(settings.boardTilesX||1));state.boardTilesY=Math.max(1,Math.round(settings.boardTilesY||1));els.boardProfile.value=state.boardProfile;
      if(state.sizeMode==='board')els.fitMode.value='contain';
      state.smartMode=Boolean(settings.smartMode);state.smartPhase=settings.smartPhase||'custom';
      state.lastConversionDiagnostics=settings.lastConversionDiagnostics?{...settings.lastConversionDiagnostics}:null;
      state.autoTrimApplied=Boolean(settings.autoTrimApplied);
      state.autoTrimFraction=state.autoTrimApplied?clamp(settings.autoTrimFraction||0,0,1):0;
      els.processModeHint.textContent=modeHint(els.processMode.value);els.maxColors.value=state.maxColors;els.maxColorsValue.textContent=t('unit.colorsValue',{count:state.maxColors});els.mergeStrength.value=state.mergeStrength;els.mergeStrengthValue.textContent=state.mergeStrength;els.protectDark.checked=state.protectDark;els.aspectLock.checked=state.aspectLock;
      state.keyboardCursor.x = Math.min(state.keyboardCursor.x, state.cols - 1);
      state.keyboardCursor.y = Math.min(state.keyboardCursor.y, state.rows - 1);
      els.gridCols.value = state.cols;
      els.gridRows.value = state.rows;
      if (state.referenceImage){state.sourceAnalysis=analyzeReferenceImage(state.referenceImage,state.referenceSourceWidth,state.referenceSourceHeight,state.crop);rebuildReferenceRaster();updateDetailAdvice();updateSmartCard();}
      syncSizeModeUI();syncAspectStatus();
      renderAll();
    }

    function conversionInProgress() {
      return Boolean(state.cancelConversion)||els.convertOverlay.classList.contains('is-visible');
    }

    function setConversionModal(active,{restoreFocus=true}={}) {
      const backgrounds=[document.querySelector('.app-shell'),document.querySelector('.mobile-dock'),els.mobileScrim].filter(Boolean);
      if(active){
        els.convertOverlay.classList.add('is-visible');
        document.querySelector('.app-shell').setAttribute('aria-busy','true');
        // 遮罩在 app-shell 外，因此可以把完整应用设为 inert，同时保留取消按钮。
        // 先把焦点送入遮罩，避免辅助技术仍停在即将失效的背景控件上。
        els.cancelConvertBtn.focus({preventScroll:true});
        backgrounds.forEach(element=>{element.inert=true;});
        if(els.patternReadyBar)els.patternReadyBar.hidden=true;
      }else{
        backgrounds.forEach(element=>{element.inert=false;});
        els.convertOverlay.classList.remove('is-visible');
        document.querySelector('.app-shell').removeAttribute('aria-busy');
        if(restoreFocus&&state.convertFocusReturn?.isConnected)state.convertFocusReturn.focus({preventScroll:true});
        state.convertFocusReturn=null;
        if(els.patternReadyBar)els.patternReadyBar.hidden=getStats().total===0;
      }
    }

    function blockMutationDuringConversion() {
      if(!conversionInProgress())return false;
      toast('toast.conversionBusy');
      setStatus('status.conversionBlocked');
      return true;
    }

    function undo() {
      if(blockMutationDuringConversion())return;
      if (state.historyIndex <= 0) return;
      state.historyIndex--;
      restoreSnapshot(state.history[state.historyIndex]);
      updateHistoryButtons();
      state.dirty=true;scheduleDraftSave();
      setStatus('status.undo');
    }

    function redo() {
      if(blockMutationDuringConversion())return;
      if (state.historyIndex >= state.history.length - 1) return;
      state.historyIndex++;
      restoreSnapshot(state.history[state.historyIndex]);
      updateHistoryButtons();
      state.dirty=true;scheduleDraftSave();
      setStatus('status.redo');
    }

    function resizeCanvases() {
      const size = cellSize();
      const width = state.cols * size;
      const height = state.rows * size;
      els.canvasStack.style.width = `${width}px`;
      els.canvasStack.style.height = `${height}px`;
      setupCanvas(els.referenceCanvas, width, height);
      setupCanvas(els.patternCanvas, width, height);
      setupCanvas(els.topRuler, width, 28);
      setupCanvas(els.leftRuler, 28, height);
      els.boardShell.classList.toggle('rulers-hidden', !state.showRulers);
      els.patternCanvas.setAttribute('aria-label', t('aria.patternCanvas',{cols:state.cols,rows:state.rows}));
    }

    function drawReference() {
      const size = cellSize();
      const width = state.cols * size;
      const height = state.rows * size;
      const ctx = els.referenceCanvas.getContext('2d');
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,els.referenceCanvas.width,els.referenceCanvas.height);
      ctx.restore();
      const dpr = els.referenceCanvas.width / width;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle = '#f8f6f0';
      ctx.fillRect(0,0,width,height);
      if (state.referenceRaster) {
        ctx.save();
        ctx.globalAlpha = state.referenceOpacity;
        ctx.drawImage(state.referenceRaster, 0, 0, width, height);
        ctx.restore();
      }
    }

    function colorText(hex) {
      const [r,g,b] = hexToRgb(hex);
      const linear=value=>{const c=value/255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);};
      const luminance=.2126*linear(r)+.7152*linear(g)+.0722*linear(b);
      const dark='#000000',light='#FFFFFF',darkLum=0,lightLum=1;
      const darkContrast=(luminance+.05)/(darkLum+.05),lightContrast=(lightLum+.05)/(luminance+.05);
      return darkContrast>=lightContrast?dark:light;
    }

    function contrastRatio(firstHex,secondHex) {
      const lum=hex=>{const [r,g,b]=hexToRgb(hex),linear=value=>{const c=value/255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);};return .2126*linear(r)+.7152*linear(g)+.0722*linear(b);};
      const a=lum(firstHex),b=lum(secondHex);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    }

    function majorGridStops(length,step=10) {
      const interval=Number.isFinite(Number(step))&&Number(step)>=2?Math.round(Number(step)):10,stops=[0];
      for(let value=interval;value<length;value+=interval)stops.push(value);
      if(stops[stops.length-1]!==length)stops.push(length);
      return stops;
    }

    function drawMajorGrid(ctx,originX,originY,cols,rows,size,step,{color='rgba(29,31,30,.62)',lineWidth=Math.max(1.5,size*.1)}={}) {
      const width=cols*size,height=rows*size;
      ctx.save();ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();
      majorGridStops(cols,step).forEach(value=>{const x=originX+Math.max(lineWidth/2,Math.min(width-lineWidth/2,value*size));ctx.moveTo(x,originY);ctx.lineTo(x,originY+height);});
      majorGridStops(rows,step).forEach(value=>{const y=originY+Math.max(lineWidth/2,Math.min(height-lineWidth/2,value*size));ctx.moveTo(originX,y);ctx.lineTo(originX+width,y);});
      ctx.stroke();ctx.restore();
    }

    function drawPhysicalBoardSeams(ctx,originX,originY,cols,rows,size,{color='rgba(128,42,23,.9)',lineWidth=Math.max(2.5,size*.16)}={}) {
      if(state.sizeMode!=='board')return;
      const profile=BOARD_PROFILES[state.boardProfile]||BOARD_PROFILES.mini52;
      drawMajorGrid(ctx,originX,originY,cols,rows,size,profile.cells,{color,lineWidth});
    }

    function drawPatternCell(ctx, x, y) {
      const size = cellSize();
      const px = x * size;
      const py = y * size;
      const value = state.grid[y * state.cols + x];
      ctx.clearRect(px, py, size, size);
      if (value >= 0 && PALETTE[value]) {
        const color = PALETTE[value];
        if (state.previewMode === 'bead') {
          const radius = Math.max(1.6, size * .39);
          ctx.beginPath();
          ctx.arc(px + size/2, py + size/2, radius, 0, Math.PI * 2);
          ctx.fillStyle = color.displayHex;
          ctx.fill();
          ctx.strokeStyle = color.code === 'H2' ? 'rgba(36,34,31,.16)' : 'rgba(36,34,31,.24)';
          ctx.lineWidth = Math.max(.55, size * .035);
          ctx.stroke();
          if (size >= 10 && !state.showCodes) {
            ctx.beginPath();
            ctx.arc(px + size/2, py + size/2, Math.max(1, size * .115), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(250,248,243,.82)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(36,34,31,.14)';
            ctx.lineWidth = .6;
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = color.displayHex;
          ctx.fillRect(px, py, size, size);
        }
        if (state.showCodes && size >= 14) {
          ctx.fillStyle = colorText(color.displayHex);
          ctx.font = `800 ${Math.max(7, Math.floor(size * .34))}px ui-monospace,SFMono-Regular,Consolas,monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(color.code, px + size/2, py + size/2);
        }
      }
      if (state.showGrid) {
        ctx.strokeStyle = 'rgba(55,51,45,.24)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + .5, py + .5, size, size);
      }
    }

    function drawPattern() {
      const size = cellSize();
      const width = state.cols * size;
      const height = state.rows * size;
      const ctx = els.patternCanvas.getContext('2d');
      const dpr = els.patternCanvas.width / width;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,els.patternCanvas.width,els.patternCanvas.height);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      for (let y = 0; y < state.rows; y++) {
        for (let x = 0; x < state.cols; x++) drawPatternCell(ctx, x, y);
      }
      if(state.showGrid){drawMajorGrid(ctx,0,0,state.cols,state.rows,size,state.majorGridStep);drawPhysicalBoardSeams(ctx,0,0,state.cols,state.rows,size);}
      if (state.canvasFocused) {
        const {x,y} = state.keyboardCursor;
        ctx.strokeStyle = '#215f9a';
        ctx.lineWidth = Math.max(2, size * .12);
        ctx.strokeRect(x*size + 2, y*size + 2, size - 4, size - 4);
      }
    }

    function drawRulers() {
      if (!state.showRulers) return;
      const size = cellSize();
      const width = state.cols * size;
      const height = state.rows * size;
      const top = els.topRuler.getContext('2d');
      const left = els.leftRuler.getContext('2d');
      const topDpr = els.topRuler.width / width;
      const leftDpr = els.leftRuler.height / height;
      top.setTransform(1,0,0,1,0,0); top.clearRect(0,0,els.topRuler.width,els.topRuler.height); top.setTransform(topDpr,0,0,topDpr,0,0);
      left.setTransform(1,0,0,1,0,0); left.clearRect(0,0,els.leftRuler.width,els.leftRuler.height); left.setTransform(leftDpr,0,0,leftDpr,0,0);
      top.fillStyle = left.fillStyle = '#f3efe7';
      top.fillRect(0,0,width,28); left.fillRect(0,0,28,height);
      top.strokeStyle = left.strokeStyle = '#8d857a';
      top.fillStyle = left.fillStyle = '#5f5951';
      top.textAlign = 'center'; top.textBaseline = 'middle';
      left.textAlign = 'center'; left.textBaseline = 'middle';
      const fontSize = size < 10 ? 6 : size < 15 ? 7 : 8;
      top.font = `${fontSize}px ui-monospace,SFMono-Regular,Consolas,monospace`;
      left.font = `${fontSize}px ui-monospace,SFMono-Regular,Consolas,monospace`;
      for (let x = 0; x < state.cols; x++) {
        const cx = x*size + size/2;
        top.beginPath(); top.moveTo(x*size+.5, 20); top.lineTo(x*size+.5, 28); top.stroke();
        if (size >= 11 || x % 5 === 0) top.fillText(String(x+1), cx, 10);
      }
      for (let y = 0; y < state.rows; y++) {
        const cy = y*size + size/2;
        left.beginPath(); left.moveTo(20, y*size+.5); left.lineTo(28, y*size+.5); left.stroke();
        if (size >= 11 || y % 5 === 0) left.fillText(String(y+1), 10, cy);
      }
      top.strokeStyle = left.strokeStyle = '#6f675e';
      top.beginPath(); top.moveTo(0,27.5); top.lineTo(width,27.5); top.stroke();
      left.beginPath(); left.moveTo(27.5,0); left.lineTo(27.5,height); left.stroke();
    }

    function renderAll() {
      state.zoom=Math.min(state.zoom,maxSafeZoom());
      resizeCanvases();
      drawReference();
      drawPattern();
      drawRulers();
      updateStats();
      updateViewButtons();
    }

    function schedulePatternRender() {
      if (state.renderQueued) return;
      state.renderQueued = true;
      requestAnimationFrame(() => {
        state.renderQueued = false;
        drawPattern();
      });
    }

    function getStats() {
      const counts = new Map();
      let total = 0;
      for (const value of state.grid) {
        if (value >= 0 && PALETTE[value]) {
          counts.set(value, (counts.get(value) || 0) + 1);
          total++;
        }
      }
      return { counts, total, empty: state.grid.length - total };
    }

    function formatShare(count, total) {
      if (!total) return { width: '0%', label: '0%' };
      const exact = Math.min(100, count / total * 100);
      return {
        width: `${exact.toFixed(2)}%`,
        label: exact >= 9.95 ? `${Math.round(exact)}%` : `${exact.toFixed(1)}%`
      };
    }

    function buildMaterialListText() {
      const {counts,total} = getStats();
      const rows = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0] - b[0]);
      if (!total) return '';
      const lines = [
        t('stats.listTitle'),
        t('stats.listMeta',{cols:state.cols,rows:state.rows,total:formatNumber(total),colors:counts.size}),
        ...rows.map(([index,count]) => {
          const color = PALETTE[index];
          return t('stats.listLine',{code:color.code,name:localizedColorName(color),count:formatNumber(count),percent:formatShare(count,total).label});
        }),
        t('stats.listTip')
      ];
      return lines.join('\n');
    }

    async function copyStatsList() {
      const text = buildMaterialListText();
      if (!text) { toast('stats.emptyList'); return; }
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch (_) { /* 非安全上下文或权限被拒时回退到临时文本框。 */ }
      if (!copied) {
        const scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.setAttribute('readonly','');
        scratch.style.position='fixed';
        scratch.style.opacity='0';
        document.body.appendChild(scratch);
        scratch.select();
        try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
        scratch.remove();
      }
      toast(copied ? 'toast.statsCopied' : 'toast.statsCopyFailed', copied ? 'info' : 'error');
    }

    function updateStats() {
      const {counts,total,empty} = getStats();
      els.totalBeads.textContent = formatNumber(total);
      els.usedColors.textContent = counts.size;
      els.emptyCells.textContent = formatNumber(empty);
      const pattern=currentPatternPlacement();
      els.statusSize.textContent = state.sizeMode==='board'?t('status.boardPattern',{boardCols:state.cols,boardRows:state.rows,patternCols:pattern.cols,patternRows:pattern.rows}):`${state.cols} × ${state.rows}`;
      els.statusColors.textContent = t('unit.colors',{count:counts.size});
      els.statusBeads.textContent = t('unit.beads',{count:total,formatted:formatNumber(total)});
      els.statusZoom.textContent = t('status.zoomValue',{percent:Math.round(state.zoom*100)});
      els.zoomValue.textContent = `${Math.round(state.zoom*100)}%`;

      const rows = [...counts.entries()].sort((a,b) => b[1] - a[1]);
      els.statsList.innerHTML = '';
      if (els.copyStatsBtn) els.copyStatsBtn.hidden = rows.length === 0;
      if (!rows.length) {
        const emptyMessage=document.createElement('div');emptyMessage.className='empty-list';emptyMessage.textContent=t('stats.emptyList');els.statsList.replaceChildren(emptyMessage);
      } else {
        rows.forEach(([index,count]) => {
          const color = PALETTE[index];
          const share = formatShare(count,total);
          const row = document.createElement('div');
          row.className = 'stat-row';
          row.style.setProperty('--share', share.width);
          row.title = t('aria.statShare',{percent:share.label});
          row.innerHTML = `<span class="stat-bar" aria-hidden="true"></span><span class="stat-swatch" style="background:${color.displayHex}"></span><span class="stat-copy"><strong>${color.code} · ${localizedColorName(color)}</strong><span>${color.hex.toUpperCase()}</span></span><span class="stat-count">${formatNumber(count)}<em class="stat-percent">${share.label}</em></span>`;
          els.statsList.appendChild(row);
        });
      }

      const compactCodeHint=state.showCodes&&cellSize()<14;
      els.legendStrip.innerHTML = `<span class="legend-label">${t(compactCodeHint?'legend.codesZoom':'legend.title')}</span>`;
      if (!rows.length) {
        const chip=document.createElement('span');chip.className='legend-chip';chip.textContent=t('legend.empty');els.legendStrip.appendChild(chip);
      } else {
        rows.forEach(([index,count]) => {
          const color = PALETTE[index];
          const chip = document.createElement('span');
          chip.className = 'legend-chip';
          chip.innerHTML = `<i style="background:${color.displayHex}"></i>${color.code} · ${formatNumber(count)}`;
          els.legendStrip.appendChild(chip);
        });
      }
      els.emptyState.hidden = Boolean(total || state.referenceImage);
      if(els.patternReadyBar)els.patternReadyBar.hidden=total===0||conversionInProgress();
      if(els.readyShareCardBtn){els.readyShareCardBtn.disabled=!state.referenceImage;els.readyShareCardBtn.title=!state.referenceImage?t('share.unavailable'):'';}
      if(state.referenceImage)updateSmartCard();
    }

    function updateViewButtons() {
      els.gridToggle.setAttribute('aria-pressed', String(state.showGrid));
      els.rulerToggle.setAttribute('aria-pressed', String(state.showRulers));
      els.codesToggle.setAttribute('aria-pressed', String(state.showCodes));
      const codesVisible=state.showCodes&&cellSize()>=14;
      els.codesToggle.setAttribute('aria-label',t(state.showCodes?(codesVisible?'aria.codesOff':'aria.codesZoom'):'aria.codesOn'));
      els.codesToggle.title=t(state.showCodes&&!codesVisible?'title.codesZoom':'title.codesToggle');
      document.querySelectorAll('[data-preview]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preview === state.previewMode)));
      document.querySelectorAll('[data-palette-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paletteMode === state.paletteMode)));
      document.querySelectorAll('[data-palette-series]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.paletteSeries===state.paletteSeries)));
      document.querySelectorAll('[data-size]').forEach(button => {
        const size=Number(button.dataset.size),active=state.referenceImage&&state.aspectLock?Math.max(state.cols,state.rows)===size:state.cols===size&&state.rows===size;
        button.setAttribute('aria-pressed',String(active));
      });
      const zoomLimit=maxSafeZoom();
      els.zoomInBtn.disabled=state.zoom>=zoomLimit-.001;
      els.zoomOutBtn.disabled=state.zoom<=.0625+.001;
      els.zoomInBtn.title=zoomLimit<2?t('title.zoomLimit',{percent:Math.round(zoomLimit*100)}):t('aria.zoomIn');
    }

    function pointerCell(event) {
      const rect = els.patternCanvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / rect.width * state.cols);
      const y = Math.floor((event.clientY - rect.top) / rect.height * state.rows);
      if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return null;
      return {x,y};
    }

    function applyToolAt(x, y, overrideTool = null) {
      const index = y * state.cols + x;
      const tool = overrideTool || state.tool;
      if (tool === 'picker') {
        const value = state.grid[index];
        if (value >= 0) {
          state.selectedColor = value;
          updateSelectedColor();
          setTool('brush');
          toast('toast.colorSelected','success',{code:PALETTE[value].code,name:localizedColorName(PALETTE[value])});
        } else {
          toast('toast.emptyPicker');
        }
        return false;
      }
      const next = tool === 'eraser' ? -1 : state.selectedColor;
      if (state.grid[index] === next) return false;
      state.grid[index] = next;
      if(state.smartMode)markCustomSettings();
      state.keyboardCursor = {x,y};
      state.strokeChanged = true;
      schedulePatternRender();
      if (!state.statsQueued) {
        state.statsQueued = true;
        window.setTimeout(() => { state.statsQueued = false; updateStats(); }, 70);
      }
      return true;
    }

    function drawLine(from, to) {
      let x0 = from.x, y0 = from.y;
      const x1 = to.x, y1 = to.y;
      const dx = Math.abs(x1-x0), sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1-y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      while (true) {
        applyToolAt(x0,y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }

    function endStroke(event) {
      if (!state.isDrawing) return;
      state.isDrawing = false;
      state.lastCell = null;
      try { els.patternCanvas.releasePointerCapture(event.pointerId); } catch (_) {}
      if (state.strokeChanged) commitHistory('history.stroke');
      state.strokeChanged = false;
      updateStats();
    }

    function renderReferenceRaster({contentOnly=false}={}) {
      if (!state.referenceImage) return null;
      let image = state.referenceImage;
      let iw = image.naturalWidth || image.width;
      let ih = image.naturalHeight || image.height;
      let cropRect=cropSourceRect(iw,ih,state.crop);
      if(state.referenceTransforms?.length){
        let working=document.createElement('canvas');working.width=Math.max(1,Math.round(cropRect.w));working.height=Math.max(1,Math.round(cropRect.h));
        let workingCtx=working.getContext('2d');workingCtx.imageSmoothingEnabled=true;workingCtx.imageSmoothingQuality='high';
        workingCtx.drawImage(image,cropRect.x,cropRect.y,cropRect.w,cropRect.h,0,0,working.width,working.height);
        for(const type of state.referenceTransforms){
          const rotated=type==='rotate',next=document.createElement('canvas');next.width=rotated?working.height:working.width;next.height=rotated?working.width:working.height;
          const nextCtx=next.getContext('2d');nextCtx.imageSmoothingEnabled=true;nextCtx.imageSmoothingQuality='high';nextCtx.save();
          if(type==='rotate'){nextCtx.translate(next.width,0);nextCtx.rotate(Math.PI/2);}
          else if(type==='mirrorH'){nextCtx.translate(next.width,0);nextCtx.scale(-1,1);}
          else if(type==='mirrorV'){nextCtx.translate(0,next.height);nextCtx.scale(1,-1);}
          nextCtx.drawImage(working,0,0);nextCtx.restore();working=next;
        }
        image=working;iw=working.width;ih=working.height;cropRect={x:0,y:0,w:iw,h:ih};
      }
      const maxRasterPixels = els.processMode.value==='document'?1600000:4000000;
      if(contentOnly){
        const scale=Math.min(1,Math.sqrt(maxRasterPixels/Math.max(1,cropRect.w*cropRect.h)));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(cropRect.w*scale));canvas.height=Math.max(1,Math.round(cropRect.h*scale));
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=els.processMode.value!=='pixel';ctx.imageSmoothingQuality='high';
        ctx.drawImage(image,cropRect.x,cropRect.y,cropRect.w,cropRect.h,0,0,canvas.width,canvas.height);
        return canvas;
      }
      const targetAspect = state.cols / state.rows;
      const sourceAspect = cropRect.w / cropRect.h;
      if(state.sizeMode==='board'&&els.fitMode.value==='contain'){
        const placement=fitPatternInsideBoard(cropRect.w,cropRect.h,state.cols,state.rows);
        const unit=Math.max(1,Math.min(64,Math.floor(Math.sqrt(maxRasterPixels/Math.max(1,state.cols*state.rows)))));
        const canvas=document.createElement('canvas');canvas.width=state.cols*unit;canvas.height=state.rows*unit;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=els.processMode.value!=='pixel';ctx.imageSmoothingQuality='high';
        ctx.drawImage(image,cropRect.x,cropRect.y,cropRect.w,cropRect.h,placement.offsetX*unit,placement.offsetY*unit,placement.cols*unit,placement.rows*unit);
        return canvas;
      }
      let sx = cropRect.x, sy = cropRect.y, sw = cropRect.w, sh = cropRect.h;
      let rasterWidth, rasterHeight, dx = 0, dy = 0, dw, dh;

      if (els.fitMode.value === 'cover') {
        if (sourceAspect > targetAspect) {
          const nextWidth = sh * targetAspect;
          sx += (sw - nextWidth) / 2;
          sw = nextWidth;
        } else {
          const nextHeight = sw / targetAspect;
          sy += (sh - nextHeight) / 2;
          sh = nextHeight;
        }
        const scale = Math.min(1, Math.sqrt(maxRasterPixels / Math.max(1, sw * sh)));
        rasterWidth = Math.max(state.cols, Math.round(sw * scale));
        rasterHeight = Math.max(state.rows, Math.round(sh * scale));
        dw = rasterWidth;
        dh = rasterHeight;
      } else {
        let baseWidth, baseHeight;
        if (sourceAspect >= targetAspect) {
          baseWidth = sw;
          baseHeight = sw / targetAspect;
        } else {
          baseHeight = sh;
          baseWidth = sh * targetAspect;
        }
        const scale = Math.min(1, Math.sqrt(maxRasterPixels / Math.max(1, baseWidth * baseHeight)));
        rasterWidth = Math.max(state.cols, Math.round(baseWidth * scale));
        rasterHeight = Math.max(state.rows, Math.round(baseHeight * scale));
        const imageScale = Math.min(rasterWidth / sw, rasterHeight / sh);
        dw = sw * imageScale;
        dh = sh * imageScale;
        dx = (rasterWidth - dw) / 2;
        dy = (rasterHeight - dh) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = rasterWidth;
      canvas.height = rasterHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.imageSmoothingEnabled = els.processMode.value !== 'pixel';
      ctx.imageSmoothingQuality = 'high';
      if (els.fitMode.value === 'cover') ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
      else ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      return canvas;
    }

    function rebuildReferenceRaster() {
      state.referenceRaster = renderReferenceRaster();
      drawReference();
    }

    function prepareCropPreview() {
      if(!state.referenceImage)return;
      const canvas=els.cropCanvas;
      const iw=state.referenceImage.naturalWidth||state.referenceImage.width,ih=state.referenceImage.naturalHeight||state.referenceImage.height;
      canvas.width=720;canvas.height=Math.round(clamp(720*ih/iw,320,520));
      const scale=Math.min(canvas.width/iw,canvas.height/ih),dw=iw*scale,dh=ih*scale,dx=(canvas.width-dw)/2,dy=(canvas.height-dh)/2;
      state.cropPreview={dx,dy,dw,dh};
      const base=document.createElement('canvas');base.width=canvas.width;base.height=canvas.height;
      const baseCtx=base.getContext('2d');baseCtx.fillStyle='#201f1c';baseCtx.fillRect(0,0,base.width,base.height);
      baseCtx.imageSmoothingEnabled=true;baseCtx.imageSmoothingQuality='high';baseCtx.drawImage(state.referenceImage,dx,dy,dw,dh);
      state.cropPreviewBase=base;
    }

    function syncCropInputs(crop) {
      const values=[crop.x,crop.y,crop.w,crop.h].map(value=>String(Math.round(value*200)/2));
      [els.cropXInput,els.cropYInput,els.cropWInput,els.cropHInput].forEach((input,index)=>{input.value=values[index];});
    }

    function cropFromInputs() {
      const inputs=[els.cropXInput,els.cropYInput,els.cropWInput,els.cropHInput];
      if(inputs.some(input=>input.value===''))return null;
      const read=(input,fallback)=>Number.isFinite(input.valueAsNumber)?input.valueAsNumber/100:fallback;
      const current=normalizeCrop(state.cropDraft);
      const x=clamp(read(els.cropXInput,current.x),0,.975),y=clamp(read(els.cropYInput,current.y),0,.975);
      const w=clamp(read(els.cropWInput,current.w),.025,1-x),h=clamp(read(els.cropHInput,current.h),.025,1-y);
      return normalizeCrop({x,y,w,h});
    }

    function drawCropPreview() {
      if(!state.referenceImage)return;
      if(!state.cropPreviewBase)prepareCropPreview();
      const canvas=els.cropCanvas,ctx=canvas.getContext('2d'),{dx,dy,dw,dh}=state.cropPreview;
      ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(state.cropPreviewBase,0,0);
      const crop=normalizeCrop(state.cropDraft),rx=dx+crop.x*dw,ry=dy+crop.y*dh,rw=crop.w*dw,rh=crop.h*dh;
      syncCropInputs(crop);
      ctx.save();ctx.fillStyle='rgba(20,18,16,.62)';ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);ctx.rect(rx,ry,rw,rh);ctx.fill('evenodd');ctx.restore();
      ctx.strokeStyle='#ffb18f';ctx.lineWidth=3;ctx.strokeRect(rx+1.5,ry+1.5,Math.max(0,rw-3),Math.max(0,rh-3));
      ctx.fillStyle='#fff';ctx.strokeStyle='#a94726';ctx.lineWidth=2;
      for(const [x,y] of [[rx,ry],[rx+rw,ry],[rx,ry+rh],[rx+rw,ry+rh]]){ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.stroke();}
      const sourceWidth=state.referenceSourceWidth||(state.referenceImage.naturalWidth||state.referenceImage.width),sourceHeight=state.referenceSourceHeight||(state.referenceImage.naturalHeight||state.referenceImage.height);
      const px=Math.round(sourceWidth*crop.w),py=Math.round(sourceHeight*crop.h),label=t('crop.sourcePixels',{width:px,height:py});
      ctx.font='600 13px "Segoe UI",sans-serif';const labelWidth=ctx.measureText(label).width+18;
      const lx=Math.min(canvas.width-labelWidth-6,Math.max(6,rx+8)),ly=Math.min(canvas.height-30,Math.max(6,ry+8));
      ctx.fillStyle='rgba(25,23,20,.82)';ctx.fillRect(lx,ly,labelWidth,24);ctx.fillStyle='#fff';ctx.fillText(label,lx+9,ly+16);
    }

    function cropPoint(event) {
      const preview=state.cropPreview,rect=els.cropCanvas.getBoundingClientRect();
      if(!preview||!rect.width||!rect.height)return null;
      const px=(event.clientX-rect.left)*els.cropCanvas.width/rect.width,py=(event.clientY-rect.top)*els.cropCanvas.height/rect.height;
      return {x:clamp((px-preview.dx)/preview.dw,0,1),y:clamp((py-preview.dy)/preview.dh,0,1)};
    }

    function openCropDialog() {
      if(!state.referenceImage)return;
      state.cropDraft={...normalizeCrop(state.crop)};state.cropDrag=null;if(!state.cropPreviewBase)prepareCropPreview();drawCropPreview();
      if(typeof els.cropDialog.showModal==='function')els.cropDialog.showModal();else els.cropDialog.setAttribute('open','');
    }

    function closeCropDialog() {
      state.cropDrag=null;
      if(typeof els.cropDialog.close==='function')els.cropDialog.close();else els.cropDialog.removeAttribute('open');
    }

    function openProductDialog() {
      state.productFocusReturn=document.activeElement instanceof HTMLElement?document.activeElement:null;
      if(typeof els.productDialog.showModal==='function')els.productDialog.showModal();else els.productDialog.setAttribute('open','');
      requestAnimationFrame(()=>els.productCloseBtn.focus({preventScroll:true}));
    }

    function closeProductDialog() {
      if(typeof els.productDialog.close==='function')els.productDialog.close();else els.productDialog.removeAttribute('open');
      if(state.productFocusReturn?.isConnected)state.productFocusReturn.focus({preventScroll:true});
      state.productFocusReturn=null;
    }

    async function restoreFullImageBounds() {
      if(!state.referenceImage||!state.autoTrimApplied)return;
      const previousLongSide=Math.max(state.cols,state.rows);
      state.crop={x:0,y:0,w:1,h:1};state.cropDraft={...state.crop};state.autoTrimApplied=false;state.autoTrimFraction=0;state.referenceTransforms=[];state.hasAutoFit=false;
      state.cropPreview=null;state.cropPreviewBase=null;
      state.sourceAnalysis=analyzeReferenceImage(state.referenceImage,state.referenceSourceWidth,state.referenceSourceHeight,state.crop);
      if(state.sizeMode==='pattern'&&state.aspectLock){
        const source=effectiveSourceSize(),next=gridForLongSide(source.width,source.height,previousLongSide);
        state.cols=next.cols;state.rows=next.rows;state.grid=new Int16Array(state.cols*state.rows).fill(-1);state.keyboardCursor={x:0,y:0};
        els.gridCols.value=state.cols;els.gridRows.value=state.rows;
      }
      markCustomSettings();rebuildReferenceRaster();syncSizeModeUI();syncAspectStatus();updateDetailAdvice();updateSmartCard();
      els.fileDetails.textContent=t('file.restored',{width:state.referenceSourceWidth,height:state.referenceSourceHeight,size:(state.referenceFileSize/1024/1024).toFixed(2)});
      await convertImage();
    }

    async function applyCrop() {
      const next=normalizeCrop(state.cropDraft);
      if(next.w<.025||next.h<.025){toast('toast.cropTooSmall','error');return;}
      state.crop=next;state.autoTrimApplied=false;state.autoTrimFraction=0;state.referenceTransforms=[];state.hasAutoFit=false;
      state.sourceAnalysis=analyzeReferenceImage(state.referenceImage,state.referenceSourceWidth,state.referenceSourceHeight,next);
      if(state.smartMode)applySmartSettings(currentSmartSettings(),{resetGrid:true});else applyAutomaticMode();
      closeCropDialog();rebuildReferenceRaster();syncSizeModeUI();updateDetailAdvice();updateSmartCard();
      const iw=state.referenceSourceWidth||(state.referenceImage.naturalWidth||state.referenceImage.width),ih=state.referenceSourceHeight||(state.referenceImage.naturalHeight||state.referenceImage.height);
      els.fileDetails.textContent=t('file.cropped',{width:iw,height:ih,cropWidth:Math.round(iw*next.w),cropHeight:Math.round(ih*next.h)});
      await convertImage();
    }

    async function readImageDimensions(file) {
      const bytes=new Uint8Array(await file.slice(0,Math.min(file.size,512*1024)).arrayBuffer());
      const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),length=bytes.length;
      const ascii=(offset,count)=>offset+count<=length?String.fromCharCode(...bytes.subarray(offset,offset+count)):'';
      if(length>=24&&bytes[0]===0x89&&ascii(1,3)==='PNG')return {width:view.getUint32(16),height:view.getUint32(20)};
      if(length>=10&&(ascii(0,6)==='GIF87a'||ascii(0,6)==='GIF89a'))return {width:view.getUint16(6,true),height:view.getUint16(8,true)};
      if(length>=30&&ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP'){
        const type=ascii(12,4);
        if(type==='VP8X'){
          const width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);
          return {width,height};
        }
        if(type==='VP8L'&&bytes[20]===0x2f){
          const width=1+bytes[21]+((bytes[22]&0x3f)<<8),height=1+((bytes[22]&0xc0)>>6)+(bytes[23]<<2)+((bytes[24]&0x0f)<<10);
          return {width,height};
        }
        if(type==='VP8 '&&length>=30&&bytes[23]===0x9d&&bytes[24]===0x01&&bytes[25]===0x2a)return {width:view.getUint16(26,true)&0x3fff,height:view.getUint16(28,true)&0x3fff};
      }
      if(length>=4&&bytes[0]===0xff&&bytes[1]===0xd8){
        const sof=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
        let offset=2;
        while(offset+9<length){
          if(bytes[offset]!==0xff){offset++;continue;}
          while(offset<length&&bytes[offset]===0xff)offset++;
          const marker=bytes[offset++];
          if(sof.has(marker)&&offset+7<length)return {height:view.getUint16(offset+3),width:view.getUint16(offset+5)};
          if(marker===0xd9||marker===0xda)break;
          if(marker===0x01||(marker>=0xd0&&marker<=0xd8))continue;
          if(offset+1>=length)break;
          const segmentLength=view.getUint16(offset);if(segmentLength<2)break;offset+=segmentLength;
        }
      }
      return null;
    }

    async function decodeImageFile(file,dimensions) {
      const maxDecodedPixels=DEVICE_LIMITS.decodePixels;
      if(dimensions&&typeof createImageBitmap==='function'){
        const scale=Math.min(1,Math.sqrt(maxDecodedPixels/Math.max(1,dimensions.width*dimensions.height)));
        const options={imageOrientation:'from-image',resizeQuality:'high'};
        if(scale<.999){options.resizeWidth=Math.max(1,Math.round(dimensions.width*scale));options.resizeHeight=Math.max(1,Math.round(dimensions.height*scale));}
        try{return await createImageBitmap(file,options);}catch(_){/* 某些旧浏览器回退到 Blob URL 解码。 */}
      }
      if(!dimensions||dimensions.width*dimensions.height>maxDecodedPixels)throw new Error('safe-decode');
      const url=URL.createObjectURL(file);
      try{
        return await new Promise((resolve,reject)=>{
          const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('decode'));img.src=url;
        });
      }finally{URL.revokeObjectURL(url);}
    }

    async function loadImageFile(file) {
      const allowedTypes=new Set(['image/png','image/jpeg','image/jpg','image/webp','image/gif']);
      if (!file || !allowedTypes.has(String(file.type).toLowerCase())) {
        toast('toast.invalidImage', 'error');
        return;
      }
      if (file.size > 24 * 1024 * 1024) {
        toast('toast.imageTooLarge', 'error');
        return;
      }
      if(state.dirty&&state.grid.some(value=>value>=0)&&!window.confirm(t('confirm.replaceImage'))){els.imageInput.value='';return;}
      const loadJob=++state.sourceLoadJob;
      invalidateConversion();
      setConversionModal(false,{restoreFocus:false});
      setStatus('status.readingImage');
      try {
        const dimensions=await readImageDimensions(file);
        if(loadJob!==state.sourceLoadJob)return;
        if(!dimensions||!dimensions.width||!dimensions.height)throw new Error('header');
        if(dimensions&&dimensions.width*dimensions.height>60000000)throw new Error('pixels');
        const image=await decodeImageFile(file,dimensions);
        if(loadJob!==state.sourceLoadJob){image.close?.();return;}
        const decodedWidth=image.naturalWidth||image.width,decodedHeight=image.naturalHeight||image.height;
        const oriented=orientedSourceDimensions(dimensions,{width:decodedWidth,height:decodedHeight});
        const sourceWidth=oriented.width,sourceHeight=oriented.height;
        if(sourceWidth*sourceHeight>60000000){image.close?.();throw new Error('pixels');}
        state.referenceImage?.close?.();
        state.referenceImage = image;
        state.referenceFileName = file.name;
        state.referenceFileSize = file.size;
        state.referenceSourceWidth = sourceWidth;
        state.referenceSourceHeight = sourceHeight;
        state.referenceTransforms = [];
        state.crop = {x:0,y:0,w:1,h:1};
        state.cropDraft = {x:0,y:0,w:1,h:1};
        state.autoTrimApplied = false;
        state.autoTrimFraction = 0;
        state.cropPreview = null;
        state.cropPreviewBase = null;
        state.aspectLock = true;
        els.aspectLock.checked = true;
        const initialAnalysis=analyzeReferenceImage(image,sourceWidth,sourceHeight,state.crop);
        if(initialAnalysis.autoCrop&&initialAnalysis.confidence>=.72){
          state.crop={...initialAnalysis.autoCrop};state.cropDraft={...state.crop};state.autoTrimApplied=true;state.autoTrimFraction=initialAnalysis.trimFraction;
          state.sourceAnalysis={...analyzeReferenceImage(image,sourceWidth,sourceHeight,state.crop),autoTrimApplied:true};
        }else state.sourceAnalysis=initialAnalysis;
        applySmartSettings(currentSmartSettings(),{resetGrid:true,resetHistoryNow:true});
        state.referenceRaster = renderReferenceRaster();
        els.fileMeta.hidden = false;
        els.fileName.textContent = file.name;
        els.fileDetails.textContent = t('file.details',{width:sourceWidth,height:sourceHeight,size:(file.size/1024/1024).toFixed(2),suffix:state.autoTrimApplied?t('file.trimmed'):''});
        els.projectTitle.textContent = file.name.replace(/\.[^.]+$/, '') || t('project.untitled');
        setProjectSubtitle('project.imageLocal',{width:sourceWidth,height:sourceHeight});
        els.convertBtn.disabled = false;
        els.emptyState.hidden = true;
        updateDetailAdvice();updateSmartCard();
        drawReference();
        await convertImage();
      } catch (error) {
        if(loadJob!==state.sourceLoadJob)return;
        const messageKey = error.message === 'pixels'
          ? 'toast.imagePixelsTooLarge'
          : error.message === 'safe-decode'
            ? 'toast.safeDecodeFailed'
            : 'toast.imageDamaged';
        toast(messageKey, 'error');
        setStatus('status.imageReadFailed');
      } finally {els.imageInput.value='';}
    }

    async function loadSampleImage() {
      try {
        setStatus('status.loadingSample');
        const response=await fetch(SAMPLE_IMAGE_URL);
        if(!response.ok)throw new Error('sample-fetch');
        const blob=await response.blob();
        await loadImageFile(new File([blob],'rocket-badge.png',{type:blob.type||'image/png'}));
      }catch(error){
        if(error?.message!=='sample-fetch'&&state.referenceFileName==='rocket-badge.png')return;
        toast('toast.sampleFailed','error');setStatus('status.sampleFailed');
      }
    }

    function convertPixels(payload) {
      const {
        data,width,height,cols,rows,palette,maxColors,whiteMode,
        processMode='cartoon',mergeStrength=10,protectDark=true
      } = payload;
      const grid=new Int16Array(cols*rows);grid.fill(-1);
      if(!data||!width||!height||!cols||!rows||!palette||!palette.length){
        return {buffer:grid.buffer,selected:[],nonEmpty:0,diagnostics:{usedBeforeMerge:0,backgroundPixels:0}};
      }

      const clamp01=value=>Math.max(0,Math.min(1,value));
      const srgbLinear=value=>{const c=value/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);};
      const linearSrgb=value=>{value=clamp01(value);return 255*(value<=.0031308?12.92*value:1.055*Math.pow(value,1/2.4)-.055);};
      const rgbLab=(r,g,b)=>{
        r=srgbLinear(r);g=srgbLinear(g);b=srgbLinear(b);
        const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
        const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
        const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
        return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
      };
      const labDistance=(a,b)=>{const dl=a[0]-b[0],da=a[1]-b[1],db=a[2]-b[2];return Math.sqrt(dl*dl+da*da+db*db);};
      const rgbCieLab=(r,g,b)=>{
        r=srgbLinear(r);g=srgbLinear(g);b=srgbLinear(b);
        const x=(.4124564*r+.3575761*g+.1804375*b)/.95047,y=.2126729*r+.7151522*g+.072175*b,z=(.0193339*r+.119192*g+.9503041*b)/1.08883;
        const f=value=>value>216/24389?Math.cbrt(value):(24389/27*value+16)/116,fx=f(x),fy=f(y),fz=f(z);
        return [116*fy-16,500*(fx-fy),200*(fy-fz)];
      };
      const cieDelta=(first,second)=>{
        const l1=first[0],a1=first[1],b1=first[2],l2=second[0],a2=second[1],b2=second[2],rad=Math.PI/180,deg=180/Math.PI;
        const c1=Math.hypot(a1,b1),c2=Math.hypot(a2,b2),cBar=(c1+c2)/2,cBar7=Math.pow(cBar,7),g=.5*(1-Math.sqrt(cBar7/(cBar7+Math.pow(25,7))));
        const a1p=(1+g)*a1,a2p=(1+g)*a2,c1p=Math.hypot(a1p,b1),c2p=Math.hypot(a2p,b2);
        const hue=(b,a)=>{const value=Math.atan2(b,a)*deg;return value<0?value+360:value;},h1p=hue(b1,a1p),h2p=hue(b2,a2p);
        const dLp=l2-l1,dCp=c2p-c1p;let dhp=0;
        if(c1p*c2p!==0){dhp=h2p-h1p;if(dhp>180)dhp-=360;else if(dhp<-180)dhp+=360;}
        const dHp=2*Math.sqrt(c1p*c2p)*Math.sin(dhp*rad/2),lBar=(l1+l2)/2,cBarp=(c1p+c2p)/2;let hBar=h1p+h2p;
        if(c1p*c2p!==0)hBar=Math.abs(h1p-h2p)<=180?(h1p+h2p)/2:(h1p+h2p<360?(h1p+h2p+360)/2:(h1p+h2p-360)/2);
        const t=1-.17*Math.cos((hBar-30)*rad)+.24*Math.cos(2*hBar*rad)+.32*Math.cos((3*hBar+6)*rad)-.20*Math.cos((4*hBar-63)*rad);
        const deltaTheta=30*Math.exp(-1*Math.pow((hBar-275)/25,2)),cBarp7=Math.pow(cBarp,7),rc=2*Math.sqrt(cBarp7/(cBarp7+Math.pow(25,7)));
        const sl=1+.015*Math.pow(lBar-50,2)/Math.sqrt(20+Math.pow(lBar-50,2)),sc=1+.045*cBarp,sh=1+.015*cBarp*t,rt=-Math.sin(2*deltaTheta*rad)*rc;
        const dl=dLp/sl,dc=dCp/sc,dh=dHp/sh;return Math.sqrt(Math.max(0,dl*dl+dc*dc+dh*dh+rt*dc*dh));
      };
      const pixelCount=width*height;
      const luminance=new Uint8Array(pixelCount);
      for(let i=0;i<pixelCount;i++){
        const p=i*4,a=data[p+3]/255;
        const r=data[p]*a+255*(1-a),g=data[p+1]*a+255*(1-a),b=data[p+2]*a+255*(1-a);
        luminance[i]=Math.round(.2126*r+.7152*g+.0722*b);
      }

      // 在源图像素级只移除“与边界连通”的浅色背景；轮廓包围的白色仍是白豆。
      const background=new Uint8Array(pixelCount);
      let backgroundPixels=0,edgeArtifactPixels=0;
      if(whiteMode==='auto'){
        const border=[];
        const addBorder=(x,y)=>{
          const i=y*width+x,p=i*4,a=data[p+3];
          if(a<24){border.push([255,255,255,0]);return;}
          border.push([data[p],data[p+1],data[p+2],a]);
        };
        for(let x=0;x<width;x++){addBorder(x,0);if(height>1)addBorder(x,height-1);}
        for(let y=1;y+1<height;y++){addBorder(0,y);if(width>1)addBorder(width-1,y);}
        const lightBorder=border.filter(c=>c[3]<24||(.2126*c[0]+.7152*c[1]+.0722*c[2]>175&&Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2])<55));
        if(lightBorder.length>=Math.max(8,border.length*.45)){
          const median=channel=>{
            const values=lightBorder.map(c=>c[channel]).sort((a,b)=>a-b);
            return values[Math.floor(values.length/2)];
          };
          const br=median(0),bg=median(1),bb=median(2),baseLum=.2126*br+.7152*bg+.0722*bb;
          let similar=0;
          for(const c of border){
            if(c[3]<24){similar++;continue;}
            const dr=c[0]-br,dg=c[1]-bg,db=c[2]-bb;
            if(dr*dr+dg*dg+db*db<=58*58)similar++;
          }
          if(baseLum>185&&Math.max(br,bg,bb)-Math.min(br,bg,bb)<48&&similar/border.length>=.55){
            const queue=new Int32Array(pixelCount);
            let head=0,tail=0;
            const isCandidate=i=>{
              const p=i*4,a=data[p+3];
              if(a<24)return true;
              const r=data[p],g=data[p+1],b=data[p+2],dr=r-br,dg=g-bg,db=b-bb;
              const chroma=Math.max(r,g,b)-Math.min(r,g,b);
              return dr*dr+dg*dg+db*db<=58*58&&luminance[i]>=Math.max(170,baseLum-64)&&chroma<58;
            };
            const enqueue=i=>{if(i>=0&&i<pixelCount&&!background[i]&&isCandidate(i)){background[i]=1;queue[tail++]=i;}};
            for(let x=0;x<width;x++){enqueue(x);enqueue((height-1)*width+x);}
            for(let y=0;y<height;y++){enqueue(y*width);enqueue(y*width+width-1);}
            while(head<tail){
              const i=queue[head++],x=i%width,y=Math.floor(i/width);
              if(x>0)enqueue(i-1);if(x+1<width)enqueue(i+1);if(y>0)enqueue(i-width);if(y+1<height)enqueue(i+width);
            }
            backgroundPixels=tail;
          }
        }

        // 某些 JPG/截图会在最外侧带一条与主体无关的 1px 灰色扫描线。
        // 仅当该边几乎完全同色、相邻两条内侧边又几乎全白时才忽略，避免粗暴删除真实轮廓。
        const edgeProfile=(axis,position)=>{
          const length=axis==='row'?width:height,values=[];
          let nearWhite=0,neutral=0;
          for(let n=0;n<length;n++){
            const x=axis==='row'?n:position,y=axis==='row'?position:n,i=y*width+x,p=i*4;
            const r=data[p],g=data[p+1],b=data[p+2],a=data[p+3],lum=luminance[i],chroma=Math.max(r,g,b)-Math.min(r,g,b);
            if(a<24){values.push(255);nearWhite++;neutral++;continue;}
            values.push(lum);if(lum>=240&&chroma<=12)nearWhite++;if(chroma<=12)neutral++;
          }
          values.sort((a,b)=>a-b);const median=values[Math.floor(values.length/2)];
          let uniform=0;for(const value of values)if(Math.abs(value-median)<=7)uniform++;
          return {median,uniform:uniform/Math.max(1,length),nearWhite:nearWhite/Math.max(1,length),neutral:neutral/Math.max(1,length)};
        };
        const inkSamples=[];
        for(let i=0;i<pixelCount;i++){
          const p=i*4,r=data[p],g=data[p+1],b=data[p+2],chroma=Math.max(r,g,b)-Math.min(r,g,b);
          if(data[p+3]>=32&&luminance[i]<=80&&chroma<=12)inkSamples.push(luminance[i]);
        }
        inkSamples.sort((a,b)=>a-b);
        const inkP90=inkSamples.length>=64?inkSamples[Math.min(inkSamples.length-1,Math.floor(inkSamples.length*.90))]:null;
        const markEdge=(axis,edgePosition,innerA,innerB)=>{
          const edge=edgeProfile(axis,edgePosition),a=edgeProfile(axis,innerA),b=edgeProfile(axis,innerB);
          if(inkP90===null||edge.uniform<.98||edge.neutral<.98||edge.median<80||edge.median>220||a.nearWhite<.98||b.nearWhite<.98||a.median-edge.median<64||edge.median-inkP90<24)return;
          const length=axis==='row'?width:height;
          for(let n=0;n<length;n++){
            const x=axis==='row'?n:edgePosition,y=axis==='row'?edgePosition:n,i=y*width+x;
            if(!background[i]){background[i]=1;backgroundPixels++;edgeArtifactPixels++;}
          }
        };
        if(height>=4){markEdge('row',0,1,2);markEdge('row',height-1,height-2,height-3);}
        if(width>=4){markEdge('col',0,1,2);markEdge('col',width-1,width-2,width-3);}
      }

      // 用中性像素的 Otsu 阈值估计“轮廓暗色”，避免为每张图写死一个黑色阈值。
      const histogram=new Uint32Array(256);
      let histogramTotal=0;
      for(let i=0;i<pixelCount;i++){
        const p=i*4;if(data[p+3]<32||background[i])continue;
        const chroma=Math.max(data[p],data[p+1],data[p+2])-Math.min(data[p],data[p+1],data[p+2]);
        if(chroma<50){histogram[luminance[i]]++;histogramTotal++;}
      }
      let darkThreshold=72;
      if(histogramTotal){
        let sum=0;for(let i=0;i<256;i++)sum+=i*histogram[i];
        let leftWeight=0,leftSum=0,maxVariance=-1,threshold=72;
        for(let i=0;i<255;i++){
          leftWeight+=histogram[i];if(!leftWeight)continue;
          const rightWeight=histogramTotal-leftWeight;if(!rightWeight)break;
          leftSum+=i*histogram[i];
          const leftMean=leftSum/leftWeight,rightMean=(sum-leftSum)/rightWeight;
          const variance=leftWeight*rightWeight*(leftMean-rightMean)*(leftMean-rightMean);
          if(variance>maxVariance){maxVariance=variance;threshold=i;}
        }
        darkThreshold=Math.max(54,Math.min(148,threshold+14));
      }
      // 抗锯齿灰边不等于黑色轮廓；上限可防止浅灰被整格放大为粗黑边。
      const outlineCutoff=Math.min(darkThreshold,70);

      const visiblyChromaticRgb=(r,g,b)=>{
        const maximum=Math.max(r,g,b),spread=maximum-Math.min(r,g,b);
        return spread>=16&&spread/Math.max(1,maximum)>=.24;
      };
      // 摄影里的黑色常被白平衡和 JPEG 压缩染成轻微蓝灰；比色板分类采用更严格的“可见色相”门槛。
      // 极深的蓝黑/深咖仍保留自身色相，避免把真实深色全部压成黑色。
      const darkPixelIsChromatic=(r,g,b,lightness)=>{
        const maximum=Math.max(r,g,b),spread=maximum-Math.min(r,g,b),relative=spread/Math.max(1,maximum);
        return visiblyChromaticRgb(r,g,b)&&(lightness<.30||(spread>=24&&relative>=.36));
      };
      const entryByIndex=new Map(palette.map(entry=>[entry.index,entry]));
      const palettePositionByIndex=new Map(palette.map((entry,position)=>[entry.index,position]));
      const exactPalettePosition=new Map();
      palette.forEach((entry,position)=>{if(entry.rgb)exactPalettePosition.set((entry.rgb[0]<<16)|(entry.rgb[1]<<8)|entry.rgb[2],position);});
      const paletteChromatic=palette.map(entry=>{
        if(entry.rgb)return visiblyChromaticRgb(entry.rgb[0],entry.rgb[1],entry.rgb[2]);
        return Math.hypot(entry.lab?.[1]||0,entry.lab?.[2]||0)>=.04;
      });
      let outlinePalettePosition=paletteChromatic.findIndex(value=>!value);
      if(outlinePalettePosition<0)outlinePalettePosition=0;
      for(let i=0;i<palette.length;i++)if(!paletteChromatic[i]&&palette[i].lab[0]<palette[outlinePalettePosition].lab[0])outlinePalettePosition=i;
      let whitePalettePosition=palette.findIndex(entry=>entry.code==='H2');
      if(whitePalettePosition<0){
        whitePalettePosition=paletteChromatic.findIndex(value=>!value);
        if(whitePalettePosition<0)whitePalettePosition=0;
        for(let i=0;i<palette.length;i++)if(!paletteChromatic[i]&&palette[i].lab[0]>palette[whitePalettePosition].lab[0])whitePalettePosition=i;
      }

      // 高白底、低彩度、同时含明确深色墨线的图片按黑白线稿处理。
      // 这会把 JPEG 抗锯齿灰边稳定归入黑或白，而不会误伤含真实颜色的卡通图。
      let usablePixels=0,chromaticPixels=0,brightNeutralPixels=0,darkNeutralPixels=0;
      for(let i=0;i<pixelCount;i++){
        const p=i*4,a=data[p+3];if(a<32||background[i])continue;
        const r=data[p],g=data[p+1],b=data[p+2],maximum=Math.max(r,g,b),chroma=maximum-Math.min(r,g,b),relative=chroma/Math.max(1,maximum),lum=luminance[i];
        usablePixels++;
        if(chroma>=18&&relative>=.15)chromaticPixels++;
        if(chroma<=18&&lum>=225)brightNeutralPixels++;
        if(chroma<=22&&lum<=175)darkNeutralPixels++;
      }
      const monochromeLineArt=processMode==='cartoon'&&usablePixels>0&&chromaticPixels/usablePixels<=.012&&brightNeutralPixels/usablePixels>=.45&&darkNeutralPixels/usablePixels>=.015;
      const smallLineArtRefinement=monochromeLineArt&&Math.max(cols,rows)<=60;
      // 以自适应暗阈值作为规范墨线边界；过低的固定124会让不同缩放产生的
      // 抗锯齿像素时而进入、时而退出轮廓，导致同图换像素分辨率后豆格漂移。
      const lineRasterCutoff=Math.min(156,Math.max(100,darkThreshold));
      let lineSkeletonCells=null;
      const lineCoreCoverage=smallLineArtRefinement?new Float32Array(cols*rows):null;
      const lineSoftCoverage=smallLineArtRefinement?new Float32Array(cols*rows):null;
      const lineInteriorWhiteCoverage=smallLineArtRefinement?new Float32Array(cols*rows):null;
      const lineBackgroundCoverage=smallLineArtRefinement?new Float32Array(cols*rows):null;
      let lineOwnerCells=null,lineOwnerAreas=null,lineOwnerCandidates=null,lineSourceComponents=0,lineSeparatedConflicts=0,lineUnresolvedConflicts=0,lineUnrepresentableComponents=0,lineForcedCandidatePlacements=0;
      if(smallLineArtRefinement){
        // 先在“每颗豆 4×4”的中间栅格上提取墨线中心，再压回目标格。
        // 这比直接放大深色权重更稳：曲线保持 8 邻接连续，实心眼睛等区域仍由面积覆盖保留，
        // 同时不会把抗锯齿的整圈灰边膨胀成第二层豆子。
        // 中间栅格长边至少约 192 像素；否则 16/24 格时先在过小栅格上
        // 合并了独立部件，后续再精修也无法恢复。最大仍约 240，内存和耗时可控。
        const supersample=Math.max(4,Math.ceil(192/Math.max(cols,rows))),microWidth=cols*supersample,microHeight=rows*supersample,microCount=microWidth*microHeight;
        // owner 在源像素层建立，而不是在已经缩小的 micro 栅格上猜测；因此鼻点、眉毛等
        // 小部件不会在 16/24 格的预处理阶段提前消失或与主体合并。
        const sourceOwners=new Int32Array(pixelCount),sourceQueue=new Int32Array(pixelCount),ownerAreaList=[0];
        for(let start=0;start<pixelCount;start++){
          if(sourceOwners[start]||background[start]||data[start*4+3]<32)continue;
          const p=start*4,chroma=Math.max(data[p],data[p+1],data[p+2])-Math.min(data[p],data[p+1],data[p+2]);
          if(chroma>22||luminance[start]>lineRasterCutoff)continue;
          const owner=++lineSourceComponents;let head=0,tail=0,area=0;sourceOwners[start]=owner;sourceQueue[tail++]=start;
          while(head<tail){
            const current=sourceQueue[head++],x=current%width,y=Math.floor(current/width);area++;
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
              const next=ny*width+nx;if(sourceOwners[next]||background[next]||data[next*4+3]<32)continue;
              const np=next*4,nextChroma=Math.max(data[np],data[np+1],data[np+2])-Math.min(data[np],data[np+1],data[np+2]);
              if(nextChroma<=22&&luminance[next]<=lineRasterCutoff){sourceOwners[next]=owner;sourceQueue[tail++]=next;}
            }
          }
          ownerAreaList[owner]=area;
        }
        lineOwnerAreas=Int32Array.from(ownerAreaList);
        const microTotal=new Float32Array(microCount),microInk=new Float32Array(microCount),microOwners=new Int32Array(microCount),microOwnerVotes=new Float32Array(microCount),microConflicts=new Map();
        // 用源像素与 micro 单元的分数面积交集归一化，而不是把像素中心扔进某一格。
        // 同一图只是换成 0.5×/2× 像素分辨率时，覆盖率因此保持一致。
        for(let my=0;my<microHeight;my++)for(let mx=0;mx<microWidth;mx++){
          const micro=my*microWidth+mx,sx0=mx*width/microWidth,sx1=(mx+1)*width/microWidth,sy0=my*height/microHeight,sy1=(my+1)*height/microHeight;
          microTotal[micro]=(sx1-sx0)*(sy1-sy0);
          for(let y=Math.floor(sy0);y<Math.ceil(sy1);y++)for(let x=Math.floor(sx0);x<Math.ceil(sx1);x++){
            if(x<0||y<0||x>=width||y>=height)continue;
            const area=Math.max(0,Math.min(x+1,sx1)-Math.max(x,sx0))*Math.max(0,Math.min(y+1,sy1)-Math.max(y,sy0));if(area<=0)continue;
            const owner=sourceOwners[y*width+x];if(!owner)continue;microInk[micro]+=area;
            const conflict=microConflicts.get(micro);
            if(conflict)conflict.set(owner,(conflict.get(owner)||0)+area);
            else if(!microOwners[micro]||microOwners[micro]===owner){microOwners[micro]=owner;microOwnerVotes[micro]+=area;}
            else microConflicts.set(micro,new Map([[microOwners[micro],microOwnerVotes[micro]],[owner,area]]));
          }
        }
        for(const [micro,votes] of microConflicts){
          let bestOwner=0,bestVotes=-1;for(const [owner,vote] of votes)if(vote>bestVotes||(vote===bestVotes&&(lineOwnerAreas[owner]||0)>(lineOwnerAreas[bestOwner]||0))){bestOwner=owner;bestVotes=vote;}
          microOwners[micro]=bestOwner;
        }
        const thinned=new Uint8Array(microCount);
        for(let i=0;i<microCount;i++)if(microTotal[i]&&microInk[i]/microTotal[i]>=.08)thinned[i]=1;
        const pending=new Uint8Array(microCount),neighbors=new Uint8Array(8);
        let changed=true,rounds=0;
        while(changed&&rounds++<64){
          changed=false;
          for(let phase=0;phase<2;phase++){
            pending.fill(0);
            for(let y=1;y+1<microHeight;y++)for(let x=1;x+1<microWidth;x++){
              const i=y*microWidth+x;if(!thinned[i])continue;
              neighbors[0]=thinned[i-microWidth];neighbors[1]=thinned[i-microWidth+1];neighbors[2]=thinned[i+1];neighbors[3]=thinned[i+microWidth+1];
              neighbors[4]=thinned[i+microWidth];neighbors[5]=thinned[i+microWidth-1];neighbors[6]=thinned[i-1];neighbors[7]=thinned[i-microWidth-1];
              let count=0,transitions=0;for(let n=0;n<8;n++){count+=neighbors[n];if(!neighbors[n]&&neighbors[(n+1)%8])transitions++;}
              if(count<2||count>6||transitions!==1)continue;
              const first=phase===0?neighbors[0]*neighbors[2]*neighbors[4]:neighbors[0]*neighbors[2]*neighbors[6];
              const second=phase===0?neighbors[2]*neighbors[4]*neighbors[6]:neighbors[0]*neighbors[4]*neighbors[6];
              if(!first&&!second)pending[i]=1;
            }
            for(let i=0;i<microCount;i++)if(pending[i]){thinned[i]=0;changed=true;}
          }
        }
        lineSkeletonCells=new Uint8Array(cols*rows);lineOwnerCells=new Int32Array(cols*rows);
        lineOwnerCandidates=Array.from({length:lineSourceComponents+1},()=>[]);
        const targetCellArea=Math.max(.001,(width/cols)*(height/rows));
        for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
          const cell=gy*cols+gx,skeletonVotes=new Map(),inkVotes=new Map();
          for(let my=gy*supersample;my<(gy+1)*supersample;my++)for(let mx=gx*supersample;mx<(gx+1)*supersample;mx++){
            const micro=my*microWidth+mx,owner=microOwners[micro];if(!owner)continue;
            const splitVotes=microConflicts.get(micro);
            if(splitVotes)for(const [candidateOwner,vote] of splitVotes)inkVotes.set(candidateOwner,(inkVotes.get(candidateOwner)||0)+vote);
            else inkVotes.set(owner,(inkVotes.get(owner)||0)+microInk[micro]);
            if(thinned[micro])skeletonVotes.set(owner,(skeletonVotes.get(owner)||0)+1);
          }
          // 为每个源部件保留若干真实覆盖候选，即使它不是该格的多数赢家。
          // 鼻点、嘴点等小部件因此可以在空闲且不碰撞的格位落下一颗豆。
          for(const [owner,vote] of inkVotes){
            const candidates=lineOwnerCandidates[owner],candidate={cell,score:vote/targetCellArea};candidates.push(candidate);
            candidates.sort((a,b)=>b.score-a.score||a.cell-b.cell);if(candidates.length>12)candidates.length=12;
          }
          const votes=skeletonVotes.size?skeletonVotes:inkVotes;let bestOwner=0,bestVotes=-1;
          for(const [owner,vote] of votes)if(vote>bestVotes||(vote===bestVotes&&(lineOwnerAreas[owner]||0)>(lineOwnerAreas[bestOwner]||0))){bestOwner=owner;bestVotes=vote;}
          if(skeletonVotes.size)lineSkeletonCells[cell]=1;
          lineOwnerCells[cell]=bestOwner;
        }
      }
      const fineMatching=processMode==='photo'||processMode==='detail'||processMode==='pixel';
      const nearestCache=fineMatching?new Map():null;
      // 卡通/文档会逐源像素投票。固定 5-bit LUT 将缓存上限锁在 64 Ki 项，
      // 避免高噪声图片产生百万级 Map；精确色号仍在上方直接命中，不受量化影响。
      const coarseCache=fineMatching?null:new Int16Array(65536).fill(-1);
      const nearestPalettePosition=(r,g,b,forceNeutralOverride=false)=>{
        r=Math.max(0,Math.min(255,Math.round(r)));g=Math.max(0,Math.min(255,Math.round(g)));b=Math.max(0,Math.min(255,Math.round(b)));
        const exact=exactPalettePosition.get((r<<16)|(g<<8)|b);
        if(exact!==undefined&&!forceNeutralOverride)return exact;
        // 照片/高清/像素模式最多只在目标豆格上精配 25,600 次；卡通/文档使用固定桶中心。
        const bucketR=fineMatching?r:r>>3,bucketG=fineMatching?g:g>>3,bucketB=fineMatching?b:b>>3;
        const baseKey=fineMatching?((r<<16)|(g<<8)|b):((bucketR<<10)|(bucketG<<5)|bucketB);
        const key=baseKey+(forceNeutralOverride?(fineMatching?16777216:32768):0);
        if(fineMatching&&nearestCache.has(key))return nearestCache.get(key);
        if(!fineMatching&&coarseCache[key]>=0)return coarseCache[key];
        const matchR=fineMatching?r:Math.min(255,bucketR*8+3.5),matchG=fineMatching?g:Math.min(255,bucketG*8+3.5),matchB=fineMatching?b:Math.min(255,bucketB*8+3.5);
        const lab=rgbLab(matchR,matchG,matchB),cieLab=rgbCieLab(matchR,matchG,matchB);
        const forceNeutral=forceNeutralOverride||(protectDark&&lab[0]<.55&&Math.hypot(lab[1],lab[2])<.03&&!darkPixelIsChromatic(matchR,matchG,matchB,lab[0]));
        // 先用 OKLab 从 220 个可用实体色中筛出候选，再用 CIEDE2000 精配。
        // 全量 CIEDE2000 对 4MP 图片代价过高；32 个候选把抽样漏掉全局最近色的概率降到可忽略水平。
        const candidates=[];
        for(let i=0;i<palette.length;i++){
          if(forceNeutral&&paletteChromatic[i])continue;
          const rough=labDistance(lab,palette[i].lab);
          let insertAt=candidates.length;
          while(insertAt>0&&(rough<candidates[insertAt-1].rough-1e-12||(Math.abs(rough-candidates[insertAt-1].rough)<1e-12&&palette[i].index<palette[candidates[insertAt-1].position].index)))insertAt--;
          if(insertAt<32){candidates.splice(insertAt,0,{position:i,rough});if(candidates.length>32)candidates.pop();}
        }
        let choice=candidates[0]?.position??0,distance=Infinity;
        for(const candidate of candidates){
          const i=candidate.position;
          const d=palette[i].cieLab?cieDelta(cieLab,palette[i].cieLab):candidate.rough*100;
          if(d<distance-1e-12||(Math.abs(d-distance)<1e-12&&palette[i].index<palette[choice].index)){distance=d;choice=i;}
        }
        if(fineMatching)nearestCache.set(key,choice);else coarseCache[key]=choice;
        return choice;
      };

      const scores=new Float32Array(palette.length);
      const featureScores=new Float32Array(palette.length);
      const rawScores=new Float32Array(palette.length);
      const cellImportance=new Float32Array(cols*rows);
      const cellSupport=new Float32Array(cols*rows);
      const documentMode=processMode==='document';
      const detailMode=processMode==='detail';
      const detailR=detailMode?new Float32Array(cols*rows):null,detailG=detailMode?new Float32Array(cols*rows):null,detailB=detailMode?new Float32Array(cols*rows):null;
      const detailValid=detailMode?new Uint8Array(cols*rows):null,detailNeutralDark=detailMode?new Uint8Array(cols*rows):null,detailWhite=detailMode?new Uint8Array(cols*rows):null;
      const documentInkThreshold=Math.max(100,Math.min(170,darkThreshold+35));
      const stepX=width/cols,stepY=height/rows;
      for(let gy=0;gy<rows;gy++){
        const sourceY0=gy*stepY,sourceY1=(gy+1)*stepY;
        const y0=Math.max(0,Math.floor(sourceY0)),y1=Math.min(height,Math.max(y0+1,Math.ceil(sourceY1)));
        for(let gx=0;gx<cols;gx++){
          const sourceX0=gx*stepX,sourceX1=(gx+1)*stepX;
          const x0=Math.max(0,Math.floor(sourceX0)),x1=Math.min(width,Math.max(x0+1,Math.ceil(sourceX1)));
          const cell=gy*cols+gx;
          if(processMode==='pixel'){
            const x=Math.min(width-1,Math.max(0,Math.floor((gx+.5)*stepX)));
            const y=Math.min(height-1,Math.max(0,Math.floor((gy+.5)*stepY)));
            const i=y*width+x,p=i*4,a=data[p+3]/255;
            if(a>=.12&&!background[i]){
              const r=Math.round(data[p]*a+255*(1-a)),g=Math.round(data[p+1]*a+255*(1-a)),b=Math.round(data[p+2]*a+255*(1-a));
              const lum=.2126*r+.7152*g+.0722*b,chroma=Math.max(r,g,b)-Math.min(r,g,b);
              grid[cell]=palette[Math.min(r,g,b)>=245&&chroma<=12?whitePalettePosition:nearestPalettePosition(r,g,b)].index;
              cellImportance[cell]=1;
            }
            continue;
          }

          const cellWidth=x1-x0,cellHeight=y1-y0,area=cellWidth*cellHeight;
          // 卡通、文档与高清照片都遍历每个源像素；整张参考栅格已限制在 4MP 内，质量与耗时可控。
          const fullSampling=processMode!=='photo';
          const exhaustiveSampling=fullSampling||area<=196;
          const samplesX=exhaustiveSampling?cellWidth:Math.min(14,cellWidth);
          const samplesY=exhaustiveSampling?cellHeight:Math.min(14,cellHeight);
          let lr=0,lg=0,lb=0,totalWeight=0,darkLr=0,darkLg=0,darkLb=0,darkWeight=0,valid=0,outlineSamples=0,lineCoreSamples=0,lineSoftSamples=0,lineBackgroundSamples=0,nearWhiteSamples=0,neutralDarkSamples=0,maxOutlineGradient=0;
          let documentDark=0,documentNonWhite=0,documentSaturated=0,documentEdges=0,documentTransitions=0;
          let documentTensorA=0,documentTensorB=0,documentTensorTotal=0,documentMaxRowRun=0,documentMaxColRun=0;
          let documentColorLr=0,documentColorLg=0,documentColorLb=0,documentColorWeight=0;
          const documentColRuns=documentMode?new Uint16Array(samplesX):null;
          const documentPreviousRow=documentMode?new Uint8Array(samplesX):null;
          const outlineRowHits=new Uint8Array(samplesY),outlineColHits=new Uint8Array(samplesX);
          scores.fill(0);featureScores.fill(0);rawScores.fill(0);
          for(let syi=0;syi<samplesY;syi++){
            const y=exhaustiveSampling?y0+syi:Math.min(y1-1,Math.floor(y0+(syi+.5)*cellHeight/samplesY));
            let documentRowRun=0,documentPreviousDark=0;
            for(let sxi=0;sxi<samplesX;sxi++){
              const x=exhaustiveSampling?x0+sxi:Math.min(x1-1,Math.floor(x0+(sxi+.5)*cellWidth/samplesX));
              const i=y*width+x,p=i*4,a=data[p+3]/255;
              const sampleArea=exhaustiveSampling
                ? Math.max(0,Math.min(x+1,sourceX1)-Math.max(x,sourceX0))*Math.max(0,Math.min(y+1,sourceY1)-Math.max(y,sourceY0))
                : 1;
              if(sampleArea<=0)continue;
              if(a<.12){
                if(documentMode){documentRowRun=0;documentColRuns[sxi]=0;documentPreviousRow[sxi]=0;documentPreviousDark=0;}
                continue;
              }
              if(background[i]&&!documentMode){if(smallLineArtRefinement)lineBackgroundSamples+=sampleArea;continue;}
              const r=Math.round(data[p]*a+255*(1-a)),g=Math.round(data[p+1]*a+255*(1-a)),b=Math.round(data[p+2]*a+255*(1-a));
              valid+=sampleArea;
              const lum=luminance[i],max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min,saturation=max?chroma/max:0;
              if(min>=245&&chroma<=12)nearWhiteSamples+=sampleArea;
              if(lum<=outlineCutoff&&chroma<=18)neutralDarkSamples+=sampleArea;
              if(smallLineArtRefinement&&chroma<=22){if(lum<=lineRasterCutoff)lineCoreSamples+=sampleArea;if(lum<=180)lineSoftSamples+=sampleArea;}
              if(processMode==='photo'||detailMode){
                const rLinear=srgbLinear(r),gLinear=srgbLinear(g),bLinear=srgbLinear(b);
                const weight=a*sampleArea;
                lr+=rLinear*weight;lg+=gLinear*weight;lb+=bLinear*weight;totalWeight+=weight;
                if(detailMode&&lum<=105){darkLr+=rLinear*weight;darkLg+=gLinear*weight;darkLb+=bLinear*weight;darkWeight+=weight;}
                continue;
              }
              const left=luminance[y*width+Math.max(0,x-1)],right=luminance[y*width+Math.min(width-1,x+1)];
              const up=luminance[Math.max(0,y-1)*width+x],down=luminance[Math.min(height-1,y+1)*width+x];
              const gradient=(Math.abs(right-left)+Math.abs(down-up))*.5;
              if(documentMode){
                const weight=a*sampleArea;
                lr+=srgbLinear(r)*weight;lg+=srgbLinear(g)*weight;lb+=srgbLinear(b)*weight;totalWeight+=weight;
                const dark=lum<=documentInkThreshold?1:0;
                const nonWhite=lum<232||chroma>28;
                if(dark)documentDark+=sampleArea;
                if(nonWhite){
                  documentNonWhite+=sampleArea;
                  documentColorLr+=srgbLinear(r)*weight;documentColorLg+=srgbLinear(g)*weight;documentColorLb+=srgbLinear(b)*weight;documentColorWeight+=weight;
                  const mapped=nearestPalettePosition(r,g,b);scores[mapped]+=weight;
                  if(visiblyChromaticRgb(r,g,b)){documentSaturated+=sampleArea;rawScores[mapped]+=weight;}
                }
                documentRowRun=dark?documentRowRun+1:0;
                documentColRuns[sxi]=dark?documentColRuns[sxi]+1:0;
                documentMaxRowRun=Math.max(documentMaxRowRun,documentRowRun);
                documentMaxColRun=Math.max(documentMaxColRun,documentColRuns[sxi]);
                if(sxi>0&&dark!==documentPreviousDark)documentTransitions+=sampleArea;
                if(syi>0&&dark!==documentPreviousRow[sxi])documentTransitions+=sampleArea;
                documentPreviousDark=dark;documentPreviousRow[sxi]=dark;
                const gx=right-left,gy=down-up,energy=gx*gx+gy*gy;
                if(Math.abs(gx)+Math.abs(gy)>58)documentEdges+=sampleArea;
                documentTensorA+=(gx*gx-gy*gy)*sampleArea;documentTensorB+=2*gx*gy*sampleArea;documentTensorTotal+=energy*sampleArea;
                continue;
              }
              const pixelIsChromatic=visiblyChromaticRgb(r,g,b);
              const exactChoice=exactPalettePosition.get((r<<16)|(g<<8)|b);
              const isOutline=exactChoice===outlinePalettePosition||(exactChoice===undefined&&!pixelIsChromatic&&lum<=outlineCutoff);
              const choice=isOutline?outlinePalettePosition:exactChoice!==undefined?exactChoice:(monochromeLineArt&&!pixelIsChromatic?whitePalettePosition:nearestPalettePosition(r,g,b));
              let factor=1;
              if(isOutline){factor=1.66+Math.min(1.15,gradient/105);outlineSamples+=sampleArea;outlineRowHits[syi]=1;outlineColHits[sxi]=1;maxOutlineGradient=Math.max(maxOutlineGradient,gradient);}
              else if(saturation>.25)factor=1.45+1.25*saturation+Math.min(.7,gradient/180);
              else if(lum>220)factor=.92;
              const weight=a*factor*sampleArea;
              scores[choice]+=weight;
              rawScores[choice]+=a*sampleArea;
              featureScores[choice]+=a*sampleArea*Math.max(0,factor-1);
            }
          }
          if(!valid)continue;
          const sampleCapacity=exhaustiveSampling?stepX*stepY:samplesX*samplesY;
          if(smallLineArtRefinement){lineCoreCoverage[cell]=lineCoreSamples/Math.max(.001,sampleCapacity);lineSoftCoverage[cell]=lineSoftSamples/Math.max(.001,sampleCapacity);lineInteriorWhiteCoverage[cell]=nearWhiteSamples/Math.max(.001,sampleCapacity);lineBackgroundCoverage[cell]=lineBackgroundSamples/Math.max(.001,sampleCapacity);}
          if(processMode==='cartoon'&&valid/Math.max(.001,sampleCapacity)<.1)continue;
          const highConfidenceWhite=nearWhiteSamples/valid>=.82&&neutralDarkSamples/valid<.05;
          if(documentMode){
            const darkCoverage=documentDark/valid,nonWhiteCoverage=documentNonWhite/valid,saturatedCoverage=documentSaturated/valid;
            const edgeDensity=documentEdges/valid;
            const coherence=documentTensorTotal>0?Math.hypot(documentTensorA,documentTensorB)/documentTensorTotal:0;
            const transitionDensity=documentTransitions/Math.max(1,valid*2);
            const longRun=Math.max(documentMaxRowRun/Math.max(1,samplesX),documentMaxColRun/Math.max(1,samplesY));
            const continuousRule=darkCoverage>=.015&&longRun>=.68;
            const coherentEdge=darkCoverage>=.04&&edgeDensity>=.08&&coherence>=.55;
            const solidInk=darkCoverage>=.32;
            const textTexture=transitionDensity>=.18&&longRun<.58&&coherence<.50;
            let dominantColor=-1,dominantScore=0,dominantSaturated=-1,dominantSaturatedScore=0;
            for(let i=0;i<scores.length;i++){
              if(scores[i]>dominantScore){dominantScore=scores[i];dominantColor=i;}
              if(rawScores[i]>dominantSaturatedScore){dominantSaturatedScore=rawScores[i];dominantSaturated=i;}
            }
            const dominantSupport=dominantScore/Math.max(1,documentNonWhite);
            const solidColor=saturatedCoverage>=.18&&dominantSupport>=.42;
            const solidFill=nonWhiteCoverage>=.38;
            let choice=-1,confidence=0;
            if(!(textTexture&&!continuousRule&&!solidColor&&!solidFill)){
              if(continuousRule||coherentEdge||solidInk){
                const coloredStructure=documentSaturated/Math.max(1,documentNonWhite)>.52&&dominantSaturated>=0;
                choice=coloredStructure?dominantSaturated:outlinePalettePosition;
                confidence=Math.max(darkCoverage,longRun,coherence);
              }else if(solidColor&&dominantSaturated>=0){
                choice=dominantSaturated;confidence=Math.max(saturatedCoverage,dominantSupport);
              }else if(solidFill&&documentColorWeight>.02){
                const r=Math.round(linearSrgb(documentColorLr/documentColorWeight));
                const g=Math.round(linearSrgb(documentColorLg/documentColorWeight));
                const b=Math.round(linearSrgb(documentColorLb/documentColorWeight));
                choice=nearestPalettePosition(r,g,b);confidence=nonWhiteCoverage;
              }else if(whiteMode==='keep'&&totalWeight>.02){
                const r=Math.round(linearSrgb(lr/totalWeight)),g=Math.round(linearSrgb(lg/totalWeight)),b=Math.round(linearSrgb(lb/totalWeight));
                choice=nearestPalettePosition(r,g,b);confidence=.25;
              }
            }
            if(choice>=0){
              grid[cell]=palette[choice].index;
              cellSupport[cell]=confidence;
              cellImportance[cell]=1+Math.min(4,confidence*3+(continuousRule||coherentEdge?1:0));
            }
          }else if(processMode==='photo'||detailMode){
            if(totalWeight<.02)continue;
            let meanR=lr/totalWeight,meanG=lg/totalWeight,meanB=lb/totalWeight;
            if(detailMode&&darkWeight/totalWeight>=.24){
              const darkR=darkLr/darkWeight,darkG=darkLg/darkWeight,darkB=darkLb/darkWeight;
              const meanLum=.2126*linearSrgb(meanR)+.7152*linearSrgb(meanG)+.0722*linearSrgb(meanB);
              const darkLum=.2126*linearSrgb(darkR)+.7152*linearSrgb(darkG)+.0722*linearSrgb(darkB);
              if(meanLum-darkLum>=18){
                const strength=Math.min(.55,.18+(darkWeight/totalWeight-.24)*.9);
                meanR=meanR*(1-strength)+darkR*strength;meanG=meanG*(1-strength)+darkG*strength;meanB=meanB*(1-strength)+darkB*strength;
              }
            }
            const r=Math.round(linearSrgb(meanR)),g=Math.round(linearSrgb(meanG)),b=Math.round(linearSrgb(meanB));
            if(detailMode){
              detailR[cell]=r;detailG[cell]=g;detailB[cell]=b;detailValid[cell]=1;
              detailWhite[cell]=highConfidenceWhite?1:0;
              const meanLab=rgbLab(r,g,b);
              detailNeutralDark[cell]=protectDark&&meanLab[0]<.55&&Math.hypot(meanLab[1],meanLab[2])<.03&&!darkPixelIsChromatic(r,g,b,meanLab[0])?1:0;
            }
            else grid[cell]=palette[highConfidenceWhite?whitePalettePosition:nearestPalettePosition(r,g,b)].index;
            cellImportance[cell]=1;
          }else{
            let choice=0,best=-1;
            for(let i=0;i<scores.length;i++)if(scores[i]>best+1e-7||(Math.abs(scores[i]-best)<1e-7&&palette[i].index<palette[choice].index)){best=scores[i];choice=i;}
            if(highConfidenceWhite){
              choice=whitePalettePosition;
            }else if(choice===outlinePalettePosition){
              const outlineCoverage=outlineSamples/valid;
              const rowContinuity=outlineRowHits.reduce((sum,value)=>sum+value,0)/samplesY;
              const colContinuity=outlineColHits.reduce((sum,value)=>sum+value,0)/samplesX;
              const coherentThinLine=outlineCoverage>=.22&&outlineCoverage<.5&&maxOutlineGradient>=90&&Math.max(rowContinuity,colContinuity)>=.84;
              if(outlineCoverage+1e-7<.5&&!coherentThinLine){
                let alternative=-1,alternativeScore=0;
                for(let i=0;i<scores.length;i++)if(i!==outlinePalettePosition&&(scores[i]>alternativeScore+1e-7||(Math.abs(scores[i]-alternativeScore)<1e-7&&alternative>=0&&palette[i].index<palette[alternative].index))){alternative=i;alternativeScore=scores[i];}
                if(alternative>=0&&alternativeScore>0)choice=alternative;
              }
            }
            grid[cell]=palette[choice].index;
            cellSupport[cell]=rawScores[choice]/valid;
            cellImportance[cell]=1+Math.min(4,featureScores[choice]/Math.max(.001,scores[choice]));
          }
        }
      }

      if(smallLineArtRefinement){
        const active=new Uint8Array(grid.length),ownerCounts=new Int32Array(lineSourceComponents+1);
        for(let cell=0;cell<grid.length;cell++){
          const strongFill=lineCoreCoverage[cell]>=.42||lineCoreCoverage[cell]>=.30&&lineSoftCoverage[cell]>=.50;
          if((lineSkeletonCells[cell]||strongFill)&&lineOwnerCells[cell]>0){active[cell]=1;ownerCounts[lineOwnerCells[cell]]++;}
        }
        // 对尚未落到豆格的小部件，仅在有真实墨线支持且不会与其他部件粘连时补一个格；
        // 没有安全位置则如实记录“不可表达”，不凭空多放豆。
        for(let owner=1;owner<=lineSourceComponents;owner++){
          if(ownerCounts[owner])continue;let best=-1,bestScore=0,fallback=-1,fallbackScore=0;
          for(const candidate of lineOwnerCandidates[owner]||[]){
            const cell=candidate.cell;if(active[cell])continue;const x=cell%cols,y=Math.floor(cell/cols);let conflict=false;
            for(let dy=-1;dy<=1&&!conflict;dy++)for(let dx=-1;dx<=1;dx++){
              if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
              const next=ny*cols+nx;if(active[next]&&lineOwnerCells[next]!==owner){conflict=true;break;}
            }
            if(candidate.score>=.008&&candidate.score>fallbackScore){fallback=cell;fallbackScore=candidate.score;}
            if(!conflict&&candidate.score>=.008&&candidate.score>bestScore){best=cell;bestScore=candidate.score;}
          }
          const chosen=best>=0?best:fallback;
          if(chosen>=0){lineOwnerCells[chosen]=owner;active[chosen]=1;ownerCounts[owner]=1;if(best<0)lineForcedCandidatePlacements++;}
          else lineUnrepresentableComponents++;
        }
        // 不同源部件在目标格上发生 8 邻接时，优先从较大的部件边缘移除一个
        // 不会破坏其连通性的格子。小眉毛、鼻点等单格细节因此不会被牺牲。
        const seen=new Uint32Array(grid.length),queue=new Int32Array(grid.length);let seenMark=0;
        const ownerConnectedWithout=(removed,owner)=>{
          const target=ownerCounts[owner]-1;if(target<1)return false;
          let start=-1;for(let i=0;i<active.length;i++)if(i!==removed&&active[i]&&lineOwnerCells[i]===owner){start=i;break;}
          if(start<0)return false;
          const mark=++seenMark;let head=0,tail=0,reached=0;seen[start]=mark;queue[tail++]=start;
          while(head<tail){
            const current=queue[head++],x=current%cols,y=Math.floor(current/cols);reached++;
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
              const next=ny*cols+nx;if(next!==removed&&active[next]&&lineOwnerCells[next]===owner&&seen[next]!==mark){seen[next]=mark;queue[tail++]=next;}
            }
          }
          return reached===target;
        };
        for(let round=0;round<active.length;round++){
          let removal=-1,removalScore=-Infinity,conflicts=0;const connectivityCache=new Map();
          for(let cell=0;cell<active.length;cell++){
            if(!active[cell])continue;const x=cell%cols,y=Math.floor(cell/cols),owner=lineOwnerCells[cell];
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
              const next=ny*cols+nx;if(next<=cell||!active[next]||lineOwnerCells[next]===owner)continue;
              conflicts++;const other=lineOwnerCells[next];
              for(const candidate of [cell,next]){
                const candidateOwner=lineOwnerCells[candidate];
                if(ownerCounts[candidateOwner]<=1)continue;
                let connected=connectivityCache.get(candidate);if(connected===undefined){connected=ownerConnectedWithout(candidate,candidateOwner);connectivityCache.set(candidate,connected);}
                if(!connected)continue;
                const score=ownerCounts[candidateOwner]*10-lineCoreCoverage[candidate]*3+(lineOwnerAreas[candidateOwner]||0)/10000;
                if(score>removalScore){removal=candidate;removalScore=score;}
              }
            }
          }
          if(!conflicts)break;
          if(removal<0){lineUnresolvedConflicts=conflicts;break;}
          active[removal]=0;ownerCounts[lineOwnerCells[removal]]--;lineSeparatedConflicts++;
        }
        for(let cell=0;cell<grid.length;cell++){
          if(active[cell]){grid[cell]=palette[outlinePalettePosition].index;cellSupport[cell]=Math.max(cellSupport[cell],lineCoreCoverage[cell]);cellImportance[cell]=Math.max(cellImportance[cell],2.4);}
          else if(grid[cell]===palette[outlinePalettePosition].index){grid[cell]=lineBackgroundCoverage[cell]<.20?palette[whitePalettePosition].index:-1;}
          if(!active[cell]&&grid[cell]===palette[whitePalettePosition].index&&lineBackgroundCoverage[cell]>=.20)grid[cell]=-1;
        }
      }

      // 高清照片先在目标豆格上做轻量局部反差，再匹配色板；不使用抖动，避免近看出现彩色噪点。
      if(detailMode){
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
          const cell=y*cols+x;if(!detailValid[cell])continue;
          if(detailWhite[cell]){
            grid[cell]=palette[whitePalettePosition].index;cellSupport[cell]=1;cellImportance[cell]=1;continue;
          }
          let nr=0,ng=0,nb=0,neighbors=0;
          for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
            const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
            const next=ny*cols+nx;if(!detailValid[next])continue;
            nr+=detailR[next];ng+=detailG[next];nb+=detailB[next];neighbors++;
          }
          let r=detailR[cell],g=detailG[cell],b=detailB[cell];
          if(neighbors){
            nr/=neighbors;ng/=neighbors;nb/=neighbors;
            const baseLum=.2126*r+.7152*g+.0722*b,nearLum=.2126*nr+.7152*ng+.0722*nb;
            const amount=Math.abs(baseLum-nearLum)>=8?.38:.18;
            r=Math.max(0,Math.min(255,r+(r-nr)*amount));g=Math.max(0,Math.min(255,g+(g-ng)*amount));b=Math.max(0,Math.min(255,b+(b-nb)*amount));
            cellImportance[cell]=1+Math.min(2,Math.abs(baseLum-nearLum)/42);
          }
          // 锐化前已判定为黑/灰的暗格，锐化后仍限定在中性色板，避免邻域色偏把黑色推成深蓝或紫色。
          grid[cell]=palette[nearestPalettePosition(Math.round(r),Math.round(g),Math.round(b),Boolean(detailNeutralDark[cell]))].index;
          cellSupport[cell]=1;
        }
      }

      // 只清理低支持率的 1–2 格彩色噪点；实心单格细节和三格以上色块保持不动。
      if(processMode==='cartoon'){
        const snapshot=grid.slice(),visited=new Uint8Array(snapshot.length);
        for(let cell=0;cell<snapshot.length;cell++){
          const index=snapshot[cell];if(index<0||visited[cell])continue;
          const lab=entryByIndex.get(index)?.lab;if(!lab||Math.hypot(lab[1],lab[2])<.075)continue;
          const component=[],queue=[cell];visited[cell]=1;
          while(queue.length){
            const current=queue.pop(),x=current%cols,y=Math.floor(current/cols);component.push(current);
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
              const next=ny*cols+nx;if(!visited[next]&&snapshot[next]===index){visited[next]=1;queue.push(next);}
            }
          }
          if(component.length>2||component.some(position=>cellSupport[position]>=.42))continue;
          const neighbors=new Map();
          for(const position of component){
            const x=position%cols,y=Math.floor(position/cols);
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
              const neighbor=snapshot[ny*cols+nx];if(neighbor>=0&&neighbor!==index)neighbors.set(neighbor,(neighbors.get(neighbor)||0)+1);
            }
          }
          let replacement=-1,bestCount=0;
          for(const [candidate,count] of neighbors)if(count>bestCount||(count===bestCount&&candidate<replacement)){replacement=candidate;bestCount=count;}
          if(bestCount>=component.length+2)for(const position of component)grid[position]=replacement;
        }
      }

      const counts=new Map(),importanceMass=new Map();
      for(let i=0;i<grid.length;i++)if(grid[i]>=0){
        counts.set(grid[i],(counts.get(grid[i])||0)+1);
        importanceMass.set(grid[i],(importanceMass.get(grid[i])||0)+cellImportance[i]);
      }
      const usedBeforeMerge=counts.size;
      const colorLab=index=>entryByIndex.get(index).lab;
      const colorChroma=index=>{const lab=colorLab(index);return Math.hypot(lab[1],lab[2]);};
      const colorIsChromatic=index=>Boolean(paletteChromatic[palettePositionByIndex.get(index)]);
      const colorPriority=index=>{
        const entry=entryByIndex.get(index),count=counts.get(index)||0,chroma=colorChroma(index),light=entry.lab[0];
        return count*(1+2.4*chroma+(light<.3?1.2:0)+(light>.9?.35:0))+.2*(importanceMass.get(index)||0);
      };
      const mergeColor=(from,to)=>{
        if(from===to||!counts.has(from)||!counts.has(to))return;
        for(let i=0;i<grid.length;i++)if(grid[i]===from)grid[i]=to;
        counts.set(to,(counts.get(to)||0)+(counts.get(from)||0));counts.delete(from);
        importanceMass.set(to,(importanceMass.get(to)||0)+(importanceMass.get(from)||0));importanceMass.delete(from);
      };

      // 锚点保护：最深/最浅中性色和不同色相的高彩度小色块不会因面积小而先被丢弃。
      const anchors=new Set();
      if(counts.size){
        const active=()=>Array.from(counts.keys()).sort((a,b)=>a-b);
        const neutrals=active().filter(index=>!colorIsChromatic(index));
        if(neutrals.length){
          anchors.add(neutrals.reduce((a,b)=>colorLab(a)[0]<=colorLab(b)[0]?a:b));
          anchors.add(neutrals.reduce((a,b)=>colorLab(a)[0]>=colorLab(b)[0]?a:b));
        }
        const saturated=active().filter(index=>colorIsChromatic(index)).sort((a,b)=>{
          const sa=colorChroma(a)*Math.log2((counts.get(a)||0)+2),sb=colorChroma(b)*Math.log2((counts.get(b)||0)+2);
          return sb-sa||a-b;
        });
        const hues=[];
        for(const index of saturated){
          const lab=colorLab(index),hue=Math.atan2(lab[2],lab[1]);
          if(hues.every(old=>Math.abs(Math.atan2(Math.sin(hue-old),Math.cos(hue-old)))>.55)){
            anchors.add(index);hues.push(hue);if(hues.length===3)break;
          }
        }
      }

      if(processMode==='cartoon'&&mergeStrength>0){
        const threshold=Math.max(0,Math.min(30,mergeStrength))/100;
        while(true){
          const active=Array.from(counts.keys()).sort((a,b)=>a-b);
          let bestPair=null,bestDistance=Infinity;
          for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
            const a=active[i],b=active[j];
            if(colorIsChromatic(a)!==colorIsChromatic(b))continue;
            const distance=labDistance(colorLab(a),colorLab(b));
            if(distance>=threshold||anchors.has(a)&&anchors.has(b))continue;
            if(distance<bestDistance-1e-12){bestDistance=distance;bestPair=[a,b];}
          }
          if(!bestPair)break;
          let [a,b]=bestPair,from,to;
          if(anchors.has(a)){from=b;to=a;}
          else if(anchors.has(b)){from=a;to=b;}
          else if(colorPriority(a)<=colorPriority(b)){from=a;to=b;}
          else{from=b;to=a;}
          mergeColor(from,to);
        }
      }

      const limit=Math.max(1,Math.min(Math.round(maxColors)||1,palette.length,grid.length));
      while(counts.size>limit){
        const active=Array.from(counts.keys()).sort((a,b)=>a-b);
        let remove=-1,target=-1,bestLoss=Infinity;
        for(const candidate of active){
          let nearest=-1,nearestDistance=Infinity;
          for(const other of active)if(other!==candidate){
            if(colorIsChromatic(candidate)!==colorIsChromatic(other))continue;
            const distance=labDistance(colorLab(candidate),colorLab(other));
            if(distance<nearestDistance-1e-12||(Math.abs(distance-nearestDistance)<1e-12&&other<nearest)){nearestDistance=distance;nearest=other;}
          }
          if(nearest<0)continue;
          const count=counts.get(candidate)||0,avgImportance=(importanceMass.get(candidate)||count)/Math.max(1,count);
          let loss=count*nearestDistance*nearestDistance*(.7+avgImportance);
          if(anchors.has(candidate))loss*=40;
          loss*=1+2.2*colorChroma(candidate);
          if(loss<bestLoss-1e-12||(Math.abs(loss-bestLoss)<1e-12&&candidate<remove)){bestLoss=loss;remove=candidate;target=nearest;}
        }
        if(remove<0||target<0)break;
        mergeColor(remove,target);
      }

      const selected=Array.from(counts.keys()).sort((a,b)=>(counts.get(b)||0)-(counts.get(a)||0)||a-b);
      let nonEmpty=0;for(const value of grid)if(value>=0)nonEmpty++;
      return {buffer:grid.buffer,selected,nonEmpty,diagnostics:{usedBeforeMerge,backgroundPixels,edgeArtifactPixels,darkThreshold,outlineCutoff,monochromeLineArt,smallLineArtRefinement,lineSourceComponents,lineSeparatedConflicts,lineUnresolvedConflicts,lineUnrepresentableComponents,lineForcedCandidatePlacements,mode:processMode}};
    }

    function runConversion(payload, jobId) {
      return new Promise((resolve,reject) => {
        let worker;
        let settled=false;
        let watchdog=0;
        const finishReject=error=>{if(settled)return;settled=true;window.clearTimeout(watchdog);state.cancelConversion=null;reject(error);};
        const finishResolve=value=>{if(settled)return;settled=true;window.clearTimeout(watchdog);state.cancelConversion=null;resolve(value);};
        try {
          const source = `self.onmessage=function(event){try{const result=(${convertPixels.toString()})(event.data);self.postMessage(result,[result.buffer]);}catch(error){self.postMessage({error:error&&error.message?error.message:String(error)});}}`;
          const url = URL.createObjectURL(new Blob([source], {type:'text/javascript'}));
          worker = new Worker(url);
          URL.revokeObjectURL(url);
          state.converter = worker;
          watchdog=window.setTimeout(()=>{
            worker.terminate();if(state.converter===worker)state.converter=null;finishReject(new Error('timeout'));
          },WORKER_TIMEOUT_MS);
          state.cancelConversion = () => {
            worker.terminate();
            if (state.converter === worker) state.converter = null;
            finishReject(new Error('cancelled'));
          };
          worker.onmessage = event => {
            worker.terminate();
            if (state.converter === worker) state.converter = null;
            if (event.data.error) finishReject(new Error(event.data.error)); else finishResolve(event.data);
          };
          worker.onerror = error => { worker.terminate(); if (state.converter === worker) state.converter=null; finishReject(error); };
          worker.postMessage(payload, [payload.data.buffer]);
        } catch (error) {
          if (worker) worker.terminate();
          state.converter = null;
          finishReject(new Error('worker-unavailable'));
        }
      });
    }

    function invalidateConversion() {
      const cancel=state.cancelConversion;
      if(cancel)cancel();
      else state.converter?.terminate();
      state.converter=null;
      state.cancelConversion=null;
      return ++state.conversionJob;
    }

    async function convertImage() {
      if (!state.referenceRaster) {
        toast('toast.chooseImageFirst');
        return;
      }
      if(state.sourceAnalysis?.likelyPhoto&&['cartoon','document'].includes(els.processMode.value)){
        els.processMode.value='detail';els.processModeHint.textContent=modeHint('detail');
        toast('toast.photoModeAuto');
        rebuildReferenceRaster();
      }
      const jobId = invalidateConversion();
      state.convertFocusReturn=document.activeElement instanceof HTMLElement?document.activeElement:null;
      setConversionModal(true);
      const modeName = modeLabel(els.processMode.value);
      els.progressText.textContent = t('conversion.progress',{mode:modeName,colors:state.maxColors});
      els.convertBtn.disabled = true;
      try {
        const boardContained=state.sizeMode==='board'&&els.fitMode.value==='contain';
        const placement=boardContained?currentPatternPlacement():{cols:state.cols,rows:state.rows,offsetX:0,offsetY:0};
        const conversionRaster=boardContained?renderReferenceRaster({contentOnly:true}):state.referenceRaster;
        const ctx = conversionRaster.getContext('2d', {willReadFrequently:true});
        const imageData = ctx.getImageData(0,0,conversionRaster.width,conversionRaster.height);
        const palette = getAllowedPalette().map(color => ({index:color.index,code:color.code,rgb:color.rgb,lab:color.lab,cieLab:color.cieLab}));
        const payload = {
          data:imageData.data,
          width:imageData.width,
          height:imageData.height,
          cols:placement.cols,
          rows:placement.rows,
          palette,
          maxColors:state.maxColors,
          whiteMode:els.whiteMode.value,
          processMode:els.processMode.value,
          mergeStrength:state.mergeStrength,
          protectDark:state.protectDark
        };
        const result = await runConversion(payload, jobId);
        if (jobId !== state.conversionJob) return;
        state.lastConversionDiagnostics=result.diagnostics?{...result.diagnostics}:null;
        const compactGrid=new Int16Array(result.buffer);
        if(boardContained){
          state.grid=embedPatternGrid(compactGrid,placement.cols,placement.rows,state.cols,state.rows,placement.offsetX,placement.offsetY);
        }else state.grid=compactGrid;
        if(state.smartMode)state.smartPhase='done';
        commitHistory('history.converted');
        renderAll();
        const blankNote = els.whiteMode.value === 'auto' ? t('conversion.backgroundRemoved') : '';
        const mergeNote = result.diagnostics?.usedBeforeMerge > result.selected.length ? t('conversion.colorsMerged',{before:result.diagnostics.usedBeforeMerge,after:result.selected.length}) : '';
        const source=effectiveSourceSize(),span=Math.max(source.width/state.cols,source.height/state.rows);
        const glyphCells=state.sourceAnalysis?.medianGlyphHeightPx?state.sourceAnalysis.medianGlyphHeightPx/span:null;
        const structuralOnly=Boolean(state.sourceAnalysis?.likelyDocument)&&(glyphCells===null||glyphCells<4);
        if(structuralOnly){
          const documentPreview=els.processMode.value==='document';
          toast(documentPreview?'toast.documentPreview':'toast.documentDetected');
          setStatus('status.documentPreview',{kind:t(documentPreview?'status.structurePreview':'status.complexPreview'),size:localizedPatternSize(placement),advice:t(documentPreview?'status.cropSuggested':'status.modeSuggested')});
        }else if(lineDetailIssues(result.diagnostics).total>0){
          const issues=lineDetailIssues(result.diagnostics),warning=lineDetailWarningCopy(issues,{short:true});
          toast('toast.generatedWarning','info',{warning});
          setStatus('status.smallRefine',{warning});
        }else{
          toast('toast.conversionComplete','success',{colors:result.selected.length,background:blankNote,merged:mergeNote});
          setStatus('status.conversionComplete',{mode:modeName,size:localizedPatternSize(placement),colors:result.selected.length});
        }
        updateDetailAdvice();
        if(!state.hasAutoFit){
          state.hasAutoFit=true;
          requestAnimationFrame(()=>fitCanvasToViewport(false));
        }
      } catch (error) {
        if (error.message !== 'cancelled' && jobId === state.conversionJob) {
          const snapshot=state.history[state.historyIndex];if(snapshot)restoreSnapshot(snapshot);
          const timedOut=error.message==='timeout',unsupported=error.message==='worker-unavailable';
          toast(timedOut?'toast.conversionTimeout':unsupported?'toast.workerUnsupported':'toast.conversionFailed', 'error');
          setStatus('status.conversionFailed',{reason:t(timedOut?'status.timeout':unsupported?'status.browserUnsupported':'status.failed')});
        }
      } finally {
        if (jobId === state.conversionJob) {
          setConversionModal(false);
          els.convertBtn.disabled = !state.referenceImage;
          state.converter = null;
        }
      }
    }

    function applyPhysicalBoard(profileId=state.boardProfile,tilesX=state.boardTilesX,tilesY=state.boardTilesY,skipConfirm=false) {
      if(blockMutationDuringConversion())return;
      const source=effectiveSourceSize(),layout=physicalBoardLayout(profileId,tilesX,tilesY,source.width,source.height);
      if(!layout.withinLimit){toast('toast.boardTooLarge','error');syncBoardStatus();return;}
      const sameSize=state.cols===layout.boardCols&&state.rows===layout.boardRows;
      const sameConfig=state.sizeMode==='board'&&state.boardProfile===layout.profile.id&&state.boardTilesX===layout.tilesX&&state.boardTilesY===layout.tilesY;
      if(sameConfig)return;
      const quality=state.referenceImage?assessPatternQuality({width:source.width,height:source.height,cols:layout.pattern.cols,rows:layout.pattern.rows,fitMode:'contain',analysis:state.sourceAnalysis}):null;
      const qualityCopy=quality?.severeDetail?t('confirm.boardQualitySevere'):quality?.lowDetail?t('confirm.boardQualityLow'):'';
      if(!skipConfirm&&state.grid.some(value=>value>=0)&&!window.confirm(t('confirm.boardSwitch',{profile:t(layout.profile.labelKey),tilesX:layout.tilesX,tilesY:layout.tilesY,patternCols:layout.pattern.cols,patternRows:layout.pattern.rows,boardCols:layout.boardCols,boardRows:layout.boardRows,quality:qualityCopy}))){els.boardProfile.value=state.boardProfile;syncSizeModeUI();return;}
      state.sizeMode='board';state.boardProfile=layout.profile.id;state.boardTilesX=layout.tilesX;state.boardTilesY=layout.tilesY;state.aspectLock=true;
      els.boardProfile.value=state.boardProfile;els.fitMode.value='contain';els.gridCols.value=layout.boardCols;els.gridRows.value=layout.boardRows;
      syncSizeModeUI();
      if(sameSize){
        markCustomSettings();if(state.referenceImage){rebuildReferenceRaster();updateDetailAdvice();convertImage();}else{renderAll();commitHistory('history.boardChanged');}
      }else applyGridSize(layout.boardCols,layout.boardRows,true);
    }

    function switchSizeMode(mode) {
      if(blockMutationDuringConversion())return;
      if(mode!=='board'&&mode!=='pattern'||mode===state.sizeMode)return;
      if(mode==='board'){applyPhysicalBoard(state.boardProfile,state.boardTilesX,state.boardTilesY);return;}
      const pattern=currentPatternPlacement();
      if(state.grid.some(value=>value>=0)&&!window.confirm(t('confirm.patternMode',{cols:pattern.cols,rows:pattern.rows})))return;
      state.sizeMode='pattern';state.aspectLock=true;els.aspectLock.checked=true;syncSizeModeUI();
      applyGridSize(pattern.cols,pattern.rows,true);
    }

    function applyGridSize(cols, rows, skipConfirm=false) {
      if(blockMutationDuringConversion())return;
      cols = Math.round(clamp(cols,4,160));
      rows = Math.round(clamp(rows,4,160));
      if (cols === state.cols && rows === state.rows) return;
      const hasContent = state.grid.some(value => value >= 0);
      const proposedQuality=state.referenceImage?assessPatternQuality({width:effectiveSourceSize().width,height:effectiveSourceSize().height,cols:state.sizeMode==='board'?fitPatternInsideBoard(effectiveSourceSize().width,effectiveSourceSize().height,cols,rows).cols:cols,rows:state.sizeMode==='board'?fitPatternInsideBoard(effectiveSourceSize().width,effectiveSourceSize().height,cols,rows).rows:rows,fitMode:'contain',analysis:state.sourceAnalysis}):null;
      const qualityWarning=proposedQuality?.severeDetail?t('confirm.resizeQuality',{cells:formatNumber(Math.round(proposedQuality.effectiveCells))}):'';
      if (hasContent && !skipConfirm && !window.confirm(t('confirm.resize',{cols,rows,quality:qualityWarning}))) {
        els.gridCols.value = state.cols;
        els.gridRows.value = state.rows;
        return;
      }
      state.cols = cols;
      state.rows = rows;
      els.gridCols.value=cols;
      els.gridRows.value=rows;
      state.grid = new Int16Array(cols*rows).fill(-1);
      state.hasAutoFit=false;
      state.keyboardCursor = {x:0,y:0};
      markCustomSettings();
      if (state.referenceImage) rebuildReferenceRaster();
      else commitHistory('history.sizeCleared');
      renderAll();
      updateDetailAdvice();
      syncSizeModeUI();syncAspectStatus();
      if (state.referenceImage) convertImage();
    }

    function transformCells(old, cols, rows, type) {
      let nextCols = cols, nextRows = rows;
      if (type === 'rotate') { nextCols = rows; nextRows = cols; }
      const next = new Int16Array(nextCols*nextRows).fill(-1);
      for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) {
        const value = old[y*cols+x];
        let nx=x,ny=y;
        if (type === 'mirrorH') nx=cols-1-x;
        if (type === 'mirrorV') ny=rows-1-y;
        if (type === 'rotate') { nx=rows-1-y; ny=x; }
        next[ny*nextCols+nx]=value;
      }
      return { cells: next, cols: nextCols, rows: nextRows };
    }

    function transformGrid(type) {
      if(blockMutationDuringConversion())return;
      const transformed = transformCells(state.grid, state.cols, state.rows, type);
      const { cells: next, cols: nextCols, rows: nextRows } = transformed;
      state.cols=nextCols; state.rows=nextRows; state.grid=next;
      els.gridCols.value=nextCols; els.gridRows.value=nextRows;
      if(state.sizeMode==='board'&&type==='rotate')[state.boardTilesX,state.boardTilesY]=[state.boardTilesY,state.boardTilesX];
      if (state.referenceImage){state.referenceTransforms.push(type);rebuildReferenceRaster();}
      markCustomSettings();syncSizeModeUI();syncAspectStatus();
      commitHistory(type === 'rotate' ? 'history.rotated' : type === 'mirrorH' ? 'history.mirroredH' : 'history.mirroredV');
      renderAll();
    }

    function clearGrid() {
      if(blockMutationDuringConversion())return;
      if (!state.grid.some(value => value >= 0)) return;
      if (!window.confirm(t('confirm.clear'))) return;
      state.grid.fill(-1);
      markCustomSettings();
      commitHistory('history.cleared');
      renderAll();
    }

    function setZoom(next) {
      const centerX = els.canvasViewport.scrollLeft + els.canvasViewport.clientWidth/2;
      const centerY = els.canvasViewport.scrollTop + els.canvasViewport.clientHeight/2;
      const oldWidth = state.cols*cellSize(), oldHeight = state.rows*cellSize();
      const limit=maxSafeZoom();
      state.zoom = clamp(next,.0625,limit);
      if(next>limit+.001)toast('toast.zoomLimit','info',{cols:state.cols,rows:state.rows,percent:Math.round(limit*100)});
      renderAll();
      const newWidth = state.cols*cellSize(), newHeight=state.rows*cellSize();
      requestAnimationFrame(() => {
        els.canvasViewport.scrollLeft = centerX * (newWidth/Math.max(1,oldWidth)) - els.canvasViewport.clientWidth/2;
        els.canvasViewport.scrollTop = centerY * (newHeight/Math.max(1,oldHeight)) - els.canvasViewport.clientHeight/2;
      });
    }

    function fitCanvasToViewport(announce=true) {
      const center=els.canvasViewport.querySelector('.canvas-center');
      const centerStyle=getComputedStyle(center),shellStyle=getComputedStyle(els.boardShell);
      const horizontalChrome=parseFloat(centerStyle.paddingLeft)+parseFloat(centerStyle.paddingRight)+parseFloat(shellStyle.paddingLeft)+parseFloat(shellStyle.paddingRight)+2+(state.showRulers?parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ruler-size'))||28:0);
      const verticalChrome=parseFloat(centerStyle.paddingTop)+parseFloat(centerStyle.paddingBottom)+parseFloat(shellStyle.paddingTop)+parseFloat(shellStyle.paddingBottom)+2+(state.showRulers?parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ruler-size'))||28:0);
      const fit=Math.min(2,(els.canvasViewport.clientWidth-horizontalChrome)/(state.cols*BASE_CELL),(els.canvasViewport.clientHeight-verticalChrome)/(state.rows*BASE_CELL));
      const stepped=fit<.25?Math.max(.0625,Math.floor(Math.max(.0625,fit)*16)/16):Math.floor(fit*4)/4;
      setZoom(stepped);
      if(announce){const overview=cellSize()<4;setStatus('status.zoom',{message:t(overview?'status.canvasOverview':'status.canvasFit'),percent:Math.round(state.zoom*100)});toast(overview?'toast.canvasOverview':'toast.canvasFit','success',{percent:Math.round(state.zoom*100)});}
    }

    function occupiedBounds(grid,cols,rows) {
      let minX=cols,minY=rows,maxX=-1,maxY=-1;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(grid[y*cols+x]>=0){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      if(maxX<0)return {minX:0,minY:0,maxX:cols-1,maxY:rows-1,cols,rows,empty:true};
      return {minX,minY,maxX,maxY,cols:maxX-minX+1,rows:maxY-minY+1,empty:false};
    }

    function buildExportCanvas() {
      // 施工图保留用户设置的完整底板坐标；空格也属于定位信息，不能在导出时静默裁掉后重置坐标。
      const stats=getStats(),bounds={minX:0,minY:0,maxX:state.cols-1,maxY:state.rows-1,cols:state.cols,rows:state.rows,empty:stats.total===0};
      const longest=Math.max(bounds.cols,bounds.rows);
      const entries=[...stats.counts.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
      const idealCell=longest<=60?38:longest<=100?34:longest<=130?30:28;
      const ruler=36,titleH=82,sectionGap=26;
      const measure=cell=>{
        const boardWidth=bounds.cols*cell,boardHeight=bounds.rows*cell,chartWidth=ruler+boardWidth+ruler;
        const width=Math.max(620,chartWidth),legendCols=Math.max(1,Math.min(Math.max(1,entries.length),Math.floor((width-24)/190)));
        const legendRows=Math.ceil(entries.length/legendCols),legendStart=titleH+ruler+boardHeight+ruler+sectionGap,summaryY=legendStart+34+legendRows*46+10,height=summaryY+72;
        return {cell,boardWidth,boardHeight,chartWidth,width,legendCols,legendRows,legendStart,summaryY,height,pixels:width*height};
      };
      let layout=measure(idealCell);
      while(layout.pixels>DEVICE_LIMITS.exportPixels&&layout.cell>18)layout=measure(layout.cell-1);
      if(layout.pixels>DEVICE_LIMITS.exportPixels)throw new Error('export-memory');
      const {cell,boardWidth,boardHeight,chartWidth,width,legendCols,legendRows,legendStart,summaryY,height}=layout;
      const chartX=Math.floor((width-chartWidth)/2),ox=chartX+ruler,oy=titleH+ruler;
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
      ctx.fillStyle='#1f211f';ctx.font='800 21px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(t('export.header',{title:els.projectTitle.textContent||t('file.patternFallback'),cols:bounds.cols,rows:bounds.rows,colors:stats.counts.size,beads:formatNumber(stats.total)}),14,25);
      ctx.fillStyle='#626661';ctx.font='12px system-ui,"Microsoft YaHei",sans-serif';
      const placement=currentPatternPlacement(),profile=BOARD_PROFILES[state.boardProfile]||BOARD_PROFILES.mini52,boardCopy=state.sizeMode==='board'?t('export.boardCopy',{profile:boardProfileLabel(profile),tilesX:state.boardTilesX,tilesY:state.boardTilesY,cols:placement.cols,rows:placement.rows}):t('export.patternCopy');
      ctx.fillText(t('export.subtitle',{board:boardCopy,step:state.majorGridStep}),14,52);

      // 最终文件固定使用平面施工表，不继承屏幕上的仿真豆预览；四边坐标始终保留。
      ctx.fillStyle='#d9def3';
      ctx.fillRect(ox,oy-ruler,boardWidth,ruler);ctx.fillRect(ox,oy+boardHeight,boardWidth,ruler);
      ctx.fillRect(ox-ruler,oy,ruler,boardHeight);ctx.fillRect(ox+boardWidth,oy,ruler,boardHeight);
      ctx.fillStyle='#7b86bb';
      ctx.fillRect(ox-ruler,oy-ruler,ruler,ruler);ctx.fillRect(ox+boardWidth,oy-ruler,ruler,ruler);
      ctx.fillRect(ox-ruler,oy+boardHeight,ruler,ruler);ctx.fillRect(ox+boardWidth,oy+boardHeight,ruler,ruler);
      ctx.strokeStyle='#69739f';ctx.lineWidth=1;
      ctx.strokeRect(ox-ruler+.5,oy-ruler+.5,boardWidth+ruler*2-1,boardHeight+ruler*2-1);
      ctx.fillStyle='#27304d';ctx.font=`800 ${Math.max(8,Math.min(11,Math.floor(cell*.31)))}px ui-monospace,SFMono-Regular,Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
      for(let x=0;x<bounds.cols;x++){
        const label=String(x+1),cx=ox+x*cell+cell/2;
        ctx.fillText(label,cx,oy-ruler/2);ctx.fillText(label,cx,oy+boardHeight+ruler/2);
      }
      for(let y=0;y<bounds.rows;y++){
        const label=String(y+1),cy=oy+y*cell+cell/2;
        ctx.fillText(label,ox-ruler/2,cy);ctx.fillText(label,ox+boardWidth+ruler/2,cy);
      }

      const codeFont=Math.max(9,Math.floor(cell*.32));
      for(let y=0;y<bounds.rows;y++)for(let x=0;x<bounds.cols;x++){
        const sourceX=bounds.minX+x,sourceY=bounds.minY+y,value=state.grid[sourceY*state.cols+sourceX];
        const px=ox+x*cell,py=oy+y*cell,color=value>=0?PALETTE[value]:null;
        ctx.fillStyle=color?color.displayHex:'#fff';ctx.fillRect(px,py,cell,cell);
        ctx.strokeStyle='#5f625f';ctx.lineWidth=.75;ctx.strokeRect(px+.375,py+.375,cell,cell);
        if(color){
          ctx.fillStyle=colorText(color.displayHex);ctx.font=`800 ${codeFont}px ui-monospace,SFMono-Regular,Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(color.code,px+cell/2,py+cell/2+.25);
        }
      }
      drawMajorGrid(ctx,ox,oy,bounds.cols,bounds.rows,cell,state.majorGridStep,{color:'#1c1f1d',lineWidth:3});
      drawPhysicalBoardSeams(ctx,ox,oy,bounds.cols,bounds.rows,cell,{color:'#7d2d20',lineWidth:5});

      ctx.fillStyle='#232623';ctx.font='800 15px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.fillText(t('export.materials'),14,legendStart+9);
      const itemWidth=(width-24)/legendCols;
      entries.forEach(([index,count],i)=>{
        const col=i%legendCols,row=Math.floor(i/legendCols),x=12+col*itemWidth,y=legendStart+27+row*46,color=PALETTE[index],swatch=30;
        ctx.fillStyle=color.displayHex;ctx.fillRect(x,y,swatch,swatch);ctx.strokeStyle='#5f625f';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,swatch-1,swatch-1);
        ctx.fillStyle=colorText(color.displayHex);ctx.font='800 9px ui-monospace,SFMono-Regular,Consolas,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(color.code,x+swatch/2,y+swatch/2);
        ctx.fillStyle='#242724';ctx.font='700 11px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.fillText(`${color.code} · ${localizedColorName(color)}`,x+39,y+10);
        ctx.fillStyle='#686c67';ctx.font='11px system-ui,"Microsoft YaHei",sans-serif';ctx.fillText(t('export.count',{count:formatNumber(count)}),x+39,y+25);
      });
      ctx.fillStyle='#1f211f';ctx.font='800 14px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(t('export.total',{count:formatNumber(stats.total)}),14,summaryY+12);
      const sizeSummary=state.sizeMode==='board'?t('export.boardSize',{patternCols:placement.cols,patternRows:placement.rows,boardCols:bounds.cols,boardRows:bounds.rows,boards:state.boardTilesX*state.boardTilesY}):t('export.patternSize',{cols:bounds.cols,rows:bounds.rows});
      ctx.fillText(t('export.sizeSummary',{size:sizeSummary,step:state.majorGridStep}),14,summaryY+38);
      ctx.fillStyle='#71756f';ctx.font='10px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='right';ctx.fillText(t('export.generated',{version:APP_VERSION}),width-14,summaryY+38);
      return canvas;
    }

    function downloadBlob(blob, filename) {
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1500);
    }

    function safeFileStem(value,fallback=t('file.patternFallback')) {
      const cleaned=String(value||'').normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/[. ]+$/g,'').replace(/\s+/g,' ').trim();
      return (cleaned||fallback).slice(0,80);
    }

    function setExportBusy(busy) {
      state.exporting=busy;
      [els.exportPngBtn,els.topExportBtn,els.smartExportBtn,els.readyExportBtn,els.readySaveBtn,els.readyShareBtn,els.readyShareCardBtn,els.shareCardDownloadBtn,els.printBtn].forEach(button=>{if(button)button.disabled=busy;});
      document.querySelector('.app-shell').setAttribute('aria-busy',String(busy));
    }

    async function copyAppLink() {
      const url=localizedAppUrl();
      try {
        if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);
        else{
          const input=document.createElement('textarea');input.value=url;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();
          if(!document.execCommand('copy'))throw new Error('copy');input.remove();
        }
        toast('share.copied','success');
        return true;
      } catch(_){toast('share.failed','error');return false;}
    }

    async function sharePattern() {
      const payload={title:t('share.title'),text:t('share.text'),url:localizedAppUrl()};
      if(typeof navigator.share==='function'){
        try{await navigator.share(payload);return;}
        catch(error){if(error?.name==='AbortError')return;}
      }
      await copyAppLink();
    }

    function drawContained(ctx,source,x,y,width,height,{background='#fff'}={}) {
      ctx.fillStyle=background;ctx.fillRect(x,y,width,height);
      const sw=source.width,sh=source.height,scale=Math.min(width/sw,height/sh),dw=sw*scale,dh=sh*scale;
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,x+(width-dw)/2,y+(height-dh)/2,dw,dh);
    }

    function shareSourceCanvas() {
      if(!state.referenceRaster)return null;
      return state.referenceRaster;
    }

    function sharePatternCanvas() {
      const cell=Math.max(2,Math.floor(720/Math.max(state.cols,state.rows))),canvas=document.createElement('canvas');
      canvas.width=state.cols*cell;canvas.height=state.rows*cell;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      for(let y=0;y<state.rows;y++)for(let x=0;x<state.cols;x++){
        const value=state.grid[y*state.cols+x];ctx.fillStyle=value>=0&&PALETTE[value]?PALETTE[value].displayHex:'#fff';ctx.fillRect(x*cell,y*cell,cell,cell);
      }
      if(cell>=4){ctx.strokeStyle='rgba(31,33,31,.16)';ctx.lineWidth=1;for(let x=0;x<=state.cols;x++){ctx.beginPath();ctx.moveTo(x*cell+.5,0);ctx.lineTo(x*cell+.5,canvas.height);ctx.stroke();}for(let y=0;y<=state.rows;y++){ctx.beginPath();ctx.moveTo(0,y*cell+.5);ctx.lineTo(canvas.width,y*cell+.5);ctx.stroke();}}
      return canvas;
    }

    function buildShareCardCanvas(format=els.shareFormat?.value||'wide') {
      const portrait=format==='portrait',width=portrait?1080:1200,height=portrait?1440:675,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d'),source=shareSourceCanvas(),pattern=sharePatternCanvas();if(!source)throw new Error('no-reference');
      const pad=portrait?68:54,headerH=portrait?230:142,gap=portrait?30:26,footerH=portrait?120:86;
      ctx.fillStyle='#f5f2eb';ctx.fillRect(0,0,width,height);
      ctx.fillStyle='#b54a28';ctx.fillRect(pad,portrait?62:38,portrait?92:74,8);
      ctx.fillStyle='#24221f';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font=`800 ${portrait?54:38}px system-ui,"Segoe UI",sans-serif`;ctx.fillText(t('share.cardTitle'),pad,portrait?145:89);
      ctx.fillStyle='#6a655e';ctx.font=`600 ${portrait?25:18}px system-ui,"Segoe UI",sans-serif`;ctx.fillText(t('share.cardSubtitle'),pad,portrait?190:120);
      const contentTop=headerH,contentBottom=height-footerH,contentH=contentBottom-contentTop;
      if(portrait){
        const panelH=(contentH-gap)/2;drawContained(ctx,source,pad,contentTop,width-pad*2,panelH,{background:'#fff'});drawContained(ctx,pattern,pad,contentTop+panelH+gap,width-pad*2,panelH,{background:'#fff'});
        ctx.fillStyle='#24221f';ctx.font='800 22px system-ui,"Segoe UI",sans-serif';ctx.fillText(t('share.original'),pad+16,contentTop+34);ctx.fillText(t('share.pattern'),pad+16,contentTop+panelH+gap+34);
      }else{
        const panelW=(width-pad*2-gap)/2;drawContained(ctx,source,pad,contentTop,panelW,contentH,{background:'#fff'});drawContained(ctx,pattern,pad+panelW+gap,contentTop,panelW,contentH,{background:'#fff'});
        ctx.fillStyle='#24221f';ctx.font='800 18px system-ui,"Segoe UI",sans-serif';ctx.fillText(t('share.original'),pad+14,contentTop+29);ctx.fillText(t('share.pattern'),pad+panelW+gap+14,contentTop+29);
      }
      ctx.fillStyle='#4e4a45';ctx.font=`700 ${portrait?22:16}px ui-monospace,SFMono-Regular,Consolas,monospace`;ctx.fillText(t('share.cardFooter'),pad,height-(portrait?50:31));
      return canvas;
    }

    function renderShareCardPreview() {
      if(!els.sharePreviewCanvas||!state.referenceImage)return;
      const card=buildShareCardCanvas(),preview=els.sharePreviewCanvas;preview.width=card.width;preview.height=card.height;preview.getContext('2d').drawImage(card,0,0);card.width=1;card.height=1;
    }

    function openShareCardDialog() {
      if(!state.referenceImage){toast('share.unavailable','error');return;}
      state.shareFocusReturn=document.activeElement;renderShareCardPreview();els.shareDialog.showModal();els.shareCardCloseBtn.focus({preventScroll:true});
    }

    function closeShareCardDialog() { if(els.shareDialog?.open)els.shareDialog.close();if(state.shareFocusReturn?.isConnected)state.shareFocusReturn.focus({preventScroll:true});state.shareFocusReturn=null; }

    async function exportShareCard() {
      if(state.exporting)return;if(!state.referenceImage){toast('share.unavailable','error');return;}setExportBusy(true);
      try{
        await new Promise(resolve=>requestAnimationFrame(resolve));const canvas=buildShareCardCanvas(),blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));canvas.width=1;canvas.height=1;if(!blob)throw new Error('encode');
        downloadBlob(blob,`${safeFileStem(els.projectTitle.textContent,t('project.untitled'))}-share-${els.shareFormat.value}.png`);closeShareCardDialog();
      }catch(_){toast('share.unavailable','error');}finally{setExportBusy(false);}
    }

    async function exportPng() {
      if(state.exporting)return;
      const issues=lineDetailIssues();
      if(issues.total&&!window.confirm(t('confirm.exportIssues',{issues:lineDetailWarningCopy(issues)})))return;
      setExportBusy(true);
      try {
        setStatus('status.exporting');
        await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
        const canvas=buildExportCanvas();
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        canvas.width=1;canvas.height=1;
        if(!blob)throw new Error('encode');
        const placement=currentPatternPlacement(),sizeName=state.sizeMode==='board'?`pattern-${placement.cols}x${placement.rows}-board-${state.cols}x${state.rows}`:`${state.cols}x${state.rows}`;
        downloadBlob(blob,`${safeFileStem(els.projectTitle.textContent)}-${sizeName}.png`);
        toast('toast.exportDone','success');setStatus('status.exportDone');
      } catch(error){toast(error.message==='export-memory'?'toast.exportMemory':'toast.exportFailed','error');setStatus('status.exportFailed');}
      finally{setExportBusy(false);}
    }

    function buildProjectData(title=els.projectTitle.textContent) {
      return {
        type:'bead-grid-studio',version:PROJECT_VERSION,appVersion:APP_VERSION,savedAt:new Date().toISOString(),title:String(title||t('project.untitled')).slice(0,80),
        grid:{cols:state.cols,rows:state.rows,cells:Array.from(state.grid,value=>value>=0&&PALETTE[value]?PALETTE[value].code:null)},
        settings:{selectedColor:state.selectedColor,selectedColorCode:PALETTE[state.selectedColor]?.code||'H7',previewMode:state.previewMode,showGrid:state.showGrid,showRulers:state.showRulers,showCodes:state.showCodes,zoom:state.zoom,paletteMode:state.paletteMode,maxColors:state.maxColors,mergeStrength:state.mergeStrength,protectDark:state.protectDark,sizeMode:state.sizeMode,aspectLock:state.aspectLock,boardProfile:state.boardProfile,boardTilesX:state.boardTilesX,boardTilesY:state.boardTilesY,majorGridStep:state.majorGridStep,processMode:els.processMode.value,fitMode:els.fitMode.value,whiteMode:els.whiteMode.value},
        palette:'mard-compatible-base-221-v1',paletteProvider:PALETTE_PROVIDER.id,paletteSource:MARD_PALETTE_SOURCE,reference:{embedded:false}
      };
    }

    let draftTimer=0;
    function updateRecoveryUI() {
      let available=false;
      try {const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');available=Boolean(draft?.type==='bead-grid-studio'&&Array.isArray(draft?.grid?.cells)&&draft.grid.cells.some(Boolean));} catch(_) {}
      els.recoveryActions.hidden=!available||Boolean(state.referenceImage)||state.grid.some(value=>value>=0);
    }

    function saveDraftNow() {
      window.clearTimeout(draftTimer);
      if(!state.grid.some(value=>value>=0)){try{localStorage.removeItem(DRAFT_KEY);}catch(_){}updateRecoveryUI();return;}
      try {localStorage.setItem(DRAFT_KEY,JSON.stringify(buildProjectData()));} catch(_) {toast('toast.draftStorage','error');}
      updateRecoveryUI();
    }

    function scheduleDraftSave() {
      window.clearTimeout(draftTimer);
      draftTimer=window.setTimeout(saveDraftNow,500);
    }

    function clearDraft() {
      try {localStorage.removeItem(DRAFT_KEY);} catch(_) {}
      updateRecoveryUI();toast('toast.draftCleared','success');setStatus('status.draftCleared');
    }

    async function restoreDraft() {
      try {
        const raw=localStorage.getItem(DRAFT_KEY);if(!raw)throw new Error('missing');
        const file=new File([raw],t('project.recoveryFile'),{type:'application/json'});
        await loadProjectFile(file,{skipConfirm:true,fromDraft:true});
      } catch(_) {clearDraft();toast('toast.draftInvalid','error');}
    }

    async function saveBlobToDevice(blob,filename) {
      if(typeof window.showSaveFilePicker==='function'){
        try {
          const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:t('project.fileDescription'),accept:{'application/json':['.json']}}]});
          const writable=await handle.createWritable();await writable.write(blob);await writable.close();return 'confirmed';
        } catch(error) {if(error?.name==='AbortError')return 'cancelled';}
      }
      downloadBlob(blob,filename);return 'started';
    }

    async function saveProject() {
      const chosen=window.prompt(t('prompt.projectName'),els.projectTitle.textContent||t('project.defaultName'));
      if(chosen===null)return false;
      const title=safeFileStem(chosen,t('project.defaultName'));els.projectTitle.textContent=title;
      const blob=new Blob([JSON.stringify(buildProjectData(title),null,2)],{type:'application/json'});
      const result=await saveBlobToDevice(blob,`${title}.bead.json`);
      if(result==='cancelled')return false;
      saveDraftNow();
      if(result==='confirmed'){
        state.dirty=false;toast('toast.projectSaved','success');setStatus('status.projectSaved');
      }else{
        toast('toast.projectDownloadStarted','success');setStatus('status.projectDownloadStarted');
      }
      return true;
    }

    async function loadProjectFile(file,{skipConfirm=false,fromDraft=false}={}) {
      if(!skipConfirm&&state.dirty&&state.grid.some(value=>value>=0)&&!window.confirm(t('confirm.loadProject'))){els.projectInput.value='';return false;}
      const loadJob=++state.sourceLoadJob;
      invalidateConversion();
      setConversionModal(false,{restoreFocus:false});
      try {
        if(!file||file.size>2*1024*1024) throw new Error('size');
        const text=await file.text();
        if(loadJob!==state.sourceLoadJob)return;
        const project=JSON.parse(text);
        if(project.type!=='bead-grid-studio'||![1,PROJECT_VERSION].includes(project.version)) throw new Error('version');
        const cols=project.grid?.cols,rows=project.grid?.rows;
        if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<4||cols>160||rows<4||rows>160) throw new Error('dimensions');
        if(!Array.isArray(project.grid?.cells)||project.grid.cells.length!==cols*rows) throw new Error('cells');
        const legacy=project.version===1&&project.palette==='universal-screen-64-v1';
        const colorByCode=new Map(PALETTE.map(color=>[color.code,color.index]));
        const cells=project.grid.cells.map((value,index)=>{
          if(value===null)return -1;
          if(typeof value!=='string')throw new Error(`color:${index}`);
          if(legacy){if(!LEGACY_TO_MARD.has(value))throw new Error(`color:${index}`);return LEGACY_TO_MARD.get(value);}
          if(!colorByCode.has(value))throw new Error(`color:${index}`);
          return colorByCode.get(value);
        });
        state.cols=cols;state.rows=rows;state.grid=Int16Array.from(cells);
        const settings=project.settings||{};
        state.selectedColor=legacy?(PALETTE.find(color=>color.code==='H7')?.index??0):(colorByCode.get(settings.selectedColorCode)??Math.round(clamp(settings.selectedColor??0,0,PALETTE.length-1)));
        state.previewMode=['square','bead'].includes(settings.previewMode)?settings.previewMode:'square';
        state.showGrid=settings.showGrid!==false;state.showRulers=settings.showRulers!==false;state.showCodes=Boolean(settings.showCodes);
        state.zoom=clamp(settings.zoom??1,.0625,2);state.paletteMode='mard221';state.paletteSeries='all';state.maxColors=Math.round(clamp(settings.maxColors??32,2,64));state.mergeStrength=Math.round(clamp(settings.mergeStrength??10,0,30));state.protectDark=settings.protectDark!==false;state.sizeMode=settings.sizeMode==='board'?'board':'pattern';state.aspectLock=settings.aspectLock!==false;state.boardProfile=BOARD_PROFILES[settings.boardProfile]?settings.boardProfile:'mini52';state.boardTilesX=Math.max(1,Math.round(settings.boardTilesX||1));state.boardTilesY=Math.max(1,Math.round(settings.boardTilesY||1));state.majorGridStep=[5,10,29].includes(Number(settings.majorGridStep))?Number(settings.majorGridStep):10;
        els.processMode.value=['cartoon','detail','document','photo','pixel'].includes(settings.processMode)?settings.processMode:'cartoon';
        els.processModeHint.textContent=modeHint(els.processMode.value);els.fitMode.value=settings.fitMode==='contain'?'contain':'cover';els.whiteMode.value=settings.whiteMode==='keep'?'keep':'auto';
        els.maxColors.value=state.maxColors;els.maxColorsValue.textContent=t('unit.colorsValue',{count:state.maxColors});els.mergeStrength.value=state.mergeStrength;els.mergeStrengthValue.textContent=state.mergeStrength;els.protectDark.checked=state.protectDark;els.aspectLock.checked=state.aspectLock;els.boardProfile.value=state.boardProfile;els.majorGridStep.value=state.majorGridStep;els.gridCols.value=cols;els.gridRows.value=rows;
        els.projectTitle.textContent=String(project.title||file.name.replace(/\.bead\.json$|\.json$/i,'')).slice(0,80)||t('project.importedName');
        setProjectSubtitle('project.loadedSubtitle');
        state.referenceImage?.close?.();state.referenceImage=null;state.referenceRaster=null;state.referenceTransforms=[];state.referenceFileName='';state.referenceSourceWidth=0;state.referenceSourceHeight=0;state.sourceAnalysis=null;state.lastConversionDiagnostics=null;state.crop={x:0,y:0,w:1,h:1};state.cropPreview=null;state.cropPreviewBase=null;state.smartMode=false;state.smartPhase='custom';els.fileMeta.hidden=true;els.smartCard.hidden=true;els.detailAdvice.hidden=true;els.stageQualityBanner.hidden=true;els.convertBtn.disabled=true;
        resetHistory();renderPalette();updateSelectedColor();syncSizeModeUI();syncAspectStatus();renderAll();state.dirty=Boolean(fromDraft);
        if(fromDraft)toast('toast.projectRestored','success');else toast(legacy?'toast.projectMigrated':'toast.projectLoaded','success');
        setStatus(fromDraft?'status.projectRestored':'status.projectLoaded',fromDraft?{cols,rows}:{cols,rows,migration:legacy?t('status.projectMigration'):''});updateRecoveryUI();
      }catch(error){if(loadJob!==state.sourceLoadJob)return;toast(error.message==='size'?'toast.projectTooLarge':'toast.projectInvalid','error');setStatus('status.projectLoadFailed');}
      finally{els.projectInput.value='';}
    }

    function buildPrintTileCanvas(startX,startY,cols,rows,pageNumber,pageCount) {
      const cell=28,ruler=34,titleH=68,footerPad=28,counts=new Map();
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const value=state.grid[(startY+y)*state.cols+startX+x];if(value>=0)counts.set(value,(counts.get(value)||0)+1);
      }
      const entries=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0]),legendCols=Math.max(1,Math.min(6,entries.length||1));
      const legendRows=Math.ceil(entries.length/legendCols),boardW=cols*cell,boardH=rows*cell,width=Math.max(760,ruler*2+boardW),legendH=entries.length?44+legendRows*34:42;
      const height=titleH+ruler+boardH+ruler+legendH+footerPad,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d'),ox=Math.floor((width-boardW)/2),oy=titleH+ruler;
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
      ctx.fillStyle='#1f211f';ctx.font='800 20px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(t('print.pageTitle',{title:els.projectTitle.textContent||t('file.patternFallback'),page:pageNumber,pages:pageCount}),16,23);
      ctx.fillStyle='#626661';ctx.font='12px system-ui,"Microsoft YaHei",sans-serif';ctx.fillText(t('print.pageSubtitle',{cols:state.cols,rows:state.rows,startCol:startX+1,endCol:startX+cols,startRow:startY+1,endRow:startY+rows}),16,48);
      ctx.fillStyle='#d9def3';ctx.fillRect(ox,oy-ruler,boardW,ruler);ctx.fillRect(ox,oy+boardH,boardW,ruler);ctx.fillRect(ox-ruler,oy,ruler,boardH);ctx.fillRect(ox+boardW,oy,ruler,boardH);
      ctx.fillStyle='#27304d';ctx.font='800 9px ui-monospace,SFMono-Regular,Consolas,monospace';ctx.textAlign='center';
      for(let x=0;x<cols;x++){const label=String(startX+x+1),cx=ox+x*cell+cell/2;ctx.fillText(label,cx,oy-ruler/2);ctx.fillText(label,cx,oy+boardH+ruler/2);}
      for(let y=0;y<rows;y++){const label=String(startY+y+1),cy=oy+y*cell+cell/2;ctx.fillText(label,ox-ruler/2,cy);ctx.fillText(label,ox+boardW+ruler/2,cy);}
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const value=state.grid[(startY+y)*state.cols+startX+x],color=value>=0?PALETTE[value]:null,px=ox+x*cell,py=oy+y*cell;
        ctx.fillStyle=color?color.displayHex:'#fff';ctx.fillRect(px,py,cell,cell);ctx.strokeStyle='#a5a8a4';ctx.lineWidth=.7;ctx.strokeRect(px+.35,py+.35,cell,cell);
        if(color){ctx.fillStyle=colorText(color.displayHex);ctx.font='800 9px ui-monospace,SFMono-Regular,Consolas,monospace';ctx.fillText(color.code,px+cell/2,py+cell/2+.25);}
      }
      const major=state.majorGridStep,profile=BOARD_PROFILES[state.boardProfile]||BOARD_PROFILES.mini52;
      ctx.save();
      for(let x=0;x<=cols;x++){
        const global=startX+x,isEdge=x===0||x===cols,isBoard=state.sizeMode==='board'&&global%profile.cells===0,isMajor=global%major===0;
        if(!isEdge&&!isBoard&&!isMajor)continue;ctx.strokeStyle=isBoard?'#7d2d20':'#1c1f1d';ctx.lineWidth=isBoard?5:isEdge?3:2.4;ctx.beginPath();ctx.moveTo(ox+x*cell,oy);ctx.lineTo(ox+x*cell,oy+boardH);ctx.stroke();
      }
      for(let y=0;y<=rows;y++){
        const global=startY+y,isEdge=y===0||y===rows,isBoard=state.sizeMode==='board'&&global%profile.cells===0,isMajor=global%major===0;
        if(!isEdge&&!isBoard&&!isMajor)continue;ctx.strokeStyle=isBoard?'#7d2d20':'#1c1f1d';ctx.lineWidth=isBoard?5:isEdge?3:2.4;ctx.beginPath();ctx.moveTo(ox,oy+y*cell);ctx.lineTo(ox+boardW,oy+y*cell);ctx.stroke();
      }
      ctx.restore();
      const legendY=oy+boardH+ruler+24,itemW=(width-32)/legendCols;
      ctx.fillStyle='#232623';ctx.font='800 13px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.fillText(t('print.materials'),16,legendY-9);
      entries.forEach(([index,count],i)=>{const col=i%legendCols,row=Math.floor(i/legendCols),x=16+col*itemW,y=legendY+row*34,color=PALETTE[index];ctx.fillStyle=color.displayHex;ctx.fillRect(x,y,26,26);ctx.strokeStyle='#606360';ctx.strokeRect(x+.5,y+.5,25,25);ctx.fillStyle=colorText(color.displayHex);ctx.font='800 8px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(color.code,x+13,y+13);ctx.fillStyle='#292b29';ctx.font='700 10px system-ui,"Microsoft YaHei",sans-serif';ctx.textAlign='left';ctx.fillText(t('print.count',{code:color.code,count:formatNumber(count)}),x+34,y+13);});
      return canvas;
    }

    async function printPreview() {
      if(state.exporting)return;
      const large=Math.max(state.cols,state.rows)>60,tileSpan=state.sizeMode==='board'?Math.min(52,(BOARD_PROFILES[state.boardProfile]||BOARD_PROFILES.mini52).cells):50;
      const pagesX=large?Math.ceil(state.cols/tileSpan):1,pagesY=large?Math.ceil(state.rows/tileSpan):1,pageCount=pagesX*pagesY;
      if(large&&!window.confirm(t('confirm.printPages',{cols:state.cols,rows:state.rows,span:tileSpan,pages:pageCount})))return;
      setExportBusy(true);
      try {
        els.printPages.replaceChildren();
        if(!large){els.printImage.hidden=false;els.printImage.src=buildExportCanvas().toDataURL('image/png');if(typeof els.printImage.decode==='function')await els.printImage.decode();}
        else{
          els.printImage.hidden=true;let page=0;
          for(let py=0;py<pagesY;py++)for(let px=0;px<pagesX;px++){
            const startX=px*tileSpan,startY=py*tileSpan,cols=Math.min(tileSpan,state.cols-startX),rows=Math.min(tileSpan,state.rows-startY);
            els.printPages.appendChild(buildPrintTileCanvas(startX,startY,cols,rows,++page,pageCount));
            await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
          }
        }
        setStatus('status.printReady',{count:pageCount});window.print();
      }catch(error){toast('toast.printFailed','error');setStatus('status.printFailed');}
      finally{setExportBusy(false);window.setTimeout(()=>{els.printPages.replaceChildren();els.printImage.removeAttribute('src');},0);}
    }

    let mobilePanelTrigger=null;

    function syncMobilePanelInert() {
      const mobile=window.matchMedia('(max-width: 959px)').matches;
      document.querySelectorAll('.side-panel').forEach(panel=>{
        const available=!mobile||panel.dataset.mobileOpen==='true';
        if(available)panel.removeAttribute('inert');else panel.setAttribute('inert','');
        if(mobile)panel.setAttribute('aria-hidden',String(!available));else panel.removeAttribute('aria-hidden');
      });
    }

    function trapMobilePanelFocus(event) {
      if(event.key!=='Tab'||!window.matchMedia('(max-width: 959px)').matches)return false;
      const panel=[...document.querySelectorAll('.side-panel')].find(item=>item.dataset.mobileOpen==='true');if(!panel)return false;
      const focusable=[...panel.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.getClientRects().length);
      if(!focusable.length)return false;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();return true;}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();return true;}
      return false;
    }

    function openMobilePanel(targetId) {
      const section=document.getElementById(targetId);
      const panel=section?.closest('.side-panel')||section;
      mobilePanelTrigger=document.activeElement instanceof HTMLElement?document.activeElement:null;
      document.querySelectorAll('.side-panel').forEach(item=>item.dataset.mobileOpen='false');
      document.querySelectorAll('[data-mobile-target]').forEach(btn=>btn.setAttribute('aria-pressed','false'));
      if(panel){panel.dataset.mobileOpen='true';els.mobileScrim.classList.add('is-visible');const button=document.querySelector(`[data-mobile-target="${targetId}"]`);button?.setAttribute('aria-pressed','true');syncMobilePanelInert();requestAnimationFrame(()=>{panel.querySelector('.sheet-close')?.focus();if(section!==panel)section.scrollIntoView({block:'start'});});}
    }

    function closeMobilePanels({restoreFocus=true}={}){const hadOpen=[...document.querySelectorAll('.side-panel')].some(item=>item.dataset.mobileOpen==='true');document.querySelectorAll('.side-panel').forEach(item=>item.dataset.mobileOpen='false');document.querySelectorAll('[data-mobile-target]').forEach(btn=>btn.setAttribute('aria-pressed','false'));els.mobileScrim.classList.remove('is-visible');syncMobilePanelInert();if(hadOpen&&restoreFocus)requestAnimationFrame(()=>mobilePanelTrigger?.focus?.());}

    function runSelfTests() {
      const tests=[];
      const test=(name,condition)=>tests.push({name,pass:Boolean(condition)});
      const original=Int16Array.from([0,1,2,3,4,5]);
      const rotated=transformCells(original,2,3,'rotate');
      test('矩形顺时针旋转',rotated.cols===3&&rotated.rows===2&&Array.from(rotated.cells).join(',')==='4,2,0,5,3,1');
      let fourTurns={cells:original,cols:2,rows:3};
      for(let i=0;i<4;i++)fourTurns=transformCells(fourTurns.cells,fourTurns.cols,fourTurns.rows,'rotate');
      test('连续旋转四次回到原图',fourTurns.cols===2&&fourTurns.rows===3&&Array.from(fourTurns.cells).join(',')===Array.from(original).join(','));
      const mirrored=transformCells(transformCells(original,2,3,'mirrorH').cells,2,3,'mirrorH');
      test('水平镜像两次回到原图',Array.from(mirrored.cells).join(',')===Array.from(original).join(','));

      const solidRed=new Uint8ClampedArray(4*4*4);
      for(let i=0;i<16;i++){solidRed[i*4]=220;solidRed[i*4+1]=40;solidRed[i*4+2]=50;solidRed[i*4+3]=255;}
      const redResult=convertPixels({data:solidRed,width:4,height:4,cols:1,rows:1,palette:[{index:0,lab:rgbToOklab([220,40,50])},{index:1,lab:rgbToOklab([20,60,190])}],maxColors:2,whiteMode:'keep'});
      test('纯红图稳定映射为红色',new Int16Array(redResult.buffer)[0]===0);

      const transparent=new Uint8ClampedArray(4*4*4);
      const transparentResult=convertPixels({data:transparent,width:4,height:4,cols:1,rows:1,palette:[{index:0,lab:rgbToOklab([255,255,255])}],maxColors:2,whiteMode:'auto'});
      test('透明图保持空格',new Int16Array(transparentResult.buffer)[0]===-1);

      // JPEG 压缩或环境反光会让黑色带少量蓝灰偏色；开启保护时仍应落在中性色阶。
      const tintedBlack=new Uint8ClampedArray(4*4*4);
      for(let i=0;i<16;i++)tintedBlack.set([54,68,78,255],i*4);
      const tintedBlackPalette=[
        {index:0,rgb:[47,51,50],lab:rgbToOklab([47,51,50])},
        {index:1,rgb:[41,59,104],lab:rgbToOklab([41,59,104])}
      ];
      const tintedBlackResult=convertPixels({data:tintedBlack,width:4,height:4,cols:1,rows:1,palette:tintedBlackPalette,maxColors:2,whiteMode:'keep',processMode:'photo',mergeStrength:0,protectDark:true});
      test('带轻微偏色的黑色仍匹配中性色',new Int16Array(tintedBlackResult.buffer)[0]===0);

      const detailBlackPalette=[
        {index:0,rgb:[47,51,50],lab:rgbToOklab([47,51,50])},
        {index:1,rgb:[41,59,104],lab:rgbToOklab([41,59,104])},
        {index:2,rgb:[94,98,95],lab:rgbToOklab([94,98,95])}
      ];
      const detailBlackPair=new Uint8ClampedArray(8*4*4);
      for(let y=0;y<4;y++)for(let x=0;x<8;x++)detailBlackPair.set([...(x<4?[54,68,78]:[75,75,65]),255],(y*8+x)*4);
      const detailBlackResult=convertPixels({data:detailBlackPair,width:8,height:4,cols:2,rows:1,palette:detailBlackPalette,maxColors:3,whiteMode:'keep',processMode:'detail',mergeStrength:0,protectDark:true});
      test('高清锐化不会把受保护的蓝灰黑重新推成深蓝',new Int16Array(detailBlackResult.buffer)[0]===0);

      // 真正有明确色相的深蓝、深咖和深紫不能被“黑色保护”误压成黑色。
      const deepRgb=[[32,42,48],[58,41,36],[41,59,104],[34,45,85],[73,51,85]];
      const deepPalette=deepRgb.map((rgb,index)=>({index,rgb,lab:rgbToOklab(rgb)}));
      const deepPixels=new Uint8ClampedArray(20*4*4);
      deepRgb.forEach((rgb,cell)=>{for(let y=0;y<4;y++)for(let x=0;x<4;x++)deepPixels.set([...rgb,255],(y*20+cell*4+x)*4);});
      const deepResult=convertPixels({data:deepPixels,width:20,height:4,cols:5,rows:1,palette:deepPalette,maxColors:5,whiteMode:'keep',processMode:'cartoon',mergeStrength:0,protectDark:true});
      test('真实深色仍保留蓝黑深咖深紫色相',Array.from(new Int16Array(deepResult.buffer)).join(',')==='0,1,2,3,4');

      const enclosed=new Uint8ClampedArray(5*5*4);
      for(let y=0;y<5;y++)for(let x=0;x<5;x++){
        const p=(y*5+x)*4;
        const isRing=x>=1&&x<=3&&y>=1&&y<=3&&(x===1||x===3||y===1||y===3);
        const v=isRing?20:250;
        enclosed[p]=v;enclosed[p+1]=v;enclosed[p+2]=v;enclosed[p+3]=255;
      }
      const enclosedResult=convertPixels({data:enclosed,width:5,height:5,cols:5,rows:5,palette:[{index:0,lab:rgbToOklab([250,250,250])},{index:1,lab:rgbToOklab([20,20,20])}],maxColors:2,whiteMode:'auto'});
      const enclosedGrid=new Int16Array(enclosedResult.buffer);
      test('边界白底留空',enclosedGrid[0]===-1);
      test('被轮廓包围的白色保留',enclosedGrid[12]===0);

      // 卡通图不能把一格里的细黑线与白底平均成灰或白。
      const linePatch=new Uint8ClampedArray(4*4*4);
      for(let y=0;y<4;y++)for(let x=0;x<4;x++){
        const p=(y*4+x)*4,v=x===0?10:246;
        linePatch[p]=v;linePatch[p+1]=v;linePatch[p+2]=v;linePatch[p+3]=255;
      }
      const linePalette=[
        {index:0,rgb:[12,12,12],lab:rgbToOklab([12,12,12])},
        {index:1,rgb:[138,138,138],lab:rgbToOklab([138,138,138])},
        {index:2,rgb:[247,247,247],lab:rgbToOklab([247,247,247])}
      ];
      const lineResult=convertPixels({data:linePatch,width:4,height:4,cols:1,rows:1,palette:linePalette,maxColors:3,whiteMode:'keep',processMode:'cartoon'});
      test('卡通模式保留占格四分之一的黑线',new Int16Array(lineResult.buffer)[0]===0);
      const monotonicOutline=[4,5,6,7,8].map(blackCount=>{
        const patch=new Uint8ClampedArray(4*4*4);
        for(let i=0;i<16;i++)patch.set([246,246,246,255],i*4);
        for(let i=0;i<blackCount;i++){
          const x=Math.floor(i/4),y=i%4,p=(y*4+x)*4;
          patch.set([10,10,10,255],p);
        }
        const result=convertPixels({data:patch,width:4,height:4,cols:1,rows:1,palette:linePalette,maxColors:3,whiteMode:'keep',processMode:'cartoon'});
        return new Int16Array(result.buffer)[0];
      });
      test('黑色覆盖率从四到八个采样点不会反向丢线',monotonicOutline.every(value=>value===0));

      // 像素直采应读取格子中心，而不是把中心色与周围颜色混合。
      const pixelPatch=new Uint8ClampedArray(3*3*4);
      for(let i=0;i<9;i++){
        const p=i*4,isCenter=i===4;
        pixelPatch[p]=isCenter?20:230;pixelPatch[p+1]=40;pixelPatch[p+2]=isCenter?220:45;pixelPatch[p+3]=255;
      }
      const pixelPalette=[
        {index:0,rgb:[230,40,45],lab:rgbToOklab([230,40,45])},
        {index:1,rgb:[20,40,220],lab:rgbToOklab([20,40,220])}
      ];
      const pixelResult=convertPixels({data:pixelPatch,width:3,height:3,cols:1,rows:1,palette:pixelPalette,maxColors:2,whiteMode:'keep',processMode:'pixel'});
      test('像素直采保留中心像素颜色',new Int16Array(pixelResult.buffer)[0]===1);

      // “最多用色”是上限，不应为了凑数把平滑过渡拆成无意义的新色。
      const simpleBlocks=new Uint8ClampedArray(8*4*4);
      for(let y=0;y<4;y++)for(let x=0;x<8;x++){
        const p=(y*8+x)*4,isRed=x<4;
        simpleBlocks[p]=isRed?232:24;simpleBlocks[p+1]=isRed?43:116;simpleBlocks[p+2]=isRed?55:184;simpleBlocks[p+3]=255;
      }
      const simplePalette=[
        {index:0,rgb:[232,43,55],lab:rgbToOklab([232,43,55])},
        {index:1,rgb:[24,116,184],lab:rgbToOklab([24,116,184])},
        {index:2,rgb:[175,60,90],lab:rgbToOklab([175,60,90])},
        {index:3,rgb:[65,102,142],lab:rgbToOklab([65,102,142])}
      ];
      const simpleResult=convertPixels({data:simpleBlocks,width:8,height:4,cols:2,rows:1,palette:simplePalette,maxColors:4,whiteMode:'keep',processMode:'cartoon'});
      test('简单双色图不会被算法扩成四种色',simpleResult.selected.length===2);

      const kittyRgb=[[20,23,22],[150,153,147],[247,244,234],[185,47,59],[247,207,71],[67,142,187],[247,196,198],[198,230,234],[117,80,59]];
      const kittyPalette=kittyRgb.map((rgb,index)=>({index,rgb,lab:rgbToOklab(rgb)}));
      const solidRgba=(width,height,rgb=[250,250,250])=>{
        const out=new Uint8ClampedArray(width*height*4);
        for(let i=0;i<width*height;i++)out.set([rgb[0],rgb[1],rgb[2],255],i*4);
        return out;
      };
      const putPixel=(pixels,width,x,y,rgb)=>pixels.set([rgb[0],rgb[1],rgb[2],255],(y*width+x)*4);

      const blackSpeck=solidRgba(4,4);
      putPixel(blackSpeck,4,1,1,kittyRgb[0]);
      const speckResult=convertPixels({data:blackSpeck,width:4,height:4,cols:1,rows:1,palette:kittyPalette,maxColors:9,whiteMode:'auto',processMode:'cartoon'});
      test('孤立黑噪点不会膨胀为黑线',new Int16Array(speckResult.buffer)[0]!==0);

      const thinRing=solidRgba(20,20);
      for(let x=4;x<=15;x++){putPixel(thinRing,20,x,6,kittyRgb[0]);putPixel(thinRing,20,x,13,kittyRgb[0]);}
      for(let y=4;y<=15;y++){putPixel(thinRing,20,6,y,kittyRgb[0]);putPixel(thinRing,20,13,y,kittyRgb[0]);}
      const ringResult=convertPixels({data:thinRing,width:20,height:20,cols:5,rows:5,palette:kittyPalette,maxColors:9,whiteMode:'auto',processMode:'cartoon'});
      const ringGrid=new Int16Array(ringResult.buffer),ringCells=[6,7,8,11,13,16,17,18];
      test('细轮廓外部白底保持空格',ringGrid[0]===-1&&ringGrid[4]===-1&&ringGrid[20]===-1&&ringGrid[24]===-1);
      test('细轮廓包围的白色主体保留',ringGrid[12]===2);
      test('闭合细轮廓不产生中灰断带',ringCells.every(cell=>ringGrid[cell]===0));

      const detailCounts=[20,15,40,8,1,4,10,2,0],detailIds=[];
      detailCounts.forEach((count,id)=>{for(let i=0;i<count;i++)detailIds.push(id);});
      const detailPixels=new Uint8ClampedArray(40*40*4);
      detailIds.forEach((id,cell)=>{
        const cx=cell%10,cy=Math.floor(cell/10),rgb=kittyRgb[id];
        for(let y=0;y<4;y++)for(let x=0;x<4;x++)putPixel(detailPixels,40,cx*4+x,cy*4+y,rgb);
      });
      const detailPayload=()=>({data:detailPixels.slice(),width:40,height:40,cols:10,rows:10,palette:kittyPalette,maxColors:6,whiteMode:'keep',processMode:'cartoon',mergeStrength:10});
      const detailA=convertPixels(detailPayload()),detailB=convertPixels(detailPayload()),detailC=convertPixels(detailPayload());
      const detailUsed=new Set(new Int16Array(detailA.buffer));
      test('限色结果严格不超过六色',detailA.selected.length<=6);
      test('限色仍保留红黄蓝语义细节',detailUsed.has(3)&&detailUsed.has(4)&&detailUsed.has(5));
      const exact=(a,b)=>a.length===b.length&&a.every((value,index)=>value===b[index]);
      test('同图同参数输出逐格确定',exact([...new Int16Array(detailA.buffer)],[...new Int16Array(detailB.buffer)])&&exact([...new Int16Array(detailA.buffer)],[...new Int16Array(detailC.buffer)])&&exact(detailA.selected,detailB.selected)&&exact(detailA.selected,detailC.selected));

      const neutralLimitPalette=[
        {index:0,rgb:[145,145,145],lab:rgbToOklab([145,145,145])},
        {index:1,rgb:[218,48,55],lab:rgbToOklab([218,48,55])},
        {index:2,rgb:[40,92,205],lab:rgbToOklab([40,92,205])}
      ];
      const neutralLimitPixels=new Uint8ClampedArray(40*40*4);
      for(let cell=0;cell<100;cell++){
        const rgb=cell===0?neutralLimitPalette[0].rgb:cell<50?neutralLimitPalette[1].rgb:neutralLimitPalette[2].rgb;
        const cx=cell%10,cy=Math.floor(cell/10);
        for(let y=0;y<4;y++)for(let x=0;x<4;x++)putPixel(neutralLimitPixels,40,cx*4+x,cy*4+y,rgb);
      }
      const neutralLimitResult=convertPixels({data:neutralLimitPixels,width:40,height:40,cols:10,rows:10,palette:neutralLimitPalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0});
      test('最终限色不会把中性色并入高彩色',new Int16Array(neutralLimitResult.buffer)[0]===0&&neutralLimitResult.selected.length<=2);

      const rareBlackPalette=[
        {index:0,rgb:[20,23,22],lab:rgbToOklab([20,23,22])},
        {index:1,rgb:[32,42,48],lab:rgbToOklab([32,42,48])},
        {index:2,rgb:[73,51,85],lab:rgbToOklab([73,51,85])}
      ];
      const rareBlackPixels=new Uint8ClampedArray(40*40*4);
      for(let cell=0;cell<100;cell++){
        const rgb=cell===0?rareBlackPalette[0].rgb:cell<81?rareBlackPalette[1].rgb:rareBlackPalette[2].rgb,cx=cell%10,cy=Math.floor(cell/10);
        for(let y=0;y<4;y++)for(let x=0;x<4;x++)putPixel(rareBlackPixels,40,cx*4+x,cy*4+y,rgb);
      }
      const rareBlackResult=convertPixels({data:rareBlackPixels,width:40,height:40,cols:10,rows:10,palette:rareBlackPalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0,protectDark:true});
      test('限色时少量真正黑色不会被深蓝或紫色吞掉',new Int16Array(rareBlackResult.buffer)[0]===0&&rareBlackResult.selected.includes(0)&&rareBlackResult.selected.length<=2);

      // 同一纯色块按 1× 与 10× 分辨率输入，应得到完全相同的豆格，防止抽样步长改变结果。
      const scalePalette=[[20,23,22],[210,52,62],[55,132,188],[247,244,234]].map((rgb,index)=>({index,rgb,lab:rgbToOklab(rgb)}));
      const scaleSmall=new Uint8ClampedArray(4*4*4),scaleLarge=new Uint8ClampedArray(40*40*4);
      const scaleIds=[0,1,2,3];
      for(let y=0;y<4;y++)for(let x=0;x<4;x++){const id=scaleIds[Math.floor(y/2)*2+Math.floor(x/2)];scaleSmall.set([...scalePalette[id].rgb,255],(y*4+x)*4);}
      for(let y=0;y<40;y++)for(let x=0;x<40;x++){const id=scaleIds[Math.floor(y/20)*2+Math.floor(x/20)];scaleLarge.set([...scalePalette[id].rgb,255],(y*40+x)*4);}
      const scalePayload=(data,width,height)=>({data,width,height,cols:2,rows:2,palette:scalePalette,maxColors:4,whiteMode:'keep',processMode:'cartoon',mergeStrength:0,protectDark:true});
      test('高清全采样不随源图缩放改变纯色结果',Array.from(new Int16Array(convertPixels(scalePayload(scaleSmall,4,4)).buffer)).join(',')===Array.from(new Int16Array(convertPixels(scalePayload(scaleLarge,40,40)).buffer)).join(','));

      // 文档模式：长框线、斜线与大色块应保留，碎文字不得膨胀成黑色条带。
      const docRgb=[[20,20,20],[247,247,247],[218,48,55],[40,92,205],[145,145,145]];
      const docPalette=docRgb.map((rgb,index)=>({index,rgb,lab:rgbToOklab(rgb)}));
      const makeDoc=(w,h,rgb=[250,250,250])=>{const out=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)out.set([...rgb,255],i*4);return out;};
      const docPut=(pixels,w,x,y,rgb)=>pixels.set([...rgb,255],(y*w+x)*4);
      const docH=(pixels,w,x0,x1,y,rgb)=>{for(let x=x0;x<=x1;x++)docPut(pixels,w,x,y,rgb);};
      const docV=(pixels,w,x,y0,y1,rgb)=>{for(let row=y0;row<=y1;row++)docPut(pixels,w,x,row,rgb);};
      const docRect=(pixels,w,x0,y0,x1,y1,rgb)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)docPut(pixels,w,x,y,rgb);};
      const docFixture=makeDoc(120,120);
      docH(docFixture,120,10,109,15,docRgb[0]);docH(docFixture,120,10,109,104,docRgb[0]);docV(docFixture,120,15,10,109,docRgb[0]);docV(docFixture,120,104,10,109,docRgb[0]);
      for(const baseY of [32,42,52])for(let x=24;x<96;x+=6){docV(docFixture,120,x,baseY,baseY+3,docRgb[0]);docH(docFixture,120,x,x+2,baseY,docRgb[0]);}
      docRect(docFixture,120,70,70,99,99,docRgb[2]);
      const documentPayload=()=>({data:docFixture.slice(),width:120,height:120,cols:12,rows:12,palette:docPalette,maxColors:6,whiteMode:'auto',processMode:'document',mergeStrength:0});
      const documentA=convertPixels(documentPayload()),documentGrid=new Int16Array(documentA.buffer);
      let documentBorderHits=0;for(let x=1;x<=10;x++){documentBorderHits+=documentGrid[12+x]===0;documentBorderHits+=documentGrid[120+x]===0;}for(let y=1;y<=10;y++){documentBorderHits+=documentGrid[y*12+1]===0;documentBorderHits+=documentGrid[y*12+10]===0;}
      test('文档模式保留细框线',documentBorderHits>=32);
      test('文档模式压制碎文字条带',[3,4,5].every(row=>documentGrid.slice(row*12+2,row*12+10).every(value=>value!==0)));
      test('文档自动白底在框内也留空',documentGrid[6*12+6]===-1);
      let redBlockHits=0;for(let y=7;y<=9;y++)for(let x=7;x<=9;x++)redBlockHits+=documentGrid[y*12+x]===2;
      test('文档模式保留大面积彩色图块',redBlockHits>=8);

      const diagonal=makeDoc(100,100);
      for(let i=5;i<95;i++){docPut(diagonal,100,i,i,docRgb[0]);docPut(diagonal,100,Math.min(99,i+1),i,docRgb[0]);}
      const diagonalResult=convertPixels({data:diagonal,width:100,height:100,cols:10,rows:10,palette:docPalette,maxColors:4,whiteMode:'auto',processMode:'document',mergeStrength:0});
      const diagonalGrid=new Int16Array(diagonalResult.buffer);let diagonalHits=0,totalDiagonalInk=0;
      for(let y=0;y<10;y++)for(let x=0;x<10;x++)if(diagonalGrid[y*10+x]===0){totalDiagonalInk++;if(x===y)diagonalHits++;}
      test('文档模式保留连续细斜线',diagonalHits>=8&&totalDiagonalInk-diagonalHits<=6);

      const documentAnalysis=analyzeSourceComplexity({data:docFixture,width:120,height:120,sourceWidth:5680,sourceHeight:5568});
      test('复杂度检测识别白底密集文档',documentAnalysis.likelyDocument&&documentAnalysis.documentScore>=.60);
      const flatArt=makeDoc(64,64,docRgb[2]);docRect(flatArt,64,32,0,63,63,docRgb[3]);
      test('复杂度检测不误判两块纯色图',!analyzeSourceComplexity({data:flatArt,width:64,height:64}).likelyDocument);
      const mascotArt=makeDoc(64,64);docRect(mascotArt,64,12,12,50,50,docRgb[0]);docRect(mascotArt,64,26,20,44,35,docRgb[2]);
      test('复杂度检测不误判白底大轮廓卡通',!analyzeSourceComplexity({data:mascotArt,width:64,height:64}).likelyDocument);
      const recommendation=recommendDocumentGrid({width:5680,height:5568,maxSide:100,analysis:{likelyDocument:true,medianGlyphHeightPx:28}});
      test('论文尺寸建议保持比例并诚实标记不可读',recommendation.cols===100&&recommendation.rows===98&&recommendation.requiredTextLongSide===812&&!recommendation.textReadable&&recommendation.structuralOnly);
      const portraitSmart=recommendAutoHdSettings({width:3680,height:6528,analysis:{likelyPhoto:true,likelyDocument:false},quality:'ultra'});
      test('一键高清为竖版照片保持比例并使用160格长边',portraitSmart.cols===90&&portraitSmart.rows===160&&portraitSmart.processMode==='detail'&&portraitSmart.maxColors===48&&portraitSmart.protectDark);
      const cartoonSmart=recommendAutoHdSettings({width:800,height:800,analysis:{likelyPhoto:false,likelyDocument:false},quality:'ultra'});
      test('一键高清为卡通采用120格轮廓方案',cartoonSmart.cols===120&&cartoonSmart.rows===120&&cartoonSmart.processMode==='cartoon');
      const lineArtSmart=recommendAutoHdSettings({width:530,height:580,analysis:{likelyPhoto:false,likelyDocument:false,likelyLineArt:true},quality:'ultra'});
      test('简单黑白线稿一键采用60格小图精修方案',lineArtSmart.cols===55&&lineArtSmart.rows===60&&lineArtSmart.processMode==='cartoon'&&lineArtSmart.maxColors===16);
      const documentSmart=recommendAutoHdSettings({width:5680,height:5568,analysis:{likelyDocument:true,documentScore:.65,medianGlyphHeightPx:28},quality:'ultra'});
      test('一键模式不会把整页文档谎称为高清可读',documentSmart.cols===100&&documentSmart.rows===98&&documentSmart.processMode==='document'&&documentSmart.structuralOnly);
      const documentB=convertPixels(documentPayload());
      test('文档模式输出逐格确定',exact([...new Int16Array(documentA.buffer)],[...new Int16Array(documentB.buffer)])&&exact(documentA.selected,documentB.selected));
      const cropped=cropSourceRect(1000,800,{x:.25,y:.2,w:.5,h:.4});
      test('裁剪坐标精确映射到源图',cropped.x===250&&cropped.y===160&&cropped.w===500&&cropped.h===320);

      const batterySmall=gridForLongSide(5560,3992,24);
      test('宽图选择24格长边得到24×17而不是强制方形',batterySmall.cols===24&&batterySmall.rows===17);
      const portraitSmall=gridForLongSide(3992,5560,24),squareSmall=gridForLongSide(1000,1000,24);
      test('竖图与方图的长边尺寸保持方向和比例',portraitSmall.cols===17&&portraitSmall.rows===24&&squareSmall.cols===24&&squareSmall.rows===24);
      const board52=fitPatternInsideBoard(5560,3992,52,52),board104=fitPatternInsideBoard(5560,3992,104,104),board29=fitPatternInsideBoard(5560,3992,29,29);
      test('真实底板只决定容量，图案仍按原比例居中',board52.cols===52&&board52.rows===37&&board52.blankTop===7&&board52.blankBottom===8&&board104.cols===104&&board104.rows===75&&board29.cols===29&&board29.rows===21);
      const physical52=physicalBoardLayout('mini52',2,2,5560,3992),physical29=physicalBoardLayout('midi29',2,1,5560,3992);
      test('线下常见底板拼接规格换算准确',physical52.boardCols===104&&physical52.boardRows===104&&physical52.boardCount===4&&physical52.widthCm===28.8&&physical29.boardCols===58&&physical29.boardRows===29&&physical29.widthCm===29);
      const embedded=embedPatternGrid(Int16Array.from([1,2,3,4]),2,2,4,4,1,1);
      test('紧凑图案嵌入底板不会被重采样拉伸',embedded.length===16&&embedded[5]===1&&embedded[6]===2&&embedded[9]===3&&embedded[10]===4&&embedded.filter(value=>value>=0).length===4);
      const squareContain=fitGeometryMetrics(5560,3992,24,24,'contain'),squareCover=fitGeometryMetrics(5560,3992,24,24,'cover');
      test('方形底板会量化出真实留白或裁切比例',Math.abs(squareContain.contentRows-17.232)<.01&&Math.abs(squareContain.letterboxFraction-.282)<.002&&Math.abs(squareCover.cropFraction-.282)<.002);
      const smallPhotoQuality=assessPatternQuality({width:5560,height:3992,cols:24,rows:17,fitMode:'contain',analysis:{likelyPhoto:true}});
      test('小尺寸照片不会被误报为可直接高清制作',smallPhotoQuality.severeDetail&&smallPhotoQuality.lowDetail);
      const line24Quality=assessPatternQuality({width:530,height:580,cols:22,rows:24,fitMode:'contain',analysis:{likelyLineArt:true}}),line16Quality=assessPatternQuality({width:530,height:580,cols:15,rows:16,fitMode:'contain',analysis:{likelyLineArt:true}});
      test('24格简单线稿通过精修后不再显示矛盾的容量警告',!line24Quality.lowDetail&&line16Quality.lowDetail);
      const issueSummary=lineDetailIssues({lineUnrepresentableComponents:2,lineUnresolvedConflicts:1});
      test('细节提示同时统计无格位和未解的部件冲突',issueSummary.total===3&&issueSummary.missing===2&&issueSummary.collisions===1);
      test('EXIF旋转后的解码比例会纠正源宽高方向',orientedSourceDimensions({width:4032,height:3024},{width:756,height:1008}).width===3024&&orientedSourceDimensions({width:4032,height:3024},{width:756,height:1008}).height===4032);

      const alphaPalette=[
        {index:0,code:'H7',rgb:[0,0,0],lab:rgbToOklab([0,0,0])},
        {index:1,code:'H9',rgb:[237,237,237],lab:rgbToOklab([237,237,237])},
        {index:2,code:'H23',rgb:[154,157,148],lab:rgbToOklab([154,157,148])}
      ];
      const translucentBlack=new Uint8ClampedArray(4*4*4);for(let i=0;i<16;i++)translucentBlack.set([0,0,0,31],i*4);
      const translucentResult=convertPixels({data:translucentBlack,width:4,height:4,cols:1,rows:1,palette:alphaPalette,maxColors:3,whiteMode:'keep',processMode:'cartoon',mergeStrength:0,protectDark:true});
      test('半透明黑色按白底合成后的视觉灰度匹配而非误判纯黑',new Int16Array(translucentResult.buffer)[0]===1);

      const exactDarkPalette=[
        {index:0,code:'M12',rgb:[100,71,73],lab:rgbToOklab([100,71,73])},
        {index:1,code:'H5',rgb:[83,84,82],lab:rgbToOklab([83,84,82])}
      ];
      const exactDark=solidRgba(4,4,[100,71,73]);
      const exactDarkResult=convertPixels({data:exactDark,width:4,height:4,cols:1,rows:1,palette:exactDarkPalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0,protectDark:true});
      test('精确MARD深色不会被中性黑保护压成灰色',new Int16Array(exactDarkResult.buffer)[0]===0);

      const bucketPalette=getAllowedPalette().map(color=>({index:color.index,code:color.code,rgb:color.rgb,lab:color.lab,cieLab:color.cieLab}));
      const makeBucketPair=reverse=>{const out=new Uint8ClampedArray(8*4*4),colors=reverse?[[211,253,40],[210,254,41]]:[[210,254,41],[211,253,40]];for(let y=0;y<4;y++)for(let x=0;x<8;x++)out.set([...colors[x<4?0:1],255],(y*8+x)*4);return out;};
      const bucketAB=new Int16Array(convertPixels({data:makeBucketPair(false),width:8,height:4,cols:2,rows:1,palette:bucketPalette,maxColors:64,whiteMode:'keep',processMode:'cartoon',mergeStrength:0}).buffer);
      const bucketBA=new Int16Array(convertPixels({data:makeBucketPair(true),width:8,height:4,cols:2,rows:1,palette:bucketPalette,maxColors:64,whiteMode:'keep',processMode:'cartoon',mergeStrength:0}).buffer);
      test('相邻RGB的匹配结果不受扫描顺序影响',bucketAB[0]===bucketBA[1]&&bucketAB[1]===bucketBA[0]);

      const calibratedPalette=[
        {index:0,code:'H2',rgb:[254,255,255],lab:rgbToOklab([254,255,255])},
        {index:1,code:'H23',rgb:[154,157,148],lab:rgbToOklab([154,157,148])},
        {index:2,code:'H7',rgb:[0,0,0],lab:rgbToOklab([0,0,0])}
      ];
      const pureWhite=solidRgba(4,4,[255,255,255]);
      const pureWhiteResult=convertPixels({data:pureWhite,width:4,height:4,cols:1,rows:1,palette:calibratedPalette,maxColors:3,whiteMode:'keep',processMode:'cartoon',mergeStrength:0});
      test('纯白像素锁定为 MARD H2 而不是浅灰',new Int16Array(pureWhiteResult.buffer)[0]===0&&PALETTE.find(color=>color.code==='H2')?.displayHex==='#FFFFFF');

      const edgeArtifact=solidRgba(16,16,[255,255,255]);
      for(let x=0;x<16;x++)putPixel(edgeArtifact,16,x,0,[105,105,105]);
      for(let y=6;y<14;y++)for(let x=4;x<12;x++)putPixel(edgeArtifact,16,x,y,[20,23,22]);
      const edgeArtifactResult=convertPixels({data:edgeArtifact,width:16,height:16,cols:8,rows:8,palette:calibratedPalette,maxColors:3,whiteMode:'auto',processMode:'cartoon',mergeStrength:0});
      const edgeArtifactGrid=new Int16Array(edgeArtifactResult.buffer);
      test('单像素均匀灰边被识别为文件伪影',edgeArtifactResult.diagnostics.edgeArtifactPixels===16&&edgeArtifactGrid.slice(0,8).every(value=>value===-1));
      const trueBorder=edgeArtifact.slice();
      for(let x=0;x<16;x++)putPixel(trueBorder,16,x,0,[20,23,22]);
      const trueBorderResult=convertPixels({data:trueBorder,width:16,height:16,cols:8,rows:8,palette:calibratedPalette,maxColors:3,whiteMode:'auto',processMode:'cartoon',mergeStrength:0});
      test('真正的黑色顶框不会被伪影清理误删',trueBorderResult.diagnostics.edgeArtifactPixels===0&&new Int16Array(trueBorderResult.buffer).slice(0,8).some(value=>value===2));

      const coolWhitePalette=[
        {index:0,code:'H2',rgb:[254,255,255],lab:rgbToOklab([254,255,255])},
        {index:1,code:'H9',rgb:[237,237,237],lab:rgbToOklab([237,237,237])}
      ];
      const coolWhiteResult=convertPixels({data:solidRgba(4,4,[237,237,237]),width:4,height:4,cols:1,rows:1,palette:coolWhitePalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0});
      test('MARD 浅灰 H9 不会被白色 H2 锁定误吞',new Int16Array(coolWhiteResult.buffer)[0]===1);

      const monoPalette=[
        {index:0,code:'H2',rgb:[254,255,255],lab:rgbToOklab([254,255,255])},
        {index:1,code:'H23',rgb:[154,157,148],lab:rgbToOklab([154,157,148])},
        {index:2,code:'H7',rgb:[0,0,0],lab:rgbToOklab([0,0,0])}
      ];
      const monochrome=solidRgba(16,4,[255,255,255]);
      for(let y=0;y<4;y++)for(let x=8;x<12;x++)putPixel(monochrome,16,x,y,[150,150,150]);
      for(let y=0;y<4;y++)for(let x=12;x<16;x++)putPixel(monochrome,16,x,y,[20,20,20]);
      const monochromeResult=convertPixels({data:monochrome,width:16,height:4,cols:4,rows:1,palette:monoPalette,maxColors:3,whiteMode:'keep',processMode:'cartoon',mergeStrength:0});
      test('黑白线稿的抗锯齿灰不会成为第三种豆色',monochromeResult.diagnostics.monochromeLineArt&&!monochromeResult.selected.includes(1));

      // 低分辨率下，逐格多数投票会把曲线拆成几段；小图精修必须保留一格宽的闭合轮廓。
      const smallCurve=solidRgba(120,120,[255,255,255]);
      for(let y=0;y<120;y++)for(let x=0;x<120;x++)if(Math.abs(Math.hypot(x-60,y-60)-42)<=1.6)putPixel(smallCurve,120,x,y,[0,0,0]);
      const smallCurveResult=convertPixels({data:smallCurve,width:120,height:120,cols:16,rows:16,palette:monoPalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0});
      const smallCurveGrid=new Int16Array(smallCurveResult.buffer),smallCurveVisited=new Uint8Array(smallCurveGrid.length);
      let smallCurveComponents=0,smallCurveBlack=0;
      for(let start=0;start<smallCurveGrid.length;start++){
        if(smallCurveGrid[start]!==2||smallCurveVisited[start])continue;
        smallCurveComponents++;const queue=[start];smallCurveVisited[start]=1;
        while(queue.length){
          const current=queue.pop(),cx=current%16,cy=Math.floor(current/16);smallCurveBlack++;
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=16||ny>=16)continue;
            const next=ny*16+nx;if(smallCurveGrid[next]===2&&!smallCurveVisited[next]){smallCurveVisited[next]=1;queue.push(next);}
          }
        }
      }
      test('16格小图仍保留连续单格曲线',smallCurveComponents===1&&smallCurveBlack>=32&&smallCurveBlack<=64);

      // 七个互不相连的线稿部件：外框、双眉、双眼、鼻点、嘴点。
      // 用它阻止“缩小后不同部件粘成一块”和“同图换源分辨率就变豆”的回归。
      const makeSevenPartLineArt=scale=>{
        const size=120*scale,pixels=solidRgba(size,size,[255,255,255]);
        const rect=(x0,y0,x1,y1)=>{for(let y=y0*scale;y<y1*scale;y++)for(let x=x0*scale;x<x1*scale;x++)putPixel(pixels,size,x,y,[0,0,0]);};
        rect(10,10,110,12);rect(10,108,110,110);rect(10,12,12,108);rect(108,12,110,108);
        rect(30,32,45,35);rect(75,32,90,35);rect(31,43,44,63);rect(76,43,89,63);rect(58,70,62,74);rect(56,83,64,87);
        return {pixels,size};
      };
      const countInkComponents=(grid,cols,rows,ink)=>{
        const visited=new Uint8Array(grid.length);let components=0;
        for(let start=0;start<grid.length;start++){
          if(grid[start]!==ink||visited[start])continue;components++;const queue=[start];visited[start]=1;
          while(queue.length){
            const current=queue.pop(),x=current%cols,y=Math.floor(current/cols);
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
              const next=ny*cols+nx;if(grid[next]===ink&&!visited[next]){visited[next]=1;queue.push(next);}
            }
          }
        }
        return components;
      };
      for(const side of [24,32,40,48,60]){
        const fixture=makeSevenPartLineArt(2),result=convertPixels({data:fixture.pixels,width:fixture.size,height:fixture.size,cols:side,rows:side,palette:monoPalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0});
        const grid=new Int16Array(result.buffer);
        test(`${side}格线稿保持七个独立部件`,result.diagnostics.lineSourceComponents===7&&result.diagnostics.lineUnrepresentableComponents===0&&result.diagnostics.lineUnresolvedConflicts===0&&countInkComponents(grid,side,side,2)===7);
      }
      const openArch=solidRgba(120,120,[255,255,255]);
      for(let y=20;y<120;y++)for(let x=0;x<4;x++){putPixel(openArch,120,28+x,y,[0,0,0]);putPixel(openArch,120,88+x,y,[0,0,0]);}
      for(let y=20;y<24;y++)for(let x=28;x<92;x++)putPixel(openArch,120,x,y,[0,0,0]);
      const openArchResult=convertPixels({data:openArch,width:120,height:120,cols:24,rows:24,palette:monoPalette,maxColors:2,whiteMode:'auto',processMode:'cartoon',mergeStrength:0});
      const openArchGrid=new Int16Array(openArchResult.buffer);
      test('触底开口轮廓的外部背景不会被误补成白豆',openArchGrid.some(value=>value===2)&&!openArchGrid.some(value=>value===0));
      const scaleOne=makeSevenPartLineArt(1),scaleTwo=makeSevenPartLineArt(2);
      const scaledA=new Int16Array(convertPixels({data:scaleOne.pixels,width:scaleOne.size,height:scaleOne.size,cols:48,rows:48,palette:monoPalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0}).buffer);
      const scaledB=new Int16Array(convertPixels({data:scaleTwo.pixels,width:scaleTwo.size,height:scaleTwo.size,cols:48,rows:48,palette:monoPalette,maxColors:2,whiteMode:'keep',processMode:'cartoon',mergeStrength:0}).buffer);
      let scaleDifferences=0;for(let i=0;i<scaledA.length;i++)if(scaledA[i]!==scaledB[i])scaleDifferences++;
      test(`线稿输出不依赖上传图片的像素分辨率（差异 ${scaleDifferences} 格）`,scaleDifferences<=2);

      const trimFixture=solidRgba(100,100,[255,255,255]);
      for(let x=0;x<100;x++)putPixel(trimFixture,100,x,0,[105,105,105]);
      for(let x=20;x<=79;x++){putPixel(trimFixture,100,x,12,[0,0,0]);putPixel(trimFixture,100,x,88,[0,0,0]);}
      for(let y=12;y<=88;y++){putPixel(trimFixture,100,20,y,[0,0,0]);putPixel(trimFixture,100,79,y,[0,0,0]);}
      const trimAnalysis=analyzeLineArtSubject({data:trimFixture,width:100,height:100});
      test('白底线稿会忽略边缘扫描线并安全紧贴主体',trimAnalysis.likelyLineArt&&trimAnalysis.autoCrop&&trimAnalysis.autoCrop.x>=.14&&trimAnalysis.autoCrop.y>=.05&&trimAnalysis.autoCrop.w<=.72&&trimAnalysis.autoCrop.h<=.90&&trimAnalysis.retainedInkRatio===1);
      const trueTopBorder=solidRgba(100,100,[255,255,255]);
      for(let x=0;x<100;x++)putPixel(trueTopBorder,100,x,0,[0,0,0]);
      for(let x=25;x<75;x++){putPixel(trueTopBorder,100,x,30,[0,0,0]);putPixel(trueTopBorder,100,x,70,[0,0,0]);}
      for(let y=30;y<=70;y++){putPixel(trueTopBorder,100,25,y,[0,0,0]);putPixel(trueTopBorder,100,74,y,[0,0,0]);}
      const trueTopAnalysis=analyzeLineArtSubject({data:trueTopBorder,width:100,height:100});
      test('贴顶且横跨整图的真实黑线不会被当作扫描伪影裁掉',trueTopAnalysis.inkBounds?.minY===0&&(!trueTopAnalysis.autoCrop||trueTopAnalysis.autoCrop.y===0));
      const remoteDetail=solidRgba(120,100,[255,255,255]);for(let x=25;x<95;x++){putPixel(remoteDetail,120,x,25,[0,0,0]);putPixel(remoteDetail,120,x,75,[0,0,0]);}for(let y=25;y<=75;y++){putPixel(remoteDetail,120,25,y,[0,0,0]);putPixel(remoteDetail,120,94,y,[0,0,0]);}putPixel(remoteDetail,120,112,50,[0,0,0]);
      const remoteAnalysis=analyzeLineArtSubject({data:remoteDetail,width:120,height:100});
      test('自动取景不会静默裁掉远离主体的小部件',remoteAnalysis.autoCrop&&remoteAnalysis.retainedInkRatio===1&&remoteAnalysis.excludedComponentCount===0&&remoteAnalysis.autoCrop.x+remoteAnalysis.autoCrop.w>.94);
      const colorfulFixture=solidRgba(40,40,[230,40,50]);for(let y=0;y<40;y++)for(let x=20;x<40;x++)putPixel(colorfulFixture,40,x,y,[35,110,220]);
      test('彩色图片不会被线稿自动取景误裁',!analyzeLineArtSubject({data:colorfulFixture,width:40,height:40}).autoCrop);

      const boundsFixture=new Int16Array(6*5).fill(-1);boundsFixture[1*6+2]=0;boundsFixture[3*6+4]=2;
      const bounds=occupiedBounds(boundsFixture,6,5);
      test('施工图自动裁去外围空白并计算最小行列',bounds.minX===2&&bounds.minY===1&&bounds.cols===3&&bounds.rows===3);
      test('一键方案默认开启网格与逐格色号',cartoonSmart.showGrid&&cartoonSmart.showCodes);
      const mardCounts={};PALETTE.forEach(color=>mardCounts[color.series]=(mardCounts[color.series]||0)+1);
      test('MARD 基础色板严格为 A/B/C/D/E/F/G/H/M 共221色',PALETTE.length===221&&JSON.stringify(mardCounts)===JSON.stringify({A:26,B:32,C:29,D:26,E:24,F:25,G:21,H:23,M:15})&&PALETTE.every(color=>/^[A-HM]\d{1,2}$/.test(color.code)));
      test('透明H1不参与自动匹配，白H2与黑H7锚点正确',getAllowedPalette().length===220&&!getAllowedPalette().some(color=>color.code==='H1')&&PALETTE.find(color=>color.code==='H1')?.isTransparent&&PALETTE.find(color=>color.code==='H2')?.hex==='#FEFFFF'&&PALETTE.find(color=>color.code==='H7')?.hex==='#000000');
      test('221色色号文字自动选择高对比色',PALETTE.every(color=>contrastRatio(color.displayHex,colorText(color.displayHex))>=4.5));
      test('CIEDE2000实现通过标准参考对',Math.abs(deltaE2000([50,2.6772,-79.7751],[50,0,-82.7485])-2.0425)<.0002);
      test('粗辅助线覆盖起点、间隔、物理接板线与尾边',JSON.stringify(majorGridStops(41,10))===JSON.stringify([0,10,20,30,40,41])&&JSON.stringify(majorGridStops(58,29))===JSON.stringify([0,29,58])&&JSON.stringify(majorGridStops(104,52))===JSON.stringify([0,52,104]));
      test('大画布缩放受8MP单层预算保护',maxSafeZoom(160,160)===1&&maxSafeZoom(120,120)===1.25&&maxSafeZoom(60,60)===2);
      test('下载文件名会移除系统非法字符',safeFileStem(' 客户:01/猫*狗?. ')==='客户-01-猫-狗-');
      const privacyProject=buildProjectData('隐私测试');
      test('工程JSON不再写入原始参考文件名',privacyProject.reference?.embedded===false&&!Object.prototype.hasOwnProperty.call(privacyProject.reference,'fileName'));
      const printFixture=buildPrintTileCanvas(0,0,Math.min(10,state.cols),Math.min(10,state.rows),1,1);
      test('分页打印单页保持在安全像素预算内',printFixture.width*printFixture.height<DEVICE_LIMITS.exportPixels);
      test('用料占比宽度精确、标签整数化',formatShare(38,380).width==='10.00%'&&formatShare(38,380).label==='10%'&&formatShare(380,380).label==='100%');
      test('不足一成的占比保留一位小数',formatShare(3,380).label==='0.8%'&&formatShare(1,380).label==='0.3%');

      const failed=tests.filter(item=>!item.pass);
      if(failed.length)console.error(`[豆格工坊自检失败] ${JSON.stringify(failed)}`);else console.info(`[豆格工坊自检通过] ${tests.length} 项`);
      return tests;
    }

    window.runBeadStudioSelfTests=runSelfTests;

    function refreshLocalizedUi() {
      applyDocumentTranslations();
      els.processModeHint.textContent=modeHint(els.processMode.value);
      els.maxColorsValue.textContent=t('unit.colorsValue',{count:state.maxColors});
      setProjectSubtitle(state.projectSubtitleKey,state.projectSubtitleParams);
      setStatus(state.statusKey,state.statusParams);
      syncSizeModeUI();syncAspectStatus();renderPalette();updateSelectedColor();updateStats();updateSmartCard();updateDetailAdvice();updateViewButtons();
      if(els.shareDialog?.open)renderShareCardPreview();
    }

    function bindEvents() {
      const openImage=()=>els.imageInput.click();
      [els.topUploadBtn,els.emptyUploadBtn].filter(Boolean).forEach(button=>button.addEventListener('click',openImage));
      [els.trySampleBtn,els.panelTrySampleBtn].filter(Boolean).forEach(button=>button.addEventListener('click',loadSampleImage));
      document.querySelectorAll('[data-locale]').forEach(button=>{
        button.addEventListener('click',()=>setLocale(button.dataset.locale));
        button.addEventListener('keydown',event=>{
          if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();
          const buttons=[...document.querySelectorAll('[data-locale]')],current=buttons.indexOf(button),direction=event.key==='ArrowRight'?1:-1,next=buttons[(current+direction+buttons.length)%buttons.length];next.focus();setLocale(next.dataset.locale);
        });
      });
      onLocaleChange(refreshLocalizedUi);
      els.dropzone.addEventListener('click',openImage);
      els.dropzone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openImage();}});
      els.imageInput.addEventListener('change',()=>loadImageFile(els.imageInput.files[0]));
      els.productHelpBtn.addEventListener('click',openProductDialog);
      [els.productCloseBtn,els.productOkBtn].forEach(button=>button.addEventListener('click',closeProductDialog));
      els.productDialog.addEventListener('cancel',event=>{event.preventDefault();closeProductDialog();});
      els.restoreDraftBtn.addEventListener('click',restoreDraft);
      els.clearDraftBtn.addEventListener('click',()=>{if(window.confirm(t('confirm.clearDraft')))clearDraft();});
      ['dragenter','dragover'].forEach(type=>els.dropzone.addEventListener(type,event=>{event.preventDefault();els.dropzone.classList.add('is-dragging');}));
      ['dragleave','drop'].forEach(type=>els.dropzone.addEventListener(type,event=>{event.preventDefault();els.dropzone.classList.remove('is-dragging');}));
      els.dropzone.addEventListener('drop',event=>loadImageFile(event.dataTransfer.files[0]));
      window.addEventListener('paste',event=>{const file=[...event.clipboardData.files].find(item=>item.type.startsWith('image/'));if(file)loadImageFile(file);});

      els.referenceOpacity.addEventListener('input',()=>{state.referenceOpacity=Number(els.referenceOpacity.value)/100;els.opacityValue.textContent=`${els.referenceOpacity.value}%`;drawReference();});
      els.smartGenerateBtn.addEventListener('click',()=>els.smartGenerateBtn.dataset.action==='crop'?openCropDialog():generateSmartHd());
      els.smartExportBtn.addEventListener('click',exportPng);
      els.smartAdvancedBtn.addEventListener('click',()=>{els.advancedSettings.open=true;els.processMode.focus({preventScroll:true});els.advancedSettings.scrollIntoView({behavior:'smooth',block:'nearest'});});
      els.processMode.addEventListener('change',()=>{markCustomSettings();els.processModeHint.textContent=modeHint(els.processMode.value);if(state.referenceImage){rebuildReferenceRaster();updateDetailAdvice();convertImage();}});
      els.maxColors.addEventListener('input',()=>{state.maxColors=Number(els.maxColors.value);els.maxColorsValue.textContent=t('unit.colorsValue',{count:state.maxColors});});
      els.maxColors.addEventListener('change',()=>{markCustomSettings();if(state.referenceImage)convertImage();});
      els.mergeStrength.addEventListener('input',()=>{state.mergeStrength=Number(els.mergeStrength.value);els.mergeStrengthValue.textContent=state.mergeStrength;});
      els.mergeStrength.addEventListener('change',()=>{markCustomSettings();if(state.referenceImage)convertImage();});
      els.fitMode.addEventListener('change',()=>{
        if(state.sizeMode==='board'&&els.fitMode.value!=='contain'){els.fitMode.value='contain';toast('toast.boardContainOnly');return;}
        if(state.referenceImage&&els.fitMode.value==='cover'){
          const source=effectiveSourceSize(),fit=fitGeometryMetrics(source.width,source.height,state.cols,state.rows,'cover');
          if(fit.cropFraction>.05&&!window.confirm(t('confirm.coverCrop',{percent:(fit.cropFraction*100).toFixed(1)}))){els.fitMode.value='contain';return;}
        }
        markCustomSettings();if(state.referenceImage){rebuildReferenceRaster();updateDetailAdvice();updateSmartCard();convertImage();}
      });
      els.whiteMode.addEventListener('change',()=>{markCustomSettings();if(state.referenceImage)convertImage();});
      els.protectDark.addEventListener('change',()=>{state.protectDark=els.protectDark.checked;markCustomSettings();if(state.referenceImage)convertImage();});
      els.convertBtn.addEventListener('click',()=>{markCustomSettings();convertImage();});
      els.applyRecommendedBtn.addEventListener('click',()=>{state.sizeMode='pattern';state.aspectLock=true;els.aspectLock.checked=true;syncSizeModeUI();syncAspectStatus();applyGridSize(Number(els.applyRecommendedBtn.dataset.cols),Number(els.applyRecommendedBtn.dataset.rows),true);});
      els.openCropBtn.addEventListener('click',openCropDialog);
      els.restoreFullImageBtn.addEventListener('click',restoreFullImageBounds);
      els.stageCropBtn.addEventListener('click',()=>{
        if(els.stageCropBtn.dataset.action==='aspect')els.applyRecommendedBtn.click();
        else openCropDialog();
      });
      els.cropCloseBtn.addEventListener('click',closeCropDialog);
      els.cropCancelBtn.addEventListener('click',closeCropDialog);
      els.cropResetBtn.addEventListener('click',()=>{state.cropDraft={x:0,y:0,w:1,h:1};drawCropPreview();});
      els.cropApplyBtn.addEventListener('click',applyCrop);
      els.cropDialog.addEventListener('cancel',event=>{event.preventDefault();closeCropDialog();});
      els.readyExportBtn?.addEventListener('click',exportPng);
      els.readySaveBtn?.addEventListener('click',()=>saveProject());
      els.readyShareBtn?.addEventListener('click',sharePattern);
      els.readyShareCardBtn?.addEventListener('click',openShareCardDialog);
      [els.shareCardCloseBtn,els.shareCardCancelBtn].filter(Boolean).forEach(button=>button.addEventListener('click',closeShareCardDialog));
      els.shareFormat?.addEventListener('change',renderShareCardPreview);
      els.shareCardDownloadBtn?.addEventListener('click',exportShareCard);
      els.shareDialog?.addEventListener('cancel',event=>{event.preventDefault();closeShareCardDialog();});
      [els.cropXInput,els.cropYInput,els.cropWInput,els.cropHInput].forEach(input=>input.addEventListener('input',()=>{
        const next=cropFromInputs();if(!next)return;state.cropDraft=next;drawCropPreview();
      }));
      els.cropCanvas.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;const point=cropPoint(event);if(!point)return;
        state.cropDrag=point;state.cropDraft={x:point.x,y:point.y,w:.01,h:.01};els.cropCanvas.setPointerCapture(event.pointerId);drawCropPreview();
      });
      els.cropCanvas.addEventListener('pointermove',event=>{
        if(!state.cropDrag)return;const point=cropPoint(event);if(!point)return;
        const x=Math.min(state.cropDrag.x,point.x),y=Math.min(state.cropDrag.y,point.y);
        state.cropDraft={x,y,w:Math.max(.01,Math.abs(point.x-state.cropDrag.x)),h:Math.max(.01,Math.abs(point.y-state.cropDrag.y))};drawCropPreview();
      });
      const endCropDrag=event=>{if(!state.cropDrag)return;state.cropDrag=null;try{els.cropCanvas.releasePointerCapture(event.pointerId);}catch(_){}};
      els.cropCanvas.addEventListener('pointerup',endCropDrag);els.cropCanvas.addEventListener('pointercancel',endCropDrag);
      els.cancelConvertBtn.addEventListener('click',()=>{invalidateConversion();const snapshot=state.history[state.historyIndex];if(snapshot)restoreSnapshot(snapshot);setConversionModal(false);els.convertBtn.disabled=!state.referenceImage;setStatus('status.conversionCanceled');toast('toast.conversionCanceled');});

      document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{
        state.sizeMode='pattern';syncSizeModeUI();const size=Number(button.dataset.size);let next={cols:size,rows:size};
        if(state.referenceImage&&els.aspectLock.checked){const source=effectiveSourceSize();next=gridForLongSide(source.width,source.height,size);}
        els.gridCols.value=next.cols;els.gridRows.value=next.rows;applyGridSize(next.cols,next.rows);
      }));
      document.querySelectorAll('[data-size-mode]').forEach(button=>button.addEventListener('click',()=>switchSizeMode(button.dataset.sizeMode)));
      els.boardProfile.addEventListener('change',()=>applyPhysicalBoard(els.boardProfile.value,state.boardTilesX,state.boardTilesY));
      document.querySelectorAll('[data-board-layout]').forEach(button=>button.addEventListener('click',()=>{const [x,y]=button.dataset.boardLayout.split('x').map(Number);applyPhysicalBoard(state.boardProfile,x,y);}));
      els.applySizeBtn.addEventListener('click',()=>state.sizeMode==='board'?applyPhysicalBoard():applyGridSize(els.gridCols.value,els.gridRows.value));
      els.gridCols.addEventListener('input',()=>syncLockedSizeInput('cols'));
      els.gridRows.addEventListener('input',()=>syncLockedSizeInput('rows'));
      [els.gridCols,els.gridRows].forEach(input=>input.addEventListener('change',()=>{input.value=Math.round(clamp(input.value,4,160));syncLockedSizeInput(input===els.gridRows?'rows':'cols');}));
      els.aspectLock.addEventListener('change',()=>{
        state.aspectLock=els.aspectLock.checked;markCustomSettings();syncAspectStatus();
        if(state.referenceImage&&state.aspectLock){const source=effectiveSourceSize(),next=gridForLongSide(source.width,source.height,Math.max(state.cols,state.rows));els.gridCols.value=next.cols;els.gridRows.value=next.rows;applyGridSize(next.cols,next.rows);}
        else{updateDetailAdvice();updateSmartCard();}
      });

      document.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.tool)));
      els.mirrorHBtn.addEventListener('click',()=>transformGrid('mirrorH'));
      els.mirrorVBtn.addEventListener('click',()=>transformGrid('mirrorV'));
      els.rotateBtn.addEventListener('click',()=>transformGrid('rotate'));
      els.clearBtn.addEventListener('click',clearGrid);
      els.undoBtn.addEventListener('click',undo);els.redoBtn.addEventListener('click',redo);
      els.zoomOutBtn.addEventListener('click',()=>setZoom(state.zoom-.25));els.zoomInBtn.addEventListener('click',()=>setZoom(state.zoom+.25));
      els.fitCanvasBtn.addEventListener('click',()=>fitCanvasToViewport());

      document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{state.previewMode=button.dataset.preview;renderAll();}));
      els.gridToggle.addEventListener('click',()=>{state.showGrid=!state.showGrid;renderAll();});
      els.rulerToggle.addEventListener('click',()=>{state.showRulers=!state.showRulers;renderAll();});
      els.codesToggle.addEventListener('click',()=>{state.showCodes=!state.showCodes;if(state.showCodes&&cellSize()<14)toast('toast.codesNeedZoom');renderAll();});
      els.majorGridStep.addEventListener('change',()=>{state.majorGridStep=[5,10,29].includes(Number(els.majorGridStep.value))?Number(els.majorGridStep.value):10;renderAll();setStatus('status.majorGrid',{count:state.majorGridStep});});
      document.querySelectorAll('[data-palette-mode]').forEach(button=>button.addEventListener('click',()=>{state.paletteMode='mard221';renderPalette();updateViewButtons();}));
      document.querySelectorAll('[data-palette-series]').forEach(button=>button.addEventListener('click',()=>{state.paletteSeries=button.dataset.paletteSeries;renderPalette();updateViewButtons();}));
      els.paletteSearch.addEventListener('input',renderPalette);

      els.patternCanvas.addEventListener('pointerdown',event=>{
        if(event.button!==0||blockMutationDuringConversion())return;if(cellSize()<4){toast('toast.previewEditZoom');return;}const cell=pointerCell(event);if(!cell)return;els.patternCanvas.focus();
        state.isDrawing=true;state.strokeChanged=false;state.lastCell=cell;els.patternCanvas.setPointerCapture(event.pointerId);applyToolAt(cell.x,cell.y);
        if(state.tool==='picker')endStroke(event);
      });
      els.patternCanvas.addEventListener('pointermove',event=>{if(!state.isDrawing)return;const cell=pointerCell(event);if(!cell)return;if(!state.lastCell||cell.x!==state.lastCell.x||cell.y!==state.lastCell.y){drawLine(state.lastCell||cell,cell);state.lastCell=cell;}});
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>els.patternCanvas.addEventListener(type,endStroke));
      els.patternCanvas.addEventListener('focus',()=>{state.canvasFocused=true;drawPattern();});
      els.patternCanvas.addEventListener('blur',()=>{state.canvasFocused=false;drawPattern();});
      els.patternCanvas.addEventListener('keydown',event=>{
        if(conversionInProgress()){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Delete','Backspace'].includes(event.key))event.preventDefault();blockMutationDuringConversion();return;}
        const key=event.key,{x,y}=state.keyboardCursor;
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Delete','Backspace'].includes(key))event.preventDefault();
        if(key==='ArrowLeft')state.keyboardCursor.x=Math.max(0,x-1);
        if(key==='ArrowRight')state.keyboardCursor.x=Math.min(state.cols-1,x+1);
        if(key==='ArrowUp')state.keyboardCursor.y=Math.max(0,y-1);
        if(key==='ArrowDown')state.keyboardCursor.y=Math.min(state.rows-1,y+1);
        if(key===' '){state.strokeChanged=false;applyToolAt(x,y);if(state.strokeChanged)commitHistory('history.keyboardDraw');}
        if(key==='Delete'||key==='Backspace'){state.strokeChanged=false;applyToolAt(x,y,'eraser');if(state.strokeChanged)commitHistory('history.keyboardErase');}
        drawPattern();
      });

      els.saveProjectBtn.addEventListener('click',()=>saveProject());els.loadProjectBtn.addEventListener('click',()=>els.projectInput.click());
      if(els.copyStatsBtn)els.copyStatsBtn.addEventListener('click',()=>{copyStatsList();});
      els.projectInput.addEventListener('change',()=>loadProjectFile(els.projectInput.files[0]));
      [els.exportPngBtn,els.topExportBtn].forEach(button=>button.addEventListener('click',exportPng));
      els.printBtn.addEventListener('click',printPreview);

      window.addEventListener('keydown',event=>{
        if(conversionInProgress()){
          if(event.key==='Escape'){event.preventDefault();els.cancelConvertBtn.click();return;}
          if(event.key==='Tab'){event.preventDefault();els.cancelConvertBtn.focus({preventScroll:true});return;}
          if((event.ctrlKey||event.metaKey)&&['z','y'].includes(event.key.toLowerCase())||['b','e','i'].includes(event.key.toLowerCase())){event.preventDefault();blockMutationDuringConversion();}
          return;
        }
        if(trapMobilePanelFocus(event))return;
        if(event.key==='Escape'&&[...document.querySelectorAll('.side-panel')].some(item=>item.dataset.mobileOpen==='true')){event.preventDefault();closeMobilePanels();return;}
        const target=event.target;if(target instanceof HTMLInputElement||target instanceof HTMLSelectElement||target instanceof HTMLTextAreaElement)return;
        if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();return;}
        if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();return;}
        if(event.key.toLowerCase()==='b')setTool('brush');
        if(event.key.toLowerCase()==='e')setTool('eraser');
        if(event.key.toLowerCase()==='i')setTool('picker');
      });
      window.addEventListener('beforeunload',event=>{if(state.dirty){saveDraftNow();event.preventDefault();event.returnValue='';}});
      window.addEventListener('pagehide',()=>{if(state.dirty)saveDraftNow();});

      document.querySelectorAll('[data-mobile-target]').forEach(button=>button.addEventListener('click',()=>openMobilePanel(button.dataset.mobileTarget)));
      document.querySelectorAll('.sheet-close').forEach(button=>button.addEventListener('click',closeMobilePanels));
      els.mobileScrim.addEventListener('click',closeMobilePanels);
      window.matchMedia('(min-width: 960px)').addEventListener('change',event=>{if(event.matches)closeMobilePanels({restoreFocus:false});else syncMobilePanelInert();});
    }

    function init() {
      initializeI18n();
      els.appVersion.textContent=`v${APP_VERSION}`;
      els.projectTitle.textContent=t('project.untitled');
      setProjectSubtitle('project.localOnly');
      renderPalette();
      updateSelectedColor();
      resetHistory();
      bindEvents();
      syncSizeModeUI();
      syncAspectStatus();
      syncMobilePanelInert();
      renderAll();
      setTool('brush');
      updateRecoveryUI();
      if(location.protocol==='https:'&&'serviceWorker' in navigator){
        navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(error=>console.warn('[豆格工坊] 离线缓存注册失败',error));
      }
      if (new URLSearchParams(location.search).has('selftest')) runSelfTests();
    }

    init();
