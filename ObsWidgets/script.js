async function getWidget(id){
    console.log(`sending request....`)
    let promise = new Promise((resolve,reject)=>{
        fetch(`http://localhost:2727/widget?id=${id}`).then(function (response) {
        return response.text();
        }).then(function (data) {
            resolve(data);
        })
    })
    return promise;
}