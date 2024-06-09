/*  
|'''''||  '||''''|  '||'  '|'  ..|''||   '||''|.   '||''|.   '||''''|  '||' '|' 
    .|'    ||  .     '|.  .'  .|'    ||   ||   ||   ||   ||   ||  .      || |   
   ||      ||''|      ||  |   ||      ||  ||''|'    ||    ||  ||''|       ||    
 .|'       ||          |||    '|.     ||  ||   |.   ||    ||  ||         | ||   
||......| .||.....|     |      ''|...|'  .||.  '|' .||...|'  .||.....| .|   ||. 
*/
//<---=======Modules=========--->
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const url = require('node:url');
var storage = require('./storage.json');
//<---=======Vars============--->
//Colorfull strings without "chalk" module
const CS = {
    err: '\x1b[31m[Error]\x1b[0m',
    warning: '\x1b[33m[Warning]\x1b[0m',
    out: '\x1b[35m[Out]\x1b[0m',
    req: '\x1b[32m[Req]\x1b[0m',
    info:  '\x1b[96m[Info]\x1b[0m',
}
//<---=======Runtime==========--->
function main(){
    if (!Object.keys(storage)[0]){
        
    }
    const server = http.createServer(serverHandler);
    server.listen(2727);
    console.log(CS.info,'Server running on localhost:2727');
    console.log(CS.info, 'Keep this window open during stream!');
}
main();

async function serverHandler(req,res){
    //Some magic to remove a CORS error
    //Somebody tells me that this have security issues, but i use it only on localhost :D
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Max-Age', 2592000);
    
    var queryData = url.parse(req.url, true).query;
    var queryPath = url.parse(req.url).pathname;
    let reqbody = [];
    req.on('data',chunk=>{
        reqbody.push(chunk);
    })
    req.on('end',async ev=>{
        try{
            reqbody = JSON.parse(Buffer.concat(reqbody).toString());
        }catch(e){
        }
        //console.log(reqbody);
        console.log(req.method, queryPath,queryData)
        //console.log(req);
        if (queryPath.startsWith('/assets')){
            if (await (fs.existsSync('./pages'+queryPath))){
                res.end(await fs.readFileSync('./pages'+queryPath,'utf-8'));
                return;
            }
            res.end('404');
        }
        if (queryPath.startsWith('/widget/')){
            if (await (fs.existsSync('.'+queryPath))){
                res.end(await fs.readFileSync('.'+queryPath,'utf-8'));
                return;
            }
            res.end('404');
        }
        if (req.method == "GET" && queryPath == "/"){
            res.end(await fs.readFileSync('./pages/app.html','utf-8'));
            return;
        }
        if (req.method == "GET" && queryPath == "/storage"){
            res.end(JSON.stringify(storage));
        }
        if (req.method == "POST" && queryPath == "/storage"){
            storage = reqbody;
            await fs.writeFileSync('./storage.json',JSON.stringify(storage));
            res.end('OK');
        }
        if (req.method == "GET" && queryPath == "/widgetLink"){
            if (storage.widgets){
                let widget = storage.widgets.find(x => x.id === parseInt(queryData.id));
                if (widget){
                    let bdata = {}
                    try{
                        bdata = await getBoostyGoal(widget.link,widget.goalIndex);
                    }catch(e){
                        console.log(CS.err,`An error in widget #${widget.id}, maybe you forgot the link?`);
                        console.log(e);
                        bdata.targetSum = 0;
                        bdata.currentSum = 0;
                        bdata.description = "Ошибка, вероятно ошибка в ссылке или индексе"
                    }
                    let html = await fs.readFileSync('./widget/template.html','utf-8');
                    if (!html) return console.log(CS.err,"Cannot find /widget/template.html !!") 
                    let percent = Math.round(bdata.currentSum/bdata.targetSum*100);
                    html = html.replaceAll('{css_name}',widget.CSS).replaceAll('{script_name}',widget.JS);
                    html = html.replaceAll('{refresh_interval}',widget.refreshInterval)
                    let text = widget.text;
                    const progress = `<div class="progress-bar" style=""><span style="width: ${percent}%"></span></div>`
                    const progressText = `<div class="progress-bar" style=""><span style="width: ${percent}%">${bdata.currentSum}/${bdata.targetSum}</span></div>`
                    text = text.replaceAll('{Progress}',progress)
                    text = text.replaceAll('{ProgressText}',progressText)
                    text = text.replaceAll('{Description}',bdata.description).replaceAll('\n','<br>');
                    text = text.replaceAll('{Current}',bdata.currentSum).replaceAll('{Maximum}',bdata.targetSum);
                    html = html.replaceAll('{text}',text);
                    res.end(html);
                    console.log(CS.out,`Widget ${widget.id} sended`);
                    return;
                }
            }
            res.end('ERROR')
        }
    })
}
async function getBoostyGoal(page,index){
    let promise = new Promise(async (resolve,reject)=>{
        page = page.replaceAll("https://boosty.to/",''); //Just for old links in old configs.
        https.get(`https://api.boosty.to/v1/target/${page}/ `, function(res) {
            res.setEncoding('utf8');
            let json = '';
            res.on('data', function(data) {
                json+=data;
            });
            res.on('end',async (ev)=>{
                let boostyData = JSON.parse(json);
                if (!boostyData.data[index]){
                    reject(false);
                }
                resolve(boostyData.data[index]);
            })
        }).on('error', function(err) {
            console.log(err);
            reject(err)
        });
    })
    return promise;
}



