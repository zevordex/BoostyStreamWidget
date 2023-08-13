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
let {parse} = require('node-html-parser')
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
        }
        if (req.method == "GET" && queryPath == "/"){
            res.end(await fs.readFileSync('./pages/app.html','utf-8'));
            return;
        }
        if (req.method == "GET" && queryPath == "/widget"){
            if (storage.widgets){
                let widget = storage.widgets.find(x => x.id === parseInt(queryData.id));
                if (widget){
                    let bdata = {}
                    try{
                        bdata = await getBoostyGoal(widget.link,widget.goalIndex);
                    }catch(e){
                        console.log(CS.err,`An error in widget #${widget.id}, maybe you forgot the link?`);
                        return;
                    }
                    let text = widget.text;
                    text = text.replaceAll('{Description}',bdata.description).replaceAll('\n','<br>');
                    text = text.replaceAll('{Current}',bdata.currentSum).replaceAll('{Maximum}',bdata.targetSum);
                    res.end(text);
                    console.log(CS.out,`Widget ${widget.id} updated`)
                    return;
                }
            }
            res.end('ОШИБКА')
        }
        if (req.method == "GET" && queryPath == "/storage"){
            res.end(JSON.stringify(storage));
        }
        if (req.method == "POST" && queryPath == "/storage"){
            storage = reqbody;
            await fs.writeFileSync('./storage.json',JSON.stringify(storage));
            res.end('OK');
            regenerateWidgets();
        }
    })
}


async function regenerateWidgets(){
    let template = await fs.readFileSync('./ObsWidgets/template.html','utf-8');
    if (storage.widgets){
        let htmls = fs.readdirSync('./ObsWidgets/');
        for (let i = 0; i<htmls.length; i++){
            if (htmls[i].startsWith('widget-')){
                if (!storage.widgets.some(e => e.id === parseInt(htmls[i].replace('widget-','').replace('.html','')))) {
                    fs.unlinkSync(`./ObsWidgets/${htmls[i]}`);
                    console.log(`DELETE ${htmls[i]}`)
                }
            }
        }
        storage.widgets.forEach(el=>{
            let modify = template.replaceAll('{refresh_interval}',el.refreshInterval).replaceAll('{widget_id}',el.id);
            fs.writeFileSync(`./ObsWidgets/widget-${el.id}.html`,modify);
        })
    }
}

async function getBoostyGoal(page,index){
    let promise = new Promise((resolve,reject)=>{
        https.get(page, function(res) {
            res.setEncoding('utf8');
            let htmlpage = '';
            res.on('data', function(data) {
                htmlpage+=data;
            });
            res.on('end',(ev)=>{
                let page = parse(htmlpage);
                resolve(JSON.parse(page.querySelector('#initial-state').textContent).target.targets.data[index]);
            })
        }).on('error', function(err) {
            console.log(err);
            reject(err)
        });
    })
    return promise;
}




