// Lossless fast-start preparation for conventional, unfragmented MP4 files.
// Refuses unsupported layouts instead of guessing offsets. Never overwrites a file.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
function boxes(buffer,start=0,end=buffer.length){
  const out=[];
  while(start<end){
    if(start+8>end)throw Error('Truncated MP4 box');
    let size=buffer.readUInt32BE(start),header=8;
    if(size===1){if(start+16>end)throw Error('Truncated extended box');size=Number(buffer.readBigUInt64BE(start+8));header=16;}
    if(size===0)size=end-start;
    if(!Number.isSafeInteger(size)||size<header||start+size>end)throw Error('Invalid MP4 box size');
    out.push({type:buffer.toString('ascii',start+4,start+8),start,end:start+size,payload:start+header,size});start+=size;
  }
  return out;
}
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function prepare(source,destination){
  if(path.resolve(source)===path.resolve(destination))throw Error('Source and destination must differ');
  const input=fs.readFileSync(source),top=boxes(input);
  if(top.some(x=>!['ftyp','free','wide','mdat','moov'].includes(x.type)))throw Error('Unsupported layout: use a standard MP4 remuxer');
  const moovs=top.filter(x=>x.type==='moov'),ftyp=top.filter(x=>x.type==='ftyp'),mdats=top.filter(x=>x.type==='mdat');
  if(moovs.length!==1||ftyp.length!==1||!mdats.length)throw Error('Expected one ftyp/moov and media data');
  const moov=moovs[0],copy=Buffer.from(input.subarray(moov.start,moov.end));
  const ordered=[ftyp[0],moov,...top.filter(x=>x!==ftyp[0]&&x!==moov)],positions=new Map();
  let cursor=0;for(const box of ordered){positions.set(box,cursor);cursor+=box.size;}
  let changed=0;
  function relocated(offset){
    const mdat=mdats.find(x=>offset>=x.payload&&offset<x.end);
    if(!mdat)throw Error('Chunk offset outside media data');
    return positions.get(mdat)+offset-mdat.start;
  }
  function walk(start,end){
    for(const box of boxes(copy,start,end)){
      if(['moov','trak','mdia','minf','stbl'].includes(box.type))walk(box.payload,box.end);
      if(['mvex','cmov'].includes(box.type))throw Error('Fragmented/compressed MP4 is unsupported');
      if(box.type==='stsd'){
        const entries=boxes(copy,box.payload+8,box.end);
        if(entries.some(x=>!['avc1','mp4a'].includes(x.type)))throw Error('Only H.264/AAC sample entries are supported');
      }
      if(box.type==='stco'||box.type==='co64'){
        if(box.payload+8>box.end)throw Error('Invalid offset table');
        const count=copy.readUInt32BE(box.payload+4),width=box.type==='stco'?4:8;
        if(box.payload+8+count*width!==box.end)throw Error('Invalid offset table length');
        for(let i=0;i<count;i++){
          const pos=box.payload+8+i*width,old=width===4?copy.readUInt32BE(pos):Number(copy.readBigUInt64BE(pos));
          if(!Number.isSafeInteger(old))throw Error('Offset exceeds safe integer range');
          const next=relocated(old);if(width===4&&next>0xffffffff)throw Error('Requires stco to co64 conversion');
          if(width===4)copy.writeUInt32BE(next,pos);else copy.writeBigUInt64BE(BigInt(next),pos);changed++;
        }
      }
    }
  }
  walk(0,copy.length);if(!changed)throw Error('No media chunk offsets found');
  const output=Buffer.concat(ordered.map(box=>box===moov?copy:input.subarray(box.start,box.end)));
  const finalBoxes=boxes(output),finalMedia=finalBoxes.filter(x=>x.type==='mdat');
  if(output.length!==input.length||mdats.some((box,i)=>!input.subarray(box.payload,box.end).equals(output.subarray(finalMedia[i].payload,finalMedia[i].end))))throw Error('Media integrity verification failed');
  fs.writeFileSync(destination,output,{flag:'wx'});
  return {source,destination,size_bytes:output.length,source_sha256:digest(input),prepared_sha256:digest(output),chunk_offsets_updated:changed,media_payloads_identical:true,fast_start:finalBoxes.findIndex(x=>x.type==='moov')<finalBoxes.findIndex(x=>x.type==='mdat')};
}
if(require.main===module){try{if(process.argv.length!==4)throw Error('Usage: node scripts/prepare-ask-kookie-video.cjs source.mp4 destination.mp4');console.log(JSON.stringify(prepare(process.argv[2],process.argv[3]),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={prepare,boxes};
