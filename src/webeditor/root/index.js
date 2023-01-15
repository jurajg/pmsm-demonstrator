// Copyright © 2022 Juraj Galbavy
// authors of useful code snippets are attributed


// author of function htmlToElement(html): https://stackoverflow.com/users/1709587/mark-amery
// source: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

// original async function createFile(){ is from: https://stackoverflow.com/users/1640643/tibor-udvari
// author of async function createFile(){ is: https://stackoverflow.com/users/1640643/tibor-udvari
async function loadMachinesURL(url) {
  let response = await fetch(url);
  let data = await response.blob();
  let metadata = {
    type: 'application/json'
  };
  let file = new File([data], "test.txt", metadata);
  let text = await file.text();
  return text;
}

document.addEventListener('DOMContentLoaded', function() {
  machines = {};
  vmachines = {};
  machinesCounter = 0;
  statesById = {};
  transitionsById = {};
  editorAction = null;
  editorMode = 'edit';
  elemCounter = 0;
  elements = {};

  addSM('machine0');
  //smview = machines[Object.keys(machines)[0]];
  vsm = vmachines[Object.keys(machines)[0]];
  vsm.addState();

  document.getElementById('file-input')
    .addEventListener('change', fileInputChange, false);

  /*
  let st = new SMType('testmachine');
  st.addState(new SMTypeState('state1'));
  st.addTransition(new SMTypeTransition('sm0','tr1', null, null));
  console.log(JSON.stringify(st));
  */

  document.addEventListener('contextmenu', function(ev) {
      ev.preventDefault();
      editorAction = null;
      return false;
  }, false);

  if(1){
    url='https://juraj.galbavy.sk/pmsm/test18.txt';
    loadMachinesURL(url).then(contents => {
      loadJSON(contents);
    });
  }


}, false);

// source of original function dragElement(elmnt) and draggable css: https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt, onmove, ondone) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;

    //document.onmouseup = (ondone!==undefined)?ondone:closeDragElement;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

    if (onmove!==undefined && onmove!==null) onmove();
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;

    if (ondone!==undefined) ondone();
  }
}

function newMachineId()
{
  machinesCounter += 1;
  return 'sm'+(machinesCounter-1);
}

function getNewViewElemId()
{
  const elemName = 'viewEl_'+elemCounter;
  elemCounter+=1;
  return elemName;
}

function addStateMachine() {
  addSM('test');
}

function addSM(smName) {
  let sm = new SMType(smName);
  sm.view.id = newMachineId();
  machines[sm.view.id]=sm;

  let vsm = new ViewSMType(sm);
  vsm.view.id = sm.view.id;
  vsm.view.diagramId = sm.view.id + '_sd';
  vsm.makeSMElem();
  vmachines[vsm.view.id] = vsm;

  return sm;
}


// * * * * * * * * * * *
function stateOnClick(divId) {
    const state = statesById[divId];
    console.log(`clicked on:${divId} editorAction:${editorAction}`);
    if(editorAction===null) {

    } else if(editorAction && editorAction.type==="connectTransitionFrom") {
        actionConnectTransitionFrom(divId);
        editorAction=null;
    } else if(editorAction && editorAction.type==="connectTransitionTo") {
        actionConnectTransitionTo(divId);
        editorAction=null;
    } else if(editorAction && editorAction.type==="selectStartState") {
        actionConnectStartState(divId);
        editorAction=null;
    }
}

function actionConnectTransitionFrom(fromStateId) {
  const state = statesById[fromStateId];
  let trId = editorAction.trId;
  let tr = transitionsById[trId];
  if(tr.From!==null){
    tr.deleteFrom();
  }

  tr.From = state.Name;
  tr.view.fromId = fromStateId;

  let diagramId = vmachines[tr.view.machineId].view.diagramId;
  let arrowLine = new ArrowLine(diagramId, fromStateId, trId);
  elements[arrowLine.view.id] = arrowLine;
  tr.view.arrowLineFromId = arrowLine.view.id;

  state.addUpdateObserver(trId, () => { transitionsById[trId].update(); } );
  state.addDeleteObserver(trId, () => { if(transitionsById[trId]!==undefined) transitionsById[trId].onConnectedStateDeleted(fromStateId); } );
}

function actionConnectTransitionTo(toStateId) {
  const state = statesById[toStateId];
  let trId = editorAction.trId;
  let tr = transitionsById[trId];
  if(tr.To!==null){
    tr.deleteTo();
  }

  tr.To = state.Name;
  tr.view.toId = toStateId;
  let diagramId = vmachines[tr.view.machineId].view.diagramId;
  let arrowLine = new ArrowLine(diagramId, trId, toStateId);
  elements[arrowLine.view.id] = arrowLine;
  tr.view.arrowLineToId = arrowLine.view.id;

  state.addUpdateObserver(trId, () => { transitionsById[trId].update(); } );
  state.addDeleteObserver(trId, () => { if(transitionsById[trId]!==undefined) transitionsById[trId].onConnectedStateDeleted(toStateId); } );
}

function actionConnectStartState(toStateId) {
  vmachines[editorAction.smId].unsetStartState();
  vmachines[editorAction.smId].setStartStateById(toStateId);

  let diagramId = vmachines[editorAction.smId].view.diagramId;
  let startId = `${diagramId}_start`;

  let arrowLine = new ArrowLine(diagramId, startId, toStateId);
  let arrowLineId = arrowLine.view.id;
  let smId = editorAction.smId;
  elements[arrowLineId] = arrowLine;
  vmachines[smId].view.arrowLineStartId = arrowLineId;

  const state = statesById[toStateId];
  state.addUpdateObserver(arrowLineId, () => { elements[arrowLineId].update(); } );
  state.addDeleteObserver(arrowLineId, () => { vmachines[smId].unsetStartState(); } );
}



function clearView() {
  let arrStates=[...Object.keys(statesById)];
  let arrTr = [...Object.keys(transitionsById)];
  let arrVMachiens = [...Object.keys(vmachines)];
  console.log('arrStates:');
  console.log(arrStates);
  console.log('arrTr:');
  console.log(arrTr);
  arrStates.forEach(divId => {
    ViewSMType.deleteState(divId);
  });

  arrTr.forEach(divId => {
    ViewSMType.deleteTransition(divId);
  });

  console.log('num machines: ' + Object.keys(machines).length);
  console.log('num statesById: ' + Object.keys(statesById).length);
  console.log('num transitionsById: ' + Object.keys(transitionsById).length);
  if(Object.keys(machines).length>0 || Object.keys(statesById).length>0 >> Object.keys(transitionsById).length){
    console.log('some object remained in index');
  }

  arrVMachiens.forEach(vsmId => {
    vmachines[vsmId].delete();
  });

  machines = {};
  vmachines = {};
  machinesCounter = 0;
  //statesById = {};
  //transitionsById = {};
  editorAction = null;
  elemCounter = 0;
  //elements = {};
}


function connectTransitionFrom(divId) {
  editorAction = {type: "connectTransitionFrom", trId:divId};
  console.log(editorAction);
}

function connectTransitionTo(divId) {
  editorAction = {type: "connectTransitionTo", trId:divId};
  console.log(editorAction);
}




function actionViewSimulateMode() {
  editorMode = 'sim';
}


function actionViewEditMode() {
  editorMode = 'edit';
}


class SMType {
  constructor(smName){
    this.smName = smName;
    this.states = {};
    this.transitions = {};
    this.view = {stateCounter: 0, transitionCounter: 0, state_divs:{}};
    this.start = null;
  }

  get Name() {
    return this.smName;
  }

  addState(state) {
    this.states[state.Name]=state;
  }

  addTransition(tr) {
    this.transitions[tr.Name]=tr;
  }

  deleteState(state) {
    state.onDelete();
    delete this.states[state.Name];
  }

  deleteTransition(tr) {
    console.log('SMType deleteTransition called with tr:');
    console.log(tr);
    console.log(`SMType trName to be deleted: ${tr.Name}`);
    console.log('SMType transitions:');
    console.log(this.transitions);
    tr.onDelete();
    delete this.transitions[tr.Name];
  }

  toJSON() {
    //return { [this.smName] : { states:this.states, transitions:this.transitions } };
    return { states:this.states, transitions:this.transitions, start:this.start };
  }

}

class ViewSMType {
  constructor(smType){
    this.model = smType;
    this.view = {diagramId:null};

  }

  makeSMElem() {
    let smId = this.view.id;
    let sdId = this.view.diagramId;
    const html =
    `<div id="${smId}">` +
    `  <h3>State Machine: ${smId}</h3>` +
    `  <button onclick="vmachines['${smId}'].addState();">Add state</button>` +
    `  <button onclick="vmachines['${smId}'].addTransition(null,null);">Add transition</button>` +
    `  <button onclick="ViewSMType.deleteById('${smId}');">Delete state machine</button>` +
    `  <div class="statediagram" id="${sdId}">` +
    `    <div class="start-state" id="${sdId}_start" onclick="ViewSMType.selectStartState('${smId}');"></div>` +
    '</div>' +
    '</div>';

    let myDiv = htmlToElement(html);

    // add the newly created element and its content into the DOM
    const machinesEl = document.getElementById("machines");
    machinesEl.appendChild(myDiv);

    return myDiv;
  }

  addState(stateName) {
    let sm = this.model;
    if(stateName === undefined || stateName === null) {
      do {
        stateName = 'st'+sm.view.stateCounter;
        sm.view.stateCounter+=1;
      } while( stateName in this.model.states);
    }

    //let stateName = prompt("Please enter state name", "new state");
    const divId = sm.view.id+'_'+stateName+'_mydiv';

    let state = new SMTypeState(stateName);

    state.view = { id: divId, machineId: sm.view.id };
    sm.addState(state);

    sm.view.state_divs[divId] = sm.states[stateName];
    statesById[divId] = state;

    let myDiv = state.makeElem(divId);

    // add the newly created element and its content into the DOM
    const sd = document.getElementById(this.view.diagramId);
    sd.appendChild(myDiv);

    let elem = document.getElementById(divId);
    dragElement(elem,
                () => {
                  let state = statesById[divId];
                  state.view.top = elem.offsetTop;
                  state.view.left = elem.offsetLeft;
                  state.update();
                },
                () => {
                  let state = statesById[divId];
                  state.view.top = elem.offsetTop;
                  state.view.left = elem.offsetLeft;
                  state.update();
                }
    );
    state.view.top = elem.offsetTop;
    state.view.left = elem.offsetLeft,
    state.update();
    return state;
  }

  static renameState(divId) {
    let newName = prompt('Please enter new name of the state.', 'new name');
    let state = statesById[divId];
    let machineId = statesById[divId].view.machineId;
    let oldName = state.Name;
    let machine = machines[machineId];
    state.Name = newName;

    Object.values(machine.transitions).forEach(tr => {
      console.log(tr);
      if(tr.data.from===oldName) {
        tr.data.from = newName;
        console.log(`changing ${tr.Name} from state from ${oldName} to ${newName}`);
      }

      if(tr.data.to===oldName) {
        tr.data.to = newName;
        console.log(`changing ${tr.Name} to state from ${oldName} to ${newName}`);
      }
    });

    if(machine.start===oldName) {
      machine.start = newName;
    }

    machine.states[newName] = state;
    delete machine.states[oldName];

    state.update();

  }

  static deleteState(divId) {
    let machineId = statesById[divId].view.machineId;
    machines[machineId].deleteState(statesById[divId]);

    const element = document.getElementById(divId);
    element.remove();

    delete statesById[divId];
  }

  addTransition(from, to) {
    let sm = this.model;
    const trName = 'tr'+sm.view.transitionCounter;
    sm.view.transitionCounter+=1;
    const divId = `${sm.view.id}_${trName}_mydiv`;

    let tr = new SMTypeTransition(sm.view.id, trName, from, to);
    tr.view = { id: divId, machineId: sm.view.id, fromId: null, toId: null, arrowLineFromId: null, arrowLineToId: null, triggers:{} };
    sm.addTransition(tr, from, to);

    transitionsById[divId] = tr;

    let myDiv = tr.makeElem(divId);

    // add the newly created element and its content into the DOM
    const sd = document.getElementById(this.view.diagramId);
    sd.appendChild(myDiv);

    let elem = document.getElementById(divId);
    dragElement(elem,
                () => {
                  let tr = transitionsById[divId];
                  tr.view.top = elem.offsetTop;
                  tr.view.left = elem.offsetLeft;
                  tr.update();
                },
                () => {
                  let tr = transitionsById[divId];
                  tr.view.top = elem.offsetTop;
                  tr.view.left = elem.offsetLeft;
                  tr.update();
                }
    );

    tr.view.top = elem.offsetTop;
    tr.view.left = elem.offsetLeft,
    tr.update();
    return tr;
  }

  static renameTransition(divId) {
    let newName = prompt('Please enter new name of the transition.', 'new name');
    let tr = transitionsById[divId];
    let oldName = tr.Name;
    tr.Name = newName;

    let machineId = tr.view.machineId;
    let machine = machines[machineId];
    machine.transitions[newName] = tr;
    delete machine.transitions[oldName];
    tr.update();
  }

  static deleteTransition(divId) {
    let machineId = transitionsById[divId].view.machineId;
    machines[machineId].deleteTransition(transitionsById[divId]);

    delete transitionsById[divId];
  }


  setStartStateById(stateId) {
    console.log('stateId:');
    console.log(stateId);// ${statesById[stateId]}`);
    this.view.initialStateId = stateId;
    this.model.start = statesById[stateId].Name;
  }

  unsetStartState() {
    if(this.view.arrowLineStartId !== undefined && this.view.arrowLineStartId !== null){
      let arrowLine = elements[this.view.arrowLineStartId];
      arrowLine.delete();
      statesById[this.view.initialStateId].deleteUpdateObserver(this.view.arrowLineStartId);
      statesById[this.view.initialStateId].deleteDeleteObserver(this.view.arrowLineStartId);


    }
    this.view.arrowLineStartId = null;
    this.view.initialStateId = null;
    this.model.start =null;
  }

  static selectStartState(smId) {
    editorAction = { type:"selectStartState", smId:smId };
  }

  delete() {
    Object.values(this.model.states).forEach( state => {
      ViewSMType.deleteState(state.view.id);
    });

    Object.values(this.model.transitions).forEach( tr => {
      ViewSMType.deleteTransition(tr.view.id);
    });

    document.getElementById(this.view.id).remove();
  }

  static deleteById(smId){
    vmachines[smId].delete();
    delete vmachines[smId];
    delete machines[smId];
  }
}

class SMTypeState {
  constructor(stateName){
    this.stateName = stateName;
    this.data = {diagram:{top:0,left:0}};
    this.updateObservers = {};
    this.deleteObservers = {};
  }

  get Name() {
    return this.stateName;
  }

  set Name(name) {
    this.stateName = name;
    this.data.name = name;
  }

  makeElem(divId) {
    const html =
    `<div class="statediv" id="${divId}" onclick=stateOnClick("${divId}");>` +
    `<div class="statedivheader mydivheader" id="${divId}header">State` +
    `<button onclick="ViewSMType.deleteState('${divId}');">D</button>` +
    '</div>'+
    `<button onclick="ViewSMType.renameState('${divId}');" style="margin: 6px; display:inline-block; float:left;">R</button>` +
    `<div id="${divId}_name" style="display:inline-block; width: fit-content; margin: 6px;">${this.Name}</div>` +
    ``+
    '</div>';
    //&#9732;
    let myDiv = htmlToElement(html);
    return myDiv;
  }

  update() {
    this.data.diagram.top = this.view.top;
    this.data.diagram.left = this.view.left;

    let elem = document.getElementById(this.view.id);
    if(elem.style.top!=this.view.top) elem.style.top = this.view.top + 'px';
    if(elem.style.left!=this.view.left) elem.style.left = this.view.left + 'px';

    document.getElementById(`${this.view.id}_name`).innerHTML = this.Name;

    Object.values(this.updateObservers).forEach(val => {
      val();
    });
  }

  onDelete() {
    console.log('onDelete');
    Object.values(this.deleteObservers).forEach(val => {
      val();
    });
  }

  addUpdateObserver(id, observer) {
    this.updateObservers[id] = observer;
  }

  deleteUpdateObserver(id) {
    delete this.updateObservers[id];
  }

  addDeleteObserver(id, observer) {
    this.deleteObservers[id] = observer;
  }

  deleteDeleteObserver(id) {
    delete this.deleteObservers[id];
  }

  toJSON() {
    return this.data;
  }
}

class SMTypeTransition {
  constructor(smName, trName, from, to){
    this.Name = trName;
    this.data = {name: trName, from:from, to:to, triggers:[], action:null, diagram:{top:0, left:0}};
    this.smName = smName;
    this.triggersCounter = 0;
  }

  get From() { return this.data.from; }
  set From(from){ this.data.from = from; }
  get To() { return this.data.to; }
  set To(to) { this.data.to = to; }

  get Name() { return this.trName; }

  set Name(name) {
    this.trName = name;
  }

  makeElem(divId) {
    const html =
    `<div class="transitiondiv" id="${divId}">` +
    `<div class="transitiondivheader mydivheader" id="${divId}header">Transition` +
    `<button onclick="ViewSMType.deleteTransition('${divId}');">D</button>` +
    '</div>'+
    `<div style="margin-top:0.2em; text-align: center; position:relative;"><button onclick="connectTransitionFrom('${divId}');" style="position:absolute; left:0px;">&#10132;&#124;</button>`+
    `<button onclick="ViewSMType.renameTransition('${divId}');" style="margin: 6px; display:inline-block;">R</button>`+
    `<div id="${divId}_name" style="text-align:center; display:inline-block; ">${this.trName}</div>` +
    `<button onclick="connectTransitionTo('${divId}');" style="position:absolute; right:0px;">&#124;&#10132;</button></div>`+

    //'<form style="background:red;display:flex;">'+
    `action: <input type="text" id="${divId}_actiontext" onchange="SMTypeTransition.actionChanged('${divId}');" style="width:auto"/>`+
    `<div id="${divId}_triggers"></div>`+
    `<button onclick="SMTypeTransition.addEmptyTrigger('${divId}');" style="float:right;">+T</button>`+
    '</div>';
    //&#9732;
    let myDiv = htmlToElement(html);
    return myDiv;
  }

  update() {
    this.data.diagram.top = this.view.top;
    this.data.diagram.left = this.view.left;

    let elem = document.getElementById(this.view.id);
    if(elem.style.top!=this.view.top) elem.style.top = this.view.top + 'px';
    if(elem.style.left!=this.view.left) elem.style.left = this.view.left + 'px';

    document.getElementById(`${this.view.id}_name`).innerHTML = this.trName;
    document.getElementById(`${this.view.id}_actiontext`).value = this.data.action;

    Object.keys(this.view.triggers).forEach(triggerId => {
      document.getElementById(`${triggerId}_text`).value = this.view.triggers[triggerId].eventName;
    });

    if(this.view.arrowLineFromId != null) {
      elements[this.view.arrowLineFromId].update();
    }

    if(this.view.arrowLineToId != null) {
      elements[this.view.arrowLineToId].update();
    }


  }

  onConnectedStateDeleted(stateId) {
    if(this.view.fromId===stateId) this.deleteFrom();
    if(this.view.toId===stateId) this.deleteTo();
  }

  deleteFrom() {
    if(this.view.arrowLineFromId !==null){
      let arrowLine = elements[this.view.arrowLineFromId];
      arrowLine.delete();
      if((this.view.fromId in statesById) && statesById[this.view.fromId]!==null && (this.view.toId===undefined || this.view.toId===null)) {
        statesById[this.view.fromId].deleteUpdateObserver(this.view.id);
        statesById[this.view.fromId].deleteDeleteObserver(this.view.id);
      }
      this.view.arrowLineFromId = null;
    }
    this.view.fromId = null;
    this.data.from = null;
  }

  deleteTo() {
    if(this.view.arrowLineToId !==null){
      let arrowLine = elements[this.view.arrowLineToId];
      arrowLine.delete();
      if((this.view.toId in statesById) && statesById[this.view.toId]!==null && (this.view.fromId===undefined || this.view.fromId===null)) {
        statesById[this.view.toId].deleteUpdateObserver(this.view.id);
        statesById[this.view.toId].deleteDeleteObserver(this.view.id);
      }
      this.view.toId = null;
      this.view.arrowLineToId = null;
    }
    this.data.to = null;
  }

  onDelete() {
    this.deleteFrom();
    this.deleteTo();

    const element = document.getElementById(this.view.id);
    element.remove();
  }

  static actionChanged(trId) {
    let value = document.getElementById(`${trId}_actiontext`).value;
    transitionsById[trId].data.action = value;
  }


  getNewTriggerId() {
    this.triggersCounter++;
    return `${this.view.id}_trig${this.triggersCounter-1}`;
  }

  static addEmptyTrigger(trId) {
    let tr = transitionsById[trId];
    let trigId = tr.getNewTriggerId();
    let trigger = {eventName:null};
    tr.view.triggers[trigId] = trigger;

    const html =
    `<div class="" id="${trigId}" style="">` +
    `T: <input type="text" id="${trigId}_text" style="width:auto" onchange="SMTypeTransition.triggerChanged('${tr.view.id}','${trigId}');"/>` +
    `<button onclick="SMTypeTransition.deleteTrigger('${trId}','${trigId}');">D</button>` +
    '</div><br>';
    //&#9732;
    let myDiv = htmlToElement(html);
    document.getElementById(`${tr.view.id}_triggers`).appendChild(myDiv);
    return trigId;
  }

  static triggerChanged(trId, trigId) {
    let value = document.getElementById(`${trigId}_text`).value;
    let tr = transitionsById[trId];
    tr.view.triggers[trigId].eventName = value;
    console.log(tr.view.triggers);
  }

  static deleteTrigger(trId, trigId) {
    let tr = transitionsById[trId];
    let trigger = tr.view.triggers[trigId];
    document.getElementById(`${trigId}`).remove();
    delete tr.view.triggers[trigId];
    console.log(tr.view.triggers);
  }

  toJSON() {
    this.data.triggers = [];
    Object.values(this.view.triggers).forEach(trig => {
      this.data.triggers.push(trig);
    });

    console.log('transition toJSON this.data:');
    console.log(this.data);
    return this.data;
  }
}


function getJSON() {
  return JSON.stringify(machines, null, '    ');
}

function generateJSON() {
  output=document.getElementById('output');
  output.innerHTML = getJSON();
}





// source of function download(filename, text):
// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
// author: https://stackoverflow.com/users/2438165/mat%c4%9bj-pokorn%c3%bd
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function saveOnClick() {
  download('test.txt', getJSON());
}

function fileInputChange(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    loadJSON(contents);
  };
  reader.readAsText(file);
}

function loadJSON(contents) {
  const obj = JSON.parse(contents);
  let arrSM = [...Object.keys(obj)];

  clearView();

  machinesCounter = 0;
  arrSM.forEach( smName => {
    console.log(`smName: ${smName}`);
    //let smId = newMachineId();
    loadJSONSM(smName, obj[smName]);
  });


  editorAction = null;
}

function loadJSONSM(smname, sm) {
  let smview = addSM(smname);
  //let smId = smview.view.id;
  //smview = machines[smview.view.id];
  vsm = vmachines[smview.view.id];

  for (const stname in sm.states) {
    let stateProperties = sm.states[stname];
    let tmp = vsm.addState(stname);
    tmp.Name = stname;
    tmp.view.top = stateProperties.diagram.top;
    tmp.view.left = stateProperties.diagram.left;
    tmp.update();
  }

  if( sm.start !==undefined && sm.start !== null ) {
    if(sm.start in smview.states) {
      editorAction = { type:"selectStartState", smId: smview.view.id };
      actionConnectStartState(smview.states[sm.start].view.id);
    } else {
      alert('Error loading JSON definition! '+`Start state '${sm.start}' for state machine ${smname} not found.`);
    }
  }

  for (const trname in sm.transitions) {
    let trProperties = sm.transitions[trname];
    if(!(trProperties.from in smview.states)) {
      alert('Error loading JSON definition! '+`Source state '${sm.start}' for state machine ${smname} and it's transition '${trname}' not found.`);
    }
    if(!(trProperties.to in smview.states)) {
      alert('Error loading JSON definition! '+`Destination state '${sm.start}' for state machine ${smname} and it's transition '${trname}' not found.`);
    }


    console.log(trProperties);
    let tmp = vsm.addTransition(trProperties.from, trProperties.to);
    tmp.Name = trname;
    tmp.data.action = trProperties.action;
    tmp.view.top = trProperties.diagram.top;
    tmp.view.left = trProperties.diagram.left;

    let trId = tmp.view.id;

    trProperties.triggers.forEach(trigger => {
      console.log('=>trigger');
      console.log(trigger);
      let trigId = SMTypeTransition.addEmptyTrigger(trId);
      tmp.view.triggers[trigId] = trigger;
      console.log(tmp);

    });

    tmp.update();

    if(tmp.data.from!==undefined && tmp.data.from!==null && tmp.view.arrowLineFromId===null) {
      if(tmp.data.from in smview.states) {
        let stateDivId = smview.states[tmp.data.from].view.id;
        editorAction = {type: "connectTransitionFrom", trId:tmp.view.id};
        actionConnectTransitionFrom(stateDivId);
      }
    }

    if(tmp.data.to!==undefined && tmp.data.to!==null && tmp.view.arrowLineToId===null) {
      if(tmp.data.to in smview.states) {
        let stateDivId = smview.states[tmp.data.to].view.id;
        editorAction = {type: "connectTransitionTo", trId:tmp.view.id};
        actionConnectTransitionTo(stateDivId);
      }
    }
  }
}


function getId(id) {
  const el = document.getElementById(id);
  if(!el) throw Error(`cannot find #${id}`);
  return el;
}

function getOffset2(  el ) {
    var rect = el.getBoundingClientRect();
    return {
        left: el.offsetLeft,
        top: el.offsetTop,
        width: rect.width || el.offsetWidth,
        height: rect.height || el.offsetHeight
    };
}

class ArrowLine {
  constructor(parentDivElemId, divFromId, divToId){
    this.data = {type: 'arrowline', thickness:2, color: 'black'};
    this.view = {id:getNewViewElemId(), ArrowId: getNewViewElemId(), LineId:getNewViewElemId(), parentDiv:parentDivElemId, divFrom:divFromId, divTo:divToId};

    var htmlLine = "<div id='"+this.view.LineId+"' style='padding:0px; margin:0px; height:" + this.data.thickness + "px; background-color:" + this.data.color + "; line-height:1px; position:absolute; display:block; left:0px; top:0px; width:0px;' />";
    let parentDivElem = document.getElementById(parentDivElemId);
    parentDivElem.appendChild(htmlToElement(htmlLine));

    let arrow = this.makeArrowElem(0, 0, 0, this.view.ArrowId);
    parentDivElem.appendChild(arrow);
    this.update();
  }

  update() {
    let div1 = document.getElementById(this.view.divFrom);
    let div2 = document.getElementById(this.view.divTo);
    var off1 = getOffset2(div1);
    var off2 = getOffset2(div2);

    // line from center of 'from' div
    var x1 = off1.left + off1.width/2;
    var y1 = off1.top + off1.height/2;

    // line to side of 'to' div
    let sideCenter = getToSideCenter(div1, div2, x1, y1);

    var x2 = sideCenter.x;
    var y2 = sideCenter.y;

    // distance
    var length = Math.sqrt(((x2-x1) * (x2-x1)) + ((y2-y1) * (y2-y1)));
    // center
    var cx = ((x1 + x2) / 2) - (length / 2);
    var cy = ((y1 + y2) / 2) - (this.data.thickness / 2);
    // angle
    var angle = Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);
    // make hr
    var lineStyle = "padding:0px; margin:0px; height:" + this.data.thickness + "px; background-color:" + this.data.color + "; line-height:1px; position:absolute; display:block; left:" + cx + "px; top:" + cy + "px; width:" + length + "px; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg);";

    let el = document.getElementById(this.view.LineId);
    el.setAttribute('style', lineStyle);

    // update arrow
    this.updateArrowElem(sideCenter.x, sideCenter.y, angle+180);

  }

  makeArrowElem(x, y, angle, id)
  {
    const arrowW = 12;
    const arrowH = 10;
    let cx = x-arrowW;
    let cy = y-arrowH;
    var htmlArrow = "<div id='"+id+"'class='arrow-right' style='left:" + cx + "px; top:" + cy + "px; transform-origin:center right; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform: rotate(" + angle + "deg);' />";
    return htmlToElement(htmlArrow);
  }

  updateArrowElem(x, y, angle)
  {

    const arrowW = 12;
    const arrowH = 5;
    let cx = x-arrowW;
    let cy = y-arrowH;
    var style = "left:" + cx + "px; top:" + cy + "px; transform-origin:center right; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform: rotate(" + angle + "deg);";
    let arrowEl = document.getElementById(this.view.ArrowId);
    arrowEl.setAttribute('style', style);
  }

  delete() {
    delete elements[this.view.id];
    document.getElementById(this.view.ArrowId).remove();
    document.getElementById(this.view.LineId).remove();
  }

}

function getToSideCenter(divFrom, divTo, fromX, fromY) {
  var offTo = getOffset2(divTo);
  switch(whichSide(divFrom, divTo, fromX, fromY)) {
    case 'top': return {x: offTo.left+offTo.width/2, y: offTo.top};
    case 'left': return {x: offTo.left, y: offTo.top+offTo.height/2};
    case 'right': return {x: offTo.left+offTo.width, y: offTo.top+offTo.height/2};
    case 'bottom': return {x: offTo.left+offTo.width/2, y: offTo.top+offTo.height};
  }
}


function whichSide(divFrom, divTo, X, Y)
{
  var off1 = getOffset2(divTo);
  //var off2 = getOffset2(divFrom);

  // from top left to bottom right line
  let Ax = off1.left;
  let Ay = off1.top;
  let Bx = off1.left + off1.width;
  let By = off1.top + off1.height;

  let seg13 = Math.sign((Bx - Ax) * (Y - Ay) - (By - Ay) * (X - Ax));

  Ax = off1.left;
  Ay = off1.top + off1.height;
  Bx = off1.left + off1.width;
  By = off1.top;

  let seg24 = Math.sign((Bx - Ax) * (Y - Ay) - (By - Ay) * (X - Ax));
  //console.log(`seg13: ${seg13} seg24: ${seg24}`);
  // 1 -1 left
  // -1 -1 top
  // -1 1 right
  // 1 1 bottom
  if(seg13==1) { // left or bottom
    if(seg24==-1 || seg24==0) return 'left';
                              else return 'bottom';
  } else {
    if(seg24==1 || seg24==0) return 'right';
                              else return 'top';
  }
}


function makeArrowElem(x, y, angle)
{
  const arrowW = 50
  const arrowH = 10;
  let cx = x-arrowW;
  let cy = y-arrowH;
  var htmlArrow = "<div class='arrow-right' style='left:" + cx + "px; top:" + cy + "px; transform-origin:center right; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform: rotate(" + angle + "deg);' />";
  return htmlToElement(htmlArrow);
}
