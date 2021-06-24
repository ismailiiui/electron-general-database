// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const DATABASE_FILENAME = "file.db";
const DATABASE_DRIVER = "sqlite3";
const DATATABLE_ID = "#example";
const databaseholder = require(DATABASE_DRIVER);
var table =$(DATATABLE_ID).DataTable();



function addbuttonlistener(btnid,queryholderid,updateholderid)
{
var ModalElBtn = document.getElementById(btnid);
ModalElBtn.addEventListener('click', function (event) {
	var querytext = document.querySelector("#" + queryholderid).value;
	executequery(querytext,updateholderid);
});
	
}

function executequery(querytext,updateholderid)
{
var db = new databaseholder.Database(DATABASE_FILENAME);
var bar = new Promise((resolve, reject) => {
db.run(querytext, function (err, row) {
	 console.log (row);
	 console.log (err);
	 if (err)
	 {
		 if (updateholderid)
		{
		 document.querySelector("#" + updateholderid).innerHTML = err;
		 document.querySelector("#" + updateholderid).style.background = 'red';
		 document.querySelector("#" + updateholderid).style.color = 'white';
		}
	 } else{
		 resolve();
	 }
	 
});	
});
bar.then(() => {
    console.log('Finished');	
	if (updateholderid)
	{
	document.querySelector("#" + updateholderid).innerHTML = 'Finished';
	document.querySelector("#" + updateholderid).style.background = 'green';
    document.querySelector("#" + updateholderid).style.color = 'white';
	}
	db.close();
	if (querytext.toLowerCase().includes("create table"))
	{
		gettablenames();
	}
});
}
function updatetablename(tablename)
{
	document.querySelector("#tablenamepill").innerHTML = tablename;
}
function updaterowcount(rowcount)
{
	document.querySelector("#trowcountpill").innerHTML = rowcount;
}
function gettablenames()
{ 
var db = new databaseholder.Database(DATABASE_FILENAME);
var intnum = 0;
var recordcount = 0;
var bar = new Promise((resolve, reject) => {
db.each("SELECT count(*) as cnt from sqlite_master where type='table'", function (err, row) {
	 recordcount = row.cnt;
	 console.log ('count ' + recordcount);
	 resolve();
});	
});
bar.then(() => {
    console.log('counted records');
	let arrdatatablenames = new Array();
	db.each("select name from sqlite_master where type='table'", function (err, row) {
	 arrdatatablenames.push(row.name);
	 intnum += 1;
	 if (intnum === recordcount) { populatetablenames(arrdatatablenames);}
	 
});
db.close();
}); 
}

function populatetablenames(arrdatatablenames)
{
	console.log('populating table names');
	var selectctrl = document.querySelector('#selecttablenames');
	selectctrl.innerHTML = "";
	selectctrl.options.add(new Option("Select table",0));
		for(let k in arrdatatablenames){
			selectctrl.options.add(new Option(arrdatatablenames[k], arrdatatablenames[k]));
		}
	
}

function rundatatable(arrdata) {
	console.log('running data table');
    console.log(arrdata);
	table =$(DATATABLE_ID).DataTable();
	table.clear();
    table.rows.add(arrdata);
    table.draw();
	
} 
function setupdbstuff(tablename)
{ 
var intnum = 0;
var recordcount = 0;
var db = new databaseholder.Database(DATABASE_FILENAME);
var bar = new Promise((resolve, reject) => {
db.each("SELECT count(*) as cnt FROM " + tablename + " order by rowid desc", function (err, row) {
	 recordcount = row.cnt;
	 updaterowcount(recordcount);
	 console.log ('count ' + recordcount);
	 resolve();
});	
});
bar.then(() => {
    console.log('counted records');
	var arrdata = new Array();
	
	var innerbar = new Promise((resolve, reject) => {
	db.each("SELECT * FROM " + tablename + " order by rowid desc", function (err, row) {
	 arrdata.push(Object.values(row));
	 console.log('working inside');
	 intnum += 1;
	 if (intnum === recordcount) { rundatatable(arrdata); resolve();}
	 });
   });
	innerbar.then(() => {
		 db.close();
	});
}); 
}
function getColumnNames(tablename, formgenerationid)
{ 
var intnum = 0;
var recordcount = 0;
var db = new databaseholder.Database(DATABASE_FILENAME);
var bar = new Promise((resolve, reject) => {
db.each("SELECT COUNT(*) as cnt FROM pragma_table_info('" + tablename + "');", function (err, row) {
	 recordcount = row.cnt;
	 console.log ('count ' + recordcount);
	 resolve();
});	
});
bar.then(() => {
    console.log('counted records column names');
	var arrdata = new Array();
	
	var innerbar = new Promise((resolve, reject) => {
	db.each("SELECT * FROM pragma_table_info('" + tablename + "');", function (err, row) {
	console.log(row);
	 arrdata.push(row);
	 console.log('working inside column names');
	 intnum += 1;
	 if (intnum === recordcount) { populate_generatedform(arrdata,formgenerationid,tablename); resolve();}
	 });
   });
	innerbar.then(() => {
		 db.close();
	});
}); 
}

function populate_generatedform(arrdata,id,tablename)
{
	console.log('form generating...');
	var formbody = document.querySelector(id);
	formbody.innerHTML = "";
	var columnnames = "";
	var columnvalues = "";
	  for (let k in arrdata)
	{
		columnnames = columnnames + arrdata[k].name + ",";
		
		var nulldecide = (arrdata[k].notnull == "0") ? 'Not Null' : 'Null Allowed';
		var ispk = (arrdata[k].pk) ? 'Primary key ' : '';
		if (ispk)
		{
			columnvalues = columnvalues + "NULL,"
		} else
		{
			columnvalues = columnvalues + "'',"
		}
		formbody.innerHTML = formbody.innerHTML + modal_row(arrdata[k].name,arrdata[k].type + '  ' + nulldecide + '  ' +  ispk);
		
	}
	columnnames = columnnames.substr(0,columnnames.length - 1);
	columnvalues = columnvalues.substr(0,columnvalues.length - 1);
	var querytext = "INSERT INTO " + tablename + " (" + columnnames + ") values(" + columnvalues + ")";
	console.log(querytext);
	document.querySelector("#inputaddquery").innerHTML = querytext;
	
	document.querySelector("#adddataupdateholder").style.background = 'white';
    document.querySelector("#adddataupdateholder").innerHTML = '';
	document.querySelector("#inputaddquery").value = querytext;
}

function populatedatatables(tablename)
{ 
console.log('Finding Columns For ' + tablename);
var db = new databaseholder.Database(DATABASE_FILENAME);
var intnum = 0;
var recordcount = 0;
var bar = new Promise((resolve, reject) => {
db.get("SELECT * FROM " + tablename + " LIMIT 1", function (err, row) {
//db.get("PRAGMA table_info(contacts);", function (err, row) {
	 console.log('this ran');
	 console.log(err);
	 console.log(row);
	 if (row){
		 addtableheads(Object.keys(row),tablename,true);
	 
	 resolve(); 
	 } else{
		addtableheads(null,tablename, false);
		updaterowcount(0);
		alert("Looks like table is empty"); 
	 }
	
	
});	
});
bar.then(() => {
   db.close();

});

}

function addtableheads(arr,tablename,move)
{
	
	
  if (move)
  {
	  table.destroy();
	 var tableheader = document.querySelector(DATATABLE_ID + " > thead > tr" );
	tableheader.innerHTML = "";
	var tablebody = document.querySelector(DATATABLE_ID + " > tbody" );
	tablebody.innerHTML = "";
	
	  for (let k in arr)
	{
		var head = document.createElement("th");   // Create a <button> element
		head.innerHTML = arr[k];                   // Insert text
		tableheader.appendChild(head);  
		
	}
	  setupdbstuff(tablename);
  } else{
	  var tableheader = document.querySelector(DATATABLE_ID + " > thead > tr" );
	tableheader.innerHTML = "";
	var tablebody = document.querySelector(DATATABLE_ID + " > tbody" );
	tablebody.innerHTML = "";
  }
	
}

function setup_eventlisteners()
{
	var ModalElBtn = document.querySelector('#loadtable_btn');
   ModalElBtn.addEventListener('click', function (event) {
	   var tablename = document.querySelector('#selecttablenames').value;
	   if (tablename != "0")
	   {
		   populatedatatables(tablename);	
		   updatetablename(tablename);
	   } else{
		   
		   alert('select a table');
	   }
	
  });
  
  
  var dataformmodal = document.querySelector('#AddNewTableDataModal');
  dataformmodal.addEventListener('shown.bs.modal', function () {
  var formbody = document.querySelector("#inputformholder");
	formbody.innerHTML = "";
})
   
  var ModalElBtn = document.querySelector('#inputformgenerator');
   ModalElBtn.addEventListener('click', function (event) {
	   var tablename = document.querySelector('#selecttablenames').value;
	   if (tablename != "0")
	   {
		  
		   getColumnNames(tablename,"#inputformholder");
	   } else{
		   
		   alert('select a table');
	   }
	
  });
  
  
  var ModalDeLBtn = document.querySelector('#deletedata_btn');
  var popover = new bootstrap.Popover(ModalDeLBtn, {sanitize:false, animation: true, html: true, placement:'top', title:'ARE YOU SURE?',template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body text-center"> </div></div>',content:'<button type="button" id="confirmdeletedata_btn" class="btn btn-danger">Yes?</button>'});
  
  ModalDeLBtn.addEventListener('click', function (event) {
	
popover.show();
	 var ConfirmModalDeLBtn = document.querySelector('#confirmdeletedata_btn');
	  ConfirmModalDeLBtn.addEventListener('click', function (event) {
		var tablename = document.querySelector('#selecttablenames');
		
	   if (tablename.value != "0")
	   {
		   executequery("DROP TABLE " + tablename.value, null);
		   tablename.removeChild(tablename.children[tablename.selectedIndex]);
		  popover.hide();
	   } else{
		   
		   alert('select a table');
	   }
	  });
  });
  
	
}

//setupdbstuff();

dbapp_populateinfo();
setup_eventlisteners();
addbuttonlistener("createtablesave_btn","inputcreatequery","createtableupdateholder");
addbuttonlistener("tabledatasave_btn","inputaddquery","adddataupdateholder");
gettablenames();
