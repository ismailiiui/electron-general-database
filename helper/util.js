function dbapp_populateinfo()
{
	document.querySelector("#computername").innerHTML = "Computer Name: " + process.env.COMPUTERNAME;
	document.querySelector("#cpuusage").innerHTML = "CPU Usage: " + (parseInt(process.cpuUsage().user) + parseInt(process.cpuUsage().system)).toString();
}

function modal_row(name,type)
{
	return rowhtml = '<h5>' + name + '</h5><small>Type: ' + type + '<small><hr>';
	
}

