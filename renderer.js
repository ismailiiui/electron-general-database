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
const { readFile } = require('fs/promises');
var table = $(DATATABLE_ID).DataTable();
var querycountertext = "";
var bulkinsertprefix = "";
var bulkinsertcolumnnames = "";
var importedfilename = "";

function addbuttonlistener(btnid, queryholderid, updateholderid) {
    var ModalElBtn = document.querySelector(btnid);
    ModalElBtn.addEventListener('click', function(event) {
        var querytext = document.querySelector(queryholderid).value;
        var indexofwhere = querytext.toLowerCase().indexOf('where');
        var whereclause = querytext.substr(indexofwhere, querytext.length - indexofwhere);
        if (querytext.toLowerCase().indexOf("select") == 0) {
            var tablename = document.querySelector('#selecttablenames').value;
            if (querytext.toLowerCase().includes(" limit ")) {

                populatedatatables(querytext, tablename, querycountertext + " " + whereclause, querytext);
            } else {
                populatedatatables(querytext + " LIMIT 1 ", tablename, querycountertext, querytext);
            }
        } else {
            executequery(querytext, updateholderid);
        }
    });
}

function executequery(querytext, updateholderid) {
    var db = new databaseholder.Database(DATABASE_FILENAME);
    var bar = new Promise((resolve, reject) => {
        db.run(querytext, function(err, row) {
            console.log(row);
            console.log(err);
            if (err) {
                if (updateholderid) {
                    document.querySelector(updateholderid).innerHTML = err;
                    document.querySelector(updateholderid).style.background = 'red';
                    document.querySelector(updateholderid).style.color = 'white';
                }
            } else {
                resolve();
            }

        });
    });
    bar.then(() => {
        console.log('Finished');
        if (updateholderid) {
            document.querySelector(updateholderid).innerHTML = 'Finished';
            document.querySelector(updateholderid).style.background = 'green';
            document.querySelector(updateholderid).style.color = 'white';
        }
        db.close();
        if (querytext.toLowerCase().includes("create table")) {
            gettablenames();
        }
    });
}

function updatetablename(tablename) {
    document.querySelector("#tablenamepill").innerHTML = tablename;
}

function updaterowcount(rowcount) {
    document.querySelector("#trowcountpill").innerHTML = rowcount;
}

function gettablenames() {
    var db = new databaseholder.Database(DATABASE_FILENAME);
    var intnum = 0;
    var recordcount = 0;
    var bar = new Promise((resolve, reject) => {
        db.each("SELECT count(*) as cnt from sqlite_master where type='table'", function(err, row) {
            recordcount = row.cnt;
            console.log('count ' + recordcount);
            resolve();
        });
    });
    bar.then(() => {
        console.log('counted records');
        let arrdatatablenames = new Array();
        db.each("select name from sqlite_master where type='table'", function(err, row) {
            arrdatatablenames.push(row.name);
            intnum += 1;
            if (intnum === recordcount) { populatetablenames(arrdatatablenames); }

        });
        db.close();
    });
}

function populatetablenames(arrdatatablenames) {
    console.log('populating table names');
    var selectctrl = document.querySelector('#selecttablenames');
    selectctrl.innerHTML = "";
    selectctrl.options.add(new Option("Select table", 0));
    for (let k in arrdatatablenames) {
        selectctrl.options.add(new Option(arrdatatablenames[k], arrdatatablenames[k]));
    }

}

function rundatatable(arrdata) {
    console.log('running data table');
    console.log(arrdata);
    table = $(DATATABLE_ID).DataTable();
    table.clear();
    table.rows.add(arrdata);
    table.draw();
}

function setupdbstuff(counterquery, latterquery) {
    var intnum = 0;
    var recordcount = 0;
    var db = new databaseholder.Database(DATABASE_FILENAME);
    var bar = new Promise((resolve, reject) => {
        db.each(counterquery, function(err, row) {
            recordcount = row.cnt;
            updaterowcount(recordcount);
            console.log('count ' + recordcount);
            resolve();
        });
    });
    bar.then(() => {
        console.log('counted records');
        var arrdata = new Array();

        var innerbar = new Promise((resolve, reject) => {
            db.each(latterquery, function(err, row) {
                arrdata.push(Object.values(row));
                console.log('working inside');
                intnum += 1;
                if (intnum === recordcount) {
                    rundatatable(arrdata);
                    resolve();
                }
            });
        });
        innerbar.then(() => {
            db.close();
        });
    });
}

function getColumnNames(tablename, formgenerationid, textareaid, updateholderid, queryprefix) {
    var intnum = 0;
    var recordcount = 0;
    var db = new databaseholder.Database(DATABASE_FILENAME);
    var bar = new Promise((resolve, reject) => {
        db.each("SELECT COUNT(*) as cnt FROM pragma_table_info('" + tablename + "');", function(err, row) {
            recordcount = row.cnt;
            console.log('count ' + recordcount);
            resolve();
        });
    });
    bar.then(() => {
        console.log('counted records column names');
        var arrdata = new Array();

        var innerbar = new Promise((resolve, reject) => {
            db.each("SELECT * FROM pragma_table_info('" + tablename + "');", function(err, row) {
                console.log(row);
                arrdata.push(row);
                console.log('working inside column names');
                intnum += 1;
                if (intnum === recordcount) {
                    populate_generatedform(arrdata, formgenerationid, tablename, textareaid, updateholderid, queryprefix);
                    resolve();
                }
            });
        });
        innerbar.then(() => {
            db.close();
        });
    });
}

function populate_generatedform(arrdata, id, tablename, textareaid, updateholderid, queryprefix) {
    console.log('form generating...');
    var formbody = document.querySelector(id);
    formbody.innerHTML = "";
    var columnnames = "";
    var updatecolumnsvalues = "";
    bulkinsertcolumnnames = "";
    var columnvalues = "";
    for (let k in arrdata) {
        columnnames = columnnames + arrdata[k].name + ",";

        var nulldecide = (arrdata[k].notnull == "0") ? 'Not Null' : 'Null Allowed';
        var ispk = (arrdata[k].pk) ? 'Primary key ' : '';
        if (ispk) {
            columnvalues = columnvalues + "NULL,"
        } else {
            columnvalues = columnvalues + "'',"
            updatecolumnsvalues = updatecolumnsvalues + arrdata[k].name + "='',";
            bulkinsertcolumnnames = bulkinsertcolumnnames + arrdata[k].name + ",";
        }
        formbody.innerHTML = formbody.innerHTML + modal_row(arrdata[k].name, arrdata[k].type + '  ' + nulldecide + '  ' + ispk);
    }
    columnnames = columnnames.substr(0, columnnames.length - 1);
    columnvalues = columnvalues.substr(0, columnvalues.length - 1);
    bulkinsertcolumnnames = bulkinsertcolumnnames.substr(0, bulkinsertcolumnnames.length - 1);
    updatecolumnsvalues = updatecolumnsvalues.substr(0, updatecolumnsvalues.length - 1);
    var querytext = "";
    if (queryprefix.toLowerCase().indexOf('select') == 0) {
        querytext = queryprefix + " " + columnnames + " FROM " + tablename + " WHERE 1=1";
        querycountertext = queryprefix + " COUNT(*) as cnt " + " FROM " + tablename;
    }
    if (queryprefix.toLowerCase().indexOf('insert') == 0) {
        querytext = queryprefix + " " + tablename + " (" + columnnames + ") values(" + columnvalues + ")";
        bulkinsertprefix = queryprefix + " " + tablename + " (" + bulkinsertcolumnnames + ")";
    }

    if (queryprefix.toLowerCase().indexOf('update') == 0) {
        querytext = queryprefix + " " + tablename + " SET " + updatecolumnsvalues + " WHERE rowid=1";
    }
    if (queryprefix.toLowerCase().indexOf('delete') == 0) {
        querytext = queryprefix + " FROM " + tablename + " WHERE rowid=1";
    }
    if (queryprefix.toLowerCase().indexOf('drop') == 0) {
        querytext = queryprefix + " " + tablename;
    }
    if (queryprefix.toLowerCase().indexOf('alter') == 0) {
        querytext = queryprefix + " TABLE " + tablename;
    }
    console.log(querytext);
    document.querySelector(updateholderid).style.background = 'white';
    document.querySelector(updateholderid).innerHTML = '';
    document.querySelector(textareaid).value = querytext;
    document.querySelector(textareaid).focus();
}

function populatedatatables(tablequery, tablename, counterquery, resultsquery) {
    console.log('Finding Columns For ' + tablename);
    var db = new databaseholder.Database(DATABASE_FILENAME);
    var bar = new Promise((resolve, reject) => {
        db.get(tablequery, function(err, row) {
            console.log('this ran');
            console.log(err);
            console.log(row);
            if (row) {
                addtableheads(Object.keys(row), tablename, true, counterquery, resultsquery);
                resolve();
            } else {
                addtableheads(null, tablename, false, null, null);
                updaterowcount(0);
                showalert("Looks like table is empty");
            }
        });
    });
    bar.then(() => {
        db.close();
    });
}

function addtableheads(arr, tablename, move, counterquery, resultsquery) {
    if (move) {
        table.destroy();
        var tableheader = document.querySelector(DATATABLE_ID + " > thead > tr");
        tableheader.innerHTML = "";
        var tablebody = document.querySelector(DATATABLE_ID + " > tbody");
        tablebody.innerHTML = "";
        for (let k in arr) {
            var head = document.createElement("th"); // Create a <button> element
            head.innerHTML = arr[k]; // Insert text
            tableheader.appendChild(head);
        }
        setupdbstuff(counterquery, resultsquery);
    } else {
        var tableheader = document.querySelector(DATATABLE_ID + " > thead > tr");
        tableheader.innerHTML = "";
        var tablebody = document.querySelector(DATATABLE_ID + " > tbody");
        tablebody.innerHTML = "";
    }
}

function setup_eventlisteners() {
    var ModalElBtn = document.querySelector('#loadtable_btn');
    ModalElBtn.addEventListener('click', function(event) {
        var tablename = document.querySelector('#selecttablenames').value;
        if (tablename != "0") {
            populatedatatables("SELECT * FROM " + tablename + " LIMIT 1", tablename, "SELECT count(*) as cnt FROM " + tablename + " order by rowid desc", "SELECT * FROM " + tablename + " order by rowid desc");
            updatetablename(tablename);
        } else {
            showalert('select a table');
        }
    });
    var dataformmodal = document.querySelector('#AddNewTableDataModal');
    dataformmodal.addEventListener('shown.bs.modal', function() {
        var formbody = document.querySelector("#inputformholder");
        formbody.innerHTML = "";
    })

    var ModalElBtn = document.querySelector('#inputformgenerator');
    ModalElBtn.addEventListener('click', function(event) {
        var tablename = document.querySelector('#selecttablenames').value;
        if (tablename != "0") {
            getColumnNames(tablename, "#inputformholder", "#inputaddquery", "#adddataupdateholder", "INSERT INTO");
        } else {
            showalert('select a table');
        }
    });

    var ModalQBtn = document.querySelector('#inputformgeneratorq');
    ModalQBtn.addEventListener('click', function(event) {
        var tablename = document.querySelector('#selecttablenames').value;
        if (tablename != "0") {
            getColumnNames(tablename, "#inputformholderq", "#inputrunquery", "#queryupdateholder", document.querySelector('#selectQueryType').value);
        } else {
            showalert('select a table');
        }
    });

    var ModalDeLBtn = document.querySelector('#deletedata_btn');
    var popover = new bootstrap.Popover(ModalDeLBtn, { sanitize: false, animation: true, html: true, placement: 'top', title: 'ARE YOU SURE?', template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body text-center"> </div></div>', content: '<button type="button" id="confirmdeletedata_btn" class="btn btn-danger">Yes?</button>' });
    ModalDeLBtn.addEventListener('click', function(event) {
        popover.show();
        var ConfirmModalDeLBtn = document.querySelector('#confirmdeletedata_btn');
        ConfirmModalDeLBtn.addEventListener('click', function(event) {
            var tablename = document.querySelector('#selecttablenames');
            if (tablename.value != "0") {
                executequery("DROP TABLE " + tablename.value, null);
                tablename.removeChild(tablename.children[tablename.selectedIndex]);
                popover.hide();
            } else {
                showalert('select a table');
            }
        });
    });
}

function fileuploadsetup() {
    const inputdElement = document.getElementById("fileimport");
    inputdElement.addEventListener("click", handletheFiles, false);

    function handletheFiles() {
        var tablename = document.querySelector('#selecttablenames').value;
        if (tablename.value == "0") {
            showalert('select a table');
            return;
        }
        if (bulkinsertprefix.toLowerCase().indexOf("insert into " + tablename.toLowerCase()) != 0) {
            showalert('Must generate query first');
            return;
        }
        const { ipcRenderer } = require('electron')

        ipcRenderer.invoke('openFile').then((result) => {
            if (!result.canceled) {
                try {
                    importedfilename = result.filePaths[0];
                    const promise = readFile(result.filePaths[0], "utf-8");
                    // Abort the request before the promise settles.
                    console.log(promise);
                    var tempval = "";
                    promise.then((val) => setupimporteddata(val));
                } catch (err) {
                    // When a request is aborted - err is an AbortError
                    console.error(err);
                }
            }
        })
    }
}

function sortvalues(arr, num) {
    if (arr.length < num) {
        return null;
    } else {
        for (k in arr) {
            arr[k] = "'" + arr[k] + "'";
        }
        return arr.slice(0, num).join(',');
    }

}

function setupimporteddata(tempval) {

    showalert('Your file will be imported into these columns -> [' + bulkinsertcolumnnames + ']. Make sure your data is in same order. ' + '<hr><button type="button" class="btn btn-outline-secondary btn-sm" id="btn_proceedimport">Proceed with Import</button><hr><progress id="csvfileprogress" max="100" value="0"></progress><hr>After finish, click on Load Data button on main screen.');
    var btn_proceedimport = document.querySelector('#btn_proceedimport');
    btn_proceedimport.addEventListener('click', function(event) {
        var tempdata = "";
        if (importedfilename.toLowerCase().includes(".csv")) {
            tempdata = tempval.split("\n");
            var tot = tempdata.length;
            var curr = 0;
            for (k in tempdata) {
                var row = tempdata[k].split(',');
                var tempjoins = (sortvalues(row, bulkinsertcolumnnames.split(',').length));
                if (tempjoins != null) {
                    var executablequery = bulkinsertprefix + " values(" + tempjoins + ")";
                    executequery(executablequery, null);
                    curr += 1;
                    document.querySelector('#csvfileprogress').value = (curr * 100 / tot);
                }
            }
        }
        if (importedfilename.toLowerCase().includes(".tsv")) {
            tempdata = tempval.split("\n");
            var tot = tempdata.length;
            var curr = 0;
            for (k in tempdata) {
                var row = tempdata[k].split('\t');
                var tempjoins = (sortvalues(row, bulkinsertcolumnnames.split(',').length));
                if (tempjoins != null) {
                    var executablequery = bulkinsertprefix + " values(" + tempjoins + ")";
                    executequery(executablequery, null);
                    curr += 1;
                    document.querySelector('#csvfileprogress').value = (curr * 100 / tot);
                }
            }
        }

    });

}

function showalert(message) {
    var myModal = new bootstrap.Modal(document.getElementById('alertmodal'), {
        keyboard: false
    });
    document.getElementById('alertmessage').innerHTML = message;
    myModal.show();
}
//setupdbstuff();
dbapp_populateinfo();
setup_eventlisteners();
addbuttonlistener("#createtablesave_btn", "#inputcreatequery", "#createtableupdateholder");
addbuttonlistener("#tabledatasave_btn", "#inputaddquery", "#adddataupdateholder");
addbuttonlistener("#querytabledatasave_btn", "#inputrunquery", "#queryupdateholder");
gettablenames();
fileuploadsetup();