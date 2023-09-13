let storage = {};
let selectedWidgetIndex = -1;
let actionsLog = document.querySelector('.actions-log')
document.addEventListener('click',ev=>{
    if (ev.target){
        if (ev.target.parentElement.classList.contains('widgets-list')){
            let anotherElem = document.querySelector('.widgets-list li[active]');
            if (anotherElem){
                anotherElem.removeAttribute('active')
            }
            ev.target.setAttribute('active',true);
            widgetSelected(ev.target.getAttribute('id'));
            
        }
    }
})
document.addEventListener("DOMContentLoaded", async (ev) => {
    storage = await fetch('/storage').then((response) => {return response.json();}).then((data) => {return data});
    reloadWidgetList();
});
document.querySelector('#add-widget').addEventListener('click',addWidget);
document.querySelector('#save-widget').addEventListener('click',saveStorage);
document.querySelector('#rename-widget').addEventListener('click',renameWidget);
document.querySelector('#delete-widget').addEventListener('click',deleteWidget);

document.querySelector('.widget-source-code').addEventListener('change',ev=>{
    storage.widgets[selectedWidgetIndex].text = ev.target.value;
})
document.querySelector('#widget-target-input').addEventListener('change',ev=>{
    storage.widgets[selectedWidgetIndex].goalIndex = ev.target.value;
})
document.querySelector('#widget-interval-input').addEventListener('change',ev=>{
    storage.widgets[selectedWidgetIndex].refreshInterval = ev.target.value;
})
document.querySelector('#widget-link-input').addEventListener('change',ev=>{
    storage.widgets[selectedWidgetIndex].link = ev.target.value;
})
document.querySelector('#widget-JS-input').addEventListener('change',ev=>{
    storage.widgets[selectedWidgetIndex].JS = ev.target.value;
})
document.querySelector('#widget-CSS-input').addEventListener('change',ev=>{
    storage.widgets[selectedWidgetIndex].CSS = ev.target.value;
})
function widgetSelected(id){
    let index = id.replace('w_id-','');
    if (index == 'none'){
        document.querySelector('.widget-header').textContent ='Виджет не выбран';
        document.querySelector('.widget-redactor').classList.add('hidden');
        return;
    }
    let widget = storage.widgets[index];
    selectedWidgetIndex = index;
    document.querySelector('.widget-header').textContent = widget.name;
    document.querySelector('.widget-redactor').classList.remove('hidden');
    document.querySelector('.widget-source-code').value = widget.text;
    document.querySelector('#widget-target-input').value = widget.goalIndex;
    document.querySelector('#widget-interval-input').value = widget.refreshInterval;
    document.querySelector('#widget-link-input').value = widget.link;
    document.querySelector('#widget-JS-input').value = widget.JS;
    document.querySelector('#widget-CSS-input').value = widget.CSS;
    document.querySelector('#widget-link-output').textContent = 'http://localhost:2727/widgetLink?id='+widget.id;
    console.log(storage)
}
function renameWidget(){
    let name = prompt('Введите новое имя виджету');
    if (name !='' && name){
        storage.widgets[selectedWidgetIndex].name =name;
        reloadWidgetList();
        actionsLog.value+='Виджет переименован\n'
        saveStorage();
        widgetSelected('w_id-'+selectedWidgetIndex)
    }
}
function deleteWidget(){
    if (confirm('Вы уверены что хотите удалить виджет?')){
        storage.widgets.splice(selectedWidgetIndex,1);
        reloadWidgetList();
        actionsLog.value+='Виджет удалён\n'
        saveStorage()
        widgetSelected('w_id-none')
    }
}
function addWidget(){
    if (!storage.widgets){
        storage.widgets = [];
    }
    let widget = {};
    if (storage.widgets.length-1 < 0){
        widget.id =0;
    }else{
        widget.id = storage.widgets[storage.widgets.length-1].id+1;
    }
    widget.name = `Виджет №${widget.id}`;
    widget.text = ``;
    widget.goalIndex = 0;
    widget.refreshInterval = 5;
    widget.link = "NONE";
    widget.JS = "base.js";
    widget.CSS = "base.css";
    storage.widgets.push(widget);
    reloadWidgetList();
    actionsLog.value+='Виджет добавлен\n'
    saveStorage();
}
function reloadWidgetList(){
    let widgetList = document.querySelector('.widgets-list');
    let text = '';
    if (storage.widgets){
        for (let i =0; i < storage.widgets.length;i++){
            let el = storage.widgets[i];
            text+=`<li id="w_id-${i}">${el.name}</li>`
        }
    }
    widgetList.innerHTML = text;
}
async function saveStorage(){
    const response = await fetch('/storage', {
        method: "POST",
        body: JSON.stringify(storage),
        headers: {
          "Content-Type": "application/json",
        }
    });
    actionsLog.value+='Сохранено на сервере\n'
}